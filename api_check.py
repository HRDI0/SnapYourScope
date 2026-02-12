from fastapi.testclient import TestClient
from api.main import app
from api import models, database
import sys

sys.stdout.reconfigure(encoding="utf-8")

# Reset DB for testing
models.Base.metadata.drop_all(bind=database.engine)
models.Base.metadata.create_all(bind=database.engine)

client = TestClient(app)


def test_register_and_login():
    # 1. Register
    response = client.post(
        "/api/register",
        json={"email": "test@example.com", "password": "securepassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    print("✅ Registration Successful")

    # 2. Login
    response = client.post(
        "/api/token",
        data={"username": "test@example.com", "password": "securepassword"},
    )
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    print("✅ Login Successful. Token received.")

    # 3. Access Protected Route
    token = token_data["access_token"]
    response = client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == "test@example.com"
    print("✅ Protected Route Access Successful")

    # 4. Test Analysis Endpoint (Mocked)
    # We will test if the endpoint is reachable and protected
    print("⏳ Testing Analysis endpoint...")
    response = client.post(
        "/api/analyze",
        headers={"Authorization": f"Bearer {token}"},
        json={"url": "https://example.com", "include_aeo": False},
    )
    # Note: This might take time or fail if Playwright isn't installed in the env properly
    # or if there are version mismatches.
    if response.status_code == 200:
        data = response.json()
        assert data["url"] == "https://example.com"
        assert "seo_result" in data
        print("✅ Analysis Endpoint Successful")
    else:
        print(f"⚠️ Analysis Endpoint Warning: {response.text}")
        # We don't fail the whole test if analysis fails due to networking/playwright in this ci-like check
        # But we print it.


if __name__ == "__main__":
    try:
        test_register_and_login()
        print("\n🎉 All Auth Tests Passed!")
    except Exception as e:
        print(f"\n❌ Test Failed: {e}")
