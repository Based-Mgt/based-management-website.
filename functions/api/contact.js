// Use the office inbox as the fixed recipient.
const officeEmail = 'office@basedmgt.com';
// Cap incoming request bodies at 24 KB.
const maxBodyBytes = 24 * 1024;
// Define the basic email address format accepted by this form.
const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

// Build a JSON response for the browser.
function respond(status, body, headers = {}) {
  // Return JSON and ask browsers and proxies to avoid caching it.
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
// Close the current block or expression.
}

// Read the request in chunks so oversized submissions can be stopped early.
async function readInquiry(body) {
  // Open a reader for the request body stream.
  const reader = body.getReader();
  // Decode incoming bytes as text.
  const decoder = new TextDecoder();
  // Start counting the bytes received.
  let size = 0;
  // Start with an empty buffer for the decoded text.
  let text = '';

  // Read chunks until the stream ends or hits the size limit.
  while (true) {
    // Read the next chunk and check for the end of the stream.
    const { done, value } = await reader.read();
    // Finish reading once there are no chunks left.
    if (done) break;
    // Add this chunk to the running byte count.
    size += value.byteLength;
    // Stop reading if the request exceeds the configured limit.
    if (size > maxBodyBytes) {
      // Cancel the request stream to avoid reading more data.
      await reader.cancel();
      // Report that the request body was too large to use.
      return null;
    // Close the current block or expression.
    }
    // Decode the current chunk while preserving split UTF-8 characters.
    text += decoder.decode(value, { stream: true });
  // Close the current block or expression.
  }
  // Finish decoding and parse the accumulated JSON.
  return JSON.parse(text + decoder.decode());
// Close the current block or expression.
}

// Start the server handler for a submitted question.
export async function onRequest({ request, env }) {
  // Only accept POST requests at this endpoint.
  if (request.method !== 'POST') {
    // Return HTTP 405 so the caller knows how the request ended.
    return respond(405, { error: 'Use POST to send a question.' }, { Allow: 'POST' });
  // Close the current block or expression.
  }

  // Reject browser submissions that come from outside the expected site.
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    // Return HTTP 403 so the caller knows how the request ended.
    return respond(403, { error: 'Submit your question from the website.' });
  // Close the current block or expression.
  }

  // Read the media type while ignoring any charset suffix.
  const contentType = request.headers.get('Content-Type')?.split(';')[0].trim();
  // Accept submissions with a JSON content type.
  if (contentType !== 'application/json' || !request.body) {
    // Return HTTP 415 so the caller knows how the request ended.
    return respond(415, { error: 'Submit your question using the website form.' });
  // Close the current block or expression.
  }

  // Set aside a variable for the parsed submission.
  let inquiry;
  // Start the operation that can fail and needs an error response.
  try {
    // Parse the submitted question into individual fields.
    inquiry = await readInquiry(request.body);
  // Handle an error from the operation above.
  } catch {
    // Return HTTP 400 so the caller knows how the request ended.
    return respond(400, { error: 'Invalid inquiry.' });
  // Close the current block or expression.
  }

  // Reject an empty or non-object submission.
  if (!inquiry || typeof inquiry !== 'object') {
    // Return HTTP 400 so the caller knows how the request ended.
    return respond(400, { error: 'Invalid inquiry.' });
  // Close the current block or expression.
  }
  // Silently discard submissions that filled the hidden spam-trap field.
  if (inquiry.website) return respond(200, { ok: true });

  // Read the name field and trim whitespace when it is text.
  const name = typeof inquiry.name === 'string' ? inquiry.name.trim() : '';
  // Read the email field and trim whitespace when it is text.
  const email = typeof inquiry.email === 'string' ? inquiry.email.trim() : '';
  // Read the message field and trim whitespace when it is text.
  const message = typeof inquiry.message === 'string' ? inquiry.message.trim() : '';
  // Read the retry identifier from the request header.
  const id = request.headers.get('Idempotency-Key') || '';
  // Check the required fields, email format, and length limits.
  if (!name || name.length > 100 || email.length > 254 || !emailPattern.test(email)
      // Check the required fields, email format, and length limits.
      || !message || message.length > 3000 || !/^[0-9a-f-]{36}$/i.test(id)) {
    // Return HTTP 400 so the caller knows how the request ended.
    return respond(400, { error: 'Check your name, email address, and question.' });
  // Close the current block or expression.
  }

  // Check that the host supplied the email service credentials and sender address.
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL) {
    // Return HTTP 503 so the caller knows how the request ended.
    return respond(503, { error: 'Email delivery is temporarily unavailable.' });
  // Close the current block or expression.
  }

  // Start the operation that can fail and needs an error response.
  try {
    // Hand the email to Resend through its HTTPS endpoint.
    const delivery = await fetch('https://api.resend.com/emails', {
      // Use POST because this request submits a new question.
      method: 'POST',
      // Set the headers needed for JSON or email delivery.
      headers: {
        // Set the headers needed for JSON or email delivery.
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        // Set the headers needed for JSON or email delivery.
        'Content-Type': 'application/json',
        // Set the headers needed for JSON or email delivery.
        'Idempotency-Key': `website-question/${id}`,
      // Close the current block or expression.
      },
      // Include the JSON payload in the outgoing request or response.
      body: JSON.stringify({
        // Use the host-configured sender address for outbound email.
        from: env.CONTACT_FROM_EMAIL,
        // Deliver only to the fixed office inbox.
        to: [officeEmail],
        // Make Reply in the office inbox address the visitor.
        reply_to: email,
        // Use a recognizable subject for incoming website questions.
        subject: 'New question from the Based Management website',
        // Put the visitor’s contact information and question into the email body.
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      // Close the current block or expression.
      }),
      // Apply a timeout so a stalled email request can finish with an error.
      signal: AbortSignal.timeout(10_000),
    // Close the current block or expression.
    });
    // Read the provider receipt only after a successful response.
    const receipt = delivery.ok ? await delivery.json() : null;
    // Report success after the mail provider returns a message identifier.
    if (receipt?.id) return respond(200, { ok: true });
    // Log delivery diagnostics without including the visitor’s form contents.
    console.error('Contact email provider returned status', delivery.status);
  // Handle an error from the operation above.
  } catch {
    // Log delivery diagnostics without including the visitor’s form contents.
    console.error('Contact email delivery request failed.');
  // Close the current block or expression.
  }

  // Return HTTP 502 so the caller knows how the request ended.
  return respond(502, { error: 'Email delivery is temporarily unavailable.' });
// Close the current block or expression.
}
