import { notFound } from "next/navigation";
import Image from "next/image";
import apiClient from "@/lib/api-client";
import type { Product } from "@/types";
import AddToCartButton from "@/components/cart/AddToCartButton";

interface Props {
  params: { slug: string };
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await apiClient.get<Product>(`/products/${slug}`);
    return res.data;
  } catch {
    return null;
  }
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
          {product.images[0] ? (
            <Image src={product.images[0]} alt={product.title} fill className="object-contain p-6" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">📦</div>
          )}
        </div>

        {/* Détail */}
        <div className="flex flex-col gap-4">
          {product.brand && <p className="text-sm text-gray-400 uppercase tracking-wide">{product.brand}</p>}
          <h1 className="text-2xl font-extrabold text-gray-900">{product.title}</h1>
          <p className="text-3xl font-bold text-brand-700">
            {product.salePrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </p>

          <p className="text-sm text-gray-600 leading-relaxed">{product.shortDescription}</p>

          <div className="mt-2">
            <AddToCartButton product={product} />
          </div>

          {product.stockStatus === "out_of_stock" && (
            <p className="text-sm text-red-500 font-medium">Rupture de stock</p>
          )}
        </div>
      </div>
    </main>
  );
}
