
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Employees from './pages/Employees';
import Adjustments from './pages/Adjustments';
import PayrollSheet from './pages/PayrollSheet';
import SalarySlips from './pages/SalarySlips';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Debts from './pages/Debts';
import Leaves from './pages/Leaves';
import Reports from './pages/Reports';
import { Employee, Adjustment, AppSettings, User, DeferredDebt, LeaveRecord } from './types';
import { t } from './utils/i18n';

const defaultAdmin: User = { 
    username: 'admin', 
    password: '102030',
    fullName: 'المدير العام', 
    role: 'admin',
    permissions: { canEdit: true, canDelete: true, canPrint: true, canViewPayroll: true } 
};

const App: React.FC = () => {
  // --- Global State ---
  const [user, setUser] = useState<User | null>(null);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      language: 'ar',
      currency: 'SAR',
      companyName: 'My Company',
      companyLogo: '',
    };
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('users');
    return saved ? JSON.parse(saved) : [defaultAdmin];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('employees');
    return saved ? JSON.parse(saved) : [];
  });

  const [adjustments, setAdjustments] = useState<Adjustment[]>(() => {
    const saved = localStorage.getItem('adjustments');
    return saved ? JSON.parse(saved) : [];
  });

  const [debts, setDebts] = useState<DeferredDebt[]>(() => {
    const saved = localStorage.getItem('debts');
    return saved ? JSON.parse(saved) : [];
  });

  const [leaves, setLeaves] = useState<LeaveRecord[]>(() => {
    const saved = localStorage.getItem('leaves');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Persistence ---
  useEffect(() => localStorage.setItem('appSettings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('employees', JSON.stringify(employees)), [employees]);
  useEffect(() => localStorage.setItem('adjustments', JSON.stringify(adjustments)), [adjustments]);
  useEffect(() => localStorage.setItem('debts', JSON.stringify(debts)), [debts]);
  useEffect(() => localStorage.setItem('leaves', JSON.stringify(leaves)), [leaves]);

  // --- HTML Direction ---
  useEffect(() => {
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  // --- Logic Handlers ---
  const handleAddAdjustment = (adj: Adjustment) => {
    // Add adjustment
    setAdjustments(prev => [adj, ...prev]);

    // If linked to a debt, decrease debt remaining amount
    if (adj.linkedDebtId) {
      setDebts(prev => prev.map(d => {
        if (d.id === adj.linkedDebtId) {
          const newRemaining = Math.max(0, d.remainingAmount - adj.amount);
          return { ...d, remainingAmount: newRemaining, isPaid: newRemaining === 0 };
        }
        return d;
      }));
    }
  };

  const handleDeleteAdjustment = (id: string) => {
    const adj = adjustments.find(a => a.id === id);
    if (!adj) return;

    if (window.confirm('Delete this adjustment? If it is linked to a debt, the amount will be refunded to the debt balance.')) {
        setAdjustments(prev => prev.filter(a => a.id !== id));

        // If it was linked to a debt, restore the amount
        if (adj.linkedDebtId) {
             setDebts(prev => prev.map(d => {
                if (d.id === adj.linkedDebtId) {
                    const newRemaining = d.remainingAmount + adj.amount;
                    return { ...d, remainingAmount: newRemaining, isPaid: false }; // Re-open debt if needed
                }
                return d;
             }));
        }
    }
  };

  if (!user) {
    return <Login users={users} onLogin={setUser} settings={settings} />;
  }

  return (
    <HashRouter>
      <div className="flex h-screen bg-gray-100 font-sans text-slate-800">
        <Sidebar settings={settings} onLogout={() => setUser(null)} currentUser={user} />
        <main className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<Employees employees={employees} setEmployees={setEmployees} settings={settings} user={user} />} />
            <Route path="/debts" element={<Debts employees={employees} debts={debts} setDebts={setDebts} settings={settings} user={user} />} />
            <Route path="/leaves" element={<Leaves employees={employees} leaves={leaves} setLeaves={setLeaves} settings={settings} user={user} />} />
            <Route path="/adjustments" element={
                <Adjustments 
                    employees={employees} 
                    adjustments={adjustments} 
                    onAddAdjustment={handleAddAdjustment} 
                    onDeleteAdjustment={handleDeleteAdjustment}
                    debts={debts}
                    settings={settings}
                    user={user}
                />
            } />
            <Route path="/payroll" element={<PayrollSheet employees={employees} adjustments={adjustments} settings={settings} user={user} />} />
            <Route path="/slips" element={<SalarySlips employees={employees} adjustments={adjustments} settings={settings} />} />
            <Route path="/reports" element={
                <Reports 
                  employees={employees} 
                  adjustments={adjustments} 
                  debts={debts} 
                  leaves={leaves} 
                  settings={settings} 
                  user={user} 
                />
            } />
            {/* Only admin can access settings */}
            {user.role === 'admin' ? (
                <Route path="/settings" element={
                    <Settings 
                        settings={settings} 
                        setSettings={setSettings} 
                        users={users} 
                        setUsers={setUsers}
                        currentUser={user}
                        setCurrentUser={setUser}
                    />
                } />
            ) : (
                <Route path="/settings" element={<Navigate to="/" />} />
            )}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          
          {/* Global Print Footer */}
          <div className="hidden print:block fixed bottom-0 left-0 w-full text-center p-2 text-xs text-gray-400 bg-white">
              {t('printedBy', settings.language)}: {user.fullName || user.username}
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
