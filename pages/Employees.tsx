
import React, { useState, useRef } from 'react';
import { Employee, AppSettings, User } from '../types';
import { exportToExcel, importEmployeesFromExcel } from '../utils/excel';
import { Plus, Trash2, Edit, Download, Upload, Printer, Search } from 'lucide-react';
import { t } from '../utils/i18n';

interface Props {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  settings: AppSettings;
  user: User | null;
}

const Employees: React.FC<Props> = ({ employees, setEmployees, settings, user }) => {
  const [formData, setFormData] = useState<Partial<Employee>>({ annualLeaveBalance: 30 });
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = user?.role === 'admin' || user?.permissions.canEdit;
  const canDelete = user?.role === 'admin' || user?.permissions.canDelete;
  const canPrint = user?.role === 'admin' || user?.permissions.canPrint;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
        alert(t('permissionDenied', settings.language));
        return;
    }
    if (!formData.id || !formData.name || !formData.salary || !formData.branch) return;

    if (isEditing) {
      setEmployees(prev => prev.map(emp => emp.id === formData.id ? { ...formData as Employee } : emp));
      setIsEditing(false);
    } else {
      if (employees.some(e => e.id === formData.id)) {
        alert('ID already exists');
        return;
      }
      setEmployees(prev => [...prev, formData as Employee]);
    }
    setFormData({ annualLeaveBalance: 30 });
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
        alert(t('permissionDenied', settings.language));
        return;
    }
    if (window.confirm(t('confirmDelete', settings.language))) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  const handleEdit = (employee: Employee) => {
    if (!canEdit) {
        alert(t('permissionDenied', settings.language));
        return;
    }
    setFormData(employee);
    setIsEditing(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    if (e.target.files && e.target.files[0]) {
      try {
        const newEmployees = await importEmployeesFromExcel(e.target.files[0]);
        const currentIds = new Set(employees.map(e => e.id));
        const uniqueNew = newEmployees.filter(e => !currentIds.has(String(e.id)));
        setEmployees(prev => [...prev, ...uniqueNew]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.id.includes(searchTerm) || 
    emp.branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold text-gray-800">{t('employees', settings.language)}</h2>
        <div className="flex gap-2">
          {canEdit && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
              />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                <Upload size={18} /> {t('import', settings.language)}
              </button>
            </>
          )}
          <button onClick={() => exportToExcel(employees, 'Employees_List')} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            <Download size={18} /> {t('export', settings.language)}
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
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <input 
                required
                type="text" 
                value={formData.id || ''} 
                onChange={e => setFormData({...formData, id: e.target.value})}
                disabled={isEditing}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none disabled:bg-gray-100"
                />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('name', settings.language)}</label>
                <input 
                required
                type="text" 
                value={formData.name || ''} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('salary', settings.language)}</label>
                <input 
                required
                type="number" 
                value={formData.salary || ''} 
                onChange={e => setFormData({...formData, salary: Number(e.target.value)})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('branch', settings.language)}</label>
                <input 
                required
                type="text" 
                value={formData.branch || ''} 
                onChange={e => setFormData({...formData, branch: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                />
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">{t('leaveBalance', settings.language)}</label>
                 <input 
                  type="number" 
                  value={formData.annualLeaveBalance || 0} 
                  onChange={e => setFormData({...formData, annualLeaveBalance: Number(e.target.value)})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                />
            </div>
            <div className="md:col-span-6 flex justify-end gap-2 mt-2">
                {isEditing && (
                <button type="button" onClick={() => { setIsEditing(false); setFormData({annualLeaveBalance: 30}); }} className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200">
                    {t('cancel', settings.language)}
                </button>
                )}
                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded hover:bg-blue-700">
                {isEditing ? <Edit size={18} /> : <Plus size={18} />}
                {isEditing ? t('edit', settings.language) : t('add', settings.language)}
                </button>
            </div>
            </form>
        </div>
      )}

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 no-print">
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
                 <th className="p-3 border-b">ID</th>
                 <th className="p-3 border-b">{t('name', settings.language)}</th>
                 <th className="p-3 border-b">{t('branch', settings.language)}</th>
                 <th className="p-3 border-b">{t('salary', settings.language)}</th>
                 <th className="p-3 border-b text-center no-print">{t('actions', settings.language)}</th>
               </tr>
             </thead>
             <tbody>
               {filteredEmployees.map((emp) => (
                 <tr key={emp.id} className="hover:bg-gray-50 border-b last:border-0">
                   <td className="p-3">{emp.id}</td>
                   <td className="p-3 font-medium">{emp.name}</td>
                   <td className="p-3"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{emp.branch}</span></td>
                   <td className="p-3">{emp.salary.toLocaleString()} {settings.currency}</td>
                   <td className="p-3 flex justify-center gap-2 no-print">
                     <button disabled={!canEdit} onClick={() => handleEdit(emp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30"><Edit size={16} /></button>
                     <button disabled={!canDelete} onClick={() => handleDelete(emp.id)} className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"><Trash2 size={16} /></button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default Employees;
