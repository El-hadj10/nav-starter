import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import AddToCartButton from "@/components/cart/AddToCartButton";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  return (
    <article className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="relative aspect-square overflow-hidden bg-gray-50">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">📦</div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {product.brand && (
          <p className="text-xs text-gray-400 uppercase tracking-wide">{product.brand}</p>
        )}
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 hover:text-brand-700 transition-colors">
            {product.title}
          </h3>
        </Link>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-brand-700">
            {product.salePrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </span>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
