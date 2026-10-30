/*
 * The study plan: how many lessons are left, how many weeks until the exam, and the pace
 * that leaves the last three weeks free for review. Pure, so it can be tested.
 */
import { daysBetween, addDays } from './srs.js';

export const REVIEW_DAYS = 21;

export function studyPlan({ lessonIds, learned, today, examDate }) {
  const daysLeft = Math.max(0, daysBetween(today, examDate));
  const left = lessonIds.filter(id => !learned[id]);
  const studyDays = Math.max(1, daysLeft - REVIEW_DAYS);
  const perWeek = left.length ? Math.ceil(left.length / Math.max(1, studyDays / 7)) : 0;
  const weekStart = addDays(today, -6);
  const thisWeek = lessonIds.filter(id => learned[id] && learned[id] >= weekStart && learned[id] <= today).length;
  return {
    daysLeft,
    weeksLeft: Math.ceil(daysLeft / 7),
    left: left.length,
    done: lessonIds.length - left.length,
    perWeek,
    thisWeek,
    next: left[0] || null,
    reviewFrom: addDays(examDate, -REVIEW_DAYS),
    inReview: daysLeft <= REVIEW_DAYS,
  };
}
