import React, { useState, useMemo } from 'react';
import { TeacherProfile } from '../../../types';
import { ToastProps } from '../../Toast';
import { UserCircleIcon, PencilIcon, TrashIcon, ShieldCheckIcon, KeyIcon, XMarkIcon, CheckIcon } from '../../icons/Icons';

interface AdminUsersViewProps {
  users: TeacherProfile[];
  onUpdateUser: (userId: string, data: Partial<TeacherProfile>) => void;
  onDeleteUser: (userId: string) => void;
  setToast: (toast: Omit<ToastProps, 'onDismiss'>) => void;
  onViewDetails: (userId: string) => void;
}

const AdminUsersView: React.FC<AdminUsersViewProps> = ({ users, onUpdateUser, onDeleteUser, setToast, onViewDetails }) => {
  const [filter, setFilter] = useState<'all' | 'admins' | 'users'>('all');
  const [editingUser, setEditingUser] = useState<TeacherProfile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TeacherProfile | null>(null);

  const filteredUsers = useMemo(() => {
    if (filter === 'admins') return users.filter(u => u.role === 'admin');
    if (filter === 'users') return users.filter(u => u.role === 'user');
    return users;
  }, [users, filter]);

  const handlePromote = (user: TeacherProfile) => {
    onUpdateUser(user.id, { role: 'admin' });
    setToast({ type: 'success', message: `${user.full_name} has been promoted to Admin.` });
  };
  
  const handleDemote = (user: TeacherProfile) => {
    // Prevent last admin from being demoted
    if (users.filter(u => u.role === 'admin').length <= 1) {
        setToast({ type: 'error', message: 'Cannot demote the last admin.' });
        return;
    }
    onUpdateUser(user.id, { role: 'user' });
    setToast({ type: 'info', message: `${user.full_name} has been demoted to User.` });
  };

  const handleResetPassword = (user: TeacherProfile) => {
    // In a real app, this would trigger a Supabase password reset email.
    setToast({ type: 'info', message: `A password reset link would be sent to ${user.contact_email}.` });
  };
  
  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    const formData = new FormData(e.currentTarget);
    const updatedData = {
        full_name: formData.get('full_name') as string,
        contact_email: formData.get('contact_email') as string,
        school: formData.get('school') as string,
        title: formData.get('title') as string,
    }
    onUpdateUser(editingUser.id, updatedData);
    setEditingUser(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Users</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">View, edit, and manage all user accounts.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-semibold rounded-lg ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>All Users</button>
            <button onClick={() => setFilter('admins')} className={`px-4 py-2 text-sm font-semibold rounded-lg ${filter === 'admins' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>Admins</button>
            <button onClick={() => setFilter('users')} className={`px-4 py-2 text-sm font-semibold rounded-lg ${filter === 'users' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>Regular Users</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="p-3 font-semibold">User</th>
                <th className="p-3 font-semibold">Contact</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name} className="w-9 h-9 rounded-full"/> : <UserCircleIcon className="w-9 h-9 text-slate-400"/>}
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{user.full_name}</div>
                        <div className="text-slate-500">{user.school}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{user.contact_email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-300'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onViewDetails(user.id)} className="px-3 py-1.5 text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 rounded-md hover:bg-indigo-200">
                          View Details
                      </button>
                      {user.role === 'user' ? (
                        <button onClick={() => handlePromote(user)} title="Promote to Admin" className="p-2 text-slate-500 hover:text-indigo-600"><ShieldCheckIcon className="w-5 h-5"/></button>
                      ) : (
                        <button onClick={() => handleDemote(user)} title="Demote to User" className="p-2 text-slate-500 hover:text-amber-600"><ShieldCheckIcon className="w-5 h-5"/></button>
                      )}
                      <button onClick={() => handleResetPassword(user)} title="Reset Password" className="p-2 text-slate-500 hover:text-sky-600"><KeyIcon className="w-5 h-5"/></button>
                      <button onClick={() => setEditingUser(user)} title="Edit User" className="p-2 text-slate-500 hover:text-green-600"><PencilIcon className="w-5 h-5"/></button>
                      <button onClick={() => setConfirmDelete(user)} title="Delete User" className="p-2 text-slate-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Edit User: {editingUser.full_name}</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">Full Name</label>
                        <input name="full_name" defaultValue={editingUser.full_name} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <input name="contact_email" type="email" defaultValue={editingUser.contact_email} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600" />
                    </div>
                     <div>
                        <label className="text-sm font-medium">School</label>
                        <input name="school" defaultValue={editingUser.school} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Title</label>
                        <input name="title" defaultValue={editingUser.title} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600" />
                    </div>
               </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm font-semibold bg-slate-200 dark:bg-slate-700 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-red-600">Are you sure?</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">You are about to delete <strong>{confirmDelete.full_name}</strong>. This will also delete all of their classrooms, students, and associated data. This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
               <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-semibold bg-slate-200 dark:bg-slate-700 rounded-lg">Cancel</button>
               <button onClick={() => { onDeleteUser(confirmDelete.id); setConfirmDelete(null); }} className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg">Confirm Delete</button>
            </div>
          </div>
         </div>
      )}

    </div>
  );
};

export default AdminUsersView;