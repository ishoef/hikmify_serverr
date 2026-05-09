import { Router } from "express";
import { tutorProfileController } from "./tutorProfile.controller.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { UserRole } from "../../utils/enums.js";

const router = Router();

router.post(
  "/",
  authMiddleware(UserRole.USER, UserRole.TUTOR),
  tutorProfileController.createTutorProfile,
);
router.get("/", tutorProfileController.getAllTutorProfiles);

// GET own profile
router.get(
  "/own-profile",
  authMiddleware(UserRole.ALL),
  tutorProfileController.getOwnTutorProfile,
);

router.get(
  "/:profileId",
  authMiddleware(UserRole.ALL),
  tutorProfileController.getSingleTutorProfile,
);

router.patch(
  "/:profileId",
  authMiddleware(UserRole.ADMIN, UserRole.TUTOR),
  tutorProfileController.updateTutorProfile,
);

// DELETE Profile by user or admin
router.delete(
  "/:profileId",
  authMiddleware(UserRole.ADMIN, UserRole.TUTOR),
  tutorProfileController.deleteTutorProfile,
);

export const tutorProfileRouter: Router = router;
