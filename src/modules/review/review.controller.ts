import { Request, Response } from "express";
import { reviewService } from "./review.service";

const createReview = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return {
        success: false,
        message: "You are not a user, please create an account",
      };
    }

    const result = await reviewService.createReview(req.body, user);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GEt all reivews
const allReviews = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return {
        success: false,
        message: "You are not a user, please create an account",
      };
    }
    const result = await reviewService.allReviews(user);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// get my-reviews
const getMyReviews = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return {
        success: false,
        message: "You are not a user, please create an account",
      };
    }
    const result = await reviewService.getMyReviews(userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update review
const updateReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const user = req.user;
    if (!user) {
      return {
        success: false,
        message: "You are not a user, please create an account",
      };
    }
    const result = await reviewService.updateReview(
      reviewId as string,
      user,
      req.body,
    );
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      error: error.error,
    });
  }
};

// delete reivew
const deleteReview = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { reviewId } = req.params;

    if (!user) {
      return {
        success: false,
        message: "You are not a user, please create an account",
      };
    }
    const result = await reviewService.deleteReview(reviewId as string, user);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const reviewController = {
  createReview,
  allReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
