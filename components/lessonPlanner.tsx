import React, { useState, useMemo } from 'react';
import { Lesson, Student } from '../types.ts';
import { CalendarDaysIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon, DocumentDuplicateIcon, UserCircleIcon } from './icons/Icons.tsx';

type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
const daysOfWeek: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface LessonPlannerProps {
  lessons: Lesson[];
  students: Student[];
  onAddLesson: (lessonData: Omit<Lesson, 'id' | 'classroom_id'>) => Promise<void>;
  onUpdateLesson: (lessonId: string, updatedData: Partial<Omit<Lesson, 'id' | 'classroom_id'>>) => Promise<void>;
  onDeleteLesson: (lessonId: string) => Promise<void>;
}

const LessonModal: React.FC<{
  lesson: Partial<Lesson> | null;
  students: Student[];
  onSave: (lessonData: Omit<Lesson, 'id' | 'classroom_id'>) => void;
  onClose: () => void;
  isSaving: boolean;
}> = ({ lesson, students, onSave, onClose, isSaving }) => {
  const [title, setTitle] = useState(lesson?.title || '');
  const [topic, setTopic] = useState(lesson?.topic || '');
  const [materials, setMaterials] = useState(lesson?.materials || '');
  const [day, setDay] = useState<Day>(lesson?.day_of_week || 'Monday');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(lesson?.student_ids || []);
  const [recurrence, setRecurrence] = useState<'once' | 'weekly'>(lesson?.recurrence_type || 'once');
  const [startDate, setStartDate] = useState(lesson?.start_date || new Date().toISOString().split('T')[0]);

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, topic, materials, day_of_week: day, student_ids: selectedStudentIds, recurrence_type: recurrence, start_date: startDate });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-lg m-4 animate-scale-in">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">{lesson?.id ? 'Edit Lesson' : 'Add New Lesson'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="day_of_week" className="block text-sm font-medium text-muted-foreground mb-1">Day</label>
              <select id="day_of_week" value={day} onChange={(e) => setDay(e.target.value as Day)} className="w-full p-2 bg-input border border-border rounded-lg">
                {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
              <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Introduction to Algebra" required className="w-full p-2 bg-input border border-border rounded-lg"/>
            </div>
          </div>
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-muted-foreground mb-1">Topic</label>
            <input id="topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Key concepts, chapters" className="w-full p-2 bg-input border border-border rounded-lg"/>
          </div>
          <div>
            <label htmlFor="materials" className="block text-sm font-medium text-muted-foreground mb-1">Materials / Resources</label>
            <textarea id="materials" value={materials} onChange={(e) => setMaterials(e.target.value)} rows={3} placeholder="Textbooks, worksheets, links, etc." className="w-full p-2 bg-input border border-border rounded-lg"></textarea>
          </div>
          <div>
            <p className="block text-sm font-medium text-muted-foreground mb-2">Assign to Students (optional)</p>
            <div className="max-h-32 overflow-y-auto bg-input border border-border rounded-lg p-2 space-y-1">
              <label className="flex items-center gap-2 p-1 rounded hover:bg-muted cursor-pointer">
                <input type="checkbox" checked={selectedStudentIds.length === students.length} onChange={() => setSelectedStudentIds(selectedStudentIds.length === students.length ? [] : students.map(s => s.id))} className="rounded text-primary focus:ring-primary"/>
                All Students
              </label>
              {students.map(s => (
                <label key={s.id} className="flex items-center gap-2 p-1 rounded hover:bg-muted cursor-pointer">
                  <input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={() => handleStudentSelect(s.id)} className="rounded text-primary focus:ring-primary"/>
                  {s.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Lesson'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};


const LessonPlanner: React.FC<LessonPlannerProps> = ({ lessons, students, onAddLesson, onUpdateLesson, onDeleteLesson }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  
  const lessonsByDay = useMemo(() => {
    const grouped: { [key in Day]: Lesson[] } = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] };
    lessons.forEach(lesson => {
      if (grouped[lesson.day_of_week]) {
        grouped[lesson.day_of_week].push(lesson);
      }
    });
    return grouped;
  }, [lessons]);

  const handleOpenModal = (lesson?: Lesson, day?: Day) => {
    setEditingLesson(lesson ? { ...lesson } : { day_of_week: day });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLesson(null);
  };
  
  const handleSaveLesson = async (lessonData: Omit<Lesson, 'id' | 'classroom_id'>) => {
    setIsSaving(true);
    if (editingLesson?.id) {
        await onUpdateLesson(editingLesson.id, lessonData);
    } else {
        await onAddLesson(lessonData);
    }
    setIsSaving(false);
    handleCloseModal();
  };
  
  const handleDuplicate = async (lesson: Lesson) => {
    const { id, classroom_id, ...lessonData } = lesson;
    await onAddLesson(lessonData);
  };

  return (
    <div className="bg-card p-6 rounded-2xl shadow-lg shadow-black/5 border border-border transition-all duration-300 hover:shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          <CalendarDaysIcon className="w-6 h-6 text-primary" />
          Weekly Lesson Planner
        </h3>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">
          <PlusIcon className="w-5 h-5" /> Add Lesson
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {daysOfWeek.map(day => (
          <div key={day} className="bg-muted p-3 rounded-lg border border-border min-h-[200px] flex flex-col">
            <h4 className="font-bold text-center text-foreground mb-3">{day}</h4>
            <div className="space-y-2 flex-grow">
              {lessonsByDay[day].map(lesson => (
                <div key={lesson.id} className="group bg-card p-2 rounded-md shadow-sm border border-border relative">
                  <p className="font-semibold text-sm text-card-foreground truncate">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{lesson.topic}</p>
                  {lesson.student_ids && lesson.student_ids.length > 0 && lesson.student_ids.length < students.length && (
                      <div className="flex -space-x-2 mt-2" title={lesson.student_ids.map(id => studentMap.get(id)?.name).join(', ')}>
                          {lesson.student_ids.slice(0,3).map(id => {
                              const student = studentMap.get(id);
                              return student?.avatar_url ? <img key={id} src={student.avatar_url} className="w-5 h-5 rounded-full ring-2 ring-card"/> : <UserCircleIcon key={id} className="w-5 h-5 rounded-full ring-2 ring-card bg-card text-muted-foreground"/>
                          })}
                          {lesson.student_ids.length > 3 && <span className="text-xs w-5 h-5 rounded-full bg-muted flex items-center justify-center ring-2 ring-card">+{lesson.student_ids.length - 3}</span>}
                      </div>
                  )}
                  <div className="absolute top-1 right-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-card/50 backdrop-blur-sm rounded-full">
                      <button onClick={() => handleOpenModal(lesson)} title="Edit" className="p-1.5 text-muted-foreground hover:text-primary"><PencilIcon className="w-4 h-4"/></button>
                      <button onClick={() => handleDuplicate(lesson)} title="Duplicate" className="p-1.5 text-muted-foreground hover:text-primary"><DocumentDuplicateIcon className="w-4 h-4"/></button>
                      <button onClick={() => onDeleteLesson(lesson.id)} title="Delete" className="p-1.5 text-muted-foreground hover:text-destructive"><TrashIcon className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => handleOpenModal(undefined, day)} className="w-full mt-2 p-1.5 text-sm text-muted-foreground hover:bg-card rounded-md">+ Add</button>
          </div>
        ))}
      </div>
      {isModalOpen && <LessonModal lesson={editingLesson} students={students} onSave={handleSaveLesson} onClose={handleCloseModal} isSaving={isSaving}/>}
    </div>
  );
};

export default LessonPlanner;
