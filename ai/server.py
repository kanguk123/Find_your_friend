# serve.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib, pandas as pd, numpy as np
from pathlib import Path

BUNDLE_PATH = Path(__file__).resolve().parent / "rf_bundle.joblib"
bundle = joblib.load(BUNDLE_PATH)
pipe = bundle["pipeline"]
feature_order = bundle["feature_order"]
classes_ = getattr(pipe.named_steps.get("clf", pipe), "classes_", None)  # clf가 없을 수도 있어서 방어

app = FastAPI(title="Rocket RF Inference")

class PredictIn(BaseModel):
    features: dict

def _to_py(x):
    # numpy 타입을 순수 파이썬으로 변환 (JSON 직렬화 안전)
    if isinstance(x, (np.generic,)):
        return x.item()
    return x

@app.post("/predict")
def predict(inp: PredictIn):
    try:
        # ===== 1) 입력 정렬/보정 =====
        df = pd.DataFrame([inp.features])
        for c in feature_order:
            if c not in df.columns:
                df[c] = np.nan
        df = df[feature_order]

        # ===== 2) 예측 =====
        y_pred = pipe.predict(df)[0]
        y_pred_py = _to_py(y_pred)

        # ===== 3) 확률 =====
        proba_dict = None
        pos_proba = None
        if hasattr(pipe, "predict_proba") or hasattr(pipe.named_steps.get("clf", None), "predict_proba"):
            # 파이프라인 최종 단계 또는 clf에서 predict_proba 호출
            try:
                y_proba = pipe.predict_proba(df)[0]  # shape: (n_classes,)
            except Exception:
                # 일부 파이프라인은 바로 predict_proba가 없을 수 있어 마지막 스텝에서 재시도
                clf = pipe.named_steps.get("clf", None)
                if clf is None or not hasattr(clf, "predict_proba"):
                    y_proba = None
                else:
                    y_proba = clf.predict_proba(df)[0]

            if y_proba is not None and classes_ is not None:
                # 각 클래스별 확률 딕셔너리 (키는 클래스 라벨)
                proba_dict = { _to_py(cls): float(prob) for cls, prob in zip(classes_, y_proba) }
                # 이진분류에서 '양성(1)' 확률도 별도로 제공 (라벨에 1이 있을 때)
                if 1 in set(classes_):
                    idx = int(np.where(classes_ == 1)[0][0])
                    pos_proba = float(y_proba[idx])
                else:
                    # '예측된 클래스'의 확률을 대표값으로 제공 (멀티클래스/라벨이 1이 없을 때)
                    idx = int(np.where(classes_ == y_pred)[0][0])
                    pos_proba = float(y_proba[idx])

        return {
               # 예: 0 또는 1 (혹은 멀티클래스 라벨)
            "proba": pos_proba*100,          # 이진이면 보통 '1' 클래스 확률, 아니면 예측클래스 확률
                      # 각 클래스별 확률 딕셔너리 (원하면 이 값만 보면 됨)
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
