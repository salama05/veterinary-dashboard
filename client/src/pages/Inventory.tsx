import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Search, AlertTriangle, CheckCircle } from 'lucide-react';

const Inventory = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
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
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const getStatus = (qty: number) => {
        if (qty === 0) return { label: 'نفد (خطر)', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
        if (qty <= 5) return { label: 'منخفض', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle };
        return { label: 'جيد', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    };

    return (
        <div>
            {loading && <div className="text-center p-4">جاري التحميل...</div>}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="بحث في المخزون..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pr-12 pl-4 py-3 bg-white dark:bg-gray-800 border border-transparent shadow-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50/50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="p-5 font-bold text-sm">اسم المنتج</th>
                                <th className="p-5 font-bold text-sm">الكمية الحالية</th>

                                <th className="p-5 font-bold text-sm">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {filteredProducts.map((product) => {
                                const status = getStatus(product.quantity);
                                const StatusIcon = status.icon;
                                return (
                                    <tr key={product._id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors duration-200">
                                        <td className="p-5 font-medium text-gray-800 dark:text-white">{product.name}</td>
                                        <td className="p-5 font-bold">{product.quantity}</td>

                                        <td className="p-5">
                                            <span className={`flex items-center w-fit px-3 py-1 rounded-full text-xs font-bold shadow-sm ${status.color}`}>
                                                <StatusIcon className="w-3 h-3 ml-1" />
                                                {status.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
