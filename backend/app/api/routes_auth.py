from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.schemas.schemas import RegisterRequest, LoginRequest
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter()

@router.post("/register")
def register(user: RegisterRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    hashed_pw = hash_password(user.password)
    new_user = User(email=user.email, password=hashed_pw)
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

@router.post("/login")
def login(user: LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
