import { Router } from "express";

import {
  getTodayWellbeing,
  saveTodayWellbeing,
} from "../controllers/wellbeing.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { wellbeingSchema } from "../validators";

const router = Router();

router.use(requireAuth);

router.post("/", validateBody(wellbeingSchema), saveTodayWellbeing);
router.get("/today", getTodayWellbeing);

export default router;
