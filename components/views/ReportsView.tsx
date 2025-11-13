import React from 'react';
import { Student, Report, ReportAudience, Assignment, Grade, PointLog, BehaviorNote, AttendanceRecord, TeacherProfile } from '../../types';
import ReportBuilder from '../ReportBuilder';

interface ReportsViewProps {
  students: Student[];
  reports: Report[];
  assignments: Assignment[];
  grades: Grade[];
  pointLogs: PointLog[];
  behaviorNotes: BehaviorNote[];
  attendanceRecords: AttendanceRecord[];
  teacherProfile: TeacherProfile | null;
  onSaveReport: (reportData: Omit<Report, 'id' | 'created_at' | 'user_id' | 'classroom_id'>) => Promise<void>;
  onGenerateFinalReport: (reportData: Omit<Report, 'id' | 'created_at' | 'user_id' | 'classroom_id'>, studentName: string, studentDataSummary: string) => Promise<string | null>;
  onGenerateReportAdvice: (behavior_tags: string[], audience: ReportAudience) => Promise<string | null>;
}

const ReportsView: React.FC<ReportsViewProps> = (props) => {
  if (props.students.length === 0) {
      return (
         <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-foreground">Report Creator</h1>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Add students to your class to start creating reports.</p>
        </div>
      )
  }

  return (
    <div className="space-y-8">
      <ReportBuilder {...props} />
    </div>
  );
};

export default ReportsView;
