import { NextRequest, NextResponse } from "next/server"
import { createShareToken } from "@/lib/db/queries"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const token = await createShareToken(id)
    return NextResponse.json({ share_token: token })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "공유 링크 생성 실패" },
      { status: 500 }
    )
  }
}
