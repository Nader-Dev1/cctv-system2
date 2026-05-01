# TechSec — نظام الإدارة المتكامل

نظام إدارة متكامل لشركات الكاميرات والشبكات.

## المميزات
- إدارة المنتجات (CCTV / شبكات) مع تنبيه المخزون
- إدارة العملاء مع سجل كامل
- نظام الصيانة بتذاكر وحالات
- إدارة الموظفين والحضور
- فواتير بيع وصيانة مع PDF

---

## تشغيل المشروع محلياً

### المتطلبات
- Node.js v18 أو أحدث
- npm

### الخطوات

```bash
# 1. تثبيت الـ Backend
cd backend
npm install
node server.js
# سيعمل على http://localhost:3001

# 2. في terminal ثاني — تشغيل الـ Frontend
cd frontend
npm install
npm run dev
# سيعمل على http://localhost:5173
```

---

## الرفع على Railway (مجاني)

### الخطوة 1: بناء الـ Frontend
```bash
cd frontend
npm install
npm run build
```
سيتم إنشاء مجلد `frontend/dist`

### الخطوة 2: رفع على Railway
1. اذهب إلى [railway.app](https://railway.app)
2. سجل بـ GitHub
3. اضغط "New Project" → "Deploy from GitHub"
4. ارفع المجلد على GitHub أولاً، ثم اربطه
5. في إعدادات Railway:
   - **Root Directory**: `backend`
   - **Start Command**: `node server.js`
   - **Environment**: أضف `NODE_ENV=production`

### الخطوة 3: قبل الرفع — انسخ الـ dist
```bash
# من مجلد الـ root
cp -r frontend/dist backend/public
```
وعدّل في `backend/server.js`:
```js
app.use(express.static(path.join(__dirname, 'public')));
```

---

## الرفع على Render (مجاني)

1. اذهب إلى [render.com](https://render.com)
2. "New Web Service"
3. اربط GitHub repo
4. الإعدادات:
   - **Build Command**: `cd frontend && npm install && npm run build && cp -r dist ../backend/public && cd ../backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Environment Variable**: `NODE_ENV=production`

---

## هيكل المشروع

```
cctv-system/
├── backend/
│   ├── server.js          # Express server
│   ├── database.js        # SQLite setup
│   ├── routes/
│   │   ├── dashboard.js
│   │   ├── products.js
│   │   ├── customers.js
│   │   ├── maintenance.js
│   │   ├── employees.js
│   │   └── invoices.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── pages/         # Dashboard, Products, Customers...
│   │   ├── components/    # Sidebar
│   │   └── context/       # Toast notifications
│   └── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | إحصائيات عامة |
| GET/POST | /api/products | المنتجات |
| PUT/DELETE | /api/products/:id | تعديل/حذف منتج |
| GET/POST | /api/customers | العملاء |
| GET/POST | /api/maintenance | تذاكر الصيانة |
| GET/POST | /api/employees | الموظفين |
| POST | /api/employees/:id/attendance | حضور |
| GET/POST | /api/invoices | الفواتير |
| GET | /api/invoices/:id/pdf | تحميل PDF |
