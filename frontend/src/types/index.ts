export interface Product {
  id: string;
  slug: string;
  title: string;
  brand?: string;
  category: string;
  salePrice: number;
  sourcePrice: number;
  marginPct: number;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  images: string[];
  shortDescription: string;
  longDescription: string;
  seoScore: number;
  publishedAt?: string;
}

export interface CartItem {
  productId: string;
  title: string;
  salePrice: number;
  qty: number;
  image?: string;
}

export interface Order {
  id: string;
  customerId: string;
  items: CartItem[];
  paidAmount: number;
  commissionAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
}
