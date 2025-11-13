import React, { useMemo } from 'react';
import { TeacherProfile, Classroom, Student, Report, Lesson } from '../../../types';
import { ArrowLeftIcon, UserCircleIcon, EnvelopeIcon, BuildingOfficeIcon, BriefcaseIcon, CalendarDaysIcon, HashtagIcon, LockClosedIcon, InformationCircleIcon, BookOpenIcon, DocumentTextIcon } from '../../icons/Icons';

interface AdminUserDetailViewProps {
  user: TeacherProfile;
  classrooms: Classroom[];
  students: Student[];
  reports: Report[];
  lessons: Lesson[];
  onBack: () => void;
  onViewStudentDetails: (studentId: string) => void;
  onViewReportDetails: (reportId: string) => void;
}

const DetailCard: React.FC<{ children: React.ReactNode, title: string, icon: React.ReactNode }> = ({ children, title, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">{icon}{title}</h2>
        {children}
    </div>
);

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="font-semibold text-slate-700 dark:text-slate-200">{value || 'N/A'}</p>
    </div>
);

const AdminUserDetailView: React.FC<AdminUserDetailViewProps> = ({ user, classrooms, students, reports, lessons, onBack, onViewStudentDetails, onViewReportDetails }) => {
  const studentNameMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <ArrowLeftIcon className="w-6 h-6"/>
        </button>
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Details</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Viewing profile for {user.full_name}.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
            <DetailCard title="Profile" icon={<UserCircleIcon className="w-6 h-6"/>}>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name} className="w-16 h-16 rounded-full"/> : <UserCircleIcon className="w-16 h-16 text-slate-400"/>}
                        <div>
                            <h3 className="font-bold text-lg">{user.full_name}</h3>
                            <p className="text-sm text-slate-500">{user.title}</p>
                        </div>
                    </div>
                    <DetailItem label="School" value={user.school} />
                </div>
            </DetailCard>
             <DetailCard title="Usage Statistics" icon={<HashtagIcon className="w-6 h-6"/>}>
                <div className="space-y-4">
                    <DetailItem label="Total Logins" value={user.login_count} />
                    <DetailItem label="Last Login" value={user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'} />
                    <DetailItem label="Joined On" value={user.accepted_at ? new Date(user.accepted_at).toLocaleDateString() : 'N/A'} />
                </div>
            </DetailCard>
             <DetailCard title="Credentials" icon={<LockClosedIcon className="w-6 h-6"/>}>
                <div className="space-y-4">
                    <DetailItem label="Email Address" value={user.contact_email} />
                    <DetailItem label="Password Hash" value={user.password_hash} />
                    <div className="p-3 bg-amber-500/10 text-amber-800 dark:text-amber-300 rounded-lg flex items-start gap-2 text-sm">
                        <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                        <span>For security, plain text passwords are never stored or displayed. This is a secure hash of the user's password.</span>
                    </div>
                </div>
            </DetailCard>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
            <DetailCard title={`Classrooms (${classrooms.length})`} icon={<BuildingOfficeIcon className="w-6 h-6"/>}>
                <div className="max-h-64 overflow-y-auto">
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {classrooms.map(c => <li key={c.id} className="py-2 font-medium">{c.name}</li>)}
                    </ul>
                    {classrooms.length === 0 && <p className="text-slate-500 text-sm">This user has not created any classrooms.</p>}
                </div>
            </DetailCard>
            <DetailCard title={`Students (${students.length})`} icon={<BriefcaseIcon className="w-6 h-6"/>}>
                <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                        <tbody>
                        {students.map(s => (
                            <tr key={s.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                                <td className="py-2">
                                    <button onClick={() => onViewStudentDetails(s.id)} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">{s.name}</button>
                                </td>
                                <td className="py-2 text-slate-500">{s.grade_level}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {students.length === 0 && <p className="text-slate-500 text-sm">This user has not added any students.</p>}
                </div>
            </DetailCard>
             <DetailCard title={`Lessons (${lessons.length})`} icon={<BookOpenIcon className="w-6 h-6"/>}>
                <div className="max-h-64 overflow-y-auto">
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {lessons.map(l => (
                            <li key={l.id} className="py-2">
                                <p className="font-medium">{l.title}</p>
                                <p className="text-xs text-slate-500">{l.day_of_week} - {l.topic}</p>
                            </li>
                        ))}
                    </ul>
                    {lessons.length === 0 && <p className="text-slate-500 text-sm">This user has not created any lessons.</p>}
                </div>
            </DetailCard>
            <DetailCard title={`Reports Created (${reports.length})`} icon={<DocumentTextIcon className="w-6 h-6"/>}>
                <div className="max-h-64 overflow-y-auto">
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {reports.map(r => (
                            <li key={r.id} className="py-2">
                                <button onClick={() => onViewReportDetails(r.id)} className="w-full text-left font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                                    Report for {studentNameMap.get(r.student_id) || 'Unknown Student'}
                                </button>
                                <p className="text-xs text-slate-500">Ended: {r.end_date}</p>
                            </li>
                        ))}
                    </ul>
                    {reports.length === 0 && <p className="text-slate-500 text-sm">This user has not created any reports.</p>}
                </div>
            </DetailCard>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetailView;