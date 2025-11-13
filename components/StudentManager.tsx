import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Student } from '../types';
import { TicketIcon, RefreshIcon, UserCircleIcon, UploadIcon, SparklesIcon, PencilIcon, CheckIcon, XMarkIcon, BarsArrowUpIcon, BarsArrowDownIcon, ArrowDownTrayIcon, UserPlusIcon, PlusIcon, MinusIcon, StarIcon, ChartBarIcon } from './icons/Icons.tsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StudentManagerProps {
  students: Student[];
  selectedStudentId: string | null;
  // FIX: Changed prop type to Promise<void> to match parent component.
  onAddStudent: (studentData: Omit<Student, 'id' | 'classroom_id' | 'avatar_url' | 'points'>) => Promise<void>;
  onUsePass: (studentId: string, isOverride?: boolean) => void;
  onSetAllowance: (allowance: number) => void;
  onResetPasses: () => void;
  onUpdateAvatar: (studentId: string, avatarUrl: string) => void;
  onUpdateDetails: (studentId: string, updatedDetails: Partial<Omit<Student, 'id' | 'classroom_id'>>) => void;
  onUpdateStudentPoints: (studentId: string, amount: number, reason: string) => void;
  onSelectStudent: (studentId: string | null) => void;
  onShowAnalytics: (studentId: string) => void;
}

const PassProgressBar: React.FC<{ used: number, allowed: number }> = ({ used, allowed }) => {
    const percentage = allowed > 0 ? Math.min((used / allowed) * 100, 100) : 0;
    const isOver = used > allowed;
    const color = isOver ? 'bg-red-500' : 'bg-sky-500';

    return (
        <div className="w-full bg-muted rounded-full h-2" title={`Passes: ${used}/${allowed}`}>
            <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const StudentManager: React.FC<StudentManagerProps> = (props) => {
  const { students, selectedStudentId, onAddStudent, onUsePass, onSetAllowance, onResetPasses, onUpdateAvatar, onUpdateDetails, onSelectStudent, onUpdateStudentPoints, onShowAnalytics } = props;

  const [allowance, setAllowance] = useState(students[0]?.passes_allowed ?? 5);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetStudentId, setUploadTargetStudentId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Student>>({});
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'grade_level' | 'points', direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [confirmingPass, setConfirmingPass] = useState<Student | null>(null);
  const editNameInputRef = useRef<HTMLInputElement>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [newStudentName, setNewStudentName] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  
  const [pointChange, setPointChange] = useState<{ student: Student; amount: number } | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (students.length > 0) {
      setAllowance(students[0].passes_allowed);
    }
  }, [students]);

  useEffect(() => {
    if (editingStudentId && editNameInputRef.current) {
        editNameInputRef.current.focus();
    }
  }, [editingStudentId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
            setExportMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // FIX: Make handler async to correctly handle the promise-based onAddStudent prop.
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    setAddingStudent(true);
    await onAddStudent({
        name: newStudentName.trim(),
        passes_used: 0,
        passes_allowed: allowance,
        grade_level: '',
        contact_info: '',
        notes: ''
    });
    setNewStudentName('');
    setAddingStudent(false);
  };

  const handleAllowanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setAllowance(value);
    if (!isNaN(value)) {
      onSetAllowance(value);
    }
  };

  const handleTriggerUpload = (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation();
    setUploadTargetStudentId(studentId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0] && uploadTargetStudentId) {
          const file = event.target.files[0];
          const localUrl = URL.createObjectURL(file);
          onUpdateAvatar(uploadTargetStudentId, localUrl);
      }
      event.target.value = '';
  };

  const handleGenerateAvatar = (e: React.MouseEvent, studentId: string, studentName: string) => {
    e.stopPropagation();
    const seed = encodeURIComponent(studentName);
    const avatarUrl = `https://api.dicebear.com/8.x/adventurer/svg?seed=${seed}`;
    onUpdateAvatar(studentId, avatarUrl);
  };

  const handleEditClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    setEditingStudentId(student.id);
    onSelectStudent(null);
    setEditFormData({ name: student.name, grade_level: student.grade_level });
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingStudentId(null);
    setEditFormData({});
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!editingStudentId || !editFormData.name?.trim()) return;
    onUpdateDetails(editingStudentId, {name: editFormData.name, grade_level: editFormData.grade_level});
    handleCancelEdit();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSort = (key: 'name' | 'grade_level' | 'points') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const key = sortConfig.key;
      if (key === 'points') {
        return sortConfig.direction === 'asc' ? (a.points || 0) - (b.points || 0) : (b.points || 0) - (a.points || 0);
      }
      
      const aVal = a[key as keyof Student] as string || '';
      const bVal = b[key as keyof Student] as string || '';

      if (aVal === '' && bVal !== '') return 1;
      if (bVal === '' && aVal !== '') return -1;

      const options = key === 'grade_level' ? { numeric: true, sensitivity: 'base' } as const : undefined;
      const comparison = aVal.localeCompare(bVal, undefined, options);

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [students, sortConfig]);

  const handleExportCSV = () => {
    const headers = "Name,Grade Level,Points,Passes Used,Passes Allowed";
    const csvContent = sortedStudents.map(s => 
      `"${s.name}","${s.grade_level || ''}",${s.points || 0},${s.passes_used},${s.passes_allowed}`
    ).join("\n");
    const fullCsv = `data:text/csv;charset=utf-8,${headers}\n${csvContent}`;
    const encodedUri = encodeURI(fullCsv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_roster.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportMenuOpen(false);
  };
  
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Student Roster", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Name', 'Grade Level', 'Points', 'Passes']],
      body: sortedStudents.map(s => [s.name, s.grade_level || 'N/A', s.points || 0, `${s.passes_used}/${s.passes_allowed}`]),
    });
    doc.save('student_roster.pdf');
    setExportMenuOpen(false);
  };

  const handlePassClick = (e: React.MouseEvent, student: Student) => {
      e.stopPropagation();
      setConfirmingPass(student);
  }
  
  const handleConfirmPointChange = () => {
    if (!pointChange || !reason.trim() || pointChange.amount === 0) return;
    onUpdateStudentPoints(pointChange.student.id, pointChange.amount, reason);
    setPointChange(null);
    setReason('');
  };

  return (
    <div className="bg-card p-6 rounded-2xl shadow-lg shadow-black/5 border border-border transition-all duration-300 hover:shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-card-foreground">
          Student Roster
        </h2>
        <div className="flex items-center gap-1">
            <button onClick={() => handleSort('name')} disabled={students.length < 2} className="px-2 py-1 text-xs font-semibold rounded-md hover:bg-muted disabled:opacity-50 transition-colors">
                Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
            </button>
            <button onClick={() => handleSort('grade_level')} disabled={students.length < 2} className="px-2 py-1 text-xs font-semibold rounded-md hover:bg-muted disabled:opacity-50 transition-colors">
                Grade {sortConfig.key === 'grade_level' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
            </button>
             <button onClick={() => handleSort('points')} disabled={students.length < 2} className="px-2 py-1 text-xs font-semibold rounded-md hover:bg-muted disabled:opacity-50 transition-colors">
                Points {sortConfig.key === 'points' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
            </button>
            <div className="relative" ref={exportMenuRef}>
                <button onClick={() => setExportMenuOpen(prev => !prev)} disabled={students.length === 0} className="p-2 rounded-md hover:bg-muted disabled:opacity-50 transition-colors">
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
                {exportMenuOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-card rounded-lg shadow-xl border border-border z-10 overflow-hidden">
                        <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors">Export CSV</button>
                        <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors">Export PDF</button>
                    </div>
                )}
            </div>
        </div>
      </div>
      <div className="space-y-4">
        <form onSubmit={handleAddStudentSubmit} className="flex gap-2">
            <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Add new student..."
                className="flex-grow p-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring transition-colors"
                disabled={addingStudent}
            />
            <button type="submit" disabled={addingStudent || !newStudentName.trim()} className="flex-shrink-0 bg-primary text-primary-foreground font-semibold p-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                <PlusIcon className="w-5 h-5" />
            </button>
        </form>

        <div className="p-4 bg-muted rounded-lg space-y-3 border border-border transition-colors">
            {/* Pass allowance controls */}
            <div className="flex items-center justify-between gap-2">
            <label htmlFor="pass-allowance" className="text-sm font-medium text-muted-foreground">
              Weekly Pass Allowance
            </label>
            <input type="number" id="pass-allowance" value={allowance} onChange={handleAllowanceChange} min="0" className="w-20 p-2 text-center bg-background border border-border rounded-md transition-colors"/>
          </div>
          <button onClick={onResetPasses} className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80 transition-colors">
            <RefreshIcon className="w-5 h-5" />
            Reset All Used Passes
          </button>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2 -mr-2">
          {sortedStudents.map(student => (
            <div key={student.id} className="group relative animate-fade-in-up">
              {editingStudentId === student.id ? (
                // EDITING FORM
                <div className="bg-muted p-2.5 rounded-lg border border-ring">
                  <form onSubmit={handleSaveEdit} className="flex items-center gap-2">
                    <input ref={editNameInputRef} type="text" name="name" value={editFormData.name || ''} onChange={handleFormChange} placeholder="Student Name" className="w-full p-1.5 text-sm bg-background border rounded-md transition-colors" required/>
                    <input type="text" name="grade_level" value={editFormData.grade_level || ''} onChange={handleFormChange} placeholder="Grade" className="w-24 p-1.5 text-sm bg-background border rounded-md transition-colors"/>
                    <button type="button" onClick={handleCancelEdit} className="p-2 text-muted-foreground hover:text-destructive rounded-full transition-colors"><XMarkIcon className="w-5 h-5" /></button>
                    <button type="submit" className="p-2 text-muted-foreground hover:text-primary rounded-full transition-colors"><CheckIcon className="w-5 h-5" /></button>
                  </form>
                </div>
              ) : (
                // STUDENT ROW
                <button onClick={() => onSelectStudent(student.id)} className={`w-full text-left p-2.5 rounded-lg duration-300 ease-in-out group-hover:scale-[1.01] group-hover:shadow-md ${selectedStudentId === student.id ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted/50 hover:bg-muted'}`}>
                  <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 flex-grow min-w-0">
                      {student.avatar_url ? (
                          <img src={student.avatar_url} alt={student.name} className="w-10 h-10 rounded-full object-cover bg-background flex-shrink-0" />
                      ) : (
                          <UserCircleIcon className="w-10 h-10 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="truncate flex-grow">
                          <span className="font-medium text-foreground truncate">{student.name}</span>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <span className="font-mono bg-background px-1.5 rounded">{student.grade_level || 'N/A'}</span>
                            <span className="flex items-center gap-1"><StarIcon className="w-3.5 h-3.5 text-warning"/> {student.points ?? 0}</span>
                          </div>
                           <div className="mt-1.5">
                               <PassProgressBar used={student.passes_used} allowed={student.passes_allowed} />
                           </div>
                      </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 lg:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300">
                          <button onClick={(e) => { e.stopPropagation(); onShowAnalytics(student.id); }} className="p-2 text-muted-foreground hover:text-primary rounded-full transition-colors" title="View Analytics"><ChartBarIcon className="w-4 h-4" /></button>
                          <button onClick={(e) => handleEditClick(e, student)} className="p-2 text-muted-foreground hover:text-primary rounded-full transition-colors" title="Quick Edit"><PencilIcon className="w-4 h-4" /></button>
                          <button onClick={(e) => handleTriggerUpload(e, student.id)} className="p-2 text-muted-foreground hover:text-primary rounded-full transition-colors" title="Upload Avatar"><UploadIcon className="w-4 h-4" /></button>
                          <button onClick={(e) => handleGenerateAvatar(e, student.id, student.name)} className="p-2 text-muted-foreground hover:text-warning rounded-full transition-colors" title="Generate Avatar"><SparklesIcon className="w-4 h-4" /></button>
                          <div className="flex items-center bg-background rounded-full mx-1">
                            <button onClick={(e) => { e.stopPropagation(); setPointChange({ student, amount: -1 }); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Remove Point"><MinusIcon className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); setPointChange({ student, amount: 1 }); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Add Point"><PlusIcon className="w-4 h-4" /></button>
                          </div>
                          <button onClick={(e) => handlePassClick(e, student)} className="flex items-center gap-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 px-3 py-1.5 text-xs font-semibold rounded-full hover:bg-sky-500/20 disabled:bg-muted disabled:text-muted-foreground transition-colors">
                              <TicketIcon className="w-4 h-4" /> Use
                          </button>
                      </div>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden"/>
      {confirmingPass && (() => {
        const isOverride = confirmingPass.passes_used >= confirmingPass.passes_allowed;
        const canAfford = (confirmingPass.points || 0) > 0;
        
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm m-4 animate-scale-in transition-colors">
              <h3 className="text-lg font-semibold text-card-foreground">Confirm Pass Usage</h3>
              {isOverride ? (
                canAfford ? (
                  <p className="mt-2 text-muted-foreground">
                    {confirmingPass.name} is out of passes. Granting an extra pass will deduct <strong className="text-warning">1 point</strong>. Are you sure?
                  </p>
                ) : (
                  <p className="mt-2 text-destructive">
                    {confirmingPass.name} is out of passes and has <strong>0 points</strong>. They cannot afford an extra pass.
                  </p>
                )
              ) : (
                <p className="mt-2 text-muted-foreground">
                  Use one pass for <strong className="text-primary">{confirmingPass.name}</strong>? 
                  They will have {confirmingPass.passes_allowed - confirmingPass.passes_used - 1} left.
                </p>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setConfirmingPass(null)} className="px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">Cancel</button>
                <button 
                  onClick={() => { onUsePass(confirmingPass.id, isOverride); setConfirmingPass(null); }} 
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
          <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm m-4 animate-scale-in transition-colors">
            <h3 className="text-lg font-semibold text-card-foreground">
                {pointChange.amount > 0 ? 'Add' : 'Remove'} Points for {pointChange.student.name}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
                Please provide a reason for this point change.
            </p>
            <div className="mt-4">
                <label htmlFor="amount" className="block text-sm font-medium text-muted-foreground">Amount</label>
                <input 
                    id="amount" type="number" value={pointChange.amount} onChange={e => setPointChange(pc => pc ? {...pc, amount: parseInt(e.target.value) || 0} : null)}
                    className="w-full p-2 mt-1 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring transition-colors"
                />
            </div>
            <div className="mt-4">
                <label htmlFor="reason" className="block text-sm font-medium text-muted-foreground">Reason</label>
                <input 
                    id="reason" type="text" value={reason} onChange={e => setReason(e.target.value)}
                    placeholder='e.g., Helped a classmate'
                    className="w-full p-2 mt-1 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring transition-colors"
                    autoFocus
                />
            </div>
            <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => { setPointChange(null); setReason(''); }} className="px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">Cancel</button>
                <button 
                    onClick={handleConfirmPointChange} 
                    disabled={!reason.trim() || pointChange.amount === 0}
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

export default StudentManager;