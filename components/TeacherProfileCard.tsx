
import React from 'react';
import { TeacherProfile } from '../types';
import { User, Shield, Award, MapPin, Briefcase } from 'lucide-react';

export const TeacherProfileCard: React.FC<{ profile: TeacherProfile | null, userEmail: string, userName: string }> = ({ profile, userEmail, userName }) => {

    // Fallback if profile not fully filled yet
    const displayImage = profile?.profileImage || null;
    const displayName = profile?.name || userName;
    const displayRank = profile?.rankKRS || "Pegawai";
    const displaySchool = profile?.school || "Belum dikemaskini";

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-green-800 to-green-600"></div>

            <div className="relative flex flex-col items-center text-center mt-8">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-md bg-slate-100 flex items-center justify-center overflow-hidden mb-3">
                    {displayImage ? (
                        <img src={displayImage} className="w-full h-full object-cover" />
                    ) : (
                        <User size={48} className="text-slate-300" />
                    )}
                </div>

                <h3 className="text-lg font-black text-slate-800 uppercase leading-tight px-4">{displayName}</h3>
                <span className="inline-block bg-green-100 text-green-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase mt-2 mb-4 tracking-wider">
                    {displayRank}
                </span>

                <div className="w-full space-y-3 text-left bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center gap-3 text-slate-600">
                        <Briefcase size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{profile?.positionKRS || "Jawatan: -"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{displaySchool}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                        <Award size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{profile?.highestEdu || "Pendidikan: -"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
