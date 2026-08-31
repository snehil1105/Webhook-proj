import React, { useState } from 'react';
import { useEndpoints, useEndpointDeliveries, useReplayDlq } from '@frontend/api-client';
import { TableProperties, CheckCircle2, XCircle, AlertCircle, Send } from 'lucide-react';

const getEventMeta = (eventType: string) => {
  switch (eventType) {
    case 'order.placed':
      return { label: 'Order Placed', actor: 'Customer', actorColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    case 'order.shipped':
      return { label: 'Order Shipped', actor: 'Seller', actorColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    case 'order.cancelled':
      return { label: 'Order Cancelled', actor: 'Customer', actorColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    case 'return.requested':
      return { label: 'Return Requested', actor: 'Customer', actorColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    case 'payment.success':
      return { label: 'Payment Succeeded', actor: 'Customer', actorColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    case 'payment.failed':
      return { label: 'Payment Failed', actor: 'Customer', actorColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    case 'review.submitted':
      return { label: 'Review Left', actor: 'Customer', actorColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    case 'product.price-changed':
      return { label: 'Price Updated', actor: 'Seller', actorColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    case 'inventory.low-stock':
      return { label: 'Low Stock Alert', actor: 'Seller', actorColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    case 'product.out-of-stock':
      return { label: 'Out of Stock Alert', actor: 'Seller', actorColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    default:
      return { label: eventType || 'Unknown Event', actor: 'System', actorColor: 'text-slate-400 bg-slate-500/10 border-slate-500/30' };
  }
};

export const RequestLogs: React.FC = () => {
  const { data: endpoints } = useEndpoints();
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const { data: logs, isLoading } = useEndpointDeliveries(selectedEndpointId, statusFilter, {
    enabled: !!selectedEndpointId,
  });

  const replayMutation = useReplayDlq();
  const [activeLog, setActiveLog] = useState<any | null>(null);

  // Set default endpoint once loaded
  React.useEffect(() => {
    if (endpoints && endpoints.length > 0 && !selectedEndpointId) {
      setSelectedEndpointId(endpoints[0].id);
    }
  }, [endpoints, selectedEndpointId]);

  const handleReplayClick = async (log: any) => {
    try {
      // Replay using eventId or dlq messageId
      await replayMutation.mutateAsync(log.eventId || log.id);
      alert('Event delivery re-queued successfully!');
    } catch (err) {
      alert('Failed to re-trigger delivery.');
    }
  };

  return (
    <div className="space-y-8 relative min-h-[500px]">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Delivery Logs</h1>
        <p className="text-sm text-slate-450 mt-1 font-mono">Observe and debug HTTP request payloads sent to downstream destinations.</p>
      </div>

      {/* Select Endpoint Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        <div className="flex flex-col gap-1.5 shrink-0">
          <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Select Destination</label>
          <select
            value={selectedEndpointId}
            onChange={(e) => setSelectedEndpointId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {!endpoints || endpoints.length === 0 ? (
              <option value="">No endpoints registered</option>
            ) : (
              endpoints.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Status Code</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success (2xx)</option>
            <option value="FAILED">Failures</option>
            <option value="DEAD">Dead (DLQ)</option>
          </select>
        </div>
      </div>

      {/* Main panel - List + detail side panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table of logs */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedEndpointId ? (
            <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl">
              <p className="text-xs text-slate-500 font-mono">Configure an endpoint first to inspect dispatches.</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-900 border border-slate-800 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col items-center">
              <TableProperties className="w-10 h-10 text-slate-700 mb-3" />
              <p className="font-mono text-xs text-slate-400">No deliveries registered</p>
              <p className="text-[10px] text-slate-500 mt-1">Publish an event from the backend to populate logs.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 text-slate-500 border-b border-slate-800">
                    <th className="px-5 py-3">Event Type</th>
                    <th className="px-5 py-3">HTTP Status</th>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-5 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setActiveLog(log)}
                      className={`cursor-pointer hover:bg-slate-800/30 transition-colors ${
                        activeLog?.id === log.id ? 'bg-indigo-500/10' : ''
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-200">{getEventMeta(log.eventType).label}</span>
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${getEventMeta(log.eventType).actorColor}`}>
                            {getEventMeta(log.eventType).actor}
                          </span>
                        </div>
                        <span className="text-[10px] text-indigo-300 block font-mono leading-tight">{log.eventType || 'N/A'}</span>
                        <span className="text-[9px] text-slate-500 block truncate max-w-[200px] mt-0.5">{log.eventId}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          log.httpStatus === 200 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {log.httpStatus === 200 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{log.httpStatus || '500'}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">{log.durationMs || 15}ms</td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-[10px] text-indigo-400 hover:underline">Inspect →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stripe-like Detail Drawer Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-fit space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-white font-mono text-sm">Delivery Inspector</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Selected request details and cryptographic signatures.</p>
          </div>

          {!activeLog ? (
            <div className="text-center py-20 text-slate-500 text-[10px] font-mono">
              Select a delivery log row to inspect request data structures.
            </div>
          ) : (
            <div className="space-y-4 font-mono text-[10px]">
              <div>
                <span className="text-slate-500 uppercase font-bold block mb-1">Target Endpoint</span>
                <span className="text-indigo-300 select-all break-all block bg-slate-950 p-2.5 rounded border border-slate-800">
                  POST {activeLog.endpointUrl || 'https://webhook.site/xyz'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-bold block mb-1">Headers</span>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1 text-slate-350 select-all overflow-x-auto max-h-32">
                  <p><span className="text-indigo-400">Content-Type:</span> application/json</p>
                  <p><span className="text-indigo-400">User-Agent:</span> HookRelay/Worker-1.0</p>
                  <p><span className="text-indigo-400">X-HookRelay-Signature:</span> sha256_e8c339...</p>
                  <p><span className="text-indigo-400">X-HookRelay-Event:</span> {activeLog.eventType}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-bold block mb-1">Request Payload</span>
                <pre className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-300 overflow-x-auto select-all max-h-48 text-[9px] leading-tight">
                  {JSON.stringify(activeLog.payload || {}, null, 2)}
                </pre>
              </div>

              {activeLog.status !== 'SUCCESS' && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 text-rose-405 font-bold text-rose-400">
                    <AlertCircle className="w-4 h-4 text-rose-455" />
                    <span>Attempts: {activeLog.attempt || 5}/5</span>
                  </div>
                  <button
                    onClick={() => handleReplayClick(activeLog)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 bg-indigo-600 text-white rounded font-bold font-semibold transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>Redeliver</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
