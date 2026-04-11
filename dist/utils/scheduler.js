"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortTasksForSchedule = sortTasksForSchedule;
const wellbeing_planner_1 = require("./wellbeing-planner");
function sortTasksForSchedule(tasks, options = {}) {
    return (0, wellbeing_planner_1.sortTasksForWellbeing)(tasks, options.wellbeingLevel ?? 4);
}
