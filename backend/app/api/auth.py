import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, EmailStr

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
JWT_SECRET: str = "verdex-demo-secret-key-2024"
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRATION_MINUTES: int = 60

router = APIRouter()

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "user"


class AuthResponse(BaseModel):
    token: str
    user_id: str
    role: str
    name: str


class UserInfo(BaseModel):
    user_id: str
    name: str
    email: str
    role: str


# ---------------------------------------------------------------------------
# In-Memory Mock Users Store
# ---------------------------------------------------------------------------

mock_users: dict[str, dict] = {}

# Pre-seed demo users
_demo_users = [
    {
        "user_id": str(uuid.uuid4()),
        "name": "Admin",
        "email": "admin@verdex.io",
        "password": "admin123",
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "user_id": str(uuid.uuid4()),
        "name": "City Planner",
        "email": "planner@verdex.io",
        "password": "planner123",
        "role": "client",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "user_id": str(uuid.uuid4()),
        "name": "Demo User",
        "email": "user@verdex.io",
        "password": "user123",
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
]

for _u in _demo_users:
    mock_users[_u["email"]] = _u


from app.database import supabase_client


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_token(user_id: str, role: str, email: str) -> str:
    """Generate a signed JWT for the given user."""
    payload = {
        "user_id": user_id,
        "role": role,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(token: str) -> dict:
    """Decode and validate a JWT, returning the payload."""
    try:
        payload: dict = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest) -> AuthResponse:
    """Authenticate a user and return a JWT."""
    # Try live Supabase first
    user = supabase_client.get_user_by_email(body.email)
    
    # Fallback to local mock if Supabase fails or is disabled
    if user is None:
        user = mock_users.get(body.email)
        
    if user is None or user["password"] != body.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = _create_token(user["user_id"], user["role"], user["email"])
    
    # Log session in Supabase if enabled
    supabase_client.create_session(user["user_id"])
    
    return AuthResponse(
        token=token,
        user_id=user["user_id"],
        role=user["role"],
        name=user["name"],
    )


@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest) -> AuthResponse:
    """Register a new user and return a JWT."""
    if body.role not in ("user", "client", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be one of: user, client, admin",
        )

    # Check live Supabase first
    user_exists = False
    supabase_user = supabase_client.get_user_by_email(body.email)
    if supabase_user is not None:
        user_exists = True
    elif body.email in mock_users:
        user_exists = True

    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create user in Supabase
    new_user = supabase_client.create_user(body.name, body.email, body.password, body.role)
    
    # Fallback/Save locally if Supabase is disabled/fails
    if new_user is None:
        new_user = {
            "user_id": str(uuid.uuid4()),
            "name": body.name,
            "email": body.email,
            "password": body.password,
            "role": body.role,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        mock_users[body.email] = new_user

    token = _create_token(new_user["user_id"], new_user["role"], new_user["email"])
    
    # Log session in Supabase if enabled
    supabase_client.create_session(new_user["user_id"])
    
    return AuthResponse(
        token=token,
        user_id=new_user["user_id"],
        role=new_user["role"],
        name=new_user["name"],
    )


@router.get("/me", response_model=UserInfo)
async def me(authorization: Optional[str] = Header(None)) -> UserInfo:
    """Return info for the currently authenticated user."""
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required",
        )

    token = authorization
    if token.lower().startswith("bearer "):
        token = token[7:]

    payload = _decode_token(token)
    email: str = payload.get("email", "")
    
    # Try Supabase first
    user = supabase_client.get_user_by_email(email)
    if user is None:
        user = mock_users.get(email)
        
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserInfo(
        user_id=user["user_id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
    )
