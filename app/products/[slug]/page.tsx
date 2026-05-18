import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getSimilarProducts } from "@/lib/products";
import ItemDetailClient from "./ItemDetailClient";

export async function generateMetadata(
  props: PageProps<"/products/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found | Borrowed" };
  return { title: `${product.name} | Borrowed`, description: product.description.slice(0, 160) };
}

export default async function ProductDescriptionPage(
  props: PageProps<"/products/[slug]">,
) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const similarProducts = await getSimilarProducts(product.category, product.id);

  return (
    <ItemDetailClient
      product={product}
      similarProducts={similarProducts}
      lentItemId={product.lentItemId}
    />
  );
}
