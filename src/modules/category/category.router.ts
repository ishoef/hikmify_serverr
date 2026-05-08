import { Router } from "express";
import { categoryController } from "./category.controller";
import authMiddleware from "../../middleware/authMiddleware";
import { UserRole } from "../../utils/enums";

const router = Router();

router.post(
  "/",
  authMiddleware(UserRole.ADMIN, UserRole.USER),
  categoryController.createCategory,
);

router.get(
  "/categories",
  authMiddleware(UserRole.TUTOR, UserRole.ADMIN),
  categoryController.getAllCategory,
);

router.patch("/:categoryId", categoryController.updateCategory);
router.delete("/:categoryId", categoryController.deleteCategory);

export const categoryRouter: Router = router;
