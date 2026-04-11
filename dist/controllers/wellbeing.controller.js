"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveTodayWellbeing = saveTodayWellbeing;
exports.getTodayWellbeing = getTodayWellbeing;
const wellbeing_model_1 = require("../models/wellbeing.model");
function getStartOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}
function getEndOfToday() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
}
async function saveTodayWellbeing(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { wellbeingLevel, note = "" } = req.body;
        const startOfToday = getStartOfToday();
        const wellbeing = await wellbeing_model_1.Wellbeing.findOneAndUpdate({
            user: req.userId,
            date: startOfToday,
        }, {
            user: req.userId,
            date: startOfToday,
            wellbeingLevel,
            note,
        }, {
            upsert: true,
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        });
        return res.status(200).json({
            message: "Wellbeing saved successfully",
            wellbeing,
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to save wellbeing" });
    }
}
async function getTodayWellbeing(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const wellbeing = await wellbeing_model_1.Wellbeing.findOne({
            user: req.userId,
            date: {
                $gte: getStartOfToday(),
                $lte: getEndOfToday(),
            },
        });
        return res.status(200).json({
            wellbeing,
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to fetch wellbeing" });
    }
}
