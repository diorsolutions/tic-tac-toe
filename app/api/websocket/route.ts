export async function GET() {
  return new Response("WebSocket server should be running on port 3001", {
    status: 200,
  });
}
