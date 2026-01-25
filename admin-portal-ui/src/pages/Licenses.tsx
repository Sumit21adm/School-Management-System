import { useEffect, useState } from 'react';
import { activationApi } from '../lib/api';
import { CheckCircle, XCircle, Clock, Copy, Loader2 } from 'lucide-react';

interface ActivationCode {
    id: number;
    code: string;
    status: string;
    maxStudents: number | null;
    maxUsers: number | null;
    instanceName: string | null;
    activatedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    organization: { id: number; name: string; slug: string };
    _count: { heartbeats: number };
}

export default function Licenses() {
    const [codes, setCodes] = useState<ActivationCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);

    useEffect(() => {
        fetchCodes();
    }, [statusFilter]);

    const fetchCodes = async () => {
        setIsLoading(true);
        try {
            const response = await activationApi.getAll({ status: statusFilter || undefined, take: 50 });
            setCodes(response.data.data);
        } catch (error) {
            console.error('Failed to fetch codes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyCode = (id: number, code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleRevoke = async (id: number) => {
        if (confirm('Are you sure you want to revoke this license?')) {
            try {
                await activationApi.revoke(id, 'Revoked by admin');
                fetchCodes();
            } catch (error) {
                console.error('Failed to revoke:', error);
            }
        }
    };

    const statusConfig: Record<string, { icon: any; color: string }> = {
        ACTIVE: { icon: Clock, color: 'bg-indigo-500/10 text-indigo-400' },
        USED: { icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-400' },
        REVOKED: { icon: XCircle, color: 'bg-red-500/10 text-red-400' },
        EXPIRED: { icon: XCircle, color: 'bg-gray-500/10 text-gray-400' },
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Activation Licenses</h1>
            </div>

            <div className="flex gap-4">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active (Unused)</option>
                    <option value="USED">Used (Activated)</option>
                    <option value="REVOKED">Revoked</option>
                    <option value="EXPIRED">Expired</option>
                </select>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-gray-400 text-sm bg-gray-800/50">
                                    <th className="px-6 py-4 font-medium">License Code</th>
                                    <th className="px-6 py-4 font-medium">Organization</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Instance</th>
                                    <th className="px-6 py-4 font-medium">Heartbeats</th>
                                    <th className="px-6 py-4 font-medium">Created</th>
                                    <th className="px-6 py-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {codes.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No activation codes found</td></tr>
                                ) : (
                                    codes.map((code) => {
                                        const config = statusConfig[code.status] || statusConfig.ACTIVE;
                                        const StatusIcon = config.icon;
                                        return (
                                            <tr key={code.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <code className="font-mono text-sm text-indigo-400 bg-gray-800 px-2 py-1 rounded">{code.code}</code>
                                                        <button onClick={() => copyCode(code.id, code.code)} className="p-1 hover:bg-gray-700 rounded transition-colors">
                                                            <Copy size={14} className={copiedId === code.id ? 'text-emerald-400' : 'text-gray-400'} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-white">{code.organization.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${config.color}`}>
                                                        <StatusIcon size={12} />{code.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400">{code.instanceName || '—'}</td>
                                                <td className="px-6 py-4 text-gray-400">{code._count.heartbeats}</td>
                                                <td className="px-6 py-4 text-gray-400 text-sm">{new Date(code.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    {code.status !== 'REVOKED' && (
                                                        <button onClick={() => handleRevoke(code.id)} className="px-3 py-1 text-xs font-medium bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">
                                                            Revoke
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
