import requests
import time

BASE_URL = "http://127.0.0.1:8000"
EMAIL = "verify_test@example.com"
PASSWORD = "password123"

def log(msg):
    print(f"[TEST] {msg}")

def test_registration_and_login():
    # 1. Register
    log("Testing Registration...")
    try:
        reg_res = requests.post(f"{BASE_URL}/api/register", json={"email": EMAIL, "password": PASSWORD})
        if reg_res.status_code == 200:
            log("Registration Success")
        elif reg_res.status_code == 400 and "already registered" in reg_res.text:
            log("User already registered (Expected if run twice)")
        else:
            log(f"Registration Failed: {reg_res.text}")
            return None
            
        # 2. Login
        log("Testing Login...")
        login_res = requests.post(f"{BASE_URL}/api/token", data={"username": EMAIL, "password": PASSWORD})
        if login_res.status_code == 200:
            token = login_res.json()["access_token"]
            log("Login Success, Token received")
            return token
        else:
            log(f"Login Failed: {login_res.text}")
            return None
    except Exception as e:
        log(f"Auth Test Error: {e}")
        return None

def test_endpoints(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Site Audit
    log("Testing Site Audit...")
    try:
        audit_res = requests.post(f"{BASE_URL}/api/site-audit", json={"url": "https://example.com"}, headers=headers)
        if audit_res.status_code == 200:
            log("Site Audit Success")
        else:
            log(f"Site Audit Failed: {audit_res.text}")
    except Exception as e:
        log(f"Site Audit Error: {e}")

    # 4. GEO Analysis
    log("Testing GEO Analysis...")
    try:
        geo_res = requests.post(f"{BASE_URL}/api/geo-analysis", json={"url": "https://example.com"}, headers=headers)
        if geo_res.status_code == 200:
            log("GEO Analysis Success")
        else:
            log(f"GEO Analysis Failed: {geo_res.text}")
    except Exception as e:
        log(f"GEO Analysis Error: {e}")

    # 5. History
    log("Testing History...")
    try:
        hist_res = requests.get(f"{BASE_URL}/api/history", headers=headers)
        if hist_res.status_code == 200:
            log(f"History Success. Count: {len(hist_res.json())}")
        else:
            log(f"History Failed: {hist_res.text}")
    except Exception as e:
        log(f"History Error: {e}")

if __name__ == "__main__":
    token = test_registration_and_login()
    if token:
        test_endpoints(token)
