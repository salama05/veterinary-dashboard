import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    loading?: boolean;
    error?: string | null;
    className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'اختر...',
    loading = false,
    error = null,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                onClick={() => !loading && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-800 transition-all shadow-sm cursor-pointer hover:border-primary/50 group ${isOpen ? 'ring-2 ring-primary/20 border-primary' : 'border'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-800 dark:text-gray-100 font-medium'}`}>
                    {loading ? 'جاري التحميل...' : (selectedOption ? selectedOption.label : placeholder)}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl z-10">
                        <div className="relative group">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primary" />
                            <input
                                type="text"
                                autoFocus
                                placeholder="ابحث هنا..."
                                className="w-full pr-10 pl-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            {searchTerm && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                                >
                                    <X className="w-3 h-3 text-gray-500" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm ${value === opt.value
                                            ? 'bg-primary/10 text-primary font-bold'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {value === opt.value && <Check className="w-4 h-4" />}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-sm text-gray-500 italic">
                                {searchTerm ? 'لا توجد نتائج مطابقة' : 'لا توجد خيارات متاحة'}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};

export default SearchableSelect;
