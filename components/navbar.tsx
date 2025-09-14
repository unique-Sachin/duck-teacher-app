"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">🦆</span>
          <span className="font-bold text-xl">Duck Teacher</span>
        </Link>

        {/* Navigation - Center on larger screens */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            href="/" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Home
          </Link>
          <Button asChild>
            <Link href="/session">Start Session</Link>
          </Button>
        </nav>

        {/* Right side - Theme toggle and mobile menu */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button asChild size="sm">
              <Link href="/session">Start Session</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}