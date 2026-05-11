from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Date 
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base 

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    username = Column(String, nullable=False)
    
    # Role can be "applicant" or "loan_officer"
    user_role = Column(String, default="applicant", nullable=False) 
    
    # Profile Picture: Default is the gray portrait you mentioned
    user_avatar_url = Column(String, default="/avatars/user_default_pfp_picture.jpg")

    # Relationships - Note the foreign_keys explicitly point to the column names in ApplicationRecord
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    applications = relationship("ApplicationRecord", foreign_keys="[ApplicationRecord.applicant_user_id]", back_populates="applicant")
    reviewed_applications = relationship("ApplicationRecord", foreign_keys="[ApplicationRecord.reviewing_officer_id]", back_populates="officer")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_profile_id = Column(Integer, primary_key=True, index=True)
    # Important: The foreign key must explicitly state the table and column name: "users.user_id"
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)

    gender = Column(String, nullable=True) 
    date_of_birth = Column(Date, nullable=True) 
    annual_income = Column(Float, nullable=True)
    phone_number = Column(String, nullable=True)

    position = Column(String, nullable=True)
    corporation = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")


class ApplicationRecord(Base):
    __tablename__ = "applications_records"

    application_record_id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String, index=True) 
    application_created_at = Column(DateTime, default=datetime.utcnow)
    
    model_probability = Column(Float)
    model_decision = Column(String)
    input_features = Column(JSONB)
    shap_explanations = Column(JSONB)

    # USER MANAGEMENT SYSTEM FIELDS
    # Important: The foreign key must explicitly state the table and column name: "users.user_id"
    applicant_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    reviewing_officer_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    
    manual_decision = Column(String, nullable=True) 
    officer_justification = Column(String, nullable=True) 

    # Relationships
    applicant = relationship("User", foreign_keys=[applicant_user_id], back_populates="applications")
    officer = relationship("User", foreign_keys=[reviewing_officer_id], back_populates="reviewed_applications")