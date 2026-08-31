import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEcomRegister } from '@frontend/api-client';
import { AlertCircle, Lock, Mail, User, ArrowRight, Store } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const registerMutation = useEcomRegister(true); // Retailer register

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await registerMutation.mutateAsync({ name, email, password });
      localStorage.setItem('seller_token', res.token);
      localStorage.setItem('seller_email', res.email);
      localStorage.setItem('seller_name', res.name);
      navigate('/onboarding');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.response?.data?.message || 'Merchant registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-white">Merchant Registration</h2>
        <p className="text-xs text-slate-400 font-sans">
          Register a new merchant account to begin selling.
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
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Company Owner Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <User className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Business Email Address</label>
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
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Portal Password</label>
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
              <p className="text-[10px] text-slate-400 mt-1">Password must be at least 6 characters long.</p>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-semibold h-10 px-6 rounded-full shadow-md transition-colors mt-2"
            >
              <span>{registerMutation.isPending ? 'Registering...' : 'Register Store'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-450 mt-6 font-sans">
          <span>Already registered? </span>
          <Link to="/login" className="font-semibold text-emerald-400 hover:underline">
            Log In here
          </Link>
        </div>
      </div>

    </div>
  );
};
