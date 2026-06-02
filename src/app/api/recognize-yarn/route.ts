import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface RecognizedYarn {
  name: string;
  brand: string;
  weight: string;
  fiber: string;
  color_hex: string;
  color_name: string;
  yardage_per_skein: number | null;
  quantity_estimate: number;
  confidence: "high" | "medium" | "low";
  notes: string;
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json(); // base64 data URL

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: image },
              },
              {
                type: "text",
                text: `Analyze this photo of yarn or yarn stash. For each distinct yarn skein/ball you can identify, return a JSON array with these fields:
- name: yarn line name (e.g. "Rios", "Wool-Ease", "Mandala") or "Unknown" if can't tell
- brand: manufacturer (e.g. "Malabrigo", "Lion Brand") or "Unknown"
- weight: yarn weight class (Lace, Fingering, Sport, DK, Worsted, Bulky, Super Bulky) or best guess
- fiber: fiber content if visible on label (e.g. "Merino", "Acrylic", "Cotton") or "Unknown"
- color_hex: approximate hex color code (e.g. "#4A7C59")
- color_name: color name if visible, or descriptive name (e.g. "Sage Green", "Navy")
- yardage_per_skein: yardage if visible on label, or null
- quantity_estimate: number of skeins of this yarn you can count, minimum 1
- confidence: "high" if label is clearly readable, "medium" if partially readable or recognizable, "low" if guessing
- notes: any useful notes (e.g. "label visible, 250g ball", "partial skein", "worsted weight cotton blend")

Return ONLY the JSON array, no other text. If you cannot identify any yarn, return an empty array [].`,
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", err);
      return NextResponse.json({ error: "Vision API failed" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    let yarns: RecognizedYarn[];
    try {
      // Try to extract JSON from the response (may be wrapped in markdown)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return NextResponse.json({ yarns: [], raw: content });
      }
      yarns = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ yarns: [], raw: content });
    }

    return NextResponse.json({ yarns });
  } catch (err) {
    console.error("Yarn recognition error:", err);
    return NextResponse.json({ error: "Recognition failed" }, { status: 500 });
  }
}
