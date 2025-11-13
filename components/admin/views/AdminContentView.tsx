import React, { useState, useRef } from 'react';
import { HomepageContent } from '../../../types';
import { PhotoIcon, DocumentTextIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, VideoCameraIcon } from '../../icons/Icons';

interface AdminContentViewProps {
  homepageContent: HomepageContent[];
  websiteLogo: string | null;
  onUpdateLogo: (logoUrl: string) => void;
  onUpdateHomepageContent: (content: HomepageContent[]) => void;
}

const AdminContentView: React.FC<AdminContentViewProps> = ({ homepageContent, websiteLogo, onUpdateLogo, onUpdateHomepageContent }) => {
  const [logoUrl, setLogoUrl] = useState(websiteLogo || '');
  const [content, setContent] = useState<HomepageContent[]>(homepageContent);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ id: string; type: 'image' | 'video' } | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoUrl(result);
        onUpdateLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAddContent = (type: 'text' | 'image' | 'video') => {
    const newContent: HomepageContent = {
        id: `hc-${Date.now()}`,
        type,
        content: type === 'text' ? 'New text block...' : '',
        order: content.length
    };
    const updatedContent = [...content, newContent];
    setContent(updatedContent);
    onUpdateHomepageContent(updatedContent);
  };
  
  const handleContentTextChange = (id: string, newText: string) => {
    const updatedContent = content.map(item => item.id === id ? { ...item, content: newText } : item);
    setContent(updatedContent);
    onUpdateHomepageContent(updatedContent);
  };

  const handleTriggerContentUpload = (id: string, type: 'image' | 'video') => {
    setUploadTarget({ id, type });
    contentFileInputRef.current?.click();
  };

  const handleContentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && uploadTarget) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const updatedContent = content.map(item => item.id === uploadTarget.id ? { ...item, content: result } : item);
        setContent(updatedContent);
        onUpdateHomepageContent(updatedContent);
      };
      reader.readAsDataURL(file);
    }
    setUploadTarget(null);
    if(e.target) e.target.value = '';
  };


  const handleMoveContent = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === content.length - 1)) {
      return;
    }
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newContent = [...content];
    [newContent[index], newContent[newIndex]] = [newContent[newIndex], newContent[index]]; // Swap
    const reorderedContent = newContent.map((item, idx) => ({ ...item, order: idx }));
    setContent(reorderedContent);
    onUpdateHomepageContent(reorderedContent);
  };
  
  const handleDeleteContent = (id: string) => {
    const updatedContent = content.filter(item => item.id !== id);
    setContent(updatedContent);
    onUpdateHomepageContent(updatedContent);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Website Content</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Customize the logo and homepage content.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold mb-4">Website Logo</h2>
        <div className="flex items-center gap-6">
            <div className="w-48 h-24 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                {logoUrl && <img src={logoUrl} alt="Current Logo" className="max-h-full max-w-full object-contain"/>}
            </div>
            <button onClick={() => logoFileInputRef.current?.click()} className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg">Upload New Logo</button>
            <input type="file" ref={logoFileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden"/>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold mb-4">Homepage Content</h2>
        <div className="space-y-4">
            {content.sort((a,b) => a.order - b.order).map((item, index) => (
                <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 flex gap-4">
                    <div className="flex flex-col gap-1">
                        <button onClick={() => handleMoveContent(index, 'up')} disabled={index === 0} className="p-1 disabled:opacity-30"><ArrowUpIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleMoveContent(index, 'down')} disabled={index === content.length-1} className="p-1 disabled:opacity-30"><ArrowDownIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleDeleteContent(item.id)} className="p-1 text-red-500"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                    <div className="flex-grow">
                        {item.type === 'text' ? (
                            <textarea value={item.content} onChange={e => handleContentTextChange(item.id, e.target.value)} className="w-full h-24 p-2 bg-white dark:bg-slate-700 rounded-md border"/>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {item.content ? (
                                    item.type === 'image' ? (
                                        <img src={item.content} alt="Content" className="w-48 rounded-md"/>
                                    ) : (
                                        <video src={item.content} controls className="w-full max-w-sm rounded-md" />
                                    )
                                ) : (
                                    <div className="w-48 h-24 bg-slate-200 dark:bg-slate-600 rounded-md flex items-center justify-center text-slate-500">
                                        {item.type === 'image' ? <PhotoIcon className="w-8 h-8"/> : <VideoCameraIcon className="w-8 h-8"/>}
                                    </div>
                                )}
                                <button onClick={() => handleTriggerContentUpload(item.id, item.type)} className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-600 rounded-md self-start">
                                    Upload New {item.type === 'image' ? 'Image' : 'Video'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
        <div className="flex gap-4 mt-6">
            <button onClick={() => handleAddContent('text')} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-200 dark:bg-slate-700 rounded-lg"><DocumentTextIcon className="w-5 h-5"/> Add Text Block</button>
            <button onClick={() => handleAddContent('image')} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-200 dark:bg-slate-700 rounded-lg"><PhotoIcon className="w-5 h-5"/> Add Image</button>
            <button onClick={() => handleAddContent('video')} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-200 dark:bg-slate-700 rounded-lg"><VideoCameraIcon className="w-5 h-5"/> Add Video</button>
        </div>
      </div>
      <input type="file" ref={contentFileInputRef} onChange={handleContentFileChange} accept={uploadTarget?.type === 'image' ? 'image/*' : 'video/*'} className="hidden"/>
    </div>
  );
};

export default AdminContentView;