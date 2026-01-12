import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
    DollarSign,
    Package,
    ShoppingCart,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Calendar
} from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/dashboard');
                setStats(data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">جاري تحميل الإحصائيات...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">حدث خطأ أثناء تحميل البيانات</div>;

    const StatCard = ({ title, value, icon: Icon, gradient, trend }: any) => (
        <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br ${gradient}`}>
            {/* Background Decoration */}


            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <div className="p-2 bg-white/20 rounded-lg w-fit backdrop-blur-sm mb-3">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-indigo-50 font-medium text-sm mb-1 opacity-90">{title}</p>
                    <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-sm font-bold bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm ${trend === 'up' ? 'text-green-100' : 'text-red-100'}`}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{trend === 'up' ? '+12%' : '-5%'}</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="إجمالي المنتجات"
                    value={stats.stats.totalProducts}
                    icon={Package}
                    gradient="from-blue-500 to-indigo-600"
                    trend="up"
                />
                <StatCard
                    title="إجمالي المبيعات"
                    value={`${stats.stats.totalSalesValue.toLocaleString()} د.ج`}
                    icon={DollarSign}
                    gradient="from-emerald-400 to-teal-600"
                    trend="up"
                />
                <StatCard
                    title="قيمة المشتريات"
                    value={`${stats.stats.totalPurchasesValue.toLocaleString()} د.ج`}
                    icon={ShoppingCart}
                    gradient="from-orange-400 to-red-500"
                    trend="down"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Appointments */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span>المواعيد القريبة</span>
                        </h3>
                        <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">{stats.appointments?.length || 0} موعد</span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50/50 dark:bg-gray-700/30 text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium">العميل</th>
                                    <th className="px-4 py-3 font-medium">التاريخ</th>
                                    <th className="px-4 py-3 font-medium">الخدمة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {stats.appointments?.map((apt: any) => (
                                    <tr key={apt._id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">{apt.customer?.name}</td>
                                        <td className="px-4 py-3 text-gray-500" dir="ltr">
                                            <div className="flex items-center gap-2 justify-end">
                                                <span>{new Date(apt.date).toLocaleDateString('en-GB')}</span>
                                                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{new Date(apt.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full text-xs">{apt.serviceType}</span>
                                        </td>
                                    </tr>
                                ))}
                                {(!stats.appointments || stats.appointments.length === 0) && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                                            لا توجد مواعيد قريبة 📅
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Low Stock Warning */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <span>تنبيهات المخزون</span>
                        </h3>
                        <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full">{stats.warnings.lowStock.length} منتج</span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50/50 dark:bg-gray-700/30 text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium">المنتج</th>
                                    <th className="px-4 py-3 font-medium">المتوفر</th>
                                    <th className="px-4 py-3 font-medium">الحد الأدنى</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {stats.warnings.lowStock.map((item: any) => (
                                    <tr key={item._id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">{item.name}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full">{item.quantity}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{item.minLimit}</td>
                                    </tr>
                                ))}
                                {stats.warnings.lowStock.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                                            المخزون بوضع ممتاز ✅
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Expiry Warning */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            </div>
                            <span>تنبيهات الصلاحية (30 يوم)</span>
                        </h3>
                        <span className="text-xs font-bold bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">{stats.warnings.expiring.length} منتج</span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50/50 dark:bg-gray-700/30 text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium">المنتج</th>
                                    <th className="px-4 py-3 font-medium">ينتهي في</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {stats.warnings.expiring.map((item: any) => (
                                    <tr key={item._id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">{item.name}</td>
                                        <td className="px-4 py-3 font-medium text-yellow-600 bg-yellow-50/30" dir="ltr">
                                            {new Date(item.expiryDate).toLocaleDateString('en-GB')}
                                        </td>
                                    </tr>
                                ))}
                                {stats.warnings.expiring.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-8 text-center text-gray-400">
                                            لا توجد منتجات منتهية الصلاحية قريباً ✅
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
