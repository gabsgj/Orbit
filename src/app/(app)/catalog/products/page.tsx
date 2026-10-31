import { ProductsView } from "@/modules/catalog/client";

export const metadata = {
  title: "Products & Variants — Orbit",
  description: "Catalog products, attributes, and variant pricing management",
};

export default function CatalogProductsPage() {
  return <ProductsView />;
}
