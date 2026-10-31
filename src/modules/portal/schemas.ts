import { z } from "zod";

export const PortalFilterInputSchema = z.object({
  customerId: z.string().uuid().optional(),
});

export type PortalFilterInput = z.infer<typeof PortalFilterInputSchema>;

export const SubscriptionActionInputSchema = z.object({
  subscriptionId: z.string().uuid(),
  action: z.enum(["PAUSE", "RESUME", "RENEW", "CLOSE"]),
  reason: z.string().max(250).optional(),
});

export type SubscriptionActionInput = z.infer<typeof SubscriptionActionInputSchema>;

export interface PortalSubscription {
  id: string;
  number: string;
  productName: string;
  planName: string;
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  status: "ACTIVE" | "PAUSED" | "CLOSED";
  startDate: string;
  nextBillingDate: string;
  paymentTermsDays: number;
  monthlyLineValue: number;
  quantity: number;
  unitPrice: number;
  pausable: boolean;
  renewable: boolean;
  closableEarly: boolean;
}

export interface PortalInvoice {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  amountPaid: number;
  status: "CONFIRMED" | "PAID" | "CANCELLED";
  periodStart: string;
  periodEnd: string;
}

export interface PortalCustomerProfile {
  id: string;
  name: string;
  email: string;
  companyName: string;
  taxId?: string;
  billingAddress?: string;
}
