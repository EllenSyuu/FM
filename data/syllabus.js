/*
 * The course, in syllabus order (SOA Exam FM, February 2027 syllabus — five topics with the
 * weight ranges SOA publishes). Each topic file holds its lessons; see data/kit.js for the format.
 */
import t1 from './t1-tvm.js';
import t2 from './t2-annuities.js';
import t3 from './t3-loans.js';
import t4 from './t4-bonds.js';
import t5 from './t5-alm.js';

export const TOPICS = [t1, t2, t3, t4, t5];
export const LESSONS = TOPICS.flatMap(t => t.lessons.map(l => ({ ...l, topic: t.id })));
export const DRILLS = LESSONS.flatMap(l => l.drills.map(d => ({ ...d, lesson: l.id, topic: l.topic })));
