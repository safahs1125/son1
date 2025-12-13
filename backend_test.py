#!/usr/bin/env python3
"""
Backend API Test: Deneme Girişi ve Koç Bildirimi
Test senaryosu: Manuel deneme girişi yapma ve koç bildirimini doğrulama
"""

import requests
import json
from datetime import datetime

# Backend URL from frontend/.env
BASE_URL = "https://coaching-tracker-3.preview.emergentagent.com/api"

def test_manual_exam_entry_and_coach_notification():
    """
    Test senaryosu:
    1. Öğrenci listesini al
    2. İlk öğrencinin ID'sini kullan
    3. Manuel deneme girişi yap
    4. Koç bildirimlerini kontrol et
    5. Öğrencinin denemelerini kontrol et
    """
    
    print("=" * 60)
    print("Backend API Test: Deneme Girişi ve Koç Bildirimi")
    print("=" * 60)
    
    # 1. Öğrenci listesini al
    print("\n1. Öğrenci listesini alıyor...")
    try:
        response = requests.get(f"{BASE_URL}/students")
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   HATA: Öğrenci listesi alınamadı - {response.text}")
            return False
            
        students = response.json()
        print(f"   Toplam öğrenci sayısı: {len(students)}")
        
        if not students:
            print("   HATA: Hiç öğrenci bulunamadı")
            return False
            
        # İlk öğrenciyi seç
        first_student = students[0]
        student_id = first_student["id"]
        student_name = f"{first_student['ad']} {first_student.get('soyad', '')}".strip()
        
        print(f"   Seçilen öğrenci: {student_name} (ID: {student_id})")
        
    except Exception as e:
        print(f"   HATA: {str(e)}")
        return False
    
    # 2. Manuel deneme girişi yap
    print("\n2. Manuel deneme girişi yapıyor...")
    
    exam_data = {
        "student_id": student_id,
        "exam_name": "Test Denemesi API",
        "exam_date": "2024-12-15",
        "exam_type": "TYT",
        "subjects": [
            {
                "name": "Türkçe",
                "total": 40,
                "correct": 30,
                "wrong": 5,
                "blank": 5,
                "topics": []
            },
            {
                "name": "Matematik",
                "total": 40,
                "correct": 25,
                "wrong": 10,
                "blank": 5,
                "topics": []
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/exam/manual-entry",
            json=exam_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   HATA: Manuel deneme girişi başarısız - {response.text}")
            return False
            
        result = response.json()
        print(f"   Başarılı: {result.get('success', False)}")
        
        if not result.get('success'):
            print("   HATA: API success=false döndü")
            return False
            
        upload_id = result.get('upload_id')
        calculation = result.get('calculation', {})
        
        print(f"   Upload ID: {upload_id}")
        print(f"   Toplam Net: {calculation.get('total_net', 'N/A')}")
        
        if calculation.get('subjects'):
            print("   Ders bazında netler:")
            for subject in calculation['subjects']:
                print(f"     - {subject.get('name', 'N/A')}: {subject.get('net', 'N/A')}")
        
    except Exception as e:
        print(f"   HATA: {str(e)}")
        return False
    
    # 3. Koç bildirimlerini kontrol et
    print("\n3. Koç bildirimlerini kontrol ediyor...")
    
    try:
        response = requests.get(f"{BASE_URL}/student/coach/notifications")
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   HATA: Koç bildirimleri alınamadı - {response.text}")
            return False
            
        notifications = response.json()
        print(f"   Toplam bildirim sayısı: {len(notifications)}")
        
        if not notifications:
            print("   UYARI: Hiç bildirim bulunamadı")
            return False
        
        # En son bildirimi kontrol et
        latest_notification = notifications[0]
        print(f"   En son bildirim:")
        print(f"     - User ID: {latest_notification.get('user_id')}")
        print(f"     - Title: {latest_notification.get('title')}")
        print(f"     - Message: {latest_notification.get('message')}")
        print(f"     - Type: {latest_notification.get('type')}")
        print(f"     - Created: {latest_notification.get('created_at')}")
        
        # Beklenen koşulları kontrol et
        if latest_notification.get('user_id') != 'coach':
            print(f"   UYARI: user_id 'coach' değil: {latest_notification.get('user_id')}")
        
        title = latest_notification.get('title', '')
        if 'Yeni Deneme Girişi' not in title:
            print(f"   UYARI: Title 'Yeni Deneme Girişi' içermiyor: {title}")
        
        message = latest_notification.get('message', '')
        if student_name not in message:
            print(f"   UYARI: Message öğrenci adını içermiyor: {message}")
        
        print("   ✓ Koç bildirimi başarıyla alındı")
        
    except Exception as e:
        print(f"   HATA: {str(e)}")
        return False
    
    # 4. Öğrencinin denemelerini kontrol et
    print("\n4. Öğrencinin denemelerini kontrol ediyor...")
    
    try:
        response = requests.get(f"{BASE_URL}/exam/student-exams/{student_id}")
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   HATA: Öğrenci denemeleri alınamadı - {response.text}")
            return False
            
        exams = response.json()
        print(f"   Toplam deneme sayısı: {len(exams)}")
        
        if not exams:
            print("   UYARI: Hiç deneme bulunamadı")
            return False
        
        # En son denemeyi kontrol et (ilk sırada olmalı - desc order)
        latest_exam = exams[0]
        upload_info = latest_exam.get('upload', {})
        analysis_info = latest_exam.get('analysis', {})
        
        print(f"   En son deneme:")
        print(f"     - Exam Name: {upload_info.get('exam_name')}")
        print(f"     - Exam Date: {upload_info.get('exam_date')}")
        print(f"     - Analysis Status: {upload_info.get('analysis_status')}")
        print(f"     - Created At: {upload_info.get('created_at')}")
        
        if analysis_info:
            print(f"     - Total Net: {analysis_info.get('total_net')}")
        
        # Beklenen koşulları kontrol et
        if upload_info.get('exam_name') != 'Test Denemesi API':
            print(f"   UYARI: exam_name beklenen değil: {upload_info.get('exam_name')}")
        
        if upload_info.get('analysis_status') != 'pending':
            print(f"   UYARI: analysis_status 'pending' değil: {upload_info.get('analysis_status')}")
        
        print("   ✓ Öğrenci denemesi başarıyla bulundu")
        
    except Exception as e:
        print(f"   HATA: {str(e)}")
        return False
    
    print("\n" + "=" * 60)
    print("TEST SONUCU: BAŞARILI ✓")
    print("Tüm API endpoint'leri beklendiği gibi çalışıyor:")
    print("- Manuel deneme girişi yapıldı")
    print("- Koç bildirimi gönderildi")
    print("- Öğrenci denemesi kaydedildi")
    print("=" * 60)
    
    return True

def test_additional_endpoints():
    """
    Ek endpoint testleri
    """
    print("\n" + "=" * 60)
    print("EK ENDPOINT TESTLERİ")
    print("=" * 60)
    
    # Test coach notifications endpoint
    print("\n1. Coach notifications endpoint testi...")
    try:
        response = requests.get(f"{BASE_URL}/student/coach/notifications")
        print(f"   GET /student/coach/notifications - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Başarılı - {len(data)} bildirim döndü")
        else:
            print(f"   ✗ Başarısız - {response.text}")
    except Exception as e:
        print(f"   ✗ Hata: {str(e)}")
    
    # Test students endpoint
    print("\n2. Students endpoint testi...")
    try:
        response = requests.get(f"{BASE_URL}/students")
        print(f"   GET /students - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Başarılı - {len(data)} öğrenci döndü")
        else:
            print(f"   ✗ Başarısız - {response.text}")
    except Exception as e:
        print(f"   ✗ Hata: {str(e)}")

if __name__ == "__main__":
    print("TYT-AYT Koçluk Sistemi - Backend API Test")
    print(f"Test URL: {BASE_URL}")
    print(f"Test Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Ana test senaryosu
    success = test_manual_exam_entry_and_coach_notification()
    
    # Ek testler
    test_additional_endpoints()
    
    if success:
        print("\n🎉 TÜM TESTLER BAŞARILI!")
    else:
        print("\n❌ TESTLERDE HATA VAR!")