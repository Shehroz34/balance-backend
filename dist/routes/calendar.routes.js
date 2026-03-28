"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const task_model_1 = require("../models/task.model");
const User_1 = require("../models/User");
const calendar_service_1 = require("../services/calendar.service");
const planner_1 = require("../utils/planner");
const scheduler_1 = require("../utils/scheduler");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
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
        const planResult = (0, planner_1.generateDailyPlan)(sortedTasks, {
            availableFrom: user.availableFrom,
            availableTo: user.availableTo,
            breakStart: user.breakStart,
            breakEnd: user.breakEnd,
            freeDays: user.freeDays ?? [],
        });
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
