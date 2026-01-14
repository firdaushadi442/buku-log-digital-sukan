
import React from 'react';
import { ClubType } from '../types';
import { Activity, Trophy, Target, Award, ArrowRight } from 'lucide-react';

interface ClubSelectionProps {
    onSelect: (club: ClubType) => void;
}

const clubs = [
    {
        id: 'Badminton',
        title: 'Badminton',
        icon: Activity,
        color: 'bg-blue-500',
        desc: 'Membina ketangkasan dan semangat kesukanan melalui badminton.',
        gradient: 'from-blue-500 to-cyan-400'
    },
    {
        id: 'Bola Tampar',
        title: 'Bola Tampar',
        icon: Trophy,
        color: 'bg-amber-500',
        desc: 'Memupuk kerjasama berpasukan dan kemahiran taktikal.',
        gradient: 'from-amber-500 to-orange-400'
    },
    {
        id: 'Bola Jaring',
        title: 'Bola Jaring',
        icon: Target,
        color: 'bg-emerald-500',
        desc: 'Strategi dan kepantasan dalam sukan bola jaring.',
        gradient: 'from-emerald-500 to-green-400'
    },
    {
        id: 'Olahraga/Permainan Dalaman',
        title: 'Olahraga & Permainan Dalaman',
        icon: Award,
        color: 'bg-violet-500',
        desc: 'Kecergasan fizikal dan kecerdasan minda melalui pelbagai permainan.',
        gradient: 'from-violet-500 to-purple-400'
    }
] as const;

export const ClubSelection: React.FC<ClubSelectionProps> = ({ onSelect }) => {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
                <div className="absolute top-1/2 right-20 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-500/30 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            <div className="z-10 text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                    <span className="text-xs font-bold text-blue-300 tracking-wider uppercase">Portal Kokurikulum Digital</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-slate-400 tracking-tight mb-4 drop-shadow-sm">
                    Sistem Buku Log
                </h1>
                <p className="text-base md:text-lg text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">Pilih unit anda untuk memulakan sesi pembelajaran dan perekodan aktiviti.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl z-10 px-4">
                {clubs.map((club, idx) => (
                    <button
                        key={club.id}
                        onClick={() => onSelect(club.id as ClubType)}
                        className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 transition-all duration-300 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 overflow-hidden"
                    >
                        {/* Hover Gradient Overlay */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition duration-500 bg-gradient-to-br ${club.gradient}`}></div>

                        <div className={`w-20 h-20 rounded-2xl ${club.color} text-white flex items-center justify-center mb-6 shadow-lg shadow-black/20 group-hover:scale-110 group-hover:rotate-3 transition duration-500`}>
                            <club.icon size={36} strokeWidth={1.5} />
                        </div>

                        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-200 transition">{club.title}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-8 flex-grow opacity-80 group-hover:opacity-100 transition">{club.desc}</p>

                        <div className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-slate-300 text-xs font-bold group-hover:bg-white group-hover:text-slate-900 transition flex items-center justify-center gap-2">
                            Log Masuk <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
                        </div>
                    </button>
                ))}
            </div>

            <footer className="absolute bottom-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                SMA Ulu Jempol • Hak Cipta Terpelihara {new Date().getFullYear()}
            </footer>
        </div>
    );
};
