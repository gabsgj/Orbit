import { describe, it, expect, vi } from "vitest";
import {
  confirmInvoice,
  cancelInvoice,
  sendInvoice,
  InvoiceError,
} from "./service";
import type { PrismaClient } from "@prisma/client";

describe("invoices service (SRS M6, FR-INV-01…05)", () => {
  it("confirms a DRAFT invoice", async () => {
    const mockInv = {
      id: "inv-1",
      number: "INV-2026-00001",
      status: "DRAFT",
      amountPaid: 0,
      customer: { user: { email: "cust@brightloop.com" } },
    };

    const mockTx = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue(mockInv),
        update: vi.fn().mockResolvedValue({ ...mockInv, status: "CONFIRMED" }),
      },
    };

    const res = await confirmInvoice(mockTx as unknown as PrismaClient, { invoiceId: "inv-1" });
    expect(res.status).toBe("CONFIRMED");
    expect(mockTx.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "inv-1" },
        data: { status: "CONFIRMED" },
      }),
    );
  });

  it("rejects confirming a non-DRAFT invoice", async () => {
    const mockInv = {
      id: "inv-already-confirmed",
      status: "CONFIRMED",
    };

    const mockTx = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue(mockInv),
      },
    };

    await expect(
      confirmInvoice(mockTx as unknown as PrismaClient, { invoiceId: "inv-already-confirmed" }),
    ).rejects.toThrowError(InvoiceError);
  });

  it("cancels an unpaid CONFIRMED invoice", async () => {
    const mockInv = {
      id: "inv-unpaid",
      status: "CONFIRMED",
      amountPaid: 0,
    };

    const mockTx = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue(mockInv),
        update: vi.fn().mockResolvedValue({ ...mockInv, status: "CANCELLED" }),
      },
    };

    const res = await cancelInvoice(mockTx as unknown as PrismaClient, { invoiceId: "inv-unpaid" });
    expect(res.status).toBe("CANCELLED");
  });

  it("rejects cancelling an invoice with recorded payments", async () => {
    const mockInv = {
      id: "inv-with-payment",
      status: "CONFIRMED",
      amountPaid: 500, // payments exist
    };

    const mockTx = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue(mockInv),
      },
    };

    await expect(
      cancelInvoice(mockTx as unknown as PrismaClient, { invoiceId: "inv-with-payment" }),
    ).rejects.toThrowError(/recorded payments/i);
  });

  it("stages email in outbox when sending an invoice", async () => {
    const mockInv = {
      id: "inv-send",
      number: "INV-2026-00042",
      grandTotal: 1500,
      dueDate: new Date("2026-07-01"),
      customer: {
        companyName: "Acme Corp",
        user: { email: "acme@example.com" },
      },
    };

    const mockTx = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue(mockInv),
      },
      emailOutbox: {
        create: vi.fn().mockResolvedValue({ id: "outbox-123" }),
      },
    };

    const res = await sendInvoice(mockTx as unknown as PrismaClient, { invoiceId: "inv-send" });
    expect(res.outboxId).toBe("outbox-123");
    expect(res.toEmail).toBe("acme@example.com");
    expect(mockTx.emailOutbox.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          toEmail: "acme@example.com",
          kind: "INVOICE_SENT",
          subject: "Invoice INV-2026-00042 from Brightloop Software",
        }),
      }),
    );
  });
});
