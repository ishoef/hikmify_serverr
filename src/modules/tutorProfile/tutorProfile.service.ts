import { prisma } from "../../lib/prisma.js";
import { TutorProfile, User } from "../../types/types.js";
import { UserRole } from "../../utils/enums.js";
import isEqual from "lodash/isEqual.js";

// CREATE Tutor Profile
const createTutorProfile = async (data: TutorProfile, user: User) => {
  // const userId = user.id;

  const existsCategory = await prisma.category.findUnique({
    where: {
      name: data.categoryName,
    },
  });

  if (!existsCategory) {
    return {
      success: false,
      message: "Category is missing",
    };
  }

  // Duplicate TutorPrifle Check
  const existTutorProfile = await prisma.tutor.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (existTutorProfile) {
    return {
      success: false,
      message: "You have already created a tutor profile",
    };
  }

  const createdTutorProfile = await prisma.$transaction(async (tx) => {
    const result = await tx.tutor.create({
      data: {
        ...data,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
            image: true,
            phone: true,
          },
        },
      },
    });

    if (user.role === UserRole.USER) {
      await tx.user.update({
        where: { id: user.id },
        data: { role: UserRole.TUTOR },
      });
    }

    return result;
  });

  // const createdTutorProfile = await prisma.tutor.findUnique({
  //   where: {
  //     id: finalResult.id,
  //   },
  //   include: {
  //     user: {
  //       select: {
  //         name: true,
  //         email: true,
  //         role: true,
  //         image: true,
  //         phone: true,
  //       },
  //     },
  //   },
  // });

  // console.log("final prifle check", finalProfile);

  return {
    success: true,
    data: createdTutorProfile,
  };
};

// GET All Tutor Profiles for admin
const getAllTutorProfiles = async () => {
  const data = await prisma.tutor.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
          phone: true,
          image: true,
        },
      },
    },
  });
  const totalUser = await prisma.user.count();
  const tutorProfiles = await prisma.tutor.count();

  return {
    success: true,
    totalUser,
    tutorProfiles,
    data,
  };
};

// GET own tutor profile
const getOwnTutorProfile = async (userId: string) => {
  const tutorProfile = await prisma.tutor.findUnique({
    where: {
      userId,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          role: true,
          image: true,
        },
      },
    },
  });

  if (!tutorProfile) {
    return {
      success: false,
      message: "No tutor profile found",
    };
  }

  return {
    success: true,
    data: tutorProfile,
  };
};

// get single profile by id
const getSingleTutorProfile = async (profileId: string) => {
  const result = await prisma.$transaction(async (tx) => {
    await tx.tutor.update({
      where: {
        id: profileId,
      },
      data: {
        profileViews: {
          increment: 1,
        },
      },
    });

    const profileData = await tx.tutor.findUnique({
      where: {
        id: profileId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
    });

    return profileData;
  });

  return {
    success: true,
    message: "Profile data fetched successfully",
    data: result,
  };
};

// UPDATE profile
const updateTutorProfile = async (
  profileId: string,
  data: Partial<TutorProfile>,
  user: User,
) => {
  try {
    // 1. Get old data
    const oldProfileData = await prisma.tutor.findUnique({
      where: { id: profileId },
    });

    if (!oldProfileData) {
      return {
        success: false,
        message: "No profile found",
      };
    }

    // 2. Authorization check
    if (oldProfileData.userId !== user?.id && user?.role !== UserRole.ADMIN) {
      return {
        success: false,
        message: "You are not allowed to update this profile.",
      };
    }

    // 3. Filter ONLY real changes (remove undefined + same values)
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => {
        const field = key as keyof TutorProfile;

        return value !== undefined && !isEqual(oldProfileData[field], value);
      }),
    );

    // 4. Empty check after filtering
    if (Object.keys(filteredData).length === 0) {
      return {
        success: true,
        message: "No changes detected",
        data: oldProfileData,
      };
    }

    // 5. Track changes (old vs new)
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    Object.keys(filteredData).forEach((key) => {
      const field = key as keyof TutorProfile;

      changes[field] = {
        old: oldProfileData[field],
        new: filteredData[field],
      };
    });

    // 6. Update DB
    const updatedProfile = await prisma.tutor.update({
      where: { id: profileId },
      data: filteredData,
    });

    // 7. Return response
    return {
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile,
      changes,
    };
  } catch (error) {
    return {
      success: false,
      message: "Profile update failed",
    };
  }
};

// DELETE profile
const deleteTutorProfile = async (user: User, profileId: string) => {
  const userId = user.id;

  const existProfile = await prisma.tutor.findUnique({
    where: {
      id: profileId,
    },
  });

  if (!existProfile) {
    return {
      success: false,
      message: "No tutor profile found",
    };
  }

  if (existProfile.userId !== userId && user.role !== UserRole.ADMIN) {
    return {
      success: false,
      message: "You are not authorized to delete this profile",
    };
  }

  const deleteResult = await prisma.tutor.delete({
    where: {
      id: profileId,
    },
  });

  const targetUserId = existProfile.userId;

  if (deleteResult) {
    await prisma.user.update({
      where: {
        id: targetUserId,
      },
      data: {
        role: UserRole.USER,
      },
    });
  }

  return {
    success: true,
    message:
      user.role !== UserRole.ADMIN
        ? "Your profile has been deleted successfully."
        : "Tutor profile deleted successfully.",
    data: deleteResult,
  };
};

export const tutorProfileService = {
  createTutorProfile,
  getAllTutorProfiles,
  getOwnTutorProfile,
  deleteTutorProfile,
  updateTutorProfile,
  getSingleTutorProfile,
};
