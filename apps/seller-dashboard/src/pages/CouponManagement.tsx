import React, { useState } from 'react';
import { useSellerCoupons, useCreateCoupon, useDeleteCoupon } from '@frontend/api-client';
import { Tag, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export const CouponManagement: React.FC = () => {
  const { data: coupons, isLoading } = useSellerCoupons();
  const createCouponMutation = useCreateCoupon();
  const deleteCouponMutation = useDeleteCoupon();

  // Create Form State
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number | ''>('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!code.trim()) {
      setErrorMsg('Coupon code is required.');
      return;
    }

    const pct = Number(discountPercent);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      setErrorMsg('Discount percentage must be between 1 and 100.');
      return;
    }

    createCouponMutation.mutate(
      {
        code: code.trim().toUpperCase(),
        discountPercent: pct
      },
      {
        onSuccess: () => {
          setSuccessMsg(`Coupon "${code.toUpperCase()}" created successfully!`);
          setCode('');
          setDiscountPercent('');
        },
        onError: (err: any) => {
          setErrorMsg(err.response?.data?.message || 'Failed to create coupon. Make sure code is unique.');
        }
      }
    );
  };

  const handleDeleteCoupon = (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    setSuccessMsg('');
    setErrorMsg('');

    deleteCouponMutation.mutate(id, {
      onSuccess: () => {
        setSuccessMsg('Coupon deleted successfully.');
      },
      onError: (err: any) => {
        setErrorMsg(err.response?.data?.message || 'Failed to delete coupon.');
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Coupons & Promotions</h1>
          <p className="text-sm text-slate-500 mt-1">Manage promotional discount codes for your customers.</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Create Coupon Form */}
        <div className="lg:col-span-1 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5 h-fit">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-5 h-5 text-emerald-600" />
            <span>Create Coupon</span>
          </h3>

          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Coupon Code</label>
              <input
                type="text"
                placeholder="e.g. SAVE15"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Discount Percentage (%)</label>
              <input
                type="number"
                placeholder="e.g. 15"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value === '' ? '' : Number(e.target.value))}
                min="1"
                max="100"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={createCouponMutation.isPending}
              className="w-full inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-semibold h-11 px-6 rounded-full shadow-md transition-colors text-sm pt-0.5"
            >
              {createCouponMutation.isPending ? 'Creating...' : 'Create Coupon'}
            </button>
          </form>
        </div>

        {/* Right Columns: Coupons List Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              <span>Active Promotion Codes</span>
            </h3>
          </div>

          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !coupons || coupons.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Tag className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active coupons listed. Create one on the left!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase">
                    <th className="py-3 px-6">Coupon Code</th>
                    <th className="py-3 px-6">Discount Percent</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-900 select-all">{coupon.code}</td>
                      <td className="py-3.5 px-6 font-semibold">{coupon.discountPercent}% OFF</td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id || '')}
                          disabled={deleteCouponMutation.isPending}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Delete coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
