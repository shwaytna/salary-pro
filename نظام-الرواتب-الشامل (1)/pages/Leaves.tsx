
import React, { useState } from 'react';
import { Employee, LeaveRecord, AppSettings, User } from '../types';
import { t } from '../utils/i18n';
import { Search, Plus, Trash2, Printer } from 'lucide-react';
import { exportToExcel } from '../utils/excel';

interface Props {
  employees: Employee[];
  leaves: LeaveRecord[];
  setLeaves: React.Dispatch<React.SetStateAction<LeaveRecord[]>>;
  settings: AppSettings;
  user: User | null;
}

const Leaves: React.FC<Props> = ({ employees, leaves, setLeaves, settings, user }) => {
  const [formData, setFormData] = useState<Partial<LeaveRecord>>({
    type: 'annual',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [searchTerm, setSearchTerm] = useState('');

  const canEdit = user?.role === 'admin' || user?.permissions.canEdit;
  const canDelete = user?.role === 'admin' || user?.permissions.canDelete;
  const canPrint = user?.role === 'admin' || user?.permissions.canPrint;

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    return diffDays;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
         alert(t('permissionDenied', settings.language));
         return;
    }
    if (!formData.employeeId || !formData.startDate || !formData.endDate) return;

    const days = calculateDays(formData.startDate, formData.endDate);

    const newLeave: LeaveRecord = {
      id: Date.now().toString(),
      employeeId: formData.employeeId,
      type: formData.type as any,
      startDate: formData.startDate,
      endDate: formData.endDate,
      days: days,
      note: formData.note
    };

    setLeaves(prev => [newLeave, ...prev]);
    setFormData({ 
        type: 'annual',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        note: ''
    });
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
         alert(t('permissionDenied', settings.language));
         return;
    }
    if (window.confirm(t('confirmDelete', settings.language))) {
      setLeaves(prev => prev.filter(l => l.id !== id));
    }
  };

  const getEmployee = (id: string) => employees.find(e => e.id === id);

  const filteredLeaves = leaves.filter(l => {
    const emp = getEmployee(l.employeeId);
    if (!emp) return false;
    const term = searchTerm.toLowerCase();
    return (
        emp.name.toLowerCase().includes(term) ||
        emp.id.includes(term) ||
        emp.branch.toLowerCase().includes(term)
    );
  });

  const getTypeName = (type: string) => {
      switch(type) {
          case 'annual': return t('annualLeave', settings.language);
          case 'sick': return t('sickLeave', settings.language);
          case 'unpaid': return t('unpaidLeave', settings.language);
          case 'absence': return t('absence', settings.language);
          default: return type;
      }
  }

  return (
    <div className="p-6 space-y-6 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold text-gray-800">{t('leaves', settings.language)}</h2>
        <div className="flex gap-2">
            <button onClick={() => exportToExcel(filteredLeaves.map(l => ({...l, empName: getEmployee(l.employeeId)?.name})), 'Leaves')} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                {t('export', settings.language)} Excel
            </button>
            {canPrint && (
                <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                    <Printer size={18} /> {t('print', settings.language)}
                </button>
            )}
        </div>
      </div>

      {canEdit && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 no-print">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('employees', settings.language)}</label>
                    <select 
                        required
                        value={formData.employeeId || ''}
                        onChange={e => setFormData({...formData, employeeId: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                    >
                        <option value="">...</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name} (Bal: {emp.annualLeaveBalance || 30})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('type', settings.language)}</label>
                    <select 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as any})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                    >
                        <option value="annual">{t('annualLeave', settings.language)}</option>
                        <option value="sick">{t('sickLeave', settings.language)}</option>
                        <option value="absence">{t('absence', settings.language)}</option>
                        <option value="unpaid">{t('unpaidLeave', settings.language)}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('startDate', settings.language)}</label>
                    <input 
                        required
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData({...formData, startDate: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('endDate', settings.language)}</label>
                    <input 
                        required
                        type="date"
                        value={formData.endDate}
                        onChange={e => setFormData({...formData, endDate: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
                <div className="md:col-span-6 flex gap-2">
                     <input 
                        type="text"
                        placeholder={t('note', settings.language)}
                        value={formData.note || ''}
                        onChange={e => setFormData({...formData, note: e.target.value})}
                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded hover:bg-blue-700">
                        <Plus size={18} /> {t('add', settings.language)}
                    </button>
                </div>
            </form>
        </div>
      )}

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
         <div className="p-4 border-b border-gray-200 bg-gray-50 no-print">
            <div className="relative max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rtl:right-auto rtl:left-3" size={18}/>
                <input 
                    type="text" 
                    placeholder={t('search', settings.language)}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-10 py-2 border rounded-full focus:outline-none focus:border-primary"
                />
             </div>
        </div>
        <div className="overflow-auto flex-1 p-4">
           <table className="w-full text-right rtl:text-right ltr:text-left border-collapse">
             <thead className="bg-gray-100 sticky top-0">
               <tr>
                 <th className="p-3 border-b">{t('name', settings.language)}</th>
                 <th className="p-3 border-b">{t('type', settings.language)}</th>
                 <th className="p-3 border-b">{t('date', settings.language)}</th>
                 <th className="p-3 border-b">{t('days', settings.language)}</th>
                 <th className="p-3 border-b">{t('note', settings.language)}</th>
                 <th className="p-3 border-b text-center no-print">{t('actions', settings.language)}</th>
               </tr>
             </thead>
             <tbody>
               {filteredLeaves.map((leave) => {
                   const emp = getEmployee(leave.employeeId);
                   return (
                     <tr key={leave.id} className="hover:bg-gray-50 border-b">
                       <td className="p-3 font-medium">
                           {emp?.name}
                           <div className="text-xs text-gray-500">{emp?.branch} - {emp?.id}</div>
                       </td>
                       <td className="p-3">
                           <span className={`px-2 py-1 rounded text-xs 
                                ${leave.type === 'absence' ? 'bg-red-100 text-red-700' : 
                                leave.type === 'sick' ? 'bg-orange-100 text-orange-700' : 
                                'bg-blue-100 text-blue-700'}`}>
                               {getTypeName(leave.type)}
                           </span>
                       </td>
                       <td className="p-3 text-sm">{leave.startDate} <span className="text-gray-400">-></span> {leave.endDate}</td>
                       <td className="p-3 font-bold">{leave.days}</td>
                       <td className="p-3 text-sm text-gray-600">{leave.note}</td>
                       <td className="p-3 text-center no-print">
                         <button disabled={!canDelete} onClick={() => handleDelete(leave.id)} className="text-red-500 hover:text-red-700 disabled:opacity-30"><Trash2 size={18} /></button>
                       </td>
                     </tr>
                   )
               })}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default Leaves;
