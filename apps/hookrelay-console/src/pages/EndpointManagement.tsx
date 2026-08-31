import React, { useState } from 'react';
import { useEndpoints, useCreateEndpoint, useDeactivateEndpoint } from '@frontend/api-client';
import { Radio, Plus, Eye, EyeOff, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

export const EndpointManagement: React.FC = () => {
  const { data: endpoints, isLoading } = useEndpoints();
  const createEndpointMutation = useCreateEndpoint();
  const deleteEndpointMutation = useDeactivateEndpoint();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<{ [key: string]: boolean }>({});
  
  // Form State
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [eventTypesInput, setEventTypesInput] = useState('order.shipped, payment.failed');
  const [formError, setFormError] = useState('');

  const toggleSecret = (id: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      const eventTypes = eventTypesInput.split(',').map((s) => s.trim()).filter(Boolean);
      await createEndpointMutation.mutateAsync({
        name,
        url,
        eventTypes,
      });

      // Clear state and close modal
      setName('');
      setUrl('');
      setEventTypesInput('order.shipped, payment.failed');
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to register webhook endpoint.');
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this webhook destination?')) return;
    try {
      await deleteEndpointMutation.mutateAsync(id);
    } catch (err) {
      alert('Deactivation failed.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Webhook Endpoints</h1>
          <p className="text-sm text-slate-450 mt-1 font-mono">Register target URLs to receive HookRelay event dispatches.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-600 bg-indigo-600 text-white font-mono font-semibold rounded-lg text-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register Endpoint</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-slate-900 border border-slate-800 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : !endpoints || endpoints.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col items-center">
          <Radio className="w-12 h-12 text-slate-700 mb-3" />
          <p className="font-mono text-sm text-slate-400">No webhook endpoints registered</p>
          <p className="text-xs text-slate-500 mt-1">Register a target URL to start dispatching events.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {endpoints.map((endpoint) => (
            <div key={endpoint.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4 relative group">
              
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-white text-base">{endpoint.name}</h3>
                  <p className="text-xs font-mono text-indigo-300 select-all truncate max-w-lg">{endpoint.url}</p>
                </div>
                
                {/* Actions: delete/deactivate */}
                <button
                  onClick={() => handleDeleteClick(endpoint.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-450 hover:text-rose-400 rounded transition-colors"
                  title="Deactivate Endpoint"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Subscribed events */}
              <div className="flex flex-wrap gap-1.5">
                {endpoint.eventTypes.map((type) => (
                  <span key={type} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono text-[10px] border border-slate-700">
                    {type}
                  </span>
                ))}
              </div>

              {/* Signing secret rotation */}
              <div className="border-t border-slate-800/80 pt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-slate-450 font-mono">Signing Secret:</span>
                  <span className="font-mono text-xs font-bold text-slate-300">
                    {revealedSecrets[endpoint.id] ? endpoint.signingSecret : '••••••••••••••••••••••••'}
                  </span>
                  <button
                    onClick={() => toggleSecret(endpoint.id)}
                    className="p-1 text-slate-500 hover:text-slate-350"
                  >
                    {revealedSecrets[endpoint.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                  endpoint.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' : 'bg-slate-800 text-slate-500'
                }`}>
                  {endpoint.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="font-semibold text-white font-mono text-sm">Register Destination URL</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-400 text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 font-mono text-xs">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-350 p-3 rounded-lg flex items-start gap-2 text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Friendly Name</label>
                <input
                  type="text"
                  required
                  placeholder="Production Webhook Receiver"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Destination Target URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://webhook.site/your-unique-uuid"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subscribed Events (comma-separated)</label>
                <input
                  type="text"
                  required
                  placeholder="order.shipped, order.cancelled, payment.failed"
                  value={eventTypesInput}
                  onChange={(e) => setEventTypesInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 rounded-lg font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEndpointMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
                >
                  {createEndpointMutation.isPending ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
