from fastapi import FastAPI, File, UploadFile, HTTPException, Body, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
import os
import asyncio

# Services
from backend.database import db
from backend.ai_service import ai_service

app = FastAPI(title="Advanced AI Hospital System (RBAC + Beds)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    username: str
    role: str # 'admin', 'doctor', 'patient'
    linked_id: Optional[str] = None # ID in doctors/patients collection

class Patient(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    age: int
    gender: str
    contact: str
    weight: float
    allergies: str = "None"
    history: str = ""
    severity: str = "Normal" # 'Normal', 'Serious', 'Critical'
    assigned_bed_id: Optional[str] = None

class Doctor(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    specialization: str
    availability: str

class Bed(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    ward: str
    number: str
    is_occupied: bool = False
    patient_id: Optional[str] = None

class Appointment(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    patient_id: str
    doctor_id: str
    date: str
    status: str = "Scheduled"
    ai_analysis_ref: Optional[dict] = None

# --- Startup: Seed Users & Beds ---
@app.on_event("startup")
async def startup():
    # Use async connect + ping to ensure DB reachable during startup
    await db.connect_async()
    
    # Seed Users
    users_coll = db.get_users_collection()
    if await users_coll.count_documents({}) == 0:
        await users_coll.insert_many([
            {"username": "admin", "password": "admin123", "role": "admin"},
            {"username": "doctor", "password": "doc123", "role": "doctor", "linked_id": "doc_1"},
            {"username": "patient", "password": "pat123", "role": "patient", "linked_id": "pat_1"}
        ])
        await db.get_doctors_collection().insert_one({"_id": "doc_1", "name": "Dr. Smith", "specialization": "General", "availability": "Mon-Fri"})
        await db.get_patients_collection().insert_one({"_id": "pat_1", "name": "John Doe", "age": 30, "gender": "Male", "contact": "555-0101", "weight": 75.0, "allergies": "None", "severity": "Normal"})
        print("Seeded default users.")
    
    # Seed Beds (New)
    beds_coll = db.get_beds_collection()
    if await beds_coll.count_documents({}) == 0:
        beds_data = []
        for i in range(1, 21): # 20 Beds
            ward = "General" if i <= 15 else "ICU"
            beds_data.append({"ward": ward, "number": f"B-{i:02d}", "is_occupied": False, "patient_id": None})
        await beds_coll.insert_many(beds_data)
        print("Seeded hospital beds.")

@app.on_event("shutdown")
async def shutdown():
    db.close()

# --- Health Check ---
@app.get("/api/health")
async def health_check():
    try:
        # Ping the database
        await db.db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")

# --- Auth Routes ---
@app.post("/api/login")
async def login(creds: UserLogin):
    user = await db.get_users_collection().find_one({"username": creds.username, "password": creds.password})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "username": user["username"],
        "role": user["role"],
        "linked_id": user.get("linked_id")
    }

# --- Dashboard Stats (Enhanced) ---
@app.get("/api/dashboard/stats")
async def get_stats():
    # Counts
    p_count = await db.get_patients_collection().count_documents({})
    d_count = await db.get_doctors_collection().count_documents({})
    
    # Bed Stats
    beds_coll = db.db["beds"]
    total_beds = await beds_coll.count_documents({})
    occupied_beds = await beds_coll.count_documents({"is_occupied": True})
    free_beds = total_beds - occupied_beds
    
    # Patient Severity Stats
    serious = await db.get_patients_collection().count_documents({"severity": "Serious"})
    critical = await db.get_patients_collection().count_documents({"severity": "Critical"})
    normal = await db.get_patients_collection().count_documents({"severity": "Normal"})
    
    return {
        "patients": p_count,
        "doctors": d_count,
        "beds": {
            "total": total_beds,
            "free": free_beds,
            "occupied": occupied_beds
        },
        "patient_status": {
            "normal": normal,
            "serious": serious,
            "critical": critical
        }
    }

# --- General Routes ---

# Patients
@app.get("/api/patients", response_model=List[Patient])
async def get_patients():
    patients = []
    async for p in db.get_patients_collection().find():
        p["_id"] = str(p["_id"])
        patients.append(p)
    return patients

@app.post("/api/patients")
async def add_patient(p: Patient):
    new_p = p.dict(exclude={"id"})
    
    # Auto-assign bed if Serious/Critical and bed available
    if new_p.get("severity") in ["Serious", "Critical"]:
        beds_coll = db.db["beds"]
        ward_pref = "ICU" if new_p["severity"] == "Critical" else "General"
        free_bed = await beds_coll.find_one({"is_occupied": False, "ward": ward_pref})
        
        if not free_bed and ward_pref == "ICU":
             # Fallback to General if ICU full
             free_bed = await beds_coll.find_one({"is_occupied": False, "ward": "General"})
             
        if free_bed:
            new_p["assigned_bed_id"] = str(free_bed["_id"])
            await beds_coll.update_one({"_id": free_bed["_id"]}, {"$set": {"is_occupied": True}})

    res = await db.get_patients_collection().insert_one(new_p)
    
    # Update bed with patient ID if assigned
    if new_p.get("assigned_bed_id"):
        await db.get_beds_collection().update_one(
            {"_id": ObjectId(new_p["assigned_bed_id"])}, 
            {"$set": {"patient_id": str(res.inserted_id)}}
        )
        
    return {"_id": str(res.inserted_id), **new_p}

# Doctors
@app.get("/api/doctors", response_model=List[Doctor])
async def get_doctors():
    doctors = []
    async for d in db.get_doctors_collection().find():
        d["_id"] = str(d["_id"])
        doctors.append(d)
    return doctors

# Appointments
@app.get("/api/appointments")
async def get_appointments(role: str, linked_id: Optional[str] = None):
    query = {}
    if role == 'doctor' and linked_id:
        query['doctor_id'] = linked_id
    elif role == 'patient' and linked_id:
        query['patient_id'] = linked_id
    
    apps = []
    async for a in db.get_appointments_collection().find(query):
        a["_id"] = str(a["_id"])
        apps.append(a)
    return apps

@app.post("/api/appointments")
async def create_appointment(a: Appointment):
    new_a = a.dict(exclude={"id"})
    res = await db.get_appointments_collection().insert_one(new_a)
    return {"_id": str(res.inserted_id), **new_a}

# AI Consultation
@app.post("/api/consultation/ai-assist")
async def consultation_ai_assist(
    file: UploadFile = File(...), 
    patient_id: str = Body(...),
    doctor_id: str = Body(...)
):
    try:
        p_query = {"_id": patient_id}
        if ObjectId.is_valid(patient_id):
            p_query = {"_id": ObjectId(patient_id)}
        patient = await db.get_patients_collection().find_one(p_query)
        if not patient:
             patient = {"age": 30, "weight": 70, "allergies": "None", "name": "Unknown"}
    except:
        patient = {"age": 30, "weight": 70, "allergies": "None", "name": "Unknown"}

    contents = await file.read()
    condition, confidence = ai_service.predict_image(contents)
    
    med_plan = ai_service.generate_dosage_recommendation(
        condition=condition,
        patient_age=patient.get("age", 30),
        weight=patient.get("weight", 70.0),
        allergies=patient.get("allergies", "None")
    )
    
    return {
        "condition_detected": condition,
        "confidence": confidence,
        "ai_treatment_plan": med_plan
    }

# Patient Symptom Checker
@app.post("/api/patient/symptom-check")
async def symptom_checker(symptoms: str = Body(..., embed=True)):
    advice = ai_service.predict_symptoms(symptoms)
    return {"advice": advice}

# Serve Static
if not os.path.exists("backend/static"):
    os.makedirs("backend/static")
app.mount("/", StaticFiles(directory="backend/static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
