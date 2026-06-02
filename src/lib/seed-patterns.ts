/**
 * Starter stitch patterns for new Craftly users.
 * 10 knitting + 10 crochet, covering foundation, texture, lace, cable, colorwork, edging.
 * Imported by the seed API route and optionally by the seed CLI script.
 */

export interface SeedPattern {
  name: string;
  type: "knit" | "crochet";
  category: string;
  difficulty: number;
  description: string;
  instructions: string;
  stitch_key: { repeat: number; rows: number; note: string };
  chart_data: string[][] | null;
  tags: string[];
  notes: string;
}

export const SEED_PATTERNS: SeedPattern[] = [
  // ──── KNIT ────
  {
    name: "Garter Stitch",
    type: "knit",
    category: "foundation",
    difficulty: 1,
    description:
      "The most basic knitting pattern — knit every row. Produces a flat, reversible, ridged fabric. Lies flat and does not curl. Excellent for beginners.",
    instructions:
      "Cast on any number of stitches.\nRow 1 (RS): Knit all stitches.\nRow 2 (WS): Knit all stitches.\nRepeat Rows 1–2.\nBind off loosely.\n\nIn the round: alternate knit one round, purl one round.",
    stitch_key: { repeat: 1, rows: 1, note: "Any number of stitches. Knit every row." },
    chart_data: [[".", "."]],
    tags: ["beginner", "reversible", "lies-flat", "foundation"],
    notes: "Also called 'plain knitting.' Great as a non-curling border for stockinette.",
  },
  {
    name: "Stockinette Stitch",
    type: "knit",
    category: "foundation",
    difficulty: 1,
    description:
      "The classic smooth V-patterned fabric. Alternating knit and purl rows when flat. Tends to curl at edges — add a garter or seed border.",
    instructions:
      "Cast on any number of stitches.\nRow 1 (RS): Knit all stitches.\nRow 2 (WS): Purl all stitches.\nRepeat Rows 1–2.\nBind off.\n\nIn the round: knit every round.",
    stitch_key: { repeat: 1, rows: 2, note: "Row 1 knit, Row 2 purl. In the round: knit all." },
    chart_data: [[".", "-"]],
    tags: ["beginner", "smooth", "versatile", "foundation"],
    notes: "Abbreviated 'St st'. Most commonly used stitch in knitting.",
  },
  {
    name: "Seed Stitch",
    type: "knit",
    category: "texture",
    difficulty: 2,
    description:
      "Single knits and purls alternate both horizontally and vertically, creating scattered seed-like bumps. Reversible, lies flat, no curling.",
    instructions:
      "Cast on an even number of stitches.\nRow 1 (RS): *K1, p1; repeat from * to end.\nRow 2 (WS): *P1, k1; repeat from * to end.\nRepeat Rows 1–2.\nBind off in pattern.",
    stitch_key: { repeat: 2, rows: 2, note: "Multiple of 2. Knit the purls, purl the knits." },
    chart_data: [
      [".", "-"],
      ["-", "."],
    ],
    tags: ["beginner-intermediate", "reversible", "lies-flat", "texture"],
    notes: "Called 'moss stitch' in UK terminology.",
  },
  {
    name: "Moss Stitch (American)",
    type: "knit",
    category: "texture",
    difficulty: 2,
    description:
      "A 4-row repeat: two rows of k1,p1 then two rows of p1,k1. Creates stacked blocks more pronounced than seed stitch.",
    instructions:
      "Cast on an even number of stitches.\nRow 1 (RS): *K1, p1; repeat from * to end.\nRow 2 (WS): *K1, p1; repeat from * to end.\nRow 3: *P1, k1; repeat from * to end.\nRow 4: *P1, k1; repeat from * to end.\nRepeat Rows 1–4.\nBind off in pattern.",
    stitch_key: { repeat: 2, rows: 4, note: "Multiple of 2. 4-row repeat." },
    chart_data: [
      [".", "-"],
      [".", "-"],
      ["-", "."],
      ["-", "."],
    ],
    tags: ["intermediate", "reversible", "lies-flat", "texture"],
    notes: "Also called Double Moss or Irish Moss. Not UK moss stitch (which is US seed stitch).",
  },
  {
    name: "1×1 Ribbing",
    type: "knit",
    category: "edging",
    difficulty: 1,
    description:
      "Stretchy, elastic fabric with vertical columns. Ideal for cuffs, hems, neckbands. Reversible.",
    instructions:
      "Cast on an even number of stitches.\nAll rows: *K1, p1; repeat from * to end.\nRepeat until desired length.\nBind off in pattern with stretchy bind-off.",
    stitch_key: { repeat: 2, rows: 1, note: "Multiple of 2. Same row every time." },
    chart_data: [[".", "-"]],
    tags: ["beginner", "stretchy", "edging", "cuffs", "reversible"],
    notes: "Use stretchy cast-on. 'Knit the knits, purl the purls.'",
  },
  {
    name: "2×2 Ribbing",
    type: "knit",
    category: "edging",
    difficulty: 2,
    description:
      "Wider, more pronounced ribs than 1×1. Very elastic. Common for sweater cuffs, hems, hats.",
    instructions:
      "Cast on a multiple of 4 stitches.\nAll rows: *K2, p2; repeat from * to end.\nRepeat until desired length.\nBind off in pattern with stretchy bind-off.",
    stitch_key: { repeat: 4, rows: 1, note: "Multiple of 4." },
    chart_data: [[".", ".", "-", "-"]],
    tags: ["beginner-intermediate", "stretchy", "edging", "cuffs", "hats"],
    notes: "For hats in round: multiples of 4. For flat with symmetrical edges: multiples of 4 + 2.",
  },
  {
    name: "Basketweave (4×4)",
    type: "knit",
    category: "texture",
    difficulty: 2,
    description:
      "Blocks of knit and purl alternate to mimic a woven basket. 4 rows of k4,p4 then 4 rows of p4,k4.",
    instructions:
      "Cast on a multiple of 8 stitches.\nRows 1–4: *K4, p4; repeat from * to end.\nRows 5–8: *P4, k4; repeat from * to end.\nRepeat Rows 1–8.\nBind off in pattern.",
    stitch_key: { repeat: 8, rows: 8, note: "Multiple of 8. 8-row repeat." },
    chart_data: [
      [".", ".", ".", ".", "-", "-", "-", "-"],
      [".", ".", ".", ".", "-", "-", "-", "-"],
      [".", ".", ".", ".", "-", "-", "-", "-"],
      [".", ".", ".", ".", "-", "-", "-", "-"],
      ["-", "-", "-", "-", ".", ".", ".", "."],
      ["-", "-", "-", "-", ".", ".", ".", "."],
      ["-", "-", "-", "-", ".", ".", ".", "."],
      ["-", "-", "-", "-", ".", ".", ".", "."],
    ],
    tags: ["beginner-intermediate", "texture", "blanket", "dishcloth"],
    notes: "Customizable: 3×3, 5×5, etc. Knit loosely — pattern tightens up.",
  },
  {
    name: "Diagonal Basket Weave",
    type: "knit",
    category: "texture",
    difficulty: 3,
    description:
      "Crossed stitches create diagonal woven lines. Dense, textured fabric similar to mini cables.",
    instructions:
      "Cast on an odd number of stitches.\nRow 1 (RS): Skip 1st st, knit 2nd st through back loop (don't drop), knit 1st st, drop both. Repeat across. Knit last st.\nRow 2 (WS): Skip 1st st, purl 2nd st (don't drop), purl 1st st, drop both. Repeat across. Knit last st.\nRepeat Rows 1–2.\nBind off loosely.",
    stitch_key: { repeat: 2, rows: 2, note: "Odd number of stitches. 2-row repeat." },
    chart_data: null,
    tags: ["intermediate", "texture", "woven", "diagonal", "dense"],
    notes: "Use needles 1–2 sizes larger. May curl — add a border.",
  },
  {
    name: "Feather and Fan (Old Shale)",
    type: "knit",
    category: "lace",
    difficulty: 3,
    description:
      "Classic Shetland lace creating scalloped wave edges. Only a 4-row repeat despite its intricate look.",
    instructions:
      "Cast on a multiple of 18 stitches.\nRow 1 (RS): Knit all.\nRow 2 (WS): Purl all.\nRow 3: *(K2tog) 3 times, (yo, k1) 6 times, (k2tog) 3 times; repeat from * to end.\nRow 4: Knit all.\nRepeat Rows 1–4.\nBind off loosely.",
    stitch_key: { repeat: 18, rows: 4, note: "Multiple of 18. Row 3 is the pattern row." },
    chart_data: null,
    tags: ["intermediate", "lace", "scalloped", "wave", "shetland"],
    notes: "Also called Old Shale. Blocking opens the lace significantly.",
  },
  {
    name: "Cable Twist",
    type: "knit",
    category: "cable",
    difficulty: 3,
    description:
      "A classic 6-stitch rope cable crossing every 6th row. Uses a cable needle for the twist.",
    instructions:
      "Cast on a multiple of 12 (6-st cable + 6-st purl background).\nRows 1, 3, 5 (RS): P6, *k6, p6; repeat.\nRows 2 (WS): K6, *p6, k6; repeat.\nRow 4 (Cable Cross, RS): P6, *slip 3 to CN hold back, k3, k3 from CN, p6; repeat.\nRow 6: Repeat Row 2.\nRepeat Rows 1–6.\nBind off.",
    stitch_key: { repeat: 12, rows: 6, note: "Multiple of 12. Cable cross on Row 4." },
    chart_data: null,
    tags: ["intermediate", "cable", "rope", "classic", "sweater"],
    notes: "Hold CN in front for left-leaning, back for right-leaning cable.",
  },

  // ──── CROCHET ────
  {
    name: "Single Crochet",
    type: "crochet",
    category: "foundation",
    difficulty: 1,
    description:
      "The most fundamental crochet stitch. Dense, tight, sturdy fabric. All other stitches are variations of this one.",
    instructions:
      "Foundation: Chain any number.\nRow 1: Insert hook into 2nd ch from hook. Yarn over, draw through ch (2 loops). Yarn over, draw through both loops. Repeat across. Turn.\nRow 2: Ch 1 (doesn't count as st). Insert hook under top 2 loops of first sc. Yarn over, draw up loop (2 loops). Yarn over, draw through both loops. Repeat across. Turn.\nRepeat Row 2.",
    stitch_key: { repeat: 1, rows: 1, note: "Single row repeat. Ch 1 turning ch does NOT count as stitch." },
    chart_data: [["sc", "sc", "sc", "sc", "sc", "sc", "sc", "sc", "sc", "sc"]],
    tags: ["beginner", "foundation", "basic", "dense", "amigurumi"],
    notes: "US terminology.",
  },
  {
    name: "Double Crochet",
    type: "crochet",
    category: "foundation",
    difficulty: 1,
    description:
      "Twice as tall as sc. Lighter, more flexible fabric. The workhorse of crochet — blankets, garments, granny squares.",
    instructions:
      "Foundation: Chain any number + 2.\nRow 1: Yarn over, insert hook into 4th ch from hook (3 skipped ch = first dc). Yarn over, draw through ch (3 loops). Yarn over, draw through 2 (2 loops). Yarn over, draw through last 2. Repeat across. Turn.\nRow 2: Ch 3 (counts as first dc). Work dc in each st across. Last dc in top of turning ch-3. Turn.\nRepeat Row 2.",
    stitch_key: { repeat: 1, rows: 1, note: "Ch 3 turning ch counts as first dc." },
    chart_data: [["dc", "dc", "dc", "dc", "dc", "dc", "dc", "dc", "dc", "dc"]],
    tags: ["beginner", "foundation", "basic", "blanket", "fast"],
    notes: "US terminology. Ch 3 turning chain counts as first dc.",
  },
  {
    name: "Half Double Crochet",
    type: "crochet",
    category: "foundation",
    difficulty: 1,
    description:
      "Medium height between sc and dc. Slightly looser than sc but denser than dc. Great for hats, scarves, sweaters.",
    instructions:
      "Foundation: Chain any number + 1.\nRow 1: Yarn over, insert hook into 3rd ch from hook. Yarn over, draw through ch (3 loops). Yarn over, draw through all 3 loops. Repeat across. Turn.\nRow 2: Ch 2 (counts as first hdc). Yarn over, skip 1st st, insert hook into next st. Draw up loop (3 loops). Yarn over, draw through all 3. Repeat across. Work last hdc into top of turning ch-2. Turn.\nRepeat Row 2.",
    stitch_key: { repeat: 1, rows: 1, note: "Ch 2 turning ch counts as first hdc." },
    chart_data: [["hdc", "hdc", "hdc", "hdc", "hdc", "hdc", "hdc", "hdc", "hdc", "hdc"]],
    tags: ["beginner", "foundation", "basic", "versatile", "hats"],
    notes: "US terminology. Ch 2 turning chain counts as first hdc.",
  },
  {
    name: "Granny Stitch",
    type: "crochet",
    category: "texture",
    difficulty: 2,
    description:
      "Clusters of 3 dc worked into spaces between clusters. Dense, textured. The stitch behind the iconic granny square.",
    instructions:
      "Foundation: Chain a multiple of 3.\nRow 1: 2 dc in 3rd ch from hook. *Skip 2 ch, 3 dc in next ch. Repeat from * across. Turn.\nRow 2: Ch 2 (counts as dc). 3 dc in first space. *3 dc in each space between clusters across.* 1 dc in top of turning ch. Turn.\nRow 3: Ch 2, 2 dc in first space. *3 dc in each space across.* Turn.\nRepeat Rows 2–3.",
    stitch_key: { repeat: 3, rows: 2, note: "Multiple of 3. Clusters into spaces, not stitch tops." },
    chart_data: [["dc3", "-", "-", "dc3", "-", "-", "dc3", "-", "-", "dc3"]],
    tags: ["classic", "textured", "clusters", "granny-square", "blanket"],
    notes: "US terminology.",
  },
  {
    name: "Shell Stitch",
    type: "crochet",
    category: "lace",
    difficulty: 2,
    description:
      "5 dc into the same stitch create scalloped fans, anchored by sc. Open, lacy fabric with great drape.",
    instructions:
      "Foundation: Chain a multiple of 6 + 2.\nRow 1: Sc in 2nd ch from hook. *Skip 2 ch, 5 dc in next ch (shell), skip 2 ch, sc in next ch. Repeat from * across. Turn.\nRow 2: Ch 3, 2 dc in first sc (half shell). *Skip 2 dc, sc in center of shell, skip 2 dc, 5 dc in next sc (full shell). Repeat from * ending with 3 dc in last sc. Turn.\nRow 3: Ch 1, sc in first dc. *Skip 2 dc, 5 dc in next sc, skip 2 dc, sc in center of shell. Repeat from * ending with sc in top of ch-3. Turn.\nRepeat Rows 2–3.",
    stitch_key: { repeat: 6, rows: 2, note: "Multiple of 6 + 2. Shell = 5 dc. Half shell = 3 dc at edges." },
    chart_data: [["sc", "-", "-", "sh5", "-", "-", "sc", "-", "-", "sh5", "-", "-", "sc"]],
    tags: ["lace", "scalloped", "baby-blanket", "edging", "beginner-friendly"],
    notes: "US terminology.",
  },
  {
    name: "V-Stitch",
    type: "crochet",
    category: "lace",
    difficulty: 2,
    description:
      "(Dc, ch 1, dc) into the same stitch forms a 'V'. Airy, lightweight, works up fast. Perfect for shawls and summer tops.",
    instructions:
      "Foundation: Chain a multiple of 3 + 1.\nRow 1: Dc in 5th ch from hook. Ch 1, dc in same ch (first V-st). *Skip 2 ch, (dc, ch 1, dc) in next ch. Repeat from * across. Ch 3, turn.\nRow 2: (Dc, ch 1, dc) in first ch-1 space. *Skip next dc, (dc, ch 1, dc) in next ch-1 space. Repeat from * across. Dc in top of turning ch-3. Ch 3, turn.\nRepeat Row 2.",
    stitch_key: { repeat: 3, rows: 1, note: "Multiple of 3 + 1. Single row repeat. V-st = (dc, ch1, dc)." },
    chart_data: [["V", "-", "-", "V", "-", "-", "V", "-", "-", "V", "-"]],
    tags: ["lace", "openwork", "fast", "summer", "shawl", "lightweight"],
    notes: "US terminology. Work into ch-1 spaces of previous row.",
  },
  {
    name: "Waffle Stitch",
    type: "crochet",
    category: "texture",
    difficulty: 3,
    description:
      "Dimensional grid pattern using front post double crochet (FPdc). Raised walls and recessed pockets. Thick and warm.",
    instructions:
      "Foundation: Chain a multiple of 3 + 2.\nRow 1 (WS): Dc in 3rd ch from hook and each ch across. Turn.\nRow 2 (RS): Ch 2. *FPdc, dc in next 2 sts. Repeat from * to last 2 sts. FPdc, dc. Turn.\nRow 3: Ch 2. *Dc, FPdc in next 2 sts. Repeat from * to last 2 sts. Dc in each of last 2 sts. Turn.\nRepeat Rows 2–3.",
    stitch_key: { repeat: 3, rows: 2, note: "Multiple of 3. RS: FPdc-dc-dc. WS: dc-FPdc-FPdc." },
    chart_data: [
      ["FP", "dc", "dc", "FP", "dc", "dc", "FP", "dc", "dc", "FP", "dc", "dc"],
      ["dc", "dc", "FP", "FP", "dc", "FP", "FP", "dc", "FP", "FP", "dc", "dc"],
    ],
    tags: ["textured", "thick", "warm", "blanket", "fpdc", "grid"],
    notes: "US terminology. FPdc = front post double crochet.",
  },
  {
    name: "Bobble Stitch",
    type: "crochet",
    category: "texture",
    difficulty: 3,
    description:
      "Raised bumps by working 5 incomplete dc into one stitch and closing together. Bobbles pop to the right side.",
    instructions:
      "Foundation: Chain a multiple of 4 + 3.\nBobble: (Yo, insert hook, pull up loop, pull through 2) 5 times in same st (6 loops). Yo, pull through all 6.\nBase: Sc across. Turn.\nRow 1 (WS): Ch 2 (hdc). *Bobble, sc, hdc in next 2 sts. Repeat from * to last st. Hdc. Turn.\nRow 2: Ch 2, hdc across. Turn.\nRow 3: Ch 2, hdc in next 2 sts. *Bobble, sc, hdc in next 2 sts. Repeat from *. Bobble, sc, hdc. Turn.\nRow 4: Repeat Row 2.\nRepeat Rows 1–4.",
    stitch_key: { repeat: 4, rows: 4, note: "Multiple of 4 + 3. 4-row repeat. Bobble = 5 incomplete dc." },
    chart_data: [
      ["hdc", "BO", "sc", "hdc", "hdc", "BO", "sc", "hdc", "hdc", "BO", "sc", "hdc"],
      ["hdc", "hdc", "hdc", "hdc", "hdc", "hdc", "hdc", "hdc", "hdc", "hdc", "hdc", "hdc"],
      ["hdc", "hdc", "BO", "sc", "hdc", "hdc", "BO", "sc", "hdc", "hdc", "BO", "hdc"],
    ],
    tags: ["textured", "raised", "dimensional", "baby-blanket"],
    notes: "US terminology. Worked from WS so bobbles pop to RS.",
  },
  {
    name: "Corner to Corner (C2C)",
    type: "crochet",
    category: "colorwork",
    difficulty: 3,
    description:
      "Diagonal construction using tiles (ch-3 + 3 dc). Increase to widest point, then decrease. Ideal for graph-based colorwork.",
    instructions:
      "Increase Phase:\nRow 1: Ch 6. Dc in 4th ch from hook, dc in next 2 ch. (1 tile)\nRow 2: Ch 6, dc in 4th ch from hook, dc in next 2 ch. Sl st into ch-3 sp of prev tile. Ch 3, 3 dc in same sp. Turn. (2 tiles)\nRepeat, adding 1 tile per row until desired width.\n\nDecrease Phase:\nSl st in first 3 dc and into ch-3 sp. Ch 3, 3 dc in same sp. Sl st into each ch-3 sp, ch 3, 3 dc across. Skip last sp. Turn.\nRepeat until 1 tile. Fasten off.",
    stitch_key: { repeat: 0, rows: 0, note: "No fixed multiple — grows diagonally. 1 tile = ch3 + 3dc." },
    chart_data: [
      ["t1"],
      ["t2", "t2"],
      ["t3", "t3", "t3"],
      ["t2", "t2"],
      ["t1"],
    ],
    tags: ["colorwork", "graphgan", "diagonal", "blanket", "geometric"],
    notes: "US terminology. Mini C2C uses hdc for smaller tiles.",
  },
  {
    name: "Moss Stitch (Crochet)",
    type: "crochet",
    category: "texture",
    difficulty: 2,
    description:
      "Alternating sc and ch-1 spaces, with sc worked into the spaces of the previous row. Woven texture, lies flat naturally.",
    instructions:
      "Foundation: Chain an even number.\nRow 1: Sc in 4th ch from hook. *Ch 1, skip 1 ch, sc in next ch. Repeat from * across. Ch 2, turn.\nRow 2: Sc in first ch-1 space. *Ch 1, sc in next ch-1 space. Repeat from * across. Final sc in space beside turning ch. Ch 2, turn.\nRepeat Row 2.",
    stitch_key: { repeat: 2, rows: 1, note: "Multiple of 2. Single row repeat. Sc into ch-1 spaces." },
    chart_data: [
      ["sc", "-", "sc", "-", "sc", "-", "sc", "-", "sc", "-"],
      ["-", "sc", "-", "sc", "-", "sc", "-", "sc", "-", "sc"],
    ],
    tags: ["textured", "woven", "beginner", "non-curling", "variegated-yarn"],
    notes: "US terminology. Also called linen stitch or granite stitch.",
  },
];
