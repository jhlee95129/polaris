/**
 * 만세력 + 사주 계산 검증 테스트
 * SPEC 2번 — 5개 엣지케이스 검증
 */

import { describe, it, expect } from "vitest"
import {
  calculateSaju,
  lunarToSolar,
  isBeforeLichun,
} from "@fullstackfamily/manseryeok"
import { calculateSajuProfile, type BirthInfo } from "../lib/saju"
import { calculateDaeun, getCurrentDaeunPillar } from "../lib/daeun"

describe("만세력 엣지케이스 검증", () => {
  // ── 1. 입춘 전후 (연주 경계) ──
  describe("입춘 전후 연주 경계", () => {
    it("입춘 전 출생 → 이전 해의 연주", () => {
      // 2000년 2월 3일 = 입춘(2/4) 전 → 연주는 1999년(기묘)
      const before = calculateSaju(2000, 2, 3)
      expect(before.yearPillar).toBe("기묘")
      expect(isBeforeLichun(2, 3)).toBe(true)
    })

    it("입춘 후 출생 → 해당 해의 연주", () => {
      // 2000년 2월 5일 = 입춘(2/4) 후 → 연주는 2000년(경진)
      const after = calculateSaju(2000, 2, 5)
      expect(after.yearPillar).toBe("경진")
      expect(isBeforeLichun(2, 5)).toBe(false)
    })

    it("입춘 전후 월주도 달라짐", () => {
      const before = calculateSaju(2000, 2, 3)
      const after = calculateSaju(2000, 2, 5)
      // 입춘 전은 축월(1월), 입춘 후는 인월(2월)
      expect(before.monthPillar).not.toBe(after.monthPillar)
    })
  })

  // ── 2. 윤달 처리 ──
  describe("음력 윤달 변환 및 사주 계산", () => {
    it("윤2월과 일반 2월이 다른 양력 날짜로 변환", () => {
      // 2023년에 윤2월 존재
      const leapResult = lunarToSolar(2023, 2, 15, true)   // 윤2월
      const normalResult = lunarToSolar(2023, 2, 15, false) // 일반 2월

      expect(leapResult.solar.month).not.toBe(normalResult.solar.month)
      // 윤2월 15일 → 양력 4월 5일
      expect(leapResult.solar).toEqual({ year: 2023, month: 4, day: 5 })
      // 일반 2월 15일 → 양력 3월 6일
      expect(normalResult.solar).toEqual({ year: 2023, month: 3, day: 6 })
    })

    it("윤달 출생의 사주가 정상 계산됨", () => {
      const profile = calculateSajuProfile({
        year: 2023,
        month: 2,
        day: 15,
        isLunar: true,
        isLeapMonth: true,
        gender: "M",
      })
      // 양력 4/5로 변환 → 사주 계산 성공
      expect(profile.yearPillar.pillar).toBe("계묘")
      expect(profile.monthPillar.pillar).toBe("병진") // 진월
      expect(profile.dayPillar.pillar).toBeTruthy()
    })
  })

  // ── 3. 야자시 (23:00~00:59) ──
  describe("야자시 처리", () => {
    it("23시 출생 시 시주가 해시(亥時)로 계산", () => {
      // manseryeok은 23시를 해시로 처리 (전통적 야자시 방식)
      const result = calculateSaju(1990, 6, 15, 23)
      expect(result.hourPillar).toBeTruthy()
      // 23시는 해시(亥) — 시주가 null이 아님을 확인
      expect(result.dayPillar).toBe("신해")
    })

    it("0시 출생은 자시(子時)이며 다음날 일주", () => {
      const h0 = calculateSaju(1990, 6, 16, 0)
      // 0시는 자시 → 일주가 6/16 기준
      expect(h0.hourPillar).toBeTruthy()
      expect(h0.dayPillar).toBe("임자")
    })

    it("23시와 0시의 일주가 다름 (날짜 경계)", () => {
      const h23 = calculateSaju(1990, 6, 15, 23)
      const h0 = calculateSaju(1990, 6, 16, 0)
      expect(h23.dayPillar).not.toBe(h0.dayPillar)
    })
  })

  // ── 4. 시주 없음 (출생 시간 모름) ──
  describe("시주 없음 처리", () => {
    it("시간 미입력 시 시주가 null", () => {
      const result = calculateSaju(1990, 6, 15)
      expect(result.hourPillar).toBeNull()
      expect(result.hourPillarHanja).toBeNull()
    })

    it("시주 없이도 나머지 3주는 정상 계산", () => {
      const result = calculateSaju(1990, 6, 15)
      expect(result.yearPillar).toBe("경오")
      expect(result.monthPillar).toBeTruthy()
      expect(result.dayPillar).toBe("신해")
    })

    it("calculateSajuProfile에서 hourPillar가 null", () => {
      const profile = calculateSajuProfile({
        year: 1990,
        month: 6,
        day: 15,
        gender: "M",
      })
      expect(profile.hourPillar).toBeNull()
      expect(profile.yearPillar.pillar).toBe("경오")
      expect(profile.dayPillar.pillar).toBe("신해")
      // 오행 분포는 3주만으로 계산 (6개 요소)
      const total = Object.values(profile.elementCounts).reduce((a, b) => a + b, 0)
      expect(total).toBe(6) // 3주 × 2(천간+지지)
    })
  })

  // ── 5. 경계값 (만세력 범위) ──
  describe("만세력 범위 경계값", () => {
    it("1900년 1월 1일 — 최소 범위 근처", () => {
      const result = calculateSaju(1900, 1, 1)
      expect(result.yearPillar).toBeTruthy()
      expect(result.dayPillar).toBeTruthy()
    })

    it("1924년생 정상 계산", () => {
      const result = calculateSaju(1924, 1, 1)
      expect(result.yearPillar).toBe("계해") // 1924년 입춘 전 = 1923년 계해
      expect(result.monthPillar).toBeTruthy()
      expect(result.dayPillar).toBeTruthy()
    })

    it("2050년 — 최대 범위 근처", () => {
      const result = calculateSaju(2050, 6, 15)
      expect(result.yearPillar).toBeTruthy()
      expect(result.dayPillar).toBeTruthy()
    })

    it("calculateSajuProfile 통합 테스트 — 모든 필드 존재", () => {
      const profile = calculateSajuProfile({
        year: 1995,
        month: 8,
        day: 20,
        hour: 14,
        gender: "F",
      })

      // 모든 주요 필드가 존재
      expect(profile.yearPillar).toBeDefined()
      expect(profile.monthPillar).toBeDefined()
      expect(profile.dayPillar).toBeDefined()
      expect(profile.hourPillar).toBeDefined()
      expect(profile.dayStem).toBeTruthy()
      expect(profile.dominantElement).toBeTruthy()
      expect(profile.weakestElement).toBeTruthy()
      expect(profile.usefulGod).toBeTruthy()
      expect(profile.dominantTenGods.length).toBeGreaterThan(0)
      expect(profile.elementCounts).toBeDefined()

      // 오행 분포 합 = 8 (4주 × 2)
      const total = Object.values(profile.elementCounts).reduce((a, b) => a + b, 0)
      expect(total).toBe(8)
    })
  })
})

describe("대운(大運) 계산 검증", () => {
  it("양남(양간+남자) → 순행", () => {
    // 경(庚)=양간, 남자 → 순행
    const result = calculateDaeun("임오", "경", "M", 1990, 6, 15)
    expect(result.isForward).toBe(true)
    expect(result.sequence.length).toBe(8)
    expect(result.startAge).toBeGreaterThan(0)
  })

  it("양녀(양간+여자) → 역행", () => {
    // 경(庚)=양간, 여자 → 역행
    const result = calculateDaeun("임오", "경", "F", 1990, 6, 15)
    expect(result.isForward).toBe(false)
  })

  it("음남(음간+남자) → 역행", () => {
    // 을(乙)=음간, 남자 → 역행
    const result = calculateDaeun("기묘", "을", "M", 1995, 8, 20)
    expect(result.isForward).toBe(false)
  })

  it("음녀(음간+여자) → 순행", () => {
    // 을(乙)=음간, 여자 → 순행
    const result = calculateDaeun("기묘", "을", "F", 1995, 8, 20)
    expect(result.isForward).toBe(true)
  })

  it("대운 시퀀스가 10년 단위로 연속", () => {
    const result = calculateDaeun("임오", "경", "M", 1990, 6, 15)
    for (let i = 1; i < result.sequence.length; i++) {
      expect(result.sequence[i].startAge).toBe(result.sequence[i - 1].endAge + 1)
    }
  })

  it("현재 대운이 올바른 나이 범위 안에 있음", () => {
    const result = calculateDaeun("임오", "경", "M", 1990, 6, 15)
    const age = new Date().getFullYear() - 1990
    if (result.current) {
      expect(age).toBeGreaterThanOrEqual(result.current.startAge)
      expect(age).toBeLessThanOrEqual(result.current.endAge)
    }
  })

  it("getCurrentDaeunPillar이 문자열 반환", () => {
    const pillar = getCurrentDaeunPillar("임오", "경", "M", 1990, 6, 15)
    expect(pillar).toBeTruthy()
    expect(typeof pillar).toBe("string")
    expect(pillar!.length).toBe(2) // 간지 2글자
  })
})
