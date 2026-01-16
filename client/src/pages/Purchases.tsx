import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import ExportMenu from '../components/ExportMenu';

const Purchases = () => {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState<{
        product: string;
        supplier: string;
        quantity: number | '';
        price: number | '';
        expiryDate: string;
        date: string;
    }>({
        product: '',
        supplier: '',
        quantity: '',
        price: '',
        expiryDate: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleEdit = (purchase: any) => {
        setEditingId(purchase._id);
        setFormData({
            product: purchase.product?._id || '',
            supplier: purchase.supplier?._id || '',
            quantity: purchase.quantity,
            price: purchase.price,
            expiryDate: purchase.expiryDate ? purchase.expiryDate.split('T')[0] : '',
            date: purchase.date ? purchase.date.split('T')[0] : ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            try {
                await api.delete(`/purchases/${id}`);
                alert('تم الحذف بنجاح');
                fetchData();
            } catch (error) {
                console.error(error);
                alert('حدث خطأ أثناء الحذف. قد يكون السجل مرتبطاً ببيانات أخرى أو لديك مشاكل في الاتصال.');
            }
        }
    };

    const fetchData = async () => {
        try {
            const [purchasesRes, productsRes, suppliersRes] = await Promise.all([
                api.get('/purchases'),
                api.get('/products'),
                api.get('/suppliers')
            ]);
            setPurchases(purchasesRes.data);
            setProducts(productsRes.data);
            setSuppliers(suppliersRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                quantity: Number(formData.quantity) || 0,
                price: Number(formData.price) || 0
            };

            if (editingId) {
                await api.put(`/purchases/${editingId}`, payload);
            } else {
                await api.post('/purchases', payload);
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                product: '',
                supplier: '',
                quantity: '',
                price: '',
                expiryDate: '',
                date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const filteredPurchases = purchases.filter(p =>
        p.product?.name.toLowerCase().includes(search.toLowerCase()) ||
        p.supplier?.name.toLowerCase().includes(search.toLowerCase())
    );

    const total = (Number(formData.quantity) || 0) * (Number(formData.price) || 0);

    return (
        <div>
            {loading && <div className="text-center p-4">جاري التحميل...</div>}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex gap-2 w-full md:w-auto items-center">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="بحث في المشتريات..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pr-12 pl-4 py-3 bg-white dark:bg-gray-800 border border-transparent shadow-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <ExportMenu
                        data={filteredPurchases}
                        fileName="purchases"
                        columns={[
                            { key: 'date', label: 'التاريخ', formatter: (val) => new Date(val).toLocaleDateString('en-GB') },
                            { key: 'product.name', label: 'المنتج', formatter: (val) => val || 'محذوف' },
                            { key: 'supplier.name', label: 'المورد' },
                            { key: 'quantity', label: 'العدد' },
                            { key: 'price', label: 'السعر' },
                            { key: 'total', label: 'الإجمالي', formatter: (_, item) => item.total?.toLocaleString() || ((item.quantity || 0) * (item.price || 0)).toLocaleString() },
                            { key: 'expiryDate', label: 'الصلاحية', formatter: (val) => val ? new Date(val).toLocaleDateString('en-GB') : '-' }
                        ]}
                        label="تصدير"
                    />
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            product: '',
                            supplier: '',
                            quantity: '',
                            price: '',
                            date: new Date().toISOString().split('T')[0],
                            expiryDate: ''
                        });
                        setIsModalOpen(true);
                    }}
                    className="w-full md:w-auto bg-gradient-to-r from-primary to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-300 font-medium"
                >
                    <Plus className="w-5 h-5 ml-2" />
                    شراء جديد
                </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50/50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="p-5 font-bold text-sm">التاريخ</th>
                                <th className="p-5 font-bold text-sm">المنتج</th>
                                <th className="p-5 font-bold text-sm">المورد</th>
                                <th className="p-5 font-bold text-sm">العدد</th>
                                <th className="p-5 font-bold text-sm">السعر</th>
                                <th className="p-5 font-bold text-sm">الإجمالي</th>
                                <th className="p-5 font-bold text-sm">الصلاحية</th>
                                <th className="p-5 font-bold text-sm">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {filteredPurchases.map((purchase) => (
                                <tr key={purchase._id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors duration-200">
                                    <td className="p-5" dir="ltr">
                                        <span className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400 font-medium">
                                            {new Date(purchase.date).toLocaleDateString('en-GB')}
                                        </span>
                                    </td>
                                    <td className="p-5 font-medium text-gray-800 dark:text-white">{purchase.product?.name || 'محذوف'}</td>
                                    <td className="p-5 text-gray-600 dark:text-gray-300">{purchase.supplier?.name || 'محذوف'}</td>
                                    <td className="p-5 font-bold">{purchase.quantity}</td>
                                    <td className="p-5">{purchase.price.toLocaleString()}</td>
                                    <td className="p-5 font-bold text-primary">{purchase.total.toLocaleString()}</td>
                                    <td className="p-5" dir="ltr">
                                        {purchase.expiryDate ? new Date(purchase.expiryDate).toLocaleDateString('en-GB') : '-'}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(purchase)}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                                                title="تعديل"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(purchase._id, e)}
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
                title={editingId ? 'تعديل فاتورة مشتريات' : 'إضافة فاتورة مشتريات'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                            <label className="block text-sm font-medium mb-1">تاريخ الصلاحية</label>
                            <input
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">المنتج</label>
                        <SearchableSelect
                            options={products.map(p => ({ value: p._id, label: p.name }))}
                            value={formData.product}
                            onChange={(val) => setFormData({ ...formData, product: val })}
                            placeholder="اختر منتج..."
                            loading={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">المورد</label>
                        <SearchableSelect
                            options={suppliers.map(s => ({ value: s._id, label: s.name }))}
                            value={formData.supplier}
                            onChange={(val) => setFormData({ ...formData, supplier: val })}
                            placeholder="اختر مورد..."
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
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value === '' ? '' : Number(e.target.value) })}
                                className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">سعر الشراء (للقطعة)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? '' : Number(e.target.value) })}
                                className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <span className="text-gray-500 text-sm">الإجمالي: </span>
                        <span className="font-bold text-lg text-primary">
                            {total.toLocaleString()} د.ج
                        </span>
                    </div>

                    <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-700 transition">
                        حفظ
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Purchases;
