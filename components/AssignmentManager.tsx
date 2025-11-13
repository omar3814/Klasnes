import React, { useState } from 'react';
import { Assignment } from '../types';
import { PlusIcon, AcademicCapIcon } from './icons/Icons.tsx';

interface AssignmentManagerProps {
  assignments: Assignment[];
  onAddAssignment: (assignment: Omit<Assignment, 'id' | 'classroom_id'>) => Promise<void>;
}

const AssignmentManager: React.FC<AssignmentManagerProps> = ({ assignments, onAddAssignment }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'quiz' | 'exam' | 'homework' | 'project'>('homework');
  const [maxScore, setMaxScore] = useState(100);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || maxScore <= 0 || isAdding) {
      return;
    }
    setIsAdding(true);
    await onAddAssignment({ name, type, max_score: maxScore, due_date: dueDate });
    setName('');
    setType('homework');
    setMaxScore(100);
    setDueDate(new Date().toISOString().split('T')[0]);
    setIsAdding(false);
  };

  return (
    <div className="bg-card p-6 rounded-2xl shadow-lg shadow-black/5 border border-border transition-all duration-300 hover:shadow-xl">
      <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <AcademicCapIcon className="w-6 h-6 text-primary" />
        Assignment Manager
      </h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
        <div className="flex flex-col md:col-span-3 lg:col-span-2">
          <label htmlFor="asg-name" className="text-sm font-medium text-muted-foreground mb-1">Name</label>
          <input
            id="asg-name" type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g., Chapter 5 Quiz"
            className="p-2 bg-input border border-border rounded-lg transition-colors"
            required disabled={isAdding}
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="asg-type" className="text-sm font-medium text-muted-foreground mb-1">Type</label>
          <select
            id="asg-type" value={type} onChange={e => setType(e.target.value as any)}
            className="p-2 bg-input border border-border rounded-lg transition-colors"
            disabled={isAdding}
          >
            <option value="homework">Homework</option>
            <option value="quiz">Quiz</option>
            <option value="exam">Exam</option>
            <option value="project">Project</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="asg-due" className="text-sm font-medium text-muted-foreground mb-1">Due Date</label>
          <input
            id="asg-due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            className="p-2 bg-input border border-border rounded-lg transition-colors"
            required disabled={isAdding}
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="asg-score" className="text-sm font-medium text-muted-foreground mb-1">Max Score</label>
          <input
            id="asg-score" type="number" value={maxScore} onChange={e => setMaxScore(Number(e.target.value))}
            min="1" className="p-2 bg-input border border-border rounded-lg transition-colors"
            required disabled={isAdding}
          />
        </div>
        <button
          type="submit" disabled={isAdding}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          {isAdding ? 'Adding...' : 'Add'}
        </button>
      </form>
      {assignments.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-foreground mb-2">Current Assignments:</h4>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            {assignments.map(a => <li key={a.id}>{a.name} ({a.type}) - Due {a.due_date}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AssignmentManager;