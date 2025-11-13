import React, { useState, useMemo } from 'react';
import { PointLog, Student } from '../../types';
import { StarIcon, UserCircleIcon, TagIcon } from '../icons/Icons.tsx';

interface PointsViewProps {
  pointLogs: PointLog[];
  students: Student[];
  onAwardClassPoints: (amount: number, reason: string) => void;
  onUpdateStudentPoints: (studentId: string, amount: number, reason: string) => void;
}

const positiveReasons = ["Helping a classmate", "Great participation", "Excellent work", "Creative thinking"];
const negativeReasons = ["Disruptive", "Unprepared for class", "Incomplete work", "Not following directions"];

const PointsView: React.FC<PointsViewProps> = ({ pointLogs, students, onAwardClassPoints, onUpdateStudentPoints }) => {
  const [isAwardingClass, setIsAwardingClass] = useState(false);
  const [isAwardingStudent, setIsAwardingStudent] = useState<Student | null>(null);
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState(1);
  
  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const sortedLogs = useMemo(() => [...pointLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [pointLogs]);

  const handleConfirmAward = () => {
    if (!reason.trim() || amount === 0) return;
    if (isAwardingClass) {
        onAwardClassPoints(amount, reason);
    } else if (isAwardingStudent) {
        onUpdateStudentPoints(isAwardingStudent.id, amount, reason);
    }
    closeModal();
  };

  const closeModal = () => {
    setIsAwardingClass(false);
    setIsAwardingStudent(null);
    setReason('');
    setAmount(1);
  };
  
  const openStudentModal = (student: Student) => {
      setIsAwardingStudent(student);
      setAmount(1);
  };

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-card p-4 rounded-xl border border-border">
                    <h3 className="font-semibold mb-2">Award Points</h3>
                    <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                        {students.map(student => (
                            <button key={student.id} onClick={() => openStudentModal(student)} className="w-full text-left p-2 flex items-center gap-2 rounded-md hover:bg-muted">
                                {student.avatar_url ? <img src={student.avatar_url} alt={student.name} className="w-8 h-8 rounded-full" /> : <UserCircleIcon className="w-8 h-8 text-muted-foreground" />}
                                <span>{student.name}</span>
                            </button>
                        ))}
                    </div>
                     <button onClick={() => { setIsAwardingClass(true); setAmount(1); }} className="w-full mt-4 p-2 font-semibold bg-primary text-primary-foreground rounded-lg">Award Class Points</button>
                </div>
            </div>

            <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border">
                 <h3 className="text-lg font-semibold text-card-foreground mb-4">Points Log</h3>
                 <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {sortedLogs.length > 0 ? sortedLogs.map(log => {
                        const student = studentMap.get(log.student_id);
                        return (
                             <div key={log.id} className="flex items-start gap-4 p-3 bg-muted rounded-lg">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${log.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                    <TagIcon className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-sm">
                                        <span className="font-semibold">{student?.name || 'Unknown'}</span> {log.amount > 0 ? 'received' : 'lost'} {Math.abs(log.amount)} {Math.abs(log.amount) === 1 ? 'point' : 'points'} for "{log.reason}".
                                    </p>
                                    <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                                </div>
                                <span className={`ml-auto font-bold text-sm ${log.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{log.amount > 0 ? `+${log.amount}` : log.amount}</span>
                            </div>
                        )
                    }) : <p className="text-sm text-center text-muted-foreground py-8">No points awarded yet.</p>}
                 </div>
            </div>
        </div>
        
        {(isAwardingClass || isAwardingStudent) && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm m-4 animate-scale-in">
                    <h3 className="text-lg font-semibold text-card-foreground">
                        {isAwardingClass ? 'Award Class Points' : `Award Points to ${isAwardingStudent?.name}`}
                    </h3>
                    <div className="mt-4">
                        <label className="block text-sm font-medium">Amount</label>
                        <input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)} className="w-full mt-1 p-2 bg-input border rounded-lg"/>
                    </div>
                     <div className="mt-4">
                        <label className="block text-sm font-medium">Reason</label>
                        <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Great participation" className="w-full mt-1 p-2 bg-input border rounded-lg" autoFocus/>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-xs font-semibold mb-1">Suggestions (+)</p>
                            {positiveReasons.map(r => <button key={r} onClick={() => { setReason(r); setAmount(1); }} className="text-xs p-1 w-full text-left rounded hover:bg-muted">{r}</button>)}
                        </div>
                         <div>
                            <p className="text-xs font-semibold mb-1">Suggestions (-)</p>
                            {negativeReasons.map(r => <button key={r} onClick={() => { setReason(r); setAmount(-1); }} className="text-xs p-1 w-full text-left rounded hover:bg-muted">{r}</button>)}
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={closeModal} className="px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg">Cancel</button>
                        <button onClick={handleConfirmAward} disabled={!reason.trim() || amount === 0} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg disabled:opacity-50">Confirm</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default PointsView;