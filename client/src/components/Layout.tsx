import React, { useContext } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Stethoscope,
    BadgeDollarSign,
    Users,
    PieChart,
    Contact,
    Warehouse,
    LogOut,
    Menu,
    ChevronRight,
    UserCircle,
    History,
    ClipboardList,
    Calendar
} from 'lucide-react';

const Layout = () => {
    const { user, logout } = useContext(AuthContext)!;
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = React.useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    if (!user) {
        return null;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'لوحة التحكم', path: '/', icon: LayoutDashboard },
        { name: 'المنتجات', path: '/products', icon: Package },
        { name: 'المخزون الافتتاحي', path: '/opening-stock', icon: History },
        { name: 'المشتريات', path: '/purchases', icon: ShoppingCart },
        { name: 'العلاج', path: '/treatments', icon: Stethoscope },
        { name: 'المبيعات', path: '/sales', icon: BadgeDollarSign },
        { name: 'الموردين', path: '/suppliers', icon: Users },
        { name: 'الزبائن', path: '/customers', icon: Contact },
        { name: 'المنتجات المستهلكة', path: '/consumed-products', icon: ClipboardList },
        { name: 'المواعيد', path: '/appointments', icon: Calendar },
        { name: 'التحليل والاحصائيات', path: '/analysis', icon: PieChart },
        { name: 'المخزون', path: '/inventory', icon: Warehouse },
    ];

    return (
        <div className="flex h-screen overflow-hidden rtl">
            {/* Glassmorphism Sidebar */}
            <aside
                className={`glass border-l border-white/20 transition-all duration-300 flex flex-col z-20
        ${sidebarOpen ? 'w-72' : 'w-24'} hidden lg:flex`}
            >
                <div className="p-6 flex items-center justify-between border-b border-gray-100/10 dark:border-gray-700/30">
                    <div className={`flex items-center gap-3 transition-opacity duration-200 ${!sidebarOpen && 'hidden'}`}>
                        <div className="w-10 h-10 bg-gradient-to-tr from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Stethoscope className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-xl text-primary tracking-tight">سلامة VET</h1>
                            <span className="text-xs text-gray-500 font-medium tracking-wide">لوحة التحكم</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-white/50 transition-colors"
                    >
                        {sidebarOpen ? <ChevronRight className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 scrollbar-thin">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-4 py-3.5 mx-1 rounded-xl transition-all duration-200 group relative overflow-hidden
                                ${isActive
                                        ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-indigo-500/30 translate-x-1'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/40 hover:text-primary'}
                                `}
                            >
                                <Icon className={`w-5 h-5 min-w-[1.25rem] transition-colors ${isActive ? 'text-white' : 'group-hover:text-primary'}`} />
                                <span className={`mr-3 font-medium whitespace-nowrap transition-all duration-200 ${!sidebarOpen && 'hidden opacity-0'}`}>
                                    {item.name}
                                </span>
                                {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 mx-4 mb-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-gray-600">
                    <div className={`flex items-center gap-3 ${!sidebarOpen ? 'justify-center' : ''}`}>
                        <div className="w-10 h-10 bg-white dark:bg-slate-600 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                            <UserCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div className={`overflow-hidden transition-all duration-200 ${!sidebarOpen && 'hidden w-0'}`}>
                            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user.username}</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
                            <div className="mt-1 px-2 py-0.5 bg-primary/10 rounded text-[10px] text-primary font-mono truncate">
                                عيادة: {user.clinicId}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`mt-3 flex items-center justify-center w-full px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors text-sm font-medium
                        ${!sidebarOpen ? 'px-0' : ''}`}
                    >
                        <LogOut className="w-4 h-4" />
                        <span className={`mr-2 ${!sidebarOpen && 'hidden'}`}>تسجيل خروج</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Navigation Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Navigation Drawer */}
            <aside className={`fixed top-0 right-0 h-full w-72 glass border-l border-white/20 transform transition-transform duration-300 z-50 lg:hidden flex flex-col ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <div className="p-6 flex items-center justify-between border-b border-gray-100/10 dark:border-gray-700/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Stethoscope className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-xl text-primary tracking-tight">سلامة VET</h1>
                            <span className="text-xs text-gray-500 font-medium tracking-wide">لوحة التحكم</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-white/50 transition-colors"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 scrollbar-thin">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center px-4 py-3.5 mx-1 rounded-xl transition-all duration-200 group relative overflow-hidden
                                ${isActive
                                        ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-indigo-500/30 translate-x-1'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/40 hover:text-primary'}`}
                            >
                                <Icon className={`w-5 h-5 min-w-[1.25rem] transition-colors ${isActive ? 'text-white' : 'group-hover:text-primary'}`} />
                                <span className="mr-3 font-medium whitespace-nowrap">
                                    {item.name}
                                </span>
                                {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 mx-4 mb-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-slate-600 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                            <UserCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user.username}</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
                            <div className="mt-1 px-2 py-0.5 bg-primary/10 rounded text-[10px] text-primary font-mono truncate">
                                عيادة: {user.clinicId}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-3 flex items-center justify-center w-full px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4 ml-2" />
                        تسجيل خروج
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative scroll-smooth">


                <div className="p-8 max-w-7xl mx-auto">
                    {/* Mobile Header */}
                    <header className="lg:hidden mb-6 flex justify-between items-center">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-white/50 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-tr from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Stethoscope className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg text-primary tracking-tight">سلامة VET</h1>
                            </div>
                        </div>
                    </header>

                    <header className="mb-8 flex justify-between items-end">
                        <div>
                            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-500 bg-clip-text text-transparent dark:text-white mb-2">
                                {navItems.find(i => i.path === location.pathname)?.name || 'لوحة التحكم'}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                نظرة عامة على أداء عيادتك اليوم
                            </p>
                        </div>
                        <div className="glass px-4 py-2 rounded-full text-sm font-medium text-primary hidden lg:block">
                            {new Date().toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </header>

                    <div className="animate-fade-in-up">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
