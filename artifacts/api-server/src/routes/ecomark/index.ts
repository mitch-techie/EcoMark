import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { CalculateFootprintBody } from "@workspace/api-zod";

const router = Router();

function calculateScore(
  transport: string,
  diet: string,
  energy: string,
  shopping: string
): number {
  const transportScore: Record<string, number> = {
    car: 30,
    public_transport: 15,
    walking_biking: 0,
  };
  const dietScore: Record<string, number> = {
    meat_based: 25,
    mixed: 15,
    vegetarian_vegan: 5,
  };
  const energyScore: Record<string, number> = {
    high: 20,
    medium: 12,
    low: 4,
  };
  const shoppingScore: Record<string, number> = {
    frequent: 15,
    moderate: 8,
    minimal: 2,
  };

  return (
    (transportScore[transport] ?? 0) +
    (dietScore[diet] ?? 0) +
    (energyScore[energy] ?? 0) +
    (shoppingScore[shopping] ?? 0)
  );
}

function getCategory(score: number): {
  category: "green_hero" | "improving" | "high_impact";
  categoryLabel: string;
} {
  if (score <= 30) {
    return { category: "green_hero", categoryLabel: "Green Hero" };
  } else if (score <= 60) {
    return { category: "improving", categoryLabel: "Improving" };
  } else {
    return { category: "high_impact", categoryLabel: "High Impact" };
  }
}

router.post("/calculate", async (req, res) => {
  const parsed = CalculateFootprintBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { transport, diet, energy, shopping } = parsed.data;
  const score = calculateScore(transport, diet, energy, shopping);
  const { category, categoryLabel } = getCategory(score);

  const transportLabels: Record<string, string> = {
    car: "driving a car",
    public_transport: "using public transport",
    walking_biking: "walking or biking",
  };
  const dietLabels: Record<string, string> = {
    meat_based: "a meat-based diet",
    mixed: "a mixed diet",
    vegetarian_vegan: "a vegetarian or vegan diet",
  };
  const energyLabels: Record<string, string> = {
    high: "high energy usage at home",
    medium: "moderate energy usage at home",
    low: "low energy usage at home",
  };
  const shoppingLabels: Record<string, string> = {
    frequent: "frequent shopping",
    moderate: "moderate shopping",
    minimal: "minimal shopping",
  };

  const prompt = `You are an environmental sustainability advisor. A user has a carbon footprint score of ${score}/90 (category: ${categoryLabel}).

Their lifestyle:
- Transport: ${transportLabels[transport]}
- Diet: ${dietLabels[diet]}
- Energy: ${energyLabels[energy]}
- Shopping: ${shoppingLabels[shopping]}

Give exactly 3 short, practical, personalized sustainability tips to help them reduce their environmental impact. 
Each tip should be specific to their lifestyle choices above.
Format your response as a JSON array of exactly 3 strings. Each tip should be 1-2 sentences maximum.
Example: ["Tip 1 here.", "Tip 2 here.", "Tip 3 here."]
Return ONLY the JSON array, no other text.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    });

    const text = response.text ?? "[]";
    let tips: string[] = [];
    try {
      tips = JSON.parse(text);
      if (!Array.isArray(tips)) tips = [];
      tips = tips.slice(0, 3).filter((t): t is string => typeof t === "string");
    } catch {
      tips = [
        "Consider reducing car usage by carpooling or using public transport.",
        "Try incorporating more plant-based meals into your weekly diet.",
        "Switch to energy-efficient LED bulbs and appliances at home.",
      ];
    }

    res.json({ score, category, categoryLabel, tips });
  } catch (err) {
    req.log.error({ err }, "Gemini API error");
    res.status(500).json({ error: "Failed to generate tips" });
  }
});

export default router;
