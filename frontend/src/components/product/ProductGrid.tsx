import type { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";

interface Props {
  products: Product[];
}

export default function ProductGrid({ products }: Props) {
  if (products.length === 0) {
    return (
      <div className="col-span-full py-20 text-center text-gray-400">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-lg">Aucun produit disponible pour le moment.</p>
        <p className="text-sm mt-1">L'agent IA est en train de sourcer le catalogue…</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
