# 🌌 Exoplanet Discovery API

NASA Hackathon 프로젝트를 위한 FastAPI 기반 외계행성 발견 및 분류 백엔드 서버

## 📋 목차

- [프로젝트 개요](#프로젝트-개요)
- [주요 기능](#주요-기능)
- [프로젝트 구조](#프로젝트-구조)
- [설치 방법](#설치-방법)
- [실행 방법](#실행-방법)
- [API 문서](#api-문서)
- [테스트](#테스트)
- [AI 모델 연동](#ai-모델-연동)
- [데이터베이스](#데이터베이스)

## 🎯 프로젝트 개요

이 프로젝트는 **유지보수성**, **확장성**, **에러 디버깅**을 최우선으로 설계된 FastAPI 서버입니다.

### 핵심 설계 원칙

1. **모듈화**: 각 계층(Router, Service, Model)이 명확히 분리
2. **타입 안전성**: Pydantic을 통한 철저한 데이터 검증
3. **통일된 응답 구조**: 모든 API가 일관된 JSON 형식 반환
4. **더미 데이터 지원**: AI 모델 완성 전까지 500개 샘플 데이터로 개발 가능
5. **쉬운 AI 연동**: `USE_DUMMY_DATA` 플래그만 변경하면 실제 AI 서비스로 전환

## ✨ 주요 기능

### 🌍 행성 데이터 관리
- 500개 더미 행성 데이터 (RA, Dec, r 좌표 + 300개 피처)
- 3D 시각화를 위한 좌표 변환 (RA/Dec → XYZ)
- 확률, 상태, 좌표 기반 필터링
- 페이지네이션 지원

### 🤖 AI 예측
- **연구자 모드**: 피처 기여도 + 상관관계 분석
- **초보자 모드**: 간단한 확률 + 신뢰도만 표시
- 배치 예측 (최대 100개 동시 처리)
- 더미/실제 AI 모델 간 쉬운 전환

### 🔧 모델 관리
- 새 모델 학습 (하이퍼파라미터 커스터마이징)
- 기존 모델 복사 → 재학습 → 새 버전 생성
- F1, Precision, Recall, AUC-ROC 메트릭 추적
- 피처 중요도 및 상관관계 조회

### 📊 데이터 업로드
- CSV 파일 업로드 및 전처리
  - 결측값 처리 (median imputation)
  - 이상치 제거 (3-sigma rule)
  - 표준화 (StandardScaler)
- 자동 재학습 옵션

### 🎁 보상 시스템 (초보자 UX)
- 확률 ≥ 90% 행성 발견 시 포인트 지급
- 3단계 업그레이드 시스템
- 프론트엔드와 연동 가능

## 📁 프로젝트 구조

```
back/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI 메인 앱
│   ├── config.py                  # 환경 설정 관리
│   ├── database.py                # DB 연결 및 세션
│   ├── exceptions.py              # 커스텀 예외 + 핸들러
│   │
│   ├── models/                    # SQLAlchemy 모델
│   │   ├── planet.py              # 행성 DB 모델
│   │   └── model_version.py      # AI 모델 버전 추적
│   │
│   ├── schemas/                   # Pydantic 스키마
│   │   ├── response.py            # 통일된 응답 구조
│   │   ├── planet.py              # 행성 관련 스키마
│   │   └── model.py               # 모델 관련 스키마
│   │
│   ├── routers/                   # API 라우터
│   │   ├── planets.py             # 행성 CRUD
│   │   ├── predict.py             # 예측 엔드포인트
│   │   ├── model.py               # 모델 관리
│   │   ├── upload.py              # 파일 업로드
│   │   └── reward.py              # 보상 시스템
│   │
│   ├── services/                  # 비즈니스 로직
│   │   ├── planet_service.py
│   │   ├── prediction_service.py
│   │   └── model_service.py
│   │
│   └── utils/                     # 유틸리티
│       ├── coordinates.py         # 좌표 변환
│       ├── preprocessing.py       # 데이터 전처리
│       └── dummy_data.py          # 더미 데이터 생성
│
├── tests/                         # pytest 테스트
│   ├── conftest.py
│   ├── test_planets.py
│   ├── test_predict.py
│   └── test_model.py
│
├── .env.example                   # 환경 변수 예제
├── requirements.txt               # 의존성
└── README.md                      # 이 파일
```

## 🚀 설치 방법

### 1. 가상환경 생성 및 활성화 (venv 사용)

#### Windows
```bash
cd back

# venv 폴더 생성
python -m venv venv

# 가상환경 활성화
venv\Scripts\activate

# 가상환경 활성화 확인 (프롬프트 앞에 (venv) 표시됨)
```

#### Linux/Mac
```bash
cd back

# venv 폴더 생성
python3 -m venv venv

# 가상환경 활성화
source venv/bin/activate

# 가상환경 활성화 확인 (프롬프트 앞에 (venv) 표시됨)
```

#### PowerShell에서 실행 오류 시 (Windows)
```powershell
# 실행 정책 오류가 발생하면
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 다시 활성화
venv\Scripts\activate
```

### 2. 의존성 설치

```bash
# 가상환경이 활성화된 상태에서
pip install -r requirements.txt
```

### 3. 환경 변수 설정

#### Windows
```bash
# .env.example을 .env로 복사
copy .env.example .env
```

#### Linux/Mac
```bash
# .env.example을 .env로 복사
cp .env.example .env
```

#### 간단한 시작 (SQLite 사용)
`.env` 파일을 열어서 다음과 같이 수정:
```env
DATABASE_URL=sqlite:///./exoplanet.db
USE_DUMMY_DATA=True
DUMMY_PLANET_COUNT=500
```

### 4. 데이터베이스 설정 (선택사항)

#### PostgreSQL 사용 시

**Windows:**
```bash
# PostgreSQL 설치 후
psql -U postgres
CREATE DATABASE exoplanet_db;
\q
```

**Linux/Mac:**
```bash
sudo -u postgres createdb exoplanet_db
```

**`.env` 파일 설정:**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/exoplanet_db
```

#### SQLite 사용 (권장 - 간편함)
```env
DATABASE_URL=sqlite:///./exoplanet.db
```

### 5. 데이터베이스 초기화

```bash
# 가상환경이 활성화된 상태에서
python init_db.py
```

## ▶️ 실행 방법

### 가상환경 활성화 (매번 실행 필요)

#### Windows
```bash
cd back
venv\Scripts\activate
```

#### Linux/Mac
```bash
cd back
source venv/bin/activate
```

### 서버 실행

#### 방법 1: run.py 사용 (권장)
```bash
# 가상환경이 활성화된 상태에서
python run.py
```

#### 방법 2: 직접 실행
```bash
# 가상환경이 활성화된 상태에서
python -m app.main
```

#### 방법 3: uvicorn 직접 사용
```bash
# 개발 모드 (자동 리로드)
uvicorn app.main:app --reload

# 프로덕션 모드
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 서버 접속

서버가 시작되면 다음 URL에 접속:
- **API 문서 (Swagger UI)**: http://localhost:8000/docs
- **API 문서 (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Root**: http://localhost:8000/

### 가상환경 비활성화

```bash
# 작업 완료 후 가상환경 종료
deactivate
```

### 전체 실행 명령어 요약

```bash
# 1. 프로젝트 폴더로 이동
cd back

# 2. 가상환경 활성화
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# 3. (최초 1회만) DB 초기화
python init_db.py

# 4. 서버 실행
python run.py

# 5. 브라우저에서 http://localhost:8000/docs 접속
```

## 📖 API 문서

서버 실행 후 http://localhost:8000/docs 에서 Swagger UI로 모든 엔드포인트를 테스트할 수 있습니다.

### 주요 엔드포인트

#### 행성 조회
- `GET /planets` - 전체 행성 목록 (페이지네이션)
- `GET /planets/{id}` - 특정 행성 상세 정보
- `POST /planets/filter` - 조건별 필터링

#### 예측
- `GET /predict/{planet_id}` - 연구자용 상세 예측
- `GET /predict/simple/{planet_id}` - 초보자용 간단 예측
- `POST /predict/batch` - 배치 예측

#### 모델 관리
- `POST /model/train` - 새 모델 학습
- `POST /model/retrain` - 기존 모델 재학습
- `GET /model/metrics/{version}` - 성능 지표 조회
- `GET /model/features/importance/{version}` - 피처 중요도
- `GET /model/features/correlation` - 피처 상관관계

#### 데이터 업로드
- `POST /upload/csv` - CSV 업로드 및 전처리

#### 보상 시스템
- `GET /reward/{planet_id}` - 보상 확인

## 🧪 테스트

```bash
# 모든 테스트 실행
pytest

# 커버리지와 함께 실행
pytest --cov=app

# 특정 테스트 파일만 실행
pytest tests/test_planets.py

# verbose 모드
pytest -v
```

### 테스트 구조
- `conftest.py`: 테스트용 DB 및 픽스처
- `test_planets.py`: 행성 CRUD 테스트
- `test_predict.py`: 예측 기능 테스트
- `test_model.py`: 모델 관리 테스트

## 🤖 AI 모델 연동

현재는 더미 데이터 모드로 작동하지만, 실제 AI 서비스 연동은 매우 간단합니다.

### 연동 단계

#### 1. 환경 변수 설정 (.env)
```env
USE_DUMMY_DATA=False
AI_SERVICE_URL=http://localhost:8001  # AI 서버 주소
```

#### 2. AI 서비스 코드 수정

`app/services/prediction_service.py`의 `predict_planet` 메서드:

```python
# 현재 (더미)
if settings.USE_DUMMY_DATA:
    return PredictionService._generate_dummy_prediction(planet, include_details)
else:
    raise AIServiceException("AI service integration not yet implemented")

# 실제 연동 시
if settings.USE_DUMMY_DATA:
    return PredictionService._generate_dummy_prediction(planet, include_details)
else:
    # AI 서비스 호출
    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.AI_SERVICE_URL}/predict",
            json={"features": planet.features}
        )
        ai_result = response.json()

    return PredictionResponse(
        planet_id=planet.id,
        planet_name=planet.name,
        probability=ai_result["probability"],
        prediction="exoplanet" if ai_result["probability"] >= 0.5 else "not_exoplanet",
        confidence=ai_result["confidence"],
        model_version=ai_result["model_version"],
        feature_contributions=ai_result.get("feature_contributions"),
        top_correlations=ai_result.get("top_correlations")
    )
```

#### 3. AI 서버 인터페이스 요구사항

AI 서버는 다음 형식의 요청/응답을 처리해야 합니다:

**요청:**
```json
POST /predict
{
  "features": {
    "feature_000": 1.234,
    "feature_001": 0.567,
    ...
  }
}
```

**응답:**
```json
{
  "probability": 0.87,
  "confidence": "high",
  "model_version": "v0.1",
  "feature_contributions": [
    {
      "feature_name": "feature_000",
      "value": 1.234,
      "contribution": 0.15,
      "importance": 0.95
    }
  ],
  "top_correlations": {
    "feature_000": 0.82,
    "feature_001": -0.45
  }
}
```

## 🗄️ 데이터베이스

### 마이그레이션 (Alembic)

#### 초기 설정
```bash
# Alembic 초기화 (이미 설정됨)
alembic init alembic

# 마이그레이션 생성
alembic revision --autogenerate -m "Initial migration"

# 마이그레이션 적용
alembic upgrade head
```

#### DB 스키마

**planets 테이블:**
- `id`: Primary key
- `name`: 행성 이름 (unique)
- `ra`, `dec`, `r`: 좌표
- `status`: unknown/candidate/confirmed
- `ai_probability`: 0.0 ~ 1.0
- `model_version`: 사용된 모델 버전
- `features`: JSON (300개 피처)
- `created_at`, `updated_at`: 타임스탬프

**model_versions 테이블:**
- `id`: Primary key
- `version`: 모델 버전 (unique)
- `config`: JSON (하이퍼파라미터)
- `f1_score`, `precision`, `recall`, `accuracy`, `auc_roc`: 메트릭
- `is_active`: 활성 모델 여부
- `parent_version`: 부모 모델 (재학습용)
- `trained_at`, `created_at`: 타임스탬프

### 직접 DB 접근

```bash
# PostgreSQL 콘솔
psql -U username -d exoplanet_db

# 테이블 확인
\dt

# 행성 데이터 조회
SELECT id, name, ai_probability, status FROM planets LIMIT 10;
```

## 🔧 트러블슈팅

### 일반적인 문제들

#### 1. DB 연결 오류
```bash
# PostgreSQL 서비스 확인
sudo systemctl status postgresql  # Linux
sc query postgresql-x64-XX        # Windows

# .env 파일의 DATABASE_URL 확인
```

#### 2. 포트 이미 사용 중
```bash
# 다른 포트로 실행
uvicorn app.main:app --port 8001
```

#### 3. 더미 데이터 재생성
```python
# Python 콘솔에서
from app.database import SessionLocal, init_db
from app.utils.dummy_data import initialize_dummy_data

init_db()
db = SessionLocal()
initialize_dummy_data(db, force=True)  # 기존 데이터 삭제 후 재생성
db.close()
```

## 📝 개발 가이드

### 새 엔드포인트 추가 방법

1. **스키마 정의** (`app/schemas/`)
2. **서비스 로직 구현** (`app/services/`)
3. **라우터 추가** (`app/routers/`)
4. **main.py에 라우터 등록**
5. **테스트 작성** (`tests/`)

### 코드 스타일

- PEP 8 준수
- Type hints 사용
- Docstrings 작성 (Google 스타일)
- 에러는 커스텀 예외 사용

## 🤝 기여

이 프로젝트는 NASA Hackathon용으로 개발되었습니다.

## 📄 라이선스

MIT License

---

**Made with ❤️ for NASA Hackathon**
