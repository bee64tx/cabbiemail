export async function onRequestPost({ request }) {
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken) {
    return new Response(JSON.stringify({ error: "missing_csrf" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await new Promise((r) => setTimeout(r, 250 + Math.floor(Math.random() * 100)));

  if (Math.random() < 0.002) {
    return new Response(
      JSON.stringify({ status: "partial_success", next_step: "totp_required" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ error: "invalid_credentials" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
