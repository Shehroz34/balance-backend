"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuggestedSchedule = getSuggestedSchedule;
exports.getPlannedSchedule = getPlannedSchedule;
exports.getReplannedSchedule = getReplannedSchedule;
const external_calendar_event_model_1 = require("../models/external-calendar-event.model");
const task_model_1 = require("../models/task.model");
const User_1 = require("../models/User");
const scheduler_1 = require("../utils/scheduler");
const planner_1 = require("../utils/planner");
async function getSuggestedSchedule(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const tasks = await task_model_1.Task.find({
            user: req.userId,
            status: "pending",
        });
        const sortedTasks = (0, scheduler_1.sortTasksForSchedule)(tasks);
        return res.json({
            message: "Suggested schedule generated successfully",
            totalTasks: sortedTasks.length,
            tasks: sortedTasks,
        });
    }
    catch (error) {
        console.error("SUGGESTED SCHEDULE ERROR:", error);
        return res.status(500).json({ message: "Failed to generate schedule" });
    }
}
async function getPlannedSchedule(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await User_1.User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const tasks = await task_model_1.Task.find({
            user: req.userId,
            status: "pending",
        });
        const sortedTasks = (0, scheduler_1.sortTasksForSchedule)(tasks);
        const busyCalendarEvents = await external_calendar_event_model_1.ExternalCalendarEvent.find({
            user: req.userId,
        }).sort({ start: 1 });
        const result = (0, planner_1.generateDailyPlan)(sortedTasks, {
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
        const scheduledCount = result.summaries.filter((t) => t.status === "scheduled").length;
        const splitCount = result.summaries.filter((t) => t.status === "splitAcrossDays").length;
        const atRiskCount = result.summaries.filter((t) => t.status === "atRisk").length;
        const missedCount = result.summaries.filter((t) => t.status === "missedDeadline").length;
        return res.json({
            message: "Planned schedule generated successfully",
            availability: {
                availableFrom: user.availableFrom,
                availableTo: user.availableTo,
                breakStart: user.breakStart,
                breakEnd: user.breakEnd,
                freeDays: user.freeDays ?? [],
            },
            totalTasks: sortedTasks.length,
            totalBlocks: result.plan.length,
            stats: {
                scheduled: scheduledCount,
                splitAcrossDays: splitCount,
                atRisk: atRiskCount,
                missedDeadline: missedCount,
            },
            plan: result.plan,
            summaries: result.summaries,
        });
    }
    catch (error) {
        console.error("PLANNED SCHEDULE ERROR:", error);
        return res.status(500).json({ message: "Failed to generate planned schedule" });
    }
}
async function getReplannedSchedule(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // A full replan should discard any manually dragged task times first.
        await task_model_1.Task.updateMany({
            user: req.userId,
            status: "pending",
        }, {
            $set: {
                startTime: null,
                endTime: null,
            },
        });
        const user = await User_1.User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const remainingTasks = await task_model_1.Task.find({
            user: req.userId,
            status: "pending",
        });
        const sortedRemainingTasks = (0, scheduler_1.sortTasksForSchedule)(remainingTasks);
        const busyCalendarEvents = await external_calendar_event_model_1.ExternalCalendarEvent.find({
            user: req.userId,
        }).sort({ start: 1 });
        const result = (0, planner_1.generateDailyPlan)(sortedRemainingTasks, {
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
        const scheduledCount = result.summaries.filter((t) => t.status === "scheduled").length;
        const splitCount = result.summaries.filter((t) => t.status === "splitAcrossDays").length;
        const atRiskCount = result.summaries.filter((t) => t.status === "atRisk").length;
        const missedCount = result.summaries.filter((t) => t.status === "missedDeadline").length;
        return res.json({
            message: "Schedule re-planned successfully",
            availability: {
                availableFrom: user.availableFrom,
                availableTo: user.availableTo,
                breakStart: user.breakStart,
                breakEnd: user.breakEnd,
                freeDays: user.freeDays ?? [],
            },
            totalTasks: sortedRemainingTasks.length,
            totalBlocks: result.plan.length,
            stats: {
                scheduled: scheduledCount,
                splitAcrossDays: splitCount,
                atRisk: atRiskCount,
                missedDeadline: missedCount,
            },
            plan: result.plan,
            summaries: result.summaries,
        });
    }
    catch (error) {
        console.error("REPLAN SCHEDULE ERROR:", error);
        return res.status(500).json({ message: "Failed to re-plan schedule" });
    }
}
