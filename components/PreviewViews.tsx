
import React from 'react';
import { SectionHeader, OrgBoxModern } from './CommonUI';
import { AppData, WeeklyLog } from '../types';

// Utility to clean ISO strings or Sheet date-time formats for display
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

export const A4Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="a4-page flex flex-col relative mb-8 bg-white w-[210mm] min-h-[297mm] mx-auto p-[15mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-[15mm] print:page-break-after-always overflow-hidden">
    <div className="flex-grow">{children}</div>
  </div>
);

const PreviewField: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="border-b border-green-100 pb-1 mb-2">
    <span className="text-xs font-bold text-green-700 block uppercase tracking-wide">{label}</span>
    <span className="font-bold text-lg block text-slate-900 leading-tight">{value || "........................"}</span>
  </div>
);

const PreviewRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex text-sm py-1">
    <span className="w-32 font-bold text-slate-600 uppercase text-[10px] tracking-wider">{label}</span>
    <span className="flex-1 border-b border-dotted border-slate-300 px-1 font-medium">{value || ''}</span>
  </div>
);

import { CLUBS_CONFIG } from '../constants';

export const CoverPage: React.FC<{ data: AppData }> = ({ data }) => {
  const clubConfig = CLUBS_CONFIG[data.clubName] || {};
  // Safely access logo with type assertion or optional chaining if TS is strict about '|| {}' inference
  const logoUrl = data.customLogo || (clubConfig as any).logo || "https://raw.githubusercontent.com/firdaushadi442/cloud/refs/heads/main/Logo%20KRS%20Stroke.png";


  return (
    <div className="h-full flex flex-col items-center justify-start text-center border-8 border-double border-slate-800 p-8 rounded-lg bg-yellow-50/20">
      {/* School Header Section */}
      <div className="mt-4 mb-8 flex flex-col items-center">
        <img
          src="https://raw.githubusercontent.com/firdaushadi442/cloud/refs/heads/main/Logo%20SMAUJ%20Baru.png"
          className="w-24 h-24 object-contain mb-3 drop-shadow-sm"
          alt="School Logo"
        />
        <h3 className="text-sm font-black text-slate-900 uppercase">{data.schoolName || "NAMA SEKOLAH"}</h3>
      </div>

      {/* Club Logo Section */}
      <div className="mb-10">
        <img
          src={logoUrl}
          className="w-40 h-40 mx-auto drop-shadow-xl object-contain"
          alt="Club Logo"
        />
      </div>

      {/* Main Title */}
      <div className="mb-10">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">BUKU LOG</h1>
        <h2 className="text-2xl font-bold text-slate-800 mt-2 uppercase tracking-widest">{data.clubName || "NAMA KELAB"}</h2>
        <div className="h-1.5 w-24 bg-yellow-400 mx-auto mt-4 rounded-full"></div>
      </div>

      {/* Data Box */}
      <div className="w-full max-w-lg space-y-6 text-left p-8 border-2 border-slate-800 rounded-xl bg-white shadow-xl mb-6">
        <PreviewField label="NAMA AHLI" value={data.studentName} />
        <PreviewField label="SEKOLAH" value={data.schoolName} />
        <div className="grid grid-cols-2 gap-6">
          <PreviewField label="KELAS / TINGKATAN" value={data.form} />
          <PreviewField label="TAHUN" value={data.year} />
        </div>
        <PreviewField label="NO. KEAHLIAN" value={data.memberId || '-'} />
      </div>

      {/* Footer Branding */}
      <div className="mt-auto pb-4">
        <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Buku Log Digital • {data.clubName}</p>
      </div>
    </div>
  );
};

interface Teacher {
  name: string;
  email: string;
}

export const BiodataPage: React.FC<{ data: AppData; teachersList?: Teacher[] }> = ({ data, teachersList }) => {
  // Cari nama guru berdasarkan emel jika teachersList disediakan
  const teacherName = teachersList?.find(t => t.email === data.teacher)?.name || data.teacher;

  return (
    <div>
      <SectionHeader title="2. Maklumat Peribadi" />
      <div className="grid grid-cols-3 gap-8 mb-10 items-start">
        <div className="col-span-2 space-y-2">
          <PreviewRow label="Nama Penuh" value={data.studentName} />
          <PreviewRow label="No. KP" value={data.ic} />
          <PreviewRow label="Tarikh Lahir" value={formatDateStr(data.dob)} />
          <PreviewRow label="No. Telefon" value={data.phone} />
          <PreviewRow label="Penjaga" value={data.guardian} />
          <div className="pt-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Alamat Kediaman</span>
            <div className="border-b border-dotted border-slate-300 min-h-[3rem] text-sm leading-relaxed">{data.address || ""}</div>
          </div>
        </div>
        <div className="border-2 border-slate-200 h-48 w-full flex items-center justify-center bg-slate-50 overflow-hidden rounded-xl shadow-sm">
          {data.profileImage ? (
            <img src={data.profileImage} className="w-full h-full object-cover" alt="Gambar Profil" />
          ) : (
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter text-center px-4">Ruang Gambar Murid</div>
          )}
        </div>
      </div>
      <div className="pt-4 border-t border-slate-100">
        <PreviewRow label="Guru Penasihat" value={teacherName} />
      </div>
    </div>
  );
};

export const OrganizationPage: React.FC<{ data: AppData }> = ({ data }) => (
  <div className="w-full">
    <SectionHeader title="6. Carta Organisasi" />
    <div className="flex flex-col items-center mt-6 w-full max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col items-center">
        <OrgBoxModern title="PENAUNG" name={data.principal} role="Pengetua" isMain={true} />
        <div className="h-4 w-0.5 bg-slate-300"></div>
      </div>
      <div className="flex flex-col items-center -mt-1">
        <OrgBoxModern title="GURU PENASIHAT" name={data.teacherAdvisor} isMain={true} />
        <div className="h-4 w-0.5 bg-slate-300"></div>
      </div>
      <div className="flex flex-col items-center -mt-1">
        <OrgBoxModern title="PENGERUSI" name={data.chairman} isMain={true} />
        <div className="h-4 w-0.5 bg-slate-300"></div>
      </div>
      <div className="relative w-full flex justify-center -mt-1">
        <div className="absolute top-0 left-1/4 right-1/4 h-4 border-t-2 border-slate-300"></div>
        <div className="flex justify-between w-3/4 pt-4 px-2 gap-8">
          <div className="flex flex-col items-center flex-1">
            <div className="h-4 w-0.5 bg-slate-300 absolute top-0"></div>
            <OrgBoxModern title="SETIAUSAHA" name={data.secretary} />
          </div>
          <div className="flex flex-col items-center flex-1">
            <div className="h-4 w-0.5 bg-slate-300 absolute top-0"></div>
            <OrgBoxModern title="BENDAHARI" name={data.treasurer} />
          </div>
        </div>
      </div>
      <div className="w-full mt-10">
        <div className="bg-white border-2 border-slate-200 rounded-xl p-6 relative mx-auto max-w-2xl shadow-sm">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-900 px-4 py-1 text-[10px] font-bold text-white uppercase tracking-widest rounded-full shadow-lg">
            Ahli Jawatankuasa (AJK)
          </div>
          {data.committee ? (
            <div className="text-center whitespace-pre-line text-sm font-semibold text-slate-800 leading-loose">
              {data.committee}
            </div>
          ) : (
            <p className="text-center text-slate-300 text-xs italic py-2">Tiada AJK disenaraikan</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const PrintLogs: React.FC<{ logs: WeeklyLog[] }> = ({ logs }) => {
  return (
    <div className="print-logs-wrapper space-y-4">
      {logs.length > 0 ? logs.map((log, index) => (
        <A4Page key={log.id}>
          {index === 0 && <SectionHeader title="9. Log Aktiviti Mingguan" />}
          <div className="border-[1.5px] border-black rounded-sm overflow-hidden flex flex-col h-full mb-4">
            {/* Header Laporan */}
            <div className="bg-slate-800 text-white border-b border-black px-4 py-3 flex justify-between items-center text-sm font-bold uppercase tracking-widest">
              <span>LAPORAN MINGGUAN #{index + 1}</span>
              <span>TARIKH: {formatDateStr(log.date)}</span>
            </div>

            {/* Grid Info */}
            <div className="p-3 text-[10px] grid grid-cols-4 gap-3 border-b border-black bg-slate-50 font-bold uppercase leading-tight">
              <div className="border-r border-black/20">MASA: <span className="text-slate-900 ml-1">{formatTimeStr(log.time)}</span></div>
              <div className="border-r border-black/20">TEMPAT: <span className="text-slate-900 ml-1">{log.place}</span></div>
              <div className="border-r border-black/20">AKTIVITI: <span className="text-slate-900 ml-1">{log.type}</span></div>
              <div>KEHADIRAN: <span className="text-slate-900 ml-1">{log.attendance || 'HADIR'}</span></div>
            </div>

            {/* Kandungan Laporan */}
            <div className="p-6 flex-grow space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-[11px] font-black uppercase text-slate-800 underline underline-offset-4 decoration-2 mb-2">Objektif:</h4>
                  <p className="text-[13px] leading-relaxed text-slate-800 min-h-[40px]">{log.objective || "-"}</p>
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase text-slate-800 underline underline-offset-4 decoration-2 mb-2">Keterangan:</h4>
                  <p className="text-[13px] leading-relaxed text-slate-800 min-h-[60px]">{log.content || "-"}</p>
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase text-slate-800 underline underline-offset-4 decoration-2 mb-2">Refleksi:</h4>
                  <p className="text-[13px] italic leading-relaxed text-slate-700 min-h-[40px]">"{log.reflection || "-"}"</p>
                </div>
                {/* Ulasan Guru */}
                {log.teacherNote && (
                  <div className="bg-slate-50 p-2 border border-dotted border-slate-400 rounded">
                    <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-1">Ulasan Guru:</h4>
                    <p className="text-[11px] text-slate-700 leading-tight">{log.teacherNote}</p>
                  </div>
                )}
              </div>

              {/* Gambar Bersaiz Kecil (Side-by-side) */}
              {(log.img1 || log.img2) && (
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="h-44 border border-slate-300 rounded overflow-hidden bg-slate-50 flex items-center justify-center shadow-sm">
                    {log.img1 ? <img src={log.img1} referrerPolicy="no-referrer" className="w-full h-full object-contain p-1" alt="Lampiran 1" /> : <span className="text-[10px] text-slate-300 uppercase italic">Tiada Gambar</span>}
                  </div>
                  <div className="h-44 border border-slate-300 rounded overflow-hidden bg-slate-50 flex items-center justify-center shadow-sm">
                    {log.img2 ? <img src={log.img2} referrerPolicy="no-referrer" className="w-full h-full object-contain p-1" alt="Lampiran 2" /> : <span className="text-[10px] text-slate-300 uppercase italic">Tiada Gambar</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Signature Section - Modified to show ONLY teacher signature if present, and remove Student sign line */}
            <div className="p-6 border-t border-black bg-slate-50 flex justify-end items-end mt-auto">
              <div className="text-center relative">
                <div className="w-48 border-b border-black mb-2 h-16 flex items-end justify-center">
                  {log.teacherSignature ? (
                    <img src={log.teacherSignature} className="max-h-16 object-contain" alt="Sign" />
                  ) : null}
                </div>
                <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Tandatangan Guru</span>
              </div>
            </div>
          </div>
        </A4Page>
      )) : (
        <A4Page>
          <SectionHeader title="9. Log Aktiviti Mingguan" />
          <div className="text-center p-20 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 italic">
            Tiada laporan mingguan direkodkan buat masa ini.
          </div>
        </A4Page>
      )}
    </div>
  );
};
