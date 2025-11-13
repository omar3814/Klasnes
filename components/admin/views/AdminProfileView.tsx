import React, { useState, useEffect } from 'react';
import { TeacherProfile } from '../../../types';
import { UserCircleIcon } from '../../icons/Icons';

interface AdminProfileViewProps {
    admin: TeacherProfile;
    onUpdateProfile: (userId: string, profileData: Partial<TeacherProfile>) => void;
}

const AdminProfileView: React.FC<AdminProfileViewProps> = ({ admin, onUpdateProfile }) => {
    const [formData, setFormData] = useState<Partial<TeacherProfile>>(admin);

    useEffect(() => {
        setFormData(admin);
    }, [admin]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile(admin.id, formData);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Profile</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your administrator account details.</p>
            </div>
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 max-w-2xl space-y-6">
                 <div className="flex items-center gap-6">
                    {formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="Profile" className="w-24 h-24 rounded-full object-cover bg-muted" />
                    ) : (
                        <UserCircleIcon className="w-24 h-24 text-slate-400" />
                    )}
                    <div>
                        <h2 className="text-2xl font-bold">{formData.full_name}</h2>
                        <p className="text-slate-500">{formData.title}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
                        <input name="full_name" type="text" value={formData.full_name} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Title</label>
                        <input name="title" type="text" value={formData.title} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" />
                    </div>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Contact Email</label>
                        <input name="contact_email" type="email" value={formData.contact_email} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">School</label>
                        <input name="school" type="text" value={formData.school} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="px-6 py-2.5 font-semibold bg-indigo-600 text-white rounded-lg">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminProfileView;
