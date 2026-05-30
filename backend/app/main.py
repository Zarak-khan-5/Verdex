from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from app.api.auth import router as auth_router
from app.api.routes import router as routes_router

app = FastAPI(
    title="Verdex API",
    description="Event-Driven AI Mobility Agent Backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (Vercel domains + localhost)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(routes_router, prefix="/api", tags=["Routes & Data"])


@app.get("/")
async def root():
    return {"message": "Verdex API is running", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
