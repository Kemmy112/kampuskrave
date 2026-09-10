// Pre-stocked catalog of meals the chef can pick from when building today's
// menu. `basePrice` is a suggested starting price in Naira; the chef can
// adjust it per dish before adding it to today's menu.
//
// `category` drives both chef-side grouping (CatalogMealPicker) and
// customer-side filtering/behavior:
//   - 'regular'  — standard same-day dishes, full photo cards
//   - 'special'  — soups requiring advance booking (24hr+ notice via a
//                  daily cutoff), styled with a distinct shade
//   - 'protein'  — small add-on cards, no photo, name + price only

const mealCatalog = [
  // Regular
  {
    id: 'catalog-jollof-rice',
    name: 'Jollof Rice',
    photoUrl: 'https://bdcnpshdiauzrkhcidhs.supabase.co/storage/v1/object/public/meal-images/njajollof.webp',
    basePrice: 3500,
    category: 'regular',
  },
  {
    id: 'catalog-coconut-rice',
    name: 'Coconut Rice',
    photoUrl: 'https://bdcnpshdiauzrkhcidhs.supabase.co/storage/v1/object/public/meal-images/coconutrice.webp',
    basePrice: 3500,
    category: 'regular',
  },
  {
    id: 'catalog-rice-and-stew',
    name: 'Rice and Stew with Plantain',
    photoUrl: 'https://bdcnpshdiauzrkhcidhs.supabase.co/storage/v1/object/public/meal-images/ricenstew.webp',
    basePrice: 4000,
    category: 'regular',
  },
  {
    id: 'catalog-beans-and-plantain',
    name: 'Beans and Plantain',
    photoUrl: 'https://bdcnpshdiauzrkhcidhs.supabase.co/storage/v1/object/public/meal-images/beansnplantain.webp',
    basePrice: 4000,
    category: 'regular',
  },
  {
    id: 'catalog-veggie-noodles',
    name: 'Veggie Noodles',
    photoUrl: 'https://bdcnpshdiauzrkhcidhs.supabase.co/storage/v1/object/public/meal-images/veggienoodles.webp',
    basePrice: 4200,
    category: 'regular',
  },
  {
    id: 'catalog-beef-spaghetti',
    name: 'Beef Spaghetti',
    photoUrl: 'https://bdcnpshdiauzrkhcidhs.supabase.co/storage/v1/object/public/meal-images/beefspaghetti.webp',
    basePrice: 4200,
    category: 'regular',
  },

  // Special — soups, advance booking required (24hr+ via daily cutoff)
  {
    id: 'catalog-afang-soup',
    name: 'Afang Soup',
    photoUrl: 'https://bdcnpshdiauzrkhcidhs.supabase.co/storage/v1/object/public/meal-images/afangsoup.webp',
    basePrice: 3800,
    category: 'special',
  },
  {
    id: 'catalog-egusi-soup',
    name: 'Egusi Soup',
    photoUrl: 'https://bdcnpshdiauzrkhcidhs.supabase.co/storage/v1/object/public/meal-images/egusisoup.webp',
    basePrice: 3800,
    category: 'special',
  },
  {
    id: 'catalog-ekpang-nkukwo',
    name: 'Ekpang Nkukwo',
    photoUrl: 'https://bdcnpshdiauzrkhcidhs.supabase.co/storage/v1/object/public/meal-images/ekpangnkukwo.webp',
    basePrice: 3000,
    category: 'special',
  },

  // Protein add-ons — no photo, small cards, priced per unit
  {
    id: 'catalog-egg',
    name: 'Egg',
    photoUrl: null,
    basePrice: 200,
    category: 'protein',
  },
  {
    id: 'catalog-meat',
    name: 'Meat',
    photoUrl: null,
    basePrice: 200,
    category: 'protein',
  },
  {
    id: 'catalog-chicken',
    name: 'Chicken',
    photoUrl: null,
    basePrice: 600,
    category: 'protein',
  },
];

export default mealCatalog;