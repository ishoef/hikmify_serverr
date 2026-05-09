import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { reviewController } from "./review.controller.js";
import { UserRole } from "../../utils/enums.js";
const router = Router();
router.post("/", authMiddleware(), reviewController.createReview);
router.get("/", authMiddleware(UserRole.ADMIN, UserRole.USER), reviewController.allReviews);
router.get("/my-reviews", authMiddleware(UserRole.USER), reviewController.getMyReviews);
router.patch("/:reviewId", authMiddleware(UserRole.ALL), reviewController.updateReview);
router.delete("/:reviewId", authMiddleware(), reviewController.deleteReview);
export const reviewRouter = router;
//# sourceMappingURL=review.router.js.map