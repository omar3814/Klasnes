import React, { useState, useMemo } from 'react';
import { Student, Assignment, Grade, BehaviorNote, PointLog, AttendanceRecord } from '../../types';
import { ArrowLeftIcon, StarIcon, TicketIcon, AcademicCapIcon, ClipboardDocumentCheckIcon, TagIcon, ChatBubbleLeftRightIcon, PencilIcon, CheckIcon, XMarkIcon, PlusIcon, UserCircleIcon, SparklesIcon, MinusIcon } from '../icons/Icons.tsx';

interface StudentAnalyticsViewProps {
  student: Student;
  assignments: Assignment[];
  grades: Grade[];
  behaviorNotes: BehaviorNote[];
  pointLogs: PointLog[];
  attendanceRecords: AttendanceRecord[];
  onAddBehaviorNote: (studentId: string, note: string, date?: string) => void;
  onUpdateGrade: (studentId: string, assignmentId: string, score: number | null) => void;
  onGenerateSummary: (student: Student) => Promise<string | null>;
  onUpdateDetails: (studentId: string, updatedDetails: Partial<Omit<Student, 'id' | 'classroom_id'>>) => void;
  onUpdateStudentPoints: (studentId: string, amount: number, reason: string) => void;
  onUsePass: (studentId: string, isOverride?: boolean) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subtext?: string; color: string }> = ({ icon, label, value, subtext, color }) => (
    <div className="bg-card p-4 rounded-lg flex items-center gap-4 transition-transform duration-200 hover:scale-105 border border-border">
        <div className={`p-3 bg-${color}-500/10 rounded-full text-${color}-500`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
    </div>
);

const ChartBar: React.FC<{ label: string; value: number; maxValue: number; color: string }> = ({ label, value, maxValue, color }) => {
    const heightPercentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
        <div className="flex flex-col items-center gap-2 h-full">
            <div className="w-full flex-grow flex items-end">
                <div 
                    className={`w-full rounded-t-md transition-all duration-500 ease-out ${color}`} 
                    style={{ height: `${heightPercentage}%` }}
                    title={`${label}: ${value}`}
                ></div>
            </div>
            <div className="text-xs font-semibold text-muted-foreground">{label}</div>
        </div>
    );
};

const StudentAnalyticsView: React.FC<StudentAnalyticsViewProps> = (props) => {
    const { student, assignments, grades, behaviorNotes, pointLogs, attendanceRecords, onAddBehaviorNote, onUpdateGrade, onGenerateSummary, onUpdateDetails, onUpdateStudentPoints, onUsePass } = props;
    
    const [newNote, setNewNote] = useState('');
    const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
    const [gradeValue, setGradeValue] = useState<number | string>('');
    const [summary, setSummary] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<Partial<Omit<Student, 'id' | 'classroom_id'>>>({});
    const [pointChange, setPointChange] = useState<{ amount: number } | null>(null);
    const [reason, setReason] = useState('');
    const [confirmingPass, setConfirmingPass] = useState(false);

    const studentAssignments = useMemo(() => {
        const studentGradeMap = new Map(grades.map(g => [g.assignment_id, g.score]));
        return assignments
            .map(a => ({
                ...a,
                score: studentGradeMap.get(a.id),
                isGraded: studentGradeMap.has(a.id) && studentGradeMap.get(a.id) !== null,
            }))
            .sort((a,b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
    }, [assignments, grades]);

    const averageGrade = useMemo(() => {
        const graded = studentAssignments.filter(a => a.isGraded);
        if (graded.length === 0) return 'N/A';
        const totalPercentage = graded.reduce((sum, a) => sum + ((a.score as number) / a.max_score) * 100, 0);
        return `${(totalPercentage / graded.length).toFixed(1)}%`;
    }, [studentAssignments]);
    
    const attendanceStats = useMemo(() => {
        const studentRecords = attendanceRecords.filter(r => r.student_id === student.id);
        if(studentRecords.length === 0) return { rate: 'N/A', summary: 'No records' };
        const present = studentRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        const rate = (present / studentRecords.length * 100).toFixed(1);
        return {
            rate: `${rate}%`,
            summary: `${present}/${studentRecords.length} days`
        };
    }, [attendanceRecords, student.id]);

    const gradeDistribution = useMemo(() => {
        // FIX: Explicitly type the distribution object to ensure Object.values returns number[]
        const distribution: { [key: string]: number } = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        studentAssignments.filter(a => a.isGraded).forEach(a => {
            const percentage = (a.score as number / a.max_score) * 100;
            if (percentage >= 90) distribution.A++;
            else if (percentage >= 80) distribution.B++;
            else if (percentage >= 70) distribution.C++;
            else if (percentage >= 60) distribution.D++;
            else distribution.F++;
        });
        return distribution;
    }, [studentAssignments]);

    const recentActivity = useMemo(() => {
        const notes = behaviorNotes.map(n => ({ type: 'note' as const, ...n, date: new Date(n.created_at) }));
        const logs = pointLogs.map(l => ({ type: 'points' as const, ...l, date: new Date(l.created_at) }));
        return [...notes, ...logs].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
    }, [behaviorNotes, pointLogs]);

    const attendanceGrid = useMemo(() => {
        const grid = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const record = attendanceRecords.find(r => r.student_id === student.id && r.date === dateString);
            grid.push({ date: date, status: record?.status });
        }
        return grid;
    }, [attendanceRecords, student.id]);
    
    const maxGradeCount = Math.max(...(Object.values(gradeDistribution) as number[]), 1);
    
    const handleNoteSubmit = (e: React.FormEvent) => { e.preventDefault(); onAddBehaviorNote(student.id, newNote, noteDate); setNewNote(''); };
    const handleGradeEdit = (assignmentId: string, currentScore: number | null | undefined) => { setEditingGradeId(assignmentId); setGradeValue(currentScore ?? ''); };
    
    const handleGradeSave = (assignmentId: string) => {
        const score = gradeValue === '' ? null : Number(gradeValue);
        if (score !== null && (isNaN(score) || score < 0)) return; // Basic validation
        onUpdateGrade(student.id, assignmentId, score);
        setEditingGradeId(null);
    };

    const handleGenerateClick = async () => { setIsGenerating(true); setSummary(null); const result = await onGenerateSummary(student); setSummary(result); setIsGenerating(false); }
    const handleEdit = () => { setIsEditing(true); setEditFormData({ name: student.name, grade_level: student.grade_level, contact_info: student.contact_info, notes: student.notes }); };
    const handleCancel = () => setIsEditing(false);
    const handleSave = () => { if (!editFormData.name?.trim()) return; onUpdateDetails(student.id, editFormData); setIsEditing(false); };
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleConfirmPointChange = () => { if (!pointChange || !reason.trim() || pointChange.amount === 0) return; onUpdateStudentPoints(student.id, pointChange.amount, reason); setPointChange(null); setReason(''); };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border">
                {student.avatar_url ? (<img src={student.avatar_url} alt={student.name} className="w-16 h-16 rounded-full object-cover" />) : (<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><AcademicCapIcon className="w-10 h-10"/></div>)}
                <div>
                    <h2 className="text-xl font-bold text-foreground">{student.name}</h2>
                    <p className="text-muted-foreground">{student.grade_level || 'Grade not specified'}</p>
                </div>
                <button onClick={handleEdit} className="ml-auto px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg flex items-center gap-1.5 hover:bg-secondary/80 transition-colors"><PencilIcon className="w-4 h-4" /> Edit Profile</button>
            </div>

            {isEditing && (
                <div className="bg-card p-6 rounded-2xl border border-border space-y-4 animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="name" value={editFormData.name || ''} onChange={handleFormChange} placeholder="Name" className="w-full p-2 bg-input border rounded-lg" required />
                        <input type="text" name="grade_level" value={editFormData.grade_level || ''} onChange={handleFormChange} placeholder="Grade Level" className="w-full p-2 bg-input border rounded-lg" />
                    </div>
                    <input type="text" name="contact_info" value={editFormData.contact_info || ''} onChange={handleFormChange} placeholder="Contact Info" className="w-full p-2 bg-input border rounded-lg" />
                    <textarea name="notes" value={editFormData.notes || ''} onChange={handleFormChange} placeholder="General Notes" className="w-full p-2 bg-input border rounded-lg h-24"/>
                    <div className="flex justify-end gap-2">
                        <button onClick={handleCancel} className="px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg">Save</button>
                    </div>
                </div>
            )}

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<AcademicCapIcon className="w-7 h-7"/>} label="Average Grade" value={averageGrade} subtext={`${studentAssignments.filter(a=>a.isGraded).length} graded assignments`} color="violet"/>
                <StatCard icon={<ClipboardDocumentCheckIcon className="w-7 h-7"/>} label="Attendance" value={attendanceStats.rate} subtext={attendanceStats.summary} color="sky"/>
                <StatCard icon={<StarIcon className="w-7 h-7"/>} label="Total Points" value={student.points} subtext={`${pointLogs.length} transactions`} color="amber"/>
                <StatCard icon={<TicketIcon className="w-7 h-7"/>} label="Weekly Passes Used" value={`${student.passes_used} / ${student.passes_allowed}`} color="emerald"/>
            </section>
            
            <div className="bg-card p-4 rounded-lg border border-border transition-colors">
                <h3 className="font-semibold flex items-center gap-2 text-foreground"><SparklesIcon className="w-5 h-5 text-warning" /> AI-Powered Summary</h3>
                {summary && !isGenerating ? <p className="text-sm mt-2 whitespace-pre-wrap">{summary}</p> : <p className="text-sm mt-2 text-muted-foreground">{isGenerating ? 'Thinking...' : 'Generate a summary of this student\'s progress.'}</p>}
                <button onClick={handleGenerateClick} disabled={isGenerating} className="mt-3 w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-amber-600 disabled:opacity-50">
                    {isGenerating ? 'Generating...' : 'Generate Summary'}
                </button>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-card p-6 rounded-2xl border border-border">
                    <h3 className="text-lg font-semibold text-card-foreground mb-4">Grade Distribution</h3>
                    <div className="h-64 flex justify-around items-end gap-4">
                        <ChartBar label="A" value={gradeDistribution.A} maxValue={maxGradeCount} color="bg-emerald-500" />
                        <ChartBar label="B" value={gradeDistribution.B} maxValue={maxGradeCount} color="bg-sky-500" />
                        <ChartBar label="C" value={gradeDistribution.C} maxValue={maxGradeCount} color="bg-yellow-500" />
                        <ChartBar label="D" value={gradeDistribution.D} maxValue={maxGradeCount} color="bg-orange-500" />
                        <ChartBar label="F" value={gradeDistribution.F} maxValue={maxGradeCount} color="bg-red-500" />
                    </div>
                </div>
                <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border">
                    <h3 className="text-lg font-semibold text-card-foreground mb-4">30-Day Attendance</h3>
                    <div className="grid grid-cols-10 gap-1.5">
                        {attendanceGrid.map(({ date, status }, index) => {
                            let color = 'bg-muted';
                            if (status === 'present') color = 'bg-emerald-500'; else if (status === 'absent') color = 'bg-red-500'; else if (status === 'late') color = 'bg-amber-500';
                            return <div key={index} title={`${date.toLocaleDateString()}: ${status || 'N/A'}`} className={`w-full aspect-square rounded-sm ${color}`}></div>;
                        })}
                    </div>
                </div>
            </section>

             <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border">
                    <h3 className="text-lg font-semibold text-card-foreground mb-4">Recent Activity</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {recentActivity.length > 0 ? recentActivity.map((item) => (
                            <div key={item.id} className="flex items-start gap-4 p-3 bg-muted rounded-lg">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'note' ? 'bg-sky-500/10 text-sky-500' : (item.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')}`}>
                                    {item.type === 'note' ? <ChatBubbleLeftRightIcon className="w-5 h-5"/> : <TagIcon className="w-5 h-5"/>}
                                </div>
                                <div className="flex-grow"><p className="text-sm">{item.type === 'note' ? item.note : item.reason}</p><span className="text-xs text-muted-foreground">{item.date.toLocaleString()}</span></div>
                                {item.type === 'points' && (<span className={`ml-auto font-bold text-sm ${item.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{item.amount > 0 ? `+${item.amount}` : item.amount}</span>)}
                            </div>
                        )) : <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>}
                    </div>
                </div>
                 <div className="bg-card p-6 rounded-2xl border border-border">
                    <h3 className="text-lg font-semibold text-card-foreground mb-4">Grades</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {studentAssignments.map(asg => (
                            <div key={asg.id} className="flex items-center justify-between bg-muted p-3 rounded-md">
                                <div><p className="font-medium">{asg.name}</p><p className="text-xs text-muted-foreground">{asg.type} - Max: {asg.max_score}</p></div>
                                {editingGradeId === asg.id ? (<input type="number" value={gradeValue} onChange={e => setGradeValue(e.target.value)} onBlur={() => handleGradeSave(asg.id)} onKeyDown={e => e.key === 'Enter' && handleGradeSave(asg.id)} className="w-20 p-1 text-center bg-background border rounded-md" max={asg.max_score} min="0" autoFocus />) : (<button onClick={() => handleGradeEdit(asg.id, asg.score)} className="font-bold text-lg text-primary px-2 rounded-md">{asg.score ?? '-'}</button>)}
                            </div>
                        ))}
                        {studentAssignments.length === 0 && <p className="text-sm text-muted-foreground italic text-center p-4">No assignments yet.</p>}
                    </div>
                </div>
            </section>
            
            <section className="bg-card p-6 rounded-2xl border border-border">
                 <h3 className="text-lg font-semibold text-card-foreground mb-4">Quick Actions</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <form onSubmit={handleNoteSubmit} className="space-y-2">
                        <label className="font-medium">Add Behavior Note</label>
                        <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="e.g., Was very helpful today..." className="w-full p-2 bg-input border rounded-lg h-20"></textarea>
                        <div className="flex items-center gap-2">
                          <input type="date" value={noteDate} onChange={e => setNoteDate(e.target.value)} className="p-2 bg-input border rounded-lg"/>
                          <button type="submit" disabled={!newNote.trim()} className="flex-grow px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg disabled:opacity-50">Add Note</button>
                        </div>
                     </form>
                     <div className="space-y-2">
                         <label className="font-medium">Manage Points & Passes</label>
                         <div className="flex gap-2">
                            <button onClick={() => setPointChange({ amount: -1 })} className="flex-1 px-4 py-2 text-sm font-semibold bg-red-500/10 text-red-700 rounded-lg flex items-center justify-center gap-1.5"><MinusIcon className="w-4 h-4"/> Remove Point</button>
                            <button onClick={() => setPointChange({ amount: 1 })} className="flex-1 px-4 py-2 text-sm font-semibold bg-green-500/10 text-green-700 rounded-lg flex items-center justify-center gap-1.5"><PlusIcon className="w-4 h-4"/> Add Point</button>
                         </div>
                         <button onClick={() => setConfirmingPass(true)} className="w-full px-4 py-2 text-sm font-semibold bg-sky-500/10 text-sky-700 rounded-lg flex items-center justify-center gap-1.5"><TicketIcon className="w-4 h-4"/> Use Pass</button>
                     </div>
                 </div>
            </section>
            
            {confirmingPass && (() => {
                const isOverride = student.passes_used >= student.passes_allowed;
                const canAfford = (student.points || 0) > 0;
                
                return (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm m-4 animate-scale-in transition-colors">
                      <h3 className="text-lg font-semibold text-card-foreground">Confirm Pass Usage</h3>
                      {isOverride ? (
                        canAfford ? (
                          <p className="mt-2 text-muted-foreground">
                            {student.name} is out of passes. Granting an extra pass will deduct <strong className="text-warning">1 point</strong>. Are you sure?
                          </p>
                        ) : (
                          <p className="mt-2 text-destructive">
                            {student.name} is out of passes and has <strong>0 points</strong>. They cannot afford an extra pass.
                          </p>
                        )
                      ) : (
                        <p className="mt-2 text-muted-foreground">
                          Use one pass for <strong className="text-primary">{student.name}</strong>? 
                          They will have {student.passes_allowed - student.passes_used - 1} left.
                        </p>
                      )}
                      <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setConfirmingPass(false)} className="px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">Cancel</button>
                        <button 
                          onClick={() => { onUsePass(student.id, isOverride); setConfirmingPass(false); }} 
                          className="px-4 py-2 text-sm font-semibold bg-sky-600 text-white rounded-lg disabled:opacity-50 hover:bg-sky-700 transition-colors" 
                          disabled={isOverride && !canAfford}
                          autoFocus>
                            Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                );
            })()}

            {pointChange && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm m-4 animate-scale-in">
                    <h3 className="text-lg font-semibold text-card-foreground">
                        Update Points for {student.name}
                    </h3>
                    <div className="mt-4">
                        <label htmlFor="amount" className="block text-sm font-medium text-muted-foreground">Amount</label>
                        <input id="amount" type="number" value={pointChange.amount} onChange={e => setPointChange({amount: parseInt(e.target.value) || 0})} placeholder='e.g., 5 or -2' className="w-full p-2 mt-1 bg-input border border-border rounded-lg" autoFocus/>
                    </div>
                    <div className="mt-4">
                        <label htmlFor="reason" className="block text-sm font-medium text-muted-foreground">Reason</label>
                        <input id="reason" type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder='e.g., Helped a classmate' className="w-full p-2 mt-1 bg-input border border-border rounded-lg"/>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => { setPointChange(null); setReason(''); }} className="px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg">Cancel</button>
                        <button onClick={handleConfirmPointChange} disabled={!reason.trim() || pointChange.amount === 0} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
                            Confirm
                        </button>
                    </div>
                </div>
                </div>
            )}
        </div>
    );
};

export default StudentAnalyticsView;