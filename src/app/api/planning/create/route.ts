import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createTravelPlan } from "@/lib/agents/travel-planning-agent";

const planningSchema = z.object({
  selectedPartners: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        location: z.string(),
        type: z.enum(["hotel", "restaurant", "tour", "shuttle"]),
        rating: z.number(),
        price_range: z.string(),
        images: z.array(z.string()).optional(),
        contact_info: z
          .object({
            phone: z.string().optional(),
            email: z.string().optional(),
            website: z.string().optional(),
          })
          .optional(),
        amenities: z.array(z.string()).optional(),
        coordinates: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .optional(),
      })
    )
    .min(1, "Almeno un partner deve essere selezionato"),
  userQuery: z.string().min(1, "Query utente è richiesta"),
  preferences: z
    .object({
      duration: z.number().optional(),
      budget: z.string().optional(),
      travelStyle: z.string().optional(),
      groupSize: z.number().optional(),
      dates: z
        .object({
          start: z.string().optional(),
          end: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "20"); // Lower limit for planning
const RATE_LIMIT_WINDOW = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "900000"
);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimit.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Troppe richieste. Riprova più tardi." },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = planningSchema.parse(body);

    console.log(
      "[PLANNING_API] Creating travel plan with",
      validatedData.selectedPartners.length,
      "partners"
    );

    // Create travel plan using the agent
    const travelPlan = await createTravelPlan({
      selectedPartners: validatedData.selectedPartners,
      userQuery: validatedData.userQuery,
      preferences: validatedData.preferences || {},
    });

    console.log("[PLANNING_API] Travel plan created successfully");

    return NextResponse.json({
      success: true,
      plan: travelPlan,
      partnersCount: validatedData.selectedPartners.length,
    });
  } catch (error) {
    console.error("[PLANNING_API] Error creating travel plan:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Dati non validi",
          details: error.errors.map(e => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Errore interno del server durante la creazione del piano" },
      { status: 500 }
    );
  }
}
