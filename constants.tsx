
import { Product, Topping, InventoryItem } from './types';

export const BUSINESS_INFO = {
  name: "لانجولتو",
  owner: "رضا البغدي",
  phone: "01002006657",
  address: "كفر بهيدة – بجوار مسجد عمر"
};

export const COPYRIGHT_INFO = {
  owner: "محمود حسن",
  mobile: "01012444886",
  text: "© جميع الحقوق محفوظة - المالك والمطور: محمود حسن"
};

export const EMERGENCY_CODE = "999";
export const LOGO_URL = "https://img.icons8.com/color/120/pizza.png";

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'mat-flour', name: 'دقيق فاخر', unit: 'كجم', quantity: 150, minLimit: 20 },
  { id: 'mat-cheese', name: 'جبنة موتزاريلا', unit: 'كجم', quantity: 80, minLimit: 10 },
  { id: 'mat-chicken', name: 'صدور دجاج', unit: 'كجم', quantity: 45, minLimit: 5 },
  { id: 'mat-meat', name: 'لحم بقري', unit: 'كجم', quantity: 40, minLimit: 5 },
  { id: 'mat-dough', name: 'عجينة بيتزا جاهزة', unit: 'قطعة', quantity: 200, minLimit: 20 },
];

export const INITIAL_PRODUCTS: Product[] = [
  // --- البيتزا (S: 90, M: 110, L: 130) ---
  ...[
    "مارجريتا", "خضروات", "عشاق الجبنة", "شاورما فراخ", "تشيكن باربكيو",
    "بيبروني", "تشيكن رانش", "مشروم", "سوبر سوبريم", "فورسيزون", "بولونيز"
  ].map((name, i) => ({
    id: `piz-${i}`,
    name: `بيتزا ${name}`,
    category: 'بيتزا' as const,
    prices: { S: 90, M: 110, L: 130 }
  })),
  { id: 'piz-shrimp', name: "بيتزا جمبري", category: 'بيتزا', prices: { S: 120, M: 140, L: 170 } },

  // --- الكريب (80 / 120) ---
  ...[
    "جبنة", "ميكس", "شاورما", "كريسبي", "زنجر", "فاهيتا", "بطاطس", "إندونيسي"
  ].map((name, i) => ({
    id: `cr-${i}`,
    name: `كريب ${name}`,
    category: 'كريب' as const,
    prices: { roll: 80, triangle: 120 }
  })),

  // --- السندوتشات ---
  { id: 'sw-1', name: "شاورما فراخ", category: 'سندوتشات', prices: { base: 35 } },
  { id: 'sw-2', name: "بانيه", category: 'سندوتشات', prices: { base: 25 } },
  { id: 'sw-3', name: "كرسبي", category: 'سندوتشات', prices: { base: 25 } },
  { id: 'sw-4', name: "استربس حار", category: 'سندوتشات', prices: { base: 35 } },
  { id: 'sw-5', name: "شيش طاووق", category: 'سندوتشات', prices: { base: 35 } },
  { id: 'sw-6', name: "فاهيتا فراخ", category: 'سندوتشات', prices: { base: 35 } },
  { id: 'sw-7', name: "كوردن بلو", category: 'سندوتشات', prices: { base: 30 } },
  { id: 'sw-8', name: "زنجر", category: 'سندوتشات', prices: { base: 30 } },
  { id: 'sw-9', name: "زنجر سوبرم", category: 'سندوتشات', prices: { base: 35 } },
  { id: 'sw-10', name: "سوبر كرانشي", category: 'سندوتشات', prices: { base: 35 } },

  // --- الإضافات ---
  { id: 'add-1', name: "جبنة", category: 'إضافات', prices: { base: 10 } },
  { id: 'add-2', name: "فراخ", category: 'إضافات', prices: { base: 10 } },
  { id: 'add-3', name: "لحمة", category: 'إضافات', prices: { base: 10 } },
  { id: 'add-4', name: "بطاطس", category: 'إضافات', prices: { base: 15 } },
];

export const TOPPINGS: Topping[] = [
  { id: 'top-stuffed-crust', name: "حشو أطراف", price: 20 },
  { id: 'top-extra-cheese', name: "جبنة إضافية", price: 10 },
  { id: 'top-extra-meat', name: "لحمة إضافية", price: 15 },
];

export const WORK_HOURS = {
  start: "16:00",
  end: "00:00"
};
