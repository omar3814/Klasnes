import React, { useState } from 'react';
import { Classroom } from '../types';
import { PlusIcon, BookOpenIcon } from './icons/Icons.tsx';

interface ClassManagerProps {
  classrooms: Classroom[];
  selectedClassroomId: string | null;
  onCreateClass: (name: string) => Promise<void>;
  onSelectClass: (id: string) => void;
}

const ClassManager: React.FC<ClassManagerProps> = ({ classrooms, selectedClassroomId, onCreateClass, onSelectClass }) => {
    const [newClassName, setNewClassName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (newClassName.trim() && !isCreating) {
            setIsCreating(true);
            await onCreateClass(newClassName.trim());
            setNewClassName('');
            setIsCreating(false);
        }
    };

    return (
        <div>
            <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <BookOpenIcon className="w-6 h-6" />
                Manage Classes
            </h2>
            <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="New class name..."
                        className="flex-grow p-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        disabled={isCreating}
                    />
                    <button
                        onClick={handleCreate}
                        disabled={isCreating || !newClassName.trim()}
                        className="flex-shrink-0 bg-primary text-primary-foreground p-2.5 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring dark:focus:ring-offset-background transition-colors disabled:opacity-50"
                        aria-label="Create new class"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
                {classrooms.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium text-muted-foreground">Your classes:</p>
                        <div className="flex flex-wrap gap-2">
                            {classrooms.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => onSelectClass(c.id)}
                                    className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 ease-in-out hover:scale-105 ${
                                        selectedClassroomId === c.id 
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                    }`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                 {classrooms.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground py-4">
                        Create your first class to begin.
                    </p>
                )}
            </div>
        </div>
    );
};

export default ClassManager;