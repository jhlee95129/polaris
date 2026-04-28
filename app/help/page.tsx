import { CHARACTER_LIST } from "@/lib/characters"

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* 헤더 */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">도움말</h1>
        <p className="text-sm text-muted-foreground">
          폴라리스의 주요 기능과 사용법을 안내해요.
        </p>
      </div>

      {/* 폴라리스란? */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <span>🌟</span> 폴라리스란?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          폴라리스는 <strong className="text-foreground">사주(四柱) 기반 라이프 코치</strong>예요.
          단순한 운세 보고서가 아닌, 대화를 통해 실질적인 코칭을 제공해요.
          여러분의 사주 원국을 분석하고, 구체적인 고민에 대해 명리학적 근거와 함께 실행 가능한 조언을 드려요.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {[
            { emoji: "💬", text: "보고서가 아닌 대화" },
            { emoji: "📊", text: "근거 있는 분석" },
            { emoji: "🧠", text: "맥락을 기억하는 코치" },
            { emoji: "🎭", text: "5가지 코칭 캐릭터" },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
              <span>{item.emoji}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 시작하기 */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <span>🚀</span> 시작하기
        </h2>
        <p className="text-sm text-muted-foreground">
          처음 방문하면 4단계 온보딩을 거쳐요.
        </p>
        <ol className="space-y-2">
          {[
            { step: "1", title: "닉네임 입력", desc: "다른 사용자와 겹치지 않는 닉네임을 정해요." },
            { step: "2", title: "생년월일 입력", desc: "양력 또는 음력을 선택하고 생년월일을 입력해요." },
            { step: "3", title: "태어난 시간 + 성별", desc: "시주 계산에 필요해요. 모르면 '모르겠어요'를 선택할 수 있어요." },
            { step: "4", title: "코칭 캐릭터 선택", desc: "5명의 캐릭터 중 원하는 코치를 골라요." },
          ].map(item => (
            <li key={item.step} className="flex items-start gap-3">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 상담하기 */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <span>💬</span> 상담하기
        </h2>
        <p className="text-sm text-muted-foreground">
          채팅 형식으로 자유롭게 고민을 이야기하면, 코치가 사주 분석과 함께 답해요.
        </p>
        <div className="space-y-2">
          {[
            { emoji: "✏️", title: "자유 질문", desc: "직업, 연애, 건강, 재정 등 어떤 고민이든 물어보세요." },
            { emoji: "📊", title: "상세 분석 보기", desc: "응답 아래 '상세 분석 보기' 버튼을 누르면 명리학적 근거를 확인할 수 있어요." },
            { emoji: "🎭", title: "상담 중 캐릭터 변경", desc: "상담방 상단의 캐릭터 버튼을 누르면 언제든 코칭 캐릭터를 바꿀 수 있어요. 변경 시 새 대화가 시작되고, 캐릭터의 말투와 성격이 바로 반영돼요." },
            { emoji: "📂", title: "대화 세션 관리", desc: "여러 주제로 대화를 나눌 수 있어요. 새 대화를 시작하거나 이전 대화를 이어갈 수 있어요." },
            { emoji: "🔗", title: "대화 공유", desc: "공유 버튼을 누르면 링크가 생성돼요. 다른 사람에게 상담 내용을 보여줄 수 있어요." },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-2.5">
              <span className="text-base shrink-0">{item.emoji}</span>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 코칭 캐릭터 */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <span>🎭</span> 코칭 캐릭터
        </h2>
        <p className="text-sm text-muted-foreground">
          5명의 캐릭터가 각각 다른 말투로 상담해요. 분석 내용은 동일하고, 대화 스타일만 달라요.
        </p>
        <div className="space-y-2">
          {CHARACTER_LIST.map(char => (
            <div key={char.id} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
              <div className={`flex items-center justify-center h-10 w-10 rounded-full ${char.colorClass.avatarBg} shrink-0`}>
                <span className="text-lg leading-none">{char.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${char.colorClass.nameText}`}>{char.name}</span>
                  <span className="text-xs text-muted-foreground">{char.identity}</span>
                </div>
                <p className="text-xs text-muted-foreground/70 mt-0.5 italic truncate">&ldquo;{char.sampleLine}&rdquo;</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/70">
          설정 페이지나 상담방에서 언제든 변경할 수 있어요.
        </p>
      </section>

      {/* 복채 시스템 */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <span>💰</span> 복채 시스템
        </h2>
        <p className="text-sm text-muted-foreground">
          상담 메시지 1회에 복채 1개가 사용돼요.
        </p>
        <div className="space-y-2">
          {[
            { emoji: "📅", title: "매일 출석 체크인", desc: "대시보드나 상점에서 매일 1회 체크인하면 복채 +1개" },
            { emoji: "🏪", title: "상점에서 구매", desc: "더 필요하면 상점에서 복채 패키지를 구매할 수 있어요." },
            { emoji: "🎉", title: "오픈 이벤트", desc: "현재 오픈 기념으로 모든 복채를 무료로 충전할 수 있어요!" },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-2.5">
              <span className="text-base shrink-0">{item.emoji}</span>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 내 사주 정보 */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <span>🔮</span> 내 사주 정보
        </h2>
        <p className="text-sm text-muted-foreground">
          &lsquo;내 정보&rsquo; 페이지에서 나의 사주 분석을 확인할 수 있어요.
        </p>
        <div className="space-y-2">
          {[
            { emoji: "🏛️", title: "사주팔자 (四柱八字)", desc: "년주·월주·일주·시주 네 기둥과 천간·지지를 보여줘요." },
            { emoji: "✨", title: "오행 밸런스", desc: "목·화·토·금·수 다섯 가지 기운의 분포와 강약을 확인해요." },
            { emoji: "🧭", title: "대운 (大運)", desc: "10년 단위로 바뀌는 운의 흐름을 표로 볼 수 있어요." },
            { emoji: "🔥", title: "일간 성격", desc: "내 일간(日干)에 따른 타고난 성격과 특성을 알려줘요." },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-2.5">
              <span className="text-base shrink-0">{item.emoji}</span>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 설정 */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <span>⚙️</span> 설정
        </h2>
        <div className="space-y-2">
          {[
            { emoji: "🎭", title: "코칭 캐릭터 변경", desc: "5명의 캐릭터 중 원하는 코치로 변경해요. 다음 메시지부터 바로 적용돼요." },
            { emoji: "🎨", title: "테마 변경", desc: "라이트/다크/시스템 모드를 선택할 수 있어요." },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-2.5">
              <span className="text-base shrink-0">{item.emoji}</span>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <span>❓</span> 자주 묻는 질문
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "태어난 시간을 모르면 어떻게 하나요?",
              a: "온보딩에서 '모르겠어요'를 선택하면 돼요. 시주가 빠져서 일부 해석이 제한되지만, 나머지 세 기둥으로 충분한 분석이 가능해요.",
            },
            {
              q: "캐릭터를 바꾸면 이전 대화가 사라지나요?",
              a: "아니요, 이전 대화는 그대로 남아있어요. 캐릭터를 바꾸면 새 대화 세션이 시작되고, 이전 세션은 대화 목록에서 확인할 수 있어요.",
            },
            {
              q: "복채가 없으면 상담을 못 하나요?",
              a: "네, 상담 메시지 1회에 복채 1개가 필요해요. 매일 출석 체크인(+1)을 하거나, 상점에서 충전할 수 있어요. 현재는 오픈 이벤트로 무료 충전이 가능해요!",
            },
            {
              q: "상세 분석에서 보여주는 근거는 뭔가요?",
              a: "코치가 응답할 때 참고한 사주 정보예요. 어떤 기둥과 오행을 근거로 조언했는지, 명리학적 해석 근거를 투명하게 보여줘요.",
            },
            {
              q: "계정을 삭제하고 싶어요.",
              a: "'내 정보' 페이지 하단에서 계정을 삭제할 수 있어요. 삭제하면 모든 데이터가 영구 삭제되며 복구할 수 없어요.",
            },
          ].map(item => (
            <div key={item.q} className="space-y-1">
              <p className="text-sm font-semibold">{item.q}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
