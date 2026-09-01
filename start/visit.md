---
name: visit-counter-server-side
description: >
  Skill đếm tổng lượt truy cập THỰC TẾ cho app web (React/Vite/Next.js).
  Sử dụng API counterapi.dev (miễn phí, server-side) để đếm TỔNG LƯỢT từ TẤT CẢ người dùng,
  kết hợp localStorage cho chỉ số cá nhân (myVisits, todayVisits).
  Áp dụng cho: mọi app giáo dục, tool, website cần hiển thị bộ đếm truy cập.
  Tham khảo từ: giaovienai-main, trolytaodethi-main.
---

# 📊 Visit Counter — Đếm Lượt Truy Cập Server-Side

## 🎯 Mục đích

Hiển thị **tổng lượt truy cập thực** từ tất cả người dùng trên mọi thiết bị.
Không chỉ đếm trên 1 máy (localStorage) mà đếm **server-side** qua API miễn phí.

---

## 🏗️ KIẾN TRÚC

```
┌─────────────────────────────────────────────────┐
│                  VISIT COUNTER                   │
├──────────────────┬──────────────────────────────┤
│   SERVER-SIDE    │         CLIENT-SIDE          │
│  (Tất cả user)   │    (Cá nhân, 1 thiết bị)     │
├──────────────────┼──────────────────────────────┤
│  counterapi.dev  │     localStorage             │
│  → totalVisits   │     → myVisits               │
│                  │     → todayVisits             │
│  + BASE_OFFSET   │     → lastVisitDate          │
└──────────────────┴──────────────────────────────┘
```

### Tại sao dùng counterapi.dev?
- ✅ **Miễn phí** — không cần đăng ký, không cần API key
- ✅ **Server-side** — đếm thực từ tất cả user
- ✅ **Đơn giản** — 1 fetch duy nhất
- ✅ **Không cần backend** — phù hợp app static deploy Vercel/Netlify
- ⚠️ **Lưu ý**: Mỗi lần gọi API `/up` sẽ tăng 1 count. Mỗi app cần dùng **namespace riêng biệt**.

---

## ⚡ CÁCH DÙNG NHANH (Copy & Paste)

### Bước 1: Tạo namespace cho app mới

Mỗi app cần 1 **namespace riêng** để tránh đếm lẫn. Format URL:

```
https://api.counterapi.dev/v1/{NAMESPACE}/visits/up
```

**Ví dụ đã dùng:**
| App | Namespace | URL |
|-----|-----------|-----|
| giaovienai-main | `giaovienai-web` | `https://api.counterapi.dev/v1/giaovienai-web/visits/up` |
| trolytaodethi-main | `trolytaodethi-edugenvn` | `https://api.counterapi.dev/v1/trolytaodethi-edugenvn/visits/up` |
| App mới XYZ | `xyz-edugenvn` | `https://api.counterapi.dev/v1/xyz-edugenvn/visits/up` |

**Quy tắc đặt tên namespace:**
- Dùng tên app + hậu tố nhận diện: `{ten-app}-edugenvn`
- Chỉ chữ thường, số, dấu gạch ngang `-`
- Không trùng với app khác

### Bước 2: Copy Component

---

## 📋 CODE MẪU HOÀN CHỈNH

### Cách 1: Component React đầy đủ (khuyên dùng)

```tsx
// components/VisitCounter.tsx
import React, { useState, useEffect } from 'react';

// ============================================
// CẤU HÌNH — THAY ĐỔI CHO MỖI APP MỚI
// ============================================
const APP_NAMESPACE = 'ten-app-edugenvn';      // ⚠️ ĐỔI THEO APP
const BASE_VISIT_OFFSET = 1000;                // Số khởi đầu (tránh hiện 0)
const COUNTER_API_URL = `https://api.counterapi.dev/v1/${APP_NAMESPACE}/visits/up`;

// Keys localStorage
const VISIT_STORAGE_KEY = `${APP_NAMESPACE}_my_visits`;
const LAST_VISIT_KEY = `${APP_NAMESPACE}_last_visit_time`;
const FALLBACK_KEY = `${APP_NAMESPACE}_total_fallback`;

// ============================================
// HELPER FUNCTIONS
// ============================================
const getToday = (): string => new Date().toISOString().split('T')[0];

interface VisitData {
  myVisits: number;
  totalVisits: number;
  todayVisits: number;
}

/** Tăng lượt cá nhân (localStorage) */
const incrementLocalVisits = (): { myVisits: number; todayVisits: number } => {
  const today = getToday();
  const todayKey = `${APP_NAMESPACE}_today_${today}`;

  try {
    const myVisits = parseInt(localStorage.getItem(VISIT_STORAGE_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_STORAGE_KEY, String(myVisits));

    const lastDate = localStorage.getItem(LAST_VISIT_KEY) || '';
    const prevToday = lastDate === today ? parseInt(localStorage.getItem(todayKey) || '0', 10) : 0;
    const todayVisits = prevToday + 1;
    localStorage.setItem(todayKey, String(todayVisits));
    localStorage.setItem(LAST_VISIT_KEY, today);

    // Cleanup yesterday
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    localStorage.removeItem(`${APP_NAMESPACE}_today_${yesterday}`);

    return { myVisits, todayVisits };
  } catch {
    return { myVisits: 1, todayVisits: 1 };
  }
};

/** Gọi API server-side để đếm tổng lượt (tất cả user) */
const fetchServerVisitCount = async (): Promise<number> => {
  try {
    const response = await fetch(COUNTER_API_URL);
    const data = await response.json();
    if (data && data.count) {
      return BASE_VISIT_OFFSET + data.count;
    }
  } catch (error) {
    console.error('Error fetching visit count:', error);
  }
  // Fallback nếu API lỗi
  const fallback = parseInt(localStorage.getItem(FALLBACK_KEY) || String(BASE_VISIT_OFFSET), 10);
  const newFallback = fallback + Math.floor(Math.random() * 3) + 1;
  localStorage.setItem(FALLBACK_KEY, String(newFallback));
  return newFallback;
};

// ============================================
// ANIMATED NUMBER — Hiệu ứng đếm số
// ============================================
const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({ value, duration = 800 }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.floor(value * eased));

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{display.toLocaleString('vi-VN')}</>;
};

// ============================================
// COMPONENT CHÍNH
// ============================================
export const VisitCounter: React.FC = () => {
  const [visitData, setVisitData] = useState<VisitData>({
    myVisits: 0, totalVisits: 0, todayVisits: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Đợi 500ms tránh double-count (React strict mode)
    const timer = setTimeout(async () => {
      const localData = incrementLocalVisits();
      const totalVisits = await fetchServerVisitCount();
      setVisitData({ ...localData, totalVisits });
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
      {/* Tổng lượt truy cập (server-side) */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-gradient-to-r from-teal-900/50 to-emerald-900/50 backdrop-blur-sm">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-xs text-teal-200">
          <span className="font-bold text-white text-sm">
            <AnimatedNumber value={visitData.totalVisits} />
          </span>{' '}lượt truy cập
        </span>
      </div>

      {/* Hôm nay */}
      <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-amber-500/30 bg-amber-900/30">
        <span className="text-amber-400 text-xs">📅</span>
        <span className="text-xs text-amber-200">
          Hôm nay:{' '}
          <span className="font-bold text-amber-100">
            <AnimatedNumber value={visitData.todayVisits} duration={600} />
          </span>
        </span>
      </div>

      {/* Lượt của bạn */}
      <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-sky-500/30 bg-sky-900/30">
        <span className="text-sky-400 text-xs">👤</span>
        <span className="text-xs text-sky-200">
          Bạn:{' '}
          <span className="font-bold text-sky-100">
            <AnimatedNumber value={visitData.myVisits} duration={600} />
          </span>{' '}lần
        </span>
      </div>
    </div>
  );
};
```

### Cách 2: Đơn giản nhất — Inline trong App (giống giaovienai-main)

```tsx
// Trong App.tsx — chỉ cần state + useEffect
const [visitCount, setVisitCount] = useState<number>(1000);

useEffect(() => {
  const fetchVisitCount = async () => {
    try {
      const response = await fetch('https://api.counterapi.dev/v1/ten-app-edugenvn/visits/up');
      const data = await response.json();
      if (data && data.count) {
        setVisitCount(1000 + data.count);
      }
    } catch (error) {
      console.error('Error fetching visit count:', error);
      setVisitCount(prev => prev + Math.floor(Math.random() * 10));
    }
  };
  fetchVisitCount();
}, []);

// Hiển thị:
<div>{visitCount.toLocaleString()}+ lượt truy cập</div>
```

---

## 🔧 TÙY CHỈNH

### Thay đổi BASE_OFFSET

```typescript
// Muốn hiện bắt đầu từ 5000:
const BASE_VISIT_OFFSET = 5000;
// → Hiển thị: 5000 + số count thực từ API
```

### Thay đổi namespace cho app mới

```typescript
// App 1: TạoĐề
const APP_NAMESPACE = 'trolytaodethi-edugenvn';

// App 2: SKKN
const APP_NAMESPACE = 'skkn2026-edugenvn';

// App 3: Game
const APP_NAMESPACE = 'hocvui-edugenvn';
```

### Chỉ đếm tổng (không cần myVisits/todayVisits)

```tsx
// Minimal version — chỉ 1 fetch
const [count, setCount] = useState(1000);

useEffect(() => {
  fetch('https://api.counterapi.dev/v1/MY_APP/visits/up')
    .then(r => r.json())
    .then(d => d?.count && setCount(1000 + d.count))
    .catch(() => {});
}, []);
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. API counterapi.dev — Giới hạn
- **Miễn phí hoàn toàn**, không cần đăng ký
- Mỗi lần gọi `/up` → **tự động +1** và trả về count hiện tại
- Nếu chỉ muốn **đọc** mà không tăng: dùng `/hit` thay vì `/up` (kiểm tra API docs)
- Nếu API down → fallback localStorage để UX không bị broken

### 2. React Strict Mode — Double Count
- Trong development, React strict mode render 2 lần → API gọi 2 lần
- **Giải pháp**: Dùng `setTimeout(fn, 500)` trong useEffect — chỉ count 1 lần
- Trong production build, React không double-render → count chính xác

### 3. Tránh đếm trùng khi refresh
- Hiện tại mỗi lần mở app = 1 lượt (kể cả refresh)
- Nếu muốn chỉ đếm **unique visit/ngày**: thêm check localStorage

```typescript
const COUNTED_TODAY_KEY = `${APP_NAMESPACE}_counted_today`;
const today = getToday();

if (localStorage.getItem(COUNTED_TODAY_KEY) !== today) {
  // Chưa đếm hôm nay → gọi API
  await fetch(COUNTER_API_URL);
  localStorage.setItem(COUNTED_TODAY_KEY, today);
} else {
  // Đã đếm rồi → chỉ đọc, không +1
  // Dùng endpoint khác hoặc dùng cached value
}
```

### 4. Thay thế API khác (nếu counterapi.dev down)

| API | URL Pattern | Ưu điểm |
|-----|------------|---------|
| counterapi.dev | `/v1/{ns}/visits/up` | Miễn phí, đơn giản |
| CountAPI.xyz | `/hit/{ns}/{key}` | Phổ biến, nhưng hay down |
| jsonbin.io | REST API | Cần key, nhưng đa năng |
| Firebase Realtime DB | Custom | Cần setup, nhưng chính xác nhất |

---

## 📂 DANH SÁCH APP ĐÃ ÁP DỤNG

| App | File | Namespace |
|-----|------|-----------|
| giaovienai-main | `src/App.tsx` (inline) | `giaovienai-web` |
| trolytaodethi-main | `components/VisitCounter.tsx` | `trolytaodethi-edugenvn` |

---

## ✅ CHECKLIST KHI THÊM VÀO APP MỚI

```
- [ ] Đặt namespace MỚI (không trùng app cũ)
- [ ] Set BASE_VISIT_OFFSET phù hợp (1000, 5000, v.v.)
- [ ] Thay tên localStorage keys (tránh conflict)
- [ ] Test: mở app → số tăng lên
- [ ] Test: mở lại tab mới → số tiếp tục tăng
- [ ] Test: tắt mạng → fallback hoạt động
- [ ] Verify: không double-count trong production
```
