import React from 'react';
import { useDashboardStats, useDlqMessages, useReplayDlq } from '@frontend/api-client';
import { Activity, ShieldAlert, CheckCircle, RefreshCcw, Server } from 'lucide-react';

export const ConsoleHome: React.FC = () => {
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: dlqMessages, isLoading: loadingDlq } = useDlqMessages();
  const replayDlqMutation = useReplayDlq();

  const handleReplayClick = async (messageId: string) => {
    try {
      await replayDlqMutation.mutateAsync(messageId);
      alert('Event successfully re-queued for delivery!');
    } catch (err) {
      alert('Failed to re-queue event.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">System Overview</h1>
        <p className="text-sm text-slate-450 mt-1 font-mono">Stream metrics and Dead Letter Queue management.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Events */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Events Ingested Today</span>
            <p className="text-2xl font-mono font-bold text-white">
              {loadingStats ? '...' : stats?.totalEventsToday}
            </p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Success deliveries */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Successful Deliveries</span>
            <p className="text-2xl font-mono font-bold text-emerald-405 text-emerald-400">
              {loadingStats ? '...' : stats?.successfulDeliveriesToday}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Failed deliveries */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Delivery Failures</span>
            <p className="text-2xl font-mono font-bold text-rose-400">
              {loadingStats ? '...' : stats?.failedDeliveriesToday}
            </p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-455 rounded-xl text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Success rate */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Success Rate</span>
            <p className="text-2xl font-mono font-bold text-indigo-300">
              {loadingStats ? '...' : `${stats?.successRatePercent.toFixed(1)}%`}
            </p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-300 rounded-xl">
            <Server className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* DLQ Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden space-y-4 p-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-white">Dead Letter Queue (DLQ)</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Events that reached maximum retry threshold and require manual replay.</p>
          </div>
          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded font-mono text-xs font-bold">
            {stats?.dlqSize || 0} Dead
          </span>
        </div>

        {loadingDlq ? (
          <div className="h-20 bg-slate-800 animate-pulse rounded-lg" />
        ) : !dlqMessages || dlqMessages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xs text-slate-500 font-mono">DLQ is currently clean. No dead events to replay.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800 pb-2">
                  <th className="py-2.5">Message ID</th>
                  <th className="py-2.5">Endpoint Destination</th>
                  <th className="py-2.5">Event Type</th>
                  <th className="py-2.5">Failure Reason</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dlqMessages.map((msg) => (
                  <tr key={msg.messageId} className="hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-slate-350">{msg.messageId}</td>
                    <td className="py-3 truncate max-w-[200px]" title={msg.endpointUrl}>
                      {msg.endpointUrl}
                    </td>
                    <td className="py-3">
                      <span className="bg-indigo-950 text-indigo-300 border border-indigo-900 px-2 py-0.5 rounded">
                        {msg.eventType}
                      </span>
                    </td>
                    <td className="py-3 text-rose-400 font-bold">{msg.failureReason}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleReplayClick(msg.messageId)}
                        disabled={replayDlqMutation.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-mono font-semibold transition-colors"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        <span>Replay</span>
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
  );
};
