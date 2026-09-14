# CropGuardian 🛡️🍅
### AI-Powered Crop Risk Early-Warning and Decision-Support Platform

CropGuardian moves crop health management from reactive diagnosis to proactive risk management. Instead of only answering *"What disease is this?"*, the platform combines computer vision leaf evidence, real-time & forecasted Open-Meteo weather features, and field agronomy to predict disease risk before visible damage becomes severe.

---

## 🌟 Key Features

1. **Multimodal Risk Fusion Engine**:
   $$\text{Risk} = \text{clamp}(0.45 \times \text{visual\_risk} + 0.35 \times \text{weather\_risk} + 0.20 \times \text{field\_risk},\, 0,\, 100)$$
   - Categorizes risk into `LOW` (0-39), `MODERATE` (40-69), and `HIGH` (70-100).
   - Isolates the top 3 contributing risk drivers (e.g. sustained high humidity, rainfall inoculum splash).

2. **72-Hour Prediction & Scenario Simulator ("The Killer Demo")**:
   - Interactive sliders for humidity (30-100%), rainfall (0-50mm), temperature, and crop stage.
   - Shows how visually mild symptoms escalate into high risk under adverse environmental conditions.

3. **Computer Vision & Image Quality Guard**:
   - Classifies tomato leaf conditions (Healthy, Early Blight, Late Blight, Septoria, Yellow Leaf Curl).
   - Validates resolution, checks for blur and severe underexposure/overexposure before inference.

4. **Safe Agronomic Recommendations**:
   - Controlled, expert-reviewed action checklists (aeration, furrow drainage, pruning, extension officer verification).

---

## 🏗️ Project Architecture

```
CropGuardian/
├── frontend/             # React + Vite + Tailwind CSS + Recharts + Lucide
│   ├── src/
│   │   ├── components/   # RiskGauge, OutlookTimeline, ScenarioSimulator, etc.
│   │   ├── services/     # API client
│   │   └── App.tsx       # Master layout
│   └── package.json
├── backend/              # FastAPI + SQLAlchemy + SQLite + Open-Meteo
│   ├── app/
│   │   ├── api/          # REST endpoints (/fields, /scans, /risk/simulate)
│   │   ├── services/     # weather.py, vision.py, risk.py, recommendations.py
│   │   ├── models/       # database.py
│   │   └── main.py
│   └── requirements.txt
└── data/
    └── sample/           # Pre-packaged diagnostic tomato leaf samples
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup (FastAPI)
```bash
cd backend
# Create virtual environment and install dependencies
uv venv .venv --python 3.11
.venv\Scripts\activate
uv pip install -r requirements.txt

# Start backend server (port 8000)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
Open in browser: [http://127.0.0.1:5173](http://127.0.0.1:5173)

### 3. Automated System Verification
```bash
backend\.venv\Scripts\python.exe backend\verify_system.py
```
