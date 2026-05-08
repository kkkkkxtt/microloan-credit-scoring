from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.api.deps import get_db, get_current_user
from app.db.models import User, UserProfile
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse, UserProfileUpdate
from app.core.security import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # 1. Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Hash password and create User (USING NEW DB COLUMNS)
    hashed_pw = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_pw,
        username=user_data.name,     # <-- FIXED
        user_role=user_data.role,    # <-- FIXED
        user_avatar_url="/avatars/user_default_pfp_picture.jpg" # <-- FIXED
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 3. If the user is an applicant, generate an empty UserProfile for them
    if new_user.user_role == "applicant":
        new_profile = UserProfile(user_id=new_user.user_id)
        db.add(new_profile)
        db.commit()

    # 4. Generate JWT Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.user_id), "role": new_user.user_role}, 
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=TokenResponse)
def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    # 1. Find user by email
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # 2. Verify password
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # 3. Generate JWT Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.user_id), "role": user.user_role}, 
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: UserProfileUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # 1. Update Core User info
    if profile_data.name is not None:
        current_user.username = profile_data.name
    if profile_data.profile_picture_url is not None:
        current_user.user_avatar_url = profile_data.profile_picture_url
        
    # --- NEW: Email and Password Updating ---
    if profile_data.email is not None:
        existing_user = db.query(User).filter(User.email == profile_data.email, User.user_id != current_user.user_id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = profile_data.email
        
    if profile_data.password:
        current_user.hashed_password = get_password_hash(profile_data.password)

    # 2. Ensure user has a profile record
    if not current_user.profile:
        current_user.profile = UserProfile(user_id=current_user.user_id)
        db.add(current_user.profile)

    # 3. Update Demographic & Officer Info
    if profile_data.gender is not None:
        current_user.profile.gender = profile_data.gender
    if profile_data.date_of_birth is not None:
        current_user.profile.date_of_birth = profile_data.date_of_birth
    if profile_data.annual_income is not None:
        current_user.profile.annual_income = profile_data.annual_income
    if profile_data.phone_number is not None:
        current_user.profile.phone_number = profile_data.phone_number
        
    # --- NEW: Save Officer Data ---
    if profile_data.position is not None:
        current_user.profile.position = profile_data.position
    if profile_data.corporation is not None:
        current_user.profile.corporation = profile_data.corporation

    db.commit()
    db.refresh(current_user)
    
    return current_user