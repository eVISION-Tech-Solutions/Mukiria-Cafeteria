export const categories = {
  main_meals: "Main Meals",
  proteins: "Proteins",
  vegetables: "Vegetables",
  drinks: "Drinks",
  snacks: "Snacks",
  desserts: "Desserts",
};

export function normalizeKenyanPhone(input) {
  const phone = String(input ?? "").trim().replace(/[\s\-+]/g, "");
  const normalized = phone.startsWith("254") && phone.length === 12
    ? `0${phone.slice(3)}`
    : phone;
  if (!/^0[17]\d{8}$/.test(normalized)) {
    throw new Error("Enter a valid Kenyan phone number (e.g. 0712345678 or 0112345678).");
  }
  return normalized;
}

export function toMpesaPhone(phone) {
  return `254${normalizeKenyanPhone(phone).slice(1)}`;
}

export function formatMeal(meal) {
  return {
    ...meal,
    category_display: categories[meal.category] ?? meal.category,
    price: String(meal.price),
  };
}

export function formatOrder(order) {
  return {
    ...order,
    total_amount: String(order.total_amount),
    items: (order.items ?? []).map((item) => ({
      id: item.id,
      meal: item.meal_id,
      meal_name: item.meal_name,
      quantity: item.quantity,
      unit_price: String(item.unit_price),
      subtotal: String(item.subtotal),
    })),
    qr_code: order.payment_status === "paid" ? order.qr_code ?? null : null,
  };
}

export function envelope(data = null, message = "Success.", success = true) {
  return { success, message, data };
}
