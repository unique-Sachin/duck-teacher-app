"use client";

import { motion } from "framer-motion";

interface EvalyzeLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function EvalyzeLogo({ className = "", size = "lg" }: EvalyzeLogoProps) {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-4xl",
    xl: "text-5xl"
  };

  return (
    <span className={`inline-flex items-center font-bold ${className}`}>
      <motion.span
        initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ 
          duration: 0.8,
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
        className="relative inline-block"
      >
        <motion.span
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
          className={`${sizeClasses[size]} font-extrabold bg-clip-text text-transparent`}
          style={{
            backgroundImage: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #10b981, #3b82f6)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          E
        </motion.span>
        <motion.span
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 blur-xl"
          style={{
            backgroundImage: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          E
        </motion.span>
      </motion.span>
      <motion.span
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ 
          delay: 0.3, 
          duration: 0.6,
          type: "spring",
          stiffness: 100
        }}
        className={`${sizeClasses[size]}`}
      >
        valyze
      </motion.span>
    </span>
  );
}
