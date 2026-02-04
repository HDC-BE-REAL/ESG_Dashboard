import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const cardVariants = cva(
    "rounded-[24px] border border-slate-100 shadow-sm bg-white overflow-hidden transition-all relative group hover:shadow-md duration-300",
    {
        variants: {
            variant: {
                default: "bg-white",
                dark: "bg-[#10221c] text-white border-[#1a2e28]", // Dark theme from reference
                blue: "bg-[#615CEB] text-white border-[#615CEB] shadow-blue-500/20",
                hoverable: "hover:scale-[1.02] cursor-pointer border-transparent hover:border-[#10b77f]/30",
                active: "ring-2 ring-[#10b77f] border-[#10b77f] shadow-lg scale-[1.02]",
                inactive: "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 cursor-pointer border-dashed bg-slate-50",
            },
            padding: {
                none: "p-0",
                sm: "p-4",
                default: "p-6",
                lg: "p-8",
            }
        },
        defaultVariants: {
            variant: "default",
            padding: "default",
        }
    }
);

interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> { }

export const Card = ({ className, variant, padding, ...props }: CardProps) => <div className={cn(cardVariants({ variant, padding, className }))} {...props} />;
