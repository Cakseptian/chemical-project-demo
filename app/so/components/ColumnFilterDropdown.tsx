"use client";
// app/so/components/ColumnFilterDropdown.tsx
import { useState, useRef, useEffect } from "react";

export interface ColumnFilterDropdownProps {
    label: string;
    colKey: string;
    options: string[];
    selected: Set<string>;
    onToggle: (val: string) => void;
    onSelectAll: () => void;
    onClear: () => void;
    activeFilter: string | null;
    setActiveFilter: (key: string | null) => void;
}

export const ColumnFilterDropdown = ({
    label, colKey, options, selected, onToggle, onSelectAll, onClear,
    activeFilter, setActiveFilter,
}: ColumnFilterDropdownProps) => {
    const isOpen = activeFilter === colKey;
    const isFiltered = selected.size > 0 && selected.size < options.length;
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLSpanElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        if (!isOpen) { setSearch(""); return; }
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setActiveFilter(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen, setActiveFilter]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOpen) {
            setActiveFilter(null);
        } else {
            if (btnRef.current) {
                const rect = btnRef.current.getBoundingClientRect();
                setDropdownPos({
                    top: rect.bottom + 4,
                    left: rect.left + rect.width / 2,
                });
            }
            setActiveFilter(colKey);
        }
    };

    const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

    return (
        <span ref={ref} className="relative inline-flex ml-1 align-middle" onClick={e => e.stopPropagation()}>
            <button
                ref={btnRef}
                type="button"
                onClick={handleToggle}
                aria-label={`Filter ${label}`}
                className={`w-4 h-4 rounded flex items-center justify-center transition-colors focus:outline-none ${
                    isFiltered
                        ? "text-[#00ed64] bg-[#00ed64]/10 border border-[#00ed64]/30"
                        : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
                }`}
                title={isFiltered ? `${selected.size} filter aktif` : `Filter ${label}`}
            >
                <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1.5 2h13l-5 6v5l-3-1.5V8L1.5 2z" />
                </svg>
            </button>

            {isOpen && dropdownPos && (
                <div
                    style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, transform: "translateX(-50%)", zIndex: 9999 }}
                    className="w-52 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Search */}
                    <div className="px-3 pt-2.5 pb-2 border-b border-slate-100">
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#00ed64] focus:border-[#00ed64] placeholder:text-slate-400"
                            autoFocus
                            onClick={e => e.stopPropagation()}
                        />
                    </div>

                    {/* Select All / Clear */}
                    <div className="px-3 py-1.5 flex gap-2 border-b border-slate-100 bg-slate-50/50">
                        <button type="button" onClick={onSelectAll}
                            className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                            Semua
                        </button>
                        <span className="text-slate-300">·</span>
                        <button type="button" onClick={onClear}
                            className="text-[10px] font-semibold text-slate-500 hover:text-red-500 transition-colors">
                            Hapus filter
                        </button>
                        {isFiltered && (
                            <span className="ml-auto text-[10px] font-bold text-[#00ed64]">{selected.size} dipilih</span>
                        )}
                    </div>

                    {/* Options */}
                    <div className="max-h-48 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <p className="px-3 py-3 text-xs text-slate-400 text-center">Tidak ada hasil</p>
                        ) : filtered.map(opt => (
                            <label key={opt} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selected.size === 0 || selected.has(opt)}
                                    onChange={() => onToggle(opt)}
                                    className="w-3.5 h-3.5 rounded border-slate-300 accent-[#00ed64] cursor-pointer"
                                    onClick={e => e.stopPropagation()}
                                />
                                <span className="text-xs text-slate-700 truncate group-hover:text-slate-900">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </span>
    );
};
