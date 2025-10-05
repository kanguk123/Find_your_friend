# 🚀 NASA Space Apps Challenge 2025  
## Find Your Friend - Exoplanet Disposition Prediction  
### 데이터 분석 및 모델 개발 보고서

---

## 🎯 프로젝트 목표

- **목표(Task):**  
  외계행성 탐색 데이터에서 각 객체의 **disposition** (행성 여부: Confirmed, Candidate, False Positive 등)을 예측
- **데이터 출처:**  
  [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu)
- **공통 전처리 기준:**
  - 상관계수 0.05 이상인 **수치형 피처만 사용**
  - **메타데이터(이름, ID, 코멘트 등) 제거**
  - 정답(disposition)과 직접적으로 연관된 항목(예: score, disposition flag 등) **제외**
  - 결측치 비율이 높은 열 **삭제**

---

## 📊 1. K2 Planets and Candidates (K2p&c)
🔗 [Dataset Link](https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=k2pandc)

### 데이터 개요
- **샘플 수:** 약 4,000개  
- **특징 수:** 약 290개 (초기 4000여 개 항목 중 수치형만 사용)
- **목표:** disposition 예측  
  - Refuted는 데이터 수가 적어 제외

### 전처리 과정
| 단계 | 처리 내용 |
|------|------------|
| 1 | disposition 라벨 정리 및 Refuted 제외 |
| 2 | 수치형 피처만 선택 |
| 3 | 결측치 비율이 높은 피처 제거 |
| 4 | 상관계수 ≥ 0.05인 피처만 남김 |
<img width="918" height="418" alt="데이터 전처리 예시" src="https://github.com/user-attachments/assets/5b2c44a8-623b-4f43-adfc-34e8c905dfd9" />



### 분석 Task 구성
#### 🧩 Task 1: 이진분류  
- Confirmed + Candidate → 1  
- False Positive → 0  

#### 🧩 Task 2: 다중분류  
- Confirmed / Candidate / False Positive

#### 🧩 Task 3: 높은 상관관계 특징만 분석  
- 초기 268개 특징 → 최종 27개  
<img width="291" height="588" alt="image" src="https://github.com/user-attachments/assets/a55c431d-941e-41b4-bf21-388268ad3b8f" />

### 🧮 모델 성능
| Metric | Score |
|---------|--------|
| **AUC** | 0.973 |
| **F1** | 0.907 |
| **Precision** | 0.879 |
| **Recall** | 0.937 |

✅ **결론:**  
K2p&c 데이터셋은 상관관계 기반 특징 축소를 통해 효율적인 모델을 구축할 수 있었으며,  
AUC 0.97 수준의 높은 성능으로 **가벼운 모델에서도 안정적인 분류가 가능함**을 확인.

---

## 📘 2. Cumulative Dataset  
🔗 [Dataset Link](https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=cumulative)

### 데이터 개요
- **샘플 수:** 약 9,600개  
- **특징 수:** 141개 → 전처리 후 41개  
- **주요 처리:**  
  - 높은 상관관계 피처만 사용  
  - 정답(disposition)과 직접 연결된 특징 제거  

<img width="364" height="681" alt="image" src="https://github.com/user-attachments/assets/02275c14-1540-49c3-adb7-f4fba154d5cb" />



> 상위 30개 주요 상관 피처 기반 예측 모델 수행

### 🧮 모델 성능
| Metric | Score |
|---------|--------|
| **AUC** | 0.994 |
| **F1** | 0.980 |
| **Precision** | 0.978 |
| **Recall** | 0.982 |

✅ **결론:**  
Cumulative 데이터셋은 피처 간 상관성이 높고 결측이 적어 **가장 높은 예측 성능(AUC 0.994)** 을 기록.  
이진 분류 기준에서 거의 완벽한 수준의 분류 성능을 달성함.

---

## 🌌 3. TESS Objects of Interest (TOI)
🔗 [Dataset Link](https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=toi)

### 데이터 개요
- **샘플 수:** 약 7,699개  
- **특징 수:** 88개 → 전처리 후 34개
- **라벨 구성:**  
  ['FP', 'PC', 'KP', 'APC', 'FA', 'CP']
<img width="338" height="457" alt="image" src="https://github.com/user-attachments/assets/a708b61c-518d-49e1-bfe6-108044ad49e4" />

| 라벨 | 의미 | 통합 라벨 |
|-------|-------|-----------|
| CP, KP | Confirmed / Known Planet | 1 |
| PC, APC | Planetary Candidate / Ambiguous | Test |
| FA, FP | False Alarm / False Positive | 0 |

### 🧮 모델 성능
| Metric | Score |
|---------|--------|
| **AUC** | 0.848 |
| **F1** | 0.802 |
| **Precision** | 0.773 |
| **Recall** | 0.834 |

📉 **결론:**  
TESS 데이터는 관측 환경과 라벨 정의의 불확실성으로 인해 변동성이 높음.  
그럼에도 불구하고 16개의 주요 피처만으로 **AUC 0.84** 수준의 분류 성능 확보.

---

## 📈 종합 비교

| Dataset | Features Used | Task | AUC | F1 | Precision | Recall |
|----------|----------------|------|-----|---|------------|---------|
| **K2p&c** | 27 | Binary / Multi | 0.973 | 0.907 | 0.879 | 0.937 |
| **Cumulative** | 41 | Binary | **0.994** | **0.980** | **0.978** | **0.982** |
| **TOI** | 16 | Binary | 0.848 | 0.802 | 0.773 | 0.834 |

---

## 🧭 결론 및 향후 계획

- **현재 결과:**  
  - Cumulative Dataset 기반 이진 분류 모델이 **가장 높은 예측 성능**을 달성.  
  - K2p&c Dataset은 **가벼운 모델에서도 높은 효율성**을 보임.  
  - TOI Dataset은 라벨 불균형으로 인해 다소 낮은 정확도를 기록.

- **향후 개선 방향:**  
  1. 3개 데이터셋의 **공통 특징 매핑 및 통합 학습 (Meta-Learning)**  
  2. 비선형 관계 탐지를 위한 **Gradient Boosting / LightGBM / XGBoost** 적용  
  3. 상관관계 기반이 아닌 **Feature Importance / SHAP 기반 선택**으로 재분석  
  4. TESS 데이터의 **라벨 신뢰도 가중치 학습(weighted training)** 도입  
  5. Ensemble 기반의 **Cross-Dataset Generalization** 실험 진행  

---

📍 **작성자:** NASA Space Apps Challenge - Find Your Friend 팀   **Seongjoon Kim (김성준)**  
📅 **분석 기간:** 2025.09 ~ 2025.10
