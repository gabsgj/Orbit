import { StaffView } from "@/modules/admin/client";

export const metadata = {
  title: "Staff Management — Orbit",
  description: "Admin-only internal staff provisioning and deactivation",
};

export default function AdminStaffPage() {
  return <StaffView />;
}
