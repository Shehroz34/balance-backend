import { ITask } from "../models/task.model";

export type WellbeingLevel = 1 | 2 | 3 | 4;

export interface WellbeingPlanningContext {
  appliedWellbeingLevel: WellbeingLevel;
  effectiveWorkMinutes: number | null;
  reservedRestMinutes: number;
  scheduleLightened: boolean;
  wellbeingNote?: string;
}

const priorityScore: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const difficultyScore: Record<ITask["difficulty"], number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export function getAvailableWorkMinutesForDay(
  availableFrom: string,
  availableTo: string,
  breakStart: string,
  breakEnd: string
) {
  const workStart = parseTimeToMinutes(availableFrom);
  const workEnd = parseTimeToMinutes(availableTo);
  const breakStartMinutes = parseTimeToMinutes(breakStart);
  const breakEndMinutes = parseTimeToMinutes(breakEnd);

  const rawWorkMinutes = Math.max(0, workEnd - workStart);
  const overlappingBreakMinutes = Math.max(
    0,
    Math.min(workEnd, breakEndMinutes) - Math.max(workStart, breakStartMinutes)
  );

  return Math.max(0, rawWorkMinutes - overlappingBreakMinutes);
}

export function resolveWellbeingPlanningContext(
  wellbeingLevel: WellbeingLevel | null | undefined,
  normalAvailableMinutes: number,
  wellbeingNote?: string
): WellbeingPlanningContext {
  const appliedWellbeingLevel = wellbeingLevel ?? 4;

  if (appliedWellbeingLevel === 4) {
    return {
      appliedWellbeingLevel,
      effectiveWorkMinutes: null,
      reservedRestMinutes: 0,
      scheduleLightened: false,
      wellbeingNote,
    };
  }

  const cappedWorkMinutes: Record<1 | 2 | 3, number> = {
    1: 120,
    2: 240,
    3: 300,
  };

  const effectiveWorkMinutes = Math.min(
    normalAvailableMinutes,
    cappedWorkMinutes[appliedWellbeingLevel]
  );

  return {
    appliedWellbeingLevel,
    effectiveWorkMinutes,
    reservedRestMinutes: Math.max(0, normalAvailableMinutes - effectiveWorkMinutes),
    scheduleLightened: true,
    wellbeingNote,
  };
}

export function sortTasksForWellbeing(
  tasks: ITask[],
  wellbeingLevel: WellbeingLevel = 4,
  now = new Date()
) {
  return [...tasks].sort((a, b) => {
    const urgencyA = getUrgencyWeight(a, now);
    const urgencyB = getUrgencyWeight(b, now);

    if (urgencyA !== urgencyB) {
      return urgencyB - urgencyA;
    }

    const wellbeingScoreA = getWellbeingPreferenceScore(a, wellbeingLevel, now);
    const wellbeingScoreB = getWellbeingPreferenceScore(b, wellbeingLevel, now);

    if (wellbeingScoreA !== wellbeingScoreB) {
      return wellbeingScoreA - wellbeingScoreB;
    }

    if (a.status !== b.status) {
      return a.status === "pending" ? -1 : 1;
    }

    const deadlineDiff =
      new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (deadlineDiff !== 0) {
      return deadlineDiff;
    }

    const priorityDiff = priorityScore[b.priority] - priorityScore[a.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return a.duration - b.duration;
  });
}

function getUrgencyWeight(task: ITask, now: Date) {
  const hoursToDeadline =
    (new Date(task.deadline).getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursToDeadline <= 24) {
    return 3;
  }

  if (hoursToDeadline <= 48) {
    return 2;
  }

  if (hoursToDeadline <= 72) {
    return 1;
  }

  return 0;
}

function getWellbeingPreferenceScore(
  task: ITask,
  wellbeingLevel: WellbeingLevel,
  now: Date
) {
  if (wellbeingLevel === 4) {
    return 0;
  }

  const difficultyPenaltyByLevel: Record<1 | 2 | 3, number> = {
    1: 30,
    2: 18,
    3: 10,
  };

  const priorityDiscountByLevel: Record<1 | 2 | 3, number> = {
    1: 3,
    2: 2,
    3: 1,
  };

  const difficultyPenalty =
    difficultyScore[task.difficulty] * difficultyPenaltyByLevel[wellbeingLevel];
  const urgencyDiscount = getUrgencyWeight(task, now) * 16;
  const priorityDiscount =
    priorityScore[task.priority] * priorityDiscountByLevel[wellbeingLevel];

  return difficultyPenalty - urgencyDiscount - priorityDiscount + task.duration / 60;
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
