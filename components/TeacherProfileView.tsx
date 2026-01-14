
import React, { useState, useEffect } from 'react';
import { TeacherProfile } from '../types';
import { API_URL } from '../constants';
import { ArrowLeft, Save, Loader2, Camera, User, GraduationCap, Award, Briefcase, MapPin, Edit, X } from 'lucide-react';
import { Input, SectionHeader, Toast } from './CommonUI';

interface TeacherProfileViewProps {
    userEmail: string;
    initialName: string;
    initialIc: string;
    onBack: () => void;
    onSaveSuccess: () => void;
}

const emptyProfile: TeacherProfile = {
    email: '', profileImage: '', name: '', ic: '', dob: '', address: '', phone: '',
    positionKRS: '', rankKRS: '', commissionNo: '', school: '', districtState: '',
    highestEdu: '', option: '',
    basicCourse: '', advCourse: '', courseDetails: '', experience: '',
    heldPositions: '', contributions: ''
};

export const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({ userEmail, initialName, initialIc, onBack, onSaveSuccess }) => {
    const [profile, setProfile] = useState<TeacherProfile>({ ...emptyProfile, email: userEmail, name: initialName, ic: initialIc });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: string } | null>(null);
    const [imgLoading, setImgLoading] = useState(false);

    const showToast = (message: string, type: string = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await fetch(API_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: "getTeacherProfile", data: { email: userEmail } })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    setProfile(prev => ({ ...prev, ...result.data }));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setFetching(false);
            }
        };
        loadProfile();
    }, [userEmail]);

    const update = (key: keyof TeacherProfile, val: string) => setProfile(p => ({ ...p, [key]: val }));

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({ action: "saveTeacherProfile", data: profile })
            });
            const result = await res.json();
            if (result.status === 'success') {
                showToast("Profil berjaya dikemaskini!", "success");
                setTimeout(onSaveSuccess, 1000); // Trigger refresh on parent
            } else {
                showToast("Gagal menyimpan profil", "error");
            }
        } catch (e) {
            showToast("Ralat sambungan", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImgLoading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async (event) => {
            const base64 = (event.target?.result as string).split(',')[1];
            try {
                const res = await fetch(API_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "uploadImage",
                        data: { mimeType: file.type, filename: `teacher_${Date.now()}`, base64: base64 }
                    })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    update('profileImage', result.url);
                    showToast("Gambar berjaya dimuat naik!", "success");
                } else {
                    showToast("Gagal muat naik", "error");
                }
            } catch (e) { showToast("Ralat sambungan", "error"); }
            finally { setImgLoading(false); }
        };
    };

    if (fetching) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-green-700" size={40} /></div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Toast notification={toast} onClose={() => setToast(null)} />
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-slate-600 hover:text-green-700 font-bold"><ArrowLeft size={20} /></button>
                    <h1 className="text-sm font-black text-slate-800 uppercase tracking-wide">Kemaskini Profil Pegawai</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-green-700 hover:bg-green-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
                </button>
            </div>

            <div className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">

                {/* 1. Maklumat Peribadi */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <SectionHeader title="1. Maklumat Peribadi" />
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 flex flex-col items-center">
                            <div className="w-40 h-52 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden group">
                                {profile.profileImage ? (
                                    <>
                                        <img src={profile.profileImage} className="w-full h-full object-cover" />
                                        <button onClick={() => update('profileImage', '')} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><X size={14} /></button>
                                    </>
                                ) : imgLoading ? <Loader2 className="animate-spin text-slate-400" /> : (
                                    <label className="flex flex-col items-center cursor-pointer p-4 text-slate-400 hover:text-green-600 transition">
                                        <Camera size={32} className="mb-2" />
                                        <span className="text-xs font-bold text-center">Muat Naik Gambar</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <Input label="Nama Penuh" value={profile.name} onChange={(v) => update('name', v)} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="No. KP" value={profile.ic} onChange={(v) => update('ic', v)} />
                                <Input label="Tarikh Lahir" type="date" value={profile.dob} onChange={(v) => update('dob', v)} />
                            </div>
                            <Input label="No. Telefon" value={profile.phone} onChange={(v) => update('phone', v)} />
                            <Input label="Emel" value={profile.email} readOnly={true} className="bg-slate-100" />
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Alamat</label>
                                <textarea className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-green-500" rows={3} value={profile.address} onChange={(e) => update('address', e.target.value)}></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Maklumat Perkhidmatan */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <SectionHeader title="2. Maklumat Perkhidmatan" />
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input label="Jawatan Dalam Unit" placeholder="Cth: Pegawai Latihan" value={profile.positionKRS} onChange={(v) => update('positionKRS', v)} />
                        <Input label="Pangkat" placeholder="Cth: Leftenan Muda" value={profile.rankKRS} onChange={(v) => update('rankKRS', v)} />
                        <Input label="No. Tauliah (Jika ada)" value={profile.commissionNo} onChange={(v) => update('commissionNo', v)} />
                        <div className="hidden md:block"></div>
                        <Input label="Sekolah" value={profile.school} onChange={(v) => update('school', v)} />
                        <Input label="Daerah / Negeri" value={profile.districtState} onChange={(v) => update('districtState', v)} />
                    </div>
                </div>

                {/* 3. Maklumat Akademik */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <SectionHeader title="3. Maklumat Akademik" />
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input label="Kelulusan Tertinggi" placeholder="Cth: Ijazah Sarjana Muda Pendidikan" value={profile.highestEdu} onChange={(v) => update('highestEdu', v)} />
                        <Input label="Opsyen / Bidang Pengkhususan" value={profile.option} onChange={(v) => update('option', v)} />
                    </div>
                </div>

                {/* 4. Pengalaman & Kursus */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <SectionHeader title="4. Pengalaman & Kursus" />
                    <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="Kursus Asas" placeholder="Tahun / Peringkat" value={profile.basicCourse} onChange={(v) => update('basicCourse', v)} />
                            <Input label="Kursus Lanjutan / Jurulatih" placeholder="Tahun / Peringkat" value={profile.advCourse} onChange={(v) => update('advCourse', v)} />
                        </div>
                        <Input label="Maklumat Lanjut Kursus (Tahun & Tempat)" value={profile.courseDetails} onChange={(v) => update('courseDetails', v)} />
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Pengalaman Mengendalikan Aktiviti</label>
                            <textarea className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-green-500" rows={3} value={profile.experience} onChange={(e) => update('experience', e.target.value)}></textarea>
                        </div>
                    </div>
                </div>

                {/* 5. Penglibatan & Sumbangan */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <SectionHeader title="5. Penglibatan & Sumbangan" />
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Jawatan Yang Pernah Dipegang / Sumbangan</label>
                            <textarea className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-green-500" rows={4} placeholder="Senaraikan program, kejohanan atau perkhemahan yang disertai..." value={profile.contributions} onChange={(e) => update('contributions', e.target.value)}></textarea>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
