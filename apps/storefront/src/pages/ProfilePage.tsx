import React, { useState } from 'react';
import { useProfile, useUpdateProfile, useAddresses, useSaveAddress, useDeleteAddress } from '@frontend/api-client';
import { User, Mail, Lock, MapPin, Trash2, Check, Plus } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const { data: addresses, isLoading: loadingAddresses } = useAddresses();
  const saveAddressMutation = useSaveAddress();
  const deleteAddressMutation = useDeleteAddress();

  // Profile Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Pre-populate profile details
  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
    }
  }, [profile]);

  // Address Form State
  const [addrName, setAddrName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('India');
  const [isDefault, setIsDefault] = useState(false);
  const [addrError, setAddrError] = useState('');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    updateProfileMutation.mutate(
      {
        name: name || undefined,
        email: email || undefined,
        password: password || undefined
      },
      {
        onSuccess: (data) => {
          setProfileSuccess('Profile updated successfully!');
          localStorage.setItem('storefront_name', data.name);
          if (data.token) {
            localStorage.setItem('storefront_token', data.token);
          }
          setPassword('');
        },
        onError: (err: any) => {
          setProfileError(err.response?.data?.message || 'Failed to update profile details.');
        }
      }
    );
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddrError('');

    saveAddressMutation.mutate(
      {
        name: addrName,
        street,
        city,
        state,
        zip,
        country,
        default: isDefault
      },
      {
        onSuccess: () => {
          setAddrName('');
          setStreet('');
          setCity('');
          setState('');
          setZip('');
          setIsDefault(false);
        },
        onError: (err: any) => {
          setAddrError(err.response?.data?.message || 'Failed to save address.');
        }
      }
    );
  };

  if (loadingProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-64 bg-gray-200 rounded-3xl" />
          <div className="h-64 bg-gray-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold text-amber-950">My Account</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal settings and shipping addresses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Edit profile form */}
        <div className="lg:col-span-1 bg-white p-6 sm:p-8 rounded-3xl border border-orange-100/20 shadow-sm space-y-6 h-fit">
          <h3 className="font-semibold text-amber-950 flex items-center gap-2 border-b border-gray-100 pb-3">
            <User className="w-5 h-5 text-amber-900" />
            <span>Profile Details</span>
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {profileSuccess && (
              <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>{profileSuccess}</span>
              </p>
            )}
            {profileError && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl font-semibold">
                {profileError}
              </p>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-amber-100 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-900"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-amber-100 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-900"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">New Password (Optional)</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Leave blank to keep same"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-amber-100 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-900"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full inline-flex items-center justify-center bg-amber-900 hover:bg-amber-800 disabled:bg-gray-200 text-white text-xs font-semibold h-10 rounded-full transition-colors shadow-sm"
            >
              {updateProfileMutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Right Columns: Addresses Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Address List Box */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-100/20 shadow-sm space-y-6">
            <h3 className="font-semibold text-amber-950 flex items-center gap-2 border-b border-gray-100 pb-3">
              <MapPin className="w-5 h-5 text-amber-900" />
              <span>Saved Shipping Addresses</span>
            </h3>

            {loadingAddresses ? (
              <div className="h-20 bg-gray-50 rounded-2xl animate-pulse" />
            ) : !addresses || addresses.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No saved shipping addresses yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="p-4 rounded-2xl border border-amber-50 bg-amber-50/10 flex flex-col justify-between hover:border-amber-100 transition-colors gap-3 relative">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950 text-sm">{addr.name}</span>
                        {addr.default && (
                          <span className="text-[9px] bg-amber-100 px-1.5 py-0.5 rounded-full text-amber-900 font-bold uppercase tracking-wider">Default</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-sans leading-relaxed">{addr.street}</p>
                      <p className="text-xs text-gray-500 font-sans">{addr.city}, {addr.state} - {addr.zip}</p>
                      <p className="text-[10px] text-gray-400 font-sans">{addr.country}</p>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => deleteAddressMutation.mutate(addr.id || '')}
                        disabled={deleteAddressMutation.isPending}
                        className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Address Form Box */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-100/20 shadow-sm space-y-4">
            <h3 className="font-semibold text-amber-950 flex items-center gap-2 border-b border-gray-100 pb-3 text-sm">
              <Plus className="w-4 h-4 text-amber-900" />
              <span>Add New Address</span>
            </h3>

            {addrError && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl font-semibold">
                {addrError}
              </p>
            )}

            <form onSubmit={handleAddAddress} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Contact Name</label>
                  <input
                    type="text"
                    required
                    value={addrName}
                    onChange={(e) => setAddrName(e.target.value)}
                    className="w-full border border-amber-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full border border-amber-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-amber-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full border border-amber-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full border border-amber-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full border border-amber-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-900"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    id="setDefault"
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded border-amber-200 text-amber-900 focus:ring-amber-900 accent-amber-900 cursor-pointer"
                  />
                  <label htmlFor="setDefault" className="text-xs text-gray-500 cursor-pointer select-none">
                    Set as default address
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={saveAddressMutation.isPending}
                className="w-full inline-flex items-center justify-center bg-amber-950 hover:bg-amber-900 disabled:bg-gray-200 text-white text-xs font-semibold h-10 rounded-full transition-colors shadow-sm pt-0.5"
              >
                {saveAddressMutation.isPending ? 'Saving...' : 'Save Address'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
