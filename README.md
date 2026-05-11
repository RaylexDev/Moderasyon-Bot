# 🛡️ MarvelCode Moderasyon Botu

> **MarvelCode ❤️ RaylexDev**  

---

## 📋 Özellikler

### 🛡️ Moderasyon
| Komut | Açıklama | Yetki |
|-------|----------|-------|
| `/ban` | Kullanıcıyı banlar (mesaj silme seçeneğiyle) | Ban Members |
| `/unban` | ID ile ban kaldırır | Ban Members |
| `/kick` | Kullanıcıyı sunucudan atar | Kick Members |
| `/timeout` | Kullanıcıya timeout verir (10s–28g) | Moderate Members |
| `/untimeout` | Timeout'u kaldırır | Moderate Members |
| `/uyar` | Kullanıcıyı uyarır (DM gönderir) | Moderate Members |
| `/uyarilar` | Uyarı geçmişini gösterir | Herkes |
| `/uyarisil` | Tek veya tüm uyarıları siler | Moderate Members |
| `/temizle` | 1–100 mesaj toplu siler | Manage Messages |
| `/slowmode` | Yavaş mod ayarlar/kapatır | Manage Channels |
| `/kilitle` | Kanala yazma kapatır | Manage Channels |
| `/kilittazla` | Kanalın kilidini açar | Manage Channels |
| `/rol-ver` | Kullanıcıya rol verir | Manage Roles |
| `/rol-al` | Kullanıcıdan rol alır | Manage Roles |
| `/nick` | Nick değiştirir/sıfırlar | Manage Nicknames |
| `/profil` | Moderasyon profilini gösterir (canvas) | Herkes |
| `/not` | Kullanıcıya gizli not ekler/listeler/siler | Moderate Members |

### 📊 Bilgi
| Komut | Açıklama |
|-------|----------|
| `/kullanici` | Kullanıcı bilgisi |
| `/sunucu` | Sunucu istatistikleri |

### 🎮 Eğlence
| Komut | Açıklama |
|-------|----------|
| `/yazıtura` | Yazı mı tura mı |
| `/zar` | 2–100 yüzlü zar atar |
| `/taştakağıtmakas` | Botla TKM oyna |
| `/8top` | Sihirli 8-Top |
| `/seviyölç` | İki kişi arasında aşk ölçer |

### 📋 Log Kanalları (`.kur` ile otomatik kurulur)
| Kanal | Ne loglar |
|-------|----------|
| `🔨・ban-log` | Ban / unban |
| `👟・kick-log` | Kick |
| `🔇・mute-log` | Timeout ver/kaldır |
| `⚠️・uyarı-log` | Uyarı ver/sil |
| `🏷️・rol-log` | Rol oluştur/sil/güncelle |
| `📢・kanal-log` | Kanal oluştur/sil/güncelle/kilitle |
| `👤・üye-log` | Giriş/ayrılış/nick/rol değişimi |
| `💬・mesaj-log` | Mesaj sil/düzenle/toplu sil |
| `🎙️・ses-log` | Ses kanalı giriş/çıkış/değişim |
| `⚙️・sunucu-log` | Sunucu ayarı değişimi, webhook |
| `🛡️・mod-log` | Genel mod işlemleri |

---

## ⚙️ Kurulum

### 1. Gereksinimler
- Node.js **v18+**
- Discord Bot Token

### 2. Bot Oluşturma
1. [Discord Developer Portal](https://discord.com/developers/applications) → New Application
2. Bot → Add Bot → Token kopyala
3. **Privileged Gateway Intents** hepsini aç:
   - ✅ PRESENCE INTENT
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT

### 3. Bot Davet Etme
Aşağıdaki linkleri düzenleyip davet et (`CLIENT_ID` yerine bot ID):
```
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot+applications.commands
```

### 4. Dosyaları Hazırla
```bash
npm install
```

### 5. `mod-bot.js` Düzenle
Dosyanın en üstündeki şu satırları doldur:
```js
const TOKEN     = "BURAYA_TOKEN_YAZ";
const CLIENT_ID = "BURAYA_CLIENT_ID_YAZ";
const GUILD_ID  = "BURAYA_GUILD_ID_YAZ"; // Test sunucusu (global için boş bırak "")
```

### 6. Başlat
```bash
npm start
# veya geliştirme modu:
npm run dev
```

### 7. Log Kanallarını Kur
Bot açıkken sunucuda yaz:
```
.kur
```
`📋 Mod Logları` kategorisi ve tüm log kanalları otomatik oluşturulur.

---

## 📁 Dosya Yapısı
```
modbot/
├── mod-bot.js      # Ana bot dosyası (tek dosya)
├── package.json
├── README.md
└── data/           # Otomatik oluşturulur
    ├── warns.json
    ├── mutes.json
    ├── logChannels.json
    └── notes.json
```

---

## ⏱️ Süre Formatları
`/timeout` ve `/slowmode` komutlarında kullanılır:
```
10s  →  10 saniye
5m   →  5 dakika
2h   →  2 saat
7d   →  7 gün
1w   →  1 hafta
```

---

## 🔒 Botun İhtiyaç Duyduğu Yetkiler
- `Ban Members`
- `Kick Members`
- `Moderate Members` (Timeout)
- `Manage Messages`
- `Manage Channels`
- `Manage Roles`
- `Manage Nicknames`
- `View Audit Log`
- `Send Messages`
- `Embed Links`
- `Attach Files`

---

## 📝 Notlar
- Tüm veriler `./data/` klasöründe JSON olarak saklanır
- Canvas banner'ları ban/kick/uyarı/profil komutlarında otomatik oluşturulur
- Bot DM kapalı kullanıcılara mesaj gönderemezse hata vermez, sadece atlar
- `GUILD_ID` boş bırakılırsa slash komutları global olarak kayıt olur (1 saat gecikme)

---

<div align="center">

**MarvelCode ❤️ RaylexDev**

</div>
