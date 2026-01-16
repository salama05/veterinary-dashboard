import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';

export interface ColumnDefinition {
    key: string;
    label: string;
    // Optional formatter function for complex data
    formatter?: (value: any, item: any) => any;
}

interface ExportMenuProps {
    data: any[];
    fileName: string;
    columns: ColumnDefinition[];
    label?: string;
}

const ExportMenu: React.FC<ExportMenuProps> = ({ data, fileName, columns, label = 'تصدير البيانات' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const prepareData = () => {
        return data.map(item => {
            const row: any = {};
            columns.forEach(col => {
                const value = col.key.split('.').reduce((o, i) => (o ? o[i] : undefined), item);
                row[col.label] = col.formatter ? col.formatter(value, item) : (value ?? '');
            });
            return row;
        });
    };

    const handleExportCSV = () => {
        if (!data.length) {
            alert('لا توجد بيانات للتصدير');
            return;
        }

        const preparedData = prepareData();
        const worksheet = XLSX.utils.json_to_sheet(preparedData);
        const csv = XLSX.utils.sheet_to_csv(worksheet);

        // Add BOM for Arabic support in Excel
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const dateStr = new Date().toISOString().split('T')[0];

        link.setAttribute("href", url);
        link.setAttribute("download", `${fileName}_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsOpen(false);
    };

    const handleExportExcel = () => {
        if (!data.length) {
            alert('لا توجد بيانات للتصدير');
            return;
        }

        const preparedData = prepareData();
        const worksheet = XLSX.utils.json_to_sheet(preparedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        // Set RTL direction for the sheet
        if (!worksheet['!views']) worksheet['!views'] = [];
        worksheet['!views'].push({ rightToLeft: true });

        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `${fileName}_${dateStr}.xlsx`);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm font-medium text-sm"
                title={label}
            >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-56 origin-top-left bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden transform transition-all animate-in fade-in slide-in-from-top-2">
                    <div className="py-1">
                        <button
                            onClick={handleExportCSV}
                            className="group flex w-full items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <FileText className="mr-3 h-5 w-5 text-gray-400 group-hover:text-emerald-500" />
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="font-medium">Export to CSV</span>
                                <span className="text-xs text-gray-400">ملف نصي (الافتراضي)</span>
                            </div>
                        </button>
                    </div>
                    <div className="py-1">
                        <button
                            onClick={handleExportExcel}
                            className="group flex w-full items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <FileSpreadsheet className="mr-3 h-5 w-5 text-gray-400 group-hover:text-green-600" />
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="font-medium">Export to Excel</span>
                                <span className="text-xs text-gray-400">ملف إكسل (.xlsx)</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportMenu;
