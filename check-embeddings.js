import { createClient } from "@supabase/supabase-js";

// Configurazione Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEmbeddingsStatus() {
  console.log("🔍 Checking embeddings status...\n");

  const tables = ["hotels", "restaurants", "tours", "shuttles"];

  for (const table of tables) {
    try {
      // Conta tutti i record
      const { count: totalCount, error: countError } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (countError) {
        console.error(`Error counting ${table}:`, countError);
        continue;
      }

      // Conta record con embeddings
      const { count: withEmbeddingsCount, error: embeddingsError } =
        await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .not("vector_embedding", "is", null);

      if (embeddingsError) {
        console.error(
          `Error counting ${table} with embeddings:`,
          embeddingsError
        );
        continue;
      }

      const percentage =
        totalCount > 0
          ? ((withEmbeddingsCount / totalCount) * 100).toFixed(1)
          : 0;

      console.log(`🏨 ${table}:`);
      console.log(`   📊 Total records: ${totalCount}`);
      console.log(`   ✅ With embeddings: ${withEmbeddingsCount}`);
      console.log(
        `   ❌ Missing embeddings: ${totalCount - withEmbeddingsCount}`
      );
      console.log(`   📈 Completion: ${percentage}%\n`);
    } catch (error) {
      console.error(`Error processing ${table}:`, error);
    }
  }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  checkEmbeddingsStatus();
}

export default { checkEmbeddingsStatus };
