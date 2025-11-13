import React from 'react';
import { TeacherProfile, Classroom, Student, Report } from '../../../types';
import { UsersIcon, BookOpenIcon, AcademicCapIcon, DocumentTextIcon } from '../../icons/Icons';

interface AdminOverviewViewProps {
  users: TeacherProfile[];
  classrooms: Classroom[];
  students: Student[];
  reports: Report[];
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex items-center gap-6">
    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-4xl font-bold text-slate-900 dark:text-white">{value}</p>
      <h3 className="text-slate-500 dark:text-slate-400 font-semibold">{title}</h3>
    </div>
  </div>
);

const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ users, classrooms, students, reports }) => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">A high-level view of all activity on the platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={users.filter(u => u.role === 'user').length} 
          icon={<UsersIcon className="w-8 h-8 text-white" />} 
          color="bg-sky-500"
        />
        <StatCard 
          title="Total Classrooms" 
          value={classrooms.length} 
          icon={<BookOpenIcon className="w-8 h-8 text-white" />} 
          color="bg-emerald-500"
        />
        <StatCard 
          title="Total Students" 
          value={students.length} 
          icon={<AcademicCapIcon className="w-8 h-8 text-white" />} 
          color="bg-amber-500"
        />
        <StatCard 
          title="Total Reports" 
          value={reports.length} 
          icon={<DocumentTextIcon className="w-8 h-8 text-white" />} 
          color="bg-rose-500"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Activity Feed</h2>
        <p className="text-slate-500 dark:text-slate-400">
            A live feed of actions across the platform would be displayed here in a full implementation.
        </p>
      </div>
    </div>
  );
};

export default AdminOverviewView;
