import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Any

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
    token: Optional[str] = None
    user_id: Optional[str] = None
    role: str
    name: str
    status: Optional[str] = "success"
    message: Optional[str] = None


class UserInfo(BaseModel):
    user_id: str
    name: str
    email: str
    role: str


# ---------------------------------------------------------------------------
# In-Memory Mock Users Store
# ---------------------------------------------------------------------------

mock_users: dict[str, dict] = {}
mock_pending_planners: dict[str, dict] = {}

# Pre-seed demo users
_demo_users = [
    {
        "user_id": "77777777-7777-7777-7777-777777777771",
        "name": "Adan Hashmi",
        "email": "adanoneplus@gmail.com",
        "password": "@dan123",
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "user_id": "77777777-7777-7777-7777-777777777772",
        "name": "Zarak Khan",
        "email": "muhd.zarak.kh@gmail.com",
        "password": "zarak@vertex",
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
    # Check if this is one of our two hardcoded admins
    if body.email in ("adanoneplus@gmail.com", "muhd.zarak.kh@gmail.com"):
        admin_users = {
            "adanoneplus@gmail.com": {
                "user_id": "77777777-7777-7777-7777-777777777771",
                "name": "Adan Hashmi",
                "email": "adanoneplus@gmail.com",
                "password": "@dan123",
                "role": "admin",
            },
            "muhd.zarak.kh@gmail.com": {
                "user_id": "77777777-7777-7777-7777-777777777772",
                "name": "Zarak Khan",
                "email": "muhd.zarak.kh@gmail.com",
                "password": "zarak@vertex",
                "role": "admin",
            }
        }
        admin_user = admin_users[body.email]
        if admin_user["password"] != body.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        
        token = _create_token(admin_user["user_id"], "admin", admin_user["email"])
        supabase_client.create_session(admin_user["user_id"])
        
        return AuthResponse(
            token=token,
            user_id=admin_user["user_id"],
            role="admin",
            name=admin_user["name"],
        )

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

    # Enforce role demotion: if they are somehow registered as admin, override to "user"
    user_role = user.get("role", "user")
    if user_role == "admin":
        user_role = "user"

    token = _create_token(user["user_id"], user_role, user["email"])
    
    # Log session in Supabase if enabled
    supabase_client.create_session(user["user_id"])
    
    return AuthResponse(
        token=token,
        user_id=user["user_id"],
        role=user_role,
        name=user["name"],
    )


@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest) -> AuthResponse:
    """Register a new user and return a JWT."""
    if body.role == "admin" or body.email in ("adanoneplus@gmail.com", "muhd.zarak.kh@gmail.com"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration as admin is strictly prohibited.",
        )

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

    # Handle City Planner registration approval workflow
    if body.role == "client":
        pending_exists = False
        db_pendings = supabase_client.get_pending_planners()
        if db_pendings is not None:
            if any(e.get("email") == body.email for e in db_pendings):
                pending_exists = True
        elif body.email in mock_pending_planners:
            pending_exists = True

        if pending_exists:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A registration request for this email is already pending approval.",
            )

        # Create pending registration request
        pending_res = supabase_client.create_pending_planner(body.name, body.email, body.password)
        if pending_res is None:
            pending_id = str(uuid.uuid4())
            pending_res = {
                "request_id": pending_id,
                "name": body.name,
                "email": body.email,
                "password_hash": body.password,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            mock_pending_planners[body.email] = pending_res

        return AuthResponse(
            role="client",
            name=body.name,
            status="pending_approval",
            message="Your registration request as a City Planner has been submitted. An administrator must approve it before you can log in."
        )

    # Create user in Supabase (for default 'user' role)
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
    
    # Check if this is one of our two hardcoded admins
    if email in ("adanoneplus@gmail.com", "muhd.zarak.kh@gmail.com"):
        admin_users = {
            "adanoneplus@gmail.com": {
                "user_id": "77777777-7777-7777-7777-777777777771",
                "name": "Adan Hashmi",
                "email": "adanoneplus@gmail.com",
                "role": "admin",
            },
            "muhd.zarak.kh@gmail.com": {
                "user_id": "77777777-7777-7777-7777-777777777772",
                "name": "Zarak Khan",
                "email": "muhd.zarak.kh@gmail.com",
                "role": "admin",
            }
        }
        admin_user = admin_users[email]
        return UserInfo(
            user_id=admin_user["user_id"],
            name=admin_user["name"],
            email=admin_user["email"],
            role="admin",
        )

    # Try Supabase first
    user = supabase_client.get_user_by_email(email)
    if user is None:
        user = mock_users.get(email)
        
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user_role = user.get("role", "user")
    if user_role == "admin":
        user_role = "user"

    return UserInfo(
        user_id=user["user_id"],
        name=user["name"],
        email=user["email"],
        role=user_role,
    )


@router.get("/admin/users", response_model=list[dict[str, Any]])
async def get_all_users():
    """List all registered users (Supabase + local mock fallback)."""
    # 1. Try Supabase
    users = supabase_client.get_all_users()
    if users is None:
        # 2. Fallback to mock users
        users = list(mock_users.values())
        
    # Enforce only our two hardcoded admins can have "admin" role, and ensure they are present in the list
    has_adan = False
    has_zarak = False
    
    processed_users = []
    for u in users:
        u_copy = dict(u)
        email = u_copy.get("email")
        if email == "adanoneplus@gmail.com":
            u_copy["role"] = "admin"
            has_adan = True
        elif email == "muhd.zarak.kh@gmail.com":
            u_copy["role"] = "admin"
            has_zarak = True
        else:
            if u_copy.get("role") == "admin":
                u_copy["role"] = "user"
        processed_users.append(u_copy)
        
    # Append hardcoded admins if not already present in the retrieved list
    if not has_adan:
        processed_users.append({
            "user_id": "77777777-7777-7777-7777-777777777771",
            "name": "Adan Hashmi",
            "email": "adanoneplus@gmail.com",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    if not has_zarak:
        processed_users.append({
            "user_id": "77777777-7777-7777-7777-777777777772",
            "name": "Zarak Khan",
            "email": "muhd.zarak.kh@gmail.com",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        
    return processed_users


@router.delete("/admin/users/{user_id}")
async def delete_user_route(user_id: str):
    """Delete a user (Supabase + local mock fallback)."""
    # Block deleting the hardcoded administrators by UUID
    if user_id in ("77777777-7777-7777-7777-777777777771", "77777777-7777-7777-7777-777777777772"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System administrators cannot be deleted.",
        )

    # Retrieve user from DB or mock to inspect email and role
    target_user = None
    # Check mock first
    for u in mock_users.values():
        if u.get("user_id") == user_id:
            target_user = u
            break
            
    # If not found in mock, check Supabase
    if target_user is None:
        users = supabase_client.get_all_users()
        if users:
            for u in users:
                if u.get("user_id") == user_id:
                    target_user = u
                    break
                    
    if target_user:
        email = target_user.get("email")
        role = target_user.get("role")
        if role == "admin" or email in ("adanoneplus@gmail.com", "muhd.zarak.kh@gmail.com"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="System administrators cannot be deleted.",
            )

    # 1. Try Supabase
    db_success = supabase_client.delete_user(user_id)
    
    # 2. Mock fallback / local deletion
    mock_found = False
    mock_email = None
    for email, user in list(mock_users.items()):
        if user.get("user_id") == user_id:
            mock_email = email
            mock_found = True
            break
            
    if mock_found and mock_email:
        del mock_users[mock_email]
        # Also clean up related routes history and carbon records in-memory fallback
        from app.api.routes import routes_history, carbon_records
        routes_history[:] = [r for r in routes_history if r.get("user_id") != user_id]
        carbon_records[:] = [c for c in carbon_records if c.get("user_id") != user_id]
        
    if not db_success and not mock_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    return {"status": "success", "message": f"User {user_id} deleted successfully."}


@router.get("/admin/approvals", response_model=list[dict[str, Any]])
async def get_pending_approvals():
    """List all pending City Planner signups (Supabase + local mock fallback)."""
    # 1. Try Supabase
    pendings = supabase_client.get_pending_planners()
    if pendings is None:
        # 2. Fallback to mock
        pendings = list(mock_pending_planners.values())
        
    # Format and return list
    formatted = []
    for p in pendings:
        formatted.append({
            "request_id": p.get("request_id"),
            "name": p.get("name"),
            "email": p.get("email"),
            "created_at": p.get("created_at")
        })
    return formatted


@router.post("/admin/approvals/{request_id}/approve")
async def approve_pending_planner(request_id: str):
    """Approve a pending City Planner signup."""
    # Find the request
    request_details = None
    
    # Try Supabase first
    db_request = supabase_client.get_pending_planner_by_id(request_id)
    if db_request:
        request_details = db_request
    else:
        # Check mock
        for p in mock_pending_planners.values():
            if p.get("request_id") == request_id:
                request_details = p
                break
                
    if not request_details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approvals request not found"
        )
        
    name = request_details.get("name")
    email = request_details.get("email")
    password = request_details.get("password_hash")
    
    # Create the user in the database with 'client' role
    new_user = supabase_client.create_user(name, email, password, "client")
    
    # Fallback to local mock users
    if new_user is None:
        new_user = {
            "user_id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "password": password,
            "role": "client",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        mock_users[email] = new_user

    # Delete the pending request
    supabase_client.delete_pending_planner(request_id)
    # Delete from local mock as well if exists
    mock_email_to_delete = None
    for em, p in mock_pending_planners.items():
        if p.get("request_id") == request_id:
            mock_email_to_delete = em
            break
    if mock_email_to_delete:
        del mock_pending_planners[mock_email_to_delete]
        
    return {"status": "success", "message": f"City Planner {email} approved and registered successfully."}


@router.post("/admin/approvals/{request_id}/reject")
async def reject_pending_planner(request_id: str):
    """Reject and delete a pending City Planner signup request."""
    # Find request to get email
    email = "Planner"
    
    # Try Supabase
    db_request = supabase_client.get_pending_planner_by_id(request_id)
    if db_request:
        email = db_request.get("email")
        
    # Delete from Supabase
    db_success = supabase_client.delete_pending_planner(request_id)
    
    # Delete from mock
    mock_found = False
    mock_email = None
    for em, p in mock_pending_planners.items():
        if p.get("request_id") == request_id:
            mock_email = em
            mock_found = True
            email = em
            break
            
    if mock_found and mock_email:
        del mock_pending_planners[mock_email]
        
    if not db_success and not mock_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approvals request not found"
        )
        
    return {"status": "success", "message": f"City Planner registration request for {email} rejected and deleted."}

