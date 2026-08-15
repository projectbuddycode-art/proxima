import { getDb } from '../db';

export interface LessonRecord {
  id: string;
  mistake: string;
  root_cause: string;
  correction: string;
  evidence: string;
  affected_agent: string;
  regression_test: string;
  success_rate: number;
  created_at: string;
}

export class ProximaLearningEngine {
  /**
   * Records a validated lesson from an agent execution mistake or regression test
   */
  static async recordLesson(lesson: {
    mistake: string;
    root_cause: string;
    correction: string;
    evidence: string;
    affected_agent: string;
    regression_test: string;
  }): Promise<LessonRecord> {
    const db = getDb();
    const id = `less_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const createdAt = new Date().toISOString();

    const record: LessonRecord = {
      id,
      mistake: lesson.mistake,
      root_cause: lesson.root_cause,
      correction: lesson.correction,
      evidence: lesson.evidence,
      affected_agent: lesson.affected_agent,
      regression_test: lesson.regression_test,
      success_rate: 100,
      created_at: createdAt
    };

    try {
      await db.executeAsync(
        `INSERT INTO learning_lessons (id, mistake, root_cause, correction, evidence, affected_agent, regression_test, success_rate, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.mistake,
          record.root_cause,
          record.correction,
          record.evidence,
          record.affected_agent,
          record.regression_test,
          record.success_rate,
          record.created_at
        ]
      );
    } catch (err: any) {
      console.warn('Record lesson warning:', err.message);
    }

    return record;
  }

  /**
   * Retrieves all active lessons for a given agent
   */
  static async getLessonsForAgent(agentName: string): Promise<LessonRecord[]> {
    const db = getDb();
    try {
      const rows = await db.queryAllAsync('SELECT * FROM learning_lessons WHERE affected_agent = ? OR affected_agent = ?', [agentName, 'ALL']);
      return rows || [];
    } catch (err) {
      return [];
    }
  }
}
