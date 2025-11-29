from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
from supabase import create_client, Client
from tyt_ayt_topics import TYT_TOPICS, AYT_SAYISAL, AYT_ESIT_AGIRLIK, AYT_SOZEL

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

class StudentResponse(BaseModel):
    id: str
    ad: str
    soyad: Optional[str] = None
    bolum: str
    hedef: Optional[str] = None
    notlar: Optional[str] = None
    token: str
    created_at: str

class TopicCreate(BaseModel):
    student_id: str
    ders: str
    konu: str
    durum: str = "baslanmadi"
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

# Coach Authentication
@api_router.post("/coach/login", response_model=CoachLoginResponse)
async def coach_login(login: CoachLogin):
    # Simple password check (in production, use proper password hash)
    if login.password == "coach2025":
        return CoachLoginResponse(success=True, token="coach-token-12345")
    raise HTTPException(status_code=401, detail="Şifre hatalı")

# Students
@api_router.get("/students")
async def get_students():
    response = supabase.table("students").select("*").execute()
    return response.data

@api_router.post("/students", response_model=dict)
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
    # Delete related data first
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
    """Initialize default TYT and AYT topics for a student"""
    topics = []
    
    # Normalize bolum name
    bolum_normalized = bolum.strip().lower()
    if 'sayisal' in bolum_normalized or 'sayısal' in bolum_normalized:
        bolum = "Sayısal"
    elif 'esit' in bolum_normalized or 'eşit' in bolum_normalized:
        bolum = "Eşit Ağırlık"
    elif 'sozel' in bolum_normalized or 'sözel' in bolum_normalized:
        bolum = "Sözel"
    
    order_index = 0
    
    # Add TYT Topics for all students
    for ders_name, konu_list in TYT_TOPICS.items():
        for konu in konu_list:
            data = {
                "id": str(uuid.uuid4()),
                "student_id": student_id,
                "ders": f"TYT - {ders_name}",
                "konu": konu,
                "durum": "baslanmadi",
                "order_index": order_index,
                "sinav_turu": "TYT"
            }
            response = supabase.table("topics").insert(data).execute()
            topics.extend(response.data)
            order_index += 1
    
    # Add AYT Topics based on bolum
    ayt_topics_dict = {
        # Türkçe (40 soru)
        {"ders": "Türkçe", "konu": "Ses Bilgisi"},
        {"ders": "Türkçe", "konu": "Yazım Kuralları"},
        {"ders": "Türkçe", "konu": "Noktalama İşaretleri"},
        {"ders": "Türkçe", "konu": "Sözcükte Anlam"},
        {"ders": "Türkçe", "konu": "Cümlede Anlam"},
        {"ders": "Türkçe", "konu": "Paragraf"},
        {"ders": "Türkçe", "konu": "Anlatım Biçimleri"},
        {"ders": "Türkçe", "konu": "Fiilimsiler"},
        {"ders": "Türkçe", "konu": "Cümle Çeşitleri"},
        
        # Matematik (40 soru)
        {"ders": "Matematik", "konu": "Temel Kavramlar"},
        {"ders": "Matematik", "konu": "Sayılar"},
        {"ders": "Matematik", "konu": "Rasyonel Sayılar"},
        {"ders": "Matematik", "konu": "Üslü Sayılar"},
        {"ders": "Matematik", "konu": "Köklü Sayılar"},
        {"ders": "Matematik", "konu": "Çarpanlara Ayırma"},
        {"ders": "Matematik", "konu": "Denklemler"},
        {"ders": "Matematik", "konu": "Eşitsizlikler"},
        {"ders": "Matematik", "konu": "Mutlak Değer"},
        {"ders": "Matematik", "konu": "Üslü ve Köklü Sayılar"},
        {"ders": "Matematik", "konu": "Oran-Orantı"},
        {"ders": "Matematik", "konu": "Dört İşlem"},
        {"ders": "Matematik", "konu": "Kümeler"},
        {"ders": "Matematik", "konu": "Fonksiyonlar"},
        {"ders": "Matematik", "konu": "İkinci Dereceden Denklemler"},
        {"ders": "Matematik", "konu": "Permütasyon"},
        {"ders": "Matematik", "konu": "Kombinasyon"},
        {"ders": "Matematik", "konu": "Olasılık"},
        {"ders": "Matematik", "konu": "Geometri - Temel Kavramlar"},
        {"ders": "Matematik", "konu": "Üçgenler"},
        {"ders": "Matematik", "konu": "Çember"},
        {"ders": "Matematik", "konu": "Analitik Geometri"},
        
        # Sosyal Bilimler (20 soru - Tarih 5, Coğrafya 5, Felsefe 5, Din 5)
        {"ders": "Tarih", "konu": "İslam Öncesi Türk Tarihi"},
        {"ders": "Tarih", "konu": "İlk Türk İslam Devletleri"},
        {"ders": "Tarih", "konu": "Türkiye Selçukluları"},
        {"ders": "Tarih", "konu": "Osmanlı Kuruluş Dönemi"},
        {"ders": "Tarih", "konu": "Osmanlı Yükselme Dönemi"},
        {"ders": "Tarih", "konu": "Osmanlı Duraklama ve Gerileme"},
        {"ders": "Tarih", "konu": "Osmanlı Yenileşme Hareketleri"},
        {"ders": "Tarih", "konu": "Osmanlı Dağılma Dönemi"},
        {"ders": "Tarih", "konu": "Milli Mücadele"},
        {"ders": "Tarih", "konu": "Atatürk İlkeleri"},
        
        {"ders": "Coğrafya", "konu": "Doğa ve İnsan"},
        {"ders": "Coğrafya", "konu": "Harita Bilgisi"},
        {"ders": "Coğrafya", "konu": "Dünya'nın Şekli"},
        {"ders": "Coğrafya", "konu": "İklim"},
        {"ders": "Coğrafya", "konu": "Nüfus"},
        {"ders": "Coğrafya", "konu": "Yerşekilleri"},
        {"ders": "Coğrafya", "konu": "Türkiye'nin Coğrafi Konumu"},
        {"ders": "Coğrafya", "konu": "Türkiye'nin İklimi"},
        {"ders": "Coğrafya", "konu": "Doğal Afetler"},
        
        {"ders": "Felsefe", "konu": "Felsefe ve Mitoloji"},
        {"ders": "Felsefe", "konu": "Bilgi Felsefesi"},
        {"ders": "Felsefe", "konu": "Bilim Felsefesi"},
        {"ders": "Felsefe", "konu": "Ahlak Felsefesi"},
        {"ders": "Felsefe", "konu": "Sanat Felsefesi"},
        {"ders": "Felsefe", "konu": "Din Felsefesi"},
        {"ders": "Felsefe", "konu": "Siyaset Felsefesi"},
        
        {"ders": "Din", "konu": "İslam'ın Şartları"},
        {"ders": "Din", "konu": "İbadet"},
        {"ders": "Din", "konu": "Hz. Muhammed'in Hayatı"},
        {"ders": "Din", "konu": "Kur'an"},
        {"ders": "Din", "konu": "Ahlak"},
        
        # Fen Bilimleri (20 soru - Fizik 7, Kimya 7, Biyoloji 6)
        {"ders": "Fizik", "konu": "Fizik Bilimine Giriş"},
        {"ders": "Fizik", "konu": "Madde ve Özellikleri"},
        {"ders": "Fizik", "konu": "Hareket"},
        {"ders": "Fizik", "konu": "Kuvvet ve Hareket"},
        {"ders": "Fizik", "konu": "Enerji"},
        {"ders": "Fizik", "konu": "İş - Güç - Enerji"},
        {"ders": "Fizik", "konu": "Isı ve Sıcaklık"},
        {"ders": "Fizik", "konu": "Elektrostatik"},
        {"ders": "Fizik", "konu": "Dalgalar"},
        
        {"ders": "Kimya", "konu": "Kimyanın Temel Kanunları"},
        {"ders": "Kimya", "konu": "Atom ve Periyodik Sistem"},
        {"ders": "Kimya", "konu": "Kimyasal Türler"},
        {"ders": "Kimya", "konu": "Kimyasal Tepkimeler"},
        {"ders": "Kimya", "konu": "Maddenin Halleri"},
        {"ders": "Kimya", "konu": "Çözeltiler"},
        {"ders": "Kimya", "konu": "Asitler ve Bazlar"},
        {"ders": "Kimya", "konu": "Kimyasal Hesaplamalar"},
        
        {"ders": "Biyoloji", "konu": "Hücre"},
        {"ders": "Biyoloji", "konu": "Hücre Bölünmeleri"},
        {"ders": "Biyoloji", "konu": "Mitoz"},
        {"ders": "Biyoloji", "konu": "Mayoz"},
        {"ders": "Biyoloji", "konu": "Canlılarda Enerji"},
        {"ders": "Biyoloji", "konu": "Sinir Sistemi"},
        {"ders": "Biyoloji", "konu": "Duyu Organları"},
        {"ders": "Biyoloji", "konu": "Bitki Biyolojisi"},
    ]
    
    for idx, topic in enumerate(tyt_topics):
        data = {
            "id": str(uuid.uuid4()),
            "student_id": student_id,
            "ders": topic["ders"],
            "konu": topic["konu"],
            "durum": "baslanmadi",
            "order_index": idx
        }
        response = supabase.table("topics").insert(data).execute()
        topics.extend(response.data)
    
    # AYT Topics based on bolum - GÜNCEL MÜFREDAT
    if bolum == "Sayısal":
        ayt_topics = [
            # Matematik (40 soru)
            {"ders": "Matematik AYT", "konu": "Trigonometri"},
            {"ders": "Matematik AYT", "konu": "Fonksiyonlar"},
            {"ders": "Matematik AYT", "konu": "Polinomlar"},
            {"ders": "Matematik AYT", "konu": "Logaritma"},
            {"ders": "Matematik AYT", "konu": "Diziler"},
            {"ders": "Matematik AYT", "konu": "Limit ve Süreklilik"},
            {"ders": "Matematik AYT", "konu": "Türev"},
            {"ders": "Matematik AYT", "konu": "İntegral"},
            {"ders": "Matematik AYT", "konu": "Olasılık"},
            {"ders": "Matematik AYT", "konu": "Karmaşık Sayılar"},
            {"ders": "Matematik AYT", "konu": "Parabol"},
            {"ders": "Matematik AYT", "konu": "Çember ve Daire"},
            {"ders": "Matematik AYT", "konu": "Katı Cisimler"},
            
            # Fizik (14 soru)
            {"ders": "Fizik AYT", "konu": "Elektrik ve Manyetizma"},
            {"ders": "Fizik AYT", "konu": "Elektrik Akımı"},
            {"ders": "Fizik AYT", "konu": "Manyetik Alan"},
            {"ders": "Fizik AYT", "konu": "Elektromanyetik İndüksiyon"},
            {"ders": "Fizik AYT", "konu": "Alternatif Akım"},
            {"ders": "Fizik AYT", "konu": "Atom Fiziği"},
            {"ders": "Fizik AYT", "konu": "Modern Fizik"},
            {"ders": "Fizik AYT", "konu": "Optik"},
            {"ders": "Fizik AYT", "konu": "Dalgalar"},
            {"ders": "Fizik AYT", "konu": "Kuvvet ve Hareket"},
            
            # Kimya (13 soru)
            {"ders": "Kimya AYT", "konu": "Kimyasal Tepkimelerde Enerji"},
            {"ders": "Kimya AYT", "konu": "Kimyasal Tepkimelerde Hız"},
            {"ders": "Kimya AYT", "konu": "Kimyasal Tepkimelerde Denge"},
            {"ders": "Kimya AYT", "konu": "Asit Baz Dengesi"},
            {"ders": "Kimya AYT", "konu": "Çözünürlük Dengesi"},
            {"ders": "Kimya AYT", "konu": "Elektrokimya"},
            {"ders": "Kimya AYT", "konu": "Karbon Kimyasına Giriş"},
            {"ders": "Kimya AYT", "konu": "Organik Bileşikler"},
            {"ders": "Kimya AYT", "konu": "Enerji Kaynakları"},
            
            # Biyoloji (13 soru)
            {"ders": "Biyoloji AYT", "konu": "Canlılarda Enerji Dönüşümleri"},
            {"ders": "Biyoloji AYT", "konu": "Fotosentez"},
            {"ders": "Biyoloji AYT", "konu": "Solunum"},
            {"ders": "Biyoloji AYT", "konu": "Bitki Biyolojisi"},
            {"ders": "Biyoloji AYT", "konu": "Kalıtım"},
            {"ders": "Biyoloji AYT", "konu": "Genetik Şifre"},
            {"ders": "Biyoloji AYT", "konu": "Canlıların Sınıflandırılması"},
            {"ders": "Biyoloji AYT", "konu": "Ekosistem Ekolojisi"},
            {"ders": "Biyoloji AYT", "konu": "Popülasyon Ekolojisi"},
            {"ders": "Biyoloji AYT", "konu": "Evrim"},
        ]
        for idx, topic in enumerate(ayt_topics):
            data = {
                "id": str(uuid.uuid4()),
                "student_id": student_id,
                "ders": topic["ders"],
                "konu": topic["konu"],
                "durum": "baslanmadi",
                "order_index": len(tyt_topics) + idx
            }
            response = supabase.table("topics").insert(data).execute()
            topics.extend(response.data)
    
    elif bolum == "Eşit Ağırlık":
        ayt_topics = [
            # Matematik (40 soru)
            {"ders": "Matematik AYT", "konu": "Trigonometri"},
            {"ders": "Matematik AYT", "konu": "Fonksiyonlar"},
            {"ders": "Matematik AYT", "konu": "Polinomlar"},
            {"ders": "Matematik AYT", "konu": "Logaritma"},
            {"ders": "Matematik AYT", "konu": "Diziler"},
            {"ders": "Matematik AYT", "konu": "Limit ve Süreklilik"},
            {"ders": "Matematik AYT", "konu": "Türev"},
            {"ders": "Matematik AYT", "konu": "İntegral"},
            
            # Edebiyat (24 soru)
            {"ders": "Edebiyat", "konu": "Türk Edebiyatının Dönemleri"},
            {"ders": "Edebiyat", "konu": "Tanzimat Edebiyatı"},
            {"ders": "Edebiyat", "konu": "Servetifünun Edebiyatı"},
            {"ders": "Edebiyat", "konu": "Fecri Ati Edebiyatı"},
            {"ders": "Edebiyat", "konu": "Milli Edebiyat"},
            {"ders": "Edebiyat", "konu": "Cumhuriyet Dönemi Edebiyatı"},
            {"ders": "Edebiyat", "konu": "Şiir İncelemesi"},
            {"ders": "Edebiyat", "konu": "Hikaye ve Roman"},
            {"ders": "Edebiyat", "konu": "Tiyatro"},
            {"ders": "Edebiyat", "konu": "Deneme"},
            
            # Tarih-1 (10 soru)
            {"ders": "Tarih-1", "konu": "Osmanlı Tarihi"},
            {"ders": "Tarih-1", "konu": "Osmanlı Kültür ve Medeniyeti"},
            {"ders": "Tarih-1", "konu": "Osmanlı Devleti'nin Dağılma Süreci"},
            {"ders": "Tarih-1", "konu": "XIX. Yüzyılda Osmanlı"},
            {"ders": "Tarih-1", "konu": "Milli Mücadele"},
            
            # Coğrafya-1 (6 soru)
            {"ders": "Coğrafya-1", "konu": "Türkiye'nin Coğrafi Konumu"},
            {"ders": "Coğrafya-1", "konu": "Türkiye'nin Fiziki Coğrafyası"},
            {"ders": "Coğrafya-1", "konu": "Türkiye'nin Beşeri Coğrafyası"},
            {"ders": "Coğrafya-1", "konu": "Türkiye'nin İklimi"},
            {"ders": "Coğrafya-1", "konu": "Bölgeler Coğrafyası"},
        ]
        for idx, topic in enumerate(ayt_topics):
            data = {
                "id": str(uuid.uuid4()),
                "student_id": student_id,
                "ders": topic["ders"],
                "konu": topic["konu"],
                "durum": "baslanmadi",
                "order_index": len(tyt_topics) + idx
            }
            response = supabase.table("topics").insert(data).execute()
            topics.extend(response.data)
    
    elif bolum == "Sözel":
        ayt_topics = [
            # Edebiyat (24 soru)
            {"ders": "Edebiyat", "konu": "Türk Edebiyatının Dönemleri"},
            {"ders": "Edebiyat", "konu": "İslamiyet Öncesi Türk Edebiyatı"},
            {"ders": "Edebiyat", "konu": "İslamiyet Sonrası Türk Edebiyatı"},
            {"ders": "Edebiyat", "konu": "Divan Edebiyatı"},
            {"ders": "Edebiyat", "konu": "Halk Edebiyatı"},
            {"ders": "Edebiyat", "konu": "Tanzimat Edebiyatı"},
            {"ders": "Edebiyat", "konu": "Servetifünun Edebiyatı"},
            {"ders": "Edebiyat", "konu": "Fecri Ati Edebiyatı"},
            {"ders": "Edebiyat", "konu": "Milli Edebiyat"},
            {"ders": "Edebiyat", "konu": "Cumhuriyet Dönemi Edebiyatı"},
            {"ders": "Edebiyat", "konu": "Şiir İncelemesi"},
            {"ders": "Edebiyat", "konu": "Hikaye ve Roman"},
            {"ders": "Edebiyat", "konu": "Tiyatro"},
            
            # Tarih-1 (10 soru)
            {"ders": "Tarih-1", "konu": "Osmanlı Tarihi"},
            {"ders": "Tarih-1", "konu": "Osmanlı Kültür ve Medeniyeti"},
            {"ders": "Tarih-1", "konu": "Osmanlı Devleti'nin Dağılma Süreci"},
            {"ders": "Tarih-1", "konu": "XIX. Yüzyılda Osmanlı"},
            {"ders": "Tarih-1", "konu": "Milli Mücadele"},
            
            # Coğrafya-1 (6 soru)
            {"ders": "Coğrafya-1", "konu": "Türkiye'nin Coğrafi Konumu"},
            {"ders": "Coğrafya-1", "konu": "Türkiye'nin Fiziki Coğrafyası"},
            {"ders": "Coğrafya-1", "konu": "Türkiye'nin Beşeri Coğrafyası"},
            {"ders": "Coğrafya-1", "konu": "Türkiye'nin İklimi"},
            
            # Tarih-2 (11 soru)
            {"ders": "Tarih-2", "konu": "Atatürk İlkeleri"},
            {"ders": "Tarih-2", "konu": "Türkiye Cumhuriyeti Tarihi"},
            {"ders": "Tarih-2", "konu": "İnkılap Tarihi"},
            {"ders": "Tarih-2", "konu": "Çağdaş Türk ve Dünya Tarihi"},
            {"ders": "Tarih-2", "konu": "Savaşlar Arası Dönem"},
            {"ders": "Tarih-2", "konu": "İkinci Dünya Savaşı"},
            {"ders": "Tarih-2", "konu": "Soğuk Savaş Dönemi"},
            
            # Coğrafya-2 (11 soru)
            {"ders": "Coğrafya-2", "konu": "Çevre ve Toplum"},
            {"ders": "Coğrafya-2", "konu": "Doğal Sistemler"},
            {"ders": "Coğrafya-2", "konu": "Ülkeler Coğrafyası"},
            {"ders": "Coğrafya-2", "konu": "Küresel Ortam"},
            {"ders": "Coğrafya-2", "konu": "Bölgeler Coğrafyası"},
            
            # Felsefe (12 soru)
            {"ders": "Felsefe", "konu": "Felsefeye Giriş"},
            {"ders": "Felsefe", "konu": "Bilgi Felsefesi"},
            {"ders": "Felsefe", "konu": "Bilim Felsefesi"},
            {"ders": "Felsefe", "konu": "Ahlak Felsefesi"},
            {"ders": "Felsefe", "konu": "Sanat Felsefesi"},
            {"ders": "Felsefe", "konu": "Din Felsefesi"},
            {"ders": "Felsefe", "konu": "Siyaset Felsefesi"},
            {"ders": "Felsefe", "konu": "Mantık"},
            
            # Din Kültürü (6 soru)
            {"ders": "Din", "konu": "İslam Düşüncesi"},
            {"ders": "Din", "konu": "Din Psikolojisi"},
            {"ders": "Din", "konu": "Din Sosyolojisi"},
            {"ders": "Din", "konu": "İslam ve Bilim"},
        ]
        for idx, topic in enumerate(ayt_topics):
            data = {
                "id": str(uuid.uuid4()),
                "student_id": student_id,
                "ders": topic["ders"],
                "konu": topic["konu"],
                "durum": "baslanmadi",
                "order_index": len(tyt_topics) + idx
            }
            response = supabase.table("topics").insert(data).execute()
            topics.extend(response.data)
    
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
        "completed": task.completed
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
    # Calculate net for each exam
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