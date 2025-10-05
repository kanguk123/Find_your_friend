"""
Test script for Planet Identify endpoint
Demonstrates CSV upload, AI prediction, and download
"""
import requests
import os

# Configuration
API_URL = "http://localhost:8000"
ENDPOINT = f"{API_URL}/upload/identify-planets"
TEST_CSV = "test_planet_data.csv"
OUTPUT_CSV = "planet_predictions_output.csv"

def test_planet_identify():
    """
    Test the Planet Identify endpoint

    Steps:
    1. Upload test CSV file
    2. Receive modified CSV with AI predictions
    3. Save to output file
    4. Display results
    """

    print("=" * 60)
    print("🚀 PLANET IDENTIFY ENDPOINT TEST")
    print("=" * 60)

    # Check if test file exists
    if not os.path.exists(TEST_CSV):
        print(f"❌ Error: Test file '{TEST_CSV}' not found!")
        return

    print(f"\n📁 Uploading CSV: {TEST_CSV}")

    # Upload CSV file
    try:
        with open(TEST_CSV, 'rb') as f:
            files = {'file': (TEST_CSV, f, 'text/csv')}

            print(f"📤 Sending request to: {ENDPOINT}")
            response = requests.post(ENDPOINT, files=files)

        # Check response
        if response.status_code == 200:
            print(f"\n✅ SUCCESS! Status Code: {response.status_code}")

            # Save modified CSV
            with open(OUTPUT_CSV, 'wb') as f:
                f.write(response.content)

            print(f"💾 Modified CSV saved to: {OUTPUT_CSV}")

            # Display sample of results
            print("\n" + "=" * 60)
            print("📊 PREDICTION RESULTS")
            print("=" * 60)

            # Read and display the output
            with open(OUTPUT_CSV, 'r') as f:
                lines = f.readlines()

                # Show header
                print("\n🔹 CSV Headers:")
                headers = lines[0].strip().split(',')

                # Find prediction columns
                prediction_cols = ['ai_prediction', 'ai_probability', 'ai_confidence']
                for col in prediction_cols:
                    if col in headers:
                        idx = headers.index(col)
                        print(f"   Column {idx}: {col}")

                # Show first data row
                if len(lines) > 1:
                    print("\n🔹 First Row Predictions:")
                    data = lines[1].strip().split(',')

                    for col in prediction_cols:
                        if col in headers:
                            idx = headers.index(col)
                            print(f"   {col}: {data[idx]}")

            print("\n" + "=" * 60)
            print("✨ Test completed successfully!")
            print("=" * 60)

        else:
            print(f"\n❌ ERROR! Status Code: {response.status_code}")
            print(f"Response: {response.text}")

    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error!")
        print("Make sure the FastAPI server is running:")
        print("   cd back && python run.py")

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")


if __name__ == "__main__":
    test_planet_identify()
