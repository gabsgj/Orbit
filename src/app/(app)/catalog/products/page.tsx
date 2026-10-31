import { ProductsView } from "@/modules/catalog";

export const metadata = {
  title: "Products & Variants — Orbit",
  description: "Catalog products, attributes, and variant pricing management",
};

export default function CatalogProductsPage() {
  return <ProductsView />;
}
