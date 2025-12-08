"""
Deneme Sonuç Analiz Modülü
AI Vision ile PDF/görsel analizi ve manuel veri girişi
"""
import os
import json
import base64
from typing import Dict, List, Optional
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType


class ExamAnalyzer:
    """Deneme sonuçlarını analiz eden sınıf"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        
    async def analyze_exam_document(self, file_path: str, file_type: str) -> Dict:
        """
        PDF veya görsel dosyasından deneme sonuçlarını çıkarır
        
        Args:
            file_path: Dosya yolu
            file_type: 'pdf' veya 'image'
            
        Returns:
            Analiz sonucu (JSON format)
        """
        
        # Vision chat oluştur
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"exam-analysis-{datetime.now().timestamp()}",
            system_message="""Sen bir TYT-AYT deneme sonuç analiz asistanısın. 
            Verilen deneme kağıdından/ekran görüntüsünden şu bilgileri JSON formatında çıkar:
            
            1. Her ders için: toplam soru, doğru, yanlış, boş sayıları
            2. Konu bazlı dağılım (eğer belgede belirtilmişse)
            3. Toplam net hesapla (Net = Doğru - Yanlış/4)
            
            SADECE JSON formatında yanıt ver, başka açıklama yapma.
            
            Örnek format:
            {
                "subjects": [
                    {
                        "name": "Matematik",
                        "total": 40,
                        "correct": 28,
                        "wrong": 8,
                        "blank": 4,
                        "net": 26.0,
                        "topics": [
                            {"name": "Fonksiyonlar", "correct": 5, "wrong": 2, "blank": 1},
                            {"name": "Geometri", "correct": 4, "wrong": 1, "blank": 0}
                        ]
                    }
                ],
                "total_net": 85.5,
                "weak_topics": ["Fizik - Elektrik", "Kimya - Asit-Baz"]
            }
            """
        ).with_model("openai", "gpt-4o")
        
        # Dosyayı hazırla
        mime_type = "application/pdf" if file_type == "pdf" else "image/jpeg"
        file_content = FileContentWithMimeType(
            file_path=file_path,
            mime_type=mime_type
        )
        
        # Mesaj oluştur
        user_message = UserMessage(
            text="Bu deneme kağıdını analiz et ve JSON formatında sonuçları çıkar. Türkçe ders isimlerini kullan.",
            file_contents=[file_content]
        )
        
        # Analiz yap
        try:
            response = await chat.send_message(user_message)
            
            # JSON parse et
            # Response'tan JSON kısmını çıkar (markdown code block içinde olabilir)
            response_text = response.strip()
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            analysis_result = json.loads(response_text)
            
            return {
                "success": True,
                "analysis": analysis_result,
                "raw_response": response
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "raw_response": str(e)
            }
    
    def calculate_net_from_manual(self, subject_data: List[Dict]) -> Dict:
        """
        Manuel girilen verilerden net hesaplar
        
        Args:
            subject_data: [{name, correct, wrong, blank, total}]
            
        Returns:
            Hesaplama sonuçları
        """
        results = []
        total_net = 0.0
        
        for subject in subject_data:
            correct = subject.get("correct", 0)
            wrong = subject.get("wrong", 0)
            blank = subject.get("blank", 0)
            
            # Net hesapla (Doğru - Yanlış/4)
            net = correct - (wrong / 4.0)
            total_net += net
            
            results.append({
                "name": subject["name"],
                "total": subject.get("total", correct + wrong + blank),
                "correct": correct,
                "wrong": wrong,
                "blank": blank,
                "net": round(net, 2)
            })
        
        return {
            "subjects": results,
            "total_net": round(total_net, 2)
        }
    
    def identify_weak_topics(self, topic_breakdown: List[Dict]) -> List[str]:
        """
        Zayıf konuları tespit eder
        
        Args:
            topic_breakdown: [{subject, topic, correct, wrong, blank}]
            
        Returns:
            Zayıf konu listesi
        """
        weak_topics = []
        
        for topic in topic_breakdown:
            correct = topic.get("correct", 0)
            wrong = topic.get("wrong", 0)
            total = correct + wrong + topic.get("blank", 0)
            
            if total > 0:
                accuracy = (correct / total) * 100
                
                # Başarı %50'nin altındaysa veya 3'ten fazla yanlış varsa zayıf konu
                if accuracy < 50 or wrong > 3:
                    weak_topics.append(f"{topic.get('subject', '')} - {topic.get('topic', '')}")
        
        return weak_topics
    
    def generate_recommendations(self, weak_topics: List[str], subject_stats: List[Dict]) -> str:
        """
        Çalışma önerileri oluşturur
        
        Args:
            weak_topics: Zayıf konular
            subject_stats: Ders istatistikleri
            
        Returns:
            Öneri metni
        """
        recommendations = []
        
        if weak_topics:
            recommendations.append(f"🎯 Öncelikli Çalışılacak Konular:\n")
            for topic in weak_topics[:5]:  # İlk 5 konu
                recommendations.append(f"  • {topic}")
            recommendations.append("")
        
        # En düşük netli dersleri bul
        sorted_subjects = sorted(subject_stats, key=lambda x: x.get("net", 0))
        if sorted_subjects:
            recommendations.append("📚 Ders Bazlı Öneriler:\n")
            for subject in sorted_subjects[:3]:  # İlk 3 ders
                net = subject.get("net", 0)
                name = subject.get("name", "")
                if net < 10:
                    recommendations.append(f"  • {name}: Temel kavramları tekrar edin ve bol soru çözün")
                elif net < 20:
                    recommendations.append(f"  • {name}: Orta seviye sorulara odaklanın")
                else:
                    recommendations.append(f"  • {name}: Zor soruları çözerek pekiştirin")
        
        return "\n".join(recommendations) if recommendations else "Genel olarak iyi bir performans. Çalışmaya devam edin!"
