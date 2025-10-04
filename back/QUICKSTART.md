# 🚀 빠른 시작 가이드

NASA 해커톤 외계행성 발견 API를 5분 안에 실행하세요!

## ⚡ 빠른 실행 (venv 사용)

### 1️⃣ 가상환경 생성 및 활성화

#### Windows
```bash
cd back
python -m venv venv
venv\Scripts\activate
```

#### Mac/Linux
```bash
cd back
python3 -m venv venv
source venv/bin/activate
```

### 2️⃣ 의존성 설치
```bash
# (venv) 표시 확인 후
pip install -r requirements.txt
```

### 3️⃣ 환경 설정

#### Windows
```bash
copy .env.example .env
```

#### Mac/Linux
```bash
cp .env.example .env
```

`.env` 파일을 열어서 SQLite로 변경 (간단한 테스트용):
```env
DATABASE_URL=sqlite:///./exoplanet.db
```

### 4️⃣ DB 초기화
```bash
python init_db.py
```

### 5️⃣ 서버 실행
```bash
python run.py
```

✅ **완료!** 브라우저에서 http://localhost:8000/docs 를 열어보세요.

---

## 📝 매번 실행할 때

```bash
# 1. 프로젝트 폴더로 이동
cd back

# 2. 가상환경 활성화
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# 3. 서버 실행
python run.py
```

---

## 📊 API 테스트하기

### Swagger UI에서 테스트
1. http://localhost:8000/docs 접속
2. "GET /planets" 클릭
3. "Try it out" → "Execute"
4. 500개 더미 행성 데이터 확인!

### curl로 테스트
```bash
# 전체 행성 목록
curl http://localhost:8000/planets

# 특정 행성 상세 정보
curl http://localhost:8000/planets/1

# 예측
curl http://localhost:8000/predict/1
```

---

## 🎯 주요 엔드포인트

| 엔드포인트 | 설명 | 예시 |
|----------|------|------|
| `GET /planets` | 전체 행성 목록 | http://localhost:8000/planets |
| `GET /planets/{id}` | 행성 상세 정보 | http://localhost:8000/planets/1 |
| `POST /planets/filter` | 조건별 필터링 | 확률 ≥ 0.9 행성만 조회 |
| `GET /predict/{id}` | 상세 예측 | 피처 기여도 포함 |
| `GET /predict/simple/{id}` | 간단 예측 | 확률만 반환 |
| `POST /predict/batch` | 배치 예측 | 여러 행성 동시 처리 |
| `GET /model/metrics/v0.1` | 모델 성능 지표 | F1, Precision, Recall |
| `GET /reward/{id}` | 보상 확인 | 발견 시 포인트 지급 |

---

## 🔧 프론트엔드 연동

### CORS 설정
`.env` 파일에서 프론트엔드 URL 추가:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### API 호출 예시 (JavaScript/TypeScript)
```javascript
// 행성 목록 조회
const response = await fetch('http://localhost:8000/planets?page=1&page_size=50');
const data = await response.json();
console.log(data.data); // 행성 배열

// 3D 좌표 사용
data.data.forEach(planet => {
  const { x, y, z } = planet.coordinates_3d;
  // Three.js 등으로 3D 시각화
  addPlanetToScene(x, y, z, planet.ai_probability);
});

// 예측 (간단)
const prediction = await fetch('http://localhost:8000/predict/simple/1');
const result = await prediction.json();
console.log(result.data.is_exoplanet); // true/false
```

---

## 🤖 AI 모델 연동 준비

현재는 **더미 데이터 모드**입니다. AI 모델이 완성되면:

### 1. `.env` 파일 수정
```env
USE_DUMMY_DATA=False
AI_SERVICE_URL=http://localhost:8001
```

### 2. AI 서버 요구사항
- **입력**: `{"features": {"feature_000": 1.23, ...}}`
- **출력**: `{"probability": 0.87, "confidence": "high", ...}`
- **엔드포인트**: `POST /predict`

### 3. 코드 수정 위치
`app/services/prediction_service.py`의 65번째 줄부터 AI 연동 코드 주석 처리되어 있음

---

## 📝 데이터 구조

### 행성 데이터
```json
{
  "id": 1,
  "name": "KOI-01000",
  "ra": 180.5,        // Right Ascension (0-360)
  "dec": 45.2,        // Declination (-90 to 90)
  "r": 50.0,          // 3D 시각화 깊이값
  "status": "confirmed",  // unknown/candidate/confirmed
  "ai_probability": 0.95,
  "model_version": "v0.1",
  "coordinates_3d": {
    "x": 25.3,
    "y": 18.7,
    "z": 32.1
  },
  "features": {
    "feature_000": 1.234,
    "feature_001": 0.567,
    // ... 총 300개
  }
}
```

---

## 🧪 테스트 실행

```bash
# 모든 테스트
pytest

# 커버리지
pytest --cov=app

# 특정 테스트
pytest tests/test_planets.py -v
```

---

## ❓ 문제 해결

### 서버가 시작되지 않음
```bash
# 포트 충돌 확인
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# 다른 포트로 실행
python -c "import uvicorn; from app.main import app; uvicorn.run(app, port=8001)"
```

### DB 오류
```bash
# DB 초기화
python init_db.py
```

### 더미 데이터 없음
서버 실행 시 자동으로 500개 생성됩니다. 수동으로 재생성:
```bash
python init_db.py
```

---

## 📚 더 자세한 정보

- **전체 문서**: `README.md`
- **API 문서**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

---

**Happy Coding! 🚀**
