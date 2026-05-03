import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
