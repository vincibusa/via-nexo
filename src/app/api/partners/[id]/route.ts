import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Partner ID is required" },
        { status: 400 }
      );
    }

    // Cerca il partner nella view unificata
    const { data: partner, error } = await supabase
      .from("partners")
      .select(
        `
        id, name, type, description, location, price_range, rating,
        amenities, coordinates, images, contact_info, created_at, updated_at
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase error:", error);

      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Partner not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch partner" },
        { status: 500 }
      );
    }

    // Transform data to match PartnerData interface
    const transformedPartner = {
      id: partner.id,
      name: partner.name,
      type: partner.type,
      description: partner.description,
      location: partner.location,
      price_range: partner.price_range,
      rating:
        typeof partner.rating === "string"
          ? parseFloat(partner.rating)
          : partner.rating,
      amenities: partner.amenities || [],
      coordinates: partner.coordinates,
      images: partner.images || [],
      contact_info: partner.contact_info
        ? {
            phone: partner.contact_info.phone,
            email: partner.contact_info.email,
            website: partner.contact_info.website,
          }
        : undefined,
      created_at: partner.created_at,
      updated_at: partner.updated_at,
    };

    return NextResponse.json(transformedPartner);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
