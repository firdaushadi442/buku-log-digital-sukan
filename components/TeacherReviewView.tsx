
import React, { useState, useEffect, useRef } from 'react';
import { AppData, WeeklyLog } from '../types';
import { API_URL, STATIC_CONTENT, CLUBS_CONFIG } from '../constants';
import { ArrowLeft, Save, PenTool, Eye, Loader2, CheckCircle, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { A4Page, CoverPage, BiodataPage, OrganizationPage, PrintLogs } from './PreviewViews';
import { SectionHeader, Toast } from './CommonUI';

interface TeacherReviewViewProps {
    studentEmail: string;
    onBack: () => void;
    teacherName: string; // Used for display
}

// Utility for formatting
const formatDateStr = (str: string) => (!str ? "" : str.split('T')[0]);

const KRS_AUDIO_URL = "https://raw.githubusercontent.com/g-59129199-Firdaus/projek-sekolah/3d870f12a20a47152ce4e331d41794212e8eeca1/Lagu%20Kadet%20Remaja%20Sekolah%20%5Blirik%5D.mp3";

export const TeacherReviewView: React.FC<TeacherReviewViewProps> = ({ studentEmail, onBack, teacherName }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AppData | null>(null);
    const [activeTab, setActiveTab] = useState<'signature' | 'preview'>('signature');
    const [saving, setSaving] = useState(false);
    const [comment, setComment] = useState('');
    const [toast, setToast] = useState<{ message: string, type: string } | null>(null);

    // Preview Navigation State
    const [previewPageIndex, setPreviewPageIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);

    // Canvas Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    const showToast = (message: string, type: string = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const fetchStudentData = async () => {
            setLoading(true);
            try {
                const res = await fetch(API_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: 'getStudentData', data: { email: studentEmail } })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    const loadedProfile = result.data.profile || {};
                    // Helper to clean dates
                    let formattedDob = '';
                    if (loadedProfile.dob) {
                        const d = new Date(loadedProfile.dob);
                        formattedDob = isNaN(d.getTime()) ? loadedProfile.dob : d.toISOString().split('T')[0];
                    }

                    const studentData: AppData = {
                        ...loadedProfile,
                        studentName: result.data.name,
                        schoolName: loadedProfile.schoolName || 'SMA ULU JEMPOL',
                        year: loadedProfile.year || new Date().getFullYear(),
                        ic: result.data.ic,
                        form: result.data.form,
                        dob: formattedDob,
                        schedule: loadedProfile.schedule || [],
                        logs: (result.data.logs || []).map((l: any) => ({
                            ...l,
                            date: l.date ? l.date.split('T')[0] : '',
                            time: l.time ? (l.time.includes('T') ? l.time.split('T')[1].substring(0, 5) : l.time.substring(0, 5)) : ''
                        })),
                        achievements: loadedProfile.achievements || [],
                        skills: loadedProfile.skills || {},
                        skillsNotes: loadedProfile.skillsNotes || '',
                        studentSummary: loadedProfile.studentSummary || '',
                        teacherComment: loadedProfile.teacherComment || '',
                        teacherSignature: loadedProfile.teacherSignature || '',
                    };

                    setData(studentData);
                    setComment(studentData.teacherComment);
                    if (studentData.teacherSignature) {
                        setHasSignature(true);
                    }
                } else {
                    showToast(result.message || "Gagal memuat turun data murid", "error");
                }
            } catch (e) {
                showToast("Ralat sambungan", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [studentEmail]);

    // Canvas Logic
    useEffect(() => {
        if (activeTab === 'signature' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.strokeStyle = 'black';
            }

            const preventDefault = (e: TouchEvent) => {
                if (e.target === canvas) e.preventDefault();
            };
            document.body.addEventListener('touchstart', preventDefault, { passive: false });
            document.body.addEventListener('touchmove', preventDefault, { passive: false });

            return () => {
                document.body.removeEventListener('touchstart', preventDefault);
                document.body.removeEventListener('touchmove', preventDefault);
            };
        }
    }, [activeTab]);

    // Swipe Logic
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchStartX.current - touchEndX;
        const threshold = 50;

        if (deltaX > threshold) {
            setPreviewPageIndex(p => Math.min(previewPages.length - 1, p + 1));
        }
        else if (deltaX < -threshold) {
            setPreviewPageIndex(p => Math.max(0, p - 1));
        }
        touchStartX.current = null;
    };

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

        ctx.beginPath();
        ctx.moveTo(x, y);
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

        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const handleSave = async () => {
        if (!data) return;
        setSaving(true);

        let signatureBase64 = data.teacherSignature || "";
        if (canvasRef.current && hasSignature) {
            signatureBase64 = canvasRef.current.toDataURL("image/png");
        }

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "saveTeacherReview",
                    data: {
                        email: studentEmail,
                        teacherComment: comment,
                        teacherSignature: signatureBase64
                    }
                })
            });
            const result = await res.json();
            if (result.status === 'success') {
                showToast("Semakan berjaya disimpan!", "success");
                setData(prev => prev ? ({ ...prev, teacherComment: comment, teacherSignature: signatureBase64 }) : null);
            } else {
                showToast("Gagal menyimpan semakan", "error");
            }
        } catch (e) {
            showToast("Ralat sambungan", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px]">
                <Loader2 className="animate-spin text-green-600 mb-2" size={32} />
                <p className="text-sm font-medium text-slate-500">Memuat turun buku log murid...</p>
            </div>
        );
    }

    if (!data) return <div className="p-8 text-center">Data tidak dijumpai.</div>;

    const mockTeacherList = [{ name: teacherName, email: data.teacher }];

    // Construct Pages Array
    const previewPages = [
        <CoverPage data={data} />,
        <div className="space-y-8">
            <BiodataPage data={data} teachersList={mockTeacherList} />
            <div className="mt-8 border-t-2 border-dashed border-slate-300 pt-8">
                <SectionHeader title="3. Visi & Misi" />
                <div className="space-y-4">
                    <div className="bg-green-50 p-4 border-l-4 border-green-600"><h3 className="font-bold text-sm">VISI</h3><p className="text-xs whitespace-pre-line">{data.customVisi || STATIC_CONTENT.visi}</p></div>
                    <div className="bg-blue-50 p-4 border-l-4 border-blue-600"><h3 className="font-bold text-sm">MISI</h3><p className="text-xs whitespace-pre-line">{data.customMisi || STATIC_CONTENT.misi}</p></div>
                </div>
            </div>
        </div>,
        <div className="h-full flex flex-col justify-between">
            <div>
                <SectionHeader title="4. Logo & Bendera" />
                <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-4">
                    <div className="flex flex-col items-center">
                        <img src={data?.customLogo || (data?.clubName && CLUBS_CONFIG[data.clubName]?.logo) || ""} className="h-20 sm:h-32 object-contain" alt="Logo" />
                        <span className="text-[9px] font-bold mt-1 uppercase text-slate-900">Logo Unit</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <img src={data?.customFlag || (data?.clubName && CLUBS_CONFIG[data.clubName]?.flag) || ""} className="h-20 sm:h-32 object-contain border border-black bg-slate-50" alt="Bendera" />
                        <span className="text-[9px] font-bold mt-1 uppercase text-slate-900">Bendera Unit</span>
                    </div>
                </div>
                <div className="text-[8px] sm:text-[10px] space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-tight">
                    <p><strong>Merah:</strong> Keperwiraan & sedia berjuang.</p>
                    <p><strong>Hijau:</strong> Alam sekitar & ketahanan diri.</p>
                    <p><strong>Kuning:</strong> Kedaulatan Raja-Raja Melayu.</p>
                    <p><strong>Putih:</strong> Kesucian jiwa & peribadi mulia.</p>
                    <p className="mt-2 text-[8px] italic text-slate-400">*Warna lambang bergantung kepada unit.</p>
                </div>
            </div>
            <div className="mt-4">
                <SectionHeader title="5. Lagu & Ikrar" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] sm:text-xs whitespace-pre-line">
                    <div className="bg-slate-50 p-4 italic border border-slate-200">
                        <span className="block font-bold mb-2">Lagu Unit</span>
                        {data.customSong || STATIC_CONTENT.lagu}
                        <div className="mt-4 print:hidden">
                            <audio controls className="w-full h-8"><source src={KRS_AUDIO_URL} type="audio/mpeg" /></audio>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 font-semibold border border-slate-200">
                        <span className="block font-bold mb-2">Ikrar</span>
                        {STATIC_CONTENT.ikrar.replace("[NAMA KELAB]", data.clubName || "Kelab")}
                    </div>
                </div>
            </div>
        </div>,
        <OrganizationPage data={data} />,
        <div className="h-full flex flex-col justify-between">
            <div>
                <SectionHeader title="7. Peraturan" />
                <div className="text-xs space-y-2">
                    {(data.customRules && data.customRules.length > 0 ? data.customRules : STATIC_CONTENT.rules).slice(0, 2).map((rule, idx) => (
                        <div key={idx} className="mb-2">
                            <strong className="block font-bold text-slate-700 mb-0.5">{rule.title}</strong>
                            <ul className="list-disc list-inside pl-2">
                                {rule.items.slice(0, 3).map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-4">
                <SectionHeader title="8. Aktiviti Tahunan" />
                <div className="overflow-x-auto">
                    <table className="w-full text-[10px] border border-collapse border-slate-400">
                        <thead><tr className="bg-slate-100"><th className="border p-1">Minggu</th><th className="border p-1">Aktiviti</th><th className="border p-1">Tempat</th></tr></thead>
                        <tbody>{data.schedule.slice(0, 6).map(s => <tr key={s.id}><td className="border p-1">{s.date}</td><td className="border p-1">{s.activity}</td><td className="border p-1">{s.place}</td></tr>)}</tbody>
                    </table>
                </div>
            </div>
        </div>,
        <PrintLogs logs={data.logs} />,
        <div>
            <SectionHeader title="10. Kemahiran" />
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] sm:text-xs mb-6">
                {Object.entries(data.skills).slice(0, 14).map(([k, v]) => (<div key={k} className="flex gap-1"><span>{v ? '[ / ]' : '[ ]'}</span><span className="capitalize truncate">{k}</span></div>))}
            </div>
            <SectionHeader title="11. Pencapaian" />
            <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse border border-slate-400 mt-2">
                    <thead><tr className="bg-slate-100"><th className="border p-1">Bil</th><th className="border p-1">Penyertaan</th><th className="border p-1">Tahap</th><th className="border p-1">Hasil</th></tr></thead>
                    <tbody>{data.achievements.length > 0 ? data.achievements.slice(0, 5).map((item, i) => (<tr key={item.id}><td className="border p-1 text-center">{i + 1}</td><td className="border p-1 truncate max-w-[100px]">{item.name}</td><td className="border p-1 text-center">{item.level}</td><td className="border p-1 text-center">{item.result}</td></tr>)) : (<tr><td colSpan={4} className="border p-2 text-center italic text-slate-400">Tiada rekod.</td></tr>)}</tbody>
                </table>
            </div>
        </div>,
        <div className="h-full flex flex-col">
            <SectionHeader title="12. Penutup" />
            <div className="space-y-4 text-xs flex-grow">
                <p><strong>Rumusan Murid:</strong></p><p className="border p-2 min-h-[80px] rounded-md text-[11px] leading-tight">{data.studentSummary || "..................."}</p>
                <p><strong>Ulasan Guru:</strong></p>
                <div className="border p-2 min-h-[80px] rounded-md bg-slate-50 text-[11px] leading-tight italic relative">
                    {comment || data.teacherComment || "..................."}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8 text-center text-[10px] items-end">
                <div className="flex flex-col items-center justify-end h-full">
                    <div className="h-16 w-32 mb-1"></div> {/* Spacer for alignment */}
                    <p className="font-bold underline mb-1 truncate w-full">{data.studentName}</p>
                    <div className="font-bold uppercase text-slate-400">Tandatangan Murid</div>
                </div>
                <div className="flex flex-col items-center relative justify-end h-full">
                    <div className="h-16 w-32 flex items-center justify-center mb-1 relative">
                        {(hasSignature || data.teacherSignature) && (
                            <img src={hasSignature && canvasRef.current ? canvasRef.current.toDataURL() : data.teacherSignature} className="max-h-full max-w-full object-contain" alt="Tandatangan Guru" />
                        )}
                    </div>
                    <p className="font-bold underline mb-1 relative z-10">{teacherName}</p>
                    <div className="font-bold uppercase text-slate-400">Tandatangan Guru</div>
                </div>
            </div>
        </div>
    ];

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col">
            <Toast notification={toast} onClose={() => setToast(null)} />

            {/* Header Navigation */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm px-4 py-3 flex justify-between items-center">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-green-700 font-bold text-sm">
                    <ArrowLeft size={18} /> Kembali
                </button>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('signature')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-xs font-bold transition ${activeTab === 'signature' ? 'bg-white text-green-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <PenTool size={14} /> <span className="hidden sm:inline">Input Semakan</span><span className="sm:hidden">Semak</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-xs font-bold transition ${activeTab === 'preview' ? 'bg-white text-green-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Eye size={14} /> <span className="hidden sm:inline">Prapaparan Buku</span><span className="sm:hidden">Buku</span>
                    </button>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-700 hover:bg-green-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} <span className="hidden sm:inline">Simpan</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto">
                {activeTab === 'signature' ? (
                    <div className="max-w-3xl mx-auto space-y-6 p-4 md:p-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <SectionHeader title="Semakan Guru" />

                            <div className="mb-6">
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Ulasan / Komen Guru</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-500 min-h-[120px]"
                                    placeholder="Masukkan ulasan untuk kadet ini..."
                                ></textarea>
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="block text-xs font-bold uppercase text-slate-500">Tandatangan Digital</label>
                                    <button onClick={() => { if (data) { setData({ ...data, teacherSignature: '' }); } clearCanvas(); }} className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1">
                                        <RotateCw size={10} /> Padam & Tulis Semula
                                    </button>
                                </div>
                                <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden relative touch-none h-48">
                                    {!hasSignature && !data.teacherSignature && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <p className="text-slate-300 text-sm font-bold italic">Tandatangan di sini</p>
                                        </div>
                                    )}
                                    {data.teacherSignature && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                                            <img src={data.teacherSignature} className="w-full h-full object-contain p-4" alt="Tandatangan Guru" />
                                        </div>
                                    )}
                                    <canvas
                                        ref={canvasRef}
                                        width={600}
                                        height={200}
                                        className="w-full h-full cursor-crosshair block"
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic">Gunakan tetikus atau jari (skrin sentuh) untuk menandatangan.</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex gap-3 items-start">
                            <CheckCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
                            <div className="text-xs text-blue-800">
                                <p className="font-bold mb-1">Nota Penting:</p>
                                <p>Tandatangan dan ulasan yang disimpan di sini akan muncul secara automatik pada halaman "12. Penutup" di dalam buku log digital pelajar.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center">
                        {/* Mobile View: Swipeable Pages */}
                        <div
                            className="block sm:hidden w-full h-[calc(100vh-140px)] flex items-center justify-center bg-slate-800/90 overflow-hidden relative touch-pan-y"
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            <div
                                className="transition-transform duration-300 origin-center animate-in fade-in slide-in-from-right-4"
                                key={previewPageIndex}
                                style={{ transform: `scale(${Math.min(1, (window.innerWidth - 32) / 794)})` }}
                            >
                                <A4Page>{previewPages[previewPageIndex]}</A4Page>
                            </div>

                            {/* Mobile Arrows */}
                            <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none">
                                <button disabled={previewPageIndex === 0} onClick={() => setPreviewPageIndex(p => Math.max(0, p - 1))} className="bg-black/20 text-white p-2 rounded-full disabled:opacity-0 transition-opacity active:scale-95 pointer-events-auto"><ChevronLeft size={24} /></button>
                            </div>
                            <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center pointer-events-none">
                                <button disabled={previewPageIndex === previewPages.length - 1} onClick={() => setPreviewPageIndex(p => Math.min(previewPages.length - 1, p + 1))} className="bg-black/20 text-white p-2 rounded-full disabled:opacity-0 transition-opacity active:scale-95 pointer-events-auto"><ChevronRight size={24} /></button>
                            </div>
                        </div>

                        {/* Desktop View: Vertical List */}
                        <div className="hidden sm:block w-full flex-col items-center space-y-8 pb-20 p-8">
                            {previewPages.map((page, idx) => (
                                <A4Page key={idx}>{page}</A4Page>
                            ))}
                        </div>

                        {/* Mobile Footer Navigation */}
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between z-[60] sm:hidden shadow-2xl">
                            <div className="flex items-center justify-center w-full gap-4">
                                <button disabled={previewPageIndex === 0} onClick={() => setPreviewPageIndex(p => Math.max(0, p - 1))} className="p-2 disabled:opacity-30 bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
                                <span className="text-[10px] font-black bg-green-100 text-green-800 px-3 py-1 rounded-full uppercase">Muka {previewPageIndex + 1} / {previewPages.length}</span>
                                <button disabled={previewPageIndex === previewPages.length - 1} onClick={() => setPreviewPageIndex(p => Math.min(previewPages.length - 1, p + 1))} className="p-2 disabled:opacity-30 bg-slate-100 rounded-full"><ChevronRight size={20} /></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
