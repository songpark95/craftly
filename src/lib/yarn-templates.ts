// Popular yarns with pre-filled details
// When user starts typing a name, we suggest matches and auto-fill the rest

export interface YarnTemplate {
  name: string;
  brand: string;
  weight: string;
  fiber: string;
  yardage_per_skein: number;
  colors: string[]; // common color hexes
}

export const YARN_TEMPLATES: YarnTemplate[] = [
  // Malabrigo
  { name: "Rios", brand: "Malabrigo", weight: "Worsted", fiber: "Superwash Merino", yardage_per_skein: 210, colors: ["#8B4513", "#2E4057", "#556B2F", "#8B0000", "#4A7C59"] },
  { name: "Mechita", brand: "Malabrigo", weight: "Fingering", fiber: "Superwash Merino", yardage_per_skein: 335, colors: ["#D4A843", "#7B5EA7", "#C9707D", "#3B82F6"] },
  { name: "Silkpaca", brand: "Malabrigo", weight: "Lace", fiber: "Alpaca/Silk", yardage_per_skein: 420, colors: ["#F5F5DC", "#D2B48C", "#8B0000", "#191970"] },
  { name: "Worsted", brand: "Malabrigo", weight: "Worsted", fiber: "Merino", yardage_per_skein: 210, colors: ["#4A7C59", "#8B4513", "#2F4F4F", "#800020"] },
  { name: "Rasta", brand: "Malabrigo", weight: "Bulky", fiber: "Superwash Merino", yardage_per_skein: 90, colors: ["#FF6347", "#4A7C59", "#FFD700", "#4B0082"] },

  // Lion Brand
  { name: "Mandala", brand: "Lion Brand", weight: "DK", fiber: "Acrylic", yardage_per_skein: 590, colors: ["#9370DB", "#FF69B4", "#20B2AA", "#F0E68C"] },
  { name: "Wool-Ease", brand: "Lion Brand", weight: "Worsted", fiber: "Wool/Acrylic", yardage_per_skein: 197, colors: ["#808080", "#4A7C59", "#4169E1", "#8B4513"] },
  { name: "Heartland", brand: "Lion Brand", weight: "Worsted", fiber: "Acrylic", yardage_per_skein: 251, colors: ["#2F4F4F", "#8B4513", "#556B2F", "#800020"] },
  { name: "Chroma", brand: "Lion Brand", weight: "Worsted", fiber: "Wool/Acrylic", yardage_per_skein: 343, colors: ["#FF6347", "#4682B4", "#9370DB", "#3CB371"] },
  { name: "Cover Story", brand: "Lion Brand", weight: "DK", fiber: "Acrylic", yardage_per_skein: 530, colors: ["#FFB6C1", "#87CEEB", "#98FB98", "#DDA0DD"] },

  // Cascade
  { name: "220", brand: "Cascade", weight: "Worsted", fiber: "Peruvian Highland Wool", yardage_per_skein: 220, colors: ["#4A7C59", "#8B4513", "#191970", "#800020", "#000000"] },
  { name: "Superwash Sport", brand: "Cascade", weight: "Sport", fiber: "Superwash Merino", yardage_per_skein: 150, colors: ["#FF6347", "#4169E1", "#3CB371", "#FFD700"] },
  { name: "Heritage", brand: "Cascade", weight: "Fingering", fiber: "Superwash Merino/Nylon", yardage_per_skein: 437, colors: ["#FFB6C1", "#87CEEB", "#F0E68C", "#E6E6FA"] },

  // Bernat
  { name: "Softee Baby", brand: "Bernat", weight: "DK", fiber: "Acrylic", yardage_per_skein: 442, colors: ["#FFB6C1", "#87CEEB", "#98FB98", "#FFFACD"] },
  { name: "Blanket", brand: "Bernat", weight: "Super Bulky", fiber: "Acrylic", yardage_per_skein: 220, colors: ["#808080", "#D2B48C", "#F5F5DC", "#B0C4DE"] },
  { name: "Velvet", brand: "Bernat", weight: "Bulky", fiber: "Polyester", yardage_per_skein: 300, colors: ["#4A7C59", "#8B4513", "#4B0082", "#800020"] },

  // Caron
  { name: "Simply Soft", brand: "Caron", weight: "Worsted", fiber: "Acrylic", yardage_per_skein: 315, colors: ["#808080", "#4A7C59", "#4169E1", "#FF6347"] },
  { name: "Cakes", brand: "Caron", weight: "Worsted", fiber: "Acrylic", yardage_per_skein: 530, colors: ["#9370DB", "#FF69B4", "#20B2AA", "#F0E68C"] },
  { name: "Swirl", brand: "Caron", weight: "Aran", fiber: "Acrylic", yardage_per_skein: 281, colors: ["#DEB887", "#8FBC8F", "#BC8F8F", "#B0C4DE"] },

  // Rowan
  { name: "Pure Wool Superwash DK", brand: "Rowan", weight: "DK", fiber: "Superwash Wool", yardage_per_skein: 131, colors: ["#4A7C59", "#8B4513", "#191970", "#F5F5DC"] },
  { name: "Felted Tweed", brand: "Rowan", weight: "DK", fiber: "Wool/Alpaca", yardage_per_skein: 175, colors: ["#556B2F", "#8B0000", "#4A7C59", "#808080"] },

  // DROPS
  { name: "Fabel", brand: "DROPS", weight: "Fingering", fiber: "Superwash Wool/Nylon", yardage_per_skein: 205, colors: ["#4A7C59", "#D4A843", "#7B5EA7", "#808080"] },
  { name: "Cotton Merino", brand: "DROPS", weight: "DK", fiber: "Cotton/Merino", yardage_per_skein: 115, colors: ["#FFB6C1", "#87CEEB", "#98FB98", "#FFFACD"] },

  // Scheepjes
  { name: "Whirl", brand: "Scheepjes", weight: "Fingering", fiber: "Cotton/Acrylic", yardage_per_skein: 550, colors: ["#FF69B4", "#9370DB", "#20B2AA", "#FFD700"] },
  { name: "Colour Crafter", brand: "Scheepjes", weight: "Worsted", fiber: "Acrylic", yardage_per_skein: 300, colors: ["#4A7C59", "#4169E1", "#FF6347", "#FFD700"] },

  // Sirdar
  { name: "Snuggly DK", brand: "Sirdar", weight: "DK", fiber: "Nylon/Cotton", yardage_per_skein: 165, colors: ["#FFB6C1", "#87CEEB", "#98FB98", "#E6E6FA"] },
  { name: "Supersoft", brand: "Sirdar", weight: "DK", fiber: "Acrylic", yardage_per_skein: 260, colors: ["#808080", "#D2B48C", "#B0C4DE", "#F5F5DC"] },

  // Premier
  { name: "Anti-Pilling", brand: "Premier", weight: "Worsted", fiber: "Acrylic", yardage_per_skein: 260, colors: ["#808080", "#4A7C59", "#4169E1", "#8B4513"] },
  { name: "Cotton Fair", brand: "Premier", weight: "DK", fiber: "Cotton/Acrylic", yardage_per_skein: 317, colors: ["#FFB6C1", "#87CEEB", "#F5F5DC", "#98FB98"] },

  // Plymouth
  { name: "Encore Worsted", brand: "Plymouth", weight: "Worsted", fiber: "Acrylic/Wool", yardage_per_skein: 200, colors: ["#808080", "#4A7C59", "#4169E1", "#8B4513"] },

  // Patons
  { name: "Classic Wool", brand: "Patons", weight: "Worsted", fiber: "Wool", yardage_per_skein: 205, colors: ["#4A7C59", "#8B4513", "#808080", "#800020"] },

  // Loops & Threads
  { name: "Impeccable", brand: "Loops & Threads", weight: "Worsted", fiber: "Acrylic", yardage_per_skein: 277, colors: ["#808080", "#4A7C59", "#4169E1", "#FF6347"] },
  { name: "Cozy Wool", brand: "Loops & Threads", weight: "Worsted", fiber: "Wool/Acrylic", yardage_per_skein: 182, colors: ["#D2B48C", "#556B2F", "#8B4513", "#4169E1"] },

  // KnitPicks
  { name: "Stroll", brand: "KnitPicks", weight: "Fingering", fiber: "Superwash Merino/Nylon", yardage_per_skein: 231, colors: ["#4A7C59", "#8B4513", "#4169E1", "#FF6347"] },
  { name: "Wool of the Andes", brand: "KnitPicks", weight: "Worsted", fiber: "Peruvian Highland Wool", yardage_per_skein: 110, colors: ["#4A7C59", "#8B4513", "#191970", "#800020"] },

  // Haybonond
  { name: "Cotton Bamboo", brand: "Haybonond", weight: "DK", fiber: "Cotton/Bamboo", yardage_per_skein: 120, colors: ["#98FB98", "#F5F5DC", "#87CEEB", "#FFB6C1"] },

  // West Yorkshire Spinners
  { name: "ColourLab DK", brand: "WYS", weight: "DK", fiber: "Superwash Wool", yardage_per_skein: 137, colors: ["#4A7C59", "#FF6347", "#4169E1", "#FFD700"] },
];

// Simple search: match name or brand, case-insensitive
export function searchYarnTemplates(query: string): YarnTemplate[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  return YARN_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.brand.toLowerCase().includes(q)
  ).slice(0, 6);
}
