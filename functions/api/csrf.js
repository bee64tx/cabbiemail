export async function onRequestGet() {
  const token = crypto.randomUUID();

  return new Response(JSON.stringify({ csrf_token: token }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `csrf_ref=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`,
    },
  });
}
