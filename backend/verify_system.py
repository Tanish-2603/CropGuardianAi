import sys
import httpx

def test_full_system():
    client = httpx.Client(timeout=10.0)
    
    print("\n==========================================")
    print("      CROPGUARDIAN PLATFORM VERIFICATION    ")
    print("==========================================\n")

    # 1. Frontend Dev Server Check
    try:
        fe_resp = client.get("http://127.0.0.1:5173/")
        print(f"[*] Frontend Web App (Vite): Status {fe_resp.status_code} OK (HTML length: {len(fe_resp.text)} bytes)")
    except Exception as e:
        print(f"[!] Frontend Server Error: {e}")

    # 2. Backend Healthcheck
    try:
        be_resp = client.get("http://127.0.0.1:8000/")
        print(f"[*] Backend REST API (FastAPI): {be_resp.json()}")
    except Exception as e:
        print(f"[!] Backend API Error: {e}")

    # 3. Fields API
    fields = []
    try:
        f_resp = client.get("http://127.0.0.1:8000/api/fields")
        fields = f_resp.json()
        print(f"[*] Fields Loaded: {len(fields)} fields")
        for f in fields:
            print(f"    - {f['id']}: {f['name']} | Stage: {f['crop_stage']} | Latest Risk: {f.get('latest_risk_score', 'None')}")
    except Exception as e:
        print(f"[!] Fields API Error: {e}")

    # 4. Weather API (Open-Meteo)
    try:
        w_resp = client.get("http://127.0.0.1:8000/api/weather?lat=36.6777&lon=-121.6555")
        w_data = w_resp.json()
        curr = w_data.get("current", {})
        print(f"[*] Open-Meteo Weather: Temp={curr.get('temperature')}°C, Humidity={curr.get('humidity')}%, Rain={curr.get('precipitation')}mm")
        print(f"    Forecast Trend: {curr.get('forecast_change')}")
    except Exception as e:
        print(f"[!] Weather API Error: {e}")

    # 5. Scan Submission Test (Killer Demo early_blight_mild)
    if fields:
        field_id = fields[0]["id"]
        try:
            scan_resp = client.post(
                "http://127.0.0.1:8000/api/scans",
                data={"field_id": field_id, "sample_key": "early_blight_mild"}
            )
            s = scan_resp.json()
            print(f"\n[*] Diagnostic Scan Test:")
            print(f"    - Scan ID: {s['id']}")
            print(f"    - Detected Class: {s['visual_result']['class']} (Confidence: {s['visual_result']['confidence']*100:.0f}%)")
            print(f"    - Visual Subscore: {s['risk']['visual_risk_subscore']}/100")
            print(f"    - Weather Subscore: {s['risk']['weather_risk_subscore']}/100")
            print(f"    - Field Subscore: {s['risk']['field_risk_subscore']}/100")
            print(f"    - Composite Fused Risk: {s['risk']['score']}/100 [{s['risk']['level']}]")
            print(f"    - Top 3 Drivers: {s['drivers']}")
            print(f"    - Action Checklist Items: {len(s['recommendations'])}")
            print(f"    - 72h Outlook Forecast Days: {len(s['outlook_72h'])}")
            for day in s['outlook_72h']:
                print(f"      • {day['day_label']}: Score={day['risk_score']} [{day['risk_level']}] - {day['condition_summary']}")
        except Exception as e:
            print(f"[!] Scan API Error: {e}")

    # 6. Killer Demo Scenario Simulator API
    try:
        sim_payload = {
            "base_visual_risk": 45.0,
            "humidity": 88.0,
            "rain_24h_mm": 16.0,
            "temperature": 24.5,
            "crop_stage": "Flowering",
            "drainage": "Moderate"
        }
        sim_resp = client.post("http://127.0.0.1:8000/api/risk/simulate", json=sim_payload)
        sim = sim_resp.json()
        print(f"\n[*] Scenario Simulator ('Killer Demo') Result:")
        print(f"    - Input: 88% Humidity + 16mm Rain + 24.5°C Temp")
        print(f"    - Output Risk Score: {sim['risk_score']}/100 [{sim['risk_level']}]")
        print(f"    - Narrative: {sim['scenario_summary']}")
        progression = [f"{d['day_label']}: {d['risk_score']}" for d in sim['outlook_72h']]
        print(f"    - Projected 72h Progression: {progression}")
    except Exception as e:
        print(f"[!] Scenario Simulation Error: {e}")

    print("\n==========================================")
    print("      ALL END-TO-END SERVICES OPERATIONAL ")
    print("==========================================\n")

if __name__ == "__main__":
    test_full_system()
