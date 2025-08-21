import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  return new Response("WebSocket server should be running on port 3001", {
    status: 200,
  })
}
