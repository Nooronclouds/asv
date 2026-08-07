from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import User

def require_role(allowed_roles: list[str]):
    def dependency(current_user_email: str = Depends(get_current_user), db: Session = Depends(get_db)):
        user = db.query(User).filter(User.email == current_user_email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile not found."
            )
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}"
            )
        return user
    return dependency
