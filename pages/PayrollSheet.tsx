
import React, { useState, useMemo } from 'react';
import { Employee, Adjustment, AdjustmentType, PayrollRecord, AppSettings, User } from '../types';
import { exportToExcel } from '../utils/excel';
import { Printer, Download, Filter, Search } from 'lucide-react';
import { t } from '../utils/i18n';

interface Props {
  employees: Employee[];
  adjustments: Adjustment[];
  settings: AppSettings;
  user: User | null;
}

const PayrollSheet: React.FC<Props> = ({ employees, adjustments, settings, user }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [branchFilter, setBranchFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const canPrint = user?.role === 'admin' || user?.permissions.canPrint;

  const branches = useMemo(() => Array.from(new Set(employees.map(e => e.branch))), [employees]);

  const payrollData = useMemo(() => {
    return employees
      .filter(emp => {
          const matchBranch = branchFilter === 'all' || emp.branch === branchFilter;
          const term = searchTerm.toLowerCase();
          const matchSearch = emp.name.toLowerCase().includes(term) || emp.id.includes(term);
          return matchBranch && matchSearch;
      })
      .map(emp => {
        const empAdjustments = adjustments.filter(adj => 
          adj.employeeId === emp.id && adj.date.startsWith(selectedMonth)
        );

        const totalBonus = empAdjustments.filter(a => a.type === AdjustmentType.BONUS).reduce((sum, a) => sum + a.amount, 0);
        const totalDeductions = empAdjustments.filter(a => a.type !== AdjustmentType.BONUS).reduce((sum, a) => sum + a.amount, 0);

        return {
          employee: emp,
          basicSalary: emp.salary,
          totalAdditions: totalBonus,
          totalDeductions,
          netSalary: emp.salary + totalBonus - totalDeductions,
          details: empAdjustments
        } as PayrollRecord;
      });
  }, [employees, adjustments, selectedMonth, branchFilter, searchTerm]);

  const totals = useMemo(() => {
      return payrollData.reduce((acc, curr) => ({
          basic: acc.basic + curr.basicSalary,
          additions: acc.additions + curr.totalAdditions,
          deductions: acc.deductions + curr.totalDeductions,
          net: acc.net + curr.netSalary
      }), { basic: 0, additions: 0, deductions: 0, net: 0 });
  }, [payrollData]);

  if (user?.role !== 'admin' && !user?.permissions.canViewPayroll) {
      return <div className="p-6 text-center text-red-500 font-bold">{t('permissionDenied', settings.language)}</div>;
  }

  return (
    <div className="p-6 space-y-6 h-full flex flex-col overflow-hidden">
      <div className="flex flex-wrap justify-between items-center gap-4 no-print">
        <h2 className="text-2xl font-bold text-gray-800">{t('payroll', settings.language)}</h2>
        
        <div className="flex-1 flex justify-center">
            <div className="relative w-64 max-w-xs">
                 <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rtl:right-auto rtl:left-3" size={16}/>
                 <input 
                    className="w-full px-8 py-2 border rounded-full text-sm"
                    placeholder={t('search', settings.language)}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                 />
            </div>
        </div>

        <div className="flex gap-2 items-center bg-white p-2 rounded shadow-sm">
            <Filter size={18} className="text-gray-500 mx-2" />
            <select 
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="p-1 border-none outline-none text-sm bg-transparent"
            >
                <option value="all">All Branches</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="w-px h-6 bg-gray-200 mx-2"></div>
            <input 
                type="month" 
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="p-1 border-none outline-none text-sm bg-transparent"
            />
        </div>
        <div className="flex gap-2">
           <button onClick={() => exportToExcel(payrollData, `Payroll_${selectedMonth}`)} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
            <Download size={16} /> Excel
          </button>
          {canPrint && (
            <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">
                <Printer size={16} /> {t('print', settings.language)}
            </button>
          )}
        </div>
      </div>

      <div className="hidden print-only text-center mb-8">
          <h1 className="text-2xl font-bold">{settings.companyName} - {t('payroll', settings.language)}</h1>
          <p className="text-lg mt-2">{selectedMonth}</p>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1 p-4">
              <table className="w-full text-right rtl:text-right ltr:text-left border-collapse text-sm">
                  <thead className="bg-slate-800 text-white sticky top-0 print:bg-gray-200 print:text-black">
                      <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">{t('name', settings.language)}</th>
                          <th className="p-3">{t('branch', settings.language)}</th>
                          <th className="p-3">{t('basicSalary', settings.language)}</th>
                          <th className="p-3 text-green-400 print:text-black">{t('totalAdditions', settings.language)}</th>
                          <th className="p-3 text-red-400 print:text-black">{t('totalDeductions', settings.language)}</th>
                          <th className="p-3">{t('netSalary', settings.language)}</th>
                      </tr>
                  </thead>
                  <tbody>
                      {payrollData.map((record) => (
                          <tr key={record.employee.id} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-mono">{record.employee.id}</td>
                              <td className="p-3 font-medium">{record.employee.name}</td>
                              <td className="p-3">{record.employee.branch}</td>
                              <td className="p-3">{record.basicSalary.toLocaleString()}</td>
                              <td className="p-3 text-green-700 print:text-black">+{record.totalAdditions.toLocaleString()}</td>
                              <td className="p-3 text-red-700 print:text-black">-{record.totalDeductions.toLocaleString()}</td>
                              <td className="p-3 font-bold">{record.netSalary.toLocaleString()} {settings.currency}</td>
                          </tr>
                      ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold sticky bottom-0 border-t-2 border-slate-300">
                      <tr>
                          <td colSpan={3} className="p-3 text-center">TOTAL</td>
                          <td className="p-3">{totals.basic.toLocaleString()}</td>
                          <td className="p-3 text-green-700">{totals.additions.toLocaleString()}</td>
                          <td className="p-3 text-red-700">{totals.deductions.toLocaleString()}</td>
                          <td className="p-3">{totals.net.toLocaleString()} {settings.currency}</td>
                      </tr>
                  </tfoot>
              </table>
          </div>
      </div>
    </div>
  );
};

export default PayrollSheet;
