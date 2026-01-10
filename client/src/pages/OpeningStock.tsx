import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Search, Sparkles, Archive, Calendar, Package, DollarSign, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';

const OpeningStock = () => {
    const [stocks, setStocks] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        openingDate: new Date().toISOString().split('T')[0],
        product: '',
        quantity: 1,
        expiryDate: '',
        source: '',
        price: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchStocks = async () => {
        try {
            const stocksRes = await api.get('/opening-stocks');
            setStocks(stocksRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        setProductsLoading(true);
        setProductsError(null);
        try {
            const productsRes = await api.get('/products');
            setProducts(productsRes.data);
        } catch (error: any) {
            console.error(error);
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'تعذر تحميل المنتجات';
            setProductsError(message);
            setProducts([]);
        } finally {
            setProductsLoading(false);
        }
    };

    useEffect(() => {
        fetchStocks();
        fetchProducts();
    }, []);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.product) {
            alert('الرجاء اختيار منتج من القائمة');
            return;
        }
        try {
            const payload = {
                ...formData,
                quantity: Number(formData.quantity),
                price: formData.price ? Number(formData.price) : undefined
            };

            if (editingId) {
                await api.put(`/opening-stocks/${editingId}`, payload);
            } else {
                await api.post('/opening-stocks', payload);
            }

            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                openingDate: new Date().toISOString().split('T')[0],
                product: '',
                quantity: 1,
                expiryDate: '',
                source: '',
                price: ''
            });
            fetchStocks();
        } catch (error: any) {
            console.error('Error detail:', error);
            const message = error?.response?.data?.message || error.message || 'حدث خطأ أثناء الحفظ';
            alert(message);
        }
    };

    const handleEdit = (stock: any) => {
        setEditingId(stock._id);
        setFormData({
            openingDate: stock.openingDate ? new Date(stock.openingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            product: stock.product?._id || stock.product,
            quantity: stock.quantity,
            expiryDate: stock.expiryDate ? new Date(stock.expiryDate).toISOString().split('T')[0] : '',
            source: stock.source || '',
            price: stock.price?.toString() || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا السجل؟ سيتم خصم الكمية من المخزن.')) {
            try {
                await api.delete(`/opening-stocks/${id}`);
                fetchStocks();
            } catch (error: any) {
                alert(error?.response?.data?.message || 'Error deleting opening stock');
            }
        }
    };

    const filteredStocks = stocks.filter(s =>
        s.productName?.toLowerCase().includes(search.toLowerCase()) ||
        s.source?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {loading && <div className="text-center p-4">جاري التحميل...</div>}

            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="بحث في المخزون الافتتاحي..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pr-12 pl-4 py-3 bg-white dark:bg-gray-800 border border-transparent shadow-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>
                <button
                    onClick={() => {
                        setIsModalOpen(true);
                        setEditingId(null); // Ensure we're in add mode
                        setFormData({ // Reset form for new entry
                            openingDate: new Date().toISOString().split('T')[0],
                            product: '',
                            quantity: 1,
                            expiryDate: '',
                            source: '',
                            price: ''
                        });
                        if (products.length === 0 && !productsLoading) fetchProducts();
                    }}
                    className="w-full md:w-auto bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-3 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-300 font-medium"
                >
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة مخزون افتتاحي
                </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden shadow-xl border border-white/20">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50/50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="p-5 font-bold text-sm">تاريخ الافتتاح</th>
                                <th className="p-5 font-bold text-sm">اسم المنتج</th>
                                <th className="p-5 font-bold text-sm">الكمية</th>
                                <th className="p-5 font-bold text-sm">المصدر</th>
                                <th className="p-5 font-bold text-sm">تاريخ الانتهاء</th>
                                <th className="p-5 font-bold text-sm">السعر المقدر</th>
                                <th className="p-5 font-bold text-sm">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {filteredStocks.map((stock) => (
                                <tr key={stock._id} className="group hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors duration-200">
                                    <td className="p-5" dir="ltr">
                                        <span className="text-sm bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-blue-600 dark:text-blue-400 font-medium">
                                            {stock.openingDate ? new Date(stock.openingDate).toLocaleDateString('en-GB') : '-'}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                                <Package className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <span className="font-semibold text-gray-800 dark:text-gray-100">{stock.productName}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="font-bold text-lg">{stock.quantity}</span>
                                    </td>
                                    <td className="p-5 text-gray-600 dark:text-gray-400">{stock.source || '-'}</td>
                                    <td className="p-5" dir="ltr">
                                        {stock.expiryDate ? (
                                            <span className="text-sm text-gray-500">{new Date(stock.expiryDate).toLocaleDateString('en-GB')}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-5 font-medium text-emerald-600 dark:text-emerald-400">
                                        {stock.price ? `${stock.price.toLocaleString()} د.ج` : '-'}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(stock)}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                                                title="تعديل"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(stock._id)}
                                                className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStocks.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-gray-500 italic">
                                        لا توجد سجلات مخزون افتتاحي حالياً
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                }}
                title={editingId ? 'تعديل رصيد أول المدة' : 'إضافة مخزون افتتاحي (منتجات قديمة)'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <Calendar className="w-4 h-4 text-primary" />
                                تاريخ الافتتاح
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.openingDate}
                                onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })}
                                className="w-full border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-gray-800 transition-all shadow-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <Calendar className="w-4 h-4 text-rose-500" />
                                تاريخ الصلاحية المقدر
                            </label>
                            <input
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                className="w-full border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-gray-800 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <Package className="w-4 h-4 text-indigo-500" />
                            اسم المنتج
                        </label>
                        <SearchableSelect
                            options={products.map(p => ({ value: p._id, label: p.name }))}
                            value={formData.product}
                            onChange={(val) => setFormData({ ...formData, product: val })}
                            placeholder="اختر منتج من القائمة..."
                            loading={productsLoading}
                            error={productsError}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <Archive className="w-4 h-4 text-orange-500" />
                                العدد الفعلي الموجود
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                step="any"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                className="w-full border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-gray-800 transition-all shadow-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <DollarSign className="w-4 h-4 text-emerald-500" />
                                السعر المقدر (اختياري)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-gray-800 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            مصدر المنتج (مثال: شراء قديم، تبرع)
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="أدخل المصدر..."
                            value={formData.source}
                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                            className="w-full border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-gray-800 transition-all shadow-sm"
                        />
                    </div>



                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white py-4 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all font-bold text-lg flex items-center justify-center gap-2"
                        >
                            <Archive className="w-5 h-5" />
                            إضافة إلى المخزون الرئيسي
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default OpeningStock;
