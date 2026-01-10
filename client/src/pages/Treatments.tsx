import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';

const Treatments = () => {
    const [treatments, setTreatments] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        treatmentName: '',
        customer: '',
        quantity: 1,
        price: 0,
        paid: 0,
        date: new Date().toISOString().split('T')[0]
    });
    const [customAnimal, setCustomAnimal] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [treatmentsRes, customersRes] = await Promise.all([
                api.get('/treatments'),
                api.get('/customers')
            ]);
            setTreatments(treatmentsRes.data);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const treatmentData = {
                ...formData,
                treatmentName: formData.treatmentName === 'أخرى' ? customAnimal : formData.treatmentName
            };
            if (editingId) {
                await api.put(`/treatments/${editingId}`, treatmentData);
            } else {
                await api.post('/treatments', treatmentData);
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                treatmentName: '',
                customer: '',
                quantity: 1,
                price: 0,
                paid: 0,
                date: new Date().toISOString().split('T')[0]
            });
            setCustomAnimal('');
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Error saving treatment');
        }
    };

    const handleEdit = (treatment: any) => {
        setEditingId(treatment._id);
        setFormData({
            treatmentName: treatment.treatmentName,
            customer: treatment.customer?._id || treatment.customer,
            quantity: treatment.quantity,
            price: treatment.price,
            paid: treatment.paid,
            date: treatment.date ? new Date(treatment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setCustomAnimal('');
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العلاج؟')) {
            try {
                await api.delete(`/treatments/${id}`);
                fetchData();
            } catch (error) {
                console.error(error);
                alert('Error deleting treatment');
            }
        }
    };

    const filteredTreatments = treatments.filter(t =>
        t.treatmentName.toLowerCase().includes(search.toLowerCase()) ||
        t.customer?.name.toLowerCase().includes(search.toLowerCase())
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
                        placeholder="بحث في العلاجات..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pr-12 pl-4 py-3 bg-white dark:bg-gray-800 border border-transparent shadow-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            treatmentName: '',
                            customer: '',
                            quantity: 1,
                            price: 0,
                            paid: 0,
                            date: new Date().toISOString().split('T')[0]
                        });
                        setCustomAnimal('');
                        setIsModalOpen(true);
                    }}
                    className="w-full md:w-auto bg-gradient-to-r from-primary to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-300 font-medium"
                >
                    <Plus className="w-5 h-5 ml-2" />
                    علاج جديد
                </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50/50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="p-5 font-bold text-sm">التاريخ</th>
                                <th className="p-5 font-bold text-sm">اسم العلاج</th>
                                <th className="p-5 font-bold text-sm">الزبون</th>
                                <th className="p-5 font-bold text-sm">العدد/الكمية</th>
                                <th className="p-5 font-bold text-sm">السعر</th>
                                <th className="p-5 font-bold text-sm">الإجمالي</th>
                                <th className="p-5 font-bold text-sm">المدفوع</th>
                                <th className="p-5 font-bold text-sm">الباقي</th>
                                <th className="p-5 font-bold text-sm">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {filteredTreatments.map((treatment) => (
                                <tr key={treatment._id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors duration-200">
                                    <td className="p-5" dir="ltr">
                                        <span className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400 font-medium">
                                            {new Date(treatment.date).toLocaleDateString('en-GB')}
                                        </span>
                                    </td>
                                    <td className="p-5 font-medium text-gray-800 dark:text-white">{treatment.treatmentName}</td>
                                    <td className="p-5 text-gray-600 dark:text-gray-300">{treatment.customer?.name || 'محذوف'}</td>
                                    <td className="p-5 font-bold">{treatment.quantity}</td>
                                    <td className="p-5">{treatment.price.toLocaleString()}</td>
                                    <td className="p-5 font-bold text-primary">{treatment.total.toLocaleString()}</td>
                                    <td className="p-5 text-emerald-600 font-medium">{treatment.paid.toLocaleString()}</td>
                                    <td className="p-5">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${treatment.rest > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                            }`}>
                                            {treatment.rest.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(treatment)}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                                                title="تعديل"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(treatment._id)}
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
                title={editingId ? 'تعديل علاج' : 'إضافة علاج'}
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
                        <label className="block text-sm font-medium mb-1">اسم العلاج (نوع الحيوان)</label>
                        <select
                            required={formData.treatmentName !== 'أخرى'}
                            value={formData.treatmentName === 'أخرى' || ['أبقار', 'أغنام', 'ماعز', 'إبل', 'خيول', 'كلاب', 'قطط', 'طيور', 'دواجن', 'أرانب'].includes(formData.treatmentName) ? formData.treatmentName : 'أخرى'}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === 'أخرى') {
                                    setFormData({ ...formData, treatmentName: 'أخرى' });
                                    setCustomAnimal('');
                                } else {
                                    setFormData({ ...formData, treatmentName: value });
                                    setCustomAnimal('');
                                }
                            }}
                            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary bg-white"
                        >
                            <option value="">اختر نوع الحيوان...</option>
                            <option value="أبقار">أبقار</option>
                            <option value="أغنام">أغنام</option>
                            <option value="ماعز">ماعز</option>
                            <option value="إبل">إبل</option>
                            <option value="خيول">خيول</option>
                            <option value="دواجن">دواجن</option>
                            <option value="أرانب">أرانب</option>
                            <option value="كلاب">كلاب</option>
                            <option value="قطط">قطط</option>
                            <option value="طيور">طيور</option>
                            <option value="أخرى">أخرى (أدخل يدوياً)</option>
                        </select>
                        {formData.treatmentName === 'أخرى' && (
                            <input
                                type="text"
                                required
                                value={customAnimal}
                                onChange={(e) => setCustomAnimal(e.target.value)}
                                className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary mt-2"
                                placeholder="أدخل نوع الحيوان..."
                            />
                        )}
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
                            <label className="block text-sm font-medium mb-1">العدد / الجرعة</label>
                            <input
                                type="number"
                                required
                                min="0.1"
                                step="0.1"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">السعر</label>
                            <input
                                type="number"
                                required
                                min="0"
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

export default Treatments;
