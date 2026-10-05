// Demo-only server-side catalog. A browser must never choose the amount.
// Replace this module with a database lookup in your application. Store money
// as integer paise (or your database's decimal type), never JavaScript floats.
const products = new Map([
  [
    "starter-plan",
    {
      id: "starter-plan",
      eyebrow: "For personal projects",
      name: "Starter",
      description: "Everything you need to turn a good idea into a polished launch.",
      features: ["1 active workspace", "Unlimited payment links", "Email support"],
      popular: false,
      amountPaise: 49900,
      currency: "INR",
    },
  ],
  [
    "pro-plan",
    {
      id: "pro-plan",
      eyebrow: "For growing teams",
      name: "Pro",
      description: "More room, smarter controls, and priority help when momentum picks up.",
      features: ["5 active workspaces", "Advanced payment insights", "Priority support"],
      popular: true,
      amountPaise: 99900,
      currency: "INR",
    },
  ],
]);

export function getProductById(productId) {
  return products.get(productId) ?? null;
}

export function listProducts() {
  return Array.from(products.values(), (product) => ({
    ...product,
    features: [...product.features],
  }));
}
