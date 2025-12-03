
import React, { useState, useMemo } from 'react';
import { Employee, Adjustment, AdjustmentType, AppSettings, DeferredDebt, User } from '../types';
import { Search, Plus, Trash2, Printer } from 'lucide-react';
import { exportToExcel } from '../utils/excel';
import { t } from '../utils/i18n';

interface Props {
  employees: Employee[];
  adjustments: Adjustment[];
  onAddAdjustment: (adj: Adjustment) => void;
  onDeleteAdjustment: (id: string) => void;
  debts: DeferredDebt[];
  settings: AppSettings;
  user: User | null;
}

const Adjustments: React.FC<Props> = ({ employees, adjustments, onAddAdjustment, onDeleteAdjustment, debts, settings, user }) => {
  const [formData, setFormData] = useState<Partial<Adjustment>>({ 
    type: AdjustmentType.BONUS, 
    date: new Date().toISOString().split('T')[0] 
  });
  const [searchTerm, setSearchTerm] = useState('');

  const canEdit = user?.role === 'admin' || user?.permissions.canEdit;
  const canDelete = user?.role === 'admin' || user?.permissions.canDelete;
  const canPrint = user?.role === 'admin' || user?.permissions.canPrint;

  const activeDebtsForEmployee = useMemo(() => {
    if (!formData.employeeId) return [];
    return debts.filter(d => d.employeeId === formData.employeeId && d.remainingAmount > 0);
  }, [formData.employeeId, debts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
         alert(t('permissionDenied', settings.language));
         return;
    }
    if (!formData.employeeId || !formData.amount || !formData.date) return;

    if (formData.linkedDebtId) {
        const debt = debts.find(d => d.id === formData.linkedDebtId);
        if (debt && Number(formData.amount) > debt.remainingAmount) {
            alert(t('debtCompleted', settings.language) + " (" + debt.remainingAmount + ")");
            return;
        }
    }

    const newAdjustment: Adjustment = {
      id: Date.now().toString(),
      employeeId: formData.employeeId,
      type: formData.type!,
      amount: Number(formData.amount),
      date: formData.date,
      note: formData.note,
      linkedDebtId: formData.linkedDebtId
    };

    onAddAdjustment(newAdjustment);
    setFormData({ 
      ...formData, 
      amount: 0, 
      note: '', 
      linkedDebtId: undefined,
      type: AdjustmentType.BONUS 
    });
  };

  const getEmployee = (id: string) => employees.find(e => e.id === id);

  const getTypeName = (type: string) => {
    const key = type === AdjustmentType.BONUS ? 'bonus' : type === AdjustmentType.DEDUCTION ? 'deduction' : type === AdjustmentType.ABSENCE ? 'absence' : 'loan';
    return t(key, settings.language);
  };

  const filteredAdjustments = adjustments.filter(adj => {
    const emp = getEmployee(adj.employeeId);
    if (!emp) return false;
    const term = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      emp.branch.toLowerCase().includes(term) ||
      emp.id.includes(term)
    );
  });

  return (
    <div className="p-6 space-y-6 h-full flex flex-col overflow-hidden">
       <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold text-gray-800">{t('adjustments', settings.language)}</h2>
        <div className="flex gap-2">
            <button onClick={() => exportToExcel(filteredAdjustments.map(a => ({...a, empName: getEmployee(a.employeeId)?.name})), 'Adjustments')} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('name', settings.language)}</label>
                <select 
                required
                value={formData.employeeId || ''}
                onChange={e => setFormData({...formData, employeeId: e.target.value, linkedDebtId: undefined})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none bg-white"
                >
                <option value="">...</option>
                {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} - {emp.branch}</option>
                ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('type', settings.language)}</label>
                <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as AdjustmentType})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none bg-white"
                >
                <option value={AdjustmentType.BONUS}>{t('bonus', settings.language)}</option>
                <option value={AdjustmentType.DEDUCTION}>{t('deduction', settings.language)}</option>
                <option value={AdjustmentType.ABSENCE}>{t('absence', settings.language)}</option>
                <option value={AdjustmentType.LOAN}>{t('loan', settings.language)}</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount', settings.language)}</label>
                <input 
                required
                type="number"
                min="0"
                value={formData.amount || ''}
                onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('date', settings.language)}</label>
                <input 
                required
                type="date"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                />
            </div>
            
            <div className="md:col-span-5 flex gap-2">
                <input 
                type="text"
                value={formData.note || ''}
                onChange={e => setFormData({...formData, note: e.target.value})}
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                placeholder={t('note', settings.language)}
                />
            </div>

            {/* Conditional Debt Link */}
            {(formData.type === AdjustmentType.LOAN || formData.type === AdjustmentType.DEDUCTION) && activeDebtsForEmployee.length > 0 && (
                <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('linkToDebt', settings.language)}</label>
                    <select 
                        value={formData.linkedDebtId || ''}
                        onChange={e => setFormData({...formData, linkedDebtId: e.target.value})}
                        className="w-full p-2 border border-orange-300 rounded focus:ring-2 focus:ring-orange-500 outline-none bg-orange-50"
                    >
                        <option value="">-- {t('linkToDebt', settings.language)} --</option>
                        {activeDebtsForEmployee.map(d => (
                            <option key={d.id} value={d.id}>{d.description} ({t('remaining', settings.language)}: {d.remainingAmount})</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="md:col-span-6 lg:col-span-1 ml-auto">
                <button type="submit" className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-blue-700">
                <Plus size={18} /> {t('add', settings.language)}
                </button>
            </div>
            </form>
        </div>
      )}

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center gap-4 bg-gray-50 no-print">
            <div className="relative flex-1 max-w-md">
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
                 <th className="p-3 border-b">{t('date', settings.language)}</th>
                 <th className="p-3 border-b">{t('name', settings.language)}</th>
                 <th className="p-3 border-b">{t('type', settings.language)}</th>
                 <th className="p-3 border-b">{t('amount', settings.language)}</th>
                 <th className="p-3 border-b">{t('note', settings.language)}</th>
                 <th className="p-3 border-b text-center no-print">{t('actions', settings.language)}</th>
               </tr>
             </thead>
             <tbody>
               {filteredAdjustments.map((adj) => {
                   const emp = getEmployee(adj.employeeId);
                   const isNegative = adj.type !== AdjustmentType.BONUS;
                   return (
                 <tr key={adj.id} className="hover:bg-gray-50 border-b">
                   <td className="p-3 text-gray-600 text-sm">{adj.date}</td>
                   <td className="p-3 font-medium">{emp?.name}</td>
                   <td className="p-3">
                       <span className={`px-2 py-1 rounded text-xs ${isNegative ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                           {getTypeName(adj.type)}
                       </span>
                       {adj.linkedDebtId && <span className="mr-2 text-xs bg-orange-100 text-orange-800 px-1 rounded">Debt Pay</span>}
                   </td>
                   <td className={`p-3 font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                       {adj.amount.toLocaleString()} {settings.currency}
                   </td>
                   <td className="p-3 text-gray-500 text-sm max-w-xs truncate">{adj.note}</td>
                   <td className="p-3 text-center no-print">
                     <button disabled={!canDelete} onClick={() => onDeleteAdjustment(adj.id)} className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"><Trash2 size={16} /></button>
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

export default Adjustments;
