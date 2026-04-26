import { NextRequest, NextResponse } from "next/server"
import { createSession, getUserSessions, deleteSession } from "@/lib/db/queries"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id")
  if (!userId) {
    return NextResponse.json({ error: "user_id 필수" }, { status: 400 })
  }
  const sessions = await getUserSessions(userId)
  return NextResponse.json({ sessions })
}

export async function POST(req: NextRequest) {
  const { user_id, title } = await req.json()
  if (!user_id) {
    return NextResponse.json({ error: "user_id 필수" }, { status: 400 })
  }
  const session = await createSession(user_id, title || undefined)
  return NextResponse.json({ session })
}

export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("id")
  if (!sessionId) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 })
  }
  await deleteSession(sessionId)
  return NextResponse.json({ ok: true })
}
