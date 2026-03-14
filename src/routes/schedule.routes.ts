import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
    getSuggestedSchedule,
    getPlannedSchedule,
  } from "../controllers/schedule.controller";

const router = Router();

router.get("/", requireAuth, getSuggestedSchedule);
router.get("/plan", requireAuth, getPlannedSchedule);
export default router;
