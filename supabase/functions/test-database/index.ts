import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DbRequest {
  connectionString: string;
  username: string;
  password: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const dbData: DbRequest = await req.json();
    const { connectionString, username, password } = dbData;

    if (!connectionString || !username || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let client: Client | null = null;

    try {
      const url = new URL(connectionString);
      url.username = username;
      url.password = password;

      client = new Client(url.toString());
      await client.connect();

      const result = await client.queryObject`SELECT version()`;
      const version = result.rows[0]?.version || "Unknown version";

      await client.end();

      return new Response(
        JSON.stringify({
          success: true,
          message: "Connection successful!",
          details: `Connected successfully. Database version: ${version}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (dbError) {
      if (client) {
        try {
          await client.end();
        } catch (e) {
          console.error('Error closing connection:', e);
        }
      }

      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : "Unable to connect to database",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Request processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});