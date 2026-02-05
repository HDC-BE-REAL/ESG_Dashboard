import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

// Card Variants
export const cardVariants = cva(
    "rounded-[32px] border transition-all duration-500",
    {
        variants: {
            variant: {
                default: "bg-white border-slate-100 shadow-sm",
                glass: "glass-effect",
                dark: "bg-slate-900 text-white border-slate-800 shadow-2xl",
                active: "bg-white border-blue-200 shadow-2xl shadow-blue-500/10 ring-4 ring-blue-50/50",
                hoverable: "bg-white border-slate-100 shadow-sm hover-lift cursor-pointer",
            },
            padding: {
                default: "p-6",
                lg: "p-8",
                xl: "p-10",
                none: "p-0",
            },
        },
        defaultVariants: {
            variant: "default",
            padding: "default",
        },
    }
);

export interface CardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> { }

export function Card({ className, variant, padding, children, ...props }: CardProps) {
    return (
        <div className={cn(cardVariants({ variant, padding }), className)} {...props}>
            {children}
        </div>
    );
}

// Button Variants
export const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-bold transition-all duration-300 active:scale-95 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 gap-2",
    {
        variants: {
            variant: {
                default: "bg-slate-900 text-white hover:grad-blue shadow-lg shadow-blue-500/20",
                outline: "border-2 border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200",
                ghost: "hover:bg-slate-100/50 hover:backdrop-blur-sm",
                tab: "px-6 py-2.5 text-xs text-slate-400 hover:text-slate-600 transition-colors",
                tabActive: "px-6 py-2.5 text-xs bg-white shadow-xl shadow-blue-500/10 text-blue-600 font-black",
                gradient: "text-white grad-blue shadow-xl shadow-blue-500/20 hover:opacity-90",
            },
            size: {
                default: "h-12 px-7",
                sm: "h-10 px-5 text-xs",
                lg: "h-16 px-10 text-base",
                icon: "h-12 w-12",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { }

export function Button({ className, variant, size, children, ...props }: ButtonProps) {
    return (
        <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
            {children}
        </button>
    );
}

// Badge Variants
export const badgeVariants = cva(
    "inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm",
    {
        variants: {
            variant: {
                default: "bg-slate-100 text-slate-600",
                success: "bg-emerald-50 text-emerald-600 border border-emerald-100",
                warning: "bg-orange-50 text-orange-600 border border-orange-100",
                danger: "bg-red-50 text-red-600 border border-red-100",
                blue: "bg-blue-50 text-blue-600 border border-blue-100",
                purple: "bg-purple-50 text-purple-600 border border-purple-100",
                amber: "bg-amber-50 text-amber-600 border border-amber-100",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> { }

export function Badge({ className, variant, children, ...props }: BadgeProps) {
    return (
        <span className={cn(badgeVariants({ variant }), className)} {...props}>
            {children}
        </span>
    );
}
