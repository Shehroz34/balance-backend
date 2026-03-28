import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware";
import { Task } from "../models/task.model";
import { User } from "../models/User";
import { generateCalendarIcs, type ScheduledCalendarTask } from "../services/calendar.service";
import { generateDailyPlan } from "../utils/planner";
import { sortTasksForSchedule } from "../utils/scheduler";
import { logger } from "../utils/logger";

const router = Router();

router.use(requireAuth);

router.get("/download-all", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Reuse the existing planner so the export matches the app's schedule.
    const tasks = await Task.find({
      user: req.userId,
      status: "pending",
    });

    const sortedTasks = sortTasksForSchedule(tasks);
    const planResult = generateDailyPlan(sortedTasks, {
      availableFrom: user.availableFrom,
      availableTo: user.availableTo,
      breakStart: user.breakStart,
      breakEnd: user.breakEnd,
      freeDays: user.freeDays ?? [],
    });

    const taskDescriptions = new Map(
      sortedTasks.map((task) => [String(task._id), task.description || ""])
    );

    const scheduledTasks: ScheduledCalendarTask[] = planResult.plan.map((block) => {
      const [startHour, startMinute] = block.start.split(":").map(Number);

      return {
        title: block.title,
        description: taskDescriptions.get(block.taskId) || `Status: ${block.status}`,
        date: block.date,
        startHour,
        startMinute,
        duration: block.duration,
        user: String(req.userId),
        status: block.status,
      };
    });

    const calendarContent = await generateCalendarIcs(scheduledTasks);

    logger.info("Calendar export generated", {
      userId: req.userId,
      totalEvents: scheduledTasks.length,
    });

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="schedule.ics"');

    return res.status(200).send(calendarContent);
  } catch (error) {
    logger.error("Calendar export failed", error);
    return res.status(500).json({ message: "Failed to generate calendar export" });
  }
});

export default router;
