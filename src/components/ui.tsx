import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

// Card Variants
export const cardVariants = cva(
    "rounded-[32px] border transition-all duration-300",
    {
        variants: {
            variant: {
                default: "bg-white border-slate-100 shadow-sm",
                dark: "bg-slate-900 text-white border-slate-800",
                active: "bg-white border-emerald-200 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-100",
                hoverable: "bg-white border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
            },
            padding: {
                default: "p-6",
                lg: "p-8",
                xl: "p-10",
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

export function Card({ className, variant, padding, ...props }: CardProps) {
    return (
        <div className={cn(cardVariants({ variant, padding }), className)} {...props} />
    );
}

// Button Variants
export const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 gap-2",
    {
        variants: {
            variant: {
                default: "bg-slate-900 text-white hover:bg-emerald-600 shadow-lg",
                outline: "border border-slate-200 bg-white hover:bg-slate-50",
                ghost: "hover:bg-slate-100",
                tab: "px-6 py-2 text-xs text-slate-400",
                tabActive: "px-6 py-2 text-xs bg-white shadow-sm text-emerald-600",
            },
            size: {
                default: "h-11 px-6",
                sm: "h-9 px-4 text-xs",
                lg: "h-14 px-8",
                icon: "h-11 w-11",
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

export function Button({ className, variant, size, ...props }: ButtonProps) {
    return (
        <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
}

// Badge Variants
export const badgeVariants = cva(
    "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
    {
        variants: {
            variant: {
                default: "bg-slate-100 text-slate-600",
                success: "bg-emerald-100 text-emerald-600",
                warning: "bg-orange-100 text-orange-600",
                danger: "bg-red-100 text-red-600",
                blue: "bg-blue-100 text-blue-600",
                purple: "bg-purple-100 text-purple-600",
                amber: "bg-amber-100 text-amber-600",
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

export function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <span className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}
