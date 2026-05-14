from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date

# ---- REQUEST SCHEMAS (From React to FastAPI) ----
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Optional[str] = "applicant"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    email: Optional[EmailStr] = None       
    password: Optional[str] = None         
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    annual_income: Optional[float] = None
    phone_number: Optional[str] = None
    position: Optional[str] = None         
    corporation: Optional[str] = None      

class UserProfileResponse(BaseModel):
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    annual_income: Optional[float] = None
    phone_number: Optional[str] = None
    position: Optional[str] = None         
    corporation: Optional[str] = None      

    class Config:
        from_attributes = True

# --- NEW: Translated Response Schema ---
class UserResponse(BaseModel):
    id: int = Field(validation_alias="user_id", alias="id")
    email: EmailStr
    name: str = Field(validation_alias="username", alias="name")
    role: str = Field(validation_alias="user_role", alias="role")
    profile_picture_url: str = Field(validation_alias="user_avatar_url", alias="profile_picture_url")
    profile: Optional[UserProfileResponse] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse