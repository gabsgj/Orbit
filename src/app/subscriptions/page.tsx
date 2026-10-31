"use client";

import React, { useState } from "react";
import {
  SubscriptionList,
  SubscriptionDetail,
  SubscriptionCreateForm,
} from "@/modules/subscriptions";

export default function SubscriptionsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        {selectedId ? (
          <SubscriptionDetail
            subscriptionId={selectedId}
            onBack={() => setSelectedId(null)}
          />
        ) : isCreating ? (
          <SubscriptionCreateForm
            onSuccess={(id) => {
              setIsCreating(false);
              setSelectedId(id);
            }}
            onCancel={() => setIsCreating(false)}
          />
        ) : (
          <SubscriptionList
            onSelectSubscription={(id) => setSelectedId(id)}
            onCreateNew={() => setIsCreating(true)}
          />
        )}
      </div>
    </div>
  );
}

