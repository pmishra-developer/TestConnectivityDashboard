import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SesEmailRequest {
  provider: 'ses';
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  from: string;
  to: string;
  subject: string;
  body: string;
}

function toHex(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);
  return Array.from(view)
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  const keyObj = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', keyObj, messageData);
  return toHex(signature);
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toHex(hash);
}

async function signRequest(
  method: string,
  host: string,
  path: string,
  payload: string,
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  amzdate: string,
  datestamp: string
): Promise<string> {
  const payloadHash = await sha256(payload);
  
  const canonicalRequest = `${method}
${path}

host:${host}
x-amz-date:${amzdate}

host;x-amz-date
${payloadHash}`;

  const canonicalHash = await sha256(canonicalRequest);
  const credentialScope = `${datestamp}/${region}/email/aws4_request`;
  
  const stringToSign = `AWS4-HMAC-SHA256
${amzdate}
${credentialScope}
${canonicalHash}`;

  const kSecret = `AWS4${secretAccessKey}`;
  const kDate = await hmacSha256(kSecret, datestamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, 'email');
  const kSigning = await hmacSha256(kService, 'aws4_request');
  
  const signature = await hmacSha256(kSigning, stringToSign);
  
  return `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=host;x-amz-date, Signature=${signature}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const emailData: SesEmailRequest = await req.json();
    const { awsAccessKeyId, awsSecretAccessKey, awsRegion, from, to, subject, body } = emailData;

    if (!awsAccessKeyId || !awsSecretAccessKey || !awsRegion || !from || !to || !subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required AWS SES fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const host = `email.${awsRegion}.amazonaws.com`;
    const path = '/';
    const now = new Date();
    const amzdate = now.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
    const datestamp = amzdate.substring(0, 8);

    const payload = {
      Source: from,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: body,
            Charset: 'UTF-8',
          },
        },
      },
    };

    const payloadStr = JSON.stringify(payload);
    const authorization = await signRequest(
      'POST',
      host,
      path,
      payloadStr,
      awsAccessKeyId,
      awsSecretAccessKey,
      awsRegion,
      amzdate,
      datestamp
    );

    const sesResponse = await fetch(`https://${host}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Date': amzdate,
        Authorization: authorization,
        'X-Amz-Target': 'AmazonSimpleEmailService.SendEmail',
      },
      body: payloadStr,
    });

    const responseText = await sesResponse.text();

    if (sesResponse.ok) {
      try {
        const result = JSON.parse(responseText);
        return new Response(
          JSON.stringify({
            message: 'Email sent successfully via Amazon SES!',
            messageId: result.MessageId,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch {
        return new Response(
          JSON.stringify({
            message: 'Email sent successfully via Amazon SES!',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({
          error: 'Failed to send email via Amazon SES',
          details: responseText || `HTTP ${sesResponse.status}`,
        }),
        {
          status: sesResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});