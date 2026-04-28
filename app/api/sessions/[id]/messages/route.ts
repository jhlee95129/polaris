import { NextRequest, NextResponse } from "next/server"
import { getSessionMessages, saveMessage } from "@/lib/db/queries"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const messages = await getSessionMessages(id, 50)
  return NextResponse.json({ messages })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params
  const { user_id, role, content, metadata } = await req.json()

  if (!user_id || !role || !content) {
    return NextResponse.json({ error: "user_id, role, content 필수" }, { status: 400 })
  }

  await saveMessage(user_id, sessionId, role, content, metadata ?? null)
  return NextResponse.json({ ok: true })
}
