# ============================================================
# ReplyKing Properties AI Chatbot — main.py
# Stack: FastAPI + Google Gemini + Supabase
# Hosting: Render.com (Free Web Service)
# ============================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai
from supabase import create_client, Client
from datetime import datetime
import os

# ============================================================
# ✏️  CLIENT CONFIG
# ============================================================

BUSINESS_PROMPT = """
You are a professional real estate assistant for ReplyKing Properties.

ABOUT THE AGENCY:
- Name: ReplyKing Properties
- Location: Victoria Island, Lagos
- Phone: 09059144435
- Email: replykingng@gmail.com
- Hours: Monday-Saturday, 9am - 6pm

CURRENT LISTINGS:
1. 3 Bedroom Flat - Lekki Phase 1 - ₦2.5M/year
2. 5 Bedroom Duplex - Ajah - ₦85M outright
3. 2 Bedroom Apartment - Yaba - ₦1.2M/year
4. Office Space - Victoria Island - ₦5M/year
5. Land - Ibeju Lekki - ₦8M per plot

WHAT YOU CAN DO:
- Answer questions about listings, pricing, and availability
- Book inspection appointments
- Collect interested buyer or tenant details
- Explain documents needed for renting or buying

RULES:
- Always be polite, warm, and highly professional
- Use proper grammar at all times
- If a listing is not available here, say "Please contact us directly for more options"
- Always encourage users to book an inspection or speak with an agent
- Never make up prices or listings not listed above
"""

BRAND_COLOR = "#1D4ED8"  # ✏️ Deep professional blue — change per client

# ============================================================
# 🔑  API KEYS — set these in Render Dashboard → Environment
# ============================================================

GEMINI_API_KEY    = os.environ.get("GEMINI_API_KEY",    "AQ.Ab8RN6ISpigXQ8Ve97utf0gyLDrb1YjBIHHZl4vpiQ4IiSfpDA")
SUPABASE_URL      = os.environ.get("SUPABASE_URL",      "https://dbtrhxuscvskwsaurmrb.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidHJoeHVzY3Zza3dzYXVybXJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTIyNDQ4OSwiZXhwIjoyMDk2ODAwNDg5fQ.HWPrGIP0H80o-T_7nhvbemunv2j-m5o81ihILUDvmgA")

# ============================================================
# INITIALISE SERVICES
# ============================================================

genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=BUSINESS_PROMPT,
)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

app = FastAPI(title="ReplyKing Properties Chatbot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# ============================================================
# SCHEMAS
# ============================================================

class ChatRequest(BaseModel):
    message: str
    message_count: int = 1

class LeadRequest(BaseModel):
    name: str
    email: str
    message: Optional[str] = ""
    bot_reply: Optional[str] = ""

class BookingRequest(BaseModel):
    name: str
    email: str
    date: str
    service: str

# ============================================================
# ROUTES
# ============================================================

@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "ReplyKing Properties Chatbot is live on Render 🚀"
    }


@app.get("/config")
def get_config():
    return {"brand_color": BRAND_COLOR}


@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        chat_session = gemini_model.start_chat()
        response = chat_session.send_message(req.message)
        bot_reply = response.text.strip()

        try:
            supabase.table("chat_logs").insert({
                "user_message": req.message,
                "bot_reply": bot_reply,
                "created_at": datetime.utcnow().isoformat(),
            }).execute()
        except Exception as e:
            print(f"[chat_log warning] {e}")

        collect_lead = req.message_count >= 2

        return {
            "reply": bot_reply,
            "collect_lead": collect_lead,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/lead")
async def save_lead(req: LeadRequest):
    try:
        existing = supabase.table("leads").select("id").eq("email", req.email).execute()
        if not existing.data:
            supabase.table("leads").insert({
                "name":      req.name,
                "email":     req.email,
                "message":   req.message,
                "bot_reply": req.bot_reply,
                "created_at": datetime.utcnow().isoformat(),
            }).execute()
        return {"status": "saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/booking")
async def save_booking(req: BookingRequest):
    try:
        supabase.table("bookings").insert({
            "name":    req.name,
            "email":   req.email,
            "date":    req.date,
            "service": req.service,
            "created_at": datetime.utcnow().isoformat(),
        }).execute()

        return {
            "status": "booked",
            "message": (
                f"Thank you, {req.name}! Your inspection for {req.service} "
                f"on {req.date} has been booked. Our agent will contact you "
                f"at {req.email} to confirm. 🏠"
            ),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
