import React, { useState, useMemo } from 'react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { ClipboardDocumentCheckIcon, UserCircleIcon, CheckIcon, XMarkIcon, ClockIcon, ArrowDownTrayIcon } from './icons/Icons.tsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AttendanceTrackerProps {
  classroomId: string;
  students: Student[];
  records: AttendanceRecord[];
  onSetAttendance: (studentId: string, classroomId: string, status: AttendanceStatus, date: string) => void;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ classroomId, students, records, onSetAttendance }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const todaysRecords = useMemo(() => {
    const recordMap = new Map<string, AttendanceStatus>();
    records.forEach(rec => {
      if (rec.date === selectedDate) {
        recordMap.set(rec.student_id, rec.status);
      }
    });
    return recordMap;
  }, [records, selectedDate]);

  const summary = useMemo(() => {
    let present = 0, absent = 0, late = 0;
    todaysRecords.forEach(status => {
      if (status === 'present') present++;
      if (status === 'absent') absent++;
      if (status === 'late') late++;
    });
    return { present, absent, late };
  }, [todaysRecords]);

  const handleMarkAllPresent = () => {
    students.forEach(student => {
      if (!todaysRecords.has(student.id)) {
        onSetAttendance(student.id, classroomId, 'present', selectedDate);
      }
    });
  };

  const getStatusButtonClass = (status: AttendanceStatus, isActive: boolean) => {
    const base = 'px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1 transition-colors';
    if (isActive) {
      switch (status) {
        case 'present': return `${base} bg-green-500 text-white`;
        case 'absent': return `${base} bg-red-500 text-white`;
        case 'late': return `${base} bg-amber-500 text-white`;
      }
    }
    return `${base} bg-zinc-200 dark:bg-slate-700/50 text-zinc-600 dark:text-slate-300 hover:bg-zinc-300 dark:hover:bg-slate-600`;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Attendance for ${selectedDate}`, 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Student Name', 'Status']],
      body: students.map(student => {
        const status = todaysRecords.get(student.id) || 'Not Marked';
        return [student.name, status.charAt(0).toUpperCase() + status.slice(1)];
      }),
    });
    doc.save(`attendance_${selectedDate}.pdf`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg shadow-slate-900/10 border border-zinc-200 dark:border-slate-800 transition-all duration-300 hover:shadow-xl">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <ClipboardDocumentCheckIcon className="w-6 h-6 text-violet-500" />
          Attendance Tracker
        </h3>
        <div className="flex items-center gap-2">
          <label htmlFor="attendance-date" className="text-sm font-medium">Date:</label>
          <input
            type="date"
            id="attendance-date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 bg-zinc-100 dark:bg-slate-800 border border-zinc-300 dark:border-slate-700 rounded-lg transition-colors"
          />
        </div>
      </div>
      
      <div className="p-4 bg-zinc-100 dark:bg-slate-800 rounded-lg border border-zinc-200 dark:border-slate-700 mb-4 flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>{summary.present} Present</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>{summary.absent} Absent</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>{summary.late} Late</span>
        </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={handleMarkAllPresent}
              className="px-4 py-2 text-sm font-semibold bg-zinc-200 dark:bg-slate-700 text-zinc-700 dark:text-slate-200 rounded-lg hover:bg-zinc-300 dark:hover:bg-slate-600 transition-colors"
            >
              Mark All Present
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={students.length === 0}
              className="px-4 py-2 text-sm font-semibold bg-zinc-200 dark:bg-slate-700 text-zinc-700 dark:text-slate-200 rounded-lg hover:bg-zinc-300 dark:hover:bg-slate-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Export PDF
            </button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-2 -mr-2">
        {students.map(student => {
          const status = todaysRecords.get(student.id);
          return (
            <div key={student.id} className="p-2.5 bg-zinc-100 dark:bg-slate-800/50 rounded-lg flex items-center justify-between gap-2 transition-all duration-200 hover:bg-zinc-200 dark:hover:bg-slate-800 hover:shadow-sm">
              <div className="flex items-center gap-3">
                {student.avatar_url ? (
                  <img src={student.avatar_url} alt={student.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <UserCircleIcon className="w-8 h-8 text-zinc-400 dark:text-slate-500" />
                )}
                <span className="font-medium text-zinc-800 dark:text-slate-200">{student.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSetAttendance(student.id, classroomId, 'present', selectedDate)}
                  className={getStatusButtonClass('present', status === 'present')}
                >
                  <CheckIcon className="w-4 h-4" /> Present
                </button>
                <button
                  onClick={() => onSetAttendance(student.id, classroomId, 'absent', selectedDate)}
                  className={getStatusButtonClass('absent', status === 'absent')}
                >
                  <XMarkIcon className="w-4 h-4" /> Absent
                </button>
                <button
                  onClick={() => onSetAttendance(student.id, classroomId, 'late', selectedDate)}
                  className={getStatusButtonClass('late', status === 'late')}
                >
                  <ClockIcon className="w-4 h-4" /> Late
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceTracker;