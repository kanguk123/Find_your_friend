# NASA Space App Challenge PRD

# Planet-finder (가제)

---

## 🎯 Goal

머신러닝을 활용해 외계 행성이 존재할 가능성이 높은 영역을 **대화형 3D 우주 지도** 위에 시각화하고, 연구자와 일반 사용자 모두가 탐색·검증할 수 있는 웹 애플리케이션을 구현한다.

---

## ✨ Features

1. **Space Map (3D 우주 지도)**

   - 지구본 형태의 3D 구면 지도
   - 마우스/터치 기반 회전 및 확대/축소
   - **타일링 방식(Quadtree LOD)**으로 확대 시 저해상 → 고해상 이미지 전환

2. **행성 후보 표시**

   - 머신러닝 모델이 예측한 행성 후보 좌표를 지도에 시각화
   - 확률에 따라 점 크기·색상 차등 표시
   - 줌 레벨에 따른 클러스터링 제공

3. **세부 데이터 확인**

   - 특정 후보 스팟 클릭 시 패널에 상세 데이터 표시
   - 메타데이터(좌표, 확률, 관측 시기, 밴드 등)
   - 근거 데이터: 이미지, 요약 그래프, 원시 데이터 다운로드 링크
   - 주변 스팟 비교(거리, 확률, 품질)

4. **모드 선택**

   - **초보자 모드**: 우주선 애니메이션 효과와 함께 직관적 탐험 경험
   - **연구자 모드**: 정밀 분석 툴, CSV 업로드, 모델 비교, 북마크 기능 제공

5. **북마크 및 공유**
   - 특정 행성 후보를 북마크하여 리스트 관리
   - 북마크 좌표로 이동 및 3D 맵 연동
   - 특정 뷰 상태를 URL로 공유

---

## 🎨 UI/UX

- **Design 방향**

  - 다크 테마 기반 우주/심도감 있는 디자인
  - 스팟 확률에 따른 컬러 맵, 클릭 시 하이라이트
  - 데이터 중심 시각화, 연구자와 초보자 모두 직관적으로 이해 가능

- **User Experience**
  - 초보자 모드: 단순 탐험 경험, 우주선 애니메이션 효과
  - 연구자 모드: 데이터 기반 분석 및 모델 지표 확인
  - 공통: 클릭 → 상세 데이터 탐색, 지도와 데이터 패널 간 매끄러운 연동

---

## 💻 Tech Stack

- **Frontend**

  - Next.js (App Router, TS), React
  - Three.js (WebGL2)
  - Tailwind CSS
  - Zustand/TanStack Query (상태 & 데이터 캐싱)

- **Backend**

  - FastAPI (Python 3.11), Uvicorn
  - Postgres (스팟/타일/메타데이터 관리)
  - Redis (캐시)

- **Deployment**
  - FE: Vercel
  - BE: Cloud Run/Fly.io
  - DB: Supabase(Postgres) or RDS
  - CDN: Cloudflare R2 or Vercel Blob for 타일 배포

---

## 🗂️ Project Structure

```
project/
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components (map, panels, UI)
│   ├── lib/               # utils, state, API client
│   ├── styles/            # Tailwind + global styles
│   └── types/             # TS types
├── server/                # FastAPI backend
│   ├── routers/           # API routes (spots, search, retrain)
│   ├── models/            # DB models
│   └── services/          # business logic
└── scripts/               # tile build, data ingestion
```

---

## ⚙️ User Flow

1. 초기 로딩: 저해상 지구본 + 기본 후보 표시
2. 확대/회전: 해당 영역 타일 로딩 → 고해상 전환
3. 스팟 클릭: 상세 패널에서 데이터·근거·비교 확인
4. 모드 선택: 초보자(애니메이션 중심) / 연구자(분석 중심)
5. 연구자 모드: CSV 업로드 → 예측 결과 테이블 + 상관관계 카드
6. 연구자는 북마크한 행성을 리스트로 관리하고, 맵과 연동

---

## ⚡️ Optimization

- 초기 로딩 속도 최적화: 저해상 텍스처 → 점진적 고해상 전환
- 3D 최적화: instancing, frustum culling, 압축 텍스처(KTX2)
- 네트워크 최적화: 타일 CDN, prefetching, abortable fetch
- API SLA: 응답 p95 ≤ 400ms, 맵 렌더 FPS ≥ 45fps

---

## 📄 Researcher Mode 상세

### 1. 하이퍼파라미터 튜닝 패널

- 현재 미정 (추후 Learning Rate, Epochs, Batch Size 등 확장 가능)

### 2. 모델 상태/정확도 모니터링

- 지표: 학습 시간, 추론 시간, 정확도
- pre-trained vs fine-tuned 모델 전환 가능

### 3. 북마크 행성 리스트

- 체크한 후보 행성 관리
- 좌표로 이동 → 3D 맵 카메라 연동

### 4. CSV 업로드 기반 예측

- CSV 입력 포맷 제공 (`ra, dec, feature1, feature2, ...`)
- 업로드 → 확률 계산, 결과 테이블 표시
- 업로드 좌표를 3D 맵에 표시

### 5. 상관관계 카드

- feature vs 예측 확률 간 correlation(Pearson) 제공
- 연구자가 영향력 있는 feature 파악 가능

### UI 레이아웃

- **좌측 사이드바**: 하이퍼파라미터 패널, 모델 상태 카드, 북마크 리스트
- **우측 메인 패널**: CSV 업로드, 예측 결과 테이블, 상관관계 카드

---

## 📄 Beginner Mode 상세

### 1. 우주선 효과 기반 인터랙션

- Warp 스타필드 애니메이션으로 시작
- 3D 구체 주위를 도는 우주선 시뮬레이션 효과
- 사용자가 방향을 조작해 탐험 가능

### 2. 단순화된 행성 후보 표시

- 확률 수치 대신 아이콘/밝기 차이로 표시
- 상위 N개 후보만 표시하여 단순화

### 3. 행성 정보 팝업

- 클릭 시 “외계행성일 가능성이 있어요!” 등 짧은 설명
- 간단한 위치/아이콘 표시

### 4. 체험 모드 안내

- 하단에 짧은 안내 문구 제공
- 마우스/터치 가이드 툴팁

### 5. 학습 요소

- 별자리/좌표계 간단 설명 오버레이
- 빛 곡선 모형 애니메이션 카드

### User Flow (Beginner)

1. 랜딩 시 워프 애니메이션 → 3D 지구본 등장
2. 우주선 자동 탐험 애니메이션 → 주요 스팟 강조
3. 사용자는 회전/확대/클릭으로 탐색
4. 클릭 시 간단 팝업 표시 → “더 알아보기” 클릭 시 연구자 모드로 이동

---

## 📊 Metrics

- 초기 인터랙션 가능 시간(TTI) ≤ 3초
- 타일 전환 속도: 중해상 ≤ 200ms, 고해상 ≤ 500ms
- 연구자 모드 CSV 업로드 후 결과 표시 ≤ 2초
- 맵 렌더링 FPS ≥ 45

---

## References

- NASA Space Apps Challenge 2025: _A World Away — Hunting for Exoplanets with AI_
- Next.js 공식 문서
- FastAPI 공식 문서
- Three.js docs
