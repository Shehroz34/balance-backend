import { Router, type Request } from "express";
import multer from "multer";

import { requireAuth } from "../middleware/auth.middleware";
import { ExternalCalendarEvent } from "../models/external-calendar-event.model";
import { Task } from "../models/task.model";
import { User } from "../models/User";
import { parseCalendarIcs } from "../services/calendar-import.service";
import { generateCalendarIcs, type ScheduledCalendarTask } from "../services/calendar.service";
import { generateDailyPlan } from "../utils/planner";
import { sortTasksForSchedule } from "../utils/scheduler";
import { logger } from "../utils/logger";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.get("/events", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const events = await ExternalCalendarEvent.find({ user: req.userId }).sort({
      start: 1,
    });

    return res.json({
      total: events.length,
      events,
    });
  } catch (error) {
    logger.error("Calendar events fetch failed", error);
    return res.status(500).json({ message: "Failed to fetch imported calendar events" });
  }
});

router.delete("/events", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await ExternalCalendarEvent.deleteMany({ user: req.userId });

    logger.info("Imported calendar events cleared", {
      userId: req.userId,
      deletedCount: result.deletedCount,
    });

    return res.json({ message: "Imported calendar events cleared successfully" });
  } catch (error) {
    logger.error("Calendar events clear failed", error);
    return res.status(500).json({ message: "Failed to clear imported calendar events" });
  }
});

router.post("/import-ics", upload.single("file"), async (req: Request & { file?: Express.Multer.File }, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "ICS file is required" });
    }

    const parsedEvents = await parseCalendarIcs(req.file.buffer.toString("utf-8"));

    await ExternalCalendarEvent.deleteMany({ user: req.userId });

    if (parsedEvents.length > 0) {
      await ExternalCalendarEvent.insertMany(
        parsedEvents.map((event) => ({
          user: req.userId,
          source: "apple_ics",
          externalId: event.externalId,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
        }))
      );
    }

    logger.info("ICS calendar imported", {
      userId: req.userId,
      totalEvents: parsedEvents.length,
    });

    return res.status(200).json({
      message: "Calendar imported successfully",
      totalEvents: parsedEvents.length,
    });
  } catch (error) {
    logger.error("ICS calendar import failed", error);
    return res.status(500).json({ message: "Failed to import calendar" });
  }
});

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
    const busyCalendarEvents = await ExternalCalendarEvent.find({
      user: req.userId,
    }).sort({ start: 1 });

    const planResult = generateDailyPlan(sortedTasks, {
      availableFrom: user.availableFrom,
      availableTo: user.availableTo,
      breakStart: user.breakStart,
      breakEnd: user.breakEnd,
      freeDays: user.freeDays ?? [],
    }, busyCalendarEvents.map((event) => ({
      start: event.start,
      end: event.end,
      allDay: event.allDay,
    })));

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
