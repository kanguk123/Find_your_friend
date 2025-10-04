# 🌍 NASA Space Challenge - 로컬 실행 가이드

외계행성 탐사 3D 시각화 웹사이트를 로컬 환경에서 실행하는 방법을 안내합니다.

## 📋 목차
1. [시스템 요구사항](#-시스템-요구사항)
2. [프로젝트 구조](#-프로젝트-구조)
3. [프론트엔드 설정](#-프론트엔드-설정)
4. [백엔드 설정](#-백엔드-설정)
5. [실행 방법](#-실행-방법)
6. [API 테스트](#-api-테스트)
7. [문제 해결](#-문제-해결)

---

## 🔧 시스템 요구사항

### 필수 소프트웨어
- **Node.js**: v18.x 이상
- **Python**: 3.8 이상
- **npm** 또는 **yarn**
- **Git**

### 권장 사항
- **메모리**: 8GB RAM 이상
- **디스크 공간**: 2GB 이상
- **브라우저**: Chrome, Firefox, Safari (최신 버전)

---

## 📁 프로젝트 구조

```
kanguk123-NASA_SPACE_CHALLENGE/
├── front/                    # 프론트엔드 (Next.js + Three.js)
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   │   ├── Scene.tsx     # 3D 씬 메인
│   │   │   ├── SolarSystem.tsx   # 태양계 행성
│   │   │   ├── ExoplanetPoints.tsx  # 외계행성
│   │   │   └── PlanetListPanel.tsx  # 행성 리스트
│   │   ├── state/           # Zustand 상태 관리
│   │   ├── utils/           # 유틸리티 함수
│   │   │   └── cameraMovement.ts  # 카메라 이동 로직
│   │   └── data/            # 데이터 정의
│   ├── package.json
│   └── next.config.js
├── back/                     # 백엔드 (FastAPI)
│   ├── app/
│   │   ├── models/          # DB 모델
│   │   ├── services/        # 비즈니스 로직
│   │   ├── routers/         # API 엔드포인트
│   │   └── main.py          # FastAPI 앱
│   ├── requirements.txt     # Python 의존성
│   ├── .env.example         # 환경 설정 예시
│   ├── init_db.py           # DB 초기화
│   └── run.py               # 서버 실행
└── docs/                     # 문서
```

---

## 🎨 프론트엔드 설정

### 1️⃣ 프론트엔드 디렉토리로 이동
```bash
cd front
```

### 2️⃣ 의존성 설치

**npm 사용:**
```bash
npm install
```

**yarn 사용:**
```bash
yarn install
```

### 3️⃣ 환경 변수 설정 (선택사항)

필요한 경우 `.env.local` 파일 생성:
```bash
# front/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4️⃣ 개발 서버 실행

**npm:**
```bash
npm run dev
```

**yarn:**
```bash
yarn dev
```

✅ **성공!** 브라우저에서 http://localhost:3000 접속

---

## ⚙️ 백엔드 설정

### 1️⃣ 백엔드 디렉토리로 이동
```bash
cd back
```

### 2️⃣ Python 가상환경 생성 및 활성화

#### Mac/Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Windows:
```bash
python -m venv venv
venv\Scripts\activate
```

### 3️⃣ 의존성 설치
```bash
# (venv) 표시 확인 후
pip install -r requirements.txt
```

### 4️⃣ 환경 변수 설정

#### Mac/Linux:
```bash
cp .env.example .env
```

#### Windows:
```bash
copy .env.example .env
```

`.env` 파일 내용 (기본값):
```env
# Database Configuration
DATABASE_URL=sqlite:///./exoplanet.db

# Application Settings
APP_NAME="Exoplanet Discovery API"
APP_VERSION="1.0.0"
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# AI Model Settings
DEFAULT_MODEL_VERSION=v0.1
AI_SERVICE_URL=http://localhost:8001

# Dummy Data Settings
USE_DUMMY_DATA=True
DUMMY_PLANET_COUNT=500
```

### 5️⃣ 데이터베이스 초기화
```bash
python init_db.py
```

이 명령은:
- SQLite 데이터베이스 생성
- 테이블 스키마 생성
- 500개 더미 외계행성 데이터 생성

### 6️⃣ 백엔드 서버 실행
```bash
python run.py
```

✅ **성공!** 브라우저에서 http://localhost:8000/docs 접속 (Swagger UI)

---

## 🚀 실행 방법

### 전체 시스템 실행 (프론트엔드 + 백엔드)

#### 터미널 1 - 백엔드:
```bash
cd back
source venv/bin/activate  # Windows: venv\Scripts\activate
python run.py
```

#### 터미널 2 - 프론트엔드:
```bash
cd front
npm run dev  # 또는 yarn dev
```

### 접속 URL
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000
- **API 문서 (Swagger)**: http://localhost:8000/docs
- **API 문서 (ReDoc)**: http://localhost:8000/redoc

---

## 🧪 API 테스트

### Swagger UI에서 테스트
1. http://localhost:8000/docs 접속
2. API 엔드포인트 선택 (예: `GET /planets`)
3. "Try it out" 클릭
4. 파라미터 입력 (필요시)
5. "Execute" 클릭
6. 응답 확인

### curl로 테스트

**전체 행성 목록 조회:**
```bash
curl http://localhost:8000/planets
```

**특정 행성 상세 정보:**
```bash
curl http://localhost:8000/planets/1
```

**AI 예측:**
```bash
curl http://localhost:8000/predict/1
```

**행성 필터링:**
```bash
curl -X POST http://localhost:8000/planets/filter \
  -H "Content-Type: application/json" \
  -d '{"probability_min": 0.9}'
```

### 주요 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/planets` | GET | 전체 행성 목록 (페이지네이션) |
| `/planets/{id}` | GET | 특정 행성 상세 정보 |
| `/planets/filter` | POST | 조건별 필터링 |
| `/predict/{id}` | GET | 상세 예측 (피처 기여도 포함) |
| `/predict/simple/{id}` | GET | 간단 예측 (확률만) |
| `/predict/batch` | POST | 배치 예측 |
| `/model/metrics/{version}` | GET | 모델 성능 지표 |
| `/reward/{id}` | GET | 발견 보상 확인 |
| `/health` | GET | 서버 상태 확인 |

---

## 🎮 웹사이트 사용 방법

### 모드 선택
- **Player 모드**: 로켓을 조종하여 외계행성 탐사
- **Expert 모드**: 자유로운 카메라 이동으로 행성 관찰

### 3D 인터랙션
1. **행성 선택**: 행성 클릭 → 하이라이트 표시
2. **카메라 이동**: 선택된 행성 다시 클릭 → 카메라 이동
3. **궤도 회전**: 마우스 드래그로 시점 회전
4. **확대/축소**: 마우스 휠

### 행성 리스트 패널
- 외계행성 목록 표시
- 클릭하여 해당 행성으로 이동
- 즐겨찾기 추가/제거
- AI 예측 확률 표시

### 필터링
- **임계값 슬라이더**: 특정 확률 이상의 행성만 표시
- **즐겨찾기 필터**: 즐겨찾기한 행성만 표시

---

## ❗ 문제 해결

### 프론트엔드 문제

#### 1. `npm install` 실패
```bash
# 캐시 삭제 후 재시도
npm cache clean --force
npm install
```

#### 2. 포트 충돌 (3000번 포트 사용 중)
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID번호> /F

# 또는 다른 포트로 실행
PORT=3001 npm run dev
```

#### 3. Three.js 렌더링 오류
- GPU 가속 활성화 확인
- 브라우저 업데이트
- 하드웨어 가속 설정 확인 (Chrome: `chrome://settings/system`)

### 백엔드 문제

#### 1. Python 모듈 없음
```bash
# 가상환경 활성화 확인
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# 의존성 재설치
pip install -r requirements.txt
```

#### 2. 포트 충돌 (8000번 포트 사용 중)
```bash
# Mac/Linux
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID번호> /F

# 또는 다른 포트로 실행
# run.py 수정:
# uvicorn.run(app, host="0.0.0.0", port=8001)
```

#### 3. 데이터베이스 초기화 실패
```bash
# DB 파일 삭제 후 재생성
rm exoplanet.db
python init_db.py
```

#### 4. CORS 오류
`.env` 파일에서 `ALLOWED_ORIGINS` 확인:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 일반적인 문제

#### 1. 행성이 보이지 않음
- **임계값 확인**: 슬라이더를 0으로 조정
- **즐겨찾기 필터 해제**: 필터 버튼 확인
- **백엔드 연결 확인**: 콘솔에서 API 에러 확인

#### 2. 카메라 이동 안 됨
- **두 번 클릭**: 첫 번째 클릭(선택), 두 번째 클릭(이동)
- **로딩 대기**: 카메라 이동 완료까지 대기

#### 3. 성능 저하
- **행성 필터링**: 임계값 올려서 표시 행성 수 감소
- **브라우저 탭 수 줄이기**
- **GPU 가속 활성화**

---

## 📊 데이터 구조

### 외계행성 데이터 (Planet)
```typescript
interface Planet {
  id: string;           // 고유 ID
  name: string;         // 행성 이름 (예: "LHS 1140b")
  ra?: number;          // Right Ascension (0-360)
  dec?: number;         // Declination (-90 to 90)
  score?: number;       // AI 예측 확률 (0-1)
  features: {
    mass?: number;
    radius?: number;
    orbital_period?: number;
    stellar_flux?: number;
  };
}
```

### API 응답 형식
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "KOI-01000",
    "ra": 180.5,
    "dec": 45.2,
    "ai_probability": 0.95,
    "status": "confirmed",
    "coordinates_3d": {
      "x": 25.3,
      "y": 18.7,
      "z": 32.1
    },
    "features": { ... }
  }
}
```

---

## 🔄 개발 워크플로우

### 코드 수정 후 반영
- **프론트엔드**: 자동 리로드 (Hot Module Replacement)
- **백엔드**: 서버 재시작 필요 (`python run.py`)

### 테스트
```bash
# 프론트엔드 (TypeScript 타입 체크)
cd front
npm run build

# 백엔드 (pytest)
cd back
pytest
```

---

## 📚 추가 문서

- **백엔드 상세 가이드**: `back/QUICKSTART.md`
- **백엔드 API 문서**: `back/README.md`
- **카메라 이동 로직**: `front/src/utils/cameraMovement.ts`

---

## 🆘 도움이 필요하신가요?

1. **콘솔 로그 확인**: 브라우저 개발자 도구 (F12) → Console 탭
2. **네트워크 확인**: 개발자 도구 → Network 탭
3. **백엔드 로그 확인**: 터미널에서 `python run.py` 실행 시 출력

---

**Happy Exploring! 🚀🌌**
