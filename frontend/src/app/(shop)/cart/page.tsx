"use client";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";

export default function CartPage() {
  const { items, removeItem, updateQty, total } = useCartStore();

  if (items.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold mb-2">Votre panier est vide</h1>
        <Link href="/" className="mt-4 inline-block text-brand-600 hover:underline">
          Retour au catalogue
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Mon panier ({items.length} article{items.length > 1 ? "s" : ""})</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            {item.image && (
              <div className="relative w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                <Image src={item.image} alt={item.title} fill className="object-contain p-1" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800 line-clamp-2">{item.title}</p>
              <p className="text-brand-700 font-bold mt-1">
                {item.salePrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQty(item.productId, item.qty - 1)}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100">−</button>
              <span className="w-6 text-center font-medium">{item.qty}</span>
              <button onClick={() => updateQty(item.productId, item.qty + 1)}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100">+</button>
            </div>
            <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-600 text-sm ml-2">✕</button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex justify-between text-lg font-bold mb-4">
          <span>Total</span>
          <span className="text-brand-700">
            {total().toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </span>
        </div>
        <Link href="/checkout"
          className="block w-full bg-brand-600 hover:bg-brand-700 text-white text-center font-semibold py-3 rounded-xl transition-colors">
          Passer la commande
        </Link>
      </div>
    </main>
  );
}
