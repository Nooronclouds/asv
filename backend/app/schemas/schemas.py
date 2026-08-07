from pydantic import BaseModel, Field, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
