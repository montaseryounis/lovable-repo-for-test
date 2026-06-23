
# منصة Magnific داخلية لفريق التصميم

منصة ويب تستخدم مفتاح Magnific API واحد (حساب Business) لخدمة فريق المصممين، مع تسجيل دخول وأدوار وتتبع كامل للاستخدام.

## الميزات

### أدوات Magnific (كلها)
1. **Upscaler** — تكبير وتحسين الصور (2x, 4x, ...)
2. **Relight** — إعادة إضاءة الصور (LightPlacer + Background)
3. **Mystic** — توليد صور من نص (Text-to-Image)
4. **Style Transfer** — نقل ستايل من صورة مرجعية
5. **Structure Reference** — الحفاظ على الهيكل
6. **Generative Fill** — تعبئة ذكية بـ prompt
7. **Eraser** — حذف عناصر من الصور
8. **Image-to-Image editing** بالـ prompt

### نظام المستخدمين
- تسجيل دخول بالإيميل/كلمة المرور
- دوران: **Admin** (إدارة الفريق + رؤية كل الاستخدام) و **Designer** (استخدام الأدوات)
- دعوة مصممين جدد من لوحة الـ Admin
- صفحة Profile لكل مستخدم

### التتبع (بدون حدود)
- سجل كل عملية: المستخدم، الأداة، التاريخ، حالة العملية، التكلفة التقريبية (credits)
- لوحة Admin: إحصائيات لكل مصمم (عدد العمليات، التكلفة، آخر نشاط)
- فلترة بالتاريخ والأداة والمستخدم
- تصدير CSV

### معرض الأعمال
- كل مصمم يرى أعماله السابقة (Before/After)
- إعادة تحميل الصور الناتجة
- Admin يرى كل أعمال الفريق

## التصميم

واجهة احترافية شبيهة بـ Magnific الأصلي:
- شريط جانبي للتنقل بين الأدوات
- منطقة عمل مركزية (رفع صورة + إعدادات + معاينة Before/After slider)
- Dark mode افتراضي
- Tailwind + shadcn/ui

## التفاصيل التقنية

### Backend
- **Lovable Cloud** (Supabase) للقاعدة والـ Auth والتخزين
- **TanStack Start server functions** للاتصال بـ Magnific API (المفتاح يبقى server-side فقط)
- Server routes للـ webhooks الخاصة بـ Magnific (العمليات async — Magnific يستخدم webhook callbacks)

### قاعدة البيانات
```text
profiles (id, email, full_name, avatar_url, created_at)
user_roles (user_id, role: 'admin'|'designer')  -- جدول منفصل (أمان)
jobs (
  id, user_id, tool, status, magnific_request_id,
  input_url, output_url, params (jsonb),
  credits_used, created_at, completed_at, error
)
assets (id, user_id, job_id, storage_path, kind: 'input'|'output')
```
RLS: Designer يرى أعماله فقط، Admin يرى الكل.

### تخزين الصور
- Bucket في Lovable Cloud Storage:
  - `inputs/` — الصور المرفوعة
  - `outputs/` — نواتج Magnific (تُجلب من URLs المؤقتة وتُحفظ)

### تكامل Magnific
- المفتاح يُخزّن كـ secret: `MAGNIFIC_API_KEY`
- Server function لكل أداة (POST لرفع المهمة)
- Server route عام: `/api/public/magnific-webhook` لاستقبال نتائج المهام
- Polling احتياطي للحالة في الواجهة (TanStack Query)

### الصفحات/المسارات
```text
/auth                              صفحة دخول/تسجيل
/_authenticated/                   layout محمي
  /                                Dashboard (أعمالي الأخيرة)
  /tools/upscaler
  /tools/relight
  /tools/generate                  Mystic
  /tools/style-transfer
  /tools/generative-fill
  /tools/eraser
  /jobs/$jobId                     تفاصيل عملية مع before/after
  /history                         سجل أعمالي
  /admin/team                      إدارة المصممين (Admin only)
  /admin/usage                     تتبع الاستخدام (Admin only)
```

## خطوات التنفيذ

1. تفعيل Lovable Cloud وإنشاء الجداول + RLS + has_role function + storage bucket
2. إضافة `MAGNIFIC_API_KEY` كـ secret
3. صفحة /auth (email + password) + layout `_authenticated`
4. Shell التطبيق (sidebar + topbar) + dark theme
5. Server functions لرفع الصور وإنشاء مهام Magnific لكل أداة
6. Server route للـ webhook + تحديث جدول jobs
7. واجهات الأدوات الواحدة تلو الأخرى (نبدأ بـ Upscaler + Generate)
8. صفحة Job details مع Before/After slider
9. صفحة History
10. لوحة Admin: إدارة الفريق + تتبع الاستخدام + تصدير CSV

## ملاحظات مهمة

- **مفتاح Magnific لا يصل أبداً للمتصفح** — كل النداءات عبر server functions.
- Magnific API يعمل async عبر webhooks، فالـ UI سيُظهر "Processing..." ويُحدّث تلقائياً عند وصول النتيجة.
- التكلفة (credits) تُحسب من استجابة Magnific وتُخزّن في جدول jobs للتتبع.
- لو هناك تفاصيل خاصة في توثيق Magnific Business API (شكل endpoints/الـ webhook signature)، أحتاج رابط التوثيق أو مثال request — لكن يمكن البدء بالبنية وأملأ التفاصيل لاحقاً.
