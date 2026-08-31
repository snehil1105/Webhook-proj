import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEcomLogin } from '@frontend/api-client';
import { AlertCircle, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loginMutation = useEcomLogin(false); // Customer login

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await loginMutation.mutateAsync({ email, password });
      localStorage.setItem('storefront_email', res.email);
      localStorage.setItem('storefront_name', res.name);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      
      {/* Decorative text */}
      <div className="text-center space-y-2">
        <h2 className="font-display text-3xl font-bold text-amber-950">Welcome Back</h2>
        <p className="text-xs text-gray-500 font-sans">
          Login to access your personalized shopping history.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm">{errorMsg}</span>
        </div>
      )}

      {/* Card Form */}
      <div className="bg-white p-8 rounded-3xl border border-orange-100/20 shadow-sm">
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-amber-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-900"
              />
              <Mail className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-amber-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-900"
              />
              <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-1 bg-amber-900 hover:bg-amber-800 disabled:bg-gray-200 text-white font-semibold h-10 px-6 rounded-full shadow-md transition-colors mt-2"
          >
            <span>{loginMutation.isPending ? 'Logging In...' : 'Log In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Recruiter Demo Account Banner */}
      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-center space-y-2">
        <p className="text-xs font-semibold text-amber-900">Are you a Recruiter / Guest?</p>
        <p className="text-xs text-amber-800/80">Click below to autofill demo credentials:</p>
        <div className="text-xs font-mono bg-white border border-amber-100/50 py-1.5 px-3 rounded-lg inline-block text-amber-900">
          <div>Email: <span className="font-bold">recruiter.customer@example.com</span></div>
          <div>Password: <span className="font-bold">password123</span></div>
        </div>
        <button
          type="button"
          onClick={() => {
            setEmail('recruiter.customer@example.com');
            setPassword('password123');
          }}
          className="block w-full text-xs font-semibold bg-amber-900 hover:bg-amber-800 text-white py-2 px-3 rounded-lg transition-colors mt-1"
        >
          Autofill Credentials
        </button>
      </div>

      <div className="text-center text-xs text-gray-500 font-sans">
        <span>Don't have an account? </span>
        <Link to="/register" className="font-semibold text-amber-900 hover:underline">
          Register here
        </Link>
      </div>

    </div>
  );
};
