import {
  type LucideIcon,
  Wrench,
  Camera,
  Music,
  Laptop,
  Gamepad2,
  Tent,
  Dumbbell,
  Palette,
  UtensilsCrossed,
  PartyPopper,
  Baby,
  Leaf,
  Car,
  BookOpen,
  Home,
  Shirt,
} from "lucide-react";

export type Category = {
  name: string;
  icon: LucideIcon;
  subcategories: string[];
};

export const CATEGORIES: Category[] = [
  {
    name: "Tools & DIY",
    icon: Wrench,
    subcategories: [
      "Power Tools",
      "Hand Tools",
      "Plumbing & Electrical",
      "Painting & Decorating",
      "Welding & Metalwork",
    ],
  },
  {
    name: "Photography & Film",
    icon: Camera,
    subcategories: [
      "DSLR & Mirrorless Cameras",
      "Video & Cinema Cameras",
      "Drones & Aerial Photography",
      "Studio Lighting & Equipment",
      "Action Cameras",
    ],
  },
  {
    name: "Music & Audio",
    icon: Music,
    subcategories: [
      "Guitar & Bass",
      "Keyboards & Piano",
      "Drums & Percussion",
      "DJ & Music Production",
      "Studio & Recording Equipment",
      "Wind & Brass Instruments",
    ],
  },
  {
    name: "Tech & Electronics",
    icon: Laptop,
    subcategories: [
      "Computers & Laptops",
      "Tablets & iPads",
      "Smart Home Devices",
      "Projectors & Displays",
      "Networking & Tech Setup",
    ],
  },
  {
    name: "Gaming",
    icon: Gamepad2,
    subcategories: ["Consoles & Controllers", "VR & AR Headsets", "Gaming Peripherals"],
  },
  {
    name: "Outdoor & Adventure",
    icon: Tent,
    subcategories: [
      "Camping & Hiking",
      "Climbing & Trekking",
      "Fishing",
      "Hunting",
      "Cycling",
      "Water Sports",
      "Winter Sports",
    ],
  },
  {
    name: "Sports & Fitness",
    icon: Dumbbell,
    subcategories: [
      "Gym & Weightlifting Equipment",
      "Yoga & Pilates",
      "Racquet Sports",
      "Team Sports Equipment",
      "Martial Arts",
    ],
  },
  {
    name: "Art & Craft",
    icon: Palette,
    subcategories: [
      "Painting & Drawing",
      "Sculpting & Pottery",
      "Sewing & Textile",
      "Jewellery Making",
      "3D Printing",
    ],
  },
  {
    name: "Kitchen & Cooking",
    icon: UtensilsCrossed,
    subcategories: [
      "Specialty Cooking Equipment",
      "Baking & Pastry",
      "Barista & Coffee Equipment",
      "Outdoor BBQ & Grilling",
    ],
  },
  {
    name: "Events & Party",
    icon: PartyPopper,
    subcategories: [
      "Party & Decoration Setup",
      "Sound & PA Systems",
      "Lighting & Effects",
      "Catering Equipment",
      "Photo Booth Equipment",
    ],
  },
  {
    name: "Baby & Kids",
    icon: Baby,
    subcategories: ["Baby Gear", "Kids Toys & Educational", "Child Safety Equipment"],
  },
  {
    name: "Garden & Outdoors",
    icon: Leaf,
    subcategories: [
      "Gardening Tools",
      "Lawn & Landscaping Equipment",
      "Irrigation & Water Systems",
    ],
  },
  {
    name: "Automotive",
    icon: Car,
    subcategories: ["Car Tools & Diagnostics", "Detailing & Cleaning", "Towing & Hauling Equipment"],
  },
  {
    name: "Education & Learning",
    icon: BookOpen,
    subcategories: [
      "Science & Lab Equipment",
      "Language Learning Tools",
      "Musical Theory & Education",
      "Coding & Electronics Kits",
    ],
  },
  {
    name: "Home & Living",
    icon: Home,
    subcategories: [
      "Furniture",
      "Cleaning Equipment",
      "Moving & Storage Equipment",
      "Home Theatre Setup",
    ],
  },
  {
    name: "Fashion & Accessories",
    icon: Shirt,
    subcategories: [
      "Formal & Occasion Wear",
      "Costumes & Cosplay",
      "Luxury Accessories & Bags",
      "Jewellery & Watches",
    ],
  },
];

export function getCategoryForSub(sub: string): string {
  return CATEGORIES.find((c) => c.subcategories.includes(sub))?.name ?? sub;
}
