import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEcomLogin } from '@frontend/api-client';
import { AlertCircle, Lock, Mail, ArrowRight, Store } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loginMutation = useEcomLogin(true); // Retailer login

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await loginMutation.mutateAsync({ email, password });
      localStorage.setItem('seller_email', res.email);
      localStorage.setItem('seller_name', res.name);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid merchant credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-white">Merchant Portal</h2>
        <p className="text-xs text-slate-400 font-sans">
          Log in to manage your inventory, analyze sales, and ship items.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {errorMsg && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="text-sm">{errorMsg}</span>
          </div>
        )}

        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700/60 shadow-xl space-y-4">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Business Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Mail className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Secret Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-semibold h-10 px-6 rounded-full shadow-md transition-colors mt-2"
            >
              <span>{loginMutation.isPending ? 'Connecting...' : 'Access Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-450 mt-6 font-sans">
          <span>Need a merchant store? </span>
          <Link to="/register" className="font-semibold text-emerald-400 hover:underline">
            Register here
          </Link>
        </div>
      </div>

    </div>
  );
};
