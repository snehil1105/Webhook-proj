import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEcomRegister } from '@frontend/api-client';
import { AlertCircle, Lock, Mail, User, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const registerMutation = useEcomRegister(false); // Customer register

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await registerMutation.mutateAsync({ name, email, password });
      navigate('/login');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || 'Email already registered or registration failed. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      
      {/* Welcome message */}
      <div className="text-center space-y-2">
        <h2 className="font-display text-3xl font-bold text-amber-950">Create Account</h2>
        <p className="text-xs text-gray-500 font-sans">
          Join AuraRetail and start collecting aesthetic lifestyle goods.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm">{errorMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white p-8 rounded-3xl border border-orange-100/20 shadow-sm">
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Aesthetic Lover"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-amber-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-900"
              />
              <User className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="buyer@example.com"
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
            <p className="text-[10px] text-gray-400 mt-1">Password must be at least 6 characters long.</p>
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-1 bg-amber-900 hover:bg-amber-800 disabled:bg-gray-200 text-white font-semibold h-10 px-6 rounded-full shadow-md transition-colors mt-2"
          >
            <span>{registerMutation.isPending ? 'Registering...' : 'Register'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-gray-500 font-sans">
        <span>Already have an account? </span>
        <Link to="/login" className="font-semibold text-amber-900 hover:underline">
          Log In here
        </Link>
      </div>

    </div>
  );
};
