"use client";
import { useCartStore } from "@/store/cartStore";

export default function CartBadge() {
  const count = useCartStore((s) => s.items.reduce((acc, i) => acc + i.qty, 0));
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}
