import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Edit2, Trash2, Search, Eye, DollarSign } from 'lucide-react';
import Modal from '../components/Modal';
import ExportMenu from '../components/ExportMenu';

const Customers = () => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [formData, setFormData] = useState({ name: '', address: '', phone: '' });
    const [paymentData, setPaymentData] = useState({ amount: 0, notes: '', date: '' });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'main' | 'payments'>('main');
    const [search, setSearch] = useState('');

    const fetchCustomers = async () => {
        try {
            const { data } = await api.get('/customers');
            setCustomers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (editingId) {
                await api.put(`/customers/${editingId}`, payload);
            } else {
                await api.post('/customers', payload);
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ name: '', address: '', phone: '' });
            fetchCustomers();
        } catch (error) {
            console.error(error);
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        try {
            if (editingPaymentId) {
                await api.put(`/customers/${selectedCustomer._id}/payment/${editingPaymentId}`, paymentData);
            } else {
                await api.post(`/customers/${selectedCustomer._id}/payment`, paymentData);
            }
            setIsPaymentModalOpen(false);
            setEditingPaymentId(null);
            setPaymentData({ amount: 0, notes: '', date: '' });
            fetchCustomers();
            // Update selected customer locally
            const { data } = await api.get('/customers');
            setCustomers(data);
            if (isDetailModalOpen) {
                const updated = data.find((c: any) => c._id === selectedCustomer._id);
                setSelectedCustomer(updated);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handlePaymentDelete = async (paymentId: string) => {
        if (!selectedCustomer) return;
        if (window.confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
            try {
                await api.delete(`/customers/${selectedCustomer._id}/payment/${paymentId}`);
                // Update lists
                const { data } = await api.get('/customers');
                setCustomers(data);
                if (isDetailModalOpen) {
                    const updated = data.find((c: any) => c._id === selectedCustomer._id);
                    setSelectedCustomer(updated);
                }
                fetchCustomers();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من الحذف؟')) {
            try {
                await api.delete(`/customers/${id}`);
                fetchCustomers();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const openEdit = (customer: any) => {
        setEditingId(customer._id);
        setFormData({
            name: customer.name,
            address: customer.address || '',
            phone: customer.phone || ''
        });
        setIsModalOpen(true);
    };

    const openDetails = (customer: any) => {
        setSelectedCustomer(customer);
        setActiveTab('main');
        setIsDetailModalOpen(true);
    };

    const openPayment = (customer: any) => {
        setSelectedCustomer(customer);
        setEditingPaymentId(null);
        setPaymentData({ amount: 0, notes: '', date: new Date().toISOString().split('T')[0] });
        setIsPaymentModalOpen(true);
    };

    const openEditPayment = (payment: any) => {
        setEditingPaymentId(payment._id);
        setPaymentData({
            amount: payment.amount,
            notes: payment.notes || '',
            date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : ''
        });
        setIsPaymentModalOpen(true);
    };

    const sortedCustomers = [...customers].sort((a, b) => {
        if (a.name === 'زبون عادي') return -1;
        if (b.name === 'زبون عادي') return 1;
        return a.name.localeCompare(b.name);
    });

    const filteredCustomers = sortedCustomers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {loading && <div className="text-center p-4">جاري التحميل...</div>}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex gap-2 w-full md:w-auto items-center">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="بحث عن زبون..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pr-12 pl-4 py-3 bg-white dark:bg-gray-800 border border-transparent shadow-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <ExportMenu
                        data={filteredCustomers}
                        fileName="customers"
                        columns={[
                            { key: 'name', label: 'الاسم' },
                            { key: 'address', label: 'العنوان' },
                            { key: 'totalSales', label: 'إجمالي المبيعات', formatter: (val) => val?.toLocaleString() || '0' },
                            { key: 'totalPaid', label: 'إجمالي المدفوع', formatter: (val) => val?.toLocaleString() || '0' },
                            { key: 'totalRest', label: 'الباقي', formatter: (val) => val?.toLocaleString() || '0' }
                        ]}
                        label="تصدير"
                    />
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', address: '', phone: '' });
                        setIsModalOpen(true);
                    }}
                    className="w-full md:w-auto bg-gradient-to-r from-primary to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-300 font-medium"
                >
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة زبون
                </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50/50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="p-5 font-bold text-sm">الاسم</th>
                                <th className="p-5 font-bold text-sm">العنوان</th>
                                <th className="p-5 font-bold text-sm">إجمالي المبيعات</th>
                                <th className="p-5 font-bold text-sm">إجمالي المدفوع</th>
                                <th className="p-5 font-bold text-sm">الباقي</th>
                                <th className="p-5 font-bold text-sm">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer._id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors duration-200">
                                    <td className="p-5 font-medium text-gray-800 dark:text-white">{customer.name}</td>
                                    <td className="p-5 text-gray-600 dark:text-gray-300">{customer.address}</td>
                                    <td className="p-5 text-blue-600 font-bold">{customer.totalSales?.toLocaleString()}</td>
                                    <td className="p-5 text-emerald-600 font-bold">{customer.totalPaid?.toLocaleString()}</td>
                                    <td className="p-5">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${(customer.totalRest || 0) > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {customer.totalRest?.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openDetails(customer)} className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg dark:bg-gray-700 dark:text-gray-300" title="التفاصيل">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {customer.name !== 'زبون عادي' && (
                                                <>
                                                    <button onClick={() => openEdit(customer)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg dark:bg-indigo-900/20 dark:text-indigo-400" title="تعديل">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(customer._id)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg dark:bg-rose-900/20 dark:text-rose-400" title="حذف">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={() => openPayment(customer)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg dark:bg-emerald-900/20 dark:text-emerald-400" title="تسديد">
                                                <DollarSign className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'تعديل زبون' : 'إضافة زبون جديد'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">الاسم</label>
                        <input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">العنوان</label>
                        <input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">الهاتف</label>
                        <input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-700 transition">
                        حفظ
                    </button>
                </form>
            </Modal>

            {/* Details Modal with Tabs */}
            {selectedCustomer && (
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title={`تفاصيل الزبون: ${selectedCustomer.name}`}
                >
                    <div className="flex border-b border-gray-100 dark:border-gray-700 mb-6">
                        <button
                            className={`px-6 py-3 transition-colors relative ${activeTab === 'main' ? 'text-primary font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('main')}
                        >
                            المعلومات الرئيسية
                            {activeTab === 'main' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>}
                        </button>
                        <button
                            className={`px-6 py-3 transition-colors relative ${activeTab === 'payments' ? 'text-primary font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('payments')}
                        >
                            المدفوعات
                            {activeTab === 'payments' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>}
                        </button>
                    </div>

                    <div className="min-h-[300px]">
                        {activeTab === 'main' && (
                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">العنوان</p>
                                    <p className="font-medium">{selectedCustomer.address || '-'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">الهاتف</p>
                                    <p className="font-medium">{selectedCustomer.phone || '-'}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center mt-4">
                                    <div className="p-2 bg-blue-50 rounded">
                                        <p className="text-xs text-blue-600">المبيعات</p>
                                        <p className="font-bold">{selectedCustomer.totalSales?.toLocaleString()}</p>
                                    </div>
                                    <div className="p-2 bg-green-50 rounded">
                                        <p className="text-xs text-green-600">المدفوع</p>
                                        <p className="font-bold">{selectedCustomer.totalPaid?.toLocaleString()}</p>
                                    </div>
                                    <div className="p-2 bg-red-50 rounded">
                                        <p className="text-xs text-red-600">الباقي</p>
                                        <p className="font-bold">{selectedCustomer.totalRest?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div className="overflow-y-auto max-h-[400px]">
                                <table className="w-full text-sm text-right">
                                    <thead className="text-gray-500 border-b">
                                        <tr>
                                            <th className="pb-2">التاريخ</th>
                                            <th className="pb-2">المبلغ</th>
                                            <th className="pb-2">ملاحظات</th>
                                            <th className="pb-2 text-left">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedCustomer.payments?.map((payment: any, index: number) => (
                                            <tr key={index} className="border-b last:border-0 group">
                                                <td className="py-2" dir="ltr">{new Date(payment.date).toLocaleDateString('en-GB')}</td>
                                                <td className="py-2 font-bold text-green-600">{payment.amount.toLocaleString()}</td>
                                                <td className="py-2 text-gray-500">{payment.notes}</td>
                                                <td className="py-2">
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-start">
                                                        <button onClick={() => openEditPayment(payment)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="تعديل">
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => handlePaymentDelete(payment._id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded" title="حذف">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!selectedCustomer.payments || selectedCustomer.payments.length === 0) && (
                                            <tr><td colSpan={3} className="text-center py-4 text-gray-500">لا توجد مدفوعات</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Payment Modal */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    setEditingPaymentId(null);
                }}
                title={editingPaymentId ? `تعديل دفعة: ${selectedCustomer?.name}` : `تسديد دفعة من الزبون: ${selectedCustomer?.name}`}
            >
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">المبلغ</label>
                        <input
                            type="number"
                            required
                            value={paymentData.amount}
                            onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">التاريخ</label>
                        <input
                            type="date"
                            value={paymentData.date}
                            onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">ملاحظات</label>
                        <textarea
                            value={paymentData.notes}
                            onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
                        {editingPaymentId ? 'حفظ التعديلات' : 'إضافة دفعة'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Customers;
