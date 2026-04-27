import { NextRequest, NextResponse } from "next/server"
import { checkinBokchae } from "@/lib/db/queries"

export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json()
    if (!user_id) {
      return NextResponse.json({ error: "user_id 필수" }, { status: 400 })
    }

    const result = await checkinBokchae(user_id)
    return NextResponse.json({ added: result.added, count: result.count })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "체크인 실패" },
      { status: 500 },
    )
  }
}
