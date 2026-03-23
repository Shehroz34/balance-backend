import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
    getSuggestedSchedule,
    getPlannedSchedule,
    getReplannedSchedule,
  } from "../controllers/schedule.controller";

const router = Router();

router.get("/", requireAuth, getSuggestedSchedule);
router.get("/plan", requireAuth, getPlannedSchedule);
router.get("/replan", requireAuth, getReplannedSchedule);

export default router;
