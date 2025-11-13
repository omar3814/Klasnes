import React, { useState, useMemo } from 'react';
import { Student, Report, TeacherProfile, Classroom } from '../../../types';
import { UserCircleIcon, TrashIcon, ArrowDownIcon, ArrowUpIcon } from '../../icons/Icons';

interface AdminAllDataViewProps {
  students: Student[];
  reports: Report[];
  users: TeacherProfile[];
  classrooms: Classroom[];
  onDeleteStudent: (studentId: string) => void;
  onDeleteReport: (reportId: string) => void;
  onViewStudentDetails: (studentId: string) => void;
  onViewReportDetails: (reportId: string) => void;
}

const AdminAllDataView: React.FC<AdminAllDataViewProps> = ({ students, reports, users, classrooms, onDeleteStudent, onDeleteReport, onViewStudentDetails, onViewReportDetails }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'reports'>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);

  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const classroomMap = useMemo(() => new Map(classrooms.map(c => [c.id, c])), [classrooms]);
  const studentNameMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);

  const teacherData = useMemo(() => {
    return users.filter(u => u.role === 'user').map(teacher => {
        const teacherClassrooms = classrooms.filter(c => c.user_id === teacher.id);
        const teacherStudents = students.filter(s => teacherClassrooms.some(c => c.id === s.classroom_id));
        return { teacher, classrooms: teacherClassrooms, students: teacherStudents };
    }).filter(data => data.students.length > 0 && (
        !searchTerm ||
        data.teacher.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.students.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ));
  }, [users, classrooms, students, searchTerm]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
        const studentName = studentNameMap.get(r.student_id);
        const teacherName = userMap.get(r.user_id)?.full_name;
        const search = searchTerm.toLowerCase();

        return !search ||
            (studentName && studentName.toLowerCase().includes(search)) ||
            (teacherName && teacherName.toLowerCase().includes(search));
    });
  }, [reports, studentNameMap, userMap, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">All Platform Data</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Browse, search, and manage all data across user accounts.</p>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
            <div className="flex items-center gap-2">
                <button onClick={() => setActiveTab('students')} className={`px-4 py-2 text-sm font-semibold rounded-lg ${activeTab === 'students' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>Students</button>
                <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 text-sm font-semibold rounded-lg ${activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>Reports</button>
            </div>
            <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                className="p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
            />
        </div>

        {activeTab === 'students' && (
            <div className="space-y-2">
                {teacherData.map(({ teacher, students: teacherStudents, classrooms: teacherClassrooms }) => (
                    <div key={teacher.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        <button onClick={() => setExpandedTeacherId(expandedTeacherId === teacher.id ? null : teacher.id)} className="w-full flex justify-between items-center p-4 font-semibold text-left">
                            <span>{teacher.full_name} ({teacherStudents.length} students in {teacherClassrooms.length} classes)</span>
                            {expandedTeacherId === teacher.id ? <ArrowUpIcon className="w-5 h-5"/> : <ArrowDownIcon className="w-5 h-5"/>}
                        </button>
                        {expandedTeacherId === teacher.id && (
                            <div className="p-4 border-t border-slate-200 dark:border-slate-600">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-slate-500 dark:text-slate-400"><tr><th className="p-2">Student</th><th className="p-2">Classroom</th><th className="p-2">Grade</th><th className="p-2"></th></tr></thead>
                                    <tbody>
                                        {teacherStudents.map(student => (
                                            <tr key={student.id} className="border-b border-slate-200 dark:border-slate-600 last:border-0">
                                                <td className="p-2">
                                                    <button onClick={() => onViewStudentDetails(student.id)} className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 hover:underline">
                                                        {student.avatar_url ? <img src={student.avatar_url} className="w-8 h-8 rounded-full" /> : <UserCircleIcon className="w-8 h-8 text-slate-300"/>}
                                                        {student.name}
                                                    </button>
                                                </td>
                                                <td className="p-2">{classroomMap.get(student.classroom_id)?.name || 'N/A'}</td>
                                                <td className="p-2">{student.grade_level}</td>
                                                <td className="p-2 text-right"><button onClick={() => onDeleteStudent(student.id)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
        {activeTab === 'reports' && (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-left text-slate-500 dark:text-slate-400"><tr><th className="p-3">Report Date</th><th className="p-3">Student</th><th className="p-3">Teacher</th><th className="p-3">Audience</th><th className="p-3"></th></tr></thead>
                <tbody>
                {filteredReports.map(report => {
                    const student = students.find(s => s.id === report.student_id);
                    const teacher = userMap.get(report.user_id);
                    return (
                        <tr key={report.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                            <td className="p-3">{report.end_date}</td>
                            <td className="p-3">
                                <button onClick={() => onViewReportDetails(report.id)} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                    {student?.name || 'N/A'}
                                </button>
                            </td>
                            <td className="p-3">{teacher?.full_name || 'N/A'}</td>
                            <td className="p-3 capitalize">{report.audience}</td>
                            <td className="p-3 text-right"><button onClick={() => onDeleteReport(report.id)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button></td>
                        </tr>
                    )
                })}
                </tbody>
            </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default AdminAllDataView;