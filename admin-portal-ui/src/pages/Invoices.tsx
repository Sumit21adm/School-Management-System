import { useEffect, useState } from 'react';
import { invoicesApi } from '../lib/api';
import { CheckCircle, Clock, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface Invoice {
    id: number;
    invoiceNo: string;
    total: number;
    status: string;
    dueDate: string;
    paidAt: string | null;
    paymentGateway: string | null;
    organization: { id: number; name: string };
}

export default function Invoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, [statusFilter]);

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const response = await invoicesApi.getAll({ status: statusFilter || undefined, take: 50 });
            setInvoices(response.data.data);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
    };

    const statusConfig: Record<string, { icon: any; color: string }> = {
        PENDING: { icon: Clock, color: 'bg-amber-500/10 text-amber-400' },
        PAID: { icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-400' },
        FAILED: { icon: XCircle, color: 'bg-red-500/10 text-red-400' },
        REFUNDED: { icon: AlertTriangle, color: 'bg-gray-500/10 text-gray-400' },
        DRAFT: { icon: Clock, color: 'bg-gray-500/10 text-gray-400' },
        CANCELLED: { icon: XCircle, color: 'bg-gray-500/10 text-gray-400' },
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Invoices</h1>
            </div>

            <div className="flex gap-4">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
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
                                    <th className="px-6 py-4 font-medium">Invoice</th>
                                    <th className="px-6 py-4 font-medium">Organization</th>
                                    <th className="px-6 py-4 font-medium">Amount</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Due Date</th>
                                    <th className="px-6 py-4 font-medium">Paid At</th>
                                    <th className="px-6 py-4 font-medium">Gateway</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No invoices found</td></tr>
                                ) : (
                                    invoices.map((invoice) => {
                                        const config = statusConfig[invoice.status] || statusConfig.PENDING;
                                        const StatusIcon = config.icon;
                                        const isOverdue = invoice.status === 'PENDING' && new Date(invoice.dueDate) < new Date();
                                        return (
                                            <tr key={invoice.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                                                <td className="px-6 py-4"><span className="text-indigo-400 font-medium">{invoice.invoiceNo}</span></td>
                                                <td className="px-6 py-4 text-white">{invoice.organization.name}</td>
                                                <td className="px-6 py-4"><span className="flex items-center gap-1 text-white font-medium">{formatCurrency(invoice.total)}</span></td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${isOverdue ? 'bg-red-500/10 text-red-400' : config.color}`}>
                                                        <StatusIcon size={12} />{isOverdue ? 'OVERDUE' : invoice.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 text-sm">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-gray-400 text-sm">{invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '—'}</td>
                                                <td className="px-6 py-4">{invoice.paymentGateway && <span className="px-2 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded capitalize">{invoice.paymentGateway}</span>}</td>
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
