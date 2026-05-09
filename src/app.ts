import express, { Application } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { categoryRouter } from "./modules/category/category.router.js";
import { auth } from "./lib/auth.js";
import { tutorProfileRouter } from "./modules/tutorProfile/tutorProfile.router.js";
import { bookingRouter } from "./modules/booking/booking.router.js";
import { reviewRouter } from "./modules/review/review.router.js";

const app: Application = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(","),
    credentials: true,
  }),
);

// Json Middleware
app.use(express.json());

// Auth Route
app.all("/api/auth/*", toNodeHandler(auth));

app.get("/", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "The server of Hikmify is running",
  });
});

// All Routes
app.use("/category", categoryRouter);
app.use("/tutors", tutorProfileRouter);
app.use("/bookings", bookingRouter);
app.use("/reviews", reviewRouter);

export default app;
