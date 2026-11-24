import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../utils/apiTransport';
import { Activity, Clock, RefreshCw, BellRing, Bell, Link2, Copy, Check, Send } from 'lucide-react';
import { resolveAbsolutePublicUrl } from '../../utils/publicUrl';

export const AdminAudit: React.FC = () => {
  const { auditLogs, adminNotificationLogs, notificationProviders, realtimeConnected, refreshAllData, addToast } = useApp();
  const [activeView, setActiveView] = useState<'audit' | 'notifications'>('audit');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const webhookUrl = resolveAbsolutePublicUrl('/api/webhooks/push-notifications');

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    addToast('Webhook URL copied to clipboard!', 'success');
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleTriggerSampleWebhook = async () => {
    setIsTestingWebhook(true);
    try {
      const res = await apiFetch('/api/webhooks/push-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'CEG-882941',
          type: 'deposit',
          amount: 25
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Test webhook push notification sent successfully!', 'success');
        await refreshAllData();
      } else {
        addToast(data.error || 'Webhook test failed (PUSH_WEBHOOK_SECRET may be set)', 'warning');
      }
    } catch (e: any) {
      addToast(e.message || 'Webhook test error', 'error');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span>Real-Time Audit Stream & Push Monitor</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live events and automated real-time Push notification logs for deposits and withdrawals.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                realtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-mono">{realtimeConnected ? 'SSE Live Stream Active' : 'Disconnected'}</span>
          </div>

          <button
            onClick={() => refreshAllData()}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View Switcher & Provider Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex bg-slate-900 border border-slate-800 rounded-xl p-1 space-x-1">
          <button
            onClick={() => setActiveView('audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeView === 'audit' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>System Audit Logs ({auditLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveView('notifications')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeView === 'notifications' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Push Alerts ({adminNotificationLogs.length})</span>
          </button>
        </div>

        {notificationProviders && (
          <div className="flex items-center flex-wrap gap-1.5 text-[10px] font-bold">
            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Web Push SSE: Ready
            </span>
            <span
              className={`px-2 py-1 rounded-lg border ${
                notificationProviders.fcmConfigured || notificationProviders.pushWebhookConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              External Push:{' '}
              {notificationProviders.fcmConfigured
                ? 'FCM Live'
                : notificationProviders.pushWebhookConfigured
                ? 'Webhook Live'
                : 'SSE + SW Only'}
            </span>
          </div>
        )}
      </div>

      {activeView === 'audit' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Broadcast Event History ({auditLogs.length} events logged)
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">0ms Event Latency</span>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 hover:bg-slate-800/40 transition-colors flex items-start justify-between space-x-3 text-xs"
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <span className="px-2 py-0.5 rounded-md bg-slate-950 text-amber-400 font-mono font-bold text-[10px] border border-slate-800 shrink-0">
                    {log.action}
                  </span>
                  <span className="text-slate-200 font-medium break-words leading-relaxed">
                    {log.details}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono shrink-0 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Push Notification Webhook Endpoint Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white">
                    Deposit & Withdrawal Push Webhook Endpoint
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Trigger real-time push alerts by sending a POST request from an external server or payment gateway
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                    notificationProviders?.webhookSecretConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                  }`}
                >
                  {notificationProviders?.webhookSecretConfigured ? 'Secret Protected (x-webhook-secret)' : 'Preview Mode (Optional Secret)'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-nowrap">
                POST {webhookUrl}
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleCopyWebhook}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center space-x-1.5 transition-colors"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
                </button>
                <button
                  onClick={handleTriggerSampleWebhook}
                  disabled={isTestingWebhook}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center space-x-1.5 border border-slate-700 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isTestingWebhook ? 'Sending...' : 'Test Webhook'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-[11px] font-mono text-slate-300 overflow-x-auto">
              Payload JSON:{' '}
              <span className="text-amber-300">
                {`{"userId": "CEG-882941", "type": "deposit", "amount": 25.00}`}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Automated Deposit & Withdrawal Push Dispatch Log ({adminNotificationLogs.length})
              </span>
              <span className="text-[10px] text-amber-400 font-mono">Auto-Triggered on Deposit/Withdrawal</span>
            </div>

          {adminNotificationLogs.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <BellRing className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                No deposit or withdrawal push alerts dispatched yet. Approve a deposit or withdrawal to see live push dispatches.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
              {adminNotificationLogs.map((n) => (
                <div
                  key={n.id}
                  className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className="font-extrabold text-white">{n.title}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400 font-mono text-[10px]">
                        {n.userName} ({n.userId})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 uppercase font-bold text-[10px]">
                        {n.transactionType}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{n.message}</p>
                    {n.providerInfo && (
                      <p className="text-[10px] text-slate-500 font-mono">{n.providerInfo}</p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        n.pushStatus === 'sent'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Bell className="w-3 h-3" />
                      <span>Push: {n.pushStatus}</span>
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
};
