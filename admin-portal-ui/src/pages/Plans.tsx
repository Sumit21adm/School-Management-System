import { useEffect, useState } from 'react';
import { plansApi } from '../lib/api';
import { CreditCard, Check, Edit, Plus, Loader2, Users } from 'lucide-react';

interface Plan {
    id: number;
    name: string;
    description: string;
    pricePerStudent: number;
    baseFeeMonthly: number;
    maxStudents: number | null;
    includedModules: string;
    isPopular: boolean;
    isActive: boolean;
    _count: { subscriptions: number };
}

export default function Plans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await plansApi.getAll(true);
            setPlans(response.data);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (id: number) => {
        try {
            await plansApi.toggle(id);
            fetchPlans();
        } catch (error) {
            console.error('Failed to toggle plan:', error);
        }
    };

    const parseModules = (modulesJson: string): string[] => {
        try {
            return JSON.parse(modulesJson);
        } catch {
            return [];
        }
    };

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
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all">
                    <Plus size={18} />
                    Add Plan
                </button>
            </div>

            {/* Plans grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const modules = parseModules(plan.includedModules);
                    return (
                        <div
                            key={plan.id}
                            className={`relative bg-gray-900 border rounded-2xl p-6 transition-all ${plan.isPopular
                                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/10'
                                    : 'border-gray-800 hover:border-gray-700'
                                } ${!plan.isActive ? 'opacity-60' : ''}`}
                        >
                            {plan.isPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20">
                                    <CreditCard size={24} className="text-indigo-400" />
                                </div>
                                <button
                                    onClick={() => handleToggle(plan.id)}
                                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${plan.isActive
                                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                        }`}
                                >
                                    {plan.isActive ? 'Active' : 'Inactive'}
                                </button>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                            <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

                            <div className="mb-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-white">
                                        {formatCurrency(plan.pricePerStudent)}
                                    </span>
                                    <span className="text-gray-400">/student/mo</span>
                                </div>
                                {plan.baseFeeMonthly > 0 && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        + {formatCurrency(plan.baseFeeMonthly)} base fee
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2 mb-6">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    Included Modules
                                </p>
                                {modules.map((module) => (
                                    <div key={module} className="flex items-center gap-2 text-sm text-gray-300">
                                        <Check size={16} className="text-emerald-400" />
                                        <span className="capitalize">{module}</span>
                                    </div>
                                ))}
                                {plan.maxStudents && (
                                    <div className="flex items-center gap-2 text-sm text-gray-300 mt-2">
                                        <Users size={16} className="text-indigo-400" />
                                        <span>Up to {plan.maxStudents} students</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                                <span className="text-sm text-gray-400">
                                    {plan._count?.subscriptions || 0} subscribers
                                </span>
                                <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                                    <Edit size={16} className="text-gray-400" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
