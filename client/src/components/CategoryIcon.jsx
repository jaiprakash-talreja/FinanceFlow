import {
  Book, Briefcase, Car, Coffee, Film, Gift, GraduationCap, Home, Laptop, Lightbulb, PawPrint,
  Pill, Plane, ShoppingBag, Tag, TrendingUp, Utensils, Bus,
} from "lucide-react";

// Category icons are stored as short keys (e.g. "utensils") and drawn as line icons.
export const CATEGORY_ICONS = {
  utensils: Utensils,
  home: Home,
  bus: Bus,
  car: Car,
  "shopping-bag": ShoppingBag,
  lightbulb: Lightbulb,
  pill: Pill,
  film: Film,
  book: Book,
  plane: Plane,
  gift: Gift,
  briefcase: Briefcase,
  laptop: Laptop,
  "trending-up": TrendingUp,
  "graduation-cap": GraduationCap,
  "paw-print": PawPrint,
  coffee: Coffee,
  tag: Tag,
};

export default function CategoryIcon({ icon, className = "h-4 w-4" }) {
  const Icon = CATEGORY_ICONS[icon] || Tag;
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}

// Rounded tile with the category colour as a soft background and the icon in that colour.
export function CategoryTile({ category, size = "md" }) {
  const box = { sm: "h-8 w-8 rounded-[10px]", md: "h-9 w-9 rounded-xl", lg: "h-10 w-10 rounded-xl" }[size];
  const color = category?.color || "#79746a";
  return (
    <span className={`grid shrink-0 place-items-center ${box}`} style={{ background: `${color}22`, color }}>
      <CategoryIcon icon={category?.icon} className={size === "lg" ? "h-[18px] w-[18px]" : "h-4 w-4"} />
    </span>
  );
}
