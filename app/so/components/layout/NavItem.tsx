// app/so/components/layout/NavItem.tsx
"use client";

interface NavItemProps {
    id: string;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

export const NavItem = ({ id, icon, label, isActive, onClick }: NavItemProps) => (
    <button type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors duration-200 rounded-md group text-left ${isActive
                ? "bg-[#00ed64] text-[#001e2b] font-bold shadow-md"
                : "text-white/60 hover:bg-white/5 hover:text-white/90"
            }`}
    >
        <span className={`w-4 h-4 transition-transform group-hover:scale-105 flex items-center justify-center flex-shrink-0 ${isActive ? "text-[#001e2b]" : "text-white/40 group-hover:text-white/70"
            }`}>
            {icon}
        </span>
        <span className="text-sm font-semibold">{label}</span>
    </button>
);