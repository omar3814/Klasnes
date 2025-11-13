import React, { useState } from 'react';
import { Student, Group, GenerateOptions } from '../types';
import { UsersIcon, ShuffleIcon, SparklesIcon, UserCircleIcon } from './icons/Icons.tsx';
import { generateGroupNames } from '../services/geminiService';

interface GroupGeneratorProps {
  students: Student[];
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  isGeneratingGroups: boolean;
  onGenerateGroups: (students: Student[], options: GenerateOptions) => Group[];
  onGenerateAIGroups: (prompt: string) => Promise<void>;
  onClearGroups: () => void;
}

const GroupGenerator: React.FC<GroupGeneratorProps> = ({
  students,
  groups,
  setGroups,
  isGeneratingGroups,
  onGenerateGroups,
  onGenerateAIGroups,
  onClearGroups,
}) => {
  const [genType, setGenType] = useState<'groupCount' | 'studentCount'>('groupCount');
  const [genValue, setGenValue] = useState<number>(3);
  const [avoidPrevious, setAvoidPrevious] = useState<boolean>(false);
  const [autoNameGroups, setAutoNameGroups] = useState<boolean>(true);
  const [isManualGenerating, setIsManualGenerating] = useState(false);

  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [aiPrompt, setAiPrompt] = useState('');

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (students.length === 0 || !genValue || genValue <= 0) return;
    setIsManualGenerating(true);

    const options: GenerateOptions = {
      type: genType,
      value: genValue,
      avoidPrevious,
    };
    const newGroups = onGenerateGroups(students, options);

    if (autoNameGroups && newGroups.length > 0) {
      try {
        const studentNameGroups = newGroups.map(g => g.students.map(s => s.name));
        const newNames = await generateGroupNames(studentNameGroups);
        if (newNames.length === newGroups.length) {
          const updatedGroups = newGroups.map((group, i) => ({ ...group, name: newNames[i] }));
          setGroups(updatedGroups);
        }
      } catch (error) {
        console.error('Failed to generate group names:', error);
      }
    }
    
    setIsManualGenerating(false);
  };
  
  const handleAIGenerate = () => {
    if (!aiPrompt.trim() || students.length === 0 || isGeneratingGroups) return;
    onGenerateAIGroups(aiPrompt);
  };

  const handleEditName = (group: Group) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const handleSaveName = () => {
    if (!editingGroupId) return;
    setGroups(prev => prev.map(g => g.id === editingGroupId ? { ...g, name: editingGroupName } : g));
    setEditingGroupId(null);
  };
  
  const handleStudentDragStart = (e: React.DragEvent, studentId: string, sourceGroupId: string) => {
    e.dataTransfer.setData('studentId', studentId);
    e.dataTransfer.setData('sourceGroupId', sourceGroupId);
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    setDragOverGroupId(null);
    const studentId = e.dataTransfer.getData('studentId');
    const sourceGroupId = e.dataTransfer.getData('sourceGroupId');

    if (!studentId || !sourceGroupId || sourceGroupId === targetGroupId) return;

    setGroups(prevGroups => {
        let studentToMove: Student | undefined;
        
        const newGroups = prevGroups.map(group => {
            if (group.id === sourceGroupId) {
                studentToMove = group.students.find(s => s.id === studentId);
                return { ...group, students: group.students.filter(s => s.id !== studentId) };
            }
            return group;
        });

        if (studentToMove) {
            return newGroups.map(group => {
                if (group.id === targetGroupId) {
                    return { ...group, students: [...group.students, studentToMove!] };
                }
                return group;
            });
        }
        return prevGroups;
    });
  };

  const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors focus:outline-none ${
        active
          ? 'text-violet-600 dark:text-violet-400 border-violet-600'
          : 'text-zinc-500 dark:text-slate-400 border-transparent hover:border-zinc-300 dark:hover:border-slate-600'
      }`}
    >
      <span className="flex items-center gap-2">{children}</span>
    </button>
  );

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg shadow-slate-900/10 border border-zinc-200 dark:border-slate-800 transition-all duration-300 hover:shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-violet-500" />
          Group Generator
        </h3>
        <button onClick={onClearGroups} disabled={groups.length === 0} className="text-sm bg-zinc-200 dark:bg-slate-700 font-semibold py-2 px-3 rounded-lg hover:bg-zinc-300 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors">
            Clear Groups
        </button>
      </div>
      
      <div className="border-b border-zinc-200 dark:border-slate-700 mb-4">
        <nav className="-mb-px flex gap-4">
          <TabButton active={mode === 'manual'} onClick={() => setMode('manual')}>
            <ShuffleIcon className="w-5 h-5"/> Manual
          </TabButton>
          <TabButton active={mode === 'ai'} onClick={() => setMode('ai')}>
            <SparklesIcon className="w-5 h-5"/> AI-Powered
          </TabButton>
        </nav>
      </div>

      {mode === 'manual' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4 p-4 bg-zinc-100 dark:bg-slate-800 rounded-lg border border-zinc-200 dark:border-slate-700 transition-colors">
            <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Generation Method</label>
            <div className="flex gap-2">
                <select value={genType} onChange={(e) => setGenType(e.target.value as any)} className="flex-grow p-2 bg-white dark:bg-slate-700 border border-zinc-300 dark:border-slate-600 rounded-md transition-colors">
                <option value="groupCount">Number of Groups</option>
                <option value="studentCount">Students per Group</option>
                </select>
                <input type="number" value={genValue} onChange={e => setGenValue(parseInt(e.target.value, 10))} min="1" className="w-24 p-2 bg-white dark:bg-slate-700 border border-zinc-300 dark:border-slate-600 rounded-md transition-colors"/>
            </div>
            </div>
            <div className="flex flex-col gap-3">
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" checked={avoidPrevious} onChange={e => setAvoidPrevious(e.target.checked)} className="h-4 w-4 text-violet-600 border-zinc-300 dark:border-slate-600 rounded focus:ring-violet-500" />
                        Avoid previous pairs
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" checked={autoNameGroups} onChange={e => setAutoNameGroups(e.target.checked)} className="h-4 w-4 text-violet-600 border-zinc-300 dark:border-slate-600 rounded focus:ring-violet-500" />
                        Automatically name groups with AI
                    </label>
                </div>
                <button onClick={handleGenerate} disabled={students.length === 0 || isManualGenerating} className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-violet-700 disabled:bg-slate-400 transition-colors">
                    <ShuffleIcon className="w-5 h-5" /> 
                    {isManualGenerating ? 'Generating...' : 'Generate'}
                </button>
            </div>
        </div>
      ) : (
        <div className="space-y-4 mb-4 p-4 bg-zinc-100 dark:bg-slate-800 rounded-lg border border-zinc-200 dark:border-slate-700 transition-colors">
            <label className="text-sm font-medium">Describe the groups you want to create:</label>
            <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Create groups of 3. Keep Alice and Bob separate. Mix students with higher and lower grades."
                className="w-full p-2 h-24 bg-white dark:bg-slate-700 border border-zinc-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-violet-500 transition-colors"
                disabled={isGeneratingGroups}
            />
            <button onClick={handleAIGenerate} disabled={isGeneratingGroups || !aiPrompt.trim() || students.length === 0} className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-violet-700 disabled:bg-slate-400 transition-colors">
                <SparklesIcon className="w-5 h-5" />
                {isGeneratingGroups ? 'Generating...' : 'Generate with AI'}
            </button>
        </div>
      )}


      {groups.length > 0 && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, index) => (
              <div 
                key={group.id} 
                onDrop={(e) => handleGroupDrop(e, group.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOverGroupId(group.id); }}
                onDragLeave={() => setDragOverGroupId(null)}
                className={`bg-zinc-100 dark:bg-slate-800 p-4 rounded-lg border border-zinc-200 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in-up ${dragOverGroupId === group.id ? 'ring-2 ring-violet-500' : ''}`} style={{ animationDelay: `${index * 50}ms` }}>
                {editingGroupId === group.id ? (
                    <input
                        type="text"
                        value={editingGroupName}
                        onChange={(e) => setEditingGroupName(e.target.value)}
                        onBlur={handleSaveName}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        className="font-bold text-violet-600 dark:text-violet-400 truncate mb-2 bg-transparent border-b-2 border-violet-500 w-full focus:outline-none"
                        autoFocus
                    />
                ) : (
                    <h4 onDoubleClick={() => handleEditName(group)} className="font-bold text-violet-600 dark:text-violet-400 truncate mb-2 cursor-pointer" title="Double-click to edit name">{group.name}</h4>
                )}
                <ul className="space-y-1.5 min-h-[50px]">
                  {group.students.map(student => (
                    <li 
                        key={student.id} 
                        draggable
                        onDragStart={(e) => handleStudentDragStart(e, student.id, group.id)}
                        className="text-sm flex items-center gap-2 bg-white dark:bg-slate-700 p-2 rounded-md cursor-grab active:cursor-grabbing transition-colors"
                    >
                       {student.avatar_url ? (
                          <img src={student.avatar_url} alt={student.name} className="w-6 h-6 rounded-full object-cover bg-zinc-200" />
                        ) : (
                          <UserCircleIcon className="w-6 h-6 text-zinc-400 dark:text-slate-500" />
                        )}
                        <span className="truncate">{student.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupGenerator;