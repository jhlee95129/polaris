import { getSharedSession } from "@/lib/db/queries"
import { notFound } from "next/navigation"
import SharedChatView from "./SharedChatView"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const data = await getSharedSession(token)

  if (!data) return { title: "폴라리스 — 공유된 상담" }

  const name = data.user.display_name || "사용자"
  return {
    title: `${name}의 사주 상담 — 폴라리스`,
    description: `${name}님이 공유한 폴라리스 사주 상담 내용입니다.`,
    openGraph: {
      title: `${name}의 사주 상담 — 폴라리스`,
      description: data.session.title,
    },
  }
}

export default async function SharedPage({ params }: Props) {
  const { token } = await params
  const data = await getSharedSession(token)

  if (!data) notFound()

  return (
    <SharedChatView
      session={data.session}
      messages={data.messages}
      user={data.user}
    />
  )
}
