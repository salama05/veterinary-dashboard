import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import SearchableSelect from '../components/SearchableSelect';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO,
    isToday
} from 'date-fns';
import { ar } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Activity, FileText, X, Check, Trash2 } from 'lucide-react';

interface Appointment {
    _id: string;
    customer: { _id: string; name: string; phone: string };
    date: string;
    endTime: string;
    serviceType: string;
    status: 'Scheduled' | 'Confirmed' | 'Cancelled' | 'Completed';
    notes: string;
}

interface Customer {
    _id: string;
    name: string;
    phone: string;
}

const Appointments: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>();
    const [customers, setCustomers] = useState<Customer[]>();
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        customerId: '',
        startTime: '09:00',
        endTime: '09:30',
        serviceType: 'فحص عام',
        status: 'Scheduled',
        notes: ''
    });

    useEffect(() => {
        fetchAppointments();
        fetchCustomers();
    }, [currentDate]);

    const fetchAppointments = async () => {
        try {
            const start = startOfMonth(currentDate).toISOString();
            const end = endOfMonth(currentDate).toISOString();
            const response = await api.get(`/appointments?start=${start}&end=${end}`);
            setAppointments(response.data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const handleDateClick = (day: Date) => {
        setSelectedDate(day);
        setFormData(prev => ({ ...prev }));
        setEditingAppointment(null);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!selectedDate) return;

            if (!formData.customerId) {
                alert('الرجاء اختيار زبون للموعد');
                return;
            }

            // Combine selected date with time
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const startDateTime = new Date(`${dateStr}T${formData.startTime}`);
            const endDateTime = new Date(`${dateStr}T${formData.endTime}`);

            const payload = {
                customer: formData.customerId,
                date: startDateTime,
                endTime: endDateTime,
                serviceType: formData.serviceType,
                status: formData.status,
                notes: formData.notes
            };

            if (editingAppointment) {
                await api.put(`/appointments/${editingAppointment._id}`, payload);
            } else {
                await api.post('/appointments', payload);
            }

            setShowModal(false);
            fetchAppointments();
            resetForm();
        } catch (error: any) {
            console.error('Error saving appointment:', error);
            const message = error.response?.data?.message || 'حدث خطأ أثناء حفظ الموعد';
            alert(message);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
            try {
                await api.delete(`/appointments/${id}`);
                fetchAppointments();
                setShowModal(false);
            } catch (error) {
                console.error('Error deleting appointment:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            customerId: '',
            startTime: '09:00',
            endTime: '09:30',
            serviceType: 'فحص عام',
            status: 'Scheduled',
            notes: ''
        });
        setEditingAppointment(null);
    };

    const openEditModal = (apt: Appointment) => {
        setEditingAppointment(apt);
        setSelectedDate(new Date(apt.date));
        setFormData({
            customerId: apt.customer._id,
            startTime: format(new Date(apt.date), 'HH:mm'),
            endTime: format(new Date(apt.endTime), 'HH:mm'),
            serviceType: apt.serviceType,
            status: apt.status,
            notes: apt.notes || ''
        });
        setShowModal(true);
    };

    // Calendar Generation
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 6 }); // Start on Saturday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 6 });
    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
            case 'Completed': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    /* const getStatusText = (status: string) => {
        switch (status) {
            case 'Confirmed': return 'مؤكد';            case 'Cancelled': return 'ملغى';
            case 'Completed': return 'مكتمل';
            default: return 'قادم';
        }
    }; */

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-8 h-8 text-blue-600" />
                    جدول المواعيد
                </h1>
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="text-lg font-bold text-gray-700 w-40 text-center">
                        {format(currentDate, 'MMMM yyyy', { locale: ar })}
                    </span>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <button
                    onClick={() => handleDateClick(new Date())}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                >
                    <Plus className="w-5 h-5" />
                    موعد جديد
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex-1 flex flex-col border border-gray-100 min-h-[600px]">
                {/* Days Header */}
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {weekDays.map(day => (
                        <div key={day} className="py-3 text-center text-gray-500 font-medium text-sm">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Cells */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {days.map((day) => {
                        const dayAppointments = appointments?.filter(apt =>
                            isSameDay(parseISO(apt.date), day)
                        );

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => handleDateClick(day)}
                                className={`
                                    border-b border-l border-gray-100 p-2 min-h-[100px] cursor-pointer hover:bg-blue-50 transition-colors relative group
                                    ${!isSameMonth(day, monthStart) ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                                    ${isToday(day) ? 'bg-blue-50/30' : ''}
                                `}
                            >
                                <div className={`
                                    text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full
                                    ${isToday(day) ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700'}
                                `}>
                                    {format(day, dateFormat)}
                                </div>

                                <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                    {dayAppointments?.map(apt => (
                                        <div
                                            key={apt._id}
                                            onClick={(e) => { e.stopPropagation(); openEditModal(apt); }}
                                            className={`
                                                text-xs p-1.5 rounded-lg border flex items-center justify-between gap-1 shadow-sm hover:shadow-md transition-all
                                                ${getStatusColor(apt.status)}
                                            `}
                                        >
                                            <span className="truncate font-medium">{format(parseISO(apt.date), 'HH:mm')} - {apt.customer.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Button visible on hover */}
                                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="p-1 bg-white rounded-full shadow-sm text-blue-600 hover:text-blue-700">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm shadow-2xl z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 transform transition-all scale-100">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                {editingAppointment ? 'تعديل موعد' : 'إضافة موعد جديد'}
                                <span className="text-sm font-normal text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                                    {selectedDate && format(selectedDate, 'EEEE d MMMM', { locale: ar })}
                                </span>
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <User className="w-4 h-4 text-blue-500" />
                                    الزبون
                                </label>
                                <SearchableSelect
                                    options={customers?.map(c => ({ value: c._id, label: c.name })) || []}
                                    value={formData.customerId}
                                    onChange={(val) => setFormData({ ...formData, customerId: val })}
                                    placeholder="ابدأ بالكتابة للبحث عن زبون..."
                                    className="w-full"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        من
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        إلى
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Activity className="w-4 h-4 text-blue-500" />
                                        الخدمة
                                    </label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                                        value={formData.serviceType}
                                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                                    >
                                        <option>فحص عام</option>
                                        <option>تطعيم</option>
                                        <option>جراحة</option>
                                        <option>متابعة</option>
                                        <option>استشارة</option>
                                        <option>أخرى</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Check className="w-4 h-4 text-blue-500" />
                                        الحالة
                                    </label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Scheduled">قادم</option>
                                        <option value="Confirmed">مؤكد</option>
                                        <option value="Completed">مكتمل</option>
                                        <option value="Cancelled">ملغى</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    ملاحظات
                                </label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[80px]"
                                    placeholder="أي تفاصيل إضافية..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200"
                                >
                                    حفظ الموعد
                                </button>
                                {editingAppointment && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(editingAppointment._id)}
                                        className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Appointments;
