import isEqual from "lodash.isequal";
import { prisma } from "../../lib/prisma.js";
import { UserRole } from "../../utils/enums.js";
import { BookingStatus } from "../../generated/client.js";
// CREATE review
const createReview = async (data, user) => {
    try {
        const studentId = user.id;
        const { bookingId, tutorId, rating } = data;
        // 1. Validate rating range (must be between 1 and 5)
        if (rating < 1 || rating > 5) {
            return {
                success: false,
                message: "Rating must be between 1 and 5",
            };
        }
        // 2. Check if booking exists
        const booking = await prisma.bookings.findUnique({
            where: { id: bookingId },
        });
        if (!booking) {
            return {
                success: false,
                message: "Booking not Found",
            };
        }
        // 3. Ensure the logged-in user owns this booking
        if (booking.studentId !== studentId) {
            return {
                success: false,
                message: "You can only review your own booking",
            };
        }
        // 4. Allow review only if booking is completed
        if (booking.status !== BookingStatus.COMPLETED) {
            return {
                success: false,
                message: "Only completed bookings can be reviewed",
            };
        }
        // 5. Prevent duplicate review for the same booking
        const existingReview = await prisma.review.findFirst({
            where: { bookingId },
        });
        if (existingReview) {
            return {
                success: false,
                message: "You already reviewed this booking",
            };
        }
        // 6. Check if tutor exists
        const tutor = await prisma.tutor.findUnique({ where: { id: tutorId } });
        if (!tutor) {
            return {
                success: false,
                message: "Tutor not Found",
            };
        }
        // 7. Run transaction to keep data consistent
        const finalResult = await prisma.$transaction(async (tx) => {
            // Fetch current tutor rating data
            const tutorData = await tx.tutor.findUnique({
                where: { id: tutorId },
                select: {
                    averageRating: true,
                    totalreviews: true,
                },
            });
            const oldAverage = tutorData?.averageRating || 0;
            const totalReview = tutorData?.totalreviews || 0;
            // 8. Calculate new average rating
            const newAverage = (oldAverage * totalReview + data.rating) / (totalReview + 1); // raw average
            // Round to 1 decimal place (e.g., 4.666 → 4.6)
            const roundedAverage = Number(newAverage.toFixed(1));
            // 9. Update tutor review stats
            await tx.tutor.update({
                where: { id: tutorId },
                data: {
                    totalreviews: { increment: 1 },
                    averageRating: roundedAverage,
                },
            });
            // 10. Create review record
            const reviewDone = await tx.review.create({
                data: {
                    ...data,
                    studentId, // attach logged-in student
                },
                include: {
                    tutor: true, // return tutor info with review
                },
            });
            return reviewDone;
        });
        // 11. Success response
        return {
            success: true,
            message: "Your review created successfully",
            data: finalResult,
        };
    }
    catch (error) {
        // 12. Error handling
        return {
            success: false,
            message: "Review create failed",
        };
    }
};
// GEt All Reviews for admin
const allReviews = async (user) => {
    if (user.role !== UserRole.ADMIN) {
        return {
            success: false,
            message: "You are not authorized to access this resource",
        };
    }
    const [reviews, totalReview, totalUser, totalTutor, totalBooking] = await Promise.all([
        prisma.review.findMany(),
        prisma.review.count(),
        prisma.user.count(),
        prisma.tutor.count(),
        prisma.bookings.count(),
    ]);
    return {
        success: true,
        message: reviews.length === 0
            ? "No review found"
            : "All review fetched successfully",
        data: { totalReview, totalUser, totalTutor, totalBooking, reviews },
    };
};
// Get my-reivews
const getMyReviews = async (userId) => {
    try {
        const [reviews, totalBooking, totalReview] = await Promise.all([
            prisma.review.findMany({
                where: { studentId: userId },
                include: { tutor: true, booking: true },
            }),
            prisma.bookings.count({
                where: { studentId: userId },
            }),
            prisma.review.count({
                where: { studentId: userId },
            }),
        ]);
        return {
            success: true,
            message: totalReview === 0
                ? "You don't have any review"
                : "All review fetched successfully",
            data: { totalBooking, totalReview, reviews },
        };
    }
    catch (error) {
        console.error("Get My reviews Errro:", error);
        return {
            success: false,
            message: "Reviews fetched failed",
        };
    }
};
// update reviews
const updateReview = async (reviewId, user, data) => {
    try {
        // Validate rating range (must be between 1 and 5)
        const rating = data.rating;
        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return {
                success: false,
                message: "Rating must be between 1 and 5",
            };
        }
        // get old review data
        const existingReview = await prisma.review.findUnique({
            where: {
                id: reviewId,
            },
        });
        // existing check
        if (!existingReview) {
            return {
                success: false,
                message: "The review not found",
            };
        }
        // authentication check
        if (user.id !== existingReview.studentId && user.role !== UserRole.ADMIN) {
            return {
                success: false,
                message: "You are not authorized to update this review",
            };
        }
        // filter ONLY real changes
        const filteredData = Object.fromEntries(Object.entries(data).filter(([key, value]) => {
            const field = key;
            return value !== undefined && !isEqual(existingReview[field], value);
        }));
        // Empty check after filtering
        if (Object.keys(filteredData).length === 0) {
            return {
                success: true,
                message: "No changes detected",
                data: existingReview,
            };
        }
        // Track changes (old vs new)
        const changes = {};
        Object.keys(filteredData).forEach((key) => {
            const field = key;
            changes[field] = {
                old: existingReview[field],
                new: filteredData[field],
            };
        });
        // finally update review and update tutor profile data
        const finalResult = await prisma.$transaction(async (tx) => {
            const tutor = await tx.tutor.findUnique({
                where: { id: existingReview.tutorId },
                select: {
                    averageRating: true,
                    totalreviews: true,
                },
            });
            if (!tutor) {
                throw new Error("Tutor not found");
            }
            if (rating !== undefined && rating !== existingReview.rating) {
                const oldAverage = tutor?.averageRating || 0;
                const totalreviews = tutor?.totalreviews || 0;
                const oldRating = existingReview.rating;
                const newRating = data.rating;
                let newAverage = 0;
                if (totalreviews === 0) {
                    newAverage = newRating;
                }
                else {
                    newAverage =
                        (oldAverage * totalreviews - oldRating + newRating) / totalreviews;
                }
                const roundedAverage = Number(newAverage.toFixed(1));
                await tx.tutor.update({
                    where: { id: existingReview.tutorId },
                    data: {
                        averageRating: roundedAverage,
                    },
                });
            }
            const updatedReview = await tx.review.update({
                where: {
                    id: reviewId,
                },
                data: filteredData,
                include: {
                    tutor: true,
                },
            });
            return updatedReview;
        });
        return {
            success: true,
            message: "Your review updated successfully!",
            changes,
            data: finalResult,
        };
    }
    catch (error) {
        return {
            success: false,
            message: "Review update failed",
            error: error.message,
        };
    }
};
// Delete review
const deleteReview = async (reviewId, user) => {
    try {
        // delete review and update tutor data
        const result = await prisma.$transaction(async (tx) => {
            const existingReview = await tx.review.findUnique({
                where: {
                    id: reviewId,
                },
                include: {
                    tutor: {
                        select: {
                            id: true,
                            totalreviews: true,
                            averageRating: true,
                        },
                    },
                },
            });
            if (!existingReview) {
                throw new Error("Review not found");
            }
            if (existingReview.studentId !== user.id &&
                user.role !== UserRole.ADMIN) {
                throw new Error("Not authorized");
            }
            const oldAverage = existingReview?.tutor.averageRating || 0;
            const totalReview = existingReview.tutor.totalreviews || 0;
            let newAverage = 0;
            // ✅ handle edge case (last review delete)
            if (totalReview <= 1) {
                newAverage = 0;
            }
            else {
                newAverage =
                    (oldAverage * totalReview - existingReview.rating) /
                        (totalReview - 1);
            }
            const roundedAverage = Number(newAverage.toFixed(1));
            await tx.tutor.update({
                where: { id: existingReview.tutorId },
                data: {
                    totalreviews: { decrement: 1 },
                    averageRating: roundedAverage,
                },
            });
            const deletedReview = await tx.review.delete({
                where: {
                    id: reviewId,
                },
            });
            return deletedReview;
        });
        return {
            success: true,
            message: "Your review deleted successfully",
            data: result,
        };
    }
    catch (error) {
        return {
            success: false,
            message: "Sorry! Review deletaion failed! ",
        };
    }
};
export const reviewService = {
    createReview,
    allReviews,
    getMyReviews,
    deleteReview,
    updateReview,
};
//# sourceMappingURL=review.service.js.map