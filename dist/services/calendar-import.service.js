"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCalendarIcs = parseCalendarIcs;
const node_ical_1 = __importDefault(require("node-ical"));
async function parseCalendarIcs(content) {
    const parsedCalendar = await node_ical_1.default.async.parseICS(content);
    const events = [];
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    for (const value of Object.values(parsedCalendar)) {
        const entry = value;
        if (entry.type !== "VEVENT" || !entry.start || !entry.end) {
            continue;
        }
        // Ignore events from before today and events that have already finished.
        if (entry.start < startOfToday || entry.end <= now) {
            continue;
        }
        events.push({
            externalId: entry.uid || `${entry.start.toISOString()}-${entry.summary || "event"}`,
            title: entry.summary || "Busy time",
            start: new Date(entry.start),
            end: new Date(entry.end),
            allDay: Boolean(entry.datetype === "date"),
        });
    }
    return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}
