import React, { useState, useEffect, useRef } from 'react';
import { TeacherProfile } from '../../types';
import { UserCircleIcon, UploadIcon, SparklesIcon } from '../icons/Icons.tsx';

interface TeacherProfileViewProps {
    profile: TeacherProfile | null;
    onUpdateProfile: (profileData: Omit<TeacherProfile, 'id'>) => void;
}

const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({ profile, onUpdateProfile }) => {
    const [formData, setFormData] = useState<Omit<TeacherProfile, 'id'>>({
        full_name: '', title: '', school: '', contact_email: '', phone: '', avatar_url: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                title: profile.title || '',
                school: profile.school || '',
                contact_email: profile.contact_email || '',
                phone: profile.phone || '',
                avatar_url: profile.avatar_url || ''
            });
        }
    }, [profile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0] && profile) {
          const file = event.target.files[0];
          const localUrl = URL.createObjectURL(file);
          setFormData(prev => ({ ...prev, avatar_url: localUrl }));
      }
      event.target.value = '';
    };
  
    const handleGenerateAvatar = () => {
        const seed = encodeURIComponent(formData.full_name || 'Teacher');
        const avatarUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${seed}`;
        setFormData(prev => ({...prev, avatar_url: avatarUrl}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        onUpdateProfile(formData);
        setIsSaving(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl shadow-lg shadow-black/5 border border-border space-y-6">
                <div className="flex items-center gap-6">
                    {formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="Profile" className="w-24 h-24 rounded-full object-cover bg-muted" />
                    ) : (
                        <UserCircleIcon className="w-24 h-24 text-muted-foreground" />
                    )}
                    <div className="flex flex-col gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg">
                           <UploadIcon className="w-4 h-4" /> Upload Photo
                        </button>
                         <button type="button" onClick={handleGenerateAvatar} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg">
                           <SparklesIcon className="w-4 h-4" /> Generate from Name
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
                        <input id="full_name" name="full_name" type="text" value={formData.full_name} onChange={handleInputChange} className="w-full p-2 bg-input border rounded-lg" />
                    </div>
                     <div>
                        <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">Title / Position</label>
                        <input id="title" name="title" type="text" value={formData.title} onChange={handleInputChange} placeholder="e.g., 4th Grade Teacher" className="w-full p-2 bg-input border rounded-lg" />
                    </div>
                </div>

                <div>
                    <label htmlFor="school" className="block text-sm font-medium text-muted-foreground mb-1">School / Institution</label>
                    <input id="school" name="school" type="text" value={formData.school} onChange={handleInputChange} className="w-full p-2 bg-input border rounded-lg" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="contact_email" className="block text-sm font-medium text-muted-foreground mb-1">Contact Email</label>
                        <input id="contact_email" name="contact_email" type="email" value={formData.contact_email} onChange={handleInputChange} className="w-full p-2 bg-input border rounded-lg" />
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-1">Phone (Optional)</label>
                        <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="w-full p-2 bg-input border rounded-lg" />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={isSaving} className="px-6 py-2.5 font-semibold bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden"/>
        </div>
    );
};

export default TeacherProfileView;