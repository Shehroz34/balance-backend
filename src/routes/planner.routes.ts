import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware";
import { getPlannerSchedule } from "../controllers/planner.controller";

const router = Router();

router.use(requireAuth);

router.get("/schedule", getPlannerSchedule);

export default router;
