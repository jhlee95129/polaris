import { NextRequest, NextResponse } from "next/server"
import { getSessionMessages } from "@/lib/db/queries"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const messages = await getSessionMessages(id, 50)
  return NextResponse.json({ messages })
}
