"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const external_calendar_event_model_1 = require("../models/external-calendar-event.model");
const task_model_1 = require("../models/task.model");
const User_1 = require("../models/User");
const calendar_import_service_1 = require("../services/calendar-import.service");
const calendar_service_1 = require("../services/calendar.service");
const planner_1 = require("../utils/planner");
const scheduler_1 = require("../utils/scheduler");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.use(auth_middleware_1.requireAuth);
router.get("/events", async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const events = await external_calendar_event_model_1.ExternalCalendarEvent.find({ user: req.userId }).sort({
            start: 1,
        });
        return res.json({
            total: events.length,
            events,
        });
    }
    catch (error) {
        logger_1.logger.error("Calendar events fetch failed", error);
        return res.status(500).json({ message: "Failed to fetch imported calendar events" });
    }
});
router.delete("/events", async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await external_calendar_event_model_1.ExternalCalendarEvent.deleteMany({ user: req.userId });
        logger_1.logger.info("Imported calendar events cleared", {
            userId: req.userId,
            deletedCount: result.deletedCount,
        });
        return res.json({ message: "Imported calendar events cleared successfully" });
    }
    catch (error) {
        logger_1.logger.error("Calendar events clear failed", error);
        return res.status(500).json({ message: "Failed to clear imported calendar events" });
    }
});
router.post("/import-ics", upload.single("file"), async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "ICS file is required" });
        }
        const parsedEvents = await (0, calendar_import_service_1.parseCalendarIcs)(req.file.buffer.toString("utf-8"));
        await external_calendar_event_model_1.ExternalCalendarEvent.deleteMany({ user: req.userId });
        if (parsedEvents.length > 0) {
            await external_calendar_event_model_1.ExternalCalendarEvent.insertMany(parsedEvents.map((event) => ({
                user: req.userId,
                source: "apple_ics",
                externalId: event.externalId,
                title: event.title,
                start: event.start,
                end: event.end,
                allDay: event.allDay,
            })));
        }
        logger_1.logger.info("ICS calendar imported", {
            userId: req.userId,
            totalEvents: parsedEvents.length,
        });
        return res.status(200).json({
            message: "Calendar imported successfully",
            totalEvents: parsedEvents.length,
        });
    }
    catch (error) {
        logger_1.logger.error("ICS calendar import failed", error);
        return res.status(500).json({ message: "Failed to import calendar" });
    }
});
router.get("/download-all", async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await User_1.User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Reuse the existing planner so the export matches the app's schedule.
        const tasks = await task_model_1.Task.find({
            user: req.userId,
            status: "pending",
        });
        const sortedTasks = (0, scheduler_1.sortTasksForSchedule)(tasks);
        const busyCalendarEvents = await external_calendar_event_model_1.ExternalCalendarEvent.find({
            user: req.userId,
        }).sort({ start: 1 });
        const planResult = (0, planner_1.generateDailyPlan)(sortedTasks, {
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
        const taskDescriptions = new Map(sortedTasks.map((task) => [String(task._id), task.description || ""]));
        const scheduledTasks = planResult.plan.map((block) => {
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
        const calendarContent = await (0, calendar_service_1.generateCalendarIcs)(scheduledTasks);
        logger_1.logger.info("Calendar export generated", {
            userId: req.userId,
            totalEvents: scheduledTasks.length,
        });
        res.setHeader("Content-Type", "text/calendar; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="schedule.ics"');
        return res.status(200).send(calendarContent);
    }
    catch (error) {
        logger_1.logger.error("Calendar export failed", error);
        return res.status(500).json({ message: "Failed to generate calendar export" });
    }
});
exports.default = router;
