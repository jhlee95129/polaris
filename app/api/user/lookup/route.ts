import { NextRequest, NextResponse } from "next/server"
import { getUserByDisplayName } from "@/lib/db/queries"

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim()
  if (!name) {
    return NextResponse.json({ error: "name 필수" }, { status: 400 })
  }

  const user = await getUserByDisplayName(name)
  if (!user) {
    return NextResponse.json({ found: false })
  }

  return NextResponse.json({ found: true, user_id: user.id })
}
