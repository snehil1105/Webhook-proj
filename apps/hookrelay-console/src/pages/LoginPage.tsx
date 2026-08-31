import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHookRelayLogin } from '@frontend/api-client';
import { AlertCircle, Lock, Mail, ArrowRight, Radio } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@auraretail.com');
  const [password, setPassword] = useState('AuraDevConsole2026!');
  const [errorMsg, setErrorMsg] = useState('');

  const loginMutation = useHookRelayLogin();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await loginMutation.mutateAsync({ email, password });
      localStorage.setItem('hookrelay_email', res.email);
      localStorage.setItem('hookrelay_name', res.name);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-mono">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
          <Radio className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-white">HookRelay Console</h2>
        <p className="text-xs text-slate-500">
          Sign in to register webhook destinations and trace delivery streams.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {errorMsg && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="bg-slate-905 bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl space-y-4">
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Developer Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Mail className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-600" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Auth Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-600" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-indigo-650 hover:bg-indigo-600 bg-indigo-600 text-white font-semibold h-10 px-6 rounded-lg transition-colors mt-2"
            >
              <span>{loginMutation.isPending ? 'Authenticating...' : 'Sign In Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Recruiter Demo Account Banner */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center space-y-2 mt-4 text-[11px]">
            <p className="font-semibold text-indigo-400">Are you a Recruiter / Guest?</p>
            <p className="text-slate-500">Click below to autofill demo developer credentials:</p>
            <div className="font-mono bg-slate-950 border border-slate-800 py-1.5 px-3 rounded-lg inline-block text-slate-400">
              <div>Email: <span className="font-bold text-indigo-300">admin@auraretail.com</span></div>
              <div>Password: <span className="font-bold text-indigo-300">AuraDevConsole2026!</span></div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@auraretail.com');
                setPassword('AuraDevConsole2026!');
              }}
              className="block w-full font-semibold bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-3 rounded-lg transition-colors mt-1"
            >
              Autofill Credentials
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 mt-6">
          <span>Only accessible via authorized Developer Credentials.</span>
        </div>
      </div>

    </div>
  );
};
