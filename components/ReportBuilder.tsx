import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Report, BehaviorRating, ParticipationRating, AttitudeRating, ProgressRating, ReportAudience, Assignment, Grade, PointLog, BehaviorNote, AttendanceRecord, TeacherProfile } from '../types';
import { DocumentTextIcon, SparklesIcon, ClipboardIcon, XMarkIcon, CheckIcon, LightBulbIcon, ArrowDownTrayIcon } from './icons/Icons.tsx';
import { jsPDF } from 'jspdf';

interface ReportBuilderProps {
  students: Student[];
  reports: Report[];
  assignments: Assignment[];
  grades: Grade[];
  pointLogs: PointLog[];
  behaviorNotes: BehaviorNote[];
  attendanceRecords: AttendanceRecord[];
  teacherProfile: TeacherProfile | null;
  onSaveReport: (reportData: Omit<Report, 'id' | 'created_at' | 'user_id' | 'classroom_id'>) => Promise<void>;
  onGenerateFinalReport: (reportData: Omit<Report, 'id' | 'created_at' | 'user_id' | 'classroom_id'>, studentName: string, studentDataSummary: string) => Promise<string | null>;
  onGenerateReportAdvice: (behavior_tags: string[], audience: ReportAudience) => Promise<string | null>;
}

const today = new Date().toISOString().split('T')[0];
const oneMonthAgo = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];

const initialReportState = {
  student_id: '',
  start_date: oneMonthAgo,
  end_date: today,
  audience: 'parent' as ReportAudience,
  behavior: 'good' as BehaviorRating,
  participation: 'sometimes' as ParticipationRating,
  attitude: 'respectful' as AttitudeRating,
  progress: 'meeting' as ProgressRating,
  comments: '',
  behavior_tags: [] as string[],
};

const useDebounce = (callback: () => void, delay: number, deps: any[]) => {
    useEffect(() => {
        const handler = setTimeout(() => {
            callback();
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, delay]);
};


const FinalReportModal: React.FC<{
  reportText: string;
  onClose: () => void;
}> = ({ reportText, onClose }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageWidth - margin * 2;
    
    doc.setFontSize(16);
    doc.text("Student Progress Report", pageWidth / 2, margin, { align: 'center' });

    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(reportText, usableWidth);
    
    let cursorY = margin + 20;
    const lineHeight = 7; 
    
    for (let i = 0; i < splitText.length; i++) {
      if (cursorY + lineHeight > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(splitText[i], margin, cursorY);
      cursorY += lineHeight;
    }

    doc.save('student_report.pdf');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-scale-in">
        <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-semibold text-card-foreground">Generated Final Report</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted"><XMarkIcon className="w-5 h-5"/></button>
        </div>
        <div className="p-6 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
            {reportText}
        </div>
        <div className="p-6 border-t border-border flex justify-end gap-3">
            <button onClick={handleDownloadPDF} className="px-4 py-2 text-sm font-semibold bg-zinc-600 text-white rounded-lg flex items-center gap-2 hover:bg-zinc-700">
                <ArrowDownTrayIcon className="w-5 h-5"/>
                Download PDF
            </button>
            <button onClick={handleCopy} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg flex items-center gap-2">
                {copied ? <CheckIcon className="w-5 h-5"/> : <ClipboardIcon className="w-5 h-5"/>}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
};

const ReportDataSummary: React.FC<{
    summary: string;
    startDate: string;
    endDate: string;
}> = ({ summary, startDate, endDate }) => {
    return (
        <div className="p-3 bg-muted rounded-lg border border-border text-sm">
            <h4 className="font-semibold text-foreground mb-2">Data Summary ({startDate} to {endDate})</h4>
            <div className="space-y-1 text-muted-foreground whitespace-pre-wrap">{summary}</div>
        </div>
    );
};


const ReportBuilder: React.FC<ReportBuilderProps> = (props) => {
  const { students, reports, onSaveReport, onGenerateFinalReport, onGenerateReportAdvice, assignments, grades, attendanceRecords, pointLogs, behaviorNotes } = props;
  const [formData, setFormData] = useState(initialReportState);
  const [isSaving, setIsSaving] = useState(false);
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false);
  
  const [advice, setAdvice] = useState<string | null>(null);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);

  const studentReports = reports.filter(r => r.student_id === formData.student_id).sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());

  useEffect(() => {
    // Reset form if the selected student is no longer in the list (e.g. class change)
    if (formData.student_id && !students.some(s => s.id === formData.student_id)) {
      setFormData(initialReportState);
    }
  }, [students, formData.student_id]);
  
  const studentDataSummaryString = useMemo(() => {
    if (!formData.student_id) return 'No student selected.';
    const student = students.find(s => s.id === formData.student_id);
    if (!student) return 'Student not found.';

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    end.setHours(23, 59, 59, 999);

    const relevantRecords = attendanceRecords.filter(r => {
        const d = new Date(r.date);
        return r.student_id === student.id && d >= start && d <= end;
    });

    const relevantAssignments = assignments.filter(a => {
        const d = new Date(a.due_date);
        return a.classroom_id === student.classroom_id && d >= start && d <= end;
    });
    const relevantAssignmentIds = new Set(relevantAssignments.map(a => a.id));
    
    const relevantGrades = grades.filter(g => g.student_id === student.id && relevantAssignmentIds.has(g.assignment_id) && g.score !== null);
    
    const avgGrade = relevantGrades.length > 0
        ? (relevantGrades.reduce((sum, g) => {
            const asg = relevantAssignments.find(a => a.id === g.assignment_id);
            return sum + (g.score! / (asg?.max_score || 100)) * 100;
          }, 0) / relevantGrades.length).toFixed(1) + '%'
        : 'N/A';
    
    const points = pointLogs.filter(p => {
        const d = new Date(p.created_at);
        return p.student_id === student.id && d >= start && d <= end;
    }).reduce((sum, p) => sum + p.amount, 0);
    
    const notesCount = behaviorNotes.filter(n => {
         const d = new Date(n.created_at);
        return n.student_id === student.id && d >= start && d <= end;
    }).length;

    const attendance = {
        present: relevantRecords.filter(r => r.status === 'present').length,
        absent: relevantRecords.filter(r => r.status === 'absent').length,
        late: relevantRecords.filter(r => r.status === 'late').length,
    };
    
    const assignmentDetails = relevantAssignments.map(asg => {
        const grade = relevantGrades.find(g => g.assignment_id === asg.id);
        const score = grade ? `${grade.score}/${asg.max_score}` : 'Not Graded';
        return `- ${asg.name} (${asg.type}): ${score}`;
    }).join('\n');

    return `Overall Performance:
- Attendance: ${attendance.present} Present, ${attendance.absent} Absent, ${attendance.late} Late
- Average Grade: ${avgGrade}
- Points Change: ${points > 0 ? `+${points}` : points}
- Behavior Notes Logged: ${notesCount}

Assignment Grades:
${assignmentDetails || "No assignments in this period."}
`;
  }, [formData.student_id, formData.start_date, formData.end_date, students, attendanceRecords, assignments, grades, pointLogs, behaviorNotes]);

  const handleFetchAdvice = useCallback(() => {
    if (!formData.student_id) return;
    setIsGeneratingAdvice(true);
    setAdvice(null);
    const { behavior, participation, attitude, progress, audience } = formData;
    const behavior_tags = [behavior, participation, attitude, progress];
    onGenerateReportAdvice(behavior_tags, audience)
      .then(result => setAdvice(result))
      .finally(() => setIsGeneratingAdvice(false));
  }, [formData, onGenerateReportAdvice]);

  useDebounce(handleFetchAdvice, 1500, [
      formData.behavior, formData.participation, formData.attitude,
      formData.progress, formData.audience, formData.student_id
  ]);

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentId = e.target.value;
    setFormData({ ...initialReportState, student_id: studentId });
    setAdvice(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateFinalReportClick = async () => {
    if (!formData.student_id) return;
    const student = students.find(s => s.id === formData.student_id);
    if (!student) return;
    
    setIsGeneratingFinal(true);
    const reportData = {
        ...formData,
        behavior_tags: [
            formData.behavior,
            formData.participation,
            formData.attitude,
            formData.progress,
        ]
    };
    const result = await onGenerateFinalReport(reportData, student.name, studentDataSummaryString);
    setFinalReport(result);
    setIsGeneratingFinal(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id || isSaving) return;
    setIsSaving(true);
    const reportToSave = {
        ...formData,
        behavior_tags: [
            formData.behavior,
            formData.participation,
            formData.attitude,
            formData.progress,
        ]
    };
    await onSaveReport(reportToSave);
    setIsSaving(false);
    // Do not clear form to allow for minor edits after saving
  };
  
  const loadReport = (report: Report) => {
    setFormData({
        student_id: report.student_id,
        start_date: report.start_date,
        end_date: report.end_date,
        audience: report.audience || 'parent',
        behavior: report.behavior || 'good',
        participation: report.participation || 'sometimes',
        attitude: report.attitude || 'respectful',
        progress: report.progress || 'meeting',
        comments: report.comments,
        behavior_tags: report.behavior_tags || [],
    });
  }

  const renderSelect = (name: keyof typeof formData, label: string, options: { value: string; label: string }[]) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
        <select id={name} name={name} value={formData[name] as string} onChange={handleInputChange} className="w-full p-2 bg-input border border-border rounded-lg capitalize">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
  );
  
  return (
    <div className="bg-card p-6 rounded-2xl shadow-lg shadow-black/5 border border-border transition-all duration-300 hover:shadow-xl">
      <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <DocumentTextIcon className="w-6 h-6 text-primary" />
        Report Builder
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <form onSubmit={handleSave} className="md:col-span-3 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="student_id" className="block text-sm font-medium text-muted-foreground mb-1">Student</label>
                <select id="student_id" name="student_id" value={formData.student_id} onChange={handleStudentChange} required className="w-full p-2 bg-input border border-border rounded-lg">
                    <option value="" disabled>Select a student...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="audience" className="block text-sm font-medium text-muted-foreground mb-1">Report For</label>
                <select id="audience" name="audience" value={formData.audience} onChange={handleInputChange} className="w-full p-2 bg-input border border-border rounded-lg">
                    <option value="parent">Parent/Guardian</option>
                    <option value="principal">Principal/Admin</option>
                    <option value="personal">Personal Use</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-muted-foreground mb-1">Start Date</label>
                    <input type="date" id="start_date" name="start_date" value={formData.start_date} onChange={handleInputChange} className="w-full p-2 bg-input border border-border rounded-lg"/>
                </div>
                <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-muted-foreground mb-1">End Date</label>
                    <input type="date" id="end_date" name="end_date" value={formData.end_date} onChange={handleInputChange} className="w-full p-2 bg-input border border-border rounded-lg"/>
                </div>
                <button type="button" onClick={() => setFormData(prev => ({...initialReportState, student_id: prev.student_id}))} className="self-end w-full px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg">New Report</button>
            </div>
            
             {formData.student_id && <ReportDataSummary summary={studentDataSummaryString} startDate={formData.start_date} endDate={formData.end_date} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {renderSelect('behavior', 'Behavior', [
                    { value: 'excellent', label: 'Excellent' }, { value: 'good', label: 'Good' }, { value: 'needs_improvement', label: 'Needs Improvement' }
                ])}
                {renderSelect('participation', 'Participation', [
                    { value: 'active', label: 'Actively Participates' }, { value: 'sometimes', label: 'Sometimes Participates' }, { value: 'rarely', label: 'Rarely Participates' }
                ])}
                {renderSelect('attitude', 'Attitude', [
                    { value: 'positive', label: 'Positive & Enthusiastic' }, { value: 'respectful', label: 'Respectful' }, { value: 'needs_encouragement', label: 'Needs Encouragement' }
                ])}
                {renderSelect('progress', 'Academic Progress', [
                    { value: 'exceeding', label: 'Exceeding Expectations' }, { value: 'meeting', label: 'Meeting Expectations' }, { value: 'approaching', label: 'Approaching Expectations' }
                ])}
            </div>
             
             {formData.student_id && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-1">
                        <LightBulbIcon className="w-5 h-5"/> Teacher's Assistant
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                        {isGeneratingAdvice ? 'Thinking...' : (advice || 'Select options to get tailored advice.')}
                    </p>
                </div>
             )}

            <div>
                <label htmlFor="comments" className="block text-sm font-medium text-muted-foreground mb-1">Additional Teacher Comments</label>
                <textarea id="comments" name="comments" value={formData.comments} onChange={handleInputChange} rows={5} className="w-full p-2 bg-input border border-border rounded-lg"></textarea>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit" disabled={isSaving || !formData.student_id} className="w-full bg-zinc-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-zinc-700 disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Draft'}
                </button>
                <button type="button" onClick={handleGenerateFinalReportClick} disabled={isGeneratingFinal || !formData.student_id} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50">
                    <SparklesIcon className="w-5 h-5" />
                    {isGeneratingFinal ? 'Generating...' : 'Generate Final Report'}
                </button>
            </div>
        </form>
        <aside className="md:col-span-2">
            <h4 className="font-semibold text-foreground mb-2">Saved Reports</h4>
            <div className="bg-muted p-3 rounded-lg border border-border h-full max-h-[600px] overflow-y-auto">
                {formData.student_id ? (
                    studentReports.length > 0 ? (
                        <ul className="space-y-2">
                            {studentReports.map(report => (
                                <li key={report.id}>
                                    <button onClick={() => loadReport(report)} className="w-full text-left p-2 bg-card rounded-md hover:bg-card/80">
                                        <p className="font-medium text-sm text-card-foreground">Report for {new Date(report.end_date).toLocaleDateString()}</p>
                                        <p className="text-xs text-muted-foreground">For: <span className="capitalize">{report.audience || 'parent'}</span> &middot; Created: {new Date(report.created_at).toLocaleDateString()}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No reports found for this student.</p>
                    )
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Select a student to view their reports.</p>
                )}
            </div>
        </aside>
      </div>
      {finalReport && <FinalReportModal reportText={finalReport} onClose={() => setFinalReport(null)}/>}
    </div>
  );
};

export default ReportBuilder;