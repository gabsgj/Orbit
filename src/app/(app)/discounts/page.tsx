"use client";

import React, { useState } from "react";
import {
  DiscountRuleList,
  DiscountRuleDetail,
  DiscountRuleForm,
} from "@/modules/discounts/client";

export default function DiscountsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        {selectedId ? (
          <DiscountRuleDetail
            ruleId={selectedId}
            onBack={() => setSelectedId(null)}
          />
        ) : isCreating ? (
          <DiscountRuleForm
            onSuccess={() => setIsCreating(false)}
            onCancel={() => setIsCreating(false)}
          />
        ) : (
          <DiscountRuleList
            onSelectRule={(id) => setSelectedId(id)}
            onCreateNew={() => setIsCreating(true)}
          />
        )}
      </div>
    </div>
  );
}

