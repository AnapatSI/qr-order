This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Bangsaen Smart Order (SaaS for Restaurants)

แพลตฟอร์มจัดการร้านอาหารและระบบสั่งอาหารผ่าน QR Code แบบ End-to-End (E2E) ออกแบบมาในรูปแบบ SaaS (Software as a Service) ที่ให้ร้านอาหารสามารถเข้ามาใช้งาน จัดการเมนู สร้าง QR Code ประจำโต๊ะ และมีระบบ KDS (Kitchen Display System) แบบ Real-time ครบจบในตัว

ปัจจุบันพัฒนาถึงขั้น MVP (Minimum Viable Product) เสร็จสมบูรณ์แล้ว **95%**

---

## ภาพรวมระบบ

### Tech Stack

| ส่วน | เทคโนโลยี | คำอธิบาย |
|------|-------------|-------------|
| **Framework** | Next.js 16 (App Router) | Frontend framework ทันสมัย |
| **Styling** | Tailwind CSS + Shadcn UI | UI components สวยงาม |
| **State Management** | Zustand | Shopping cart ฝั่งลูกค้า |
| **Backend & Database** | Supabase (PostgreSQL) | Backend และฐานข้อมูล |
| **Authentication** | Supabase Auth | ระบบยืนยันต์ |
| **Storage** | Supabase Storage | เก็บรูปอาหาร |
| **Real-time** | Supabase Real-time | KDS แบบ real-time |

---

## ฟีเจอร์หลัก (ทำงานได้จริง 100%)

### ฝั่งผู้จัดการร้าน (Merchant Admin Dashboard)

**Authentication**
- ระบบ Login สำหรับเจ้าของร้าน
- ผูกสิทธิ์ด้วย `owner_id`
- ปัจจุบันใช้ Client-side Auth (มีบั๊กเรื่อง Next.js 16 Proxy)

**Unified Workspace**
- หน้า Dashboard แบบ Tabs สลับการทำงานง่าย
- Stats Cards: Credit Balance, Today's Sales, Active Tables

**Menu Manager (CRUD)**
- เพิ่ม/ลด/แก้ไข เมนูอาหารได้
- ระบบอัปโหลดรูปภาพตัวจริงขึ้น Supabase Storage
- จัดการราคาและคำอธิบาย

**Table & QR Manager**
- เพิ่มจำนวนโต๊ะในร้านได้อิสระ
- Generate QR Code แบบถาวร (Static URL)
- URL ประจำโต๊ะ: `/BS001/menu?table=1`
- ปุ่ม Print QR Code ไปแปะโต๊ะ

---

### ฝั่งลูกค้า (Customer Menu & Ordering)

**Seamless Access**
- สแกน QR Code → เข้าสู่หน้าเมนูทันที
- ระบุโต๊ะอัตโนมัติ
- ไม่ต้องโหลดแอป

**Shopping Cart**
- ใช้ Zustand จัดการตะกร้าสินค้า
- กด +/- เพิ่มลดเมนู
- คำนวณราคาสุทธิแม่นยำ

**Order Placement**
- กดสั่ง → บันทึกลง Database ทันที
- บันทึกลงตาราง `orders` และ `order_items`
- แสดงยอดรวมให้ลูกค้ายืนยัน

---

### ฝั่งห้องครัว (KDS - Kitchen Display System)

**Real-time Sync**
- ลูกค้าสั่ง → ออเดอร์เด้งใน KDS ทันที
- ไม่ต้องกด Refresh (Supabase Real-time)
- แสดงจำนวนออเดอร์ตามโต๊ะ

**Status Flow**
- **Pending** (รอดำเนินการ)
- **Cooking** (กำลังทำ)  
- **Served** (เสิร์ฟแล้ว)
- **Paid** (จ่ายแล้ว)

**Billing & Auto-Clear**
- กด "Paid" → เคลียร์โต๊ะอัตโนมัติ
- หัก Credit Balance ของร้านอัตโนมัติ
- โมเดลรายได้ของระบบ

---

## โครงสร้าง Database

### ตารางหลัก (RLS Enabled)

| ตาราง | คำอธิบาย |
|--------|-------------|
| **stores** | ข้อมูลร้านค้า, Credit Balance, owner_id |
| **tables** | ข้อมูลโต๊ะของแต่ละร้าน |
| **menus** | รายการอาหาร, ราคา, รูปภาพ |
| **orders** | Header ของใบสั่ง (ร้าน, โต๊ะ, สถานะ, ยอดรวม) |
| **order_items** | Detail ของใบสั่ง (เมนู, จำนวน) |

### Row Level Security (RLS)
- เปิดใช้งานแล้วทุกตาราง
- Policies สำหรับ Multi-tenant architecture
- ป้องกันการเข้าถึงข้อมูลข้ามร้าน

---

## การติดตั้งและใช้งาน

### 1. Clone Repository
```bash
git clone <repository-url>
cd qr-order
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. ตั้งค่า Supabase Database
```bash
# รัน SQL script ใน Supabase SQL Editor
psql -f supabase/schema.sql
```

### 5. สร้าง Storage Bucket
```bash
# ใน Supabase Dashboard → Storage
# สร้าง bucket: menu-images (public)
```

### 6. เริ่ม Development Server
```bash
npm run dev
```

### 7. เข้าใช้งาน
- **Admin Dashboard:** `http://localhost:3000/admin/dashboard`
- **Customer Menu:** `http://localhost:3000/BS001/menu?table=1`
- **KDS:** `http://localhost:3000/BS001/kds`

---

## สิ่งที่ต้องทำต่อ (Tech Debt)

### ปัญหาที่ต้องแก้ไข
1. **Fix Proxy/Middleware (Next.js 16)**
   - ปัจจุบันมีปัญหาอ่าน Cookie ของ Supabase Auth
   - ทำให้เกิด Redirect Loop
   - ต้องหาวิธีจัดการ Session บน Server-side

### ฟีเจอร์ที่เพิ่มเติม
1. **Sales Analytics Dashboard**
   - พล็อตกราฟแท่ง/กราฟเส้นจากข้อมูล orders
   - แนะนำใช้ Recharts
   - ทำให้ Dashboard ดูน่าสนใจขึ้น

2. **Payment Gateway (Optional)**
   - ต่อ API ของ PromptPay หรือ Stripe
   - รองรับการจ่ายเงินจริง

---

## User Journey

### สำหรับร้านอาหาร
1. **สมัครใช้งาน** → รับรหัสผ่าน
2. **Login** → เข้าสู่ Admin Dashboard
3. **จัดการเมนู** → เพิ่มรูปและราคา
4. **จัดการโต๊ะ** → สร้าง QR Code
5. **พิมพ์ QR** → แปะโต๊ะในร้าน
6. **จัดการออเดอร์** → ใช้ KDS และชำระเงิน

### สำหรับลูกค้า
1. **สแกน QR** → เข้าสู่หน้าเมนู
2. **เลือกอาหาร** → ใส่ตะกร้า
3. **สั่งอาหาร** → ยืนยันออเดอร์
4. **รออาหาร** → รับอาหารเมื่อพร้อม
5. **ชำระเงิน** → จ่ายที่เคาน์เตอร์

### สำหรับห้องครัว
1. **รับออเดอร์** → ดูใน KDS แบบ real-time
2. **ทำอาหาร** → อัปเดตสถานะเป็น "Cooking"
3. **เสิร์ฟอาหาร** → อัปเดตสถานะเป็น "Served"
4. **ปิดบิล** → กด "Paid" เพื่อเคลียร์โต๊ะ

---

## สถานะปัจจุบัน

| ฟีเจอร์ | สถานะ | เปอร์เซ็นต์ |
|-------|--------|-----------|
| Authentication | ✅ สำเร็จ | 95% (proxy issue) |
| Admin Dashboard | ✅ สำเร็จ | 100% |
| Menu Manager | ✅ สำเร็จ | 100% |
| QR System | ✅ สำเร็จ | 100% |
| Order Flow | ✅ สำเร็จ | 100% |
| KDS Real-time | ✅ สำเร็จ | 100% |
| **รวม** | **✅ พร้อมใช้** | **95%** |

---

## สำหรับนักพัฒนา

### โครงสร้างโปรเจคต
```
qr-order/
├── app/                    # Next.js pages
│   ├── [store_id]/        # Dynamic routes (customer)
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   └── login/             # Login page
├── components/            # UI components
├── lib/                   # Utilities
├── store/                 # State management
├── supabase/              # Database schema
├── proxy.ts               # Authentication middleware
└── README.md              # This file
```

### ข้อมูลสำคัญ
- **Framework:** Next.js 16 App Router
- **Database:** Supabase (PostgreSQL)
- **State:** Zustand
- **Styling:** Tailwind CSS + Shadcn UI
- **Auth:** Supabase Auth

---

## สรุป

**Bangsaen Smart Order** เป็นระบบ SaaS สำหรับร้านอาหารที่พร้อมใช้งานจริง 95% แล้ว! มีฟีเจอร์ครบถ้วนตั้งแต่การจัดการเมนู, ระบบสั่งอาหาร, ไปจนถึง KDS แบบ real-time ทำให้ร้านอาหารสามารถดำเนินธุรกิจได้ทันที

**เหลือแค่แก้ไขปัญหา Proxy Authentication และเพิ่ม Analytics Dashboard ก็จะสมบูรณ์ 100%!** 🚀
