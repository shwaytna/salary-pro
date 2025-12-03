
import React, { useRef, useState, useEffect } from 'react';
import { AppSettings, User, UserPermissions } from '../types';
import { t } from '../utils/i18n';
import { Save, UserPlus, Trash2 } from 'lucide-react';

interface Props {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  setCurrentUser: (user: User) => void;
}

const defaultPermissions: UserPermissions = {
    canEdit: false,
    canDelete: false,
    canPrint: true,
    canViewPayroll: false,
};

const Settings: React.FC<Props> = ({ settings, setSettings, users, setUsers, currentUser, setCurrentUser }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [newUserPerms, setNewUserPerms] = useState<UserPermissions>(defaultPermissions);

  // Admin Profile State
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Load current admin data when component mounts or user changes
  useEffect(() => {
      const admin = users.find(u => u.username === 'admin');
      if (admin) {
          setAdminName(admin.fullName || '');
          setAdminPassword(admin.password);
      }
  }, [users]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSettings({ ...settings, companyLogo: ev.target?.result as string });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleUpdateAdminProfile = (e: React.FormEvent) => {
      e.preventDefault();
      const updatedUsers = users.map(u => {
          if (u.username === 'admin') {
              return { ...u, fullName: adminName, password: adminPassword };
          }
          return u;
      });
      setUsers(updatedUsers);
      
      // If current logged in user is admin, update the session
      if (currentUser.username === 'admin') {
          const updatedAdmin = updatedUsers.find(u => u.username === 'admin');
          if (updatedAdmin) setCurrentUser(updatedAdmin);
      }
      alert(t('save', settings.language));
  };

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    
    if (users.some(u => u.username === username)) {
      alert('User exists');
      return;
    }
    setUsers([...users, { 
        username, 
        password, 
        fullName,
        role: 'user', 
        permissions: newUserPerms 
    }]);
    e.currentTarget.reset();
    setNewUserPerms(defaultPermissions);
  };

  const handleDeleteUser = (username: string) => {
      if (username === 'admin') {
          alert("Cannot delete admin");
          return;
      }
      setUsers(users.filter(u => u.username !== username));
  };

  const toggleUserPermission = (username: string, key: keyof UserPermissions) => {
      setUsers(users.map(u => {
          if (u.username === username && u.role !== 'admin') {
              return { ...u, permissions: { ...u.permissions, [key]: !u.permissions[key] } };
          }
          return u;
      }));
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <h2 className="text-2xl font-bold text-gray-800">{t('settings', settings.language)}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold mb-4 text-primary border-b pb-2">Application Config</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('companyName', settings.language)}</label>
              <input 
                type="text" 
                value={settings.companyName}
                onChange={e => setSettings({...settings, companyName: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">{t('language', settings.language)}</label>
                    <select 
                        value={settings.language}
                        onChange={e => setSettings({...settings, language: e.target.value as 'ar' | 'en'})}
                        className="w-full p-2 border rounded"
                    >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">{t('currency', settings.language)}</label>
                    <input 
                        type="text" 
                        value={settings.currency}
                        onChange={e => setSettings({...settings, currency: e.target.value})}
                        className="w-full p-2 border rounded"
                    />
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('companyLogo', settings.language)}</label>
              <div className="flex items-center gap-4">
                  {settings.companyLogo && <img src={settings.companyLogo} className="h-12 w-12 object-contain border" />}
                  <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold mb-4 text-primary border-b pb-2">{t('adminProfile', settings.language)}</h3>
          
          <form onSubmit={handleUpdateAdminProfile} className="space-y-4 mb-6">
              <div>
                  <label className="block text-sm font-medium mb-1">{t('fullName', settings.language)}</label>
                  <input 
                    type="text"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium mb-1">{t('password', settings.language)}</label>
                  <input 
                    type="text"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex justify-center items-center gap-2">
                  <Save size={18} /> {t('updateProfile', settings.language)}
              </button>
          </form>

          <h3 className="text-lg font-bold mb-4 text-primary border-b pb-2 border-t pt-4">{t('users', settings.language)}</h3>

          <form onSubmit={handleAddUser} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <input name="fullName" placeholder={t('fullName', settings.language)} required className="w-full p-2 border rounded col-span-2" />
                  <input name="username" placeholder={t('username', settings.language)} required className="w-full p-2 border rounded" />
                  <input name="password" placeholder={t('password', settings.language)} required className="w-full p-2 border rounded" />
              </div>
              
              <div className="flex gap-4 text-sm text-gray-600 flex-wrap mb-2">
                  <label className="flex items-center gap-1"><input type="checkbox" checked={newUserPerms.canEdit} onChange={e => setNewUserPerms({...newUserPerms, canEdit: e.target.checked})} /> {t('canEdit', settings.language)}</label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={newUserPerms.canDelete} onChange={e => setNewUserPerms({...newUserPerms, canDelete: e.target.checked})} /> {t('canDelete', settings.language)}</label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={newUserPerms.canPrint} onChange={e => setNewUserPerms({...newUserPerms, canPrint: e.target.checked})} /> {t('canPrint', settings.language)}</label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={newUserPerms.canViewPayroll} onChange={e => setNewUserPerms({...newUserPerms, canViewPayroll: e.target.checked})} /> {t('canViewPayroll', settings.language)}</label>
              </div>

              <button type="submit" className="w-full p-2 bg-green-600 text-white rounded flex justify-center items-center gap-2">
                  <UserPlus size={18}/> {t('add', settings.language)}
              </button>
          </form>

          <ul className="space-y-4 max-h-60 overflow-y-auto">
              {users.filter(u => u.username !== 'admin').map(u => (
                  <li key={u.username} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                            <div className="font-bold">{u.fullName}</div>
                            <div className="text-xs text-gray-500">@{u.username} ({u.role})</div>
                        </div>
                        <button onClick={() => handleDeleteUser(u.username)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={u.permissions.canEdit} onChange={() => toggleUserPermission(u.username, 'canEdit')} /> 
                              {t('canEdit', settings.language)}
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={u.permissions.canDelete} onChange={() => toggleUserPermission(u.username, 'canDelete')} /> 
                              {t('canDelete', settings.language)}
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={u.permissions.canPrint} onChange={() => toggleUserPermission(u.username, 'canPrint')} /> 
                              {t('canPrint', settings.language)}
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={u.permissions.canViewPayroll} onChange={() => toggleUserPermission(u.username, 'canViewPayroll')} /> 
                              {t('canViewPayroll', settings.language)}
                          </label>
                      </div>
                  </li>
              ))}
              {users.filter(u => u.username !== 'admin').length === 0 && (
                  <li className="text-center text-gray-400 text-sm">No other users</li>
              )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
