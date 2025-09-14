import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between py-4 px-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span className="text-lg">🦆</span>
          <span>Duck Teacher © 2025</span>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}