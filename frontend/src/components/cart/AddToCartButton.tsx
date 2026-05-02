"use client";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types";

interface Props {
  product: Product;
}

export default function AddToCartButton({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <button
      onClick={() =>
        addItem({
          productId: product.id,
          title: product.title,
          salePrice: product.salePrice,
          qty: 1,
          image: product.images[0],
        })
      }
      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
    >
      + Panier
    </button>
  );
}
