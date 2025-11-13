import React from 'react';
import { Student, AttendanceRecord, AttendanceStatus } from '../../types';
import AttendanceTracker from '../AttendanceTracker';

interface AttendanceViewProps {
  classroomId: string;
  students: Student[];
  records: AttendanceRecord[];
  onSetAttendance: (studentId: string, classroomId: string, status: AttendanceStatus, date: string) => void;
}

const AttendanceView: React.FC<AttendanceViewProps> = (props) => {
   if (props.students.length === 0) {
      return (
         <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Add students to your class to start tracking attendance.</p>
        </div>
      )
  }
  
  return (
    <div className="space-y-8">
      <AttendanceTracker {...props} />
    </div>
  );
};

export default AttendanceView;
