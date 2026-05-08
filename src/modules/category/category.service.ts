import { prisma } from "../../lib/prisma";

export interface CategoryData {
  name: string;
  description?: string;
  tags: string[];
  icon?: string;
  isActive?: boolean;
}

const createCategory = async (data: CategoryData) => {
  const normalizedName = data.name.trim().toLowerCase();

  // optional pre-check (UX improvement only)
  const exists = await prisma.category.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
    },
  });

  if (exists) {
    throw new Error(`'${data.name}' category already exists`);
  }

  // Creating the category
  const result = await prisma.category.create({
    data: {
      ...data,
      name: normalizedName,
      isActive: data.isActive ?? true,
    },
  });

  return result;
};

// ALL category
const getAllCategory = async () => {
  // GET all categories
  const result = await prisma.category.findMany();

  // Total Data Count
  const totalData = await prisma.category.count();

  return {
    success: true,
    totalData: totalData,
    data: result,
    message:
      result.length === 0
        ? "No categories found"
        : "Categories fetched successfully",
  };
};

// update category
const updateCategory = async (
  categoryId: string,
  data: { name?: string; description?: string; icon?: string },
) => {
  const existsCategory = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!existsCategory) {
    throw new Error("Ai category nai");
  }

  const result = await prisma.category.update({
    where: {
      id: categoryId,
    },
    data,
  });

  console.log("After Update category: ", result);

  return {
    success: true,
    data: result,
  };
};

// DELETE Category
const deleteCategory = async (categoryId: string) => {
  const result = await prisma.category.delete({
    where: {
      id: categoryId,
    },
  });

  return {
    success: true,
    data: result,
    message: "this category deleted successfully",
  };
};

export const categoryService = {
  createCategory,
  getAllCategory,
  updateCategory,
  deleteCategory,
};
