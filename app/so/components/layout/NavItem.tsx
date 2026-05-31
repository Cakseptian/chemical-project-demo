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
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-6 py-3 transition-all duration-200 rounded-full group ${isActive
                ? "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                : "text-white/40 hover:bg-white/5 hover:text-white/80"
            }`}
    >
        <span className={`text-xl transition-transform group-hover:scale-110 flex items-center justify-center w-6 h-6 ${isActive ? "opacity-100" : "opacity-40 group-hover:opacity-80"
            }`}>
            {icon}
        </span>
        <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
);