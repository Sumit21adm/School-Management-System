import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../lib/api';
import {
    Building2,
    CreditCard,
    TrendingUp,
    Clock,
    AlertCircle,
    IndianRupee,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface DashboardData {
    organizations: { total: number; trial: number; active: number; suspended: number };
    subscriptions: { total: number; byPlan: { planName: string; count: number }[] };
    revenue: { thisMonth: number; lastMonth: number; total: number; growthPercent: string };
    recentOrganizations: any[];
    expiringTrials: any[];
}

export default function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [revenueTrend, setRevenueTrend] = useState<{ month: string; revenue: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashRes, trendRes] = await Promise.all([
                    analyticsApi.getDashboard(),
                    analyticsApi.getRevenueTrend(6),
                ]);
                setData(dashRes.data);
                setRevenueTrend(trendRes.data);
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
        );
    }

    const stats = [
        {
            name: 'Total Revenue',
            value: formatCurrency(data?.revenue.total || 0),
            change: `${data?.revenue.growthPercent || 0}%`,
            changeType: Number(data?.revenue.growthPercent) >= 0 ? 'positive' : 'negative',
            icon: IndianRupee,
            color: 'from-emerald-500 to-teal-600',
        },
        {
            name: 'Active Organizations',
            value: data?.organizations.active || 0,
            subtext: `${data?.organizations.trial || 0} in trial`,
            icon: Building2,
            color: 'from-indigo-500 to-purple-600',
        },
        {
            name: 'Active Subscriptions',
            value: data?.subscriptions.total || 0,
            icon: CreditCard,
            color: 'from-pink-500 to-rose-600',
        },
        {
            name: 'This Month',
            value: formatCurrency(data?.revenue.thisMonth || 0),
            icon: TrendingUp,
            color: 'from-amber-500 to-orange-600',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                                <stat.icon size={20} className="text-white" />
                            </div>
                            {stat.change && (
                                <span className={`flex items-center text-sm font-medium ${stat.changeType === 'positive' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {stat.changeType === 'positive' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                    {stat.change}
                                </span>
                            )}
                        </div>
                        <p className="mt-4 text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-sm text-gray-400">{stat.name}</p>
                        {stat.subtext && <p className="text-xs text-indigo-400 mt-1">{stat.subtext}</p>}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueTrend}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Expiring Trials</h3>
                        <Clock size={18} className="text-amber-400" />
                    </div>
                    <div className="space-y-3">
                        {data?.expiringTrials?.length === 0 && <p className="text-gray-500 text-sm">No trials expiring soon</p>}
                        {data?.expiringTrials?.slice(0, 5).map((trial: any) => (
                            <div key={trial.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-white">{trial.organization?.name}</p>
                                    <p className="text-xs text-gray-400">{trial.plan?.name}</p>
                                </div>
                                <span className="text-xs text-amber-400 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    {new Date(trial.trialEndsAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Recent Organizations</h3>
                    <Link to="/organizations" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View all →</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                                <th className="pb-3 font-medium">Name</th>
                                <th className="pb-3 font-medium">Email</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.recentOrganizations?.map((org: any) => (
                                <tr key={org.id} className="border-b border-gray-800/50">
                                    <td className="py-3 text-white font-medium">{org.name}</td>
                                    <td className="py-3 text-gray-400">{org.email}</td>
                                    <td className="py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${org.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : org.status === 'TRIAL' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'}`}>{org.status}</span>
                                    </td>
                                    <td className="py-3 text-gray-400 text-sm">{new Date(org.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
