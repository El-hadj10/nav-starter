import apiClient from "@/lib/api-client";
import ProductGrid from "@/components/product/ProductGrid";
import type { Product } from "@/types";

async function getProducts(): Promise<Product[]> {
  try {
    const res = await apiClient.get<Product[]>("/products");
    return res.data;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <section className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Bienvenue sur <span className="text-brand-600">Luma</span>
        </h1>
        <p className="mt-3 text-lg text-gray-500 max-w-xl mx-auto">
          Chaque produit est sélectionné, rédigé et tarifé automatiquement par notre IA.
        </p>
      </section>
      <ProductGrid products={products} />
    </main>
  );
}
