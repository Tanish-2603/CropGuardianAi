import datetime
from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from app.core.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="farmer") # farmer, agronomist, judge
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    fields = relationship("Field", back_populates="owner")

class Field(Base):
    __tablename__ = "fields"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    crop = Column(String, default="tomato")
    crop_stage = Column(String, default="Flowering") # Seedling, Vegetative, Flowering, Fruiting, Harvest
    soil_type = Column(String, default="Loamy") # Sandy, Loamy, Clay, Silt
    irrigation = Column(String, default="Drip") # Drip, Furrow, Sprinkler, None
    drainage = Column(String, default="Moderate") # Good, Moderate, Poor
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="fields")
    scans = relationship("Scan", back_populates="field", cascade="all, delete-orphan")
    weather_snapshots = relationship("WeatherSnapshot", back_populates="field", cascade="all, delete-orphan")

class Scan(Base):
    __tablename__ = "scans"
    id = Column(String, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("fields.id"), nullable=False)
    image_url = Column(String, nullable=False)
    cv_class = Column(String, nullable=False)
    cv_confidence = Column(Float, nullable=False)
    visual_risk = Column(Float, default=0.0)
    weather_risk = Column(Float, default=0.0)
    field_risk = Column(Float, default=0.0)
    risk_score = Column(Float, nullable=False) # 0 - 100
    risk_level = Column(String, nullable=False) # LOW, MODERATE, HIGH
    outlook_hours = Column(Integer, default=72)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    field = relationship("Field", back_populates="scans")
    risk_factors = relationship("RiskFactor", back_populates="scan", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="scan", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="scan", cascade="all, delete-orphan")

class WeatherSnapshot(Base):
    __tablename__ = "weather_snapshots"
    id = Column(String, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("fields.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    precipitation = Column(Float, nullable=False)
    rain_probability = Column(Float, nullable=False)
    wind = Column(Float, nullable=False)

    field = relationship("Field", back_populates="weather_snapshots")

class RiskFactor(Base):
    __tablename__ = "risk_factors"
    id = Column(String, primary_key=True, index=True)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False)
    factor = Column(String, nullable=False)
    contribution = Column(Float, nullable=False) # percentage or points
    explanation = Column(Text, nullable=False)

    scan = relationship("Scan", back_populates="risk_factors")

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(String, primary_key=True, index=True)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False)
    priority = Column(String, default="HIGH") # IMMEDIATE, HIGH, MEDIUM, LOW
    action = Column(String, nullable=False)
    rationale = Column(Text, nullable=False)
    is_completed = Column(Integer, default=0) # 0 or 1

    scan = relationship("Scan", back_populates="recommendations")

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(String, primary_key=True, index=True)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False)
    user_label = Column(String, nullable=True)
    expert_label = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scan = relationship("Scan", back_populates="feedback")

def init_db():
    Base.metadata.create_all(bind=engine)
