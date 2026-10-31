"use client";

import React, { useState } from "react";
import { InvoiceList, InvoiceDetail } from "@/modules/invoices/client";
import { RecordPaymentDialog } from "@/modules/payments/client";

export default function InvoicesPage() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<{ id: string; outstanding: number } | null>(null);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        {selectedInvoiceId ? (
          <InvoiceDetail
            invoiceId={selectedInvoiceId}
            onBack={() => setSelectedInvoiceId(null)}
            onRecordPayment={(id, outstanding) => setPaymentTarget({ id, outstanding })}
          />
        ) : (
          <InvoiceList onSelectInvoice={(id) => setSelectedInvoiceId(id)} />
        )}

        {paymentTarget && (
          <RecordPaymentDialog
            invoiceId={paymentTarget.id}
            outstandingBalance={paymentTarget.outstanding}
            onClose={() => setPaymentTarget(null)}
          />
        )}
      </div>
    </div>
  );
}

