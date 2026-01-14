
import React from 'react';
import { 
  CheckCircle, AlertTriangle, X, Trash2, Shield 
} from 'lucide-react';

export const Input: React.FC<{
  label?: string;
  id?: string;
  value?: string | number;
  onChange?: (val: string) => void;
  [key: string]: any;
}> = ({ label, id, value, onChange, ...props }) => {
  const isControlled = onChange !== undefined || props.readOnly;
  const safeValue = isControlled ? (value ?? '') : undefined;
  
  return (
    <div className="mb-3">
      {label && <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{label}</label>}
      <input 
        id={id} 
        value={safeValue} 
        onChange={onChange ? (e) => onChange(e.target.value) : undefined} 
        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm" 
        {...props} 
      />
    </div>
  );
};

export const Toast: React.FC<{
  notification: { message: string, type: string } | null;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  if (!notification) return null;
  const isSuccess = notification.type === 'success';
  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-5 duration-300 ${isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
      {isSuccess ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
      <span className="text-sm font-medium">{notification.message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-black/5 p-1 rounded-full"><X size={14}/></button>
    </div>
  );
};

export const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
}> = ({ isOpen, onClose, onConfirm, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4"><Trash2 size={24} /></div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{title || "Padam Rekod?"}</h3>
          <p className="text-slate-500 mb-6 text-sm">Adakah anda pasti mahu memadam item ini? Tindakan ini tidak boleh dipulihkan.</p>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition">Batal</button>
            <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">Padam</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="border-b-2 border-green-800 mb-6 pb-2">
    <h2 className="text-xl font-bold uppercase text-green-900 tracking-wide flex items-center gap-2">
      <Shield size={20} className="text-yellow-500" />
      {title}
    </h2>
  </div>
);

export const OrgBoxModern: React.FC<{ 
  title: string; 
  name: string; 
  role?: string; 
  isMain?: boolean;
}> = ({ title, name, role, isMain }) => (
  <div className={`flex flex-col items-center bg-white border-2 rounded-lg shadow-sm overflow-hidden transition-all break-inside-avoid ${isMain ? 'border-green-800 w-56' : 'border-slate-300 w-44'}`}>
    <div className={`${isMain ? 'bg-green-800 text-white' : 'bg-slate-100 text-slate-700'} text-[10px] font-bold py-1.5 w-full text-center tracking-wider uppercase border-b border-slate-200`}>
      {title}
    </div>
    <div className={`p-2 text-sm font-bold text-slate-900 text-center flex items-center justify-center w-full ${isMain ? 'min-h-[3.5rem]' : 'min-h-[3rem]'}`}>
      {name || <span className="text-slate-300 italic font-normal text-xs">.....</span>}
    </div>
    {role && <div className="text-[9px] text-slate-400 pb-1 uppercase tracking-tight">{role}</div>}
  </div>
);
