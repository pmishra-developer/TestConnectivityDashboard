import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  from: string;
  to: string;
  subject: string;
  body: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const emailData: EmailRequest = await req.json();

    const { smtpHost, smtpPort, smtpUser, smtpPassword, from, to, subject, body } = emailData;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !from || !to || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const port = parseInt(smtpPort);
    if (isNaN(port) || port <= 0 || port > 65535) {
      return new Response(
        JSON.stringify({ error: "Invalid SMTP port" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailContent = `From: ${from}\r\nTo: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`;

    try {
      const conn = await Deno.connect({
        hostname: smtpHost,
        port: port,
      });

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const buffer = new Uint8Array(1024);

      await conn.read(buffer);

      await conn.write(encoder.encode(`EHLO localhost\r\n`));
      await conn.read(buffer);

      const authString = btoa(`\0${smtpUser}\0${smtpPassword}`);
      await conn.write(encoder.encode(`AUTH PLAIN ${authString}\r\n`));
      const authResponse = await conn.read(buffer);
      const authText = decoder.decode(authResponse ? buffer.subarray(0, authResponse) : buffer);
      
      if (!authText.startsWith('235')) {
        conn.close();
        return new Response(
          JSON.stringify({ error: "SMTP authentication failed" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      await conn.write(encoder.encode(`MAIL FROM:<${from}>\r\n`));
      await conn.read(buffer);

      await conn.write(encoder.encode(`RCPT TO:<${to}>\r\n`));
      await conn.read(buffer);

      await conn.write(encoder.encode(`DATA\r\n`));
      await conn.read(buffer);

      await conn.write(encoder.encode(`${emailContent}\r\n.\r\n`));
      await conn.read(buffer);

      await conn.write(encoder.encode(`QUIT\r\n`));
      conn.close();

      return new Response(
        JSON.stringify({ message: "Email sent successfully!" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (connError) {
      console.error('Connection error:', connError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to connect to SMTP server",
          details: connError instanceof Error ? connError.message : "Unknown error"
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
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});