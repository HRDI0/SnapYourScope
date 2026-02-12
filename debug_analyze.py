import requests
import sys
import os
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding="utf-8")

# Load Env
load_dotenv()

BASE_URL = "http://127.0.0.1:8000"


def debug_analysis():
    # 1. Login to get token
    print("🔑 Logging in...")
    try:
        resp = requests.post(
            f"{BASE_URL}/api/token",
            data={"username": "test@example.com", "password": "securepassword"},
        )
        if resp.status_code != 200:
            print(f"❌ Login Failed: {resp.text}")
            return

        token = resp.json()["access_token"]
        print(f"✅ Login Success. Token: {token[:10]}...")

        # 2. Request Analysis
        print("⏳ Requesting Analysis (this might take time)...")
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "url": "https://example.com",
            "include_aeo": True,
            "include_pagespeed": True,
        }

        resp = requests.post(f"{BASE_URL}/api/analyze", json=payload, headers=headers)

        print(f"📥 Response Status: {resp.status_code}")
        print(f"📄 Response Content (Full):\n{resp.text}")

    except Exception as e:
        print(f"❌ Connection Error: {e}")


if __name__ == "__main__":
    debug_analysis()
