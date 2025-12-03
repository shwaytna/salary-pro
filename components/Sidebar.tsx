
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, FileText, Banknote, Printer, Settings, LogOut, CreditCard, Calendar, BarChart3 } from 'lucide-react';
import { AppSettings, User } from '../types';
import { t } from '../utils/i18n';

interface Props {
  settings: AppSettings;
  onLogout: () => void;
  currentUser: User | null;
}

const Sidebar: React.FC<Props> = ({ settings, onLogout, currentUser }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-slate-800";

  return (
    <div className="w-64 bg-secondary text-white h-full flex flex-col no-print shrink-0 transition-all duration-300">
      <div className="p-6 border-b border-slate-700 flex flex-col items-center justify-center gap-2">
         {settings.companyLogo && (
           <img src={settings.companyLogo} alt="Logo" className="h-16 w-auto object-contain rounded bg-white p-1" />
         )}
         <h1 className="text-xl font-bold text-center leading-tight mt-2">{settings.companyName}</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          <li>
            <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/')}`}>
              <Users size={20} />
              <span>{t('employees', settings.language)}</span>
            </Link>
          </li>
          <li>
            <Link to="/leaves" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/leaves')}`}>
              <Calendar size={20} />
              <span>{t('leaves', settings.language)}</span>
            </Link>
          </li>
          <li>
            <Link to="/debts" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/debts')}`}>
              <CreditCard size={20} />
              <span>{t('debts', settings.language)}</span>
            </Link>
          </li>
          <li>
            <Link to="/adjustments" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/adjustments')}`}>
              <Banknote size={20} />
              <span>{t('adjustments', settings.language)}</span>
            </Link>
          </li>
          {/* Payroll View Permission Check */}
          {(currentUser?.role === 'admin' || currentUser?.permissions.canViewPayroll) && (
            <li>
              <Link to="/payroll" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/payroll')}`}>
                <FileText size={20} />
                <span>{t('payroll', settings.language)}</span>
              </Link>
            </li>
          )}
          <li>
            <Link to="/reports" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/reports')}`}>
              <BarChart3 size={20} />
              <span>{t('reports', settings.language)}</span>
            </Link>
          </li>
          <li>
            <Link to="/slips" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/slips')}`}>
              <Printer size={20} />
              <span>{t('slips', settings.language)}</span>
            </Link>
          </li>
          <li className="my-4 border-t border-slate-700"></li>
          
          {/* Admin Only Settings */}
          {currentUser?.role === 'admin' && (
            <li>
              <Link to="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/settings')}`}>
                <Settings size={20} />
                <span>{t('settings', settings.language)}</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-700">
        <div className="mb-2 text-xs text-gray-500 text-center">
             {t('users', settings.language)}: {currentUser?.fullName || currentUser?.username}
        </div>
        <button onClick={onLogout} className="flex items-center gap-3 text-red-400 hover:text-red-300 w-full px-4 py-2 transition-colors">
          <LogOut size={20} />
          <span>{t('logout', settings.language)}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
