import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ring-1 ring-inset tracking-wide",
    {
        variants: {
            variant: {
                default: "bg-slate-50 text-slate-600 ring-slate-200",
                success: "bg-[#e7fdf0] text-[#0e9f6e] ring-[#0e9f6e]/20",
                warning: "bg-orange-50 text-orange-700 ring-orange-600/20",
                blue: "bg-blue-50 text-blue-700 ring-blue-700/10",
                purple: "bg-purple-50 text-purple-700 ring-purple-700/10",
                amber: "bg-amber-50 text-amber-700 ring-amber-700/10",
                top: "bg-blue-500 text-white ring-blue-500 shadow-sm shadow-blue-200",
                me: "bg-slate-800 text-white ring-slate-800 shadow-sm",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> { }

export const Badge = ({ className, variant, ...props }: BadgeProps) => <span className={cn(badgeVariants({ variant, className }))} {...props} />;
