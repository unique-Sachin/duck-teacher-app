"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">🦆</span>
          <span className="font-bold text-xl">AI Mock Interviews</span>
        </Link>

        {/* Navigation - Center on larger screens */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            href="/" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Home
          </Link>
          <Link 
            href="/#positions" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Positions
          </Link>
        </nav>

        {/* Right side - Theme toggle */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}