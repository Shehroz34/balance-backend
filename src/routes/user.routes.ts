import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { getProfile, updateAvailability } from "../controllers/user.controller";

const router = Router();

router.get("/me", requireAuth, getProfile);
router.put("/availability", requireAuth, updateAvailability);

export default router;
