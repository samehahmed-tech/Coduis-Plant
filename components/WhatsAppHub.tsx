import React, { useEffect, useState } from 'react';
import {
    MessageSquare, Phone, Search, RefreshCw, CheckCircle2, AlertTriangle,
    Send, Inbox, Bell, X, Wifi, WifiOff, Clock, Users, ChevronRight
} from 'lucide-react';
import { whatsappApi } from '../services/api/whatsapp';
import { useAuthStore } from '../stores/useAuthStore';
import ExportButton from './common/ExportButton';
import { useToast } from './common/ToastProvider';

type WaTab = 'status' | 'inbox' | 'escalations';

const WhatsAppHub: React.FC = () => {
    const { settings } = useAuthStore();
    const lang = settings.language || 'en';
    const { success, error: showError } = useToast();

    const [activeTab, setActiveTab] = useState<WaTab>('status');
    const [status, setStatus] = useState<any>(null);
    const [inbox, setInbox] = useState<any[]>([]);
    const [escalations, setEscalations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('');

    const loadStatus = async () => { try { setStatus(await whatsappApi.getStatus()); } catch { } };
    const loadInbox = async () => { try { const r = await whatsappApi.getInbox({ limit: 50 }); setInbox(r.inbox || []); } catch { } };
    const loadEscalations = async () => { try { const r = await whatsappApi.getEscalations(); setEscalations(r.escalations || []); } catch { } };

    const load = async () => {
        setIsLoading(true);
        await Promise.all([loadStatus(), loadInbox(), loadEscalations()]);
        setIsLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleSendTest = async () => {
        if (!testPhone || !testMessage) return;
        try {
            await whatsappApi.sendTest({ to: testPhone, text: testMessage });
            success('Test message sent!');
            setTestPhone(''); setTestMessage('');
        } catch (e: any) { showError(e.message); }
    };

    const handleResolve = async (id: string) => {
        const notes = prompt('Resolution notes:');
        try { await whatsappApi.resolveEscalation(id, notes || ''); await loadEscalations(); success('Escalation resolved'); } catch (e: any) { showError(e.message); }
    };

    const isConnected = status?.configured && status?.ok;

    return (
        <div className="p-4 md:p-8 lg:p-10 bg-app min-h-screen pb-24">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-green-600 to-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-green-600/30">
                            <MessageSquare size={28} />
                        </div>
                        <h2 className="text-3xl font-black text-main uppercase tracking-tighter">{lang === 'ar' ? 'واتساب' : 'WhatsApp Hub'}</h2>
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${isConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    <p className="text-muted font-bold text-xs uppercase tracking-widest opacity-60">{lang === 'ar' ? 'تواصل · رسائل · تصعيد' : 'Messages · Inbox · Escalations'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButton data={activeTab === 'inbox' ? inbox : escalations} columns={
                        activeTab === 'inbox' ? [
                            { key: 'from', label: 'From' },
                            { key: 'text', label: 'Message' },
                            { key: 'type', label: 'Type' },
                            { key: 'createdAt', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleString() : '' },
                        ] : [
                            { key: 'customerName', label: 'Customer' },
                            { key: 'issue', label: 'Issue' },
                            { key: 'status', label: 'Status' },
                            { key: 'createdAt', label: 'Date', format: (v: any) => v ? new Date(v).toLocaleString() : '' },
                        ]
                    } filename={`whatsapp_${activeTab}`} title={activeTab === 'inbox' ? 'WhatsApp Inbox' : 'WhatsApp Escalations'} />
                    <button onClick={load} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"><RefreshCw size={14} /> Refresh</button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Provider', value: status?.provider || '—', icon: Phone, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { label: 'Status', value: isConnected ? 'Online' : 'Offline', icon: isConnected ? Wifi : WifiOff, color: isConnected ? 'text-emerald-500' : 'text-rose-500', bg: isConnected ? 'bg-emerald-500/10' : 'bg-rose-500/10' },
                    { label: 'Inbox', value: status?.inboxCount || 0, icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Escalations', value: status?.openEscalations || 0, icon: Bell, color: (status?.openEscalations || 0) > 0 ? 'text-amber-500' : 'text-emerald-500', bg: (status?.openEscalations || 0) > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10' },
                ].map((s, i) => (
                    <div key={i} className="card-primary border border-border p-5 rounded-[2rem] shadow-sm">
                        <div className={`w-9 h-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}><s.icon size={16} /></div>
                        <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-0.5">{s.label}</p>
                        <h4 className="text-xl font-black text-main">{s.value}</h4>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-8 bg-elevated/40 p-1.5 rounded-2xl border border-border w-fit">
                {([
                    { id: 'status' as WaTab, label: 'Connection', icon: Wifi },
                    { id: 'inbox' as WaTab, label: 'Inbox', icon: Inbox },
                    { id: 'escalations' as WaTab, label: 'Escalations', icon: Bell },
                ]).map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' : 'text-muted hover:text-main hover:bg-elevated/60'}`}>
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* STATUS */}
            {activeTab === 'status' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                    <div className="card-primary border border-border rounded-[2.5rem] p-6 shadow-sm">
                        <h3 className="text-lg font-black text-main uppercase tracking-tight mb-6">Connection Status</h3>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {[
                                { label: 'Provider', value: status?.provider || 'Not configured' },
                                { label: 'Configured', value: status?.configured ? 'Yes' : 'No' },
                                { label: 'Last Webhook', value: status?.lastWebhookAt ? new Date(status.lastWebhookAt).toLocaleString() : 'Never' },
                                { label: 'Connection', value: isConnected ? 'Active' : 'Inactive' },
                            ].map((item, i) => (
                                <div key={i} className="p-4 bg-app rounded-2xl border border-border">
                                    <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1">{item.label}</p>
                                    <p className="text-sm font-bold text-main">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Test Message */}
                    <div className="card-primary border border-border rounded-[2.5rem] p-6 shadow-sm max-w-lg">
                        <h3 className="text-lg font-black text-main uppercase tracking-tight mb-4 flex items-center gap-2"><Send size={18} className="text-green-500" /> Send Test Message</h3>
                        <div className="space-y-3">
                            <input type="text" placeholder="Phone number (with country code)" value={testPhone} onChange={e => setTestPhone(e.target.value)}
                                className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none focus:border-green-500 text-main" />
                            <textarea placeholder="Message text..." value={testMessage} onChange={e => setTestMessage(e.target.value)} rows={3}
                                className="w-full px-4 py-3 bg-app border border-border rounded-xl text-xs font-bold outline-none focus:border-green-500 text-main resize-none" />
                            <button onClick={handleSendTest} className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><Send size={14} /> Send Test</button>
                        </div>
                    </div>
                </div>
            )}

            {/* INBOX */}
            {activeTab === 'inbox' && (
                <div className="card-primary border border-border rounded-[2.5rem] shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
                    <div className="responsive-table">
                        <table className="w-full text-left">
                            <thead className="bg-app/50 text-[9px] font-black uppercase text-muted tracking-[0.2em]">
                                <tr>
                                    <th className="px-6 py-4">From</th>
                                    <th className="px-4 py-4">Message</th>
                                    <th className="px-4 py-4">Type</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {inbox.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-muted text-sm">No messages yet.</td></tr>}
                                {inbox.map((msg, i) => (
                                    <tr key={i} className="hover:bg-elevated/20 transition-all">
                                        <td className="px-6 py-4 text-xs font-black text-main">{msg.from || msg.phone || '—'}</td>
                                        <td className="px-4 py-4 text-[10px] text-main truncate max-w-[250px]">{msg.text || msg.body || '—'}</td>
                                        <td className="px-4 py-4"><span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-[9px] font-black uppercase">{msg.type || 'text'}</span></td>
                                        <td className="px-6 py-4 text-[10px] text-muted">{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ESCALATIONS */}
            {activeTab === 'escalations' && (
                <div className="card-primary border border-border rounded-[2.5rem] shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
                    <div className="responsive-table">
                        <table className="w-full text-left">
                            <thead className="bg-app/50 text-[9px] font-black uppercase text-muted tracking-[0.2em]">
                                <tr>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-4 py-4">Issue</th>
                                    <th className="px-4 py-4">Status</th>
                                    <th className="px-4 py-4">Date</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {escalations.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-emerald-500 text-sm font-bold">✓ No open escalations</td></tr>}
                                {escalations.map((esc, i) => (
                                    <tr key={esc.id || i} className="hover:bg-elevated/20 transition-all">
                                        <td className="px-6 py-4 text-xs font-black text-main">{esc.customerName || esc.from || '—'}</td>
                                        <td className="px-4 py-4 text-[10px] text-main truncate max-w-[200px]">{esc.issue || esc.text || '—'}</td>
                                        <td className="px-4 py-4"><span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${esc.status === 'OPEN' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{esc.status}</span></td>
                                        <td className="px-4 py-4 text-[10px] text-muted">{esc.createdAt ? new Date(esc.createdAt).toLocaleString() : '—'}</td>
                                        <td className="px-6 py-4 text-center">
                                            {esc.status === 'OPEN' && (
                                                <button onClick={() => handleResolve(esc.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors" title="Resolve"><CheckCircle2 size={14} /></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppHub;
