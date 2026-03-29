"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.updateAvailability = updateAvailability;
const task_model_1 = require("../models/task.model");
const User_1 = require("../models/User");
async function getProfile(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await User_1.User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json(user);
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to fetch profile" });
    }
}
async function updateAvailability(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { availableFrom, availableTo, breakStart, breakEnd, freeDays } = req.body;
        const updatedUser = await User_1.User.findByIdAndUpdate(req.userId, {
            availableFrom,
            availableTo,
            breakStart,
            breakEnd,
            freeDays,
        }, {
            returnDocument: "after",
            runValidators: true,
        }).select("-password");
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        // Availability changes should invalidate any manually pinned task blocks
        // so the planner can rebuild the timetable from the new constraints.
        await task_model_1.Task.updateMany({
            user: req.userId,
            status: "pending",
        }, {
            $set: {
                startTime: null,
                endTime: null,
            },
        });
        return res.json({
            message: "Availability updated successfully",
            user: updatedUser,
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to update availability" });
    }
}
