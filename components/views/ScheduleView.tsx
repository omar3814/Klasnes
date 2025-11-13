import React from 'react';
import { Lesson, Student, Holiday } from '../../types.ts';
// FIX: Corrected import casing to resolve module resolution error.
import LessonPlanner from '../lessonPlanner';

interface ScheduleViewProps {
  lessons: Lesson[];
  students: Student[];
  holidays: Holiday[];
  onAddLesson: (lessonData: Omit<Lesson, 'id' | 'classroom_id'>) => Promise<void>;
  onUpdateLesson: (lessonId: string, updatedData: Partial<Omit<Lesson, 'id' | 'classroom_id'>>) => Promise<void>;
  onDeleteLesson: (lessonId: string) => Promise<void>;
}

const ScheduleView: React.FC<ScheduleViewProps> = (props) => {
    if (props.students.length === 0) {
      return (
         <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-foreground">Weekly Schedule</h1>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Add students to your class to start planning lessons.</p>
        </div>
      )
  }

  return (
    <div className="space-y-8">
      {/* A full holiday manager would be a larger feature. For now, we display them. */}
      {props.holidays.length > 0 && (
          <div className="bg-card p-4 rounded-xl border border-border">
              <h3 className="font-semibold text-foreground">Upcoming Holidays/Breaks</h3>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {props.holidays.map(h => <li key={h.id}>{h.name} ({h.start_date} to {h.end_date})</li>)}
              </ul>
          </div>
      )}
      <LessonPlanner lessons={props.lessons} students={props.students} onAddLesson={props.onAddLesson} onUpdateLesson={props.onUpdateLesson} onDeleteLesson={props.onDeleteLesson} />
    </div>
  );
};

export default ScheduleView;