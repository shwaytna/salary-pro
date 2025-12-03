
import React, { useState, useMemo } from 'react';
import { Employee, Adjustment, DeferredDebt, LeaveRecord, AppSettings, AdjustmentType, User } from '../types';
import { t } from '../utils/i18n';
import { Printer, Search, Filter } from 'lucide-react';
import { exportToExcel } from '../utils/excel';

interface Props {
  employees: Employee[];
  adjustments: Adjustment[];
  debts: DeferredDebt[];
  leaves: LeaveRecord[];
  settings: AppSettings;
  user: User | null;
}

type ReportType = 'summary' | 'statement';

const Reports: React.FC<Props> = ({ employees, adjustments, debts, leaves, settings, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<ReportType>('summary');

  // Derive unique branches
  const branches = useMemo(() => Array.from(new Set(employees.map(e => e.branch))), [employees]);

  // Filter Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.id.includes(searchTerm);
      const matchBranch = branchFilter ? emp.branch === branchFilter : true;
      return matchSearch && matchBranch;
    });
  }, [employees, searchTerm, branchFilter]);

  // Calculations for Summary Report
  const summaryData = useMemo(() => {
    return filteredEmployees.map(emp => {
      // Filter records within date range
      const empAdj = adjustments.filter(a => a.employeeId === emp.id && a.date >= startDate && a.date <= endDate);
      const empLeaves = leaves.filter(l => l.employeeId === emp.id && l.startDate >= startDate && l.startDate <= endDate); // Simplified overlap check

      const totalBonus = empAdj.filter(a => a.type === AdjustmentType.BONUS).reduce((sum, a) => sum + a.amount, 0);
      const totalDeduction = empAdj.filter(a => a.type !== AdjustmentType.BONUS).reduce((sum, a) => sum + a.amount, 0);
      const totalLeaveDays = empLeaves.reduce((sum, l) => sum + l.days, 0);

      return {
        ...emp,
        totalBonus,
        totalDeduction,
        totalLeaveDays
      };
    });
  }, [filteredEmployees, adjustments, leaves, startDate, endDate]);

  // Calculate Summary Totals
  const summaryTotals = useMemo(() => {
    return summaryData.reduce((acc, curr) => ({
      salary: acc.salary + curr.salary,
      bonus: acc.bonus + curr.totalBonus,
      deduction: acc.deduction + curr.totalDeduction,
      leaves: acc.leaves + curr.totalLeaveDays
    }), { salary: 0, bonus: 0, deduction: 0, leaves: 0 });
  }, [summaryData]);


  // Data for Account Statement (Detailed)
  const getStatementData = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return null;

    const empAdj = adjustments
        .filter(a => a.employeeId === empId && a.date >= startDate && a.date <= endDate)
        .map(a => ({ date: a.date, type: 'Adjustment', desc: t(a.type === AdjustmentType.BONUS ? 'bonus' : 'deduction', settings.language), amount: a.amount, isCredit: a.type === AdjustmentType.BONUS }));
    
    const empDebts = debts
        .filter(d => d.employeeId === empId && d.startDate >= startDate && d.startDate <= endDate)
        .map(d => ({ date: d.startDate, type: 'Debt', desc: d.description, amount: d.totalAmount, isCredit: false }));

    const empLeaves = leaves
        .filter(l => l.employeeId === empId && l.startDate >= startDate)
        .map(l => ({ date: l.startDate, type: 'Leave', desc: `${l.type} (${l.days} days)`, amount: 0, isCredit: true }));

    // Combine and sort
    const allTrans = [...empAdj, ...empDebts, ...empLeaves].sort((a, b) => a.date.localeCompare(b.date));
    
    return { emp, transactions: allTrans };
  };

  // Calculate Grand Totals for All Statements currently in view
  const statementGrandTotals = useMemo(() => {
     let totalCredit = 0;
     let totalDebit = 0;
     filteredEmployees.forEach(emp => {
        const data = getStatementData(emp.id);
        if(data) {
           totalCredit += data.transactions.filter(t => t.isCredit).reduce((sum, t) => sum + t.amount, 0);
           totalDebit += data.transactions.filter(t => !t.isCredit).reduce((sum, t) => sum + t.amount, 0);
        }
     });
     return { totalCredit, totalDebit };
  }, [filteredEmployees, adjustments, debts, leaves, startDate, endDate]);

  const handlePrint = () => window.print();

  return (
    <div className="p-6 space-y-6 h-full flex flex-col overflow-hidden">
      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 no-print flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
           {/* Report Type */}
           <div>
               <label className="block text-sm font-bold mb-1">{t('reportType', settings.language)}</label>
               <div className="flex bg-gray-100 p-1 rounded">
                   <button 
                    onClick={() => setReportType('summary')}
                    className={`px-4 py-1 rounded text-sm ${reportType === 'summary' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
                   >
                       {t('summaryReport', settings.language)}
                   </button>
                   <button 
                    onClick={() => setReportType('statement')}
                    className={`px-4 py-1 rounded text-sm ${reportType === 'statement' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
                   >
                       {t('accountStatement', settings.language)}
                   </button>
               </div>
           </div>
           
           {/* Filters */}
           <div className="flex-1 min-w-[200px]">
               <label className="block text-sm font-medium mb-1">{t('search', settings.language)}</label>
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rtl:left-auto rtl:right-3" size={16}/>
                 <input 
                    className="w-full px-8 py-2 border rounded" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={t('search', settings.language)}
                 />
               </div>
           </div>

           <div className="w-40">
               <label className="block text-sm font-medium mb-1">{t('branch', settings.language)}</label>
               <select 
                className="w-full p-2 border rounded"
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
               >
                   <option value="">{t('allBranches', settings.language)}</option>
                   {branches.map(b => <option key={b} value={b}>{b}</option>)}
               </select>
           </div>

           <div>
               <label className="block text-sm font-medium mb-1">{t('fromDate', settings.language)}</label>
               <input 
                type="date" 
                className="p-2 border rounded"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
               />
           </div>

           <div>
               <label className="block text-sm font-medium mb-1">{t('toDate', settings.language)}</label>
               <input 
                type="date" 
                className="p-2 border rounded"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
               />
           </div>

           <button onClick={handlePrint} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900 flex items-center gap-2">
               <Printer size={18} /> {t('print', settings.language)}
           </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto p-8 print:p-0 print:border-none print:shadow-none">
          
          {/* Header for Print */}
          <div className="hidden print:block text-center mb-8 border-b pb-4">
              <div className="flex justify-between items-center mb-4">
                 <div className="w-20">
                     {settings.companyLogo && <img src={settings.companyLogo} className="w-full" />}
                 </div>
                 <div>
                     <h1 className="text-2xl font-bold">{settings.companyName}</h1>
                     <p className="text-gray-500">{reportType === 'summary' ? t('summaryReport', settings.language) : t('accountStatement', settings.language)}</p>
                 </div>
                 <div className="w-20"></div>
              </div>
              <p>{t('date', settings.language)}: {startDate} - {endDate}</p>
          </div>

          {reportType === 'summary' && (
              <table className="w-full text-right rtl:text-right ltr:text-left border-collapse">
                  <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                          <th className="p-3">#</th>
                          <th className="p-3">{t('name', settings.language)}</th>
                          <th className="p-3">{t('branch', settings.language)}</th>
                          <th className="p-3">{t('salary', settings.language)}</th>
                          <th className="p-3 text-green-700">{t('bonus', settings.language)}</th>
                          <th className="p-3 text-red-700">{t('deduction', settings.language)}</th>
                          <th className="p-3">{t('totalLeaves', settings.language)}</th>
                      </tr>
                  </thead>
                  <tbody>
                      {summaryData.map((row, idx) => (
                          <tr key={row.id} className="border-b hover:bg-gray-50 break-inside-avoid">
                              <td className="p-3">{row.id}</td>
                              <td className="p-3 font-bold">{row.name}</td>
                              <td className="p-3">{row.branch}</td>
                              <td className="p-3">{row.salary.toLocaleString()}</td>
                              <td className="p-3 text-green-700 font-medium">+{row.totalBonus.toLocaleString()}</td>
                              <td className="p-3 text-red-700 font-medium">{row.totalDeduction.toLocaleString()}</td>
                              <td className="p-3">{row.totalLeaveDays}</td>
                          </tr>
                      ))}
                      {summaryData.length === 0 && (
                          <tr><td colSpan={7} className="p-8 text-center text-gray-500">No data found</td></tr>
                      )}
                  </tbody>
                  {summaryData.length > 0 && (
                    <tfoot className="bg-gray-200 font-bold border-t-2 border-gray-400">
                        <tr>
                            <td colSpan={3} className="p-3 text-center">{t('grandTotal', settings.language)}</td>
                            <td className="p-3">{summaryTotals.salary.toLocaleString()} {settings.currency}</td>
                            <td className="p-3 text-green-700">+{summaryTotals.bonus.toLocaleString()}</td>
                            <td className="p-3 text-red-700">{summaryTotals.deduction.toLocaleString()}</td>
                            <td className="p-3">{summaryTotals.leaves}</td>
                        </tr>
                    </tfoot>
                  )}
              </table>
          )}

          {reportType === 'statement' && (
              <div className="space-y-12 pb-8">
                  {filteredEmployees.map(emp => {
                      const data = getStatementData(emp.id);
                      if (!data || data.transactions.length === 0) return null; // Skip empty
                      
                      const totalCredit = data.transactions.filter(t => t.isCredit).reduce((sum, t) => sum + t.amount, 0);
                      const totalDebit = data.transactions.filter(t => !t.isCredit).reduce((sum, t) => sum + t.amount, 0);

                      return (
                          <div key={emp.id} className="break-before-page">
                              <div className="bg-gray-50 p-4 rounded mb-4 border print:border-black">
                                  <h3 className="text-xl font-bold mb-2">{emp.name} <span className="text-sm font-normal text-gray-500">({emp.id})</span></h3>
                                  <div className="flex gap-8 text-sm">
                                      <span><strong>{t('branch', settings.language)}:</strong> {emp.branch}</span>
                                      <span><strong>{t('salary', settings.language)}:</strong> {emp.salary.toLocaleString()} {settings.currency}</span>
                                  </div>
                              </div>
                              
                              <table className="w-full text-right rtl:text-right ltr:text-left border-collapse mb-4">
                                  <thead>
                                      <tr className="border-b border-gray-300">
                                          <th className="p-2 w-32">{t('date', settings.language)}</th>
                                          <th className="p-2 w-32">{t('type', settings.language)}</th>
                                          <th className="p-2">{t('note', settings.language)}</th>
                                          <th className="p-2 text-end">{t('amount', settings.language)}</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {data.transactions.map((tr, i) => (
                                          <tr key={i} className="border-b border-gray-100">
                                              <td className="p-2 text-gray-600 font-mono text-sm">{tr.date}</td>
                                              <td className="p-2 text-sm">
                                                  <span className={`px-2 py-0.5 rounded text-xs border ${tr.type === 'Adjustment' ? 'bg-blue-50 border-blue-200' : tr.type === 'Debt' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                                                      {tr.type}
                                                  </span>
                                              </td>
                                              <td className="p-2">{tr.desc}</td>
                                              <td className={`p-2 text-end font-mono ${tr.isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                                  {tr.isCredit ? '+' : '-'}{tr.amount.toLocaleString()}
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                                  <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-300">
                                      <tr>
                                          <td colSpan={3} className="p-3 text-center">{t('financialSummary', settings.language)}</td>
                                          <td className="p-3 text-end" dir="ltr">
                                              <span className="text-green-700">+{totalCredit.toLocaleString()}</span> / <span className="text-red-700">-{totalDebit.toLocaleString()}</span>
                                          </td>
                                      </tr>
                                  </tfoot>
                              </table>
                              <div className="border-b-2 border-dashed border-gray-300 my-8 print:block hidden"></div>
                          </div>
                      );
                  })}
                  
                  {/* Grand Totals for Accounts Statement */}
                  {filteredEmployees.length > 0 && (
                     <div className="mt-8 p-6 bg-slate-800 text-white rounded-lg print:bg-gray-200 print:text-black break-inside-avoid">
                        <h3 className="text-lg font-bold mb-4 border-b border-slate-600 print:border-black pb-2 text-center">{t('grandTotal', settings.language)} ({t('allBranches', settings.language)})</h3>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-sm opacity-75">{t('totalAdditions', settings.language)}</div>
                                <div className="text-xl font-bold text-green-400 print:text-green-800">+{statementGrandTotals.totalCredit.toLocaleString()} {settings.currency}</div>
                            </div>
                            <div>
                                <div className="text-sm opacity-75">{t('totalDeductions', settings.language)}</div>
                                <div className="text-xl font-bold text-red-400 print:text-red-800">-{statementGrandTotals.totalDebit.toLocaleString()} {settings.currency}</div>
                            </div>
                        </div>
                     </div>
                  )}

                  {filteredEmployees.length === 0 && <div className="text-center p-8 text-gray-500">No employees found matching criteria.</div>}
              </div>
          )}
      </div>
    </div>
  );
};

export default Reports;
