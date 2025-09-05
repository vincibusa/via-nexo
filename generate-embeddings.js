import { createClient } from "@supabase/supabase-js";

// Configurazione Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// URL dell'API interna per generare embeddings
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002";

async function generateEmbedding(text) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/embeddings/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Embedding generation failed: ${data.error}`);
    }

    return data.data.embeddings;
  } catch (error) {
    console.error("Error generating embedding via API:", error);
    throw error;
  }
}

async function generateHotelEmbeddings() {
  console.log("Generating embeddings for hotels without embeddings...");

  const { data: hotels, error } = await supabase
    .from("hotels")
    .select("id, name, description, location, amenities")
    .is("vector_embedding", null);

  if (error) {
    console.error("Error fetching hotels:", error);
    return;
  }

  console.log(`Found ${hotels.length} hotels without embeddings`);

  for (const hotel of hotels) {
    try {
      const textToEmbed = `${hotel.name}. ${hotel.description}. Located in ${hotel.location}. Amenities: ${hotel.amenities?.join(", ") || "none"}`;

      console.log(`Generating embedding for: ${hotel.name}`);
      const embedding = await generateEmbedding(textToEmbed);

      const { error: updateError } = await supabase
        .from("hotels")
        .update({ vector_embedding: embedding })
        .eq("id", hotel.id);

      if (updateError) {
        console.error(`Error updating hotel ${hotel.name}:`, updateError);
      } else {
        console.log(`✓ Embedding generated for: ${hotel.name}`);
      }

      // Wait a bit to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to process hotel ${hotel.name}:`, error);
    }
  }
}

async function generateRestaurantEmbeddings() {
  console.log("Generating embeddings for restaurants without embeddings...");

  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, description, cuisine_type, location, menu_highlights")
    .is("vector_embedding", null);

  if (error) {
    console.error("Error fetching restaurants:", error);
    return;
  }

  console.log(`Found ${restaurants.length} restaurants without embeddings`);

  for (const restaurant of restaurants) {
    try {
      const textToEmbed = `${restaurant.name}. ${restaurant.description}. Cuisine: ${restaurant.cuisine_type}. Located in ${restaurant.location}. Menu highlights: ${restaurant.menu_highlights?.join(", ") || "none"}`;

      console.log(`Generating embedding for: ${restaurant.name}`);
      const embedding = await generateEmbedding(textToEmbed);

      const { error: updateError } = await supabase
        .from("restaurants")
        .update({ vector_embedding: embedding })
        .eq("id", restaurant.id);

      if (updateError) {
        console.error(
          `Error updating restaurant ${restaurant.name}:`,
          updateError
        );
      } else {
        console.log(`✓ Embedding generated for: ${restaurant.name}`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to process restaurant ${restaurant.name}:`, error);
    }
  }
}

async function generateTourEmbeddings() {
  console.log("Generating embeddings for tours without embeddings...");

  const { data: tours, error } = await supabase
    .from("tours")
    .select("id, name, description, tour_type, location, includes")
    .is("vector_embedding", null);

  if (error) {
    console.error("Error fetching tours:", error);
    return;
  }

  console.log(`Found ${tours.length} tours without embeddings`);

  for (const tour of tours) {
    try {
      const textToEmbed = `${tour.name}. ${tour.description}. Type: ${tour.tour_type}. Located in ${tour.location}. Includes: ${tour.includes?.join(", ") || "none"}`;

      console.log(`Generating embedding for: ${tour.name}`);
      const embedding = await generateEmbedding(textToEmbed);

      const { error: updateError } = await supabase
        .from("tours")
        .update({ vector_embedding: embedding })
        .eq("id", tour.id);

      if (updateError) {
        console.error(`Error updating tour ${tour.name}:`, updateError);
      } else {
        console.log(`✓ Embedding generated for: ${tour.name}`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to process tour ${tour.name}:`, error);
    }
  }
}

async function generateShuttleEmbeddings() {
  console.log("Generating embeddings for shuttles without embeddings...");

  const { data: shuttles, error } = await supabase
    .from("shuttles")
    .select(
      "id, name, description, service_type, departure_location, arrival_location, features"
    )
    .is("vector_embedding", null);

  if (error) {
    console.error("Error fetching shuttles:", error);
    return;
  }

  console.log(`Found ${shuttles.length} shuttles without embeddings`);

  for (const shuttle of shuttles) {
    try {
      const textToEmbed = `${shuttle.name}. ${shuttle.description}. Service: ${shuttle.service_type}. From ${shuttle.departure_location} to ${shuttle.arrival_location}. Features: ${shuttle.features?.join(", ") || "none"}`;

      console.log(`Generating embedding for: ${shuttle.name}`);
      const embedding = await generateEmbedding(textToEmbed);

      const { error: updateError } = await supabase
        .from("shuttles")
        .update({ vector_embedding: embedding })
        .eq("id", shuttle.id);

      if (updateError) {
        console.error(`Error updating shuttle ${shuttle.name}:`, updateError);
      } else {
        console.log(`✓ Embedding generated for: ${shuttle.name}`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to process shuttle ${shuttle.name}:`, error);
    }
  }
}

async function main() {
  console.log("Starting embedding generation process...\n");

  try {
    await generateHotelEmbeddings();
    console.log("\n");

    await generateRestaurantEmbeddings();
    console.log("\n");

    await generateTourEmbeddings();
    console.log("\n");

    await generateShuttleEmbeddings();
    console.log("\n");

    console.log("Embedding generation completed!");
  } catch (error) {
    console.error("Error in main process:", error);
  }
}

// Esegui solo se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error("Missing required environment variables:");
    console.error("- NEXT_PUBLIC_SUPABASE_URL");
    console.error("- SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  // Avviso se l'API URL non è configurato
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.log(
      "ℹ️  NEXT_PUBLIC_APP_URL not set, using default: http://localhost:3002"
    );
    console.log(
      "   Make sure the Next.js app is running for embedding generation"
    );
  }

  main();
}

export default {
  generateHotelEmbeddings,
  generateRestaurantEmbeddings,
  generateTourEmbeddings,
  generateShuttleEmbeddings,
};
