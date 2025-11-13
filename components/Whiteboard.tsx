import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PencilIcon, TrashIcon, CameraIcon, ArrowDownTrayIcon, DocumentPlusIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, StopIcon, CircleIcon, PhotoIcon, HandRaisedIcon, PaintBrushIcon, LineIcon, EraserIcon } from './icons/Icons.tsx';
import { WhiteboardSnapshot, WhiteboardPage, WhiteboardObject, Path, Point, ShapeObject, ImageObject } from '../types';
import { jsPDF } from 'jspdf';

type Tool = 'select' | 'pen' | 'highlighter' | 'eraser' | 'line' | 'rectangle' | 'circle';

const colors = ['#000000', '#EF4444', '#3B82F6', '#22C55E', '#A855F7', '#EAB308'];
const highlighterColors = ['#FEF08A', '#A5B4FC', '#99F6E4', '#FBCFE8', '#FED7AA'];

interface WhiteboardProps {
    classroomId: string | null;
    initialState: string | null;
    snapshots: WhiteboardSnapshot[];
    onSaveState: (state: string) => void;
    onSaveSnapshot: (classroomId: string, imageData: string, name: string) => void;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ classroomId, initialState, snapshots, onSaveState, onSaveSnapshot }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const whiteboardContainerRef = useRef<HTMLDivElement>(null);
    const pageRenameInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [pages, setPages] = useState<WhiteboardPage[]>([]);
    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [tool, setTool] = useState<Tool>('pen');
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);

    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<Path | null>(null);
    const [currentShape, setCurrentShape] = useState<ShapeObject | null>(null);
    
    const [selectedObject, setSelectedObject] = useState<WhiteboardObject | null>(null);
    const [selectionOffset, setSelectionOffset] = useState<Point>({ x: 0, y: 0 });

    const [isRenaming, setIsRenaming] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
    const [snapshotName, setSnapshotName] = useState('');
    
    // --- State & Canvas Management ---

    const getActivePage = useCallback(() => pages.find(p => p.id === activePageId), [pages, activePageId]);

    const updateActivePageState = useCallback((updater: (prevState: WhiteboardObject[]) => WhiteboardObject[]) => {
        setPages(prevPages =>
            prevPages.map(p =>
                p.id === activePageId ? { ...p, state: updater(p.state) } : p
            )
        );
    }, [activePageId]);
    
    const drawObject = useCallback((ctx: CanvasRenderingContext2D, obj: WhiteboardObject): Promise<void> => {
        return new Promise((resolve) => {
            if (obj.type === 'path' || obj.type === 'shape') {
                ctx.strokeStyle = obj.color;
                ctx.lineWidth = obj.lineWidth;
                ctx.globalCompositeOperation = obj.type === 'path' ? obj.compositeOperation : 'source-over';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
    
                if (obj.type === 'path') {
                    if (obj.points.length === 0) {
                        resolve();
                        return;
                    }
                    ctx.moveTo(obj.points[0].x, obj.points[0].y);
                    obj.points.forEach(point => ctx.lineTo(point.x, point.y));
                } else { // shape
                    if (obj.shape === 'rectangle') ctx.rect(obj.x, obj.y, obj.width, obj.height);
                    else if (obj.shape === 'circle') ctx.ellipse(obj.x + obj.width / 2, obj.y + obj.height / 2, Math.abs(obj.width / 2), Math.abs(obj.height / 2), 0, 0, 2 * Math.PI);
                    else if (obj.shape === 'line') {
                        ctx.moveTo(obj.x, obj.y);
                        ctx.lineTo(obj.x + obj.width, obj.y + obj.height);
                    }
                }
                ctx.stroke();
                resolve();
            } else if (obj.type === 'image') {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
                    resolve();
                };
                img.onerror = () => resolve(); // Don't block on failed image
                img.src = obj.src;
            }
        });
    }, []);

    const redrawCanvas = useCallback(async () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        const page = getActivePage();
        if (!canvas || !context || !page) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        for (const obj of page.state) {
            await drawObject(context, obj);
        }
        if (currentPath) await drawObject(context, currentPath);
        if (currentShape) await drawObject(context, currentShape);

    }, [getActivePage, currentPath, currentShape, drawObject]);

    useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas]);

    // --- Initialization & Resizing ---

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        contextRef.current = canvas.getContext('2d');
        try {
            const parsedState = JSON.parse(initialState || '{}');
            if(parsedState.pages && parsedState.activePageId && parsedState.pages.length > 0) {
                setPages(parsedState.pages);
                setActivePageId(parsedState.activePageId);
            } else { throw new Error("Invalid state"); }
        } catch (e) {
            const defaultPageId = `page-${Date.now()}`;
            setPages([{ id: defaultPageId, name: 'Page 1', state: [], order: 0 }]);
            setActivePageId(defaultPageId);
        }
    }, [initialState]);

    const setCanvasSize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { width, height } = canvas.getBoundingClientRect();
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        redrawCanvas();
    }, [redrawCanvas]);

    useEffect(() => {
        window.addEventListener('resize', setCanvasSize);
        setCanvasSize();
        return () => window.removeEventListener('resize', setCanvasSize);
    }, [setCanvasSize]);
    
    // --- State Persistence ---
    const debouncedSave = useCallback(() => {
        const timeoutId = setTimeout(() => {
            if (classroomId && pages.length > 0 && activePageId) {
                onSaveState(JSON.stringify({ pages, activePageId }));
            }
        }, 1500);
        return () => clearTimeout(timeoutId);
    }, [pages, activePageId, classroomId, onSaveState]);

    useEffect(() => {
        const cleanup = debouncedSave();
        return cleanup;
    }, [pages, activePageId, debouncedSave]);

    // --- Page Management ---
    const handleAddPage = () => {
        const newPage: WhiteboardPage = { id: `page-${Date.now()}`, name: `Page ${pages.length + 1}`, state: [], order: pages.length };
        setPages(prev => [...prev, newPage]);
        setActivePageId(newPage.id);
    };

    const handleSwitchPage = (pageId: string) => activePageId !== pageId && setActivePageId(pageId);

    const handleDeletePage = (pageIdToDelete: string) => {
        if(pages.length <= 1) return;
        setPages(prev => {
            const newPages = prev.filter(p => p.id !== pageIdToDelete);
            if(activePageId === pageIdToDelete) {
                setActivePageId(newPages[0]?.id || null);
            }
            return newPages;
        });
    };
    
    const handleRenamePage = (pageId: string) => {
        if (!isRenaming) return;
        setPages(prev => prev.map(p => p.id === pageId ? { ...p, name: renameValue } : p));
        setIsRenaming(null);
        setRenameValue('');
    };
    
    useEffect(() => { isRenaming && pageRenameInputRef.current?.focus() }, [isRenaming]);

    // --- Drawing Logic ---
    const getCoords = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };
    
    const hitTest = (point: Point): WhiteboardObject | null => {
        const page = getActivePage();
        if (!page) return null;
        for (let i = page.state.length - 1; i >= 0; i--) {
            const obj = page.state[i];
            if (obj.type === 'shape' || obj.type === 'image') {
                const objX = Math.min(obj.x, obj.x + obj.width);
                const objY = Math.min(obj.y, obj.y + obj.height);
                const objW = Math.abs(obj.width);
                const objH = Math.abs(obj.height);
                if (point.x >= objX && point.x <= objX + objW && point.y >= objY && point.y <= objY + objH) {
                    return obj;
                }
            }
        }
        return null;
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const startPoint = getCoords(e);
        if (tool === 'select') {
            const hitObject = hitTest(startPoint);
            if (hitObject && hitObject.type !== 'path') { // Path moving not supported yet
                setSelectedObject(hitObject);
                setSelectionOffset({ x: startPoint.x - hitObject.x, y: startPoint.y - hitObject.y });
                setIsDrawing(true);
            }
            return;
        }

        setIsDrawing(true);
        const commonProps = { id: `obj-${Date.now()}`, color, lineWidth };

        if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
            setCurrentPath({
                ...commonProps,
                type: 'path',
                points: [startPoint],
                compositeOperation: tool === 'eraser' ? 'destination-out' : (tool === 'highlighter' ? 'multiply' : 'source-over'),
            });
        } else if (['line', 'rectangle', 'circle'].includes(tool)) {
             setCurrentShape({
                ...commonProps,
                type: 'shape',
                shape: tool as 'line' | 'rectangle' | 'circle',
                x: startPoint.x,
                y: startPoint.y,
                width: 0,
                height: 0,
            });
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const currentPoint = getCoords(e);
        
        if (tool === 'select' && selectedObject && selectedObject.type !== 'path') {
            const newX = currentPoint.x - selectionOffset.x;
            const newY = currentPoint.y - selectionOffset.y;
            const updatedObj = { ...selectedObject, x: newX, y: newY };
            setSelectedObject(updatedObj); // Update local state for immediate feedback
            updateActivePageState(prevState => prevState.map(obj => obj.id === selectedObject.id ? updatedObj : obj));
            return;
        }

        if (currentPath) {
            setCurrentPath(prev => prev ? { ...prev, points: [...prev.points, currentPoint] } : null);
        } else if (currentShape) {
            setCurrentShape(prev => prev ? { ...prev, width: currentPoint.x - prev.x, height: currentPoint.y - prev.y } : null);
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (currentPath) {
            updateActivePageState(prev => [...prev, currentPath]);
            setCurrentPath(null);
        }
        if (currentShape) {
            updateActivePageState(prev => [...prev, currentShape]);
            setCurrentShape(null);
        }
        setSelectedObject(null);
    };
    
    // --- Tools & Actions ---
    const handleClear = () => updateActivePageState(() => []);
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const newImage: ImageObject = {
                        id: `obj-${Date.now()}`,
                        type: 'image',
                        src: img.src,
                        x: 20, y: 20,
                        width: img.width,
                        height: img.height,
                    };
                    updateActivePageState(prev => [...prev, newImage]);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
        e.target.value = ''; // Reset file input
    };

    // --- Fullscreen ---
    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);
    
    const toggleFullscreen = () => {
        if (!whiteboardContainerRef.current) return;
        if (isFullscreen) document.exitFullscreen();
        else whiteboardContainerRef.current.requestFullscreen();
    };
    
    // --- Snapshot & Export ---
    const handleConfirmSaveSnapshot = () => {
        if (!classroomId || !canvasRef.current || !snapshotName.trim()) return;
        const imageData = canvasRef.current.toDataURL('image/png');
        onSaveSnapshot(classroomId, imageData, snapshotName);
        setIsSavingSnapshot(false);
        setSnapshotName('');
    };

    const handleExportPDF = async () => {
        const canvas = canvasRef.current;
        if (!canvas || pages.length === 0) return;

        const originalWidth = canvas.width;
        const originalHeight = canvas.height;
        const orientation = originalWidth > originalHeight ? 'landscape' : 'portrait';

        const pdf = new jsPDF({
            orientation,
            unit: 'px',
            format: [originalWidth, originalHeight]
        });

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = originalWidth;
        offscreenCanvas.height = originalHeight;
        const offscreenCtx = offscreenCanvas.getContext('2d');
        if (!offscreenCtx) return;
        
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            
            // Clear and set background for the page
            offscreenCtx.fillStyle = document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff';
            offscreenCtx.fillRect(0, 0, originalWidth, originalHeight);

            // Draw all objects for the current page
            for (const obj of page.state) {
                await drawObject(offscreenCtx, obj);
            }
            
            const imgData = offscreenCanvas.toDataURL('image/png');
            
            if (i > 0) {
                pdf.addPage([originalWidth, originalHeight], orientation);
            }
            pdf.addImage(imgData, 'PNG', 0, 0, originalWidth, originalHeight);
        }

        pdf.save('whiteboard_export.pdf');
    };

    const ToolButton: React.FC<{ icon: React.ReactElement; label: Tool; title: string; }> = ({ icon, label, title }) => (
        <button
            title={title}
            onClick={() => {
                setTool(label);
                if (label === 'highlighter' && !highlighterColors.includes(color)) setColor(highlighterColors[0]);
                if ((label === 'pen' || label === 'line' || label === 'rectangle' || label === 'circle') && highlighterColors.includes(color)) setColor(colors[0]);
            }}
            className={`p-2.5 rounded-lg transition-colors ${tool === label ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        >
            {React.cloneElement(icon, { className: "w-5 h-5" })}
        </button>
    );

    return (
      <div ref={whiteboardContainerRef} className={`bg-card rounded-2xl shadow-lg shadow-black/5 border border-border transition-all duration-300 hover:shadow-xl flex flex-col md:flex-row ${isFullscreen ? 'fixed inset-0 z-50 !rounded-none' : ''}`}>
        <aside className={`flex-shrink-0 bg-muted/50 border-r border-border p-3 space-y-2 flex flex-col transition-all ${isFullscreen ? 'md:w-64' : 'md:w-52'}`}>
          <h3 className="font-semibold text-foreground px-2">Pages</h3>
          <div className="flex-grow space-y-1 overflow-y-auto">
            {pages.map(page => (
                <div key={page.id} className={`group flex items-center justify-between rounded-lg transition-colors ${activePageId === page.id ? 'bg-primary/10 text-primary' : 'hover:bg-background'}`}>
                    {isRenaming === page.id ? (
                        <input ref={pageRenameInputRef} type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onBlur={() => handleRenamePage(page.id)} onKeyDown={(e) => e.key === 'Enter' && handleRenamePage(page.id)} className="w-full bg-transparent p-2 text-sm font-medium focus:outline-none"/>
                    ) : (
                        <button onClick={() => handleSwitchPage(page.id)} onDoubleClick={() => { setIsRenaming(page.id); setRenameValue(page.name); }} className="flex-grow text-left p-2 text-sm font-medium truncate">{page.name}</button>
                    )}
                    <button onClick={() => handleDeletePage(page.id)} className="p-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><TrashIcon className="w-4 h-4"/></button>
                </div>
            ))}
          </div>
          <button onClick={handleAddPage} className="w-full flex items-center justify-center gap-2 p-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"><DocumentPlusIcon className="w-5 h-5"/> Add Page</button>
        </aside>

        <div className="flex-grow flex flex-col relative">
            <div className={`p-3 border-b border-border flex flex-wrap items-center justify-between gap-x-4 gap-y-2 transition-all ${isFullscreen ? 'absolute top-4 left-4 right-4 z-10 bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg' : ''}`}>
                <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                    <ToolButton icon={<HandRaisedIcon/>} label="select" title="Select & Move"/>
                    <ToolButton icon={<PencilIcon/>} label="pen" title="Pen"/>
                    <ToolButton icon={<PaintBrushIcon/>} label="highlighter" title="Highlighter"/>
                    <ToolButton icon={<LineIcon/>} label="line" title="Line"/>
                    <ToolButton icon={<StopIcon/>} label="rectangle" title="Rectangle"/>
                    <ToolButton icon={<CircleIcon/>} label="circle" title="Circle"/>
                    <ToolButton icon={<EraserIcon/>} label="eraser" title="Eraser"/>
                </div>
                <div className="flex items-center gap-2">
                    {(tool === 'highlighter' ? highlighterColors : colors).map(c => (
                        <button key={c} onClick={() => setColor(c)} style={{ backgroundColor: c }} className={`w-7 h-7 rounded-full transition-transform transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''}`} />
                    ))}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-sm font-medium">Size:</span>
                    <input type="range" min="1" max="50" value={lineWidth} onChange={(e) => setLineWidth(parseInt(e.target.value, 10))} className="w-32 accent-primary" />
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => fileInputRef.current?.click()} title="Import Image" className="p-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"><PhotoIcon className="w-5 h-5"/></button>
                    <button onClick={handleExportPDF} title="Export as PDF" className="p-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"><ArrowDownTrayIcon className="w-5 h-5"/></button>
                    <button onClick={() => setIsSavingSnapshot(true)} title="Save Snapshot" className="p-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"><CameraIcon className="w-5 h-5"/></button>
                    <button onClick={handleClear} title="Clear Canvas" className="p-2.5 rounded-lg text-muted-foreground hover:bg-destructive/20 hover:text-destructive"><TrashIcon className="w-5 h-5"/></button>
                    <button onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} className="p-2.5 rounded-lg text-muted-foreground hover:bg-muted">{isFullscreen ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}</button>
                </div>
            </div>
            <div className={`flex-grow w-full h-[500px] touch-none bg-background ${tool === 'select' ? 'cursor-grab' : 'cursor-crosshair'}`}>
                <canvas ref={canvasRef} className="w-full h-full" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}/>
            </div>
            {snapshots.length > 0 && !isFullscreen && (
                <div className="p-4 border-t border-border">
                    <h4 className="font-semibold text-sm mb-2 text-foreground">Snapshots</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {snapshots.map(snap => (
                            <button key={snap.id} /*onClick={() => loadStateFromSnapshot(snap.image_data)}*/ className="flex-shrink-0 w-32 h-20 rounded-md overflow-hidden ring-1 ring-border hover:ring-2 hover:ring-primary transition-all duration-200 hover:scale-105">
                                <img src={snap.image_data} alt={snap.name} className="w-full h-full object-cover"/>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        {isSavingSnapshot && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm m-4 animate-scale-in">
                <h3 className="text-lg font-semibold text-card-foreground">Save Snapshot</h3>
                <p className="mt-2 text-sm text-muted-foreground">Give this snapshot a name.</p>
                <input type="text" value={snapshotName} onChange={(e) => setSnapshotName(e.target.value)} placeholder={`Snapshot ${new Date().toLocaleDateString()}`} className="w-full p-2 mt-4 bg-input border border-border rounded-lg" autoFocus/>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setIsSavingSnapshot(false)} className="px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg">Cancel</button>
                  <button onClick={handleConfirmSaveSnapshot} disabled={!snapshotName.trim()} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg disabled:opacity-50">Save</button>
                </div>
              </div>
            </div>
          )}
      </div>
    );
};

export default Whiteboard;