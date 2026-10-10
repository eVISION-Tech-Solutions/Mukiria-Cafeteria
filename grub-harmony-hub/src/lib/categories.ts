export const CATEGORIES = [
  "All",
  "Main Meals",
  "Proteins",
  "Vegetables",
  "Drinks",
  "Snacks",
  "Desserts",
] as const;

export const CATEGORY_VALUE_MAP = {
  "Main Meals": "main_meals",
  Proteins: "proteins",
  Vegetables: "vegetables",
  Drinks: "drinks",
  Snacks: "snacks",
  Desserts: "desserts",
} as const;

export const CATEGORY_LABEL_MAP = {
  main_meals: "Main Meals",
  proteins: "Proteins",
  vegetables: "Vegetables",
  drinks: "Drinks",
  snacks: "Snacks",
  desserts: "Desserts",
} as const;

export type Category = (typeof CATEGORIES)[number];
