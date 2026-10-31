import { TaxesView } from "@/modules/catalog/client";

export const metadata = {
  title: "Taxes — Orbit",
  description: "Tax rates and duty rules applied to recurring invoices",
};

export default function CatalogTaxesPage() {
  return <TaxesView />;
}
