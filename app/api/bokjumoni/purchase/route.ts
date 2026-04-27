import { NextRequest, NextResponse } from "next/server"
import { addBokjumoni } from "@/lib/db/queries"

const PACKAGES: Record<string, number> = {
  small: 3,
  medium: 5,
  large: 10,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, package: pkg } = body as { user_id: string; package: string }

    if (!user_id || !pkg || !(pkg in PACKAGES)) {
      return NextResponse.json({ error: "유효하지 않은 요청" }, { status: 400 })
    }

    const amount = PACKAGES[pkg]
    const newCount = await addBokjumoni(user_id, amount)
    return NextResponse.json({ count: newCount, added: amount })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "구매 실패" },
      { status: 500 },
    )
  }
}
