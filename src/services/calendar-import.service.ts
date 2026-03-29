import ical from "node-ical";

export interface ImportedCalendarEvent {
  externalId: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
}

export async function parseCalendarIcs(
  content: string
): Promise<ImportedCalendarEvent[]> {
  const parsedCalendar = await ical.async.parseICS(content);
  const events: ImportedCalendarEvent[] = [];
  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  for (const value of Object.values(parsedCalendar)) {
    const entry = value as {
      type?: string;
      uid?: string;
      summary?: string;
      start?: Date;
      end?: Date;
      datetype?: string;
    };

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
