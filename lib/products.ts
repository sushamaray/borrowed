import { prisma } from "@/lib/prisma";
import type { Prisma, Product } from "@/lib/generated/prisma";

export type ProductWithFeatureList = Product & {
  featureList: string[];
};

function readFeatures(features: Prisma.JsonValue): string[] {
  if (!Array.isArray(features)) {
    return [];
  }

  return features.filter((item): item is string => typeof item === "string");
}

function withFeatureList(product: Product): ProductWithFeatureList {
  return {
    ...product,
    featureList: readFeatures(product.features),
  };
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithFeatureList | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product) {
    return null;
  }

  return withFeatureList(product);
}

export async function getSimilarProducts(
  category: string,
  excludeId: string,
): Promise<ProductWithFeatureList[]> {
  const products = await prisma.product.findMany({
    where: {
      category,
      NOT: { id: excludeId },
    },
    orderBy: {
      postedAt: "desc",
    },
    take: 3,
  });

  return products.map(withFeatureList);
}
