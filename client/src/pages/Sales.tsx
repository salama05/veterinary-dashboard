import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';

const Sales = () => {
    const [sales, setSales] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        product: '',
        customer: '',
        quantity: 1,
        price: 0,
        paid: 0,
        date: new Date().toISOString().split('T')[0]
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [salesRes, productsRes, customersRes] = await Promise.all([
                api.get('/sales'),
                api.get('/products'),
                api.get('/customers')
            ]);
            setSales(salesRes.data);
            setProducts(productsRes.data);
            setCustomers(customersRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Update price when product is selected
    useEffect(() => {
        if (formData.product) {
            const prod = products.find(p => p._id === formData.product);
            if (prod) {
                setFormData(prev => ({ ...prev, price: prod.price }));
            }
        }
    }, [formData.product, products]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/sales/${editingId}`, formData);
            } else {
                await api.post('/sales', formData);
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                product: '',
                customer: '',
                quantity: 1,
                price: 0,
                paid: 0,
                date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error occurred');
            console.error(error);
        }
    };

    const handleEdit = (sale: any) => {
        setEditingId(sale._id);
        setFormData({
            product: sale.product?._id || sale.product,
            customer: sale.customer?._id || sale.customer,
            quantity: sale.quantity,
            price: sale.price,
            paid: sale.paid,
            date: sale.date ? new Date(sale.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
            try {
                await api.delete(`/sales/${id}`);
                fetchData();
            } catch (error) {
                console.error(error);
                alert('Error deleting sale');
            }
        }
    };

    const filteredSales = sales.filter(s =>
        s.product?.name.toLowerCase().includes(search.toLowerCase()) ||
        s.customer?.name.toLowerCase().includes(search.toLowerCase())
    );

    const total = formData.quantity * formData.price;
    const rest = total - formData.paid;

    return (
        <div>
            {loading && <div className="text-center p-4">جاري التحميل...</div>}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="بحث في المبيعات..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pr-12 pl-4 py-3 bg-white dark:bg-gray-800 border border-transparent shadow-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            product: '',
                            customer: '',
                            quantity: 1,
                            price: 0,
                            paid: 0,
                            date: new Date().toISOString().split('T')[0]
                        });
                        setIsModalOpen(true);
                    }}
                    className="w-full md:w-auto bg-gradient-to-r from-primary to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-300 font-medium"
                >
                    <Plus className="w-5 h-5 ml-2" />
                    بيع جديد
                </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50/50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="p-5 font-bold text-sm">التاريخ</th>
                                <th className="p-5 font-bold text-sm">المنتج</th>
                                <th className="p-5 font-bold text-sm">الزبون</th>
                                <th className="p-5 font-bold text-sm">العدد</th>
                                <th className="p-5 font-bold text-sm">السعر</th>
                                <th className="p-5 font-bold text-sm">الإجمالي</th>
                                <th className="p-5 font-bold text-sm">المدفوع</th>
                                <th className="p-5 font-bold text-sm">الباقي</th>
                                <th className="p-5 font-bold text-sm">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {filteredSales.map((sale) => (
                                <tr key={sale._id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors duration-200">
                                    <td className="p-5" dir="ltr">
                                        <span className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400 font-medium">
                                            {new Date(sale.date).toLocaleDateString('en-GB')}
                                        </span>
                                    </td>
                                    <td className="p-5 font-medium text-gray-800 dark:text-white">{sale.product?.name || 'محذوف'}</td>
                                    <td className="p-5 text-gray-600 dark:text-gray-300">{sale.customer?.name || 'محذوف'}</td>
                                    <td className="p-5 font-bold">{sale.quantity}</td>
                                    <td className="p-5">{sale.price.toLocaleString()}</td>
                                    <td className="p-5 font-bold text-primary">{sale.total.toLocaleString()}</td>
                                    <td className="p-5 text-emerald-600 font-medium">{sale.paid.toLocaleString()}</td>
                                    <td className="p-5">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${sale.rest > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                            }`}>
                                            {sale.rest.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(sale)}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                                                title="تعديل"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(sale._id)}
                                                className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'تعديل فاتورة مبيعات' : 'إضافة فاتورة مبيعات'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">التاريخ</label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">المنتج</label>
                        <SearchableSelect
                            options={products.map(p => ({ value: p._id, label: `${p.name} (المتوفر: ${p.quantity})` }))}
                            value={formData.product}
                            onChange={(val) => setFormData({ ...formData, product: val })}
                            placeholder="اختر منتج..."
                            loading={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">الزبون</label>
                        <SearchableSelect
                            options={customers.map(c => ({ value: c._id, label: c.name }))}
                            value={formData.customer}
                            onChange={(val) => setFormData({ ...formData, customer: val })}
                            placeholder="اختر زبون..."
                            loading={loading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">الكمية</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">سعر البيع</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">المدفوع</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="any"
                            value={formData.paid}
                            onChange={(e) => setFormData({ ...formData, paid: Number(e.target.value) })}
                            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center px-6">
                        <div className="text-center">
                            <span className="block text-gray-500 text-xs">الإجمالي</span>
                            <span className="font-bold text-lg">{total.toLocaleString()}</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-gray-500 text-xs text-red-500">الباقي</span>
                            <span className="font-bold text-lg text-red-600">{rest.toLocaleString()}</span>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-700 transition">
                        حفظ
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Sales;
