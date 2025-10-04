#!/usr/bin/env python3
"""
Example Usage: Complete AI Model Integration Pipeline
Demonstrates the full flow from model output to API response
"""

# ============================================================================
# EXAMPLE 1: Direct Model Usage (Simulated)
# ============================================================================

def example_1_model_prediction():
    """Simulate calling the model and processing output"""
    print("="*80)
    print("EXAMPLE 1: Model Prediction with 0-100 Output")
    print("="*80)

    # Step 1: Model returns raw output (0-100 range)
    raw_model_output = 85.0  # Your AI model now outputs this
    print(f"\n🎲 Step 1 - Model output (raw): {raw_model_output}")

    # Step 2: Validation (check for NaN, None, out-of-range)
    if raw_model_output is None:
        raise ValueError("❌ Model output is None")

    import math
    if math.isnan(raw_model_output):
        raise ValueError("❌ Model output is NaN")

    if raw_model_output < 0 or raw_model_output > 100:
        raise ValueError(f"❌ Model output {raw_model_output} out of range (0-100)")

    print(f"✅ Step 2 - Validation passed: {raw_model_output} is valid")

    # Step 3: Normalization (0-100 → 0-1)
    if raw_model_output > 1.0:
        normalized = raw_model_output / 100.0
        print(f"🔄 Step 3 - Normalized: {raw_model_output} → {normalized:.4f}")
    else:
        normalized = raw_model_output
        print(f"✅ Step 3 - Already normalized: {normalized:.4f}")

    # Step 4: Rounding for consistent storage
    rounded = round(normalized, 4)
    print(f"🔢 Step 4 - Rounded: {rounded:.4f}")

    # Step 5: Determine prediction label
    threshold = 0.5
    prediction = "CONFIRMED" if rounded >= threshold else "FALSE POSITIVE"
    print(f"🏷️  Step 5 - Prediction: {prediction} (threshold={threshold})")

    # Step 6: Determine confidence
    if rounded >= 0.9 or rounded <= 0.1:
        confidence = "high"
    elif rounded >= 0.7 or rounded <= 0.3:
        confidence = "medium"
    else:
        confidence = "low"
    print(f"📈 Step 6 - Confidence: {confidence}")

    # Step 7: Prepare for database storage
    db_value = rounded  # Store as 0-1 in database
    print(f"💾 Step 7 - Database value: {db_value:.4f}")

    # Step 8: Prepare API response
    api_response = {
        "probability": rounded,           # 0-1 for frontend
        "probability_pct": rounded * 100, # 0-100 for display
        "raw_output": raw_model_output,   # Original for debugging
        "prediction": prediction,
        "confidence": confidence,
        "model_version": "v1.1"
    }
    print(f"📤 Step 8 - API Response:")
    for key, value in api_response.items():
        print(f"     {key}: {value}")

    print("\n✅ Complete pipeline executed successfully!\n")
    return api_response


# ============================================================================
# EXAMPLE 2: Error Handling
# ============================================================================

def example_2_error_handling():
    """Demonstrate error handling for invalid outputs"""
    print("="*80)
    print("EXAMPLE 2: Error Handling for Invalid Outputs")
    print("="*80)

    invalid_outputs = [
        ("None value", None),
        ("NaN", float('nan')),
        ("Infinity", float('inf')),
        ("Negative", -5.0),
        ("Above 100", 150.0),
    ]

    for description, invalid_value in invalid_outputs:
        print(f"\n🧪 Testing: {description}")
        print(f"   Value: {invalid_value}")

        try:
            # Validation logic
            if invalid_value is None:
                raise ValueError("Model output is None")

            import math
            if math.isnan(invalid_value):
                raise ValueError("Model output is NaN")

            if math.isinf(invalid_value):
                raise ValueError(f"Model output is Inf: {invalid_value}")

            if invalid_value < 0 or invalid_value > 100:
                raise ValueError(f"Output {invalid_value} outside valid range 0-100")

            print(f"   ✅ Unexpectedly passed validation")

        except ValueError as e:
            print(f"   ✅ Correctly rejected: {str(e)}")

    print("\n✅ All error cases handled correctly!\n")


# ============================================================================
# EXAMPLE 3: Batch Processing
# ============================================================================

def example_3_batch_processing():
    """Demonstrate batch prediction processing"""
    print("="*80)
    print("EXAMPLE 3: Batch Processing Multiple Planets")
    print("="*80)

    # Simulate multiple model outputs
    batch_outputs = [
        ("Planet 1", 15.0),
        ("Planet 2", 65.0),
        ("Planet 3", 95.0),
        ("Planet 4", 25.0),
        ("Planet 5", 88.5),
    ]

    results = []

    print("\n🚀 Processing batch of 5 planets...\n")

    for planet_name, raw_output in batch_outputs:
        print(f"🔮 {planet_name}:")
        print(f"   Raw output: {raw_output}")

        # Normalize
        normalized = raw_output / 100.0
        rounded = round(normalized, 4)

        # Classify
        prediction = "CONFIRMED" if rounded >= 0.5 else "FALSE POSITIVE"

        # Confidence
        if rounded >= 0.9:
            confidence = "high"
        elif rounded >= 0.7:
            confidence = "medium"
        else:
            confidence = "low"

        result = {
            "planet": planet_name,
            "probability": rounded,
            "prediction": prediction,
            "confidence": confidence
        }

        results.append(result)

        print(f"   → {prediction} ({rounded:.4f}, {confidence})")

    print(f"\n✅ Batch processing complete: {len(results)}/{len(batch_outputs)} successful\n")
    return results


# ============================================================================
# EXAMPLE 4: Database Storage Simulation
# ============================================================================

def example_4_database_storage():
    """Simulate database storage operations"""
    print("="*80)
    print("EXAMPLE 4: Database Storage Simulation")
    print("="*80)

    # Simulate model output
    raw_output = 85.0
    normalized = raw_output / 100.0
    rounded = round(normalized, 4)

    print(f"\n🎲 Model output: {raw_output}")
    print(f"🔄 Normalized: {normalized:.4f}")
    print(f"🔢 Rounded: {rounded:.4f}")

    # Simulate database INSERT/UPDATE
    print(f"\n💾 Executing SQL:")
    sql = f"""
    UPDATE planets SET
        ai_probability = {rounded:.4f},     -- Stored as 0-1 (Float)
        prediction_label = 'CONFIRMED',
        confidence = 'medium',
        model_version = 'v1.1'
    WHERE id = 1;
    """
    print(sql)

    # Simulate database query
    print(f"\n📊 Querying database:")
    print(f"SELECT ai_probability FROM planets WHERE id = 1;")
    print(f"Result: ai_probability = {rounded:.4f}")

    # Validate stored value
    if 0.0 <= rounded <= 1.0:
        print(f"\n✅ Stored value {rounded:.4f} is valid (0.0-1.0 range)")
    else:
        print(f"\n❌ ERROR: Stored value {rounded:.4f} is OUT OF RANGE!")

    print()


# ============================================================================
# EXAMPLE 5: Frontend Integration
# ============================================================================

def example_5_frontend_integration():
    """Demonstrate frontend compatibility"""
    print("="*80)
    print("EXAMPLE 5: Frontend Integration")
    print("="*80)

    # Simulate API response
    api_response = {
        "id": 1,
        "rowid": 12345,
        "ra": 45.6,
        "dec": 12.3,
        "ai_probability": 0.85,  # Frontend expects 0-1
        "prediction_label": "CONFIRMED",
        "disposition": "CONFIRMED"
    }

    print(f"\n📤 API Response to Frontend:")
    import json
    print(json.dumps(api_response, indent=2))

    # Simulate frontend color calculation
    probability = api_response["ai_probability"]

    print(f"\n🎨 Frontend Color Calculation:")
    print(f"   Probability: {probability:.4f}")

    # Color gradient (frontend logic)
    if probability < 0.5:
        # 0-0.5: Yellow → Green
        r = int(255 * (1 - probability * 2))
        g = 255
        b = 0
    else:
        # 0.5-1: Green → Red
        r = int(255 * (probability - 0.5) * 2)
        g = int(255 * (1 - (probability - 0.5) * 2))
        b = 0

    color = f"rgb({r}, {g}, {b})"
    print(f"   Color: {color}")

    # Coin collection logic
    if probability >= 0.9:
        print(f"   🪙 Coin collected! (probability >= 0.9)")
    else:
        print(f"   ❌ No coin (probability {probability:.2f} < 0.9)")

    print()


# ============================================================================
# EXAMPLE 6: Logging for Debugging
# ============================================================================

def example_6_logging():
    """Demonstrate comprehensive logging"""
    print("="*80)
    print("EXAMPLE 6: Comprehensive Logging")
    print("="*80)

    import logging
    import sys

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        stream=sys.stdout
    )
    logger = logging.getLogger("ExoplanetModel")

    print("\n📋 Simulating prediction with full logging:\n")

    # Simulate prediction
    planet_id = 123
    raw_output = 85.0

    logger.info(f"🔮 Starting prediction for planet_id={planet_id}")
    logger.info(f"🎲 Raw model output: {raw_output}")

    # Validation
    logger.debug(f"🔍 Validating output...")
    if raw_output > 1.0:
        logger.debug(f"🔄 Detected 0-100 range output: {raw_output}")
        normalized = raw_output / 100.0
        logger.info(f"✅ Normalized {raw_output:.2f} → {normalized:.4f}")
    else:
        normalized = raw_output
        logger.debug(f"✅ Already in 0-1 range: {normalized:.4f}")

    # Rounding
    rounded = round(normalized, 4)
    logger.info(f"🔢 Final probability: {rounded:.4f} ({rounded*100:.2f}%)")

    # Classification
    prediction = "CONFIRMED" if rounded >= 0.5 else "FALSE POSITIVE"
    confidence = "medium"
    logger.info(f"🏷️  Prediction: {prediction}")
    logger.info(f"📈 Confidence: {confidence}")

    # Storage
    logger.info(f"💾 Storing prediction in database...")
    logger.info(f"✅ Prediction stored: ai_probability={rounded:.4f}")

    logger.info(f"✅ Prediction complete for planet_id={planet_id}")

    print()


# ============================================================================
# MAIN: Run All Examples
# ============================================================================

def main():
    """Run all examples"""
    print("\n" + "🚀 AI MODEL INTEGRATION EXAMPLES" + "\n")

    examples = [
        ("Model Prediction Pipeline", example_1_model_prediction),
        ("Error Handling", example_2_error_handling),
        ("Batch Processing", example_3_batch_processing),
        ("Database Storage", example_4_database_storage),
        ("Frontend Integration", example_5_frontend_integration),
        ("Logging for Debugging", example_6_logging),
    ]

    for i, (name, func) in enumerate(examples, 1):
        print(f"\n{'='*80}")
        print(f"RUNNING EXAMPLE {i}: {name}")
        print(f"{'='*80}\n")
        func()

    print("="*80)
    print("🎉 All examples completed successfully!")
    print("="*80)


if __name__ == "__main__":
    main()
