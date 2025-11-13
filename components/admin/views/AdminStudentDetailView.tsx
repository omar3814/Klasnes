import React, { useMemo } from 'react';
import { Student, Classroom, TeacherProfile, Report, Assignment, Grade, AttendanceRecord, PointLog, BehaviorNote } from '../../../types';
import { ArrowLeftIcon, UserCircleIcon, AcademicCapIcon, StarIcon, TicketIcon, ClipboardDocumentCheckIcon, TagIcon, ChatBubbleLeftRightIcon, BookOpenIcon, DocumentTextIcon } from '../../icons/Icons';

interface AdminStudentDetailViewProps {
  student: Student;
  classroom?: Classroom;
  teacher?: TeacherProfile;
  reports: Report[];
  assignments: Assignment[];
  grades: Grade[];
  attendanceRecords: AttendanceRecord[];
  pointLogs: PointLog[];
  behaviorNotes: BehaviorNote[];
  onBack: () => void;
  onViewReportDetails: (reportId: string) => void;
}

const DetailCard: React.FC<{ children: React.ReactNode, title: string, icon: React.ReactNode, count?: number }> = ({ children, title, icon, count }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
            {icon}
            {title} {count !== undefined && <span className="text-base font-medium text-slate-500">({count})</span>}
        </h2>
        {children}
    </div>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subtext?: string; color: string }> = ({ icon, label, value, subtext, color }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg flex items-center gap-4 border border-slate-200 dark:border-slate-700">
        <div className={`p-3 bg-${color}-500/10 rounded-full text-${color}-500`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
            {subtext && <p className="text-xs text-slate-500 dark:text-slate-400">{subtext}</p>}
        </div>
    </div>
);

const AdminStudentDetailView: React.FC<AdminStudentDetailViewProps> = (props) => {
    const { student, classroom, teacher, reports, assignments, grades, attendanceRecords, pointLogs, behaviorNotes, onBack, onViewReportDetails } = props;

    const studentAssignments = useMemo(() => {
        const studentGradeMap = new Map(grades.map(g => [g.assignment_id, g.score]));
        return assignments.map(a => ({...a, score: studentGradeMap.get(a.id) ?? null }));
    }, [assignments, grades]);

    const averageGrade = useMemo(() => {
        const graded = studentAssignments.filter(a => a.score !== null);
        if (graded.length === 0) return 'N/A';
        const totalPercentage = graded.reduce((sum, a) => sum + ((a.score as number) / a.max_score) * 100, 0);
        return `${(totalPercentage / graded.length).toFixed(1)}%`;
    }, [studentAssignments]);
    
    const attendanceStats = useMemo(() => {
        if(attendanceRecords.length === 0) return { rate: 'N/A', summary: 'No records' };
        const present = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        const rate = (present / attendanceRecords.length * 100).toFixed(1);
        return { rate: `${rate}%`, summary: `${present}/${attendanceRecords.length} days` };
    }, [attendanceRecords]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <ArrowLeftIcon className="w-6 h-6"/>
        </button>
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Student Profile</h1>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex items-center gap-6">
          {student.avatar_url ? <img src={student.avatar_url} alt={student.name} className="w-20 h-20 rounded-full"/> : <UserCircleIcon className="w-20 h-20 text-slate-400"/>}
          <div>
            <h2 className="text-2xl font-bold">{student.name}</h2>
            <p className="text-slate-500">Grade {student.grade_level || 'N/A'}</p>
            <p className="text-sm text-slate-500 mt-1">Class: {classroom?.name || 'N/A'} | Teacher: {teacher?.full_name || 'N/A'}</p>
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard icon={<AcademicCapIcon className="w-7 h-7"/>} label="Average Grade" value={averageGrade} color="violet"/>
          <StatCard icon={<ClipboardDocumentCheckIcon className="w-7 h-7"/>} label="Attendance" value={attendanceStats.rate} subtext={attendanceStats.summary} color="sky"/>
          <StatCard icon={<StarIcon className="w-7 h-7"/>} label="Total Points" value={student.points} color="amber"/>
          <StatCard icon={<TicketIcon className="w-7 h-7"/>} label="Passes Used" value={`${student.passes_used} / ${student.passes_allowed}`} color="emerald"/>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DetailCard title="Grades" icon={<BookOpenIcon className="w-6 h-6"/>} count={grades.length}>
              <div className="max-h-64 overflow-y-auto space-y-2">
                  {studentAssignments.map(a => <div key={a.id} className="flex justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md"><span className="font-medium">{a.name}</span><span>{a.score === null ? '-' : `${a.score} / ${a.max_score}`}</span></div>)}
              </div>
          </DetailCard>
          <DetailCard title="Behavior Notes" icon={<ChatBubbleLeftRightIcon className="w-6 h-6"/>} count={behaviorNotes.length}>
              <div className="max-h-64 overflow-y-auto space-y-2">
                  {behaviorNotes.map(n => <div key={n.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md"><p>{n.note}</p><p className="text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</p></div>)}
              </div>
          </DetailCard>
          <DetailCard title="Point Log" icon={<TagIcon className="w-6 h-6"/>} count={pointLogs.length}>
              <div className="max-h-64 overflow-y-auto space-y-2">
                  {pointLogs.map(p => <div key={p.id} className="flex justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md"><div><p>{p.reason}</p><p className="text-xs text-slate-500">{new Date(p.created_at).toLocaleString()}</p></div><span className={`font-bold ${p.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{p.amount > 0 ? `+${p.amount}`: p.amount}</span></div>)}
              </div>
          </DetailCard>
           <DetailCard title="Saved Reports" icon={<DocumentTextIcon className="w-6 h-6"/>} count={reports.length}>
              <div className="max-h-64 overflow-y-auto space-y-2">
                  {reports.map(r => (
                      <button key={r.id} onClick={() => onViewReportDetails(r.id)} className="w-full text-left p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                        <p className="font-medium">Report for {r.end_date}</p>
                        <p className="text-xs text-slate-500 capitalize">Audience: {r.audience}</p>
                      </button>
                  ))}
              </div>
          </DetailCard>
      </div>
    </div>
  );
};

export default AdminStudentDetailView;