# 🔍 Vercel Coach Login Debug Rehberi

## ⚠️ Sorun: Email veya şifre hatalı

Vercel'de environment variables kontrolü için debug endpoint ekledik.

---

## 🧪 ÖNCELİKLE TEST EDİN

### 1️⃣ GitHub'a Push
```bash
cd /app
git add .
git commit -m "Add debug logging"
git push origin main
```

⏳ **Vercel otomatik deploy edecek - 2 dakika bekleyin**

---

## 🔍 Environment Variables Kontrol

### Test Endpoint'i Çağırın:
```bash
curl https://YOUR-PROJECT.vercel.app/api/env-check
```

**Beklenen Response:**
```json
{
  "supabase_url_set": true,
  "supabase_key_set": true,
  "coach_email_set": true,
  "coach_password_set": true,
  "coach_email_value": "safa_boyaci15@erdog...",
  "fallback_email": "safa_boyaci15@erdog...",
  "fallback_password_set": true
}
```

---

## ⚠️ Sorunları Tespit Edin

### Senaryo 1: Tüm değerler `false`
**Sorun:** Environment variables hiç girilmemiş!

**Çözüm:**
1. Vercel Dashboard → Settings → Environment Variables
2. **4 değişkeni ekleyin:**
   ```
   SUPABASE_URL
   SUPABASE_ANON_KEY
   COACH_EMAIL
   COACH_PASSWORD
   ```
3. **Her biri için:** Production ✅ Preview ✅ Development ✅
4. **Redeploy:** Deployments → ... → Redeploy

---

### Senaryo 2: `coach_email_set: false`
**Sorun:** COACH_EMAIL girilmemiş veya yanlış yazılmış

**Çözüm:**
1. Vercel → Settings → Environment Variables
2. COACH_EMAIL'i bulun
3. **Tam olarak şunu girin:**
   ```
   safa_boyaci15@erdogan.edu.tr
   ```
4. ⚠️ Boşluk, büyük/küçük harf dikkat!
5. Save → Redeploy

---

### Senaryo 3: `coach_password_set: false`
**Sorun:** COACH_PASSWORD girilmemiş

**Çözüm:**
1. Vercel → Settings → Environment Variables
2. COACH_PASSWORD ekle:
   ```
   coach2025
   ```
3. Save → Redeploy

---

## 🔍 Vercel Logs Kontrol

### Function Logs'a Bakın:
1. Vercel Dashboard → Deployments
2. En son deployment'ı seçin
3. **"View Function Logs"** tıklayın
4. Coach login denemesi yapın
5. Logs'da şunları arayın:
   ```
   [DEBUG] Login attempt - Email: ...
   [DEBUG] Expected email: ...
   [DEBUG] Email match: ...
   [DEBUG] Password match: ...
   ```

**Bu size tam olarak ne olduğunu gösterecek!**

---

## ✅ Adım Adım Düzeltme

### 1️⃣ Environment Variables Tekrar Girin

**Vercel Dashboard → Settings → Environment Variables**

**Sil ve yeniden ekle (temiz başlangıç):**

**A. SUPABASE_URL**
```
Name: SUPABASE_URL
Value: https://blrlfmskgyfzjsvkgciu.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

**B. SUPABASE_ANON_KEY**
```
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJscmxmbXNrZ3lmempzdmtnY2l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjM5NjMsImV4cCI6MjA3OTg5OTk2M30.ivyTwgh-c9dvW91atyGyW6rQbShCzOBXb3m40Svj8Yw
Environments: ✅ Production ✅ Preview ✅ Development
```

**C. COACH_EMAIL**
```
Name: COACH_EMAIL
Value: safa_boyaci15@erdogan.edu.tr
Environments: ✅ Production ✅ Preview ✅ Development
```

⚠️ **DİKKAT:** Kopyala-yapıştır yap, manuel yazma!

**D. COACH_PASSWORD**
```
Name: COACH_PASSWORD
Value: coach2025
Environments: ✅ Production ✅ Preview ✅ Development
```

### 2️⃣ Save ve Redeploy
```
Settings → Environment Variables → Save
Deployments → ... → Redeploy
✅ "Clear cache and redeploy"
```

### 3️⃣ Test
```bash
# 1. Env check
curl https://YOUR-PROJECT.vercel.app/api/env-check

# 2. Login test
curl -X POST https://YOUR-PROJECT.vercel.app/api/coach/login \
  -H "Content-Type: application/json" \
  -d '{"email":"safa_boyaci15@erdogan.edu.tr","password":"coach2025"}'
```

---

## 🐛 Yaygın Hatalar

### ❌ Hata 1: Email'de boşluk
```
❌ " safa_boyaci15@erdogan.edu.tr"
❌ "safa_boyaci15@erdogan.edu.tr "
✅ "safa_boyaci15@erdogan.edu.tr"
```

### ❌ Hata 2: Yanlış environment seçimi
```
❌ Sadece Production seçili
✅ Production + Preview + Development HEPSİ
```

### ❌ Hata 3: Değişiklik sonrası redeploy yapılmamış
```
❌ Save → Bitti sanıyorsunuz
✅ Save → REDEPLOY ŞART!
```

### ❌ Hata 4: Büyük/küçük harf
```
❌ COACH_email (yanlış)
✅ COACH_EMAIL (doğru)
```

---

## 📊 Checklist

Deploy sonrası kontrol:

- [ ] GitHub'a push yaptınız
- [ ] Vercel otomatik deploy etti (2 dk)
- [ ] `/api/env-check` test ettiniz
- [ ] Tüm değerler `true` dönüyor
- [ ] 4 environment variable var
- [ ] Her biri Production+Preview+Development
- [ ] Redeploy yaptınız
- [ ] Function logs'da debug mesajları görünüyor
- [ ] Coach login test ettiniz

---

## 🎯 Final Test

### Browser'dan:
```
1. https://YOUR-PROJECT.vercel.app/coach/login
2. Email: safa_boyaci15@erdogan.edu.tr
3. Şifre: coach2025
4. "Giriş Yap"
```

**Başarılı ise:**
- ✅ "Giriş başarılı!" mesajı
- ✅ Dashboard açılır
- ✅ Öğrenci listesi görünür

---

## 🆘 Hala Çalışmıyor?

### Logs Paylaşın:

**1. Env Check Response:**
```bash
curl https://YOUR-PROJECT.vercel.app/api/env-check
```

**2. Function Logs:**
```
Vercel → Deployments → View Function Logs
(Login denemesi sonrası [DEBUG] satırları)
```

**3. Browser Console:**
```
F12 → Console → Hata mesajları
F12 → Network → /api/coach/login → Response
```

Bu bilgilerle sorunu kesin çözebiliriz!

---

**Başarılar! 🚀**
