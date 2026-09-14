import os
import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import UPLOAD_DIR, SAMPLE_DIR
from app.models.database import init_db, SessionLocal, User, Field, Scan, RiskFactor, Recommendation
from app.api.endpoints import router as api_router

app = FastAPI(
    title="CropGuardian AI Engine",
    description="Multimodal Crop Risk Early-Warning & Decision-Support System",
    version="1.0.0"
)

# Enable CORS for local Vite and production clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static asset directories
app.mount("/static/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/static/sample", StaticFiles(directory=str(SAMPLE_DIR)), name="sample")

@app.on_event("startup")
def startup_populate_data():
    """
    Initializes database tables and seeds demo field + historical scans
    so judges experience an active, populated platform within 5 seconds.
    """
    init_db()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == "USR-DEMO-01").first()
        if not user:
            user = User(
                id="USR-DEMO-01",
                name="Elena Vance",
                email="elena.vance@agrovalley.org",
                role="farmer",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=30)
            )
            db.add(user)
            db.commit()

        field_a = db.query(Field).filter(Field.id == "FIELD-001").first()
        if not field_a:
            field_a = Field(
                id="FIELD-001",
                user_id=user.id,
                name="Tomato Field A - Valley Plot",
                latitude=36.6777,
                longitude=-121.6555,
                crop="tomato",
                crop_stage="Flowering",
                soil_type="Loamy",
                irrigation="Drip",
                drainage="Moderate",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=20)
            )
            db.add(field_a)
            db.commit()

        field_b = db.query(Field).filter(Field.id == "FIELD-002").first()
        if not field_b:
            field_b = Field(
                id="FIELD-002",
                user_id=user.id,
                name="Tomato Field B - River Basin",
                latitude=36.7120,
                longitude=-121.6240,
                crop="tomato",
                crop_stage="Fruiting",
                soil_type="Clay Loam",
                irrigation="Furrow",
                drainage="Poor",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=15)
            )
            db.add(field_b)
            db.commit()

        # Seed historical scans for Field A to create a realistic trend progression
        scan_count = db.query(Scan).filter(Scan.field_id == field_a.id).count()
        if scan_count == 0:
            history_data = [
                {
                    "days_ago": 6,
                    "cv_class": "Tomato___healthy",
                    "conf": 0.94,
                    "v_risk": 8.0,
                    "w_risk": 22.0,
                    "f_risk": 25.0,
                    "score": 16.0,
                    "level": "LOW",
                    "img": "/static/sample/healthy_leaf.jpg"
                },
                {
                    "days_ago": 4,
                    "cv_class": "Tomato___healthy",
                    "conf": 0.88,
                    "v_risk": 15.0,
                    "w_risk": 38.0,
                    "f_risk": 25.0,
                    "score": 25.0,
                    "level": "LOW",
                    "img": "/static/sample/healthy_leaf.jpg"
                },
                {
                    "days_ago": 2,
                    "cv_class": "Tomato___Early_blight",
                    "conf": 0.76,
                    "v_risk": 48.0,
                    "w_risk": 65.0,
                    "f_risk": 36.0,
                    "score": 51.5,
                    "level": "MODERATE",
                    "img": "/static/sample/early_blight_mild.jpg"
                },
                {
                    "days_ago": 0,
                    "cv_class": "Tomato___Early_blight",
                    "conf": 0.86,
                    "v_risk": 58.0,
                    "w_risk": 82.0,
                    "f_risk": 36.0,
                    "score": 72.0,
                    "level": "HIGH",
                    "img": "/static/sample/early_blight_mild.jpg"
                }
            ]

            for idx, h in enumerate(history_data):
                sc_id = f"SCAN-HIST-0{idx+1}"
                sc = Scan(
                    id=sc_id,
                    field_id=field_a.id,
                    image_url=h["img"],
                    cv_class=h["cv_class"],
                    cv_confidence=h["conf"],
                    visual_risk=h["v_risk"],
                    weather_risk=h["w_risk"],
                    field_risk=h["f_risk"],
                    risk_score=h["score"],
                    risk_level=h["level"],
                    outlook_hours=72,
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(days=h["days_ago"])
                )
                db.add(sc)
                db.add(RiskFactor(
                    id=f"RF-H-{idx+1}-1",
                    scan_id=sc_id,
                    factor="Relative Humidity (84%)",
                    contribution=38.0,
                    explanation="Elevated microclimate humidity sustains fungal spore germination."
                ))
                db.add(RiskFactor(
                    id=f"RF-H-{idx+1}-2",
                    scan_id=sc_id,
                    factor="Rainfall Inoculum Splash",
                    contribution=28.0,
                    explanation="12.4mm rain forecasted over next 24h triggers spore dispersal."
                ))
                db.add(Recommendation(
                    id=f"REC-H-{idx+1}-1",
                    scan_id=sc_id,
                    priority="HIGH" if h["level"] == "HIGH" else "MEDIUM",
                    action="Inspect lower foliage and verify furrow drainage",
                    rationale="Check for early concentric target lesions along lower shaded canopy.",
                    is_completed=0
                ))
            db.commit()
    finally:
        db.close()

# Register routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def health_check():
    return {
        "app": "CropGuardian AI Platform",
        "status": "online",
        "crop_focus": "Tomato (Solanum lycopersicum)",
        "docs": "/docs"
    }
