
import React, { useState, useMemo, useEffect } from 'react';
import { LogOut, Users, RefreshCw, Eye, Search, UserCheck, FileText, ChevronDown, ChevronUp, UserCog, BarChart3, Briefcase, MapPin, TrendingUp, CheckCircle, PieChart } from 'lucide-react';
import { User, TeacherProfile, DashboardStudent, DashboardTeacher } from '../types';
import { TeacherReviewView } from './TeacherReviewView';
import { TeacherLogReviewView } from './TeacherLogReviewView';
import { TeacherProfileView } from './TeacherProfileView';
import { TeacherProfileCard } from './TeacherProfileCard';
import { API_URL, CLUBS_CONFIG } from '../constants';

interface TeacherDashboardProps {
    user: User;
    students: DashboardStudent[];
    onLogout: () => void;
    onRefresh: () => void;
    loading?: boolean;
    allTeachers?: DashboardTeacher[]; // For admin only
}

// Helper Component for Analytics
const AdminAnalytics: React.FC<{ students: DashboardStudent[], teachers: DashboardTeacher[] }> = ({ students, teachers }) => {
    // 1. Class Stats
    const classStats = useMemo(() => {
        const groups: Record<string, { totalLog: number, totalWajib: number, count: number }> = {};
        students.forEach(s => {
            const cls = s.form || "Lain-lain";
            if (!groups[cls]) groups[cls] = { totalLog: 0, totalWajib: 0, count: 0 };
            groups[cls].totalLog += Math.min(100, (s.logCount / 12) * 100);
            groups[cls].totalWajib += s.completeness;
            groups[cls].count++;
        });
        return Object.entries(groups).map(([name, data]) => ({
            name,
            avgLog: Math.round(data.totalLog / data.count),
            avgWajib: Math.round(data.totalWajib / data.count)
        })).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    }, [students]);

    // 2. Teacher Profile Stats
    const teacherProfileAvg = useMemo(() => {
        if (teachers.length === 0) return 0;
        const sum = teachers.reduce((acc, t) => acc + (t.profileCompleteness || 0), 0);
        return Math.round(sum / teachers.length);
    }, [teachers]);

    // 3. Teacher Review Stats (How many teachers have reviewed at least one student?)
    const teacherReviewStat = useMemo(() => {
        // Group students by teacher email
        const teacherMap: Record<string, boolean> = {}; // teacherEmail -> hasReviewedAny
        students.forEach(s => {
            if (s.teacher) {
                const tEmail = s.teacher.toLowerCase();
                if (!teacherMap[tEmail]) teacherMap[tEmail] = false;
                if (s.isReviewed) teacherMap[tEmail] = true;
            }
        });

        const activeReviewers = Object.values(teacherMap).filter(v => v).length;
        const totalInstructors = Object.keys(teacherMap).length || 1; // Avoid divide by zero
        return Math.round((activeReviewers / totalInstructors) * 100);
    }, [students]);

    return (
        <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart 2 & 3: Overview Cards */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4"><UserCheck size={20} className="text-purple-600" /> Kelengkapan Profil Guru</h3>
                    <div className="flex items-center gap-4">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="transform -rotate-90 w-full h-full">
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * teacherProfileAvg) / 100} className="text-purple-600 transition-all duration-1000 ease-out" />
                            </svg>
                            <span className="absolute text-2xl font-black text-purple-900">{teacherProfileAvg}%</span>
                        </div>
                        <div className="text-xs text-slate-500 flex-1">
                            <p>Purata pegawai melengkapkan profil peribadi mereka.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4"><CheckCircle size={20} className="text-blue-600" /> Keaktifan Semakan Guru</h3>
                    <div className="space-y-4">
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-blue-600">
                                        {teacherReviewStat}% Pegawai Aktif
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-blue-100">
                                <div style={{ width: `${teacherReviewStat}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000"></div>
                            </div>
                            <p className="text-[10px] text-slate-400 italic">*Peratusan guru yang telah membuat sekurang-kurangnya satu semakan buku log murid.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart 1: Class Performance */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-6"><TrendingUp size={20} className="text-green-600" /> Prestasi Kadet Mengikut Kelas</h3>
                <div className="space-y-4">
                    {classStats.map((cls) => (
                        <div key={cls.name} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <div className="w-20 font-bold text-xs text-slate-600 shrink-0">{cls.name}</div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                                {/* Log Bar */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${cls.avgLog}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-600 w-8 text-right">{cls.avgLog}%</span>
                                    <span className="text-[9px] text-slate-400 w-8 uppercase">Log</span>
                                </div>
                                {/* Wajib Bar */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${cls.avgWajib}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-green-600 w-8 text-right">{cls.avgWajib}%</span>
                                    <span className="text-[9px] text-slate-400 w-8 uppercase">Wajib</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {classStats.length === 0 && <p className="text-center text-slate-400 text-xs italic">Tiada data kelas.</p>}
                </div>
            </div>
        </div>
    );
};

// Reusable Table Component
const StudentListTable: React.FC<{
    list: any[],
    isAdmin: boolean,
    onAction: (email: string, mode: 'review_logs' | 'review_book') => void
}> = ({ list, isAdmin, onAction }) => (
    <div className="w-full text-left">
        {/* Header - Hidden on small screens */}
        <div className="hidden md:grid grid-cols-12 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3 border-b border-slate-100">
            <div className="col-span-5">Nama Ahli</div>
            <div className="col-span-4">Kemajuan</div>
            <div className="col-span-3 text-right">Tindakan</div>
        </div>

        <div className="divide-y divide-slate-100 bg-white">
            {list.map((student, idx) => {
                const logCount = student.logCount || 0;
                const logPercent = Math.min(100, Math.round((logCount / 12) * 100));
                const requiredPercent = student.completeness || 0;

                return (
                    <div key={idx} className="hover:bg-green-50/30 transition group p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        {/* Name Section */}
                        <div className="md:col-span-5">
                            <div className="font-bold text-slate-700 group-hover:text-green-800 transition text-sm break-words leading-tight">{student.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">{student.ic}</div>
                            {isAdmin && student.teacher && <div className="text-[9px] text-blue-500 font-bold mt-1">Guru: {student.teacher}</div>}
                            {student.isReviewed && <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-green-100 text-[9px] font-bold text-green-700"><CheckCircle size={8} /> Disemak</div>}
                        </div>

                        {/* Progress Section */}
                        <div className="md:col-span-4">
                            <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-2 w-full md:max-w-[140px]">
                                <div>
                                    <div className="flex justify-between text-[9px] uppercase font-bold text-slate-500 mb-0.5">
                                        <span>Log</span>
                                        <span>{logCount}/12</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div className={`h-full rounded-full ${logPercent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${logPercent}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[9px] uppercase font-bold text-slate-500 mb-0.5">
                                        <span>Wajib</span>
                                        <span>{requiredPercent}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div className={`h-full rounded-full ${requiredPercent >= 100 ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${requiredPercent}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Section */}
                        <div className="md:col-span-3">
                            <div className="flex justify-end gap-2">
                                <button
                                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 md:px-2 md:py-1.5 rounded-md text-[10px] font-bold shadow-sm hover:bg-blue-100 transition active:scale-95"
                                    onClick={() => onAction(student.email, 'review_logs')}
                                >
                                    <FileText size={12} /> LAPORAN
                                </button>
                                <button
                                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-white border border-slate-300 text-slate-600 px-3 py-2 md:px-2 md:py-1.5 rounded-md text-[10px] font-bold shadow-sm hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition active:scale-95"
                                    onClick={() => onAction(student.email, 'review_book')}
                                >
                                    <Eye size={12} /> BUKU
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
    user,
    students,
    onLogout,
    onRefresh,
    loading = false,
    allTeachers = []
}) => {
    const isAdmin = user.role === 'admin';
    const [selectedStudentEmail, setSelectedStudentEmail] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'review_book' | 'review_logs' | 'profile_edit' | 'admin_teacher_view' | null>(null);
    const [selectedTeacherEmail, setSelectedTeacherEmail] = useState<string | null>(null);
    const [expandedClasses, setExpandedClasses] = useState<string[]>([]);
    const [expandedSubGroups, setExpandedSubGroups] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Admin Tabs
    const [adminTab, setAdminTab] = useState<'students' | 'teachers'>('students');

    // Teacher Profile State
    const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Club Config for Logo
    const clubConfig = user.club ? CLUBS_CONFIG[user.club] : null;
    const dashboardLogo = clubConfig?.logo || "https://raw.githubusercontent.com/firdaushadi442/cloud/refs/heads/main/Logo%20KRS%20Stroke.png";

    const fetchProfile = async () => {
        setProfileLoading(true);
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({ action: "getTeacherProfile", data: { email: user.email } })
            });
            const result = await res.json();
            if (result.status === 'success') {
                setTeacherProfile(result.data);
            }
        } catch (e) { console.error("Profile fetch error", e); }
        finally { setProfileLoading(false); }
    };

    useEffect(() => {
        fetchProfile();
    }, [user.email]);

    // Group students by class
    const groupedStudents = useMemo(() => {
        const groups: Record<string, any[]> = {};
        const filtered = students.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.ic.includes(searchTerm)
        );

        filtered.forEach(student => {
            const formName = student.form || "Tiada Kelas";
            if (!groups[formName]) groups[formName] = [];
            groups[formName].push(student);
        });

        // Sort keys: 1 Arif, 2 Arif... Tiada Kelas last
        const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        // Auto expand all if searching
        if (searchTerm && expandedClasses.length !== sortedKeys.length) {
            setExpandedClasses(sortedKeys);
        }

        // Default expand all on first load if not set
        if (expandedClasses.length === 0 && !searchTerm && sortedKeys.length > 0 && students.length > 0) {
            setExpandedClasses(sortedKeys);
        }

        return { groups, sortedKeys };
    }, [students, searchTerm]);

    // Filter teachers for admin
    const filteredTeachers = useMemo(() => {
        return allTeachers.filter(t =>
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allTeachers, searchTerm]);

    const toggleClass = (className: string) => {
        setExpandedClasses(prev =>
            prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]
        );
    };

    const toggleSubGroup = (id: string) => {
        setExpandedSubGroups(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // ... (render viewModes remain same)
    if (selectedStudentEmail && viewMode === 'review_book') {

        return (
            <TeacherReviewView
                studentEmail={selectedStudentEmail}
                onBack={() => { setSelectedStudentEmail(null); setViewMode(null); }}
                teacherName={teacherProfile?.name || user.name}
            />
        );
    }

    if (selectedStudentEmail && viewMode === 'review_logs') {
        return (
            <TeacherLogReviewView
                studentEmail={selectedStudentEmail}
                onBack={() => { setSelectedStudentEmail(null); setViewMode(null); }}
                teacherName={teacherProfile?.name || user.name}
            />
        );
    }

    if (viewMode === 'profile_edit') {

        return (
            <TeacherProfileView
                userEmail={user.email}
                initialName={teacherProfile?.name || user.name}
                initialIc={teacherProfile?.ic || user.ic || ''}
                onBack={() => setViewMode(null)}
                onSaveSuccess={() => { fetchProfile(); setViewMode(null); }}
            />
        );
    }

    if (viewMode === 'admin_teacher_view' && selectedTeacherEmail) {

        return (
            <TeacherProfileView
                userEmail={selectedTeacherEmail}
                initialName="" // Will be fetched
                initialIc="" // Will be fetched
                onBack={() => { setViewMode(null); setSelectedTeacherEmail(null); }}
                onSaveSuccess={() => { onRefresh(); setViewMode(null); setSelectedTeacherEmail(null); }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 animate-in fade-in duration-500">
            <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`${isAdmin ? 'bg-red-100' : 'bg-green-100'} p-2 rounded-xl`}>
                        <img src={dashboardLogo} className="w-10 h-12 object-contain" alt="Logo" />
                    </div>
                    <div>
                        <h1 className={`text-xl font-black ${isAdmin ? 'text-red-900' : 'text-green-900'} leading-tight`}>{isAdmin ? 'PANEL PENTADBIR (ADMIN)' : 'DASHBOARD PEGAWAI'}</h1>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 ${isAdmin ? 'bg-red-500' : 'bg-green-500'} rounded-full animate-pulse`}></span>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{teacherProfile?.name || user.name}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Kemaskini</span>
                    </button>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition shadow-sm"
                    >
                        <LogOut size={16} />
                        <span className="hidden sm:inline">Keluar</span>
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Sidebar: Teacher Info & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <TeacherProfileCard profile={teacherProfile} userEmail={user.email} userName={user.name} />

                    <button
                        onClick={() => setViewMode('profile_edit')}
                        className="w-full py-3 bg-white border-2 border-green-700 text-green-700 font-bold rounded-xl shadow-sm hover:bg-green-50 transition flex items-center justify-center gap-2"
                    >
                        <UserCog size={18} />
                        Kemaskini Profil
                    </button>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><BarChart3 size={20} /></div>
                            <h3 className="font-bold text-slate-700">Statistik Semasa</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                <span className="block text-2xl font-black text-slate-800">{students.length}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Ahli</span>
                            </div>
                            {isAdmin && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                    <span className="block text-2xl font-black text-slate-800">{allTeachers.length}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Pegawai</span>
                                </div>
                            )}
                            {!isAdmin && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                    <span className="block text-2xl font-black text-slate-800">{new Date().getFullYear()}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Sesi</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content: Student/Teacher List */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[600px]">
                    <div className="p-6 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50 rounded-t-2xl">

                        {/* --- ADMIN ANALYTICS SECTION --- */}
                        {isAdmin && adminTab === 'students' && (
                            <AdminAnalytics students={students} teachers={allTeachers} />
                        )}

                        <div className="flex justify-between items-center">
                            <h2 className="font-black text-slate-800 flex items-center gap-3 text-lg">
                                {isAdmin && adminTab === 'teachers' ? <Briefcase size={20} className="text-purple-600" /> : <Users size={20} className="text-green-600" />}
                                {isAdmin ? (adminTab === 'teachers' ? 'SENARAI PEGAWAI' : 'SENARAI SEMUA AHLI') : 'SENARAI AHLI SELIAAN'}
                            </h2>
                            {isAdmin && (
                                <div className="flex bg-slate-200 p-1 rounded-lg">
                                    <button onClick={() => setAdminTab('students')} className={`px-3 py-1 text-xs font-bold rounded-md transition ${adminTab === 'students' ? 'bg-white shadow text-green-800' : 'text-slate-500'}`}>Ahli</button>
                                    <button onClick={() => setAdminTab('teachers')} className={`px-3 py-1 text-xs font-bold rounded-md transition ${adminTab === 'teachers' ? 'bg-white shadow text-purple-800' : 'text-slate-500'}`}>Pegawai</button>
                                </div>
                            )}
                        </div>

                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder={isAdmin && adminTab === 'teachers' ? "Cari nama pegawai..." : "Cari nama atau KP ahli..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-full focus:ring-2 focus:ring-green-500 outline-none w-full transition"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-grow p-4 space-y-4">
                        {/* MODE 1: TEACHER LIST (ADMIN ONLY) */}
                        {isAdmin && adminTab === 'teachers' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredTeachers.map((teacher, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl p-4 hover:border-purple-300 transition hover:shadow-md bg-white group cursor-pointer" onClick={() => { setSelectedTeacherEmail(teacher.email); setViewMode('admin_teacher_view'); }}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">{teacher.name.charAt(0)}</div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm group-hover:text-purple-700">{teacher.name}</h4>
                                                <p className="text-[10px] text-slate-500">{teacher.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-[10px] bg-slate-50 p-2 rounded border border-slate-100 space-y-1">
                                            <div className="flex items-center gap-2"><Briefcase size={12} className="text-slate-400" /> <span className="truncate">{teacher.rank || "Pangkat: -"}</span></div>
                                            <div className="flex items-center gap-2"><MapPin size={12} className="text-slate-400" /> <span className="truncate">{teacher.school || "Sekolah: -"}</span></div>
                                            <div className="flex items-center gap-2"><UserCheck size={12} className="text-slate-400" /> <span className="truncate">Profil: {teacher.profileCompleteness}%</span></div>
                                        </div>
                                    </div>
                                ))}
                                {filteredTeachers.length === 0 && <p className="text-center col-span-2 text-slate-400 text-sm italic py-10">Tiada pegawai dijumpai.</p>}
                            </div>
                        ) : (
                            /* MODE 2: STUDENT LIST (SHARED) */
                            <>
                                {students.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-slate-300 py-20">
                                        <Users size={48} className="mb-4 opacity-50" />
                                        <p className="font-medium italic">Tiada ahli dijumpai.</p>
                                    </div>
                                ) : groupedStudents.sortedKeys.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500 text-sm italic">Tiada carian dijumpai.</div>
                                ) : (
                                    groupedStudents.sortedKeys.map((className) => (
                                        <div key={className} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                            <button
                                                onClick={() => toggleClass(className)}
                                                className={`w-full flex items-center justify-between p-4 font-bold text-sm transition-colors ${expandedClasses.includes(className) ? 'bg-green-50 text-green-800' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-xs shadow-sm min-w-[24px] text-center">{groupedStudents.groups[className].length}</span>
                                                    <span>{className}</span>
                                                </div>
                                                {expandedClasses.includes(className) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </button>

                                            {expandedClasses.includes(className) && (
                                                <div className="border-t border-slate-200">
                                                    {isAdmin ? (
                                                        <div className="divide-y divide-slate-100">
                                                            {/* Group by Club for Admin */}
                                                            {(() => {
                                                                const sList = groupedStudents.groups[className];
                                                                const clubGroups: Record<string, any[]> = {};
                                                                sList.forEach(s => {
                                                                    const c = s.club || "Lain-lain";
                                                                    if (!clubGroups[c]) clubGroups[c] = [];
                                                                    clubGroups[c].push(s);
                                                                });
                                                                const clubs = Object.keys(clubGroups).sort();

                                                                return clubs.map(clubName => {
                                                                    const subId = `${className}::${clubName}`;
                                                                    const isExp = expandedSubGroups.includes(subId);
                                                                    const cCount = clubGroups[clubName].length;

                                                                    return (
                                                                        <div key={subId} className="bg-slate-50/50">
                                                                            <button
                                                                                onClick={() => toggleSubGroup(subId)}
                                                                                className={`w-full flex items-center justify-between px-6 py-3 text-xs font-bold transition-colors ${isExp ? 'bg-white text-purple-700' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className={`w-1.5 h-1.5 rounded-full ${isExp ? 'bg-purple-500' : 'bg-slate-300'}`}></span>
                                                                                    {clubName}
                                                                                    <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] min-w-[20px] text-center">{cCount}</span>
                                                                                </div>
                                                                                {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                                            </button>
                                                                            {isExp && (
                                                                                <div className="border-t border-slate-100 bg-white pl-4">
                                                                                    <StudentListTable
                                                                                        list={clubGroups[clubName]}
                                                                                        isAdmin={isAdmin}
                                                                                        onAction={(email, mode) => { setSelectedStudentEmail(email); setViewMode(mode); }}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                });
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        <StudentListTable
                                                            list={groupedStudents.groups[className]}
                                                            isAdmin={isAdmin}
                                                            onAction={(email, mode) => { setSelectedStudentEmail(email); setViewMode(mode); }}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl text-[10px] text-slate-400 text-center font-medium">
                        {isAdmin ? 'Mod Admin: Akses Penuh' : 'Menunjukkan senarai terkini dari pangkalan data.'}
                    </div>
                </div>
            </main>
        </div>
    );
};
