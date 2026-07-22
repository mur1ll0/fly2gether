import React, { useState } from 'react';
import { Plane, Bell, LogIn, LogOut, User, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenAlertsDrawer, alertsCount = 0 }) {
  const { user, googleClientId, loginWithGoogle, loginDemo, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-3.5">
        {/* Logo */}
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="p-2 bg-gradient-to-tr from-brand-600 to-purple-600 rounded-xl shadow-glow">
            <Plane className="w-6 h-6 text-white transform -rotate-12" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight font-sans text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-brand-400">
              Fly2Gether
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full">
              BETA
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Botão Meus Alertas */}
          <button
            onClick={onOpenAlertsDrawer}
            className="relative px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all hover:border-brand-500/50"
          >
            <Bell className="w-4 h-4 text-brand-400" />
            <span className="hidden xs:inline">Meus Alertas</span>
            {alertsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand-500 text-white text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950 shadow">
                {alertsCount}
              </span>
            )}
          </button>

          {/* User Profile / Google Login */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 transition-all"
              >
                <img
                  src={user.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-brand-500/40"
                />
                <span className="text-xs sm:text-sm font-medium text-slate-200 truncate max-w-[120px]">
                  {user.name.split(' ')[0]}
                </span>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-fadeIn">
                  <div className="p-3 border-b border-slate-800">
                    <p className="text-xs font-bold text-slate-100 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full mt-1 px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center space-x-2 transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair da conta</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              {googleClientId ? (
                <GoogleLogin
                  onSuccess={loginWithGoogle}
                  onError={() => console.log('Login Google falhou')}
                  useOneTap
                  theme="filled_black"
                  shape="pill"
                  size="medium"
                  text="signin_with"
                />
              ) : (
                <button
                  onClick={loginDemo}
                  className="px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-glow transition-all flex items-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Entrar com Google (Demo)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
