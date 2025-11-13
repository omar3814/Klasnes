import React, { useMemo, useState } from 'react';
import { Student } from '../types';
import { StarIcon, TicketIcon, PlusIcon } from './icons/Icons.tsx';

interface ClassroomStatsProps {
    students: Student[];
    onAwardClassPoints: (amount: number, reason: string) => void;
}

const ClassroomStats: React.FC<ClassroomStatsProps> = ({ students, onAwardClassPoints }) => {
    const [isAwarding, setIsAwarding] = useState(false);
    const [reason, setReason] = useState('');

    const stats = useMemo(() => {
        if (students.length === 0) {
            return {
                totalPoints: 0,
                totalPassesUsed: 0,
                totalPassesAllowed: 0,
            };
        }
        
        const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);
        const totalPassesUsed = students.reduce((sum, s) => sum + s.passes_used, 0);
        const totalPassesAllowed = students.reduce((sum, s) => sum + s.passes_allowed, 0);

        return { totalPoints, totalPassesUsed, totalPassesAllowed };
    }, [students]);
    
    if(students.length === 0) return null;

    const handleConfirmAward = () => {
        if (!reason.trim()) return;
        onAwardClassPoints(1, reason);
        setIsAwarding(false);
        setReason('');
    };

    return (
        <div>
             <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h3 className="text-lg font-semibold text-card-foreground">
                    Classroom Overview
                </h3>
                <button 
                    onClick={() => setIsAwarding(true)}
                    className="flex items-center gap-2 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 font-semibold py-2 px-4 rounded-lg hover:bg-yellow-400/20 transition-colors"
                >
                    <StarIcon className="w-5 h-5" />
                    Class Reward
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Points Card */}
                <div className="bg-muted p-4 rounded-lg flex items-center gap-4 transition-transform duration-200 hover:scale-105">
                    <div className="p-3 bg-warning/10 rounded-full text-warning">
                        <StarIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Points Awarded</p>
                        <p className="text-3xl font-bold text-foreground">{stats.totalPoints}</p>
                        <p className="text-xs text-muted-foreground">across {students.length} student{students.length !== 1 && 's'}</p>
                    </div>
                </div>
                
                {/* Passes Used Card */}
                <div className="bg-muted p-4 rounded-lg flex items-center gap-4 transition-transform duration-200 hover:scale-105">
                     <div className="p-3 bg-sky-500/10 rounded-full text-sky-500">
                        <TicketIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Passes Used This Week</p>
                        <p className="text-3xl font-bold text-foreground">
                            {stats.totalPassesUsed}
                            <span className="text-xl text-muted-foreground"> / {stats.totalPassesAllowed}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">across {students.length} student{students.length !== 1 && 's'}</p>
                    </div>
                </div>
            </div>
             {isAwarding && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                  <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm m-4 animate-scale-in transition-colors">
                    <h3 className="text-lg font-semibold text-card-foreground">Award Class Point</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Award 1 point to every student in the class. Please provide a reason.
                    </p>
                    <div className="mt-4">
                        <label htmlFor="award-reason" className="block text-sm font-medium text-muted-foreground">Reason</label>
                        <input 
                            id="award-reason" type="text" value={reason} onChange={e => setReason(e.target.value)}
                            placeholder='e.g., Great teamwork today!'
                            className="w-full p-2 mt-1 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring transition-colors"
                            autoFocus
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setIsAwarding(false)} className="px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">Cancel</button>
                        <button 
                            onClick={handleConfirmAward} 
                            disabled={!reason.trim()}
                            className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors"
                        >
                            Confirm
                        </button>
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
};

export default ClassroomStats;