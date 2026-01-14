
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Printer, Save, Eye, Edit, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  LogOut, Loader2, Camera, CheckCircle, Trash2, X, Music, RotateCw, FileDown, ArrowLeft,
  AlertTriangle, Shield, Flag, Calendar, Users, FileText, User as UserIcon
} from 'lucide-react';
import {
  API_URL, SECTIONS, STATIC_CONTENT,
  ACH_LEVELS, ACH_RESULTS, CLASS_LIST, CLUBS_CONFIG, DEFAULT_CONTENT
} from './constants';
import {
  User, AppData, ViewMode, SaveStatus, ActivitySchedule, WeeklyLog, Achievement, ClubType
} from './types';
import {
  Input, Toast, DeleteModal, SectionHeader
} from './components/CommonUI';
import {
  A4Page, CoverPage, BiodataPage, OrganizationPage, PrintLogs
} from './components/PreviewViews';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ClubSelection } from './components/ClubSelection';

// Utility to clean ISO strings or Sheet date-time formats for display AND input values
const formatDateStr = (str: string) => {
  if (!str) return "";
  return str.split('T')[0];
};

const formatTimeStr = (str: string) => {
  if (!str) return "";
  if (str.includes('T')) {
    const timePart = str.split('T')[1];
    return timePart.substring(0, 5);
  }
  return str.substring(0, 5);
};

interface Teacher {
  name: string;
  email: string;
}

const initialDataState = (): AppData => ({
  schoolName: 'SMA ULU JEMPOL', studentName: '', ic: '', form: '', memberId: '', year: new Date().getFullYear(), dob: '', address: '', phone: '', guardian: '', teacher: '',
  profileImage: '',

  // Dynamic Club Data Defaults
  clubName: '',
  customLogo: '', customFlag: '',
  customVisi: DEFAULT_CONTENT.visi, customMisi: DEFAULT_CONTENT.misi, customMoto: DEFAULT_CONTENT.moto,
  customSong: DEFAULT_CONTENT.lagu,
  customRules: [], // If empty, will use defaults in Preview

  principal: '', teacherAdvisor: '', chairman: '', secretary: '', treasurer: '', committee: '', schedule: [], logs: [],
  skills: {
    "Komunikasi": false, "Kepimpinan": false, "Kerjasama": false, "Pemikiran Kritif": false, "Keusahawanan": false,
    "ICT & Multimedia": false, "Pengurusan Projek": false, "Pengucapan Awam": false, "Kebudayaan": false, "Kesukarelawan": false
  },
  skillsNotes: '', achievements: [], studentSummary: '', teacherComment: ''
});

export default function App() {
  const [selectedClub, setSelectedClub] = useState<ClubType>(null);
  const [selectedRole, setSelectedRole] = useState<'murid' | 'guru' | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isPrinting, setIsPrinting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [activeSection, setActiveSection] = useState<string>('cover');
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [data, setData] = useState<AppData>(initialDataState());
  const [toast, setToast] = useState<{ message: string, type: string } | null>(null);
  const [myStudents, setMyStudents] = useState<any[]>([]); // State untuk dashboard guru
  const [allTeachers, setAllTeachers] = useState<any[]>([]); // State untuk dashboard admin
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);

  const [regName, setRegName] = useState('');

  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const showToast = (message: string, type: string = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const updateStateFromResponse = (resultData: any, persist: boolean = true) => {
    const userData: User = {
      email: resultData.email,
      name: resultData.name,
      ic: resultData.ic,
      form: resultData.form,
      role: resultData.role || (selectedRole || 'murid'),
      club: resultData.club || selectedClub
    };
    setUser(userData);
    if (!selectedClub && resultData.club) setSelectedClub(resultData.club as ClubType);

    if (persist) {
      localStorage.setItem('krs_session', JSON.stringify({
        email: resultData.email,
        ic: resultData.ic,
        role: userData.role,
        club: userData.club
      }));
    }

    if (userData.role === 'guru' || userData.role === 'admin') {
      setViewMode('teacher_dashboard');
      if (userData.role === 'admin') {
        fetchAdminData();
      } else {
        fetchTeacherStudents(userData.email);
      }
    } else {
      const loadedProfile = resultData.profile || {};
      const defaultSkills = initialDataState().skills;
      const mergedSkills = { ...defaultSkills, ...(loadedProfile.skills || {}) };

      let formattedDob = '';
      if (loadedProfile.dob) {
        const d = new Date(loadedProfile.dob);
        formattedDob = isNaN(d.getTime()) ? loadedProfile.dob : d.toISOString().split('T')[0];
      }

      const loadedLogs = (resultData.logs || []).map((l: WeeklyLog) => ({
        ...l,
        date: formatDateStr(l.date),
        time: formatTimeStr(l.time)
      }));

      // Merge loaded custom content or use defaults if new
      setData(prev => ({
        ...prev,
        ...loadedProfile,
        studentName: resultData.name,
        ic: resultData.ic,
        form: resultData.form,
        dob: formattedDob,
        skills: mergedSkills,
        achievements: loadedProfile.achievements || [],
        logs: loadedLogs,
        clubName: resultData.club || prev.clubName
      }));
      setViewMode('edit');
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: 'getTeacherList', data: {} })
      });
      const result = await res.json();
      if (result.status === 'success') setTeachersList(result.data);
    } catch (e) { console.error("Failed to fetch teachers", e); }
  };

  const fetchTeacherStudents = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: 'getTeacherStudents', data: { email } })
      });
      const result = await res.json();
      if (result.status === 'success') setMyStudents(result.data);
    } catch (e) { console.log(e); } finally { setLoading(false); }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: 'getAdminData', data: {} })
      });
      const result = await res.json();
      if (result.status === 'success') {
        setMyStudents(result.data.students);
        setAllTeachers(result.data.teachers);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTeachers();
    const checkSession = async () => {
      const savedSession = localStorage.getItem('krs_session');
      if (savedSession) {
        try {
          const { email, ic, role, club } = JSON.parse(savedSession);
          if (role) setSelectedRole(role);
          if (club) setSelectedClub(club);

          const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: 'login', data: { email, ic } })
          });
          const result = await res.json();
          if (result.status === 'success') {
            updateStateFromResponse({ ...result.data, role }, false);
          } else {
            localStorage.removeItem('krs_session');
          }
        } catch (e) { console.error(e); }
      }
      setIsInitialLoading(false);
    };
    checkSession();
  }, []);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get('email') as string;
    if (email && !email.toLowerCase().endsWith('@moe-dl.edu.my')) {
      showToast("Hanya emel rasmi KPM (@moe-dl.edu.my) dibenarkan.", "error");
      return;
    }
    setLoading(true);
    const payload = Object.fromEntries(fd.entries());
    const authPayload = { ...payload, role: selectedRole, club: selectedClub };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: authMode, data: authPayload })
      });
      const result = await res.json();
      if (result.status === 'success') {
        if (authMode === 'login') {
          const finalRole = result.data.role || selectedRole;
          updateStateFromResponse({ ...result.data, role: finalRole });
          showToast("Log masuk berjaya!", "success");
        } else {
          showToast(result.message, "success");
          localStorage.removeItem('krs_session');
          setAuthMode('login');
          setRegName('');
        }
      } else {
        showToast(result.message || "Ralat tidak diketahui", "error");
      }
    } catch (err: any) {
      showToast("Ralat Sambungan: Sila pastikan link API betul.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user || !data.ic) return;
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: 'login', data: { email: user.email, ic: data.ic } })
      });
      const result = await res.json();
      if (result.status === 'success') {
        updateStateFromResponse(result.data, false);
        showToast("Data dikemaskini!", "success");
      } else { showToast("Gagal memuat semula data", "error"); }
    } catch (err: any) { showToast("Ralat Sambungan", "error"); } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('krs_session');
    setUser(null);
    setSelectedRole(null);
    setSelectedClub(null);
    setData(initialDataState());
    setViewMode('edit');
    setActiveSection('cover');
  };

  const saveDataToCloud = async (isSilent: boolean = false) => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      const currentData = dataRef.current;
      const { logs, ...profile } = currentData;
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "saveData", data: { email: user.email, profile, logs } })
      });
      const result = await res.json();
      if (result.status === 'success') {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        if (!isSilent) showToast("Data berjaya disimpan!", "success");
      } else {
        setSaveStatus('error');
        if (!isSilent) showToast("Gagal menyimpan data", "error");
      }
    } catch (err) {
      setSaveStatus('error');
      if (!isSilent) showToast("Ralat Sambungan Internet", "error");
    }
  };

  const handleAutoSave = useCallback((delay: number = 2000) => {
    if (saveStatus === 'saving' || !user || user.role === 'guru' || user.role === 'admin') return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => { saveDataToCloud(true); }, delay);
  }, [user, saveStatus]);

  const handlePrint = () => {
    setIsPrinting(true);
    setViewMode('preview');
    setTimeout(() => { window.print(); setIsPrinting(false); }, 1200);
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const threshold = 50;
    if (deltaX > threshold) setPreviewPageIndex(p => Math.min(previewPages.length - 1, p + 1));
    else if (deltaX < -threshold) setPreviewPageIndex(p => Math.max(0, p - 1));
    touchStartX.current = null;
  };

  const updateData = (field: keyof AppData, value: any) => setData(p => ({ ...p, [field]: value }));
  const updateNested = (parent: 'skills', field: string, value: any) => setData(p => ({ ...p, [parent]: { ...p[parent], [field]: value } }));
  const getTeacherName = (email: string) => teachersList.find(t => t.email === email)?.name || email;

  const teacherName = getTeacherName(data.teacher);

  // Render Pages for Preview
  const previewPages = [
    <CoverPage data={data} />,

    // Page 2: Biodata + Visi Misi
    <div className="space-y-6">
      <BiodataPage data={data} teachersList={teachersList} />
      <div className="border-t-2 border-dashed border-slate-300 pt-6">
        <SectionHeader title="3. Visi & Misi" />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-green-50 p-3 border-l-4 border-green-600"><h3 className="font-bold text-xs mb-1">VISI</h3><p className="text-[10px] whitespace-pre-line leading-tight">{data.customVisi || STATIC_CONTENT.visi}</p></div>
          <div className="bg-blue-50 p-3 border-l-4 border-blue-600"><h3 className="font-bold text-xs mb-1">MISI</h3><p className="text-[10px] whitespace-pre-line leading-tight">{data.customMisi || STATIC_CONTENT.misi}</p></div>
        </div>
      </div>
    </div>,

    // Page 3: Logo, Bendera, Lagu, Ikrar
    <div className="h-full flex flex-col gap-6">
      <div>
        <SectionHeader title="4. Logo & Bendera" />
        <div className="grid grid-cols-2 gap-8 mt-4">
          <div className="flex flex-col items-center">
            <div className="h-32 flex items-center justify-center"><img src={data.customLogo || (selectedClub && CLUBS_CONFIG[selectedClub]?.logo) || ""} className="max-h-full object-contain" alt="Logo" /></div>
            <span className="text-[9px] font-bold mt-2 uppercase text-slate-900">Logo Unit</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-32 flex items-center justify-center"><img src={data.customFlag || (selectedClub && CLUBS_CONFIG[selectedClub]?.flag) || ""} className="max-h-full object-contain border border-slate-200" alt="Bendera" /></div>
            <span className="text-[9px] font-bold mt-2 uppercase text-slate-900">Bendera Unit</span>
          </div>
        </div>
      </div>
      <div className="flex-grow">
        <SectionHeader title="5. Lagu & Ikrar" />
        <div className="grid grid-cols-2 gap-4 mt-4 h-full">
          <div className="bg-slate-50 p-4 italic border border-slate-200 text-[10px] whitespace-pre-line">
            <span className="block font-bold mb-2 not-italic text-xs">Lagu Unit</span>
            {data.customSong || STATIC_CONTENT.lagu}
          </div>
          <div className="bg-slate-50 p-4 font-semibold border border-slate-200 text-[10px] whitespace-pre-line">
            <span className="block font-bold mb-2 text-xs">Ikrar</span>
            {DEFAULT_CONTENT.ikrar.replace("[NAMA KELAB]", selectedClub || "Kelab")}
          </div>
        </div>
      </div>
    </div>,

    // Page 4: Organization
    <OrganizationPage data={data} />,

    // Page 5: Peraturan + Aktiviti
    <div className="h-full flex flex-col gap-6">
      <div className="flex-1">
        <SectionHeader title="7. Peraturan" />
        <div className="text-[10px] space-y-2 mt-2 columns-2 gap-4">
          {(data.customRules && data.customRules.length > 0 ? data.customRules : STATIC_CONTENT.rules).slice(0, 4).map((rule, idx) => (
            <div key={idx} className="mb-2 break-inside-avoid">
              <strong className="block font-bold text-slate-700">{rule.title}</strong>
              <ul className="list-disc list-inside pl-1 text-slate-600">
                {rule.items.slice(0, 3).map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <SectionHeader title="8. Aktiviti Tahunan" />
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-[10px] border border-collapse border-slate-400">
            <thead><tr className="bg-slate-100"><th className="border p-2 w-20">Minggu</th><th className="border p-2">Aktiviti</th><th className="border p-2 w-32">Tempat</th></tr></thead>
            <tbody>{data.schedule.slice(0, 8).map(s => <tr key={s.id}><td className="border p-1 text-center">{s.date}</td><td className="border p-1">{s.activity}</td><td className="border p-1 text-center">{s.place}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>,

    // Page 6: Logs (Auto-generated per log)
    <PrintLogs logs={data.logs} />,

    // Page 7: Kemahiran, Pencapaian & Penutup (Consolidated)
    <div className="h-full flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <SectionHeader title="10. Kemahiran" />
          <div className="grid grid-cols-1 gap-y-1 text-[10px] mt-2 border p-2 rounded">
            {Object.entries(data.skills).slice(0, 10).map(([k, v]) => (<div key={k} className="flex gap-2"><span>{v ? '☑' : '☐'}</span><span className="capitalize truncate">{k}</span></div>))}
          </div>
        </div>
        <div>
          <SectionHeader title="11. Pencapaian" />
          <table className="w-full text-[9px] border-collapse border border-slate-400 mt-2">
            <thead><tr className="bg-slate-100"><th className="border p-1">Acara</th><th className="border p-1">Pencapaian</th></tr></thead>
            <tbody>{data.achievements.length > 0 ? data.achievements.slice(0, 5).map((item) => (<tr key={item.id}><td className="border p-1 truncate max-w-[80px]">{item.name}</td><td className="border p-1 text-center">{item.result} ({item.level})</td></tr>)) : (<tr><td colSpan={2} className="border p-2 text-center italic text-slate-400">Tiada rekod.</td></tr>)}</tbody>
          </table>
        </div>
      </div>

      <div className="flex-grow flex flex-col">
        <SectionHeader title="12. Penutup" />
        <div className="space-y-4 text-xs mt-2 flex-grow">
          <div className="flex gap-4 h-full">
            <div className="flex-1 flex flex-col">
              <p className="font-bold mb-1">Rumusan:</p>
              <div className="border p-2 rounded-md text-[10px] leading-tight flex-grow bg-white">{data.studentSummary || "..................."}</div>
            </div>
            <div className="flex-1 flex flex-col">
              <p className="font-bold mb-1">Ulasan Guru:</p>
              <div className="border p-2 rounded-md bg-slate-50 text-[10px] leading-tight italic flex-grow">{data.teacherComment || "..................."}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6 text-center text-[10px]">
          <div className="flex flex-col items-center"><div className="h-10 border-b border-black w-32 mb-1"></div><p className="font-bold uppercase text-slate-900">{data.studentName}</p><div className="font-bold uppercase text-slate-400">Tandatangan Murid</div></div>
          <div className="flex flex-col items-center">
            <div className="h-16 w-32 mb-1 border-b border-black relative flex items-end justify-center">
              {data.teacherSignature && <img src={data.teacherSignature} className="max-h-full max-w-full object-contain mb-1" />}
            </div>
            <p className="font-bold uppercase text-slate-900">{teacherName || '................'}</p>
            <div className="font-bold uppercase text-slate-400">Tandatangan Guru</div>
          </div>
        </div>
      </div>
    </div>
  ];


  if (isInitialLoading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <Loader2 className="animate-spin text-white mb-4" size={48} />
      <p className="text-white font-bold animate-pulse">Menghubungkan ke Pangkalan Data...</p>
    </div>
  );

  if (!selectedClub) return <ClubSelection onSelect={(club) => { setSelectedClub(club); updateData('clubName', club); }} />;

  // Shared Theme Logic
  const themeConfig = selectedClub ? CLUBS_CONFIG[selectedClub] : null;
  const themeColorKey = themeConfig?.colorClass || 'slate';

  const themes: Record<string, { bg: string, pattern: string, button: string, buttonHover: string, text: string, subText: string, iconBg: string, iconText: string, border: string }> = {
    'blue': {
      bg: 'bg-blue-900',
      pattern: 'opacity-20',
      button: 'bg-blue-600',
      buttonHover: 'hover:bg-blue-700',
      text: 'text-blue-600',
      subText: 'text-blue-200',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      border: 'border-blue-400'
    },
    'amber': {
      bg: 'bg-amber-900',
      pattern: 'opacity-20',
      button: 'bg-amber-600',
      buttonHover: 'hover:bg-amber-700',
      text: 'text-amber-600',
      subText: 'text-amber-200',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
      border: 'border-amber-400'
    },
    'emerald': {
      bg: 'bg-emerald-900',
      pattern: 'opacity-20',
      button: 'bg-emerald-600',
      buttonHover: 'hover:bg-emerald-700',
      text: 'text-emerald-600',
      subText: 'text-emerald-200',
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-600',
      border: 'border-emerald-400'
    },
    'violet': {
      bg: 'bg-violet-900',
      pattern: 'opacity-20',
      button: 'bg-violet-600',
      buttonHover: 'hover:bg-violet-700',
      text: 'text-violet-600',
      subText: 'text-violet-200',
      iconBg: 'bg-violet-100',
      iconText: 'text-violet-600',
      border: 'border-violet-400'
    },
    'slate': {
      bg: 'bg-slate-900',
      pattern: 'opacity-10',
      button: 'bg-slate-800',
      buttonHover: 'hover:bg-slate-700',
      text: 'text-slate-900',
      subText: 'text-slate-400',
      iconBg: 'bg-slate-100',
      iconText: 'text-slate-600',
      border: 'border-slate-400'
    }
  };

  const t = themes[themeColorKey] || themes['slate'];

  if (!selectedRole && !user) return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 ${t.bg}`}>
      {/* Background Pattern */}
      <div className={`absolute inset-0 pointer-events-none ${t.pattern}`}
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      ></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/30 pointer-events-none"></div>

      <div className="z-10 text-center mb-10 w-full max-w-2xl">
        <h1 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-md">{selectedClub}</h1>
        <button onClick={() => setSelectedClub(null)} className="text-white/70 hover:text-white underline text-sm transition font-medium bg-black/20 px-4 py-1.5 rounded-full mt-2">
          Tukar Unit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl z-10">
        <button onClick={() => setSelectedRole('murid')} className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 p-8 rounded-3xl text-left transition-all hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between min-h-[160px]">
          <div className={`w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors`}>
            <UserIcon size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Keahlian (Murid)</h2>
            <p className="text-white/60 text-sm">Masuk sebagai ahli berdaftar untuk kemaskini log.</p>
          </div>
        </button>

        <button onClick={() => setSelectedRole('guru')} className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 p-8 rounded-3xl text-left transition-all hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between min-h-[160px]">
          <div className={`w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-4 group-hover:bg-amber-500 transition-colors`}>
            <Shield size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Pegawai (Guru)</h2>
            <p className="text-white/60 text-sm">Masuk sebagai guru penasihat untuk semakan.</p>
          </div>
        </button>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500 ${t.bg}`}>
        {/* Dotted Background Pattern */}
        <div className={`absolute inset-0 pointer-events-none ${t.pattern}`}
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        ></div>

        {/* Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/30 pointer-events-none"></div>

        <Toast notification={toast} onClose={() => setToast(null)} />
        <div className="bg-white/95 backdrop-blur-md w-full max-w-md p-8 rounded-3xl shadow-2xl z-10 border border-white/20 animate-in zoom-in-95 duration-300">
          <button onClick={() => setSelectedRole(null)} className="text-slate-500 hover:text-black mb-6 flex items-center gap-2 text-sm font-semibold transition-colors">
            <ArrowLeft size={16} /> Kembali
          </button>

          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-2xl ${t.iconBg} ${t.iconText} flex items-center justify-center mx-auto mb-4 shadow-inner ring-1 ring-black/5`}>
              {selectedRole === 'murid' ? <UserIcon size={32} /> : <Shield size={32} />}
            </div>
            <h1 className="text-2xl font-black text-slate-800">Log Masuk {selectedRole === 'murid' ? 'Ahli' : 'Guru'}</h1>
            <p className={`text-xs font-bold mt-2 uppercase ${t.text} tracking-widest bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100`}>{selectedClub}</p>
          </div>

          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setAuthMode(m); setRegName(''); }} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all capitalize ${authMode === m ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>{m === 'login' ? 'Masuk' : 'Daftar'}</button>
            ))}
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <Input name="name" placeholder="Nama Penuh" required value={regName} onChange={(val) => setRegName(val.replace(/\b\w/g, l => l.toUpperCase()))} />
                {selectedRole === 'murid' && (
                  <div>
                    <select name="form" required className="w-full p-3 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"><option value="">-- Pilih Kelas --</option>{CLASS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                )}
              </div>
            )}
            <Input name="email" type="email" placeholder="Email DELIMA (moe-dl.edu.my)" required />
            <Input name="ic" placeholder={selectedRole === 'murid' ? "No. Kad Pengenalan" : "Kata Laluan"} required />
            <button disabled={loading} className={`w-full ${t.button} ${t.buttonHover} text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex justify-center gap-2 mt-4 active:scale-95`}>
              {loading ? <Loader2 className="animate-spin" /> : (authMode === 'login' ? 'Masuk Sekarang' : 'Daftar Akaun')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (viewMode === 'teacher_dashboard' && (user?.role === 'guru' || user?.role === 'admin')) {
    return (
      <>
        <Toast notification={toast} onClose={() => setToast(null)} />
        <TeacherDashboard user={user} students={myStudents} onLogout={handleLogout} onRefresh={() => user.role === 'admin' ? fetchAdminData() : fetchTeacherStudents(user.email)} loading={loading} allTeachers={allTeachers} />
      </>
    );
  }

  // Edit & Preview Mode
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans print:bg-white pb-20 md:pb-0">
      <Toast notification={toast} onClose={() => setToast(null)} />
      <header className="bg-slate-900 text-white p-2 md:p-4 shadow-lg sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs font-bold">{selectedClub?.charAt(0)}</div>
            <div><h1 className="font-bold text-sm md:text-base">{selectedClub}</h1><p className="text-[10px] text-slate-400">{user.name}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button onClick={() => setViewMode('edit')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'edit' ? 'bg-white text-black' : 'text-slate-400'}`}>Edit</button>
              <button onClick={() => setViewMode('preview')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'preview' ? 'bg-white text-black' : 'text-slate-400'}`}>Preview</button>
            </div>
            <button onClick={() => saveDataToCloud(false)} disabled={saveStatus === 'saving'} className={`p-2 rounded-lg text-white transition flex items-center justify-center min-w-[36px] ${saveStatus === 'saved' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={16} /> : (saveStatus === 'saved' ? <CheckCircle size={16} /> : <Save size={16} />)}
            </button>
            <button onClick={handlePrint} className="p-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600 transition"><Printer size={16} /></button>
            <button onClick={handleLogout} className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-700 transition"><LogOut size={16} /></button>
          </div>
        </div>
      </header>

      <div className={`max-w-7xl mx-auto ${viewMode === 'preview' ? 'p-0 sm:p-6' : 'p-4 md:p-6'}`}>
        {viewMode === 'edit' && (
          <div className="flex flex-col md:flex-row gap-6">
            <aside className="hidden md:block w-64 flex-shrink-0 bg-white rounded-xl shadow h-fit sticky top-24 print:hidden overflow-hidden border border-slate-200">
              <nav className="p-2 space-y-1">
                {SECTIONS.map(sec => (
                  <button key={sec.id} onClick={() => setActiveSection(sec.id)} className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition text-left ${activeSection === sec.id ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-3"><sec.icon size={16} className="flex-shrink-0 text-slate-400" /><span className="leading-snug">{sec.label}</span></div>
                    {activeSection === sec.id && <ChevronRight size={14} className="flex-shrink-0 ml-2" />}
                  </button>
                ))}
              </nav>
            </aside>
            <div className="block md:hidden space-y-2 mb-6">
              {/* Mobile Nav Simplified (Using same structure as original but condensed) */}
              <div className="bg-white p-4 rounded-xl shadow border border-slate-200">
                <select onChange={(e) => setActiveSection(e.target.value)} value={activeSection} className="w-full p-2 border rounded-lg bg-slate-50 font-bold">
                  {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div className="p-4 bg-white rounded-xl shadow border border-slate-200">
                <EditorContent activeSection={activeSection} setActiveSection={setActiveSection} data={data} setData={setData} updateData={updateData} updateNested={updateNested} showToast={showToast} handleAutoSave={handleAutoSave} teachersList={teachersList} />
              </div>
            </div>

            <main className="hidden md:block flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6" onBlur={() => handleAutoSave(2000)}>
              <EditorContent activeSection={activeSection} setActiveSection={setActiveSection} data={data} setData={setData} updateData={updateData} updateNested={updateNested} showToast={showToast} handleAutoSave={handleAutoSave} teachersList={teachersList} />
            </main>
          </div>
        )}

        {viewMode === 'preview' && (
          <main className="w-full flex flex-col items-center">
            {/* Swipable view for mobile similar to original code, reuse class names */}
            <div className="block sm:hidden w-full h-[calc(100vh-140px)] flex items-center justify-center bg-slate-800/90 overflow-hidden relative touch-pan-y" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <div className="transition-transform duration-300 origin-center" key={previewPageIndex} style={{ transform: `scale(${Math.min(1, (window.innerWidth - 32) / 794)})` }}>
                <A4Page>{previewPages[previewPageIndex]}</A4Page>
              </div>
              <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none"><button onClick={() => setPreviewPageIndex(p => Math.max(0, p - 1))} className="bg-black/20 text-white p-2 rounded-full pointer-events-auto"><ChevronLeft size={24} /></button></div>
              <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center pointer-events-none"><button onClick={() => setPreviewPageIndex(p => Math.min(previewPages.length - 1, p + 1))} className="bg-black/20 text-white p-2 rounded-full pointer-events-auto"><ChevronRight size={24} /></button></div>
            </div>

            <div className="hidden sm:block w-full max-w-5xl mx-auto print-area space-y-8 print:space-y-0">
              {previewPages.map((page, i) => <A4Page key={i}>{page}</A4Page>)}
            </div>

            {/* Mobile Bottom Bar for Preview */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between z-[60] sm:hidden shadow-2xl">
              <button onClick={() => setViewMode('edit')} className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold"><ArrowLeft size={14} /> Kembali</button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-slate-100 text-slate-800 px-2 py-1 rounded-full uppercase">Muka {previewPageIndex + 1} / {previewPages.length}</span>
              </div>
              <button onClick={handlePrint} className="bg-blue-700 text-white p-2 rounded-lg shadow-md"><Printer size={16} /></button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

const EditorContent: React.FC<{
  activeSection: string;
  setActiveSection: (section: string) => void;
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  updateData: (field: keyof AppData, val: any) => void;
  updateNested: (parent: 'skills', field: string, val: any) => void;
  showToast: (msg: string, type?: string) => void;
  handleAutoSave: (delay?: number) => void;
  teachersList: Teacher[];
}> = ({ activeSection, setActiveSection, data, setData, updateData, updateNested, showToast, handleAutoSave, teachersList }) => {
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: number | null }>({ isOpen: false, id: null });
  const [profileImgLoading, setProfileImgLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [flagLoading, setFlagLoading] = useState(false);
  const [achForm, setAchForm] = useState({ name: '', level: ACH_LEVELS[0], result: ACH_RESULTS[0] });

  const [logLoading, setLogLoading] = useState(false);
  const [schedLoading, setSchedLoading] = useState(false);
  const [achLoading, setAchLoading] = useState(false);

  const todaysDate = new Date().toISOString().split('T')[0];
  const [logForm, setLogForm] = useState<WeeklyLog>({ id: 0, date: todaysDate, time: '14:00', place: '', type: '', objective: '', content: '', reflection: '', img1: '', img2: '', attendance: '' });
  const [schedForm, setSchedForm] = useState({ date: '', activity: '', place: '' });

  const handleUpload = async (file: File, type: 'profile' | 'log1' | 'log2' | 'custom_logo' | 'custom_flag') => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];

      if (type === 'profile') setProfileImgLoading(true);
      else if (type === 'custom_logo') setLogoLoading(true);
      else if (type === 'custom_flag') setFlagLoading(true);

      try {
        const res = await fetch(API_URL, {
          method: "POST", body: JSON.stringify({ action: "uploadImage", data: { mimeType: file.type, filename: `${type}_${Date.now()}`, base64 } })
        });
        const result = await res.json();
        if (result.status === 'success') {
          if (type === 'profile') updateData('profileImage', result.url);
          else if (type === 'custom_logo') updateData('customLogo', result.url);
          else if (type === 'custom_flag') updateData('customFlag', result.url);
          else if (type === 'log1') setLogForm(p => ({ ...p, img1: result.url }));
          else if (type === 'log2') setLogForm(p => ({ ...p, img2: result.url }));
          else if (type === 'log2') setLogForm(p => ({ ...p, img2: result.url }));
          showToast("Muat naik berjaya!");
        } else {
          console.error("Upload failed:", result);
          showToast(`Gagal: ${result.message || "Ralat tidak diketahui"}`, "error");
        }
      } catch (e) {
        console.error("Connection error:", e);
        showToast("Ralat sambungan. Sila cuba lagi.", "error");
      }
      finally {
        setProfileImgLoading(false);
        setLogoLoading(false);
        setFlagLoading(false);
      }
    }
  };

  const handleSaveLog = () => {
    if (!logForm.date) return showToast("Sila isi tarikh!", "error");
    let newLogs = logForm.id ? data.logs.map(l => l.id === logForm.id ? { ...logForm } : l) : [...data.logs, { ...logForm, id: Date.now() }];
    setData(p => ({ ...p, logs: newLogs }));
    setLogForm({ id: 0, date: todaysDate, time: '14:00', place: '', type: '', objective: '', content: '', reflection: '', img1: '', img2: '', attendance: '' });
    showToast(logForm.id ? "Kemaskini berjaya!" : "Laporan ditambah!");
    handleAutoSave(500);
  };

  const handleDeleteItem = (type: 'achievements' | 'schedule', id: number) => {
    setData(p => ({ ...p, [type]: (p[type] as any[]).filter(i => i.id !== id) }));
    handleAutoSave(500);
  };

  switch (activeSection) {
    case 'cover': return (
      <div className="space-y-4 max-w-lg">
        <SectionHeader title="1. Kulit Hadapan" />
        <Input label="Nama Sekolah" value={data.schoolName} onChange={(v: string) => updateData('schoolName', v)} />
        <Input label="Nama Ahli" value={data.studentName} onChange={(v: string) => updateData('studentName', v)} />
        <div className="mb-3"><label className="block text-xs font-bold uppercase text-slate-500 mb-1">Kelas</label><select value={data.form} onChange={(e) => updateData('form', e.target.value)} className="w-full p-2 border rounded bg-white"><option value="">-- Pilih --</option>{CLASS_LIST.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        <Input label="Unit / Kelab" value={data.clubName} readOnly={true} className="bg-slate-100" />
      </div>
    );
    case 'biodata': return (
      <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
        <SectionHeader title="2. Maklumat Peribadi" />
        <div className="space-y-4 md:col-span-2">
          <Input label="No. KP" value={data.ic} readOnly={true} className="bg-slate-50" />
          <Input label="Tarikh Lahir" type="date" value={data.dob} onChange={(v: string) => updateData('dob', v)} />
          <Input label="No. Telefon" value={data.phone} onChange={(v: string) => updateData('phone', v)} />
          <Input label="Nama Penjaga" value={data.guardian} onChange={(v: string) => updateData('guardian', v)} />
          <Input label="Alamat" value={data.address} onChange={(v: string) => updateData('address', v)} />
        </div>
        <div className="flex flex-col items-center mt-4">
          <div className="w-32 h-40 border-2 border-dashed rounded-lg bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative">
            {profileImgLoading ? <Loader2 className="animate-spin text-blue-500" /> : (data.profileImage ? <img src={data.profileImage} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <Camera className="text-slate-300" />)}
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleUpload(e.target.files[0], 'profile')} />
          </div>
          <span className="text-[10px] text-slate-400 mt-2">Gambar Profil</span>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-500 mb-1">Guru Penasihat</label>
          <select value={data.teacher || ""} onChange={(e) => updateData('teacher', e.target.value)} className="w-full p-2 border rounded bg-white text-sm"><option value="">-- Pilih Guru --</option>{teachersList.map(t => <option key={t.email} value={t.email}>{t.name}</option>)}</select>
        </div>
      </div>
    );
    case 'info': return (
      <div className="space-y-6">
        <SectionHeader title="3. Visi & Misi" />
        <div className="bg-green-50 p-4 border-l-4 border-green-500 rounded">
          <label className="block text-xs font-bold text-slate-500 mb-1">Visi Unit</label>
          <textarea className="w-full p-2 border rounded text-sm bg-white" rows={2} value={data.customVisi} onChange={e => updateData('customVisi', e.target.value)}></textarea>
        </div>
        <div className="bg-blue-50 p-4 border-l-4 border-blue-500 rounded">
          <label className="block text-xs font-bold text-slate-500 mb-1">Misi Unit</label>
          <textarea className="w-full p-2 border rounded text-sm bg-white" rows={2} value={data.customMisi} onChange={e => updateData('customMisi', e.target.value)}></textarea>
        </div>
        <div className="bg-yellow-50 p-4 border-l-4 border-yellow-500 rounded">
          <label className="block text-xs font-bold text-slate-500 mb-1">Moto Unit</label>
          <Input value={data.customMoto} onChange={(v: string) => updateData('customMoto', v)} />
        </div>
      </div>
    );
    case 'logo': return (
      <div className="space-y-6">
        <SectionHeader title="4. Logo & Bendera" />
        <p className="text-xs text-slate-500">Anda boleh memuat naik logo dan bendera unit anda sendiri. Jika dibiarkan kosong, imej lalai akan digunakan.</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
            <label className="block text-xs font-bold text-slate-500 mb-2">Logo Unit</label>
            <div className="h-32 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center relative hover:bg-slate-50 transition">
              {logoLoading ? <Loader2 className="animate-spin text-blue-500" /> : (data.customLogo ? <img src={data.customLogo} referrerPolicy="no-referrer" className="h-full object-contain p-2" /> : <div className="text-center"><Camera size={24} className="mx-auto text-slate-300" /><span className="text-[10px] text-slate-400">Muat Naik Logo</span></div>)}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && handleUpload(e.target.files[0], 'custom_logo')} />
            </div>
            {data.customLogo && <button onClick={() => updateData('customLogo', '')} className="text-[10px] text-red-500 mt-2 underline">Padam</button>}
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
            <label className="block text-xs font-bold text-slate-500 mb-2">Bendera Unit</label>
            <div className="h-32 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center relative hover:bg-slate-50 transition">
              {flagLoading ? <Loader2 className="animate-spin text-blue-500" /> : (data.customFlag ? <img src={data.customFlag} referrerPolicy="no-referrer" className="h-full object-contain p-2" /> : <div className="text-center"><Camera size={24} className="mx-auto text-slate-300" /><span className="text-[10px] text-slate-400">Muat Naik Bendera</span></div>)}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && handleUpload(e.target.files[0], 'custom_flag')} />
            </div>
            {data.customFlag && <button onClick={() => updateData('customFlag', '')} className="text-[10px] text-red-500 mt-2 underline">Padam</button>}
          </div>
        </div>
      </div>
    );
    case 'song': return (
      <div className="space-y-6">
        <SectionHeader title="5. Lagu Unit" />
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-500 mb-2">Lirik Lagu</label>
          <textarea className="w-full border p-3 rounded-lg text-sm h-64 font-mono bg-white leading-relaxed" value={data.customSong} onChange={e => updateData('customSong', e.target.value)} placeholder="Masukkan lirik lagu di sini..."></textarea>
        </div>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-500 mb-2">Ikrar</label>
          <div className="text-sm italic text-slate-600 whitespace-pre-line">{DEFAULT_CONTENT.ikrar}</div>
          <p className="text-[10px] text-slate-400 mt-2">* Ikrar adalah standard.</p>
        </div>
      </div>
    );
    case 'org': return (
      <div className="space-y-4 max-w-2xl">
        <SectionHeader title="6. Carta Organisasi" />
        <Input label="Penaung (Pengetua)" value={data.principal} onChange={(v: string) => updateData('principal', v)} />
        <Input label="Guru Penasihat" value={data.teacherAdvisor} onChange={(v: string) => updateData('teacherAdvisor', v)} />
        <Input label="Pengerusi" value={data.chairman} onChange={(v: string) => updateData('chairman', v)} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Setiausaha" value={data.secretary} onChange={(v: string) => updateData('secretary', v)} />
          <Input label="Bendahari" value={data.treasurer} onChange={(v: string) => updateData('treasurer', v)} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Ahli Jawatankuasa (AJK)</label>
          <textarea className="w-full border border-slate-300 p-3 rounded-lg text-sm outline-none bg-white" rows={6} placeholder="Senaraikan AJK..." value={data.committee} onChange={e => updateData('committee', e.target.value)}></textarea>
        </div>
      </div>
    );
    case 'rules': return (
      <div className="space-y-6">
        <SectionHeader title="7. Peraturan" />
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Bahagian ini dipaparkan secara automatik berdasarkan peraturan standard. Anda boleh menambah peraturan tambahan di masa hadapan.
        </div>
        <div className="text-xs space-y-2 opacity-75">
          {(data.customRules && data.customRules.length > 0 ? data.customRules : STATIC_CONTENT.rules).map((rule, idx) => (
            <div key={idx} className="border p-2 rounded bg-white">
              <strong>{rule.title}</strong>
              <ul className="list-disc list-inside pl-4 text-slate-500">{rule.items.map((i, k) => <li key={k}>{i}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    );
    case 'logs': return (
      <div className="space-y-6">
        <SectionHeader title="9. Log Laporan Mingguan" />
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-4">{logForm.id ? "Kemaskini Laporan" : "Tambah Laporan Baru"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tarikh" type="date" value={logForm.date} onChange={(v: string) => setLogForm({ ...logForm, date: v })} />
            <Input label="Tempat" value={logForm.place} onChange={(v: string) => setLogForm({ ...logForm, place: v })} />
          </div>
          <div className="mt-2"><Input label="Aktiviti" value={logForm.type} onChange={(v: string) => setLogForm({ ...logForm, type: v })} /></div>
          <div className="mt-2"><Input label="Objektif" value={logForm.objective} onChange={(v: string) => setLogForm({ ...logForm, objective: v })} /></div>
          <div className="mt-2"><label className="block text-xs font-bold text-slate-500 mb-1">Laporan</label><textarea className="w-full border p-2 text-sm rounded bg-white" rows={3} value={logForm.content} onChange={e => setLogForm({ ...logForm, content: e.target.value })}></textarea></div>
          <div className="mt-2"><label className="block text-xs font-bold text-slate-500 mb-1">Refleksi</label><textarea className="w-full border p-2 text-sm rounded bg-white" rows={2} value={logForm.reflection} onChange={e => setLogForm({ ...logForm, reflection: e.target.value })}></textarea></div>

          {/* Image Upload for Logs */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 text-center relative hover:bg-slate-50">
              {logForm.img1 ? (
                <div className="relative group h-24">
                  <img src={logForm.img1} referrerPolicy="no-referrer" className="w-full h-full object-cover rounded" />
                  <button onClick={() => setLogForm(p => ({ ...p, img1: '' }))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-24">
                  <Camera size={20} className="text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-500">Gambar 1</span>
                </div>
              )}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleUpload(e.target.files[0], 'log1')} />
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 text-center relative hover:bg-slate-50">
              {logForm.img2 ? (
                <div className="relative group h-24">
                  <img src={logForm.img2} referrerPolicy="no-referrer" className="w-full h-full object-cover rounded" />
                  <button onClick={() => setLogForm(p => ({ ...p, img2: '' }))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-24">
                  <Camera size={20} className="text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-500">Gambar 2</span>
                </div>
              )}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleUpload(e.target.files[0], 'log2')} />
            </div>
          </div>

          <div className="mt-4">
            <button onClick={() => {
              setLogLoading(true);
              handleSaveLog();
              setTimeout(() => setLogLoading(false), 800);
            }} className="bg-blue-600 text-white w-full py-2.5 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
              {logLoading ? <Loader2 className="animate-spin" size={20} /> : "Simpan Laporan"}
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {data.logs.map(l => (
            <div key={l.id} className="p-4 border rounded-xl bg-white flex justify-between items-center shadow-sm">
              <div><div className="font-bold text-sm text-slate-800">{l.type}</div><div className="text-xs text-slate-500">{l.date}</div></div>
              <div className="flex gap-2"><button onClick={() => setLogForm(l)} className="text-blue-500 p-2 hover:bg-blue-50 rounded"><Edit size={16} /></button><button onClick={() => { setData(p => ({ ...p, logs: p.logs.filter(x => x.id !== l.id) })); handleAutoSave(500); }} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={16} /></button></div>
            </div>
          ))}
        </div>
      </div>
    );
    case 'schedule': return (
      <div className="space-y-6">
        <SectionHeader title="8. Perancangan Aktiviti" />
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            <Input placeholder="Tarikh/Minggu" value={schedForm.date} onChange={(v: string) => setSchedForm(p => ({ ...p, date: v }))} />
            <Input placeholder="Aktiviti" value={schedForm.activity} onChange={(v: string) => setSchedForm(p => ({ ...p, activity: v }))} />
            <Input placeholder="Tempat" value={schedForm.place} onChange={(v: string) => setSchedForm(p => ({ ...p, place: v }))} />
          </div>
          <button onClick={() => {
            if (schedForm.activity) {
              setSchedLoading(true);
              setData(p => ({ ...p, schedule: [...p.schedule, { id: Date.now(), ...schedForm }] }));
              setSchedForm({ date: '', activity: '', place: '' });
              handleAutoSave(500);
              setTimeout(() => setSchedLoading(false), 800);
            }
          }} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold w-full md:w-auto flex items-center justify-center gap-2 min-w-[140px]">
            {schedLoading ? <Loader2 className="animate-spin" size={16} /> : "Tambah Aktiviti"}
          </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr className="text-left"><th className="p-3">Minggu</th><th className="p-3">Aktiviti</th><th className="p-3"></th></tr></thead>
            <tbody>{data.schedule.length === 0 ? <tr><td colSpan={3} className="p-4 text-center text-slate-400">Tiada rekod</td></tr> : data.schedule.map(s => <tr key={s.id} className="border-b last:border-0"><td className="p-3">{s.date}</td><td className="p-3">{s.activity}</td><td className="p-3 text-right"><button onClick={() => handleDeleteItem('schedule', s.id)} className="text-red-500"><Trash2 size={16} /></button></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    );
    case 'skills': return (
      <div>
        <SectionHeader title="10. Kemahiran" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {Object.keys(data.skills).map(k => (
            <label key={k} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${data.skills[k] ? 'bg-green-50 border-green-500 text-green-900' : 'bg-white border-slate-200'}`}>
              <input type="checkbox" checked={data.skills[k]} onChange={e => { updateNested('skills', k, e.target.checked); handleAutoSave(500); }} className="w-4 h-4 text-green-600 rounded" />
              <span className="text-xs font-bold">{k}</span>
            </label>
          ))}
        </div>
        <textarea className="w-full border p-3 rounded-xl text-sm" rows={4} placeholder="Catatan tambahan kemahiran..." value={data.skillsNotes} onChange={e => updateData('skillsNotes', e.target.value)}></textarea>
      </div>
    );

    /* Update the 'achievement' case */
    case 'achievement': return (
      <div className="space-y-6">
        <SectionHeader title="11. Pencapaian" />
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <Input label="Nama Pencapaian" value={achForm.name} onChange={(v: string) => setAchForm(p => ({ ...p, name: v }))} />
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Peringkat</label>
              <select value={achForm.level} onChange={e => setAchForm(p => ({ ...p, level: e.target.value }))} className="w-full p-2 border rounded text-sm bg-white">{ACH_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Pencapaian</label>
              <select value={achForm.result} onChange={e => setAchForm(p => ({ ...p, result: e.target.value }))} className="w-full p-2 border rounded text-sm bg-white">{ACH_RESULTS.map(r => <option key={r} value={r}>{r}</option>)}</select>
            </div>
          </div>
          <button onClick={() => {
            if (achForm.name) {
              setAchLoading(true);
              setData(p => ({ ...p, achievements: [...p.achievements, { id: Date.now(), ...achForm }] }));
              setAchForm({ name: '', level: ACH_LEVELS[0], result: ACH_RESULTS[0] });
              handleAutoSave(500);
              setTimeout(() => setAchLoading(false), 800);
            } else {
              showToast("Sila isi nama pencapaian", "error");
            }
          }} className="mt-4 bg-blue-600 text-white w-full py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
            {achLoading ? <Loader2 className="animate-spin" size={20} /> : "Tambah Rekod"}
          </button>
        </div>
        <div className="space-y-2">{data.achievements.map(a => <div key={a.id} className="border p-3 rounded-lg flex justify-between items-center bg-white"><div><div className="font-bold text-sm">{a.name}</div><div className="text-[10px] text-slate-500 uppercase">{a.level} • {a.result}</div></div><button onClick={() => handleDeleteItem('achievements', a.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button></div>)}</div>
      </div>
    );
    case 'closing': return (
      <div className="space-y-6">
        <SectionHeader title="12. Penutup" />
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-500 mb-2">Rumusan Murid</label>
          <textarea className="w-full border p-4 rounded-xl text-sm h-40 bg-slate-50 focus:bg-white transition outline-none focus:ring-2 focus:ring-green-500" value={data.studentSummary} onChange={e => updateData('studentSummary', e.target.value)}></textarea>
        </div>
        <div className="bg-slate-100 p-6 rounded-xl border border-dashed border-slate-300">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Ulasan Guru</h4>
          <p className="text-sm italic text-slate-500">{data.teacherComment || "Belum ada ulasan."}</p>
        </div>
      </div>
    );
    default: return <div className="p-10 text-center text-slate-400">Sila pilih seksyen di menu.</div>;
  }
}
