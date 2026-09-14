import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from app.models.database import (
    get_db, User, Field, Scan, WeatherSnapshot, RiskFactor, Recommendation, Feedback
)
from app.schemas.schemas import (
    UserCreate, UserResponse, FieldCreate, FieldResponse,
    ScanResponse, SimulateRiskRequest, SimulateRiskResponse,
    FeedbackCreate, FeedbackResponse, WeatherData, VisualResult,
    RiskInfo, RiskFactorItem, RecommendationItem, OutlookItem
)
from app.services.weather import fetch_weather_data
from app.services.vision import analyze_crop_image, TOMATO_CLASSES
from app.services.risk import (
    calculate_weather_risk, calculate_field_risk, fuse_crop_risk
)
from app.services.recommendations import generate_recommendations
from app.core.config import UPLOAD_DIR, SAMPLE_DIR

router = APIRouter()

# --- Auth Mock / Simple User Management ---
@router.post("/auth/register", response_model=UserResponse)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        return existing
    user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
    new_user = User(
        id=user_id,
        name=user_in.name,
        email=user_in.email,
        role=user_in.role or "farmer"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/auth/login")
def login_user(email: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Create on the fly for effortless hackathon demo
        user = User(
            id=f"USR-{uuid.uuid4().hex[:8].upper()}",
            name=email.split("@")[0].capitalize(),
            email=email,
            role="farmer"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return {"access_token": f"mock-token-{user.id}", "token_type": "bearer", "user": user}

# --- Fields Management ---
@router.post("/fields", response_model=FieldResponse)
def create_field(field_in: FieldCreate, user_id: Optional[str] = None, db: Session = Depends(get_db)):
    # Fallback to default user if none specified
    user = None
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).first()
        if not user:
            user = User(id="USR-DEFAULT", name="Demo Farmer", email="farmer@cropguardian.ai", role="farmer")
            db.add(user)
            db.commit()
            db.refresh(user)
    
    field_id = f"FIELD-{uuid.uuid4().hex[:6].upper()}"
    new_field = Field(
        id=field_id,
        user_id=user.id,
        name=field_in.name,
        latitude=field_in.latitude,
        longitude=field_in.longitude,
        crop=field_in.crop or "tomato",
        crop_stage=field_in.crop_stage or "Flowering",
        soil_type=field_in.soil_type or "Loamy",
        irrigation=field_in.irrigation or "Drip",
        drainage=field_in.drainage or "Moderate"
    )
    db.add(new_field)
    db.commit()
    db.refresh(new_field)
    return new_field

@router.get("/fields", response_model=List[FieldResponse])
def list_fields(db: Session = Depends(get_db)):
    fields = db.query(Field).all()
    results = []
    for f in fields:
        # Find latest scan risk
        latest_scan = db.query(Scan).filter(Scan.field_id == f.id).order_by(Scan.created_at.desc()).first()
        f_resp = FieldResponse.from_orm(f)
        if latest_scan:
            f_resp.latest_risk_score = latest_scan.risk_score
            f_resp.latest_risk_level = latest_scan.risk_level
        results.append(f_resp)
    return results

@router.get("/fields/{field_id}", response_model=FieldResponse)
def get_field(field_id: str, db: Session = Depends(get_db)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    latest_scan = db.query(Scan).filter(Scan.field_id == field.id).order_by(Scan.created_at.desc()).first()
    resp = FieldResponse.from_orm(field)
    if latest_scan:
        resp.latest_risk_score = latest_scan.risk_score
        resp.latest_risk_level = latest_scan.risk_level
    return resp

@router.get("/fields/{field_id}/history")
def get_field_history(field_id: str, db: Session = Depends(get_db)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    scans = db.query(Scan).filter(Scan.field_id == field_id).order_by(Scan.created_at.asc()).all()
    
    history_items = []
    for s in scans:
        history_items.append({
            "id": s.id,
            "date": s.created_at.strftime("%Y-%m-%d %H:%M"),
            "risk_score": s.risk_score,
            "risk_level": s.risk_level,
            "cv_class": s.cv_class,
            "cv_confidence": s.cv_confidence,
            "visual_risk": s.visual_risk,
            "weather_risk": s.weather_risk,
            "field_risk": s.field_risk,
            "image_url": s.image_url
        })
    return {"field_id": field_id, "field_name": field.name, "history": history_items}

# --- Weather Endpoint ---
@router.get("/weather")
async def get_weather(lat: float = Query(36.6777), lon: float = Query(-121.6555)):
    return await fetch_weather_data(lat, lon)

# --- Scans & Analysis Endpoint ---
@router.post("/scans", response_model=ScanResponse)
async def create_scan(
    field_id: str = Form(...),
    file: Optional[UploadFile] = File(None),
    sample_key: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    image_bytes = b""
    filename = "leaf_scan.jpg"
    image_url = "/static/uploads/sample.jpg"

    if file and file.filename:
        filename = file.filename
        image_bytes = await file.read()
        unique_name = f"{uuid.uuid4().hex[:8]}_{filename}"
        save_path = UPLOAD_DIR / unique_name
        with open(save_path, "wb") as f:
            f.write(image_bytes)
        image_url = f"/static/uploads/{unique_name}"
    elif sample_key:
        sample_file = SAMPLE_DIR / f"{sample_key}.jpg"
        if sample_file.exists():
            with open(sample_file, "rb") as f:
                image_bytes = f.read()
            filename = f"{sample_key}.jpg"
            image_url = f"/static/sample/{sample_key}.jpg"
        else:
            filename = f"{sample_key}.jpg"
            image_bytes = b""
    else:
        # Default mild early blight sample
        filename = "early_blight_mild.jpg"
        sample_file = SAMPLE_DIR / filename
        if sample_file.exists():
            with open(sample_file, "rb") as f:
                image_bytes = f.read()
        image_url = f"/static/sample/{filename}"

    # 1. Computer Vision Analysis & Quality Guard
    cv_res = analyze_crop_image(image_bytes, filename=filename)

    # 2. Weather Intelligence (Open-Meteo)
    weather_res = await fetch_weather_data(field.latitude, field.longitude)
    curr_weather = weather_res["current"]
    w_features = weather_res["features"]

    # 3. Weather Risk Calculation
    weather_risk_score, weather_drivers = calculate_weather_risk(
        temperature=curr_weather["temperature"],
        humidity=curr_weather["humidity"],
        precipitation_24h_mm=curr_weather["precipitation"],
        rain_probability=curr_weather["rain_probability"],
        high_hum_hours=w_features.get("high_hum_hours_24h", 8)
    )

    # 4. Field Susceptibility Risk
    field_risk_score, field_drivers = calculate_field_risk(
        crop_stage=field.crop_stage,
        irrigation=field.irrigation,
        drainage=field.drainage,
        soil_type=field.soil_type
    )

    # 5. Multimodal Risk Fusion (0.45*V + 0.35*W + 0.20*F)
    fusion_result = fuse_crop_risk(
        visual_risk=cv_res["visual_risk"],
        weather_risk=weather_risk_score,
        field_risk=field_risk_score,
        visual_drivers=[],
        weather_drivers=weather_drivers,
        field_drivers=field_drivers,
        outlook_weather_days=weather_res.get("outlook_days")
    )

    # 6. Controlled Action Recommendations
    recommendations_list = generate_recommendations(
        risk_level=fusion_result["risk_level"],
        cv_class=cv_res["class"],
        top_drivers=fusion_result["drivers"]
    )

    # 7. Persist Scan to Database
    scan_id = f"SCAN-{uuid.uuid4().hex[:8].upper()}"
    new_scan = Scan(
        id=scan_id,
        field_id=field.id,
        image_url=image_url,
        cv_class=cv_res["class"],
        cv_confidence=cv_res["confidence"],
        visual_risk=cv_res["visual_risk"],
        weather_risk=weather_risk_score,
        field_risk=field_risk_score,
        risk_score=fusion_result["risk_score"],
        risk_level=fusion_result["risk_level"],
        outlook_hours=72,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_scan)

    # Save risk factors
    for rf in fusion_result["risk_factors"]:
        db.add(RiskFactor(
            id=f"RF-{uuid.uuid4().hex[:6]}",
            scan_id=scan_id,
            factor=rf["factor"],
            contribution=rf["contribution"],
            explanation=rf["explanation"]
        ))

    # Save recommendations
    for rec in recommendations_list:
        db.add(Recommendation(
            id=f"REC-{uuid.uuid4().hex[:6]}",
            scan_id=scan_id,
            priority=rec["priority"],
            action=rec["action"],
            rationale=rec["rationale"],
            is_completed=0
        ))

    # Save weather snapshot
    db.add(WeatherSnapshot(
        id=f"WS-{uuid.uuid4().hex[:6]}",
        field_id=field.id,
        timestamp=datetime.datetime.utcnow(),
        temperature=curr_weather["temperature"],
        humidity=curr_weather["humidity"],
        precipitation=curr_weather["precipitation"],
        rain_probability=curr_weather["rain_probability"],
        wind=curr_weather["wind"]
    ))

    db.commit()

    return ScanResponse(
        id=scan_id,
        field_id=field.id,
        crop=field.crop,
        image_url=image_url,
        created_at=new_scan.created_at,
        visual_result=VisualResult(
            **{
                "class": cv_res["class"],
                "confidence": cv_res["confidence"],
                "probabilities": cv_res["probabilities"],
                "quality_status": cv_res["quality_status"],
                "quality_notes": cv_res["quality_notes"]
            }
        ),
        weather=WeatherData(
            temperature=curr_weather["temperature"],
            humidity=curr_weather["humidity"],
            precipitation=curr_weather["precipitation"],
            rain_probability=curr_weather["rain_probability"],
            wind=curr_weather["wind"],
            wetness_proxy=curr_weather["wetness_proxy"],
            forecast_change=curr_weather["forecast_change"]
        ),
        risk=RiskInfo(
            score=fusion_result["risk_score"],
            level=fusion_result["risk_level"],
            outlook_hours=72,
            visual_risk_subscore=cv_res["visual_risk"],
            weather_risk_subscore=weather_risk_score,
            field_risk_subscore=field_risk_score
        ),
        drivers=fusion_result["drivers"],
        risk_factors=[RiskFactorItem(**item) for item in fusion_result["risk_factors"]],
        recommendations=[RecommendationItem(**item) for item in recommendations_list],
        outlook_72h=[OutlookItem(**item) for item in fusion_result["outlook_72h"]]
    )

@router.get("/scans/{scan_id}")
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    r_factors = db.query(RiskFactor).filter(RiskFactor.scan_id == scan_id).all()
    recs = db.query(Recommendation).filter(Recommendation.scan_id == scan_id).all()
    
    return {
        "id": scan.id,
        "field_id": scan.field_id,
        "image_url": scan.image_url,
        "created_at": scan.created_at,
        "cv_class": scan.cv_class,
        "cv_confidence": scan.cv_confidence,
        "risk_score": scan.risk_score,
        "risk_level": scan.risk_level,
        "visual_risk": scan.visual_risk,
        "weather_risk": scan.weather_risk,
        "field_risk": scan.field_risk,
        "drivers": [rf.factor for rf in r_factors],
        "risk_factors": [{"factor": rf.factor, "contribution": rf.contribution, "explanation": rf.explanation} for rf in r_factors],
        "recommendations": [{"priority": r.priority, "action": r.action, "rationale": r.rationale, "is_completed": bool(r.is_completed)} for r in recs]
    }

# --- Section 13: Scenario Simulator ("Killer Demo") ---
@router.post("/risk/simulate", response_model=SimulateRiskResponse)
def simulate_scenario(req: SimulateRiskRequest, db: Session = Depends(get_db)):
    # 1. Base visual subscore
    visual_subscore = req.base_visual_risk or 45.0

    # 2. Dynamic Weather Risk from Sliders
    weather_subscore, weather_drivers = calculate_weather_risk(
        temperature=req.temperature,
        humidity=req.humidity,
        precipitation_24h_mm=req.rain_24h_mm,
        rain_probability=req.rain_probability
    )

    # 3. Dynamic Field Risk
    field_subscore, field_drivers = calculate_field_risk(
        crop_stage=req.crop_stage or "Flowering",
        irrigation="Drip",
        drainage=req.drainage or "Moderate"
    )

    # 4. Create synthetic 72h days reflecting the simulated parameters
    sim_days = [
        {
            "day_label": "Today",
            "hours_from_now": 0,
            "temperature": req.temperature,
            "humidity": req.humidity,
            "rain_mm": req.rain_24h_mm,
            "rain_probability": req.rain_probability,
            "condition_summary": "Simulated base condition"
        },
        {
            "day_label": "+24h",
            "hours_from_now": 24,
            "temperature": req.temperature + 0.5,
            "humidity": min(100.0, req.humidity + 4.0),
            "rain_mm": req.rain_24h_mm * 1.2,
            "rain_probability": min(100.0, req.rain_probability + 5.0),
            "condition_summary": "Spore incubation window"
        },
        {
            "day_label": "+48h",
            "hours_from_now": 48,
            "temperature": req.temperature - 1.0,
            "humidity": min(100.0, req.humidity + 2.0),
            "rain_mm": req.rain_24h_mm * 0.8,
            "rain_probability": req.rain_probability,
            "condition_summary": "Lesion expansion phase"
        },
        {
            "day_label": "+72h",
            "hours_from_now": 72,
            "temperature": req.temperature + 1.5,
            "humidity": max(40.0, req.humidity - 8.0),
            "rain_mm": req.rain_24h_mm * 0.3,
            "rain_probability": max(10.0, req.rain_probability - 20.0),
            "condition_summary": "Canopy drying transition"
        }
    ]

    fusion = fuse_crop_risk(
        visual_risk=visual_subscore,
        weather_risk=weather_subscore,
        field_risk=field_subscore,
        visual_drivers=[],
        weather_drivers=weather_drivers,
        field_drivers=field_drivers,
        outlook_weather_days=sim_days
    )

    summary_text = (
        f"At {req.humidity:.0f}% humidity and {req.rain_24h_mm:.1f}mm rainfall, environmental conditions amplify base "
        f"foliar risk ({visual_subscore:.0f}) into a {fusion['risk_level']} alert ({fusion['risk_score']:.0f}/100) within 72 hours."
    )

    recs = [rec["action"] for rec in generate_recommendations(fusion["risk_level"], req.cv_class or "stress", fusion["drivers"])]

    return SimulateRiskResponse(
        risk_score=fusion["risk_score"],
        risk_level=fusion["risk_level"],
        visual_subscore=visual_subscore,
        weather_subscore=weather_subscore,
        field_subscore=field_subscore,
        drivers=fusion["drivers"],
        recommendations=recs[:4],
        outlook_72h=[OutlookItem(**item) for item in fusion["outlook_72h"]],
        scenario_summary=summary_text
    )

# --- Agronomist Feedback ---
@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(fb_in: FeedbackCreate, db: Session = Depends(get_db)):
    fb_id = f"FB-{uuid.uuid4().hex[:6]}"
    new_fb = Feedback(
        id=fb_id,
        scan_id=fb_in.scan_id,
        user_label=fb_in.user_label,
        expert_label=fb_in.expert_label,
        notes=fb_in.notes,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_fb)
    db.commit()
    db.refresh(new_fb)
    return new_fb

# --- Pre-loaded Demo Samples List ---
@router.get("/demo/samples")
def get_demo_samples():
    return [
        {
            "id": "early_blight_mild",
            "title": "Mild Early Blight (Killer Demo)",
            "badge": "Subtle Lesions",
            "expected_visual": "Low / Moderate visual damage",
            "threat": "High forward risk when combined with rain/humidity",
            "image_url": "/static/sample/early_blight_mild.jpg"
        },
        {
            "id": "healthy_leaf",
            "title": "Vibrant Healthy Tomato",
            "badge": "Healthy Baseline",
            "expected_visual": "Negative disease signature",
            "threat": "Low baseline risk across all weather windows",
            "image_url": "/static/sample/healthy_leaf.jpg"
        },
        {
            "id": "late_blight_severe",
            "title": "Late Blight Systemic",
            "badge": "Severe Outbreak",
            "expected_visual": "Water-soaked necrotized canopy",
            "threat": "Immediate danger of total row collapse",
            "image_url": "/static/sample/late_blight_severe.jpg"
        },
        {
            "id": "septoria_leaf_spot",
            "title": "Septoria Leaf Spot",
            "badge": "Target Halo Spots",
            "expected_visual": "Numerous circular punctate lesions",
            "threat": "Moderate-to-high risk in warm damp microclimates",
            "image_url": "/static/sample/septoria_leaf_spot.jpg"
        }
    ]
