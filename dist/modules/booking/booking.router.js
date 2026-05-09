import { Router } from "express";
import { bookingController } from "./booking.controller.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { UserRole } from "../../utils/enums.js";
const router = Router();
// Create Booking
router.post("/", authMiddleware(UserRole.USER), bookingController.createBooking);
// get all booking
router.get("/", authMiddleware(), bookingController.getBookings);
// get single booking by id
router.get("/:bookingId", authMiddleware(UserRole.USER, UserRole.ADMIN), bookingController.getbookingById);
// update booking data
router.patch("/:bookingId", authMiddleware(UserRole.ADMIN, UserRole.USER), bookingController.updateBooking);
// delete booking by id
router.delete("/:bookingId", authMiddleware(UserRole.ADMIN, UserRole.USER), bookingController.deleteBookingById);
export const bookingRouter = router;
//# sourceMappingURL=booking.router.js.map