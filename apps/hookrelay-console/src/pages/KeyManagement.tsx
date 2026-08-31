import React, { useState } from 'react';
import { useApiKeys, useCreateApiKey } from '@frontend/api-client';
import { Key, Plus, Copy, Check, AlertCircle } from 'lucide-react';

export const KeyManagement: React.FC = () => {
  const { data: keys, isLoading } = useApiKeys();
  const createKeyMutation = useCreateApiKey();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      const res = await createKeyMutation.mutateAsync({ name: keyName });
      setCreatedKey(res);
      setKeyName('');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to generate API key.');
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseSuccessModal = () => {
    setCreatedKey(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Developer API Keys</h1>
          <p className="text-sm text-slate-455 mt-1 font-mono">Create and manage secret tokens to authenticate events publication.</p>
        </div>
        <button
          onClick={() => {
            setCreatedKey(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-semibold rounded-lg text-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Generate API Key</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-slate-900 border border-slate-800 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : !keys || keys.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col items-center">
          <Key className="w-12 h-12 text-slate-750 text-slate-700 mb-3" />
          <p className="font-mono text-xs text-slate-400">No API keys generated</p>
          <p className="text-[10px] text-slate-500 mt-1">Generate a key to authenticate dispatches from your backend app.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-500 border-b border-slate-800 text-slate-550">
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Prefix / Identifier</th>
                <th className="px-5 py-3.5">Created Date</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-800/30">
                  <td className="px-5 py-4 font-semibold text-slate-200">{k.name}</td>
                  <td className="px-5 py-4 text-indigo-300 select-all font-bold">{k.keyPrefix || 'wh_prefix_xxxx'}</td>
                  <td className="px-5 py-4 text-slate-400">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded text-[10px] font-semibold">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-955/80 backdrop-blur-sm flex items-center justify-center p-4 bg-slate-950/80">
          <div className="bg-slate-900 rounded-xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            
            {!createdKey ? (
              <>
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                  <h3 className="font-semibold text-white font-mono text-sm">Generate Auth Token</h3>
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Key Description</label>
                    <input
                      type="text"
                      required
                      placeholder="My Production API Key"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
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
                      disabled={createKeyMutation.isPending}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
                    >
                      {createKeyMutation.isPending ? 'Generating...' : 'Create Key'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Success display modal (once only) */
              <div className="p-6 space-y-6 font-mono text-xs">
                <div className="space-y-2 text-center">
                  <h3 className="text-sm font-semibold text-white">API Key Generated Successfully</h3>
                  <p className="text-[10px] text-rose-400 font-bold leading-normal">
                    ⚠️ Copy this key now! For security reasons, it cannot be revealed again after you close this modal.
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 flex items-center justify-between gap-4 font-mono text-xs text-slate-350">
                  <span className="select-all break-all text-indigo-300 font-bold block">{createdKey.rawKey}</span>
                  <button
                    onClick={() => handleCopyKey(createdKey.rawKey)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-slate-400 hover:text-white shrink-0"
                    title="Copy Key"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleCloseSuccessModal}
                    className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 bg-indigo-600 text-white font-semibold rounded-lg"
                  >
                    I have saved it
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
