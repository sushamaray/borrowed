import { prisma } from "@/lib/prisma";
import { BillingMethod } from "@/lib/generated/prisma";

const BILLING_METHODS = new Set<BillingMethod>([
  BillingMethod.BKASH,
  BillingMethod.NAGAD,
  BillingMethod.ROCKET,
  BillingMethod.CARD,
  BillingMethod.CASH_ON_DELIVERY,
]);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      productSlug?: string;
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      deliveryAddress?: string;
      specialNotes?: string;
      billingMethod?: BillingMethod;
    };

    const productSlug = body.productSlug?.trim();
    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const phoneNumber = body.phoneNumber?.trim();
    const deliveryAddress = body.deliveryAddress?.trim();
    const specialNotes = body.specialNotes?.trim();
    const billingMethod = body.billingMethod;

    if (
      !productSlug ||
      !fullName ||
      !email ||
      !phoneNumber ||
      !deliveryAddress ||
      !billingMethod
    ) {
      return Response.json(
        { message: "All required billing fields must be completed." },
        { status: 400 },
      );
    }

    if (!BILLING_METHODS.has(billingMethod)) {
      return Response.json(
        { message: "Please select a valid billing method." },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        slug: productSlug,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return Response.json({ message: "Selected product was not found." }, { status: 404 });
    }

    const billingOrder = await prisma.billingOrder.create({
      data: {
        productId: product.id,
        fullName,
        email,
        phoneNumber,
        deliveryAddress,
        specialNotes: specialNotes || null,
        billingMethod,
      },
    });

    return Response.json({
      message: "Billing details saved successfully.",
      billingOrderId: billingOrder.id,
    });
  } catch (error) {
    console.error("[billing] Server error", error);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
