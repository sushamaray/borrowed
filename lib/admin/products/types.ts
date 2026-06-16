export interface ProductPage {
  items: ProductListItem[];
  nextCursor: string | null;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string | null;
  location: string;
  pricePerDay: number;
  deposit: number | null;
  imageUrl: string | null;
  images: { id: string; order: number }[];
  createdAt: string;
  createdBy: { id: string; name: string };
  lentItemCount: number;
  activeLentItems: number;
  checkoutCount: number;
}

export interface ProductCheckout {
  id: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalPrice: number | null;
  createdAt: string;
  borrower: { id: string; name: string };
  lender: { id: string; name: string };
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string | null;
  location: string;
  pricePerDay: number;
  deposit: number | null;
  description: string;
  features: string[];
  drawbacks: string[];
  imageUrl: string | null;
  images: { id: string; order: number }[];
  compensationMajor: string | null;
  compensationMinor: string | null;
  lenderNote: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email: string; location: string | null };
  lentItems: {
    id: string;
    status: string;
    createdAt: string;
    lender: { id: string; name: string };
  }[];
  checkouts: ProductCheckout[];
  trailEntries: {
    id: string;
    useFor: string;
    location: string | null;
    tags: unknown;
    itemRating: number;
    isPublic: boolean;
    anonymous: boolean;
    createdAt: string;
    borrower: { id: string; name: string } | null;
  }[];
  counts: {
    lentItems: number;
    activeLentItems: number;
    checkouts: number;
    trailEntries: number;
    totalRevenue: number;
  };
}
