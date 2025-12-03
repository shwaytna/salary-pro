
import React, { useState, useMemo } from 'react';
import { Employee, Adjustment, AdjustmentType, AppSettings } from '../types';
import { Printer } from 'lucide-react';
import { t } from '../utils/i18n';
import { numberToWords } from '../utils/n2words';

interface Props {
  employees: Employee[];
  adjustments: Adjustment[];
  settings: AppSettings;
}

const SalarySlips: React.FC<Props> = ({ employees, adjustments, settings }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const branches = useMemo(() => Array.from(new Set(employees.map(e => e.branch))), [employees]);

  // First filter by branch
  const branchEmployees = useMemo(() => {
    if (!selectedBranch) return [];
    return employees.filter(e => e.branch === selectedBranch);
  }, [employees, selectedBranch]);

  // Then filter by selected employee if chosen
  const finalDisplayedEmployees = useMemo(() => {
      if (!selectedEmployeeId) return branchEmployees;
      return branchEmployees.filter(e => e.id === selectedEmployeeId);
  }, [branchEmployees, selectedEmployeeId]);

  const getSalaryData = (emp: Employee) => {
     const empAdjustments = adjustments.filter(adj => 
        adj.employeeId === emp.id && adj.date.startsWith(selectedMonth)
      );
      
      const basic = emp.salary;
      const bonus = empAdjustments.filter(a => a.type === AdjustmentType.BONUS).reduce((sum, a) => sum + a.amount, 0);
      const deductions = empAdjustments.filter(a => a.type !== AdjustmentType.BONUS).reduce((sum, a) => sum + a.amount, 0);
      const net = basic + bonus - deductions;

      return { basic, bonus, deductions, net, adjustments: empAdjustments };
  };

  return (
    <div className="p-6 h-full flex flex-col">
       <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 no-print">
          <h2 className="text-xl font-bold mb-4">{t('slips', settings.language)}</h2>
          <div className="flex flex-wrap gap-4 items-end">
             <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-1">{t('branch', settings.language)}</label>
                <select 
                    className="w-full p-2 border rounded"
                    value={selectedBranch}
                    onChange={e => {
                        setSelectedBranch(e.target.value);
                        setSelectedEmployeeId(''); // Reset employee when branch changes
                    }}
                >
                    <option value="">{t('selectBranch', settings.language)}</option>
                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
             </div>
             
             <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-1">{t('selectEmployee', settings.language)}</label>
                <select 
                    className="w-full p-2 border rounded disabled:bg-gray-100"
                    value={selectedEmployeeId}
                    onChange={e => setSelectedEmployeeId(e.target.value)}
                    disabled={!selectedBranch}
                >
                    <option value="">{t('allEmployees', settings.language)}</option>
                    {branchEmployees.map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                    ))}
                </select>
             </div>

             <div className="flex-1 min-w-[200px]">
                 <label className="block text-sm font-medium mb-1">{t('date', settings.language)}</label>
                 <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="w-full p-2 border rounded"
                 />
             </div>
             
             <button 
                onClick={() => window.print()} 
                disabled={!selectedBranch}
                className="px-6 py-2 bg-slate-800 text-white rounded hover:bg-slate-900 disabled:opacity-50 flex items-center gap-2"
             >
                <Printer size={18} /> {t('print', settings.language)}
             </button>
          </div>
       </div>

       <div className="flex-1 overflow-auto bg-gray-50 border rounded-lg p-4 print:p-0 print:bg-white print:border-none print:overflow-visible">
          {(!selectedBranch) ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                  {t('selectBranch', settings.language)}
              </div>
          ) : (
              <div className="grid grid-cols-1 gap-12 print:block">
                  {finalDisplayedEmployees.map((emp) => {
                      const data = getSalaryData(emp);
                      const amountInWords = numberToWords(data.net, settings.language, settings.currency);
                      
                      // Month name in words - Force Gregorian using ar-EG
                      const monthDate = new Date(selectedMonth + '-01');
                      const monthName = monthDate.toLocaleDateString(settings.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
                      
                      // Current Date - Force Gregorian using ar-EG
                      const currentDate = new Date().toLocaleDateString(settings.language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

                      return (
                        <div key={emp.id} className="bg-white p-8 border-2 border-black max-w-4xl mx-auto w-full print:border-2 print:border-black print:mb-8 print:break-inside-avoid relative break-after-page last:break-after-auto">
                            
                            {/* Header Section */}
                            <div className="flex justify-between items-start pb-4 border-b-2 border-black">
                                {/* Right Side (in RTL): Company Name */}
                                <div className="text-right rtl:text-right ltr:text-left pt-2">
                                    <h1 className="text-2xl font-bold text-black">{settings.companyName}</h1>
                                </div>
                                 {/* Left Side (in RTL): Logo */}
                                <div className="w-24 h-24 flex items-center justify-center">
                                     {settings.companyLogo && <img src={settings.companyLogo} alt="Logo" className="max-w-full max-h-full object-contain" />}
                                </div>
                            </div>

                            {/* Info Row: ID and Date and Numeric Amount */}
                            <div className="flex justify-between items-start mt-4 mb-4">
                                {/* Left Side: Date */}
                                <div className="text-left rtl:text-left ltr:text-right">
                                     <div className="font-bold">{t('date', settings.language)}: {currentDate}</div>
                                </div>

                                {/* Right Side: ID and Amount */}
                                <div className="text-right rtl:text-right ltr:text-left flex flex-col items-end rtl:items-start">
                                    <div className="text-blue-700 font-bold text-xl mb-1">
                                        {t('employeeId', settings.language)}: {emp.id}
                                    </div>
                                    <div className="border-2 border-black px-4 py-1 text-xl font-bold min-w-[150px] text-center bg-gray-50">
                                        {data.net.toLocaleString()} {settings.currency}
                                    </div>
                                </div>
                            </div>

                            {/* Title Center */}
                            <div className="text-center my-8">
                                <h2 className="text-3xl font-bold underline decoration-2 underline-offset-4">{t('paymentVoucher', settings.language)}</h2>
                                <div className="text-sm mt-2 font-mono text-gray-600">
                                    {t('serialNo', settings.language)}: {selectedMonth.replace('-','')}-{emp.id}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="space-y-6 text-xl leading-relaxed mt-8 px-4">
                                <div className="flex items-baseline">
                                    <span className="font-bold w-32 shrink-0">{t('payToMr', settings.language)}/</span>
                                    <span className="border-b-2 border-dotted border-gray-400 flex-1 px-2 font-medium">{emp.name}</span>
                                </div>

                                <div className="flex items-baseline">
                                    <span className="font-bold w-32 shrink-0">{t('sumOf', settings.language)}/</span>
                                    <span className="border-b-2 border-dotted border-gray-400 flex-1 px-2 font-medium">{amountInWords}</span>
                                </div>

                                <div className="flex items-baseline">
                                    <span className="font-bold w-32 shrink-0">{t('being', settings.language)}/</span>
                                    <span className="border-b-2 border-dotted border-gray-400 flex-1 px-2 font-medium">
                                        {t('salaryForMonth', settings.language)} {monthName}
                                    </span>
                                </div>
                            </div>

                            {/* Footer Signatures */}
                            <div className="grid grid-cols-2 gap-20 mt-24 mb-8">
                                <div className="text-center">
                                    <p className="font-bold mb-12">{t('managerSig', settings.language)}</p>
                                    <div className="border-t-2 border-black w-3/4 mx-auto"></div>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold mb-12">{t('employeeSig', settings.language)}</p>
                                    <div className="border-t-2 border-black w-3/4 mx-auto"></div>
                                </div>
                            </div>
                        </div>
                      );
                  })}
                  {finalDisplayedEmployees.length === 0 && (
                      <div className="text-center text-gray-500 py-10">No employees found in this branch.</div>
                  )}
              </div>
          )}
       </div>
    </div>
  );
};

export default SalarySlips;
