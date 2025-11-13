import React, { useState } from 'react';
import { TeacherProfile, Classroom, Student, Report, HomepageContent, Lesson, Assignment, Grade, BehaviorNote, PointLog, AttendanceRecord } from '../../types.ts';
import { ToastProps } from '../Toast.tsx';
import AdminHeader from './AdminHeader.tsx';
import AdminSidebar from './AdminSidebar.tsx';
import AdminOverviewView from './views/AdminOverviewView.tsx';
import AdminUsersView from './views/AdminUsersView.tsx';
import AdminAllDataView from './views/AdminAllDataView.tsx';
import AdminContentView from './views/AdminContentView.tsx';
import AdminProfileView from './views/AdminProfileView.tsx';
import AdminUserDetailView from './views/AdminUserDetailView.tsx';
import AdminStudentDetailView from './views/AdminStudentDetailView.tsx';
import { XMarkIcon } from '../icons/Icons.tsx';

export type AdminPage = 'overview' | 'users' | 'data' | 'content' | 'profile';

interface AdminDashboardProps {
  admin: TeacherProfile;
  users: TeacherProfile[];
  allClassrooms: Classroom[];
  allStudents: Student[];
  allReports: Report[];
  allLessons: Lesson[];
  allAssignments: Assignment[];
  allGrades: Grade[];
  allBehaviorNotes: BehaviorNote[];
  allPointLogs: PointLog[];
  allAttendanceRecords: AttendanceRecord[];
  homepageContent: HomepageContent[];
  websiteLogo: string | null;
  onUpdateUser: (userId: string, data: Partial<TeacherProfile>) => void;
  onDeleteUser: (userId: string) => void;
  onDeleteStudent: (studentId: string) => void;
  onDeleteReport: (reportId: string) => void;
  onUpdateLogo: (logoUrl: string) => void;
  onUpdateHomepageContent: (content: HomepageContent[]) => void;
  onLogout: () => void;
  setToast: (toast: Omit<ToastProps, 'onDismiss'>) => void;
}

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="font-semibold text-slate-700 dark:text-slate-200">{value || 'N/A'}</p>
    </div>
);


const ReportDetailModal: React.FC<{
  report: Report;
  student: Student | undefined;
  teacher: TeacherProfile | undefined;
  onClose: () => void;
}> = ({ report, student, teacher, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
            <div>
                <h3 className="text-lg font-bold">Report Details</h3>
                <p className="text-sm text-slate-500">For {student?.name || 'Unknown Student'} by {teacher?.full_name || 'Unknown Teacher'}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><XMarkIcon className="w-5 h-5"/></button>
        </div>
        <div className="overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailItem label="Report Period" value={`${report.start_date} to ${report.end_date}`} />
                <DetailItem label="Audience" value={report.audience} />
                <DetailItem label="Created At" value={new Date(report.created_at).toLocaleString()} />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">Teacher's Selections (Behavior Tags)</p>
                <div className="flex flex-wrap gap-2 mt-2">
                    {(report.behavior_tags || [report.behavior, report.participation, report.attitude, report.progress]).filter(Boolean).map(tag => (
                        <span key={tag} className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-200 dark:bg-slate-700 capitalize">{tag?.replace(/_/g, ' ')}</span>
                    ))}
                </div>
            </div>
             <div>
                <p className="text-sm font-medium text-slate-500">Teacher's Comments</p>
                <p className="mt-1 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md whitespace-pre-wrap">{report.comments || 'No comments provided.'}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const [page, setPage] = useState<AdminPage>('overview');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  const navigateToPage = (p: AdminPage) => {
    setPage(p);
    setSelectedUserId(null);
    setSelectedStudentId(null);
  };
  
  const handleViewReportDetails = (reportId: string) => {
    const report = props.allReports.find(r => r.id === reportId);
    if (report) {
        setViewingReport(report);
    }
  };

  const renderContent = () => {
    if (selectedStudentId) {
        const student = props.allStudents.find(s => s.id === selectedStudentId);
        if (!student) {
            setSelectedStudentId(null);
            return null;
        }
        const classroom = props.allClassrooms.find(c => c.id === student.classroom_id);
        const teacher = props.users.find(u => u.id === classroom?.user_id);
        
        return <AdminStudentDetailView 
            student={student}
            classroom={classroom}
            teacher={teacher}
            assignments={props.allAssignments.filter(a => a.classroom_id === student.classroom_id)}
            grades={props.allGrades.filter(g => g.student_id === student.id)}
            attendanceRecords={props.allAttendanceRecords.filter(a => a.student_id === student.id)}
            pointLogs={props.allPointLogs.filter(p => p.student_id === student.id)}
            behaviorNotes={props.allBehaviorNotes.filter(b => b.student_id === student.id)}
            reports={props.allReports.filter(r => r.student_id === student.id)}
            onBack={() => setSelectedStudentId(null)}
            onViewReportDetails={handleViewReportDetails}
        />
    }

    switch (page) {
      case 'overview':
        return <AdminOverviewView users={props.users} classrooms={props.allClassrooms} students={props.allStudents} reports={props.allReports} />;
      case 'users':
        if (selectedUserId) {
            const selectedUser = props.users.find(u => u.id === selectedUserId);
            if (!selectedUser) {
                setSelectedUserId(null); // User not found, go back to list
                return null;
            }
            const userClassrooms = props.allClassrooms.filter(c => c.user_id === selectedUserId);
            const userClassroomIds = new Set(userClassrooms.map(c => c.id));
            const userStudents = props.allStudents.filter(s => userClassroomIds.has(s.classroom_id));
            const userLessons = props.allLessons.filter(l => userClassroomIds.has(l.classroom_id));

            return <AdminUserDetailView 
                user={selectedUser}
                classrooms={userClassrooms}
                students={userStudents}
                reports={props.allReports.filter(r => r.user_id === selectedUserId)}
                lessons={userLessons}
                onBack={() => setSelectedUserId(null)}
                onViewStudentDetails={setSelectedStudentId}
                onViewReportDetails={handleViewReportDetails}
            />
        }
        return <AdminUsersView users={props.users} onUpdateUser={props.onUpdateUser} onDeleteUser={props.onDeleteUser} setToast={props.setToast} onViewDetails={setSelectedUserId} />;
      case 'data':
        return <AdminAllDataView students={props.allStudents} reports={props.allReports} users={props.users} classrooms={props.allClassrooms} onDeleteStudent={props.onDeleteStudent} onDeleteReport={props.onDeleteReport} onViewStudentDetails={setSelectedStudentId} onViewReportDetails={handleViewReportDetails} />;
      case 'content':
        return <AdminContentView homepageContent={props.homepageContent} websiteLogo={props.websiteLogo} onUpdateLogo={props.onUpdateLogo} onUpdateHomepageContent={props.onUpdateHomepageContent} />;
      case 'profile':
        return <AdminProfileView admin={props.admin} onUpdateProfile={props.onUpdateUser} />;
      default:
        return <div>Select a page</div>;
    }
  };
  
  const viewingReportData = viewingReport ? {
      report: viewingReport,
      student: props.allStudents.find(s => s.id === viewingReport.student_id),
      teacher: props.users.find(u => u.id === viewingReport.user_id),
  } : null;

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <AdminSidebar page={page} setPage={navigateToPage} onLogout={props.onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader admin={props.admin} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-8">
          <div className="animate-page-enter">
            {renderContent()}
          </div>
        </main>
      </div>
      {viewingReportData && (
          <ReportDetailModal 
              report={viewingReportData.report}
              student={viewingReportData.student}
              teacher={viewingReportData.teacher}
              onClose={() => setViewingReport(null)}
          />
      )}
    </div>
  );
};

export default AdminDashboard;