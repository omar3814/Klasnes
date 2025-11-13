import React from 'react';
import { AdminPage } from './AdminDashboard.tsx';
import { ChartPieIcon, UsersIcon, CircleStackIcon, PhotoIcon, UserCircleIcon, ArrowLeftOnRectangleIcon, ShieldCheckIcon } from '../icons/Icons.tsx';

interface AdminSidebarProps {
  page: AdminPage;
  setPage: (page: AdminPage) => void;
  onLogout: () => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <li>
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
        isActive
          ? 'bg-indigo-600 text-white shadow-lg'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  </li>
);

const AdminSidebar: React.FC<AdminSidebarProps> = ({ page, setPage, onLogout }) => {
  const navItems: { id: AdminPage; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <ChartPieIcon className="w-5 h-5" /> },
    { id: 'users', label: 'Manage Users', icon: <UsersIcon className="w-5 h-5" /> },
    { id: 'data', label: 'All Data', icon: <CircleStackIcon className="w-5 h-5" /> },
    { id: 'content', label: 'Website Content', icon: <PhotoIcon className="w-5 h-5" /> },
    { id: 'profile', label: 'My Profile', icon: <UserCircleIcon className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-800 text-white flex flex-col">
      <div className="h-16 flex items-center justify-center px-4 border-b border-slate-700">
        <div className="flex items-center gap-2 text-xl font-bold">
            <ShieldCheckIcon className="w-7 h-7 text-indigo-400" />
            Admin Panel
        </div>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={page === item.id}
              onClick={() => setPage(item.id)}
            />
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;