import { notFound } from "next/navigation";

interface Props {
  params: { slug: string };
}

export default async function ProductPage({ params }: Props) {
  // TODO: fetch product by slug from API
  const { slug } = params;
  if (!slug) notFound();

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <p className="text-sm text-gray-400">Produit : {slug}</p>
      {/* ProductHero, ProductDescription, AddToCart, RelatedProducts */}
    </main>
  );
}
