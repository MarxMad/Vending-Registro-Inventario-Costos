"use client";

import { motion } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  children, 
  className = "", 
  isLoading = false, 
  variant = 'primary',
  size = 'md',
  ...props 
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm font-bold",
    lg: "px-8 py-4 text-base font-bold"
  };

  const variantStyles = {
    primary: {
      background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
      color: "white",
      border: "2px solid #2563EB",
      boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
    },
    secondary: {
      background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
      color: "white",
      border: "2px solid #F59E0B",
      boxShadow: "0 4px 15px rgba(251, 191, 36, 0.3)",
    },
    outline: {
      background: "white",
      color: "#3B82F6",
      border: "2px solid #3B82F6",
      boxShadow: "0 2px 10px rgba(59, 130, 246, 0.2)",
    },
  };

  // Filtrar props que causan conflictos de tipos con framer-motion
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onAnimationStart, onAnimationEnd, ...motionProps } = props as any;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`rounded-xl transition-all ${sizeClasses[size]} ${className}`}
      style={variantStyles[variant]}
      {...motionProps}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
          />
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
}
