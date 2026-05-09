# Voice Library — MiniMax TTS 已选 / 已测声音

Model: `speech-02-hd`  
Endpoint: `https://api.minimaxi.com/v1/t2a_v2`

---

## ✅ 已选用 (in production)

| Voice ID | 首次用于 | 状态 | 备注 |
|----------|---------|------|------|
| `Chinese (Mandarin)_Gentleman` | ep1 Miss You | **当前默认** | 已合成 ep1–ep4；稳定，中文男声，沉稳 |

---

## 🧪 测试记录

| Voice ID | 测试文件 | 评价 |
|----------|---------|------|
| `Chinese (Mandarin)_Sincere_Adult` | `06_miss-you__sincere-adult.mp3` | — |
| `Chinese (Mandarin)_Radio Host` | `06_miss-you__radio-host.mp3` | — |
| `Chinese (Mandarin)_Warm_Girl` | `ep5_pos08_warm-girl.mp3` | 待评 |
| `English_ImposingManner` | — | selected for ep5 EN version |

---

## 📝 备注

- `language_boost` 从 `"Chinese"` 改为 `"auto"`（ep5 起），以支持旁白里的日语假名（まりや、シングル・アゲイン 等）。
- 换声音时同步更新 `episode_audio_pipeline.md` 的 **Voice lock** 条目。
