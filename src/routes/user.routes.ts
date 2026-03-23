import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { getProfile, updateAvailability } from "../controllers/user.controller";
import { validateBody } from "../middleware/validate.middleware";
import { availabilitySchema } from "../validators";

const router = Router();
router.use(requireAuth);

router.get("/me", getProfile);
router.put("/availability", validateBody(availabilitySchema), updateAvailability);

export default router;
