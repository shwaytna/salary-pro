
import React, { useState } from 'react';
import { User, AppSettings } from '../types';
import { t } from '../utils/i18n';

interface Props {
  users: User[];
  onLogin: (user: User) => void;
  settings: AppSettings;
}

const Login: React.FC<Props> = ({ users, onLogin, settings }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
           {settings.companyLogo && <img src={settings.companyLogo} className="h-20 mx-auto mb-4" />}
           <h1 className="text-2xl font-bold text-primary">{settings.companyName}</h1>
           <p className="text-gray-500">{t('login', settings.language)}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('username', settings.language)}</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('password', settings.language)}</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full py-2 bg-primary text-white rounded font-bold hover:bg-blue-700">
            {t('login', settings.language)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
