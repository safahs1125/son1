"""
Deneme Sonuç Analiz Modülü
Manuel veri girişi + AI metin analizi (Vision YOK)
"""
import os
import json
from typing import Dict, List, Optional
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage


class ExamAnalyzer:
    """Deneme sonuçlarını analiz eden sınıf (sadece manuel giriş)"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def analyze_exam_text(self, exam_data: Dict) -> Dict:
        """
        Manuel girilen deneme verilerini AI ile analiz eder
        
        Args:
            exam_data: {
                "exam_name": str,
                "exam_type": "TYT" | "AYT",
                "subjects": [{name, total, correct, wrong, blank, topics: [...]}]
            }
            
        Returns:
            AI analiz sonuçları
        """
        
        # Veriyi metin formatına çevir
        text_data = f"Deneme Adı: {exam_data.get('exam_name', '')}\n"
        text_data += f"Deneme Türü: {exam_data.get('exam_type', 'TYT')}\n\n"
        text_data += "DERS BAZLI SONUÇLAR:\n"
        
        for subject in exam_data.get('subjects', []):
            net = subject['correct'] - (subject['wrong'] / 4.0)
            text_data += f"\n{subject['name']}:\n"
            text_data += f"  Toplam: {subject['total']}, Doğru: {subject['correct']}, "
            text_data += f"Yanlış: {subject['wrong']}, Boş: {subject['blank']}, Net: {net:.2f}\n"
            
            if subject.get('topics'):
                text_data += "  Konu Bazlı:\n"
                for topic in subject['topics']:
                    text_data += f"    - {topic['name']}: {topic['total']} soru, "
                    text_data += f"{topic['correct']}D {topic['wrong']}Y {topic['blank']}B\n"
        
        # AI chat oluştur
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"exam-analysis-{datetime.now().timestamp()}",
            system_message="""Sen bir TYT-AYT deneme sonuç analiz asistanısın. 
            Verilen deneme sonuçlarını analiz et ve şunları yap:
            
            1. Zayıf konuları belirle (başarı oranı %60 altı veya 3+ yanlış)
            2. Güçlü konuları belirle (başarı oranı %80 üstü)
            3. Kısa ve öz çalışma önerileri sun (maksimum 5 madde)
            4. Genel başarı değerlendirmesi yap
            
            KISA VE ÖZ YANIT VER. Maksimum 200 kelime.
            JSON formatında yanıt verme, düz metin olarak yaz."""
        ).with_model("openai", "gpt-4o-mini")
        
        try:
            user_message = UserMessage(
                text=f"Bu deneme sonuçlarını analiz et:\n\n{text_data}"
            )
            
            response = await chat.send_message(user_message)
            
            return {
                "success": True,
                "ai_analysis": response.strip(),
                "raw_input": text_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "ai_analysis": "AI analizi yapılamadı."
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
