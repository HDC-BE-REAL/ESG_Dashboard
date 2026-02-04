import React, { useRef, useEffect } from 'react';
import { cn } from './utils';

interface DropdownProps {
    isOpen: boolean;
    onClose: () => void;
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
    width?: string;
    className?: string; // For the container
}

export const Dropdown: React.FC<DropdownProps> = ({
    isOpen,
    onClose,
    trigger,
    children,
    align = 'left',
    width = 'w-56',
    className
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle click outside (optional if we use the fixed backdrop method, but ref is cleaner for advanced use)
    // For now, we'll stick to the fixed backdrop method used in the original code for simplicity and robustness

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            {trigger}

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={onClose} />
                    <div
                        className={cn(
                            "absolute top-full mt-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200",
                            width,
                            align === 'right' ? 'right-0' : 'left-0'
                        )}
                    >
                        {children}
                    </div>
                </>
            )}
        </div>
    );
};
