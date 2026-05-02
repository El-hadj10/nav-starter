import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Luma — La vitrine intelligente",
  description: "Découvrez les meilleurs produits sélectionnés par notre IA pour vous.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Navbar />
        {children}
        <footer className="mt-20 py-8 border-t border-gray-100 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Luma — Powered by AI
        </footer>
      </body>
    </html>
  );
}
