import { describe, it, expect, vi } from "vitest";
import { recordPayment, PaymentError } from "./service";
import type { PrismaClient } from "@prisma/client";

describe("PaymentService.record (SRS M8, FR-PAY-01…03)", () => {
  const invoiceId = "inv-100";
  const recordedById = "user-staff";

  it("records a valid partial payment and updates amount_paid", async () => {
    const mockInvoice = {
      id: invoiceId,
      number: "INV-2026-00100",
      status: "CONFIRMED",
      grandTotal: 1000,
      amountPaid: 200,
    };

    const mockTx = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue(mockInvoice),
        update: vi.fn().mockResolvedValue({
          ...mockInvoice,
          amountPaid: 500,
          status: "CONFIRMED",
        }),
      },
      payment: {
        create: vi.fn().mockResolvedValue({
          id: "pay-1",
          invoiceId,
          amount: 300,
          method: "UPI",
        }),
      },
    };

    const res = await recordPayment(mockTx as unknown as PrismaClient, {
      invoiceId,
      method: "UPI",
      amount: 300,
      recordedById,
    });

    expect(res.settled).toBe(false);
    expect(res.invoice.amountPaid).toBe(500);
    expect(mockTx.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          invoiceId,
          method: "UPI",
        }),
      }),
    );
  });

  it("rejects overpayment with a clear message (amount > outstanding)", async () => {
    const mockInvoice = {
      id: invoiceId,
      number: "INV-2026-00100",
      status: "CONFIRMED",
      grandTotal: 1000,
      amountPaid: 800, // outstanding is 200
    };

    const mockTx = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue(mockInvoice),
      },
    };

    try {
      await recordPayment(mockTx as unknown as PrismaClient, {
        invoiceId,
        method: "BANK_TRANSFER",
        amount: 250, // exceeds 200
        recordedById,
      });
      expect.unreachable("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(PaymentError);
      expect((err as PaymentError).code).toBe("OVERPAYMENT");
      expect((err as PaymentError).message).toMatch(/exceeds outstanding balance/i);
    }
  });

  it("auto-flips invoice to PAID upon full settlement", async () => {
    const mockInvoice = {
      id: invoiceId,
      number: "INV-2026-00100",
      status: "CONFIRMED",
      grandTotal: 500,
      amountPaid: 0,
    };

    const mockTx = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue(mockInvoice),
        update: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...mockInvoice, ...data }),
        ),
      },
      payment: {
        create: vi.fn().mockResolvedValue({ id: "pay-full" }),
      },
    };

    const res = await recordPayment(mockTx as unknown as PrismaClient, {
      invoiceId,
      method: "CARD",
      amount: 500,
      recordedById,
    });

    expect(res.settled).toBe(true);
    expect(res.invoice.status).toBe("PAID");
    expect(mockTx.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: invoiceId },
        data: expect.objectContaining({
          status: "PAID",
        }),
      }),
    );
  });

  it("rejects payment on an already fully paid invoice", async () => {
    const mockInvoice = {
      id: invoiceId,
      status: "PAID",
      grandTotal: 500,
      amountPaid: 500,
    };

    const mockTx = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue(mockInvoice),
      },
    };

    await expect(
      recordPayment(mockTx as unknown as PrismaClient, {
        invoiceId,
        method: "CASH",
        amount: 100,
        recordedById,
      }),
    ).rejects.toThrowError(/already fully paid/i);
  });
});
