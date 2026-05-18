import { notFound } from "next/navigation";
import { getProductBySlug, getSimilarProducts } from "@/lib/products";
import ItemDetailClient from "@/app/products/[slug]/ItemDetailClient";

export default async function DashboardItemPage(
  props: PageProps<"/dashboard/items/[id]">,
) {
  const { id } = await props.params;
  const slug = `lent-${id}`;

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
