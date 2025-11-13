import React, { useState, useMemo } from 'react';
import { Assignment, Student, Grade } from '../../types';
import AssignmentManager from '../AssignmentManager';
import { UserCircleIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon, CheckIcon, XMarkIcon } from '../icons/Icons.tsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AssignmentsViewProps {
  assignments: Assignment[];
  students: Student[];
  grades: Grade[];
  onAddAssignment: (assignment: Omit<Assignment, 'id' | 'classroom_id'>) => Promise<void>;
  onUpdateAssignment: (assignmentId: string, updatedData: Partial<Omit<Assignment, 'id' | 'classroom_id'>>) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onUpdateGrade: (studentId: string, assignmentId: string, score: number | null) => void;
}

const AssignmentsView: React.FC<AssignmentsViewProps> = ({ assignments, students, grades, onAddAssignment, onUpdateAssignment, onDeleteAssignment, onUpdateGrade }) => {
  const [editingCell, setEditingCell] = useState<{ studentId: string; assignmentId: string } | null>(null);
  const [gradeValue, setGradeValue] = useState<string | number>('');
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Assignment>>({});

  const gradeMap = useMemo(() => {
    const map = new Map<string, number | null>();
    grades.forEach(g => {
      map.set(`${g.student_id}-${g.assignment_id}`, g.score);
    });
    return map;
  }, [grades]);
  
  const sortedAssignments = useMemo(() => [...assignments].sort((a,b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()), [assignments]);

  const handleEdit = (studentId: string, assignmentId: string) => {
    setEditingCell({ studentId, assignmentId });
    setGradeValue(gradeMap.get(`${studentId}-${assignmentId}`) ?? '');
  };

  const handleSave = (studentId: string, assignmentId: string) => {
    const score = gradeValue === '' ? null : Number(gradeValue);
    if (score !== null && isNaN(score)) return;
    onUpdateGrade(studentId, assignmentId, score);
    setEditingCell(null);
  };
  
  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setEditFormData({ name: assignment.name, due_date: assignment.due_date, max_score: assignment.max_score });
  };

  const handleSaveAssignment = () => {
    if (!editingAssignment || !editFormData.name?.trim()) return;
    onUpdateAssignment(editingAssignment.id, { name: editFormData.name, due_date: editFormData.due_date, max_score: editFormData.max_score });
    setEditingAssignment(null);
  };
  
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("Gradebook", 14, 15);
    autoTable(doc, {
        startY: 20,
        head: [['Student Name', ...sortedAssignments.map(a => `${a.name} (/${a.max_score})`)]],
        body: students.map(student => [
            student.name,
            ...sortedAssignments.map(a => {
                const grade = gradeMap.get(`${student.id}-${a.id}`);
                return grade !== undefined && grade !== null ? grade.toString() : '-';
            })
        ]),
        headStyles: { fontSize: 8 },
        bodyStyles: { fontSize: 8 },
    });
    doc.save('gradebook.pdf');
  };

  if (students.length === 0) {
      return (
         <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Add students to your class to start managing assignments.</p>
        </div>
      )
  }

  return (
    <div className="space-y-8">
      <AssignmentManager assignments={assignments} onAddAssignment={onAddAssignment} />
      
      <div className="bg-card p-6 rounded-2xl border border-border">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-card-foreground">Gradebook</h2>
            <button onClick={handleExportPDF} disabled={assignments.length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg disabled:opacity-50">
                <ArrowDownTrayIcon className="w-4 h-4" /> Export as PDF
            </button>
        </div>
        {assignments.length > 0 ? (
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                <tr>
                    <th className="p-3 font-semibold rounded-l-lg">Student</th>
                    {sortedAssignments.map(a => (
                    <th key={a.id} className="p-3 font-semibold text-center whitespace-nowrap group">
                      {editingAssignment?.id === a.id ? (
                        <div className="flex flex-col items-center gap-1">
                          <input value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="p-1 rounded bg-background text-foreground text-center" />
                          <input type="number" value={editFormData.max_score} onChange={e => setEditFormData({...editFormData, max_score: Number(e.target.value)})} className="p-1 w-16 rounded bg-background text-foreground text-center" />
                        </div>
                      ) : (
                        <>
                          {a.name}<br/><span className="font-normal text-xs"> (/{a.max_score})</span>
                        </>
                      )}
                      <div className="absolute top-0 right-0 p-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingAssignment?.id === a.id ? (
                          <>
                            <button onClick={handleSaveAssignment} className="p-1 text-primary"><CheckIcon className="w-4 h-4"/></button>
                            <button onClick={() => setEditingAssignment(null)} className="p-1 text-destructive"><XMarkIcon className="w-4 h-4"/></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEditAssignment(a)} className="p-1"><PencilIcon className="w-4 h-4"/></button>
                            <button onClick={() => onDeleteAssignment(a.id)} className="p-1 text-destructive"><TrashIcon className="w-4 h-4"/></button>
                          </>
                        )}
                      </div>
                    </th>
                    ))}
                    <th className="p-3 font-semibold rounded-r-lg"></th>
                </tr>
                </thead>
                <tbody>
                {students.map(student => (
                    <tr key={student.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                        {student.avatar_url ? <img src={student.avatar_url} alt={student.name} className="w-7 h-7 rounded-full"/> : <UserCircleIcon className="w-7 h-7 text-muted-foreground"/>}
                        {student.name}
                        </div>
                    </td>
                    {sortedAssignments.map(asg => {
                        const isEditing = editingCell?.studentId === student.id && editingCell?.assignmentId === asg.id;
                        return (
                        <td key={asg.id} className="p-2 text-center">
                            {isEditing ? (
                            <input
                                type="number"
                                value={gradeValue}
                                onChange={(e) => setGradeValue(e.target.value)}
                                onBlur={() => handleSave(student.id, asg.id)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSave(student.id, asg.id)}
                                className="w-16 p-1 text-center bg-input border rounded-md"
                                max={asg.max_score} min="0" autoFocus
                            />
                            ) : (
                            <button onClick={() => handleEdit(student.id, asg.id)} className="w-16 h-8 rounded-md hover:bg-muted font-medium">
                                {gradeMap.get(`${student.id}-${asg.id}`) ?? '-'}
                            </button>
                            )}
                        </td>
                        );
                    })}
                    <td></td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        ): (
            <p className="text-center text-muted-foreground py-8">No assignments created yet. Add one above to get started.</p>
        )}
      </div>
    </div>
  );
};

export default AssignmentsView;