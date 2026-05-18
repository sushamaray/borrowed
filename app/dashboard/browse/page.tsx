"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Star } from "lucide-react";
import borrowedBg from "../../images/borrow.png";

interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  location: string;
  priceAmount: number;
  summary: string;
  imageUrl: string;
  lenderName: string;
  lenderRating: number;
}

export default function BrowseItemsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        // Use dummy data on error
        setProducts(getDummyProducts());
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const placeholderImage = borrowedBg.src;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Browse Items</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Discover items available in your community
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg bg-[var(--surface)] animate-pulse h-72"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              placeholderImage={placeholderImage}
            />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-[var(--text-secondary)]">No items available</p>
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  placeholderImage,
}: {
  product: Product;
  placeholderImage: string;
}) {
  const imageUrl = product.imageUrl && product.imageUrl.startsWith("http") 
    ? product.imageUrl 
    : placeholderImage;

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="group rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:shadow-lg hover:border-[var(--primary)]/50">
        {/* Image Container */}
        <div className="relative overflow-hidden h-48 bg-[var(--surface-soft)]">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
          <button
            className="absolute top-3 right-3 p-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 transition-all hover:bg-white/30 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            <Heart className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">
              {product.category}
            </p>
            <h3 className="text-sm font-bold text-[var(--foreground)] mt-1 line-clamp-2">
              {product.name}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
              {product.summary}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <MapPin className="h-4 w-4" />
            {product.location}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Price/Day</p>
              <p className="text-lg font-bold text-[var(--primary)]">
                TK {product.priceAmount}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-[var(--foreground)]">
                {product.lenderRating}
              </span>
            </div>
          </div>

          <div className="text-xs text-[var(--text-secondary)]">
            by <span className="font-medium text-[var(--foreground)]">{product.lenderName}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Fallback dummy products
function getDummyProducts(): Product[] {
  return [
    {
      id: "prod_apex_gaming_pc",
      slug: "apex-gaming-pc",
      name: "Apex Gaming PC",
      category: "Tech & Electronics",
      location: "Dhanmondi, Dhaka",
      priceAmount: 2000,
      summary: "A powerful desktop setup for gaming nights and creative projects.",
      imageUrl: "",
      lenderName: "Nafis Rahman",
      lenderRating: 4.8,
    },
    {
      id: "prod_sony_mirrorless_camera",
      slug: "sony-mirrorless-camera",
      name: "Sony Mirrorless Camera",
      category: "Cameras",
      location: "Gulshan, Dhaka",
      priceAmount: 1800,
      summary: "Professional-grade mirrorless camera with 4K video.",
      imageUrl: "",
      lenderName: "Karim Hassan",
      lenderRating: 4.9,
    },
    {
      id: "prod_dji_drone",
      slug: "dji-drone",
      name: "DJI Air 3 Drone",
      category: "Drones & Gadgets",
      location: "Baridhara, Dhaka",
      priceAmount: 1500,
      summary: "Professional aerial photography drone with 4K camera.",
      imageUrl: "",
      lenderName: "Amina Khan",
      lenderRating: 4.8,
    },
    {
      id: "prod_camping_tent",
      slug: "camping-tent",
      name: "4-Person Camping Tent",
      category: "Sports & Outdoors",
      location: "Mirpur, Dhaka",
      priceAmount: 300,
      summary: "Waterproof camping tent suitable for 4 people.",
      imageUrl: "",
      lenderName: "Arjun Singh",
      lenderRating: 4.6,
    },
    {
      id: "prod_bicycle",
      slug: "bicycle",
      name: "Mountain Bike - Full Suspension",
      category: "Sports & Outdoors",
      location: "Kawran Bazar, Dhaka",
      priceAmount: 500,
      summary: "Full-suspension mountain bike ideal for trails.",
      imageUrl: "",
      lenderName: "Hassan Khan",
      lenderRating: 4.9,
    },
    {
      id: "prod_projector",
      slug: "projector",
      name: "4K Smart Projector",
      category: "Tech & Electronics",
      location: "Uttara, Dhaka",
      priceAmount: 700,
      summary: "Compact 4K projector for home entertainment.",
      imageUrl: "",
      lenderName: "Priya Desai",
      lenderRating: 4.7,
    },
  ];
}
