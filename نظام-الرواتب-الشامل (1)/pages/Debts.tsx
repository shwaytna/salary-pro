
import React, { useState } from 'react';
import { Employee, DeferredDebt, AppSettings, User } from '../types';
import { t } from '../utils/i18n';
import { Plus, Trash2, Search, Printer } from 'lucide-react';

interface Props {
  employees: Employee[];
  debts: DeferredDebt[];
  setDebts: React.Dispatch<React.SetStateAction<DeferredDebt[]>>;
  settings: AppSettings;
  user: User | null;
}

const Debts: React.FC<Props> = ({ employees, debts, setDebts, settings, user }) => {
  const [formData, setFormData] = useState<Partial<DeferredDebt>>({
    startDate: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');

  const canEdit = user?.role === 'admin' || user?.permissions.canEdit;
  const canDelete = user?.role === 'admin' || user?.permissions.canDelete;
  const canPrint = user?.role === 'admin' || user?.permissions.canPrint;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
         alert(t('permissionDenied', settings.language));
         return;
    }
    if (!formData.employeeId || !formData.totalAmount || !formData.startDate) return;

    const newDebt: DeferredDebt = {
      id: Date.now().toString(),
      employeeId: formData.employeeId,
      totalAmount: Number(formData.totalAmount),
      remainingAmount: Number(formData.totalAmount),
      startDate: formData.startDate,
      description: formData.description || '',
      isPaid: false,
    };

    setDebts(prev => [newDebt, ...prev]);
    setFormData({ startDate: new Date().toISOString().split('T')[0], description: '' });
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
         alert(t('permissionDenied', settings.language));
         return;
    }
    if (window.confirm(t('confirmDelete', settings.language))) {
      setDebts(prev => prev.filter(d => d.id !== id));
    }
  };

  const getEmployee = (id: string) => employees.find(e => e.id === id);

  const filteredDebts = debts.filter(d => {
    const emp = getEmployee(d.employeeId);
    if (!emp) return false;
    const term = searchTerm.toLowerCase();
    return (
        emp.name.toLowerCase().includes(term) || 
        d.description.toLowerCase().includes(term) ||
        emp.branch.toLowerCase().includes(term) ||
        emp.id.includes(term)
    );
  });

  return (
    <div className="p-6 space-y-6 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center no-print">
          <h2 className="text-2xl font-bold text-gray-800">{t('debts', settings.language)}</h2>
          {canPrint && (
            <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                <Printer size={18} /> {t('print', settings.language)}
            </button>
          )}
      </div>

      {/* Add Debt Form */}
      {canEdit && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 no-print">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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
                    <option key={emp.id} value={emp.id}>{emp.name} - {emp.branch}</option>
                ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('totalDebt', settings.language)}</label>
                <input 
                required
                type="number"
                min="0"
                value={formData.totalAmount || ''}
                onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('date', settings.language)}</label>
                <input 
                required
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                />
            </div>
            <div className="md:col-span-5 flex gap-2">
                <input 
                type="text"
                placeholder={t('note', settings.language)}
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                />
                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded hover:bg-blue-700">
                <Plus size={18} /> {t('add', settings.language)}
                </button>
            </div>
            </form>
        </div>
      )}

      {/* List */}
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
                 <th className="p-3 border-b">{t('totalDebt', settings.language)}</th>
                 <th className="p-3 border-b">{t('paid', settings.language)}</th>
                 <th className="p-3 border-b">{t('remaining', settings.language)}</th>
                 <th className="p-3 border-b text-center no-print">{t('actions', settings.language)}</th>
               </tr>
             </thead>
             <tbody>
               {filteredDebts.map((debt) => {
                   const emp = getEmployee(debt.employeeId);
                   const paidAmount = debt.totalAmount - debt.remainingAmount;
                   const progress = (paidAmount / debt.totalAmount) * 100;
                   return (
                 <tr key={debt.id} className="hover:bg-gray-50 border-b">
                   <td className="p-3 font-medium">
                       <div>{emp?.name}</div>
                       <div className="text-xs text-gray-400">{debt.description}</div>
                   </td>
                   <td className="p-3 font-bold">{debt.totalAmount.toLocaleString()} {settings.currency}</td>
                   <td className="p-3 text-green-600">{paidAmount.toLocaleString()} {settings.currency}</td>
                   <td className="p-3">
                       <div className="flex flex-col gap-1">
                           <span className={debt.remainingAmount > 0 ? "text-red-600 font-bold" : "text-gray-400"}>
                               {debt.remainingAmount.toLocaleString()} {settings.currency}
                           </span>
                           <div className="w-full bg-gray-200 rounded-full h-1.5">
                               <div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${progress}%`}}></div>
                           </div>
                       </div>
                   </td>
                   <td className="p-3 text-center no-print">
                     <button disabled={!canDelete} onClick={() => handleDelete(debt.id)} className="text-red-500 hover:text-red-700 disabled:opacity-30"><Trash2 size={18} /></button>
                   </td>
                 </tr>
               )})}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default Debts;
