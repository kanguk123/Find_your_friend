# ⚠️ Breaking Changes Checklist - 0-100 Model Output Integration

## Quick Summary

✅ **Recommended Approach:** Normalize 0-100 → 0-1 (NO breaking changes)
❌ **Alternative:** Store as 0-100 (MANY breaking changes)

---

## 🔍 Systems That Depend on 0-1 Probability Range

### 1. **Database Schema** ⚠️

**Current:**
```python
# app/schemas/planet.py:35
ai_probability: Optional[float] = Field(None, ge=0.0, le=1.0)
```

**Impact if using 0-100:**
- ❌ Pydantic validation fails for values > 1.0
- ❌ Requires schema update: `ge=0.0, le=100.0`

**Solution:**
✅ Normalize to 0-1 → No change needed

---

### 2. **Reward System Thresholds** ⚠️

**Current:**
```python
# app/services/prediction_service.py:211-222
if probability >= 0.9:      # High confidence
    points_earned = 100
elif probability >= 0.7:    # Medium confidence
    points_earned = 50
else:                       # Low confidence (0.5-0.7)
    points_earned = 25
```

**Impact if using 0-100:**
- ❌ Thresholds 0.9, 0.7, 0.5 would always fail
- ❌ Requires updating to 90, 70, 50

**Solution:**
✅ Normalize to 0-1 → Thresholds work unchanged

---

### 3. **Frontend Color Gradients** ⚠️

**Current:**
```typescript
// src/components/ExoplanetPointsAPI.tsx:218-228
if (aiProbability < 0.5) {
    // 0-0.5: Yellow → Green
    r = Math.floor(255 * (1 - aiProbability * 2));
    g = 255;
    b = 0;
} else {
    // 0.5-1: Green → Red
    r = Math.floor(255 * (aiProbability - 0.5) * 2);
    g = Math.floor(255 * (1 - (aiProbability - 0.5) * 2));
    b = 0;
}
```

**Impact if using 0-100:**
- ❌ Colors broken (all planets would be red)
- ❌ Requires: `aiProbability / 100` everywhere

**Solution:**
✅ Normalize to 0-1 → Colors work unchanged

---

### 4. **Frontend Coin Collection** ⚠️

**Current:**
```typescript
// src/components/ExoplanetPointsAPI.tsx:116
if (mode === "player" && planet.ai_probability >= 0.9) {
    collectCoin();
}
```

**Impact if using 0-100:**
- ❌ Condition `>= 0.9` would never be true
- ❌ Requires: `>= 90`

**Solution:**
✅ Normalize to 0-1 → Coin logic works unchanged

---

### 5. **Confidence Calculation** ⚠️

**Current:**
```python
# app/ml/model_wrapper.py:170-186
def _get_confidence(self, probability: float) -> str:
    if probability >= 0.9 or probability <= 0.1:
        return "high"
    elif probability >= 0.7 or probability <= 0.3:
        return "medium"
    else:
        return "low"
```

**Impact if using 0-100:**
- ❌ All confidences would be "low"
- ❌ Requires: `>= 90`, `>= 70`, etc.

**Solution:**
✅ Normalize to 0-1 → Confidence logic works unchanged

---

### 6. **Database Filter Queries** ⚠️

**Current:**
```python
# app/services/planet_service.py:124-128
if filters.min_probability is not None:
    query = query.filter(Planet.ai_probability >= filters.min_probability)
```

**Impact if using 0-100:**
- ❌ Users filtering by 0.9 would get no results
- ❌ API documentation needs updating

**Solution:**
✅ Normalize to 0-1 → Filters work unchanged

---

### 7. **Prediction Response Schema** ⚠️

**Current:**
```python
# app/schemas/planet.py:112
probability: float  # No explicit validation, but expected 0-1
```

**Impact if using 0-100:**
- ❌ API consumers expect 0-1
- ❌ Breaking change for API clients

**Solution:**
✅ Normalize to 0-1 → API contract preserved

---

## 📊 Impact Analysis

### If You Use 0-100 Without Normalization

| Component | Impact | Changes Required |
|-----------|--------|------------------|
| Database Schema | ❌ Breaking | Update Pydantic validators |
| Model Wrapper | ❌ Breaking | Update thresholds |
| Prediction Service | ❌ Breaking | Update reward logic |
| Frontend Colors | ❌ Breaking | Divide by 100 everywhere |
| Frontend Coin Logic | ❌ Breaking | Update thresholds |
| API Docs | ❌ Breaking | Update all examples |
| Existing Data | ❌ Breaking | Migrate: `UPDATE ... * 100` |
| Third-party Consumers | ❌ Breaking | Notify API change |

**Total Breaking Changes:** 8+

---

### If You Normalize 0-100 → 0-1

| Component | Impact | Changes Required |
|-----------|--------|------------------|
| Database Schema | ✅ No change | None |
| Model Wrapper | ✅ No change | Add normalization only |
| Prediction Service | ✅ No change | Optional: add logging |
| Frontend Colors | ✅ No change | None |
| Frontend Coin Logic | ✅ No change | None |
| API Docs | ✅ No change | None |
| Existing Data | ✅ No change | None |
| Third-party Consumers | ✅ No change | None |

**Total Breaking Changes:** 0

---

## ✅ Recommended Migration Path

### Step 1: Update Model Wrapper

```bash
cp app/ml/model_wrapper_updated.py app/ml/model_wrapper.py
```

**Key Addition:**
```python
def _validate_probability(self, raw_output: float) -> float:
    """Auto-detect and normalize 0-100 or 0-1 outputs"""
    if raw_output > 1.0:
        # Assume 0-100, convert to 0-1
        return raw_output / 100.0
    else:
        # Already 0-1
        return raw_output
```

### Step 2: Test

```bash
python test_model_integration.py
```

Expected: All tests pass

### Step 3: Deploy

```bash
python run.py
```

Monitor logs for:
```
🎲 Raw model output: 85.0
✅ Normalized: 0.8500
```

---

## 🚨 Red Flags to Watch For

### 1. Frontend Planets All Red

**Symptom:** All planets appear red regardless of probability

**Cause:** Frontend receiving 0-100 instead of 0-1

**Check:**
```bash
curl http://localhost:8000/planets?page=1&page_size=1
# Should see "ai_probability": 0.85, NOT 85.0
```

---

### 2. No Coins Collected

**Symptom:** Clicking high-probability planets doesn't award coins

**Cause:** Frontend checking `>= 0.9` but receiving 85.0

**Check:** Browser console logs
```javascript
console.log("Planet probability:", planet.ai_probability);
// Should be 0.85, not 85.0
```

---

### 3. All Rewards Are 0 Points

**Symptom:** Even CONFIRMED planets give 0 points

**Cause:** Reward thresholds (0.9, 0.7, 0.5) not matching data range

**Check:** Backend logs
```
🏆 Reward calculation: probability=0.85 >= 0.7 → 50 points
```

---

### 4. Database Constraint Violation

**Symptom:** Error inserting/updating planet predictions

**Cause:** Trying to store 85.0 in a field expecting 0-1

**Check:** PostgreSQL logs
```
ERROR: new row for relation "planets" violates check constraint
```

---

### 5. Pydantic Validation Error

**Symptom:** API returns 422 Unprocessable Entity

**Cause:** Schema expects 0-1, receiving 0-100

**Check:** API error response
```json
{
    "detail": [{
        "loc": ["ai_probability"],
        "msg": "ensure this value is less than or equal to 1.0"
    }]
}
```

---

## 🧪 Testing Checklist

Before deploying:

- [ ] Model outputs valid probabilities (check logs)
- [ ] Validation accepts 0-100 and normalizes to 0-1
- [ ] Validation rejects None, NaN, Inf, negative, >100
- [ ] Database stores values as 0-1
- [ ] Frontend receives 0-1 values
- [ ] Planet colors render correctly (gradient)
- [ ] Coins collected when probability >= 0.9
- [ ] Rewards calculated correctly (100/50/25 points)
- [ ] Confidence levels correct (high/medium/low)
- [ ] API filters work (min_probability, max_probability)
- [ ] Batch predictions work
- [ ] Error handling works (invalid outputs rejected)

---

## 📝 Deployment Checklist

- [ ] Backup current code
- [ ] Update `model_wrapper.py`
- [ ] Run `test_model_integration.py`
- [ ] Test on dev environment
- [ ] Verify logs show normalization
- [ ] Test API endpoints
- [ ] Test frontend rendering
- [ ] Test coin collection
- [ ] Deploy to production
- [ ] Monitor logs for errors
- [ ] Rollback plan ready

---

## 🔄 Rollback Procedure

If something breaks:

```bash
# 1. Restore backup
cp app/ml/model_wrapper_backup.py app/ml/model_wrapper.py

# 2. Restart server
pkill -f "python run.py"
python run.py

# 3. Verify restoration
curl http://localhost:8000/predict/1
```

---

## 📞 Support

If you encounter issues:

1. **Check logs** - Look for normalization pipeline
2. **Run tests** - `python test_model_integration.py`
3. **Check database** - Verify stored values are 0-1
4. **Check API** - Verify responses are 0-1
5. **Check frontend** - Verify rendering is correct

---

## ✅ Final Recommendation

**Use the normalization approach (0-100 → 0-1):**

✅ Zero breaking changes
✅ Backward compatible
✅ Easy to test
✅ Easy to rollback
✅ No frontend changes
✅ No database migration

**Avoid storing as 0-100:**

❌ 8+ breaking changes
❌ Requires full system update
❌ Risk of bugs
❌ Complex migration
❌ Breaking API change

---

**🎯 Bottom Line: Normalize at the model layer, keep everything else as-is.**
