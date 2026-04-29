"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

const BILLING_METHODS = [
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "ROCKET", label: "Rocket" },
  { value: "CARD", label: "Card" },
  { value: "CASH_ON_DELIVERY", label: "Cash On Delivery" },
] as const;

type BillingMethodValue = (typeof BILLING_METHODS)[number]["value"];

type BillingProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  location: string;
  priceAmount: number;
} | null;

type BillingFormProps = {
  product: BillingProduct;
};

type BillingFormState = {
  fullName: string;
  email: string;
  phoneNumber: string;
  deliveryAddress: string;
  specialNotes: string;
  billingMethod: BillingMethodValue;
};

const initialState: BillingFormState = {
  fullName: "",
  email: "",
  phoneNumber: "",
  deliveryAddress: "",
  specialNotes: "",
  billingMethod: "BKASH",
};

export default function BillingForm({ product }: BillingFormProps) {
  const [formState, setFormState] = useState<BillingFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<Key extends keyof BillingFormState>(
    key: Key,
    value: BillingFormState[Key],
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { toast } = await import("react-hot-toast");

    if (!product) {
      toast.error("Select a product before continuing to billing.");
      return;
    }

    setIsSubmitting(true);

    const request = fetch("/api/billing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productSlug: product.slug,
        ...formState,
      }),
    }).then(async (response) => {
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to save billing details.");
      }

      return payload;
    });

    toast.promise(request, {
      loading: "Saving billing details...",
      success: "Billing details saved successfully.",
      error: (error) =>
        error instanceof Error ? error.message : "Unable to save billing details.",
    });

    try {
      await request;
      setFormState(initialState);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="billing-main-card">
      <div className="billing-kicker">Checkout</div>
      <h1 className="billing-page-title">Billing Details</h1>
      <p className="billing-page-copy">
        Review the rental summary, choose a billing method, and submit the
        borrower information before confirming the request.
      </p>

      <div className="billing-method-section">
        <h2 className="billing-method-title">Billing Method</h2>
        <div className="billing-method-grid">
          {BILLING_METHODS.map((method) => {
            const isSelected = formState.billingMethod === method.value;

            return (
              <label
                key={method.value}
                className={`billing-method-option${isSelected ? " billing-method-option-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="billingMethod"
                  value={method.value}
                  checked={isSelected}
                  onChange={() => updateField("billingMethod", method.value)}
                  className="billing-method-input"
                />
                <span>{method.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="billing-form-grid">
        <label className="billing-field">
          <span>Full Name</span>
          <input
            type="text"
            placeholder="Enter full name"
            value={formState.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
          />
        </label>
        <label className="billing-field">
          <span>Email Address</span>
          <input
            type="email"
            placeholder="Enter email address"
            value={formState.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </label>
        <label className="billing-field">
          <span>Phone Number</span>
          <input
            type="tel"
            placeholder="Enter phone number"
            value={formState.phoneNumber}
            onChange={(event) => updateField("phoneNumber", event.target.value)}
          />
        </label>
        <label className="billing-field">
          <span>Delivery Address</span>
          <input
            type="text"
            placeholder="Enter pickup or delivery address"
            value={formState.deliveryAddress}
            onChange={(event) => updateField("deliveryAddress", event.target.value)}
          />
        </label>
        <label className="billing-field billing-field-full">
          <span>Special Notes</span>
          <textarea
            rows={4}
            placeholder="Mention preferred delivery time or any item handling notes"
            value={formState.specialNotes}
            onChange={(event) => updateField("specialNotes", event.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        className="billing-submit-button"
        disabled={isSubmitting || !product}
      >
        <CreditCard size={18} aria-hidden="true" />
        {isSubmitting ? "Saving..." : "Confirm Billing"}
      </button>
    </form>
  );
}
