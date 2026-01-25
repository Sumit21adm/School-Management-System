import { useEffect, useState } from 'react';
import { organizationsApi } from '../lib/api';
import { Search, Plus, MoreVertical, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface Organization {
    id: number;
    name: string;
    slug: string;
    email: string;
    status: string;
    studentCount: number;
    createdAt: string;
    subscription?: { plan: { name: string }; status: string };
}

export default function Organizations() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchOrganizations();
    }, [search, statusFilter]);

    const fetchOrganizations = async () => {
        setIsLoading(true);
        try {
            const response = await organizationsApi.getAll({ search: search || undefined, status: statusFilter || undefined, take: 50 });
            setOrganizations(response.data.data);
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            await organizationsApi.updateStatus(id, newStatus);
            fetchOrganizations();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const statusStyles: Record<string, string> = {
        ACTIVE: 'bg-emerald-500/10 text-emerald-400',
        TRIAL: 'bg-amber-500/10 text-amber-400',
        SUSPENDED: 'bg-red-500/10 text-red-400',
        CANCELLED: 'bg-gray-500/10 text-gray-400',
    };

    const statusIcons: Record<string, any> = {
        ACTIVE: CheckCircle,
        TRIAL: Clock,
        SUSPENDED: XCircle,
        CANCELLED: XCircle,
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Organizations</h1>
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all">
                    <Plus size={18} />
                    Add Organization
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input type="text" placeholder="Search organizations..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="TRIAL">Trial</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="CANCELLED">Cancelled</option>
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
                                    <th className="px-6 py-4 font-medium">Organization</th>
                                    <th className="px-6 py-4 font-medium">Plan</th>
                                    <th className="px-6 py-4 font-medium">Students</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Created</th>
                                    <th className="px-6 py-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {organizations.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No organizations found</td></tr>
                                ) : (
                                    organizations.map((org) => {
                                        const StatusIcon = statusIcons[org.status] || Clock;
                                        return (
                                            <tr key={org.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">{org.name.charAt(0)}</div>
                                                        <div>
                                                            <p className="text-white font-medium">{org.name}</p>
                                                            <p className="text-gray-400 text-sm">{org.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">{org.subscription?.plan?.name || '—'}</td>
                                                <td className="px-6 py-4 text-gray-300">{org.studentCount}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusStyles[org.status]}`}>
                                                        <StatusIcon size={12} />{org.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 text-sm">{new Date(org.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    <div className="relative group">
                                                        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors"><MoreVertical size={16} className="text-gray-400" /></button>
                                                        <div className="absolute right-0 mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                                            {org.status !== 'ACTIVE' && <button onClick={() => handleStatusUpdate(org.id, 'ACTIVE')} className="w-full px-4 py-2 text-left text-sm text-emerald-400 hover:bg-gray-700">Activate</button>}
                                                            {org.status !== 'SUSPENDED' && <button onClick={() => handleStatusUpdate(org.id, 'SUSPENDED')} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700">Suspend</button>}
                                                        </div>
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

            {showCreateModal && <CreateOrganizationModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchOrganizations(); }} />}
        </div>
    );
}

function CreateOrganizationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', adminEmail: '', adminName: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await organizationsApi.create({ ...formData, adminPassword: 'admin123' });
            onSuccess();
        } catch (error) {
            console.error('Failed to create organization:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-xl font-semibold text-white mb-6">Add Organization</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Institution Name</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="ABC Public School" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Institution Email</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="contact@school.com" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone</label>
                        <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="+91 9876543210" />
                    </div>
                    <div className="border-t border-gray-800 pt-4 mt-4">
                        <p className="text-sm text-gray-400 mb-3">Admin Account</p>
                        <div className="space-y-3">
                            <input type="text" value={formData.adminName} onChange={(e) => setFormData({ ...formData, adminName: e.target.value })} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Admin name" />
                            <input type="email" value={formData.adminEmail} onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="admin@school.com" />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">Cancel</button>
                        <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
