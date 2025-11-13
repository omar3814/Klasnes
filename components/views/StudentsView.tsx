import React from 'react';
import { Student } from '../../types';
import StudentManager from '../StudentManager';
import { UsersIcon } from '../icons/Icons.tsx';

interface StudentsViewProps {
  students: Student[];
  selectedClassroomId: string | null;
  onAddStudent: (studentData: Omit<Student, 'id' | 'classroom_id' | 'avatar_url' | 'points'>) => Promise<void>;
  onUsePass: (studentId: string, isOverride?: boolean) => void;
  onSetAllowance: (allowance: number) => void;
  onResetPasses: () => void;
  onUpdateAvatar: (studentId: string, avatarUrl: string) => void;
  onUpdateDetails: (studentId: string, updatedDetails: Partial<Omit<Student, 'id' | 'classroom_id'>>) => void;
  onUpdateStudentPoints: (studentId: string, amount: number, reason: string) => void;
  onShowAnalytics: (studentId: string) => void;
}

const StudentsView: React.FC<StudentsViewProps> = (props) => {
  return (
    <div className="flex flex-col gap-8">
      {props.selectedClassroomId ? (
        <StudentManager
          students={props.students}
          selectedStudentId={null} // Not needed in this view
          onAddStudent={props.onAddStudent}
          onUsePass={props.onUsePass}
          onSetAllowance={props.onSetAllowance}
          onResetPasses={props.onResetPasses}
          onUpdateAvatar={props.onUpdateAvatar}
          onUpdateDetails={props.onUpdateDetails}
          onUpdateStudentPoints={props.onUpdateStudentPoints}
          onSelectStudent={() => {}} // Not needed
          onShowAnalytics={props.onShowAnalytics}
        />
      ) : (
        <div className="flex flex-col items-center justify-center bg-card p-8 rounded-2xl shadow-lg shadow-black/5 border border-border min-h-[300px] text-center">
          <div className="p-4 bg-primary/10 rounded-full text-primary mb-4">
            <UsersIcon className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">No Class Selected</h3>
          <p className="text-muted-foreground mt-2 max-w-xs">Please select a class to view the student roster.</p>
        </div>
      )}
    </div>
  );
};

export default StudentsView;