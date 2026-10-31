import { PlansView } from "@/modules/catalog/client";

export const metadata = {
  title: "Subscription Plans — Orbit",
  description: "Subscription billing plans, periodic intervals, and lifecycle flags",
};

export default function CatalogPlansPage() {
  return <PlansView />;
}
