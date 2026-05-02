import Link from "next/link";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import CartBadge from "@/components/cart/CartBadge";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-brand-700">Luma</span>
          <span className="text-xs text-gray-400 hidden sm:block">vitrine IA</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-brand-600 transition-colors">Catalogue</Link>
          <Link href="/account" className="hover:text-brand-600 transition-colors">Mon compte</Link>
        </nav>

        {/* Cart */}
        <Link href="/cart" className="relative p-2 text-gray-600 hover:text-brand-600 transition-colors">
          <ShoppingCartIcon className="h-6 w-6" />
          <CartBadge />
        </Link>
      </div>
    </header>
  );
}
