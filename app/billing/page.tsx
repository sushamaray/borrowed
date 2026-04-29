import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck, Truck } from "lucide-react";

import { getProductBySlug } from "@/lib/products";
import BillingForm from "./BillingForm";

const priceFormatter = new Intl.NumberFormat("en-BD");

function formatPrice(priceAmount: number) {
  return `TK ${priceFormatter.format(priceAmount)}`;
}

export const metadata: Metadata = {
  title: "Billing | Borrowed",
  description: "Review product billing details before checkout.",
};

type BillingPageProps = {
  searchParams: Promise<{
    product?: string;
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const { product: productSlug } = await searchParams;
  const product = productSlug ? await getProductBySlug(productSlug) : null;

  return (
    <main className="billing-page-shell">
      <div className="billing-page-wrap">
        <Link
          href={product ? `/products/${product.slug}` : "/"}
          className="billing-back-link"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Back
        </Link>

        <section className="billing-page-grid">
          <BillingForm
            product={
              product
                ? {
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    category: product.category,
                    location: product.location,
                    priceAmount: product.priceAmount,
                  }
                : null
            }
          />

          <aside className="billing-side-column">
            <article className="billing-summary-card">
              <h2 className="billing-card-title">Order Summary</h2>

              {product ? (
                <>
                  <div className="billing-summary-row">
                    <span>Product</span>
                    <strong>{product.name}</strong>
                  </div>
                  <div className="billing-summary-row">
                    <span>Category</span>
                    <strong>{product.category}</strong>
                  </div>
                  <div className="billing-summary-row">
                    <span>Location</span>
                    <strong>{product.location}</strong>
                  </div>
                  <div className="billing-summary-row">
                    <span>Rental Price</span>
                    <strong>{formatPrice(product.priceAmount)}</strong>
                  </div>
                </>
              ) : (
                <p className="billing-empty-copy">
                  No product was selected. Start from a product description page
                  to prefill the billing summary.
                </p>
              )}
            </article>

            <article className="billing-info-card">
              <div className="billing-info-row">
                <ShieldCheck size={18} aria-hidden="true" />
                <div>
                  <h3>Protection Review</h3>
                  <p>Compensation rules are reviewed before final confirmation.</p>
                </div>
              </div>

              <div className="billing-info-row">
                <Truck size={18} aria-hidden="true" />
                <div>
                  <h3>Pickup Coordination</h3>
                  <p>Pickup or delivery timing can be finalized after billing.</p>
                </div>
              </div>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
