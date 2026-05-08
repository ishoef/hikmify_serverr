import isEqual from "lodash.isequal";
import { prisma } from "../../lib/prisma";
import { BookingData, User } from "../../types/types";
import { UserRole } from "../../utils/enums";
import { parseTime } from "../../utils/parseTime";

// CREATE booking (only user can create a booking)
const createBooking = async (data: BookingData, user: User) => {
  const studentId = user?.id;
  // console.log("bookingService: ", data);
  // 1. Role Checking (User as stuend allowed | Totor Not Allowed)
  if (user.role === UserRole.TUTOR) {
    return {
      success: false,
      message: "You are not allowed to book this session.",
    };
  }

  // 2. tutor find
  const tutor = await prisma.tutor.findUnique({
    where: {
      id: data.tutorId,
    },
    include: {
      user: { select: { name: true } },
    },
  });

  const tutorName = tutor?.user.name;

  if (!tutor) {
    return {
      success: false,
      message: "Tutor not found",
    };
  }

  // 4. calculate hourlyPrice and total price based on duration
  const hourlyPrice = tutor?.hourlyRate as number;
  const totalPrice = hourlyPrice * data.duration;

  // bookingData format
  const bookingDate = new Date(data.bookingDate);

  // booking date validation check
  if (isNaN(bookingDate.getTime())) {
    return {
      success: false,
      message: "Invalid booking date",
    };
  }

  // merge date and time
  // const { hours, minutes } = parseTime(data.startTime.toString());

  let hours: number = 0;
  let minutes: number = 0;

  if (data.startTime) {
    const parsed = parseTime(data.startTime.toString());
    hours = parsed.hours ?? 0;
    minutes = parsed.minutes ?? 0;
  }

  const finalStartTime = new Date(
    Date.UTC(
      bookingDate.getUTCFullYear(),
      bookingDate.getUTCMonth(),
      bookingDate.getUTCDate(),
      hours,
      minutes,
      0,
      0,
    ),
  );

  // bookingDate convert to Day
  const bookingDay = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  })
    .format(bookingDate)
    .toLowerCase();

  // tutor availability check on the bookingDay
  if (!tutor?.availability.includes(bookingDay)) {
    return {
      success: false,
      message: `Tutor is not available on ${bookingDay} `,
    };
  }

  // Get the endTime
  const endTime = new Date(finalStartTime);
  endTime.setHours(endTime.getHours() + data.duration);

  // conflickt check
  const existingBookings = await prisma.bookings.findMany({
    where: {
      tutorId: data.tutorId,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
    },
  });

  const isConflict = existingBookings.some((booking) => {
    const existingStart = new Date(booking.startTime);
    const existingEnd = new Date(existingStart);
    existingEnd.setHours(existingEnd.getHours() + booking.duration);

    return finalStartTime < existingEnd && endTime > existingStart;
  });

  if (isConflict) {
    return {
      success: false,
      message: "This time slot is already booked",
    };
  }

  // Create booking
  const result = await prisma.bookings.create({
    data: {
      ...data,
      studentId,
      hourlyPrice,
      totalPrice,
      bookingDate: bookingDate,
      startTime: finalStartTime,
    },
  });

  return {
    success: true,
    data: result,
    message: `Your booking was created on ${result.bookingDate} with tutor ${tutorName}.`,
  };
};

// GET all bookings
const getBookings = async (user: User) => {
  let bookings;
  let totalBooking = 0;

  const tutor = await prisma.tutor.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  if (user.role === UserRole.ADMIN) {
    bookings = await prisma.bookings.findMany({
      include: {
        tutor: {
          select: {
            hourlyRate: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        student: {
          select: {
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    totalBooking = await prisma.bookings.count();
  } else if (user.role === UserRole.TUTOR) {
    if (!tutor?.id) {
      return {
        success: false,
        message: "Tutor not found",
      };
    }
    bookings = await prisma.bookings.findMany({
      where: {
        tutorId: tutor.id,
      },
    });

    totalBooking = await prisma.bookings.count({
      where: {
        tutorId: tutor.id,
      },
    });
  } else {
    bookings = await prisma.bookings.findMany({
      where: {
        studentId: user?.id,
      },
      include: {
        tutor: {
          select: {
            user: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        },
        student: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    totalBooking = await prisma.bookings.count({
      where: {
        studentId: user?.id,
      },
    });
  }

  return {
    success: true,
    totalBooking,
    message:
      totalBooking === 0
        ? "No bookings found"
        : "Bookings fetched successfully",
    data: bookings,
  };
};

// GET booking by id
const getbookingById = async (bookingId: string, user: User) => {
  const result = await prisma.bookings.findUnique({
    where: {
      id: bookingId,
    },
  });

  if (!result) {
    return {
      success: false,
      message: "Booking not found",
    };
  }

  if (user.id !== result?.studentId && user.role !== UserRole.ADMIN) {
    return {
      success: false,
      message: "You are not authorized to view this booking",
    };
  }

  return {
    success: true,
    message:
      user.role === UserRole.ADMIN
        ? "Booking fetched successfylly as a admin "
        : "Booking fetched successfylly",
    data: result,
  };
};

// UPDATE booking data (only booking owner)
const updateBooking = async (
  data: BookingData,
  bookingId: string,
  user: User,
) => {
  try {
    // ==============================
    // 1. Fetch existing booking
    // ==============================
    const existingBooking = await prisma.bookings.findUnique({
      where: { id: bookingId },
      include: { tutor: true },
    });

    if (!existingBooking) {
      return {
        success: false,
        message: "Booking not found",
      };
    }

    // ==============================
    // 2. Authorization check
    // Only owner or admin can update
    // ==============================
    if (existingBooking.studentId !== user.id && user.role !== UserRole.ADMIN) {
      return {
        success: false,
        message: "You are not authorized to update this booking",
      };
    }

    // ==============================
    // 3. Define allowed fields based on role
    // ==============================
    const USER_ALLOWED_FIELDS: (keyof BookingData)[] = [
      "bookingDate",
      "startTime",
      "duration",
      "notes",
    ];

    const ADMIN_ALLOWED_FIELDS: (keyof BookingData)[] = [
      "bookingDate",
      "startTime",
      "duration",
      "notes",
      "status",
      "totalPrice",
      "hourlyPrice",
    ];

    const allowedFields =
      user.role === UserRole.ADMIN ? ADMIN_ALLOWED_FIELDS : USER_ALLOWED_FIELDS;

    // ==============================
    // 4. Filter only valid + changed fields
    // - remove undefined/null
    // - remove unchanged values
    // - remove unauthorized fields
    // ==============================
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => {
        const field = key as keyof BookingData;

        // block unauthorized fields
        if (!allowedFields.includes(field)) return false;

        // remove invalid values
        if (value === undefined || value === null) return false;

        // remove unchanged values
        return !isEqual(existingBooking[field], value);
      }),
    ) as Partial<BookingData>;

    // if nothing changed
    if (Object.keys(filteredData).length === 0) {
      return {
        success: true,
        message: "No changes detected",
      };
    }

    // ==============================
    // 5. Pricing calculation
    // ==============================
    const hourlyPrice = existingBooking.tutor?.hourlyRate as number;
    const duration = filteredData.duration ?? existingBooking.duration;

    const totalPrice = hourlyPrice * duration;

    if (user.role !== UserRole.ADMIN) {
      filteredData.hourlyPrice = hourlyPrice;
      filteredData.totalPrice = totalPrice;
    }

    filteredData.duration = duration;

    // ==============================
    // 6. Normalize booking date
    // ==============================
    const bookingDate = filteredData.bookingDate
      ? new Date(filteredData.bookingDate)
      : new Date(existingBooking.bookingDate);

    if (isNaN(bookingDate.getTime())) {
      return {
        success: false,
        message: "Invalid booking date",
      };
    }

    // store normalized date only if updated
    if (filteredData.bookingDate) {
      filteredData.bookingDate = bookingDate;
    }

    // ==============================
    // 7. Normalize start time
    // ==============================
    let hours: number;
    let minutes: number;

    if (filteredData.startTime) {
      // if new time provided
      const parsed = parseTime(filteredData.startTime.toString());
      hours = parsed.hours ?? 0;
      minutes = parsed.minutes ?? 0;
    } else {
      // fallback to existing booking time
      const existingStart = new Date(existingBooking.startTime);
      hours = existingStart.getHours();
      minutes = existingStart.getMinutes();
    }

    // combine date + time using UTC to avoid timezone shift
    const finalStartTime = new Date(
      Date.UTC(
        bookingDate.getUTCFullYear(),
        bookingDate.getUTCMonth(),
        bookingDate.getUTCDate(),
        hours,
        minutes,
        0,
        0,
      ),
    );

    // store startTime only if updated
    if (filteredData.startTime) {
      filteredData.startTime = finalStartTime;
    }

    // ==============================
    // 8. Validate future booking time
    // ==============================
    const now = new Date();
    const minimumAllowedTime = new Date(now.getTime() + 10 * 60 * 1000);

    if (finalStartTime < minimumAllowedTime) {
      return {
        success: false,
        message: "You must select a future time slot",
      };
    }

    // ==============================
    // 9. Check tutor availability
    // ==============================
    const bookingDay = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "UTC",
    })
      .format(bookingDate)
      .toLowerCase();

    if (!existingBooking.tutor?.availability?.includes(bookingDay)) {
      return {
        success: false,
        message: `Tutor is not available on ${bookingDay}`,
      };
    }

    // ==============================
    // 10. Calculate end time
    // ==============================
    const endTime = new Date(finalStartTime);
    endTime.setHours(endTime.getHours() + duration);

    // ==============================
    // 11. Check booking conflicts
    // ==============================
    const allExistingBookings = await prisma.bookings.findMany({
      where: {
        tutorId: existingBooking.tutorId,
        id: { not: bookingId },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
    });

    const isConflict = allExistingBookings.some((booking) => {
      const existingStart = new Date(booking.startTime);
      const existingEnd = new Date(existingStart);

      existingEnd.setHours(existingEnd.getHours() + booking.duration);

      return finalStartTime < existingEnd && endTime > existingStart;
    });

    if (isConflict) {
      return {
        success: false,
        message:
          "This time slot is already booked. Please choose another slot.",
      };
    }

    // ==============================
    // 12. Track changed fields
    // ==============================
    const changedData = Object.fromEntries(
      Object.entries(filteredData).filter(([key, value]) => {
        const field = key as keyof BookingData;

        return value !== undefined && !isEqual(existingBooking[field], value);
      }),
    );

    const changes: Record<string, { old: unknown; new: unknown }> = {};

    Object.keys(changedData).forEach((key) => {
      const field = key as keyof BookingData;

      changes[field] = {
        old: existingBooking[field],
        new: changedData[field],
      };
    });

    // ==============================
    // 13. Update booking in database
    // ==============================
    const updatedBooking = await prisma.bookings.update({
      where: { id: bookingId },
      data: filteredData,
      include: {
        student: true,
      },
    });

    return {
      success: true,
      message:
        user.role !== UserRole.ADMIN
          ? "Your booking updated successfully"
          : "User booking updated successfully",
      changes,
      data: updatedBooking,
    };
  } catch (error: any) {
    console.error("Update Booking Error:", error);

    return {
      success: false,
      message: "Booking update failed",
      error: error.message,
    };
  }
};

// Delete Booking by id
const deleteBookingById = async (bookingId: string, user: User) => {
  try {
    const existingBooking = await prisma.bookings.findUnique({
      where: { id: bookingId },
    });

    if (!existingBooking) {
      return {
        success: false,
        message: "No booking found",
      };
    }

    if (existingBooking.studentId !== user.id && user.role !== UserRole.ADMIN) {
      return {
        success: false,
        message: "You are not authorized to delete this booking",
      };
    }

    const result = await prisma.bookings.delete({
      where: {
        id: bookingId,
      },
    });

    return {
      success: true,
      message:
        user.role !== UserRole.ADMIN
          ? "Your Booking has been deleted successfully."
          : "User Booking deleted successfully.",
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Booking deletion failed",
    };
  }
};

export const bookingService = {
  createBooking,
  getBookings,
  getbookingById,
  deleteBookingById,
  updateBooking,
};
