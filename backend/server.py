from fastapi import FastAPI, APIRouter, HTTPException, Header, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import bcrypt
from supabase import create_client, Client
from tyt_ayt_topics import TYT_TOPICS, AYT_SAYISAL, AYT_ESIT_AGIRLIK, AYT_SOZEL
from exam_analyzer import ExamAnalyzer

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase client
supabase_url = os.environ['SUPABASE_URL']
supabase_key = os.environ['SUPABASE_ANON_KEY']
supabase: Client = create_client(supabase_url, supabase_key)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class CoachLogin(BaseModel):
    password: str

class CoachLoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None

class StudentCreate(BaseModel):
    ad: str
    soyad: Optional[str] = None
    bolum: str
    hedef: Optional[str] = None
    notlar: Optional[str] = None

class TopicCreate(BaseModel):
    student_id: str
    ders: str
    konu: str
    durum: str = "baslanmadi"
    sinav_turu: str = "TYT"
    order_index: int = 0

class TopicUpdate(BaseModel):
    durum: Optional[str] = None
    order_index: Optional[int] = None

class TaskCreate(BaseModel):
    student_id: str
    aciklama: str
    sure: int
    tarih: str
    gun: str
    order_index: int = 0
    completed: bool = False

class TaskUpdate(BaseModel):
    aciklama: Optional[str] = None
    sure: Optional[int] = None
    tarih: Optional[str] = None
    gun: Optional[str] = None
    order_index: Optional[int] = None
    completed: Optional[bool] = None

class ExamCreate(BaseModel):
    student_id: str
    tarih: str
    sinav_tipi: str
    ders: str
    dogru: int
    yanlis: int

class CalendarNoteCreate(BaseModel):
    student_id: str
    date: str
    note: str

class CalendarNoteUpdate(BaseModel):
    note: str

# ============================================
# FAZ 1: ONBOARDING VE VERİ TOPLAMA MODELLERI
# ============================================

class StudentOnboarding(BaseModel):
    sinif: str
    hedef_siralama: int
    gunluk_calisma_suresi: int
    guclu_dersler: list
    zayif_dersler: list
    deneme_ortalamasi: float
    kullanilan_kaynaklar: list
    program_onceligi: str

class SoruTakip(BaseModel):
    student_id: str
    date: str
    lesson: str
    topic: Optional[str] = None
    source: Optional[str] = None
    solved: int
    correct: int
    wrong: int
    blank: int

class SourceUpdate(BaseModel):
    source_name: str
    progress_percent: int

class ExamDetailed(BaseModel):
    student_id: str
    tarih: str
    exam_type: str
    net_math: float
    net_science: float
    net_turkish: float
    net_social: float

class Notification(BaseModel):
    user_id: str
    type: str
    title: str
    message: str

# New Models for Features
class CoachCalendarEvent(BaseModel):
    title: str
    date: str
    note: Optional[str] = None

class CoachNote(BaseModel):
    title: str
    content: str

class CoachNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class BookRecommendation(BaseModel):
    name: str
    level: str
    description: Optional[str] = None

class TaskPoolItem(BaseModel):
    student_id: str
    aciklama: str
    sure: int

# Coach password storage (in production, use proper database)
COACH_PASSWORD = os.environ.get('COACH_PASSWORD', 'coach2025')

# Coach Authentication
@api_router.post("/coach/login", response_model=CoachLoginResponse)
async def coach_login(login: CoachLogin):
    global COACH_PASSWORD
    if login.password == COACH_PASSWORD:
        return CoachLoginResponse(success=True, token="coach-token-12345")
    raise HTTPException(status_code=401, detail="Şifre hatalı")

# Coach Change Password
class ChangePassword(BaseModel):
    current_password: str
    new_password: str

@api_router.post("/coach/change-password")
async def change_coach_password(data: ChangePassword):
    global COACH_PASSWORD
    if data.current_password != COACH_PASSWORD:
        raise HTTPException(status_code=401, detail="Mevcut şifre yanlış")
    
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Yeni şifre en az 6 karakter olmalı")
    
    COACH_PASSWORD = data.new_password
    return {"success": True, "message": "Şifre başarıyla değiştirildi"}

# Students
@api_router.get("/students")
async def get_students():
    response = supabase.table("students").select("*").execute()
    return response.data

@api_router.post("/students")
async def create_student(student: StudentCreate):
    student_token = str(uuid.uuid4())
    data = {
        "id": str(uuid.uuid4()),
        "ad": student.ad,
        "soyad": student.soyad,
        "bolum": student.bolum,
        "hedef": student.hedef,
        "notlar": student.notlar,
        "token": student_token,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    response = supabase.table("students").insert(data).execute()
    return response.data[0]

@api_router.get("/students/{student_id}")
async def get_student(student_id: str):
    response = supabase.table("students").select("*").eq("id", student_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    return response.data[0]

@api_router.get("/students/token/{token}")
async def get_student_by_token(token: str):
    response = supabase.table("students").select("*").eq("token", token).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    return response.data[0]

@api_router.put("/students/{student_id}")
async def update_student(student_id: str, student: StudentCreate):
    data = {
        "ad": student.ad,
        "soyad": student.soyad,
        "bolum": student.bolum,
        "hedef": student.hedef,
        "notlar": student.notlar
    }
    response = supabase.table("students").update(data).eq("id", student_id).execute()
    return response.data[0]

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    supabase.table("topics").delete().eq("student_id", student_id).execute()
    supabase.table("tasks").delete().eq("student_id", student_id).execute()
    supabase.table("exams").delete().eq("student_id", student_id).execute()
    supabase.table("calendar_notes").delete().eq("student_id", student_id).execute()
    response = supabase.table("students").delete().eq("id", student_id).execute()
    return {"success": True}

# Topics
@api_router.get("/topics/{student_id}")
async def get_topics(student_id: str):
    response = supabase.table("topics").select("*").eq("student_id", student_id).order("order_index").execute()
    return response.data

@api_router.post("/topics")
async def create_topic(topic: TopicCreate):
    data = {
        "id": str(uuid.uuid4()),
        "student_id": topic.student_id,
        "ders": topic.ders,
        "konu": topic.konu,
        "durum": topic.durum,
        "sinav_turu": topic.sinav_turu,
        "order_index": topic.order_index
    }
    response = supabase.table("topics").insert(data).execute()
    return response.data[0]

@api_router.put("/topics/{topic_id}")
async def update_topic(topic_id: str, topic: TopicUpdate):
    data = {k: v for k, v in topic.model_dump().items() if v is not None}
    response = supabase.table("topics").update(data).eq("id", topic_id).execute()
    return response.data[0]

@api_router.delete("/topics/{topic_id}")
async def delete_topic(topic_id: str):
    response = supabase.table("topics").delete().eq("id", topic_id).execute()
    return {"success": True}

@api_router.post("/topics/init/{student_id}")
async def init_topics(student_id: str, bolum: str):
    """Initialize TYT and AYT topics for a student"""
    topics = []
    
    # Normalize bolum
    bolum_normalized = bolum.strip().lower()
    if 'sayisal' in bolum_normalized or 'sayısal' in bolum_normalized:
        bolum = "Sayısal"
    elif 'esit' in bolum_normalized or 'eşit' in bolum_normalized:
        bolum = "Eşit Ağırlık"
    elif 'sozel' in bolum_normalized or 'sözel' in bolum_normalized:
        bolum = "Sözel"
    
    order_index = 0
    
    # Add TYT Topics
    for ders_name, konu_list in TYT_TOPICS.items():
        for konu in konu_list:
            data = {
                "id": str(uuid.uuid4()),
                "student_id": student_id,
                "ders": f"TYT - {ders_name}",
                "konu": konu,
                "durum": "baslanmadi",
                "sinav_turu": "TYT",
                "order_index": order_index
            }
            response = supabase.table("topics").insert(data).execute()
            topics.extend(response.data)
            order_index += 1
    
    # Add AYT Topics
    ayt_topics_dict = {
        "Sayısal": AYT_SAYISAL,
        "Eşit Ağırlık": AYT_ESIT_AGIRLIK,
        "Sözel": AYT_SOZEL
    }
    
    if bolum in ayt_topics_dict:
        for ders_name, konu_list in ayt_topics_dict[bolum].items():
            for konu in konu_list:
                data = {
                    "id": str(uuid.uuid4()),
                    "student_id": student_id,
                    "ders": f"AYT - {ders_name}",
                    "konu": konu,
                    "durum": "baslanmadi",
                    "sinav_turu": "AYT",
                    "order_index": order_index
                }
                response = supabase.table("topics").insert(data).execute()
                topics.extend(response.data)
                order_index += 1
    
    return topics

# Tasks
@api_router.get("/tasks/{student_id}")
async def get_tasks(student_id: str):
    response = supabase.table("tasks").select("*").eq("student_id", student_id).order("tarih").order("order_index").execute()
    return response.data

@api_router.post("/tasks")
async def create_task(task: TaskCreate):
    data = {
        "id": str(uuid.uuid4()),
        "student_id": task.student_id,
        "aciklama": task.aciklama,
        "sure": task.sure,
        "tarih": task.tarih,
        "gun": task.gun,
        "order_index": task.order_index,
        "completed": task.completed,
        "verilme_tarihi": datetime.now(timezone.utc).isoformat()
    }
    response = supabase.table("tasks").insert(data).execute()
    return response.data[0]

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, task: TaskUpdate):
    data = {k: v for k, v in task.model_dump().items() if v is not None}
    response = supabase.table("tasks").update(data).eq("id", task_id).execute()
    return response.data[0]

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    response = supabase.table("tasks").delete().eq("id", task_id).execute()
    return {"success": True}

# Exams
@api_router.get("/exams/{student_id}")
async def get_exams(student_id: str):
    response = supabase.table("exams").select("*").eq("student_id", student_id).order("tarih", desc=True).execute()
    for exam in response.data:
        exam["net"] = exam["dogru"] - (exam["yanlis"] * 0.25)
    return response.data

@api_router.post("/exams")
async def create_exam(exam: ExamCreate):
    net = exam.dogru - (exam.yanlis * 0.25)
    data = {
        "id": str(uuid.uuid4()),
        "student_id": exam.student_id,
        "tarih": exam.tarih,
        "sinav_tipi": exam.sinav_tipi,
        "ders": exam.ders,
        "dogru": exam.dogru,
        "yanlis": exam.yanlis,
        "net": net
    }
    response = supabase.table("exams").insert(data).execute()
    return response.data[0]

@api_router.delete("/exams/{exam_id}")
async def delete_exam(exam_id: str):
    response = supabase.table("exams").delete().eq("id", exam_id).execute()
    return {"success": True}

# Calendar Notes
@api_router.get("/calendar/{student_id}")
async def get_calendar_notes(student_id: str):
    response = supabase.table("calendar_notes").select("*").eq("student_id", student_id).order("date").execute()
    return response.data

@api_router.post("/calendar")
async def create_calendar_note(note: CalendarNoteCreate):
    data = {
        "id": str(uuid.uuid4()),
        "student_id": note.student_id,
        "date": note.date,
        "note": note.note
    }
    response = supabase.table("calendar_notes").insert(data).execute()
    return response.data[0]

@api_router.put("/calendar/{note_id}")
async def update_calendar_note(note_id: str, note: CalendarNoteUpdate):
    data = {"note": note.note}
    response = supabase.table("calendar_notes").update(data).eq("id", note_id).execute()
    return response.data[0]

@api_router.delete("/calendar/{note_id}")
async def delete_calendar_note(note_id: str):
    response = supabase.table("calendar_notes").delete().eq("id", note_id).execute()
    return {"success": True}

# ====================================
# NEW FEATURES - COACH PANEL
# ====================================

# Coach Calendar Events
@api_router.get("/coach/calendar")
async def get_coach_calendar():
    response = supabase.table("coach_calendar").select("*").order("date").execute()
    return response.data

@api_router.post("/coach/calendar")
async def create_coach_calendar_event(event: CoachCalendarEvent):
    data = {
        "id": str(uuid.uuid4()),
        "title": event.title,
        "date": event.date,
        "note": event.note
    }
    response = supabase.table("coach_calendar").insert(data).execute()
    return response.data[0]

@api_router.delete("/coach/calendar/{event_id}")
async def delete_coach_calendar_event(event_id: str):
    response = supabase.table("coach_calendar").delete().eq("id", event_id).execute()
    return {"success": True}

# Coach Notes
@api_router.get("/coach/notes")
async def get_coach_notes():
    response = supabase.table("coach_notes").select("*").order("created_at", desc=True).execute()
    return response.data

@api_router.post("/coach/notes")
async def create_coach_note(note: CoachNote):
    data = {
        "id": str(uuid.uuid4()),
        "title": note.title,
        "content": note.content,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    response = supabase.table("coach_notes").insert(data).execute()
    return response.data[0]

@api_router.put("/coach/notes/{note_id}")
async def update_coach_note(note_id: str, note: CoachNoteUpdate):
    data = {k: v for k, v in note.model_dump().items() if v is not None}
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    response = supabase.table("coach_notes").update(data).eq("id", note_id).execute()
    return response.data[0]

@api_router.delete("/coach/notes/{note_id}")
async def delete_coach_note(note_id: str):
    response = supabase.table("coach_notes").delete().eq("id", note_id).execute()
    return {"success": True}

# Book Recommendations
@api_router.get("/books")
async def get_books():
    response = supabase.table("book_recommendations").select("*").order("level").order("order_index").execute()
    # Sort by level: Kolay -> Orta -> Zor
    level_order = {"Kolay": 1, "Orta": 2, "Zor": 3}
    sorted_books = sorted(response.data, key=lambda x: level_order.get(x["level"], 999))
    return sorted_books

@api_router.post("/books")
async def create_book(book: BookRecommendation):
    data = {
        "id": str(uuid.uuid4()),
        "name": book.name,
        "level": book.level,
        "description": book.description,
        "order_index": 0
    }
    response = supabase.table("book_recommendations").insert(data).execute()
    return response.data[0]

@api_router.delete("/books/{book_id}")
async def delete_book(book_id: str):
    response = supabase.table("book_recommendations").delete().eq("id", book_id).execute()
    return {"success": True}

# Task Pool
@api_router.get("/task-pool/{student_id}")
async def get_task_pool(student_id: str):
    response = supabase.table("task_pool").select("*").eq("student_id", student_id).execute()
    return response.data

@api_router.post("/task-pool")
async def create_task_pool_item(item: TaskPoolItem):
    data = {
        "id": str(uuid.uuid4()),
        "student_id": item.student_id,
        "aciklama": item.aciklama,
        "sure": item.sure
    }
    response = supabase.table("task_pool").insert(data).execute()
    return response.data[0]

@api_router.delete("/task-pool/{item_id}")
async def delete_task_pool_item(item_id: str):
    response = supabase.table("task_pool").delete().eq("id", item_id).execute()
    return {"success": True}

# Task Assignment from Pool (move to specific date)
@api_router.post("/task-pool/{item_id}/assign")
async def assign_task_from_pool(item_id: str, tarih: str, gun: str):
    # Get pool item
    pool_item = supabase.table("task_pool").select("*").eq("id", item_id).execute()
    if not pool_item.data:
        raise HTTPException(status_code=404, detail="Task not found")
    
    item = pool_item.data[0]
    
    # Create task
    task_data = {
        "id": str(uuid.uuid4()),
        "student_id": item["student_id"],
        "aciklama": item["aciklama"],
        "sure": item["sure"],
        "tarih": tarih,
        "gun": gun,
        "order_index": 0,
        "completed": False,
        "verilme_tarihi": datetime.now(timezone.utc).isoformat()
    }
    response = supabase.table("tasks").insert(task_data).execute()
    
    # Delete from pool
    supabase.table("task_pool").delete().eq("id", item_id).execute()
    
    return response.data[0]

# Last 7 Days Summary for Student
@api_router.get("/student/{student_id}/last-7-days-summary")
async def get_last_7_days_summary(student_id: str):
    from datetime import timedelta, date
    
    today = date.today()
    seven_days_ago = today - timedelta(days=7)
    
    # Get completed tasks in last 7 days
    tasks_response = supabase.table("tasks").select("*").eq("student_id", student_id).gte("tarih", seven_days_ago.isoformat()).lte("tarih", today.isoformat()).execute()
    
    completed_tasks = [t for t in tasks_response.data if t.get("completed")]
    total_minutes = sum(t.get("sure", 0) for t in completed_tasks)
    
    # Get topics updated in last 7 days
    topics_response = supabase.table("topics").select("*").eq("student_id", student_id).execute()
    
    # Count by day for chart
    daily_data = {}
    for i in range(7):
        day = today - timedelta(days=6-i)
        daily_data[day.isoformat()] = {
            "date": day.isoformat(),
            "minutes": 0,
            "tasks": 0
        }
    
    for task in completed_tasks:
        task_date = task.get("tarih")
        if task_date in daily_data:
            daily_data[task_date]["minutes"] += task.get("sure", 0)
            daily_data[task_date]["tasks"] += 1
    
    return {
        "total_minutes": total_minutes,
        "completed_tasks_count": len(completed_tasks),
        "total_topics": len(topics_response.data),
        "daily_activity": list(daily_data.values())
    }

@api_router.get("/student/{student_id}/onboarding")
async def get_student_onboarding(student_id: str):
    response = supabase.table("students").select("*").eq("id", student_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    
    student = response.data[0]
    return {
        "onboarding_completed": student.get("onboarding_completed", False),
        "sinif": student.get("sinif"),
        "hedef_siralama": student.get("hedef_siralama"),
        "gunluk_calisma_suresi": student.get("gunluk_calisma_suresi"),
        "guclu_dersler": student.get("guclu_dersler", []),
        "zayif_dersler": student.get("zayif_dersler", []),
        "deneme_ortalamasi": student.get("deneme_ortalamasi"),
        "kullanilan_kaynaklar": student.get("kullanilan_kaynaklar", []),
        "program_onceligi": student.get("program_onceligi")
    }

@api_router.post("/student/{student_id}/onboarding")
async def complete_student_onboarding(student_id: str, data: StudentOnboarding):
    update_data = {
        "onboarding_completed": True,
        "sinif": data.sinif,
        "hedef_siralama": data.hedef_siralama,
        "gunluk_calisma_suresi": data.gunluk_calisma_suresi,
        "guclu_dersler": data.guclu_dersler,
        "zayif_dersler": data.zayif_dersler,
        "deneme_ortalamasi": data.deneme_ortalamasi,
        "kullanilan_kaynaklar": data.kullanilan_kaynaklar,
        "program_onceligi": data.program_onceligi
    }
    
    response = supabase.table("students").update(update_data).eq("id", student_id).execute()
    
    # Create welcome notification
    notification_data = {
        "id": str(uuid.uuid4()),
        "user_id": student_id,
        "type": "success",
        "title": "Hoş Geldin!",
        "message": "Profilin tamamlandı. Artık kişiselleştirilmiş çalışma planına erişebilirsin.",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table("notifications").insert(notification_data).execute()
    
    return {"success": True, "message": "Onboarding tamamlandı"}

# 2. SORU TAKİP
@api_router.get("/student/{student_id}/soru-takip")
async def get_soru_takip(student_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = supabase.table("soru_takip").select("*").eq("student_id", student_id)
    
    if start_date:
        query = query.gte("date", start_date)
    if end_date:
        query = query.lte("date", end_date)
    
    response = query.order("date", desc=True).execute()
    return response.data

@api_router.post("/student/soru-takip")
async def create_soru_takip(data: SoruTakip):
    record = {
        "id": str(uuid.uuid4()),
        "student_id": data.student_id,
        "date": data.date,
        "lesson": data.lesson,
        "topic": data.topic,
        "source": data.source,
        "solved": data.solved,
        "correct": data.correct,
        "wrong": data.wrong,
        "blank": data.blank,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    response = supabase.table("soru_takip").insert(record).execute()
    return response.data[0]

# 3. KAYNAK TAKİBİ
@api_router.get("/student/{student_id}/sources")
async def get_student_sources(student_id: str):
    response = supabase.table("students_sources").select("*").eq("student_id", student_id).execute()
    return response.data

@api_router.post("/student/{student_id}/sources")
async def add_student_source(student_id: str, data: SourceUpdate):
    record = {
        "id": str(uuid.uuid4()),
        "student_id": student_id,
        "source_name": data.source_name,
        "progress_percent": data.progress_percent,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    response = supabase.table("students_sources").insert(record).execute()
    return response.data[0]

@api_router.put("/student/sources/{source_id}")
async def update_source_progress(source_id: str, progress: int):
    update_data = {
        "progress_percent": progress,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    response = supabase.table("students_sources").update(update_data).eq("id", source_id).execute()
    return response.data[0]

# 4. DETAYLI DENEME KAYDI
@api_router.post("/student/deneme-detayli")
async def create_detailed_exam(data: ExamDetailed):
    # Calculate total net
    total_net = data.net_math + data.net_science + data.net_turkish + data.net_social
    
    # Calculate accuracy rate (simplified)
    accuracy_rate = (total_net / 120) * 100 if total_net > 0 else 0
    
    record = {
        "id": str(uuid.uuid4()),
        "student_id": data.student_id,
        "tarih": data.tarih,
        "exam_type": data.exam_type,
        "net_math": data.net_math,
        "net_science": data.net_science,
        "net_turkish": data.net_turkish,
        "net_social": data.net_social,
        "net": total_net,
        "accuracy_rate": accuracy_rate,
        "sinav_tipi": data.exam_type,
        "ders": "Toplam"
    }
    
    response = supabase.table("exams").insert(record).execute()
    return response.data[0]

# 5. BİLDİRİMLER
@api_router.get("/student/{student_id}/notifications")
async def get_notifications(student_id: str, unread_only: bool = False):
    query = supabase.table("notifications").select("*").eq("user_id", student_id)
    
    if unread_only:
        query = query.eq("is_read", False)
    
    response = query.order("created_at", desc=True).limit(50).execute()
    return response.data

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    response = supabase.table("notifications").update({"is_read": True}).eq("id", notification_id).execute()
    return {"success": True}

@api_router.post("/notifications")
async def create_notification(data: Notification):
    record = {
        "id": str(uuid.uuid4()),
        "user_id": data.user_id,
        "type": data.type,
        "title": data.title,
        "message": data.message,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    response = supabase.table("notifications").insert(record).execute()
    return response.data[0]

# 6. GÜNLÜK RAPOR
@api_router.get("/student/{student_id}/reports/daily")
async def get_daily_report(student_id: str, date: str):
    from datetime import datetime as dt
    
    # Günlük soru çalışması
    soru_response = supabase.table("soru_takip").select("*").eq("student_id", student_id).eq("date", date).execute()
    
    # Günlük tamamlanan görevler
    tasks_response = supabase.table("tasks").select("*").eq("student_id", student_id).eq("tarih", date).execute()
    
    total_solved = sum(s["solved"] for s in soru_response.data)
    total_correct = sum(s["correct"] for s in soru_response.data)
    completed_tasks = [t for t in tasks_response.data if t.get("completed")]
    
    # En çok çalışılan ders
    lesson_counts = {}
    for s in soru_response.data:
        lesson = s["lesson"]
        lesson_counts[lesson] = lesson_counts.get(lesson, 0) + s["solved"]
    
    most_studied = max(lesson_counts.items(), key=lambda x: x[1])[0] if lesson_counts else "Yok"
    
    return {
        "date": date,
        "total_questions_solved": total_solved,
        "total_correct": total_correct,
        "accuracy_rate": (total_correct / total_solved * 100) if total_solved > 0 else 0,
        "completed_tasks": len(completed_tasks),
        "pending_tasks": len(tasks_response.data) - len(completed_tasks),
        "most_studied_lesson": most_studied
    }

@api_router.get("/student/{student_id}/reports/weekly")
async def get_weekly_report(student_id: str):
    """
    Son 7 günlük detaylı haftalık rapor
    """
    from datetime import date, timedelta
    
    today = date.today()
    week_ago = today - timedelta(days=7)
    
    # Son 7 günlük soru takip verileri
    soru_data = supabase.table("soru_takip").select("*").eq("student_id", student_id).gte("date", week_ago.isoformat()).lte("date", today.isoformat()).execute()
    
    # Günlük breakdown
    daily_data = {}
    for i in range(7):
        day = today - timedelta(days=6-i)
        daily_data[day.isoformat()] = {
            "date": day.isoformat(),
            "solved": 0,
            "correct": 0,
            "accuracy": 0,
            "lessons": []
        }
    
    # Ders bazında toplam
    lesson_totals = {}
    
    for record in soru_data.data:
        record_date = record["date"]
        if record_date in daily_data:
            daily_data[record_date]["solved"] += record["solved"]
            daily_data[record_date]["correct"] += record["correct"]
            daily_data[record_date]["lessons"].append(record["lesson"])
        
        # Ders toplamı
        lesson = record["lesson"]
        if lesson not in lesson_totals:
            lesson_totals[lesson] = {"solved": 0, "correct": 0}
        lesson_totals[lesson]["solved"] += record["solved"]
        lesson_totals[lesson]["correct"] += record["correct"]
    
    # Günlük başarı oranlarını hesapla
    for day_data in daily_data.values():
        if day_data["solved"] > 0:
            day_data["accuracy"] = round((day_data["correct"] / day_data["solved"]) * 100, 1)
    
    # Genel toplam
    total_solved = sum(s["solved"] for s in soru_data.data)
    total_correct = sum(s["correct"] for s in soru_data.data)
    overall_accuracy = round((total_correct / total_solved * 100), 1) if total_solved > 0 else 0
    
    # En çok çalışılan ders
    most_studied = max(lesson_totals.items(), key=lambda x: x[1]["solved"])[0] if lesson_totals else "Yok"
    
    # Trend (son 3 gün vs önceki 4 gün)
    recent_days = list(daily_data.values())[-3:]
    older_days = list(daily_data.values())[:4]
    
    recent_avg = sum(d["solved"] for d in recent_days) / 3
    older_avg = sum(d["solved"] for d in older_days) / 4
    
    trend = "Yükseliş" if recent_avg > older_avg else "Düşüş" if recent_avg < older_avg else "Sabit"
    
    return {
        "period": f"{week_ago.strftime('%d.%m.%Y')} - {today.strftime('%d.%m.%Y')}",
        "summary": {
            "total_solved": total_solved,
            "total_correct": total_correct,
            "accuracy_rate": overall_accuracy,
            "most_studied_lesson": most_studied,
            "trend": trend
        },
        "daily_breakdown": list(daily_data.values()),
        "lesson_breakdown": [
            {
                "lesson": lesson,
                "solved": data["solved"],
                "correct": data["correct"],
                "accuracy": round((data["correct"] / data["solved"] * 100), 1) if data["solved"] > 0 else 0
            }
            for lesson, data in lesson_totals.items()
        ]
    }

@api_router.get("/student/{student_id}/reports/monthly")
async def get_monthly_report(student_id: str):
    """
    Son 30 günlük aylık rapor
    """
    from datetime import date, timedelta
    
    today = date.today()
    month_ago = today - timedelta(days=30)
    
    # Son 30 günlük soru takip verileri
    soru_data = supabase.table("soru_takip").select("*").eq("student_id", student_id).gte("date", month_ago.isoformat()).lte("date", today.isoformat()).execute()
    
    # Haftalık breakdown (4 hafta)
    weekly_data = []
    for week in range(4):
        week_start = today - timedelta(days=(3-week)*7 + 6)
        week_end = today - timedelta(days=(3-week)*7)
        
        week_records = [r for r in soru_data.data if week_start.isoformat() <= r["date"] <= week_end.isoformat()]
        
        week_solved = sum(r["solved"] for r in week_records)
        week_correct = sum(r["correct"] for r in week_records)
        
        weekly_data.append({
            "week": f"Hafta {week + 1}",
            "period": f"{week_start.strftime('%d.%m')} - {week_end.strftime('%d.%m')}",
            "solved": week_solved,
            "correct": week_correct,
            "accuracy": round((week_correct / week_solved * 100), 1) if week_solved > 0 else 0
        })
    
    # Ders bazında aylık toplam
    lesson_totals = {}
    for record in soru_data.data:
        lesson = record["lesson"]
        if lesson not in lesson_totals:
            lesson_totals[lesson] = {"solved": 0, "correct": 0, "wrong": 0}
        lesson_totals[lesson]["solved"] += record["solved"]
        lesson_totals[lesson]["correct"] += record["correct"]
        lesson_totals[lesson]["wrong"] += record["wrong"]
    
    # Genel toplam
    total_solved = sum(s["solved"] for s in soru_data.data)
    total_correct = sum(s["correct"] for s in soru_data.data)
    overall_accuracy = round((total_correct / total_solved * 100), 1) if total_solved > 0 else 0
    
    # İlerleme (ilk 2 hafta vs son 2 hafta)
    first_half = weekly_data[:2]
    second_half = weekly_data[2:]
    
    first_avg = sum(w["solved"] for w in first_half) / 2
    second_avg = sum(w["solved"] for w in second_half) / 2
    
    improvement = round(((second_avg - first_avg) / first_avg * 100), 1) if first_avg > 0 else 0
    
    return {
        "period": f"{month_ago.strftime('%d.%m.%Y')} - {today.strftime('%d.%m.%Y')}",
        "summary": {
            "total_solved": total_solved,
            "total_correct": total_correct,
            "accuracy_rate": overall_accuracy,
            "improvement_rate": improvement
        },
        "weekly_breakdown": weekly_data,
        "lesson_breakdown": [
            {
                "lesson": lesson,
                "solved": data["solved"],
                "correct": data["correct"],
                "wrong": data["wrong"],
                "accuracy": round((data["correct"] / data["solved"] * 100), 1) if data["solved"] > 0 else 0
            }
            for lesson, data in lesson_totals.items()
        ]
    }

# ====================================
# FAZ 2: ANALİZ MOTORU
# ====================================

@api_router.get("/student/{student_id}/analysis")
async def get_student_analysis(student_id: str):
    """
    Öğrenci için kapsamlı analiz:
    - Zayıf konular (soru takip ve deneme sonuçlarına göre)
    - Ders bazında başarı oranları
    - Son 30 günlük trend
    """
    from datetime import date, timedelta
    
    # Son 30 günlük soru takip verileri
    thirty_days_ago = (date.today() - timedelta(days=30)).isoformat()
    soru_data = supabase.table("soru_takip").select("*").eq("student_id", student_id).gte("date", thirty_days_ago).execute()
    
    # Ders bazında analiz
    lesson_stats = {}
    for record in soru_data.data:
        lesson = record["lesson"]
        if lesson not in lesson_stats:
            lesson_stats[lesson] = {
                "lesson": lesson,
                "total_solved": 0,
                "total_correct": 0,
                "total_wrong": 0,
                "total_blank": 0,
                "accuracy_rate": 0
            }
        
        lesson_stats[lesson]["total_solved"] += record["solved"]
        lesson_stats[lesson]["total_correct"] += record["correct"]
        lesson_stats[lesson]["total_wrong"] += record["wrong"]
        lesson_stats[lesson]["total_blank"] += record["blank"]
    
    # Başarı oranlarını hesapla
    for lesson, stats in lesson_stats.items():
        if stats["total_solved"] > 0:
            stats["accuracy_rate"] = round((stats["total_correct"] / stats["total_solved"]) * 100, 1)
    
    # Zayıf konuları belirle (başarı oranı %60'ın altında olanlar)
    weak_lessons = [stats for stats in lesson_stats.values() if stats["accuracy_rate"] < 60 and stats["total_solved"] > 5]
    weak_lessons.sort(key=lambda x: x["accuracy_rate"])
    
    # Güçlü konular (başarı oranı %80'in üstünde olanlar)
    strong_lessons = [stats for stats in lesson_stats.values() if stats["accuracy_rate"] >= 80 and stats["total_solved"] > 5]
    strong_lessons.sort(key=lambda x: x["accuracy_rate"], reverse=True)
    
    # Genel istatistikler
    total_solved = sum(s["total_solved"] for s in lesson_stats.values())
    total_correct = sum(s["total_correct"] for s in lesson_stats.values())
    overall_accuracy = round((total_correct / total_solved * 100), 1) if total_solved > 0 else 0
    
    # Deneme sonuçlarını da ekle
    exams = supabase.table("exams").select("*").eq("student_id", student_id).order("tarih", desc=True).limit(5).execute()
    
    return {
        "student_id": student_id,
        "period": "Son 30 Gün",
        "overall_stats": {
            "total_solved": total_solved,
            "total_correct": total_correct,
            "accuracy_rate": overall_accuracy
        },
        "lesson_stats": list(lesson_stats.values()),
        "weak_lessons": weak_lessons,
        "strong_lessons": strong_lessons,
        "recent_exams": exams.data
    }

@api_router.get("/coach/students-analysis")
async def get_all_students_analysis():
    """
    Koç için tüm öğrencilerin analiz özeti
    """
    from datetime import date, timedelta
    
    students = supabase.table("students").select("*").execute()
    
    students_analysis = []
    for student in students.data:
        # Her öğrenci için temel analiz
        soru_data = supabase.table("soru_takip").select("*").eq("student_id", student["id"]).execute()
        
        total_solved = sum(s["solved"] for s in soru_data.data)
        total_correct = sum(s["correct"] for s in soru_data.data)
        accuracy = round((total_correct / total_solved * 100), 1) if total_solved > 0 else 0
        
        # Son aktivite tarihi
        last_activity = None
        if soru_data.data:
            last_activity = max(s["date"] for s in soru_data.data)
        
        students_analysis.append({
            "student_id": student["id"],
            "student_name": f"{student['ad']} {student.get('soyad', '')}".strip(),
            "bolum": student["bolum"],
            "total_questions": total_solved,
            "accuracy_rate": accuracy,
            "last_activity": last_activity,
            "needs_attention": accuracy < 60 or (last_activity and (date.today() - date.fromisoformat(last_activity)).days > 7)
        })
    
    # Dikkat gerektiren öğrencileri önce sırala
    students_analysis.sort(key=lambda x: (not x["needs_attention"], -x["accuracy_rate"]))
    
    return {
        "total_students": len(students_analysis),
        "students": students_analysis,
        "attention_needed": len([s for s in students_analysis if s["needs_attention"]])
    }

class BulkNotification(BaseModel):
    student_ids: List[str]
    type: str
    title: str
    message: str

@api_router.post("/coach/send-bulk-notification")
async def send_bulk_notification(data: BulkNotification):
    """
    Koç tarafından birden fazla öğrenciye bildirim gönderme
    """
    created_notifications = []
    
    for student_id in data.student_ids:
        record = {
            "id": str(uuid.uuid4()),
            "user_id": student_id,
            "type": data.type,
            "title": data.title,
            "message": data.message,
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        response = supabase.table("notifications").insert(record).execute()
        created_notifications.extend(response.data)
    
    return {
        "success": True,
        "notifications_sent": len(created_notifications),
        "notifications": created_notifications
    }

@api_router.get("/coach/reports/weekly-summary")
async def get_coach_weekly_summary():
    """
    Koç için haftalık özet rapor - tüm öğrencilerin performansı
    """
    from datetime import date, timedelta
    
    today = date.today()
    week_ago = today - timedelta(days=7)
    
    students = supabase.table("students").select("*").execute()
    
    students_summary = []
    total_questions = 0
    total_improved = 0
    total_declined = 0
    
    for student in students.data:
        # Öğrencinin haftalık verileri
        soru_data = supabase.table("soru_takip").select("*").eq("student_id", student["id"]).gte("date", week_ago.isoformat()).execute()
        
        if not soru_data.data:
            continue
        
        week_solved = sum(s["solved"] for s in soru_data.data)
        week_correct = sum(s["correct"] for s in soru_data.data)
        week_accuracy = round((week_correct / week_solved * 100), 1) if week_solved > 0 else 0
        
        # Önceki hafta ile karşılaştırma
        two_weeks_ago = week_ago - timedelta(days=7)
        prev_week_data = supabase.table("soru_takip").select("*").eq("student_id", student["id"]).gte("date", two_weeks_ago.isoformat()).lt("date", week_ago.isoformat()).execute()
        
        prev_week_solved = sum(s["solved"] for s in prev_week_data.data)
        prev_week_correct = sum(s["correct"] for s in prev_week_data.data)
        prev_accuracy = round((prev_week_correct / prev_week_solved * 100), 1) if prev_week_solved > 0 else 0
        
        change = week_accuracy - prev_accuracy
        
        if change > 5:
            total_improved += 1
            status = "improved"
        elif change < -5:
            total_declined += 1
            status = "declined"
        else:
            status = "stable"
        
        students_summary.append({
            "student_id": student["id"],
            "student_name": f"{student['ad']} {student.get('soyad', '')}".strip(),
            "questions_solved": week_solved,
            "accuracy_rate": week_accuracy,
            "change": change,
            "status": status
        })
        
        total_questions += week_solved
    
    # En çok gelişen ve gerileyen
    students_summary.sort(key=lambda x: x["change"], reverse=True)
    most_improved = students_summary[:3] if len(students_summary) >= 3 else students_summary
    most_declined = students_summary[-3:] if len(students_summary) >= 3 else []
    
    return {
        "period": f"{week_ago.strftime('%d.%m.%Y')} - {today.strftime('%d.%m.%Y')}",
        "summary": {
            "total_students": len(students_summary),
            "total_questions_solved": total_questions,
            "students_improved": total_improved,
            "students_declined": total_declined,
            "students_stable": len(students_summary) - total_improved - total_declined
        },
        "most_improved": most_improved,
        "most_declined": most_declined,
        "all_students": students_summary
    }

# ====================================
# DENEME ANALİZ SİSTEMİ
# ====================================

# Models
class ManualExamEntry(BaseModel):
    student_id: str
    exam_name: str
    exam_date: str
    exam_type: str  # "TYT" veya "AYT"
    subjects: List[Dict]

class TopicProgressUpdate(BaseModel):
    status: str

# Analyzer instance
exam_analyzer = ExamAnalyzer(api_key=os.environ.get('EMERGENT_LLM_KEY', ''))

@api_router.post("/exam/manual-entry")
async def manual_exam_entry(entry: ManualExamEntry):
    """
    Manuel deneme sonucu girişi (AI analizi YOK - koç tarafından tetiklenecek)
    """
    try:
        # Net hesapla
        calculation = exam_analyzer.calculate_net_from_manual(entry.subjects)
        
        # exam_uploads tablosuna kaydet
        upload_record = {
            "id": str(uuid.uuid4()),
            "student_id": entry.student_id,
            "uploaded_by": "student",
            "file_url": None,
            "file_type": "manual",
            "exam_date": entry.exam_date,
            "exam_name": entry.exam_name,
            "analysis_status": "pending",  # Analiz bekliyor
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        upload_response = supabase.table("exam_uploads").insert(upload_record).execute()
        upload_id = upload_response.data[0]["id"]
        
        # exam_analysis tablosuna temel veriyi kaydet (AI analizi sonra)
        analysis_record = {
            "id": str(uuid.uuid4()),
            "upload_id": upload_id,
            "student_id": entry.student_id,
            "total_net": calculation["total_net"],
            "subject_breakdown": json.dumps(calculation["subjects"]),
            "topic_breakdown": json.dumps(entry.subjects),
            "weak_topics": json.dumps([]),
            "recommendations": "Analiz bekleniyor. Koç tarafından analiz edilecek.",
            "ai_raw_response": json.dumps({
                "exam_name": entry.exam_name,
                "exam_type": entry.exam_type,
                "subjects": entry.subjects
            }),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        supabase.table("exam_analysis").insert(analysis_record).execute()
        
        # Bildirim gönder
        notification_record = {
            "id": str(uuid.uuid4()),
            "user_id": entry.student_id,
            "type": "success",
            "title": "Deneme Kaydedildi",
            "message": f"{entry.exam_name} denemesi başarıyla kaydedildi. Toplam net: {calculation['total_net']}",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        supabase.table("notifications").insert(notification_record).execute()
        
        return {
            "success": True,
            "upload_id": upload_id,
            "calculation": calculation
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/exam/trigger-analysis/{upload_id}")
async def trigger_analysis(upload_id: str):
    """
    Koç tarafından AI analizi tetikleme
    """
    try:
        # Upload kaydını bul
        upload = supabase.table("exam_uploads").select("*").eq("id", upload_id).execute()
        if not upload.data:
            raise HTTPException(status_code=404, detail="Deneme bulunamadı")
        
        upload_data = upload.data[0]
        
        # Mevcut analizi bul
        analysis = supabase.table("exam_analysis").select("*").eq("upload_id", upload_id).execute()
        if not analysis.data:
            raise HTTPException(status_code=404, detail="Analiz kaydı bulunamadı")
        
        analysis_data = analysis.data[0]
        
        # AI analiz yap
        exam_data = json.loads(analysis_data["ai_raw_response"])
        ai_result = await exam_analyzer.analyze_exam_text(exam_data)
        ai_analysis = ai_result.get("ai_analysis", "Analiz yapılamadı")
        
        # Zayıf konuları belirle
        weak_topics = []
        strong_topics = []
        
        for subject in exam_data.get('subjects', []):
            for topic in subject.get('topics', []):
                total = topic.get('total', 0)
                correct = topic.get('correct', 0)
                wrong = topic.get('wrong', 0)
                
                if total > 0:
                    accuracy = (correct / total) * 100
                    topic_info = f"{subject['name']} - {topic['name']}"
                    
                    if accuracy < 60 or wrong >= 3:
                        weak_topics.append(topic_info)
                    elif accuracy >= 80:
                        strong_topics.append(topic_info)
        
        # Analizi güncelle
        supabase.table("exam_analysis").update({
            "weak_topics": json.dumps(weak_topics),
            "recommendations": ai_analysis
        }).eq("id", analysis_data["id"]).execute()
        
        # Upload status güncelle
        supabase.table("exam_uploads").update({
            "analysis_status": "completed"
        }).eq("id", upload_id).execute()
        
        # Öğrenciye bildirim gönder
        notification_record = {
            "id": str(uuid.uuid4()),
            "user_id": upload_data["student_id"],
            "type": "info",
            "title": "Deneme Analizi Tamamlandı",
            "message": f"{upload_data['exam_name']} denemesi için AI analizi tamamlandı.",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        supabase.table("notifications").insert(notification_record).execute()
        
        return {
            "success": True,
            "weak_topics": weak_topics,
            "strong_topics": strong_topics,
            "ai_analysis": ai_analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/exam/student-exams/{student_id}")
async def get_student_exams(student_id: str):
    """
    Öğrencinin tüm denemelerini getir
    """
    try:
        # Uploads getir
        uploads = supabase.table("exam_uploads").select("*").eq("student_id", student_id).order("created_at", desc=True).execute()
        
        results = []
        for upload in uploads.data:
            # İlgili analizi getir
            analysis = supabase.table("exam_analysis").select("*").eq("upload_id", upload["id"]).execute()
            
            result = {
                "upload": upload,
                "analysis": analysis.data[0] if analysis.data else None
            }
            results.append(result)
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/exam/coach-overview")
async def get_coach_exam_overview():
    """
    Koç için tüm öğrencilerin denemelerini getir
    """
    try:
        # Tüm uploads
        uploads = supabase.table("exam_uploads").select("*").order("created_at", desc=True).limit(50).execute()
        
        results = []
        for upload in uploads.data:
            # Öğrenci bilgisi
            student = supabase.table("students").select("*").eq("id", upload["student_id"]).execute()
            
            # Analiz
            analysis = supabase.table("exam_analysis").select("*").eq("upload_id", upload["id"]).execute()
            
            result = {
                "upload": upload,
                "student": student.data[0] if student.data else None,
                "analysis": analysis.data[0] if analysis.data else None
            }
            results.append(result)
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/topic-progress/{student_id}")
async def get_topic_progress(student_id: str):
    """
    Öğrencinin konu ilerleme durumunu getir
    """
    try:
        progress = supabase.table("topic_progress").select("*").eq("student_id", student_id).execute()
        return progress.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/topic-progress/{progress_id}")
async def update_topic_progress(progress_id: str, update: TopicProgressUpdate):
    """
    Konu ilerleme durumunu güncelle
    """
    try:
        response = supabase.table("topic_progress").update({
            "status": update.status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", progress_id).execute()
        
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/topic-progress")
async def create_topic_progress(student_id: str, topic_id: str, subject: str, topic_name: str, status: str = "cozulmedi"):
    """
    Yeni konu ilerleme kaydı oluştur
    """
    try:
        record = {
            "id": str(uuid.uuid4()),
            "student_id": student_id,
            "topic_id": topic_id,
            "subject": subject,
            "topic_name": topic_name,
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        response = supabase.table("topic_progress").insert(record).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


