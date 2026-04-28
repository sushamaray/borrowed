import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  CreditCard,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";

import { getProductBySlug, getSimilarProducts } from "@/lib/products";

const dateFormatter = new Intl.DateTimeFormat("en-BD", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const priceFormatter = new Intl.NumberFormat("en-BD");

function formatPrice(priceAmount: number) {
  return `TK ${priceFormatter.format(priceAmount)}`;
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found | Borrowed",
    };
  }

  return {
    title: `${product.name} | Borrowed`,
    description: product.summary,
  };
}

export default async function ProductDescriptionPage(
  props: PageProps<"/products/[slug]">,
) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const similarProducts = await getSimilarProducts(product.category, product.id);

  return (
    <main className="product-page-shell">
      <div className="product-page-wrap">
        <Link href="/" className="product-back-link">
          <ArrowLeft size={18} aria-hidden="true" />
          Back to home
        </Link>

        <section className="product-hero-panel">
          <div className="product-hero-copy">
            <span className="product-category-pill">{product.category}</span>
            <h1 className="product-page-title">{product.name}</h1>
            <div className="product-meta-row">
              <div className="product-meta-item">
                <Calendar size={18} aria-hidden="true" />
                <span>Posted on {dateFormatter.format(product.postedAt)}</span>
              </div>
              <div className="product-meta-item">
                <MapPin size={18} aria-hidden="true" />
                <span>{product.location}</span>
              </div>
            </div>
            <p className="product-summary-text">{product.summary}</p>
          </div>

          <div className="product-hero-image-frame">
            <div className="product-hero-image-shell">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                preload
                sizes="(max-width: 900px) 100vw, 42vw"
                className="product-hero-image"
              />
            </div>
          </div>
        </section>

        <section className="product-details-layout">
          <div className="product-primary-column">
            <article className="product-detail-card">
              <h2 className="product-card-title">Product Description</h2>
              <p className="product-body-copy">{product.description}</p>

              <h3 className="product-subtitle">Features</h3>
              <ul className="product-feature-list">
                {product.featureList.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          </div>

          <aside className="product-secondary-column">
            <article className="product-price-card">
              <p className="product-price-label">Rental price</p>
              <p className="product-price-value">{formatPrice(product.priceAmount)}</p>
              <p className="product-price-caption">Per borrowing cycle</p>

              <Link
                href={`/billing?product=${product.slug}`}
                className="product-cta-button"
              >
                <CreditCard size={18} aria-hidden="true" />
                Checkout & Billing
              </Link>
            </article>

            <article id="lender-details" className="product-detail-card">
              <div className="product-card-heading-row">
                <h2 className="product-card-title">Lender Details</h2>
                <div className="product-rating-pill">
                  <Star size={16} aria-hidden="true" />
                  <span>{product.lenderRating.toString()}</span>
                </div>
              </div>

              <div className="product-lender-row">
                <span className="product-lender-label">Lender Name</span>
                <span className="product-lender-value">{product.lenderName}</span>
              </div>

              <p className="product-note-copy">{product.lenderNote}</p>
            </article>

            <article className="product-detail-card product-compensation-card">
              <div className="product-card-heading-row">
                <h2 className="product-card-title">Compensation Fees</h2>
                <ShieldCheck size={18} aria-hidden="true" />
              </div>

              <div className="product-compensation-item">
                <span className="product-lender-label">If lost or major damage</span>
                <span className="product-lender-value">{product.compensationMajor}</span>
              </div>

              <div className="product-compensation-item">
                <span className="product-lender-label">If minor damage</span>
                <span className="product-lender-value">{product.compensationMinor}</span>
              </div>
            </article>
          </aside>
        </section>

        <section className="product-similar-section">
          <div className="product-similar-header">
            <div>
              <p className="product-section-kicker">More from this category</p>
              <h2 className="product-similar-title">Similar Products</h2>
            </div>
          </div>

          <div className="product-similar-grid">
            {similarProducts.map((similarProduct) => (
              <Link
                key={similarProduct.id}
                href={`/products/${similarProduct.slug}`}
                className="product-similar-card"
              >
                <div className="product-similar-image-shell">
                  <Image
                    src={similarProduct.imageUrl}
                    alt={similarProduct.name}
                    fill
                    sizes="(max-width: 900px) 100vw, 22vw"
                    className="product-similar-image"
                  />
                </div>
                <div className="product-similar-copy">
                  <h3>{similarProduct.name}</h3>
                  <p>{similarProduct.summary}</p>
                </div>
                <div className="product-similar-footer">
                  <span>{formatPrice(similarProduct.priceAmount)}</span>
                  <ChevronRight size={18} aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
