import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "green" | "danger";
}

export const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ className, variant = "gold", children, ...props }, ref) => {
    
    const variants = {
      gold: "bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-600 text-black shadow-yellow-500/20",
      green: "bg-gradient-to-b from-green-400 via-green-600 to-green-800 text-white shadow-green-500/20",
      danger: "bg-gradient-to-b from-red-400 via-red-600 to-red-800 text-white shadow-red-500/20",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative px-8 py-4 rounded-xl font-display text-xl font-bold uppercase tracking-wider",
          "shadow-lg border-t border-white/20",
          "transition-all duration-200",
          variants[variant],
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 left-[-100%] animate-shine" />
        </div>
      </motion.button>
    );
  }
);
ShinyButton.displayName = "ShinyButton";
