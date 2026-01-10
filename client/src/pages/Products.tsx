import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import Modal from '../components/Modal';

const Products = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products');
            setProducts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData, price: 0, minLimit: 5 };
            if (editingId) {
                await api.put(`/products/${editingId}`, payload);
            } else {
                await api.post('/products', payload);
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ name: '' });
            fetchProducts();
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (product: any) => {
        setEditingId(product._id);
        setFormData({
            name: product.name,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من الحذف؟')) {
            try {
                await api.delete(`/products/${id}`);
                fetchProducts();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {loading && <div className="text-center p-4">جاري التحميل...</div>}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="بحث عن منتج..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pr-12 pl-4 py-3 bg-white dark:bg-gray-800 border border-transparent shadow-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '' });
                        setIsModalOpen(true);
                    }}
                    className="w-full md:w-auto bg-gradient-to-r from-primary to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-300 font-medium"
                >
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة منتج جديد
                </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50/50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="p-5 font-bold text-sm">اسم المنتج</th>

                                <th className="p-5 font-bold text-sm">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {filteredProducts.map((product) => (
                                <tr key={product._id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors duration-200">
                                    <td className="p-5 font-medium text-gray-800 dark:text-white">{product.name}</td>
                                    <td className="p-5">
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                                                title="تعديل"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product._id)}
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
                title={editingId ? 'تعديل منتج' : 'إضافة منتج جديد'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">اسم المنتج</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-700 transition">
                        حفظ
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Products;
