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

## 🧪 테스트 실행

### 기본 테스트
```bash
# 모든 테스트 실행 (19개)
pytest

# 상세 출력
pytest -v

# 커버리지와 함께
pytest --cov=app --cov-report=html
```

### 특정 테스트만
```bash
# 행성 API 테스트
pytest tests/test_planets.py

# 예측 API 테스트
pytest tests/test_predict.py

# 모델 관리 테스트
pytest tests/test_model.py
```

**결과**: 19 passed ✅

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

## 🤖 AI 모델 연동 (중요!)

현재는 **더미 데이터 모드**입니다. AI 모델이 완성되면:

### 1단계: AI 서버 구축

AI 서버는 다음 인터페이스를 제공해야 합니다:

**요청**:
```json
POST http://localhost:8001/predict
{
    "features": {
        "feature_000": 1.234,
        "feature_001": 0.567,
        ...  // 총 300개
    }
}
```

**응답**:
```json
{
    "probability": 0.87,
    "confidence": "high",
    "model_version": "v0.1",
    "feature_contributions": [  // 선택사항
        {
            "feature_name": "feature_000",
            "value": 1.234,
            "contribution": 0.15,
            "importance": 0.95
        }
    ],
    "top_correlations": {  // 선택사항
        "feature_000": 0.82,
        "feature_001": -0.45
    }
}
```

### 2단계: 백엔드 연동

**파일**: `app/services/prediction_service.py` (65번째 줄)

현재 코드:
```python
if settings.USE_DUMMY_DATA:
    return PredictionService._generate_dummy_prediction(planet, include_details)
else:
    raise AIServiceException("AI service integration not yet implemented")
```

수정 후:
```python
if settings.USE_DUMMY_DATA:
    return PredictionService._generate_dummy_prediction(planet, include_details)
else:
    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.AI_SERVICE_URL}/predict",
            json={"features": planet.features}
        )
        ai_result = response.json()

    return PredictionResponse(
        planet_id=planet.id,
        probability=ai_result["probability"],
        confidence=ai_result["confidence"],
        model_version=ai_result["model_version"],
        # ... 나머지 필드
    )
```

### 3단계: 환경 변수 수정

`.env` 파일:
```env
USE_DUMMY_DATA=False
AI_SERVICE_URL=http://localhost:8001
```

### 4단계: 테스트

```bash
# AI 서버 실행 (포트 8001)
cd ai
python app.py

# 백엔드 서버 실행 (포트 8000)
cd back
python run.py

# 테스트
curl http://localhost:8000/predict/1
```

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

## 🗄️ DB 수정 방법

### Alembic 마이그레이션 사용

```bash
# 1. 모델 파일 수정 (예: app/models/planet.py)
# 새 컬럼 추가:
# discovered_by = Column(String(100))

# 2. 마이그레이션 생성
alembic revision --autogenerate -m "Add discovered_by column"

# 3. 적용
alembic upgrade head

# 4. 롤백 (필요시)
alembic downgrade -1
```

### 직접 DB 수정
```bash
# PostgreSQL 접속
psql -U postgres -d nasa_hackathon

# 테이블 확인
\dt

# 데이터 조회
SELECT id, name, ai_probability, status FROM planets LIMIT 10;
```

---

## 🐛 디버깅 팁

### 에러 발생 시

모든 에러는 **통일된 형식**으로 반환됩니다:
```json
{
    "success": false,
    "message": "Planet with identifier '999' not found",
    "errors": [{
        "field": "planet_id",
        "message": "Planet not found",
        "error_type": "NotFoundException"
    }]
}
```

### 코드 구조
```
[요청] → Router (입력 검증) → Service (비즈니스 로직) → Model (DB)
```

**에러 위치 파악**:
- Router 에러 → Pydantic 검증 실패
- Service 에러 → 비즈니스 로직 문제
- Model 에러 → DB 쿼리 문제

### 로그 확인
```bash
# 서버 실행 시 자동으로 로그 출력
python run.py

# 로그 예시:
# ERROR - API Exception: Planet with identifier '999' not found
#   path: /planets/999
#   method: GET
```

---

## 📚 더 자세한 정보

- **전체 문서**: `README.md`
- **API 문서**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

---

## 📋 현재 진행 상황

✅ **백엔드**: 100% 완성 (19개 테스트 통과)
✅ **DB**: PostgreSQL 연동 완료
✅ **더미 데이터**: 500개 행성
⏳ **AI 서버**: 연동 준비 완료 (코드 수정 1곳만 필요)
⏳ **프론트엔드**: API 연동 필요

---

**Happy Coding! 🚀**
