
import React, { useState, useEffect, useRef } from 'react';
import { AppData, WeeklyLog } from '../types';
import { API_URL } from '../constants';
import { ArrowLeft, Save, Loader2, RotateCw, CheckCircle, FileText, Calendar } from 'lucide-react';
import { Toast, SectionHeader } from './CommonUI';

interface TeacherLogReviewViewProps {
    studentEmail: string;
    onBack: () => void;
    teacherName: string;
}

export const TeacherLogReviewView: React.FC<TeacherLogReviewViewProps> = ({ studentEmail, onBack, teacherName }) => {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<WeeklyLog[]>([]);
    const [studentName, setStudentName] = useState('');
    const [selectedLog, setSelectedLog] = useState<WeeklyLog | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: string } | null>(null);

    // Review inputs
    const [teacherNote, setTeacherNote] = useState('');
    const [hasSignature, setHasSignature] = useState(false);

    // Canvas
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const showToast = (message: string, type: string = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const res = await fetch(API_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: 'getStudentData', data: { email: studentEmail } })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    setStudentName(result.data.name);
                    const loadedLogs = (result.data.logs || []).map((l: any) => ({
                        ...l,
                        date: l.date ? l.date.split('T')[0] : '',
                        time: l.time ? (l.time.includes('T') ? l.time.split('T')[1].substring(0, 5) : l.time.substring(0, 5)) : ''
                    }));
                    setLogs(loadedLogs);
                } else {
                    showToast("Gagal memuat turun data", "error");
                }
            } catch (e) {
                showToast("Ralat sambungan", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [studentEmail]);

    // Handle Log Selection
    const handleSelectLog = (log: WeeklyLog) => {
        setSelectedLog(log);
        setTeacherNote(log.teacherNote || '');
        setHasSignature(!!log.teacherSignature);
        // Note: Canvas needs to be handled after render
    };

    // Canvas Logic
    useEffect(() => {
        if (selectedLog && canvasRef.current && !hasSignature) {
            // Init canvas only if no signature exists or user wants to redraw
            // But if signature exists, we show image, so canvas is hidden or overlayed
            // Logic handled in render below
        }
        // Simple drawing setup
        if (selectedLog && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) { ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = 'black'; }
        }
    }, [selectedLog, hasSignature]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const clientX = ('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = ('touches' in e) ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        ctx.beginPath(); ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const clientX = ('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = ('touches' in e) ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        ctx.lineTo(x, y); ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearCanvas = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const handleSave = async () => {
        if (!selectedLog) return;
        setSaving(true);

        let sigData = selectedLog.teacherSignature || "";
        if (canvasRef.current && !hasSignature) {
            // If user drew something
            // Check if canvas is empty? simple check not included, assumes interaction
            sigData = canvasRef.current.toDataURL("image/png");
        } else if (hasSignature) {
            // Keeping existing signature
        }

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "saveLogReview",
                    data: {
                        email: studentEmail,
                        logId: selectedLog.id,
                        teacherNote: teacherNote,
                        teacherSignature: sigData
                    }
                })
            });
            const result = await res.json();
            if (result.status === 'success') {
                showToast("Semakan log disimpan!", "success");
                // Update local state
                setLogs(prev => prev.map(l => l.id === selectedLog.id ? { ...l, teacherNote, teacherSignature: sigData } : l));
                setSelectedLog(prev => prev ? { ...prev, teacherNote, teacherSignature: sigData } : null);
                setHasSignature(!!sigData);
            } else {
                showToast("Gagal menyimpan", "error");
            }
        } catch (e) {
            showToast("Ralat sambungan", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-green-600" size={40} /></div>;

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col">
            <Toast notification={toast} onClose={() => setToast(null)} />

            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-slate-600 hover:text-green-700 font-bold"><ArrowLeft size={20} /></button>
                    <div>
                        <h1 className="text-sm font-black text-slate-800 uppercase tracking-wide">Semakan Laporan</h1>
                        <p className="text-[10px] text-slate-500 font-bold">{studentName}</p>
                    </div>
                </div>
                {selectedLog && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-green-700 hover:bg-green-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
                    </button>
                )}
            </div>

            <div className="flex-grow p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* List Sidebar */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm"><FileText size={16} /> Senarai Laporan ({logs.length})</h3>
                        <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                            {logs.length > 0 ? logs.map(log => (
                                <button
                                    key={log.id}
                                    onClick={() => handleSelectLog(log)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${selectedLog?.id === log.id ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-xs text-slate-800 line-clamp-1">{log.type || "Tanpa Tajuk"}</span>
                                        {log.teacherSignature && <CheckCircle size={12} className="text-green-600 mt-0.5" />}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                        <Calendar size={10} /> {log.date}
                                    </div>
                                </button>
                            )) : (
                                <p className="text-center text-xs text-slate-400 italic py-4">Tiada laporan dijumpai.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Review Area */}
                <div className="md:col-span-2">
                    {selectedLog ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            {/* Log Details */}
                            <div className="p-6 bg-slate-50 border-b border-slate-200">
                                <div className="flex justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 uppercase">{selectedLog.type}</h2>
                                        <p className="text-xs text-slate-500 font-medium mt-1">{selectedLog.date} • {selectedLog.time} • {selectedLog.place}</p>
                                    </div>
                                    <div className="px-3 py-1 bg-white border rounded text-xs font-bold text-slate-600 h-fit">
                                        {selectedLog.attendance || "Hadir"}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 text-sm text-slate-700">
                                    <div><strong className="text-xs uppercase text-slate-400 block mb-1">Objektif</strong><p className="bg-white p-2 rounded border border-slate-200">{selectedLog.objective || "-"}</p></div>
                                    <div><strong className="text-xs uppercase text-slate-400 block mb-1">Keterangan</strong><p className="bg-white p-2 rounded border border-slate-200 whitespace-pre-line">{selectedLog.content || "-"}</p></div>
                                    <div><strong className="text-xs uppercase text-slate-400 block mb-1">Refleksi</strong><p className="bg-white p-2 rounded border border-slate-200 italic">{selectedLog.reflection || "-"}</p></div>
                                </div>
                                {(selectedLog.img1 || selectedLog.img2) && (
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        {selectedLog.img1 && <img src={selectedLog.img1} className="w-full h-32 object-contain bg-black/5 rounded border" />}
                                        {selectedLog.img2 && <img src={selectedLog.img2} className="w-full h-32 object-contain bg-black/5 rounded border" />}
                                    </div>
                                )}
                            </div>

                            {/* Review Section */}
                            <div className="p-6">
                                <SectionHeader title="Pengesahan Pegawai" />
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Ulasan Pegawai</label>
                                        <textarea
                                            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                            rows={3}
                                            placeholder="Berikan ulasan..."
                                            value={teacherNote}
                                            onChange={e => setTeacherNote(e.target.value)}
                                        ></textarea>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-end mb-1">
                                            <label className="block text-xs font-bold uppercase text-slate-500">Tandatangan</label>
                                            <button onClick={() => {
                                                if (selectedLog) { setSelectedLog({ ...selectedLog, teacherSignature: '' }); }
                                                setHasSignature(false);
                                                clearCanvas();
                                            }} className="text-[10px] text-red-500 font-bold flex items-center gap-1 hover:underline"><RotateCw size={10} /> Reset</button>
                                        </div>
                                        <div className="border-2 border-dashed border-slate-300 rounded-lg h-40 bg-slate-50 relative overflow-hidden">
                                            {selectedLog.teacherSignature && (
                                                <div className="absolute inset-0 z-10 bg-white flex items-center justify-center pointer-events-none">
                                                    <img src={selectedLog.teacherSignature} className="max-h-full max-w-full p-2 object-contain" />
                                                </div>
                                            )}
                                            <canvas
                                                ref={canvasRef}
                                                width={600}
                                                height={200}
                                                className="w-full h-full cursor-crosshair touch-none block"
                                                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                                                onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                                            />
                                            {!selectedLog.teacherSignature && !hasSignature && <div className="absolute top-2 left-2 pointer-events-none text-[10px] text-slate-300 font-bold">Ruang Tandatangan</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-xl min-h-[400px]">
                            <FileText size={48} className="mb-4 opacity-50" />
                            <p className="font-medium">Pilih laporan untuk disemak.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
