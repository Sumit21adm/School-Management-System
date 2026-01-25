import { useEffect, useState } from 'react';
import { subscriptionsApi } from '../lib/api';
import { CheckCircle, Clock, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface Subscription {
    id: number;
    status: string;
    billingCycle: string;
    studentCount: number;
    startDate: string;
    trialEndsAt: string | null;
    organization: { id: number; name: string; email: string; slug: string };
    plan: { id: number; name: string };
}

export default function Subscriptions() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchSubscriptions();
    }, [statusFilter]);

    const fetchSubscriptions = async () => {
        setIsLoading(true);
        try {
            const response = await subscriptionsApi.getAll({
                status: statusFilter || undefined,
                take: 50,
            });
            setSubscriptions(response.data.data);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivate = async (id: number) => {
        try {
            await subscriptionsApi.activate(id);
            fetchSubscriptions();
        } catch (error) {
            console.error('Failed to activate:', error);
        }
    };

    const handleCancel = async (id: number) => {
        if (confirm('Are you sure you want to cancel this subscription?')) {
            try {
                await subscriptionsApi.cancel(id, 'Cancelled by admin');
                fetchSubscriptions();
            } catch (error) {
                console.error('Failed to cancel:', error);
            }
        }
    };

    const statusConfig: Record<string, { icon: any; color: string }> = {
        TRIAL: { icon: Clock, color: 'bg-amber-500/10 text-amber-400' },
        ACTIVE: { icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-400' },
        PAST_DUE: { icon: AlertTriangle, color: 'bg-red-500/10 text-red-400' },
        CANCELLED: { icon: XCircle, color: 'bg-gray-500/10 text-gray-400' },
        PAUSED: { icon: Clock, color: 'bg-gray-500/10 text-gray-400' },
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Status</option>
                    <option value="TRIAL">Trial</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAST_DUE">Past Due</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-gray-400 text-sm bg-gray-800/50">
                                    <th className="px-6 py-4 font-medium">Organization</th>
                                    <th className="px-6 py-4 font-medium">Plan</th>
                                    <th className="px-6 py-4 font-medium">Students</th>
                                    <th className="px-6 py-4 font-medium">Billing</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Trial Ends</th>
                                    <th className="px-6 py-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No subscriptions found
                                        </td>
                                    </tr>
                                ) : (
                                    subscriptions.map((sub) => {
                                        const config = statusConfig[sub.status] || statusConfig.ACTIVE;
                                        const StatusIcon = config.icon;
                                        return (
                                            <tr key={sub.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-white font-medium">{sub.organization.name}</p>
                                                        <p className="text-gray-400 text-sm">{sub.organization.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">{sub.plan.name}</td>
                                                <td className="px-6 py-4 text-gray-300">{sub.studentCount}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-gray-300 capitalize">
                                                        {sub.billingCycle.toLowerCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${config.color}`}
                                                    >
                                                        <StatusIcon size={12} />
                                                        {sub.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 text-sm">
                                                    {sub.trialEndsAt
                                                        ? new Date(sub.trialEndsAt).toLocaleDateString()
                                                        : '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        {sub.status === 'TRIAL' && (
                                                            <button
                                                                onClick={() => handleActivate(sub.id)}
                                                                className="px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20"
                                                            >
                                                                Activate
                                                            </button>
                                                        )}
                                                        {sub.status !== 'CANCELLED' && (
                                                            <button
                                                                onClick={() => handleCancel(sub.id)}
                                                                className="px-3 py-1 text-xs font-medium bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>
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
