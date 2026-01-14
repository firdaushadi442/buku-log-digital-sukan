
import React from 'react';
import {
  Book, User, Shield, Music, Flag, Users,
  FileText, Calendar, Award, PenTool, LogOut
} from 'lucide-react';
import { ClubType } from './types';

// Updated API URL
export const API_URL = "https://script.google.com/macros/s/AKfycbx9iMI8jhKr3meZnnljsLf6nfobARNnAQoLgzvmJF3DVWlBevFEx0oRTNMKyrPDzR1a/exec";

export const CLASS_LIST = ['1 Arif', '2 Arif', '3 Arif', '4 Arif', '5 Arif'];

export const ACH_LEVELS = ['Sekolah', 'Daerah', 'Negeri', 'Kebangsaan', 'Antarabangsa'];
export const ACH_RESULTS = ['Johan', 'Naib Johan', 'Tempat Ketiga', 'Tempat Keempat', 'Tempat Kelima', 'Saguhati', 'Penyertaan'];

export const SECTIONS = [
  { id: 'cover', label: '1. Kulit Hadapan', icon: Book },
  { id: 'biodata', label: '2. Maklumat Peribadi', icon: User },
  { id: 'info', label: '3. Visi & Misi', icon: Shield },
  { id: 'logo', label: '4. Logo & Bendera', icon: Flag },
  { id: 'song', label: '5. Lagu & Ikrar', icon: Music },
  { id: 'org', label: '6. Organisasi', icon: Users },
  { id: 'rules', label: '7. Peraturan', icon: FileText },
  { id: 'schedule', label: '8. Perancangan Aktiviti', icon: Calendar },
  { id: 'logs', label: '9. Log Mingguan', icon: PenTool },
  { id: 'skills', label: '10. Kemahiran', icon: Award },
  { id: 'achievement', label: '11. Pencapaian', icon: Award },
  { id: 'closing', label: '12. Penutup', icon: LogOut },
] as const;

// Default "Dummy" Data for each Club to initialize editable fields
export const CLUBS_CONFIG: Record<string, { logo: string, flag: string, color: string, colorClass: string }> = {
  'Badminton': {
    logo: 'https://cdn-icons-png.flaticon.com/512/2906/2906232.png', // Dummy Badminton
    flag: '',
    color: '#3B82F6', // Blue
    colorClass: 'blue'
  },
  'Bola Tampar': {
    logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png', // Dummy Volleyball
    flag: '',
    color: '#F59E0B', // Amber
    colorClass: 'amber'
  },
  'Bola Jaring': {
    logo: 'https://cdn-icons-png.flaticon.com/512/2376/2376179.png', // Dummy Netball
    flag: '',
    color: '#10B981', // Emerald/Green
    colorClass: 'emerald'
  },
  'Olahraga/Permainan Dalaman': {
    logo: 'https://cdn-icons-png.flaticon.com/512/3354/3354316.png', // Dummy Sports
    flag: '',
    color: '#8B5CF6', // Violet
    colorClass: 'violet'
  }
};

export const DEFAULT_CONTENT = {
  visi: "Menjadikan kelab sebagai wadah pembangunan diri yang holistik.",
  misi: "Melahirkan ahli yang berketrampilan, berdisiplin dan berinovasi.",
  moto: "BERILMU, BERBAKTI, BERWAWASAN",
  ikrar: `Bahawasanya kami,\nAhli [NAMA KELAB],\nBerjanji dan bersetia,\nAkan mematuhi segala peraturan,\nMenghormati guru dan rakan,\nSerta berusaha memajukan diri.\nDemi kecemerlangan kelab,\nSekolah, bangsa dan negara.`,
  // Generic Song
  lagu: `(Sila masukkan lirik lagu kelab anda di sini)\n\nKami ahli kelab setia,\nBersatu hati menjana jaya,\nIlmu dicari, bakti dicurah,\nUntuk negara yang tercinta.`,
  rules: [
    {
      title: "1. Kehadiran",
      items: [
        "Kehadiran adalah wajib bagi setiap perjumpaan.",
        "Sila hadir 10 minit awal sebelum aktiviti bermula."
      ]
    },
    {
      title: "2. Disiplin",
      items: [
        "Sentiasa berpakaian kemas dan sopan.",
        "Menghormati guru penasihat dan AJK Tertinggi."
      ]
    }
  ]
};

export const STATIC_CONTENT = DEFAULT_CONTENT;
