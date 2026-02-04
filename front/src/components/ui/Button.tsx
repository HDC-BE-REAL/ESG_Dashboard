import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b77f] disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-[#10b77f] hover:bg-[#0e9f6e] text-white shadow-lg shadow-[#10b77f]/20",
                destructive: "text-slate-400 hover:text-red-500 hover:bg-red-50",
                outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
                secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
                ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-500",
                tab: "text-slate-400 hover:text-slate-700 font-medium",
                tabActive: "bg-white text-[#10b77f] shadow-sm ring-1 ring-slate-100 font-bold",

                // Market Specific Buttons
                marketK: "text-slate-500 hover:bg-emerald-50 hover:text-[#10b77f]",
                marketKActive: "bg-[#10b77f]/10 text-[#10b77f] ring-1 ring-[#10b77f]/30",
                marketEU: "text-slate-500 hover:bg-blue-50 hover:text-blue-600",
                marketEUActive: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-8 rounded-lg px-3",
                xs: "h-7 rounded-lg px-2 text-[10px]",
                lg: "h-12 rounded-2xl px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { }

export const Button = ({ className, variant, size, ...props }: ButtonProps) => <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
