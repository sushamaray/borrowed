import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/generated/prisma";

export interface LenderPublicInfo {
  id: string;
  displayName: string;
  userName: string | null;
  imageUrl: string | null;
  location: string | null;
  identityVerified: boolean;
  contactVerified: boolean;
  addressVerified: boolean;
  meetupVerified: boolean;
  idVerified: boolean;
  createdAt: Date;
}

export type ProductWithFeatureList = Omit<Product, "deposit"> & {
  lenderRating: number;
  featureList: string[];
  drawbackList: string[];
  deposit: number | null;
  lenderName: string;
  lender: LenderPublicInfo;
  // set when accessed via a lent listing slug
  lentItemId?: string;
};

function readFeatures(features: unknown): string[] {
  if (!Array.isArray(features)) return [];
  return features.filter((item): item is string => typeof item === "string");
}

function withFeatureList(
  product: Product & {
    createdBy: {
      id: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      userName: string | null;
      image: string | null;
      profilePicture: string | null;
      location: string | null;
      identityVerified: boolean;
      contactVerified: boolean;
      addressVerified: boolean;
      meetupVerified: boolean;
      idVerified: boolean;
      createdAt: Date;
    };
  },
  lentItemId?: string,
): ProductWithFeatureList {
  const lenderName =
    product.createdBy.firstName && product.createdBy.lastName
      ? `${product.createdBy.firstName} ${product.createdBy.lastName}`
      : (product.createdBy.name ?? product.createdBy.userName ?? "Unknown");

  const raw = product as unknown as Record<string, unknown>;

  return {
    ...product,
    lenderRating: 0,
    featureList: readFeatures(product.features),
    drawbackList: readFeatures(raw.drawbacks),
    lenderName,
    lender: {
      id: product.createdBy.id,
      displayName: lenderName,
      userName: product.createdBy.userName,
      imageUrl: product.createdBy.profilePicture ?? product.createdBy.image,
      location: product.createdBy.location,
      identityVerified: product.createdBy.identityVerified,
      contactVerified: product.createdBy.contactVerified,
      addressVerified: product.createdBy.addressVerified,
      meetupVerified: product.createdBy.meetupVerified,
      idVerified: product.createdBy.idVerified,
      createdAt: product.createdBy.createdAt,
    },
    lentItemId,
  };
}

const createdBySelect = {
  select: {
    id: true,
    name: true,
    firstName: true,
    lastName: true,
    userName: true,
    image: true,
    profilePicture: true,
    location: true,
    identityVerified: true,
    contactVerified: true,
    addressVerified: true,
    meetupVerified: true,
    idVerified: true,
    createdAt: true,
  },
} as const;

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithFeatureList | null> {
  // Browse page links lent items as "lent-<lentItemId>"
  if (slug.startsWith("lent-")) {
    const lentItemId = slug.slice(5);
    const item = await prisma.lentItem.findUnique({
      where: { id: lentItemId },
      include: { product: { include: { createdBy: createdBySelect } } },
    });
    if (!item) return null;
    return withFeatureList(item.product, item.id);
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { createdBy: createdBySelect },
  });
  if (!product) return null;
  return withFeatureList(product);
}

export async function getSimilarProducts(
  category: string,
  excludeProductId: string,
): Promise<ProductWithFeatureList[]> {
  const items = await prisma.lentItem.findMany({
    where: {
      status: "active",
      product: { category, NOT: { id: excludeProductId } },
    },
    include: { product: { include: { createdBy: createdBySelect } } },
    take: 3,
  });

  return items.map((item) => withFeatureList(item.product, item.id));
}
