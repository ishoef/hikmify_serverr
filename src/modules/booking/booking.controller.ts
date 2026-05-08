import { Request, Response } from "express";
import { bookingService } from "./booking.service";

const createBooking = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return {
        success: false,
        message: "You are not registered. Please create an account.",
      };
    }

    const result = await bookingService.createBooking(req.body, user);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET bookings
const getBookings = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return {
        success: false,
        message: "You are not registered. Please create an account.",
      };
    }

    const result = await bookingService.getBookings(user);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET booking by id
const getbookingById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { bookingId } = req.params;
    if (!user) {
      return {
        success: false,
        message: "You are not registered. Please create an account.",
      };
    }

    const result = await bookingService.getbookingById(
      bookingId as string,
      user,
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update booking by owner or admin
const updateBooking = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { bookingId } = req.params;
    if (!user) {
      return {
        success: false,
        message: "You are not registered. Please create an account.",
      };
    }

    const result = await bookingService.updateBooking(
      req.body,
      bookingId as string,
      user,
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Booking deletion
const deleteBookingById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { bookingId } = req.params;
    if (!user) {
      return {
        success: false,
        message: "You are not registered. Please create an account.",
      };
    }

    const result = await bookingService.deleteBookingById(
      bookingId as string,
      user,
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const bookingController = {
  createBooking,
  getBookings,
  getbookingById,
  deleteBookingById,
  updateBooking,
};
