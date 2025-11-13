import React, { useState, DragEvent, useEffect, useMemo, useRef } from 'react';
import { TableCellsIcon, TrashIcon, UserCircleIcon, UsersIcon, ShuffleIcon, BookmarkIcon, PlusIcon, ArrowDownTrayIcon } from './icons/Icons.tsx';
import { Desk, Student, SavedLayout } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const GRID_SIZE = 20;

interface LayoutEditorProps {
  classroomId: string;
  students: Student[];
  layout: Desk[];
  savedLayouts: SavedLayout[];
  onUpdateLayout: (newLayout: Desk[]) => void;
  onSaveLayout: (classroomId: string, name: string, layout: Desk[]) => void;
  onDeleteLayout: (layoutId: string) => void;
}

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Fisher-Yates shuffle algorithm
const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const DeskPaletteItem: React.FC<{ type: 'single' | 'double', children: React.ReactNode }> = ({ type, children }) => (
  <div
    draggable onDragStart={(e) => { e.dataTransfer.setData('deskType', type); e.dataTransfer.effectAllowed = 'move'; }}
    className="border-2 border-dashed border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg p-4 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:border-violet-500 hover:text-violet-500 transition-all"
  > {children}
  </div>
);

const LayoutEditor: React.FC<LayoutEditorProps> = (props) => {
  const { classroomId, students, layout, savedLayouts, onUpdateLayout, onSaveLayout, onDeleteLayout } = props;

  const [desks, setDesks] = useState<Desk[]>([]);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const layoutContainerRef = useRef<HTMLDivElement>(null);
  const [draggingStudentId, setDraggingStudentId] = useState<string | null>(null);
  
  useEffect(() => { setDesks(layout ?? []); }, [layout]);

  const debouncedDesks = useDebounce(desks, 1000);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    if(debouncedDesks) { onUpdateLayout(debouncedDesks); }
  }, [debouncedDesks, onUpdateLayout]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const assignedStudentIds = useMemo(() => new Set(desks.flatMap(d => d.studentIds).filter((id): id is string => id !== null)), [desks]);
  const unassignedStudents = useMemo(() => students.filter(s => !assignedStudentIds.has(s.id)), [students, assignedStudentIds]);

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const handleMapDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const deskType = e.dataTransfer.getData('deskType') as 'single' | 'double';
    const draggedDeskId = e.dataTransfer.getData('draggedDeskId');
    const mapRect = e.currentTarget.getBoundingClientRect();
    
    const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

    let left = e.clientX - mapRect.left;
    let top = e.clientY - mapRect.top;

    const deskWidth = deskType === 'single' ? 80 : 168;
    const deskHeight = 56;
    
    const checkCollision = (newDesk: {left: number, top: number, width: number, height: number, id: string}) => {
        for (const desk of desks) {
            if (desk.id === newDesk.id) continue;
            const existingWidth = desk.type === 'single' ? 80 : 168;
            const existingHeight = 56;
            if (newDesk.left < desk.left + existingWidth &&
                newDesk.left + newDesk.width > desk.left &&
                newDesk.top < desk.top + existingHeight &&
                newDesk.top + newDesk.height > desk.top) {
                return true; // Collision detected
            }
        }
        return false;
    };

    if (draggedDeskId) {
      const offsetX = parseFloat(e.dataTransfer.getData('offsetX'));
      const offsetY = parseFloat(e.dataTransfer.getData('offsetY'));
      left = snapToGrid(left - offsetX);
      top = snapToGrid(top - offsetY);
      const draggedDesk = desks.find(d => d.id === draggedDeskId);
      if (draggedDesk) {
          const draggedWidth = draggedDesk.type === 'single' ? 80 : 168;
          if (!checkCollision({left, top, width: draggedWidth, height: 56, id: draggedDeskId})) {
              setDesks(desks.map(d => d.id === draggedDeskId ? { ...d, top, left } : d));
          }
      }
    } else if (deskType) {
      const newDesk: Desk = {
        id: `desk-${Date.now()}`, type: deskType, 
        top: snapToGrid(top - deskHeight / 2), 
        left: snapToGrid(left - deskWidth / 2),
        studentIds: deskType === 'single' ? [null] : [null, null],
      };
      if (!checkCollision({left: newDesk.left, top: newDesk.top, width: deskWidth, height: deskHeight, id: newDesk.id})) {
        setDesks([...desks, newDesk]);
      }
    }
    e.dataTransfer.clearData();
  };

  const handleDeskDragStart = (e: DragEvent<HTMLDivElement>, desk: Desk) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setData('draggedDeskId', desk.id);
    e.dataTransfer.setData('offsetX', offsetX.toString());
    e.dataTransfer.setData('offsetY', offsetY.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStudentDragStart = (e: DragEvent, studentId: string, source: 'unassigned' | 'desk', sourceDeskId?: string, sourceSeatIndex?: number) => {
    e.stopPropagation();
    setDraggingStudentId(studentId);
    e.dataTransfer.setData('studentId', studentId);
    e.dataTransfer.setData('source', source);
    if(sourceDeskId && sourceSeatIndex !== undefined) {
      e.dataTransfer.setData('sourceDeskId', sourceDeskId);
      e.dataTransfer.setData('sourceSeatIndex', sourceSeatIndex.toString());
    }
  };
  
  const handleStudentDragEnd = () => {
    setDraggingStudentId(null);
  }

  const handleSeatDrop = (e: DragEvent, targetDeskId: string, targetSeatIndex: number) => {
    e.preventDefault(); e.stopPropagation();
    const studentId = e.dataTransfer.getData('studentId');
    if (!studentId) return;

    const source = e.dataTransfer.getData('source');
    const sourceDeskId = e.dataTransfer.getData('sourceDeskId');
    const sourceSeatIndex = parseInt(e.dataTransfer.getData('sourceSeatIndex'), 10);
    
    let newDesks = JSON.parse(JSON.stringify(desks));
    const targetDesk = newDesks.find((d: Desk) => d.id === targetDeskId);
    if (!targetDesk) return;

    const studentAtTarget = targetDesk.studentIds[targetSeatIndex];
    if (studentAtTarget === studentId) return;

    if (source === 'desk') {
      const sourceDesk = newDesks.find((d: Desk) => d.id === sourceDeskId);
      if (sourceDesk) {
        sourceDesk.studentIds[sourceSeatIndex] = studentAtTarget;
        targetDesk.studentIds[targetSeatIndex] = studentId;
      }
    } else { 
      const existingDesk = newDesks.find((d: Desk) => d.studentIds.includes(studentId));
      if(existingDesk) {
          const seatIdx = existingDesk.studentIds.indexOf(studentId);
          existingDesk.studentIds[seatIdx] = studentAtTarget;
      }
      targetDesk.studentIds[targetSeatIndex] = studentId;
    }
    setDesks(newDesks);
  }

  const handleUnassignedDrop = (e: DragEvent) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData('studentId');
    const source = e.dataTransfer.getData('source');
    if (source !== 'desk' || !studentId) return;
    
    const sourceDeskId = e.dataTransfer.getData('sourceDeskId');
    const sourceSeatIndex = parseInt(e.dataTransfer.getData('sourceSeatIndex'), 10);

    const newDesks = desks.map(desk => {
      if (desk.id === sourceDeskId) {
        const newStudentIds = [...desk.studentIds];
        newStudentIds[sourceSeatIndex] = null;
        return { ...desk, studentIds: newStudentIds };
      }
      return desk;
    });
    setDesks(newDesks);
  }

  const handleTrashDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedDeskId = e.dataTransfer.getData('draggedDeskId');
    if (draggedDeskId) { setDesks(desks.filter(d => d.id !== draggedDeskId)); }
    setIsOverTrash(false);
  };
  
  const handleRandomizeSeating = () => {
    if (students.length === 0 || desks.length === 0) return;

    const shuffledStudents = shuffle([...students]);
    const newDesks = JSON.parse(JSON.stringify(desks));

    for (const desk of newDesks) {
        for (let i = 0; i < desk.studentIds.length; i++) { desk.studentIds[i] = null; }
    }

    let studentIndex = 0;
    for (const desk of newDesks) {
        for (let seatIndex = 0; seatIndex < desk.studentIds.length; seatIndex++) {
            if (studentIndex < shuffledStudents.length) {
                desk.studentIds[seatIndex] = shuffledStudents[studentIndex].id;
                studentIndex++;
            } else { break; }
        }
        if (studentIndex >= shuffledStudents.length) { break; }
    }
    setDesks(newDesks);
  };
  
  const handleClearSeats = () => {
    setDesks(prev => prev.map(desk => ({ ...desk, studentIds: desk.studentIds.map(() => null) })));
  };

  const handleConfirmSave = () => {
    if (newLayoutName.trim()) {
      onSaveLayout(classroomId, newLayoutName, desks);
      setIsSaving(false);
      setNewLayoutName('');
    }
  };
  
  const handleLoadLayout = (layoutToLoad: Desk[]) => {
    setDesks(layoutToLoad);
    setIsDropdownOpen(false);
  }
  
  const handleExportPDF = () => {
    if (!layoutContainerRef.current) return;
    const elementToCapture = layoutContainerRef.current;
    
    html2canvas(elementToCapture, {
        useCORS: true,
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fafafa',
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('seating_chart.pdf');
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg shadow-slate-900/10 border border-zinc-200 dark:border-slate-800 transition-all duration-300 hover:shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <TableCellsIcon className="w-6 h-6 text-violet-500" />
          Classroom Layout & Seating
        </h3>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleClearSeats}
                disabled={desks.length === 0}
                className="flex items-center gap-2 bg-zinc-200 dark:bg-slate-800 text-zinc-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-zinc-300 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <TrashIcon className="w-5 h-5"/>
                Clear Seats
            </button>
            <button 
                onClick={handleRandomizeSeating}
                disabled={students.length === 0 || desks.length === 0}
                className="flex items-center gap-2 bg-zinc-200 dark:bg-slate-800 text-zinc-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-zinc-300 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <ShuffleIcon className="w-5 h-5"/>
                Randomize
            </button>
             <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                  className="flex items-center gap-2 bg-zinc-200 dark:bg-slate-800 text-zinc-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-zinc-300 dark:hover:bg-slate-700 transition-colors"
                >
                    <BookmarkIcon className="w-5 h-5"/>
                    Saved Layouts
                </button>
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-zinc-200 dark:border-slate-700 z-10 overflow-hidden transition-colors">
                        <button onClick={() => { setIsSaving(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-slate-200 hover:bg-zinc-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors">
                            <PlusIcon className="w-4 h-4" />
                            Save current arrangement...
                        </button>
                        {savedLayouts.length > 0 && <hr className="border-zinc-200 dark:border-slate-700"/>}
                        <div className="max-h-60 overflow-y-auto">
                        {savedLayouts.map(sl => (
                            <div key={sl.id} className="group px-4 py-2 text-sm flex justify-between items-center">
                                <span className="text-zinc-800 dark:text-slate-200 truncate pr-2">{sl.name}</span>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleLoadLayout(sl.layout)} className="p-1.5 text-zinc-500 dark:text-slate-400 hover:text-violet-500 rounded-md transition-colors">Load</button>
                                    <button onClick={() => onDeleteLayout(sl.id)} className="p-1.5 text-zinc-500 dark:text-slate-400 hover:text-red-500 rounded-md transition-colors"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
            </div>
            <button
              onClick={handleExportPDF}
              disabled={desks.length === 0}
              className="flex items-center gap-2 bg-zinc-200 dark:bg-slate-800 text-zinc-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-zinc-300 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export PDF
            </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-6">
          <div onDrop={handleUnassignedDrop} onDragOver={handleDragOver} className="p-4 bg-zinc-100 dark:bg-slate-800 rounded-lg border border-zinc-200 dark:border-slate-700 space-y-2 transition-colors">
            <h4 className="font-semibold text-center flex items-center justify-center gap-2"><UsersIcon className="w-5 h-5"/> Unassigned Students ({unassignedStudents.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {unassignedStudents.map(student => (
                <div key={student.id} draggable onDragStart={(e) => handleStudentDragStart(e, student.id, 'unassigned')} onDragEnd={handleStudentDragEnd} className="bg-white dark:bg-slate-700 p-2 rounded-md flex items-center gap-2 cursor-grab active:cursor-grabbing text-sm transition-colors">
                  {student.avatar_url ? <img src={student.avatar_url} alt={student.name} className="w-6 h-6 rounded-full"/> : <UserCircleIcon className="w-6 h-6 text-zinc-400 dark:text-slate-500"/>}
                  <span className="font-medium">{student.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-zinc-100 dark:bg-slate-800 rounded-lg border border-zinc-200 dark:border-slate-700 space-y-4 transition-colors">
            <h4 className="font-semibold text-center">Desk Palette</h4>
            <DeskPaletteItem type="single">
              <div className="bg-zinc-200 dark:bg-slate-700 rounded-md w-20 h-14 border border-zinc-300 dark:border-slate-600 mb-2 transition-colors"></div>
              <span className="text-sm font-medium">Single Desk</span>
            </DeskPaletteItem>
            <DeskPaletteItem type="double">
              <div className="flex gap-1.5 mb-2">
                <div className="bg-zinc-200 dark:bg-slate-700 rounded-md w-[68px] h-14 border border-zinc-300 dark:border-slate-600 transition-colors"></div>
                <div className="bg-zinc-200 dark:bg-slate-700 rounded-md w-[68px] h-14 border border-zinc-300 dark:border-slate-600 transition-colors"></div>
              </div>
              <span className="text-sm font-medium">Double Desk</span>
            </DeskPaletteItem>
          </div>
          <div onDrop={handleTrashDrop} onDragOver={(e) => { e.preventDefault(); setIsOverTrash(true); }} onDragLeave={() => setIsOverTrash(false)}
            className={`p-4 h-32 flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${ isOverTrash ? 'border-red-500 bg-red-100 dark:bg-red-900/50' : 'border-zinc-300 dark:border-slate-600' }`}>
            <TrashIcon className={`w-8 h-8 transition-colors ${isOverTrash ? 'text-red-500' : 'text-zinc-500 dark:text-slate-400'}`} />
            <p className={`mt-2 text-sm font-medium ${isOverTrash ? 'text-red-600' : 'text-zinc-500 dark:text-slate-400'}`}> Remove Desk</p>
          </div>
        </aside>

        <main ref={layoutContainerRef} className="flex-grow min-h-[500px] relative rounded-lg border border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800/50 transition-colors"
          style={{ backgroundImage: `linear-gradient(rgba(228, 228, 231, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(228, 228, 231, 0.5) 1px, transparent 1px)`, backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` }}
          onDrop={handleMapDrop} onDragOver={handleDragOver}>
          <div className="absolute top-1/2 -left-px -translate-y-1/2 bg-zinc-200 dark:bg-slate-700 px-3 py-1 text-xs font-bold text-zinc-600 dark:text-slate-300 rounded-r-full shadow transition-colors">FRONT</div>
          {desks.map(desk => (
            <div key={desk.id} draggable onDragStart={(e) => handleDeskDragStart(e, desk)} style={{ top: desk.top, left: desk.left }} className="absolute cursor-grab active:cursor-grabbing p-1 group transition-transform duration-200 ease-in-out">
                <div className="flex gap-1.5">
                {desk.studentIds.map((studentId, seatIndex) => {
                    const student = students.find(s => s.id === studentId);
                    const deskWidth = desk.type === 'single' ? 'w-20' : 'w-[74px]';
                    const isDropTarget = draggingStudentId && !studentId;
                    return (
                        <div key={seatIndex} onDrop={(e) => handleSeatDrop(e, desk.id, seatIndex)} onDragOver={handleDragOver}
                             className={`bg-zinc-300 dark:bg-slate-700 rounded-md ${deskWidth} h-14 flex items-center justify-center text-xs text-zinc-600 dark:text-slate-300 border border-zinc-400 dark:border-slate-600 shadow-md transition-all ${isDropTarget ? 'ring-2 ring-violet-500 bg-violet-100 dark:bg-violet-900/50' : ''}`}>
                            {student ? (
                                <div draggable onDragStart={(e) => handleStudentDragStart(e, student.id, 'desk', desk.id, seatIndex)} onDragEnd={handleStudentDragEnd} className="flex flex-col items-center gap-1 text-center w-full h-full justify-center bg-white dark:bg-slate-600 rounded-[5px] p-1">
                                    {student.avatar_url ? <img src={student.avatar_url} className="w-6 h-6 rounded-full"/> : <UserCircleIcon className="w-6 h-6 text-zinc-500 dark:text-slate-400"/>}
                                    <span className="font-semibold truncate w-full leading-tight dark:text-white">{student.name}</span>
                                </div>
                            ) : <span className="text-zinc-500 dark:text-slate-400 italic">Empty</span>}
                        </div>
                    )
                })}
                </div>
            </div>
          ))}
        </main>
      </div>
      {isSaving && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm m-4 animate-scale-in transition-colors">
            <h3 className="text-lg font-semibold">Save Arrangement</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-slate-400">Give this seating arrangement a name to save it for later use.</p>
            <input
                type="text"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder="e.g., Group Work Setup"
                className="w-full p-2 mt-4 bg-zinc-100 dark:bg-slate-800 border border-zinc-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-500 transition-colors"
                autoFocus
            />
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsSaving(false)} className="px-4 py-2 text-sm font-semibold bg-zinc-100 dark:bg-slate-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleConfirmSave} disabled={!newLayoutName.trim()} className="px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg disabled:bg-slate-400 hover:bg-violet-700 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutEditor;