import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field as PydanticField

class UserCreate(BaseModel):
    name: str
    email: str
    role: Optional[str] = "farmer"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime.datetime
    class Config:
        from_attributes = True

class FieldCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    crop: Optional[str] = "tomato"
    crop_stage: Optional[str] = "Flowering"
    soil_type: Optional[str] = "Loamy"
    irrigation: Optional[str] = "Drip"
    drainage: Optional[str] = "Moderate"

class FieldResponse(BaseModel):
    id: str
    user_id: str
    name: str
    latitude: float
    longitude: float
    crop: str
    crop_stage: str
    soil_type: str
    irrigation: str
    drainage: str
    created_at: datetime.datetime
    latest_risk_score: Optional[float] = None
    latest_risk_level: Optional[str] = None
    class Config:
        from_attributes = True

class WeatherData(BaseModel):
    temperature: float
    humidity: float
    precipitation: float
    rain_probability: float
    wind: float
    wetness_proxy: float
    forecast_change: Optional[str] = "Stable conditions"

class VisualResult(BaseModel):
    cv_class: str = PydanticField(alias="class")
    confidence: float
    probabilities: Dict[str, float]
    quality_status: str # "pass", "warning", "fail"
    quality_notes: List[str]

class RiskInfo(BaseModel):
    score: float # 0 - 100
    level: str # LOW, MODERATE, HIGH
    outlook_hours: int = 72
    visual_risk_subscore: float
    weather_risk_subscore: float
    field_risk_subscore: float

class RiskFactorItem(BaseModel):
    factor: str
    contribution: float
    explanation: str

class RecommendationItem(BaseModel):
    priority: str
    action: str
    rationale: str
    is_completed: bool = False

class OutlookItem(BaseModel):
    day_label: str # "Today", "+24h", "+48h", "+72h"
    hours_from_now: int
    risk_score: float
    risk_level: str
    temperature: float
    humidity: float
    rain_mm: float
    rain_probability: float
    condition_summary: str

class ScanResponse(BaseModel):
    id: str
    field_id: str
    crop: str
    image_url: str
    created_at: datetime.datetime
    visual_result: VisualResult
    weather: WeatherData
    risk: RiskInfo
    drivers: List[str]
    risk_factors: List[RiskFactorItem]
    recommendations: List[RecommendationItem]
    outlook_72h: List[OutlookItem]
    expert_disclaimer: str = (
        "Decision-support prototype. Predictions combine AI leaf evidence with environmental pressure. "
        "Validate with a certified agronomist before applying chemical treatments."
    )

class SimulateRiskRequest(BaseModel):
    field_id: Optional[str] = None
    base_visual_risk: Optional[float] = 45.0 # 0 - 100
    cv_class: Optional[str] = "possible_early_stress"
    crop_stage: Optional[str] = "Flowering"
    drainage: Optional[str] = "Moderate"
    temperature: float = 26.0
    humidity: float = 85.0
    rain_24h_mm: float = 12.0
    rain_probability: float = 80.0
    wind_speed: float = 8.5

class SimulateRiskResponse(BaseModel):
    risk_score: float
    risk_level: str
    visual_subscore: float
    weather_subscore: float
    field_subscore: float
    drivers: List[str]
    recommendations: List[str]
    outlook_72h: List[OutlookItem]
    scenario_summary: str

class FeedbackCreate(BaseModel):
    scan_id: str
    user_label: Optional[str] = None
    expert_label: Optional[str] = None
    notes: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: str
    scan_id: str
    user_label: Optional[str] = None
    expert_label: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime.datetime
    class Config:
        from_attributes = True
