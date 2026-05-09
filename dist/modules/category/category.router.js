import { Router } from "express";
import { categoryController } from "./category.controller.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { UserRole } from "../../utils/enums.js";
const router = Router();
router.post("/", authMiddleware(UserRole.ADMIN, UserRole.USER), categoryController.createCategory);
router.get("/categories", authMiddleware(UserRole.TUTOR, UserRole.ADMIN), categoryController.getAllCategory);
router.patch("/:categoryId", categoryController.updateCategory);
router.delete("/:categoryId", categoryController.deleteCategory);
export const categoryRouter = router;
//# sourceMappingURL=category.router.js.map