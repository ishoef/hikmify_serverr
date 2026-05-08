import { Request, Response } from "express";
import { categoryService } from "./category.service";

// POST Category
const createCategory = async (req: Request, res: Response) => {
  try {
    const result = await categoryService.createCategory(req.body);

    res.status(201).json(result);
  } catch (error: any) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET all category
const getAllCategory = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    console.log("From categoryController:", user);
    const result = await categoryService.getAllCategory();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to Get all categories",
    });
  }
};

// UPDATE category data
const updateCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    console.log(categoryId);
    console.log(req.body);

    const result = await categoryService.updateCategory(
      categoryId as string,
      req.body,
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE category by id
const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    const result = await categoryService.deleteCategory(categoryId as string);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const categoryController = {
  createCategory,
  getAllCategory,
  updateCategory,
  deleteCategory,
};
