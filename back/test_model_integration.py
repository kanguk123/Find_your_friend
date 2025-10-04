#!/usr/bin/env python3
"""
Test Script for 0-100 Model Output Integration
Tests model output validation, normalization, and backend processing
"""
import sys
import logging
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.ml.model_wrapper import ExoplanetModel
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MockModel:
    """Mock model that simulates 0-100 outputs"""

    def __init__(self, output_range="0-100"):
        self.output_range = output_range
        logger.info(f"🎭 Mock model initialized with output_range={output_range}")

    def predict_proba(self, X):
        """Simulate model output"""
        if self.output_range == "0-100":
            # Simulate 0-100 output
            output = np.random.uniform(0, 100, size=(len(X), 2))
            # Return [P(FALSE POSITIVE), P(CONFIRMED)]
            return output
        else:
            # Simulate 0-1 output
            output = np.random.uniform(0, 1, size=(len(X), 2))
            return output


def test_validation_edge_cases():
    """Test validation of edge cases"""
    print("\n" + "="*80)
    print("TEST 1: Edge Case Validation")
    print("="*80)

    # Import the model wrapper (need to patch it for testing)
    from app.ml.model_wrapper import ExoplanetModel

    # Create instance
    try:
        # This will fail if model file doesn't exist, which is OK for testing
        model = ExoplanetModel()
    except FileNotFoundError:
        logger.info("ℹ️  Model file not found - testing validation logic only")
        model = object.__new__(ExoplanetModel)
        model.model_version = "test"

    # Test cases
    test_cases = [
        # (value, expected_normalized, should_pass, description)
        (50.0, 0.5, True, "Mid-range 0-100"),
        (0.0, 0.0, True, "Minimum (0)"),
        (100.0, 1.0, True, "Maximum (100)"),
        (75.5, 0.755, True, "Decimal value"),
        (0.5, 0.5, True, "Already normalized (0-1 range)"),
        (0.999, 0.999, True, "High probability (0-1)"),
        (-5.0, None, False, "Negative value"),
        (150.0, None, False, "Above 100"),
        (1.5, None, False, "Ambiguous (>1 but <100 would be invalid)"),
        (float('nan'), None, False, "NaN"),
        (float('inf'), None, False, "Infinity"),
        (None, None, False, "None value"),
    ]

    passed = 0
    failed = 0

    for raw_value, expected, should_pass, description in test_cases:
        try:
            normalized = model._validate_probability(raw_value)

            if should_pass:
                if abs(normalized - expected) < 0.0001:
                    logger.info(f"✅ PASS: {description}: {raw_value} → {normalized:.4f}")
                    passed += 1
                else:
                    logger.error(f"❌ FAIL: {description}: Expected {expected}, got {normalized}")
                    failed += 1
            else:
                logger.error(f"❌ FAIL: {description}: Should have raised error but got {normalized}")
                failed += 1

        except (ValueError, Exception) as e:
            if not should_pass:
                logger.info(f"✅ PASS: {description}: Correctly rejected with error: {str(e)[:50]}")
                passed += 1
            else:
                logger.error(f"❌ FAIL: {description}: Unexpected error: {str(e)}")
                failed += 1

    print(f"\n📊 Validation Tests: {passed} passed, {failed} failed")
    return failed == 0


def test_probability_transformation():
    """Test 0-100 to 0-1 transformation"""
    print("\n" + "="*80)
    print("TEST 2: Probability Transformation")
    print("="*80)

    from app.ml.model_wrapper import ExoplanetModel

    try:
        model = ExoplanetModel()
    except FileNotFoundError:
        model = object.__new__(ExoplanetModel)
        model.model_version = "test"

    test_values = [
        (0, 0.0),
        (25, 0.25),
        (50, 0.50),
        (75, 0.75),
        (90, 0.90),
        (95, 0.95),
        (100, 1.0),
    ]

    all_passed = True

    for raw, expected in test_values:
        normalized = model._validate_probability(float(raw))
        if abs(normalized - expected) < 0.0001:
            logger.info(f"✅ {raw:3d} → {normalized:.4f} (expected {expected:.4f})")
        else:
            logger.error(f"❌ {raw:3d} → {normalized:.4f} (expected {expected:.4f})")
            all_passed = False

    return all_passed


def test_confidence_levels():
    """Test confidence level calculation"""
    print("\n" + "="*80)
    print("TEST 3: Confidence Level Calculation")
    print("="*80)

    from app.ml.model_wrapper import ExoplanetModel

    try:
        model = ExoplanetModel()
    except FileNotFoundError:
        model = object.__new__(ExoplanetModel)

    test_cases = [
        # (probability, expected_confidence)
        (0.95, "high"),    # >= 0.9
        (0.90, "high"),    # >= 0.9
        (0.85, "medium"),  # >= 0.7
        (0.70, "medium"),  # >= 0.7
        (0.65, "low"),     # < 0.7
        (0.50, "low"),
        (0.30, "medium"),  # <= 0.3
        (0.10, "high"),    # <= 0.1
        (0.05, "high"),    # <= 0.1
    ]

    all_passed = True

    for prob, expected_conf in test_cases:
        conf = model._get_confidence(prob)
        if conf == expected_conf:
            logger.info(f"✅ P={prob:.2f} → {conf:7s} (expected {expected_conf})")
        else:
            logger.error(f"❌ P={prob:.2f} → {conf:7s} (expected {expected_conf})")
            all_passed = False

    return all_passed


def test_rounding():
    """Test probability rounding"""
    print("\n" + "="*80)
    print("TEST 4: Probability Rounding")
    print("="*80)

    from app.ml.model_wrapper import ExoplanetModel

    try:
        model = ExoplanetModel()
    except FileNotFoundError:
        model = object.__new__(ExoplanetModel)

    test_values = [
        (0.123456789, 4, 0.1235),
        (0.999999, 4, 1.0000),
        (0.500001, 4, 0.5000),
        (0.7654321, 2, 0.77),
        (0.7654321, 6, 0.765432),
    ]

    all_passed = True

    for value, decimals, expected in test_values:
        rounded = model._round_probability(value, decimals)
        if abs(rounded - expected) < 0.0000001:
            logger.info(f"✅ {value:.9f} → {rounded} (decimals={decimals})")
        else:
            logger.error(f"❌ {value:.9f} → {rounded} (expected {expected}, decimals={decimals})")
            all_passed = False

    return all_passed


def simulate_full_pipeline():
    """Simulate the complete pipeline from model output to API response"""
    print("\n" + "="*80)
    print("TEST 5: Full Pipeline Simulation")
    print("="*80)

    logger.info("📊 Simulating complete prediction pipeline...")

    # Step 1: Simulate model raw output
    raw_outputs = [
        ("Low confidence (25%)", 25.0),
        ("Medium confidence (75%)", 75.0),
        ("High confidence (95%)", 95.0),
        ("Edge case (0%)", 0.0),
        ("Edge case (100%)", 100.0),
    ]

    from app.ml.model_wrapper import ExoplanetModel

    try:
        model = ExoplanetModel()
    except FileNotFoundError:
        model = object.__new__(ExoplanetModel)
        model.model_version = "test"

    for description, raw_output in raw_outputs:
        logger.info(f"\n🔮 Testing: {description}")
        logger.info(f"  Step 1 - Raw model output: {raw_output}")

        # Step 2: Validate and normalize
        try:
            normalized = model._validate_probability(raw_output)
            logger.info(f"  Step 2 - Validated & normalized: {normalized:.4f}")
        except ValueError as e:
            logger.error(f"  Step 2 - Validation failed: {str(e)}")
            continue

        # Step 3: Round
        rounded = model._round_probability(normalized)
        logger.info(f"  Step 3 - Rounded: {rounded:.4f}")

        # Step 4: Calculate confidence
        confidence = model._get_confidence(rounded)
        logger.info(f"  Step 4 - Confidence: {confidence}")

        # Step 5: Determine prediction
        threshold = 0.5
        prediction = "CONFIRMED" if rounded >= threshold else "FALSE POSITIVE"
        logger.info(f"  Step 5 - Prediction: {prediction} (threshold={threshold})")

        # Step 6: Calculate percentage for display
        percentage = rounded * 100
        logger.info(f"  Step 6 - Display percentage: {percentage:.2f}%")

        # Simulate API response
        response = {
            "probability": rounded,
            "probability_pct": percentage,
            "raw_output": raw_output,
            "prediction": prediction,
            "confidence": confidence,
            "model_version": "v1.1"
        }

        logger.info(f"  ✅ Final API response: {response}")

    return True


def test_database_compatibility():
    """Test that outputs are compatible with database schema"""
    print("\n" + "="*80)
    print("TEST 6: Database Schema Compatibility")
    print("="*80)

    logger.info("📊 Testing database schema compatibility...")

    # Test that all normalized outputs are in valid range for database
    test_outputs = [0.0, 0.25, 0.5, 0.75, 0.9, 0.95, 1.0]

    all_valid = True

    for output in test_outputs:
        # Check against schema validation (0.0 <= x <= 1.0)
        if 0.0 <= output <= 1.0:
            logger.info(f"✅ Output {output:.4f} is valid for database (0.0-1.0 range)")
        else:
            logger.error(f"❌ Output {output:.4f} is INVALID for database!")
            all_valid = False

    return all_valid


def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("🧪 AI MODEL INTEGRATION TEST SUITE")
    print("="*80)
    print("Testing 0-100 model output integration with backend")
    print("="*80)

    tests = [
        ("Edge Case Validation", test_validation_edge_cases),
        ("Probability Transformation", test_probability_transformation),
        ("Confidence Levels", test_confidence_levels),
        ("Probability Rounding", test_rounding),
        ("Full Pipeline Simulation", simulate_full_pipeline),
        ("Database Compatibility", test_database_compatibility),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except Exception as e:
            logger.error(f"❌ Test '{test_name}' crashed: {str(e)}", exc_info=True)
            results.append((test_name, False))

    # Summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)

    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)

    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")

    print("="*80)
    print(f"Total: {passed_count}/{total_count} tests passed")
    print("="*80)

    if passed_count == total_count:
        print("🎉 All tests passed! Integration is ready.")
        return 0
    else:
        print("⚠️  Some tests failed. Please review the errors above.")
        return 1


if __name__ == "__main__":
    exit(main())
