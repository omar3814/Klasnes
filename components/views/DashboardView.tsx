import React from 'react';
import { Page } from '../../App';
import NavButton from '../navigation/NavButton';

interface DashboardViewProps {
  navigateTo: (page: Page) => void;
  classrooms: number;
  selectedClassroom: boolean;
}

const DashboardView: React.FC<DashboardViewProps> = ({ navigateTo, classrooms, selectedClassroom }) => {
  const navItems = [
    { page: 'students' as Page, label: 'Students', icon: <span className="text-4xl" role="img" aria-label="Students">👥</span>, color: 'from-cyan-400 to-blue-500' },
    { page: 'assignments' as Page, label: 'Assignments', icon: <span className="text-4xl" role="img" aria-label="Assignments">📝</span>, color: 'from-purple-500 to-indigo-600' },
    { page: 'schedule' as Page, label: 'Weekly Schedule', icon: <span className="text-4xl" role="img" aria-label="Weekly Schedule">🗓️</span>, color: 'from-rose-500 to-pink-600' },
    { page: 'attendance' as Page, label: 'Attendance', icon: <span className="text-4xl" role="img" aria-label="Attendance">✅</span>, color: 'from-emerald-400 to-teal-500' },
    { page: 'layout' as Page, label: 'Seating Layout', icon: <span className="text-4xl" role="img" aria-label="Seating Layout">🧑‍🏫</span>, color: 'from-amber-400 to-orange-500' },
    { page: 'points' as Page, label: 'Points & Behavior', icon: <span className="text-4xl" role="img" aria-label="Points & Behavior">⭐</span>, color: 'from-yellow-300 to-amber-400' },
    { page: 'groups' as Page, label: 'Group Manager', icon: <span className="text-4xl" role="img" aria-label="Group Manager">👨‍👩‍👧‍👦</span>, color: 'from-sky-400 to-cyan-500' },
    { page: 'reports' as Page, label: 'Report Creator', icon: <span className="text-4xl" role="img" aria-label="Report Creator">📄</span>, color: 'from-fuchsia-500 to-purple-600' },
    { page: 'whiteboard' as Page, label: 'Whiteboard', icon: <span className="text-4xl" role="img" aria-label="Whiteboard">🎨</span>, color: 'from-lime-400 to-green-500' },
  ];
  
  const profileItem = { page: 'profile' as Page, label: 'Your Profile', icon: <span className="text-4xl" role="img" aria-label="Your Profile">👤</span>, color: 'from-slate-500 to-gray-600' };

  if (classrooms === 0) {
    return (
        <div className="text-center py-16 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome to your Dashboard</h1>
              <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Create a class in the top-left to get started.</p>
            </div>
            <div className="max-w-xs mx-auto">
              <NavButton {...profileItem} onClick={() => navigateTo(profileItem.page)} />
            </div>
        </div>
    );
  }
  
  if (!selectedClassroom) {
     return (
        <div className="text-center py-16 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Select a Classroom</h1>
              <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Please select a class from the manager to view its dashboard.</p>
            </div>
            <div className="max-w-xs mx-auto">
               <NavButton {...profileItem} onClick={() => navigateTo(profileItem.page)} />
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Classroom Dashboard</h1>
        <p className="text-lg text-muted-foreground mt-2">Select a tool to get started.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {navItems.map(item => (
          <NavButton key={item.page} onClick={() => navigateTo(item.page)} icon={item.icon} label={item.label} color={item.color} />
        ))}
        <NavButton {...profileItem} onClick={() => navigateTo(profileItem.page)} />
      </div>
    </div>
  );
};

export default DashboardView;