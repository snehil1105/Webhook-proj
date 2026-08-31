import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHookRelayRegister } from '@frontend/api-client';
import { AlertCircle, Lock, Mail, User, ArrowRight, Radio } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const registerMutation = useHookRelayRegister();

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await registerMutation.mutateAsync({ name, email, password });
      navigate('/login');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.response?.data?.message || 'Developer registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-mono">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
          <Radio className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-white">Console Registration</h2>
        <p className="text-xs text-slate-500">
          Register a new developer profile to begin managing webhooks.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {errorMsg && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-350 p-4 rounded-xl flex items-start gap-3 text-xs text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl space-y-4">
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Developer Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Snehil Dev"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <User className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-600" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Account Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="snehil@test.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Mail className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-600" />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Account Password</label>
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
              <p className="text-[10px] text-slate-500 mt-1">Password must be at least 8 characters long.</p>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-indigo-650 hover:bg-indigo-600 bg-indigo-600 text-white font-semibold h-10 px-6 rounded-lg transition-colors mt-2"
            >
              <span>{registerMutation.isPending ? 'Registering...' : 'Register Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-500 mt-6">
          <span>Already registered? </span>
          <Link to="/login" className="font-semibold text-indigo-400 hover:underline">
            Log In here
          </Link>
        </div>
      </div>

    </div>
  );
};
