import React from 'react';
import { TeacherProfile } from '../../types.ts';
import { UserCircleIcon } from '../icons/Icons.tsx';

interface AdminHeaderProps {
    admin: TeacherProfile;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ admin }) => {
    return (
        <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
            <div className="px-8 h-16 flex justify-end items-center">
                 <div className="flex items-center gap-3">
                    <span className="text-sm font-medium hidden sm:inline">{admin.full_name}</span>
                    {admin.avatar_url ? (
                        <img src={admin.avatar_url} alt="Admin" className="w-9 h-9 rounded-full object-cover"/>
                    ) : (
                        <UserCircleIcon className="w-9 h-9 text-slate-500"/>
                    )}
                 </div>
            </div>
        </header>
    );
};

export default AdminHeader;