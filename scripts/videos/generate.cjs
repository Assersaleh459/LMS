'use strict';

// Tutorial video generator for مدرستي LMS
// Logs into the live app as each role, captures screenshots with bilingual captions,
// then stitches them into MP4 files — one per role.

const { chromium } = require('playwright');
const ffmpeg        = require('fluent-ffmpeg');
const ffmpegPath    = require('ffmpeg-static');
const fs            = require('fs');
const path          = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const BASE_URL       = 'https://lms-egypt.vercel.app';
const ROOT           = path.join(__dirname, '..', '..');
const SCREENSHOTS_DIR = path.join(ROOT, '.tmp', 'screenshots');
const VIDEOS_DIR     = path.join(ROOT, 'videos');
const VIEWPORT       = { width: 1280, height: 720 };
const SLIDE_DURATION = 4; // seconds each screenshot is shown

// ─── Role definitions ────────────────────────────────────────────────────────

const ROLES = [
  {
    id: 'admin',
    email: 'admin@farabi.edu.eg',
    password: 'Test@1234',
    nameAr: 'مدير المدرسة',
    nameEn: 'School Admin',
    steps: [
      { url: '/admin',                ar: 'لوحة التحكم — نظرة عامة على صحة المدرسة والطلاب المعرضين للخطر',        en: 'Dashboard — School health score & at-risk students panel' },
      { url: '/admin/users',          ar: 'إدارة المستخدمين — إضافة وتعديل وإعادة تعيين كلمات المرور',              en: 'User Management — Add, edit & reset passwords' },
      { url: '/admin/timetable',      ar: 'الجدول الدراسي — إنشاء وتعديل جداول الحصص لكل الصفوف',                   en: 'Timetable — Create & manage class schedules' },
      { url: '/admin/absence-report', ar: 'تقرير الغياب — متابعة الغياب التفصيلي لجميع الصفوف',                     en: 'Absence Report — Detailed attendance tracking for all classes' },
      { url: '/admin/academic-year',  ar: 'العام الدراسي — إدارة الفصول الدراسية والترحيل السنوي',                   en: 'Academic Year — Manage terms & yearly rollover' },
      { url: '/admin/settings',       ar: 'إعدادات المدرسة — بيانات وشعار المدرسة ورمز الوزارة',                    en: 'School Settings — School profile, logo & MoE code' },
      { url: '/admin/permissions',    ar: 'الصلاحيات والأدوار — تخصيص صلاحيات كل دور وإنشاء أدوار مخصصة',          en: 'Roles & Permissions — Customize access per role & create custom roles' },
      { url: '/admin/audit',          ar: 'سجل النظام — مراجعة جميع الأنشطة والتغييرات في المنصة',                  en: 'System Audit Log — Review all platform activity & changes' },
    ],
  },
  {
    id: 'teacher',
    email: 'teacher@farabi.edu.eg',
    password: 'Test@1234',
    nameAr: 'معلم المادة',
    nameEn: 'Subject Teacher',
    steps: [
      { url: '/teacher',                  ar: 'لوحة التحكم — ملخص الفصول والغياب والتسليمات غير المصححة',              en: 'Dashboard — Classes, absences & ungraded submissions summary' },
      { url: '/teacher/attendance',       ar: 'الحضور والغياب — تسجيل حضور الطلاب يومياً مع التزامن دون إنترنت',        en: 'Attendance — Record daily attendance with offline sync' },
      { url: '/teacher/grades',           ar: 'دفتر الدرجات — تسجيل درجات التحريري والشفهي والعملي والنشاط',           en: 'Gradebook — Enter written, oral, practical & activity grades' },
      { url: '/teacher/grades/analytics', ar: 'تحليل الدرجات — إحصاءات وتوزيع الدرجات ومقارنة الأداء',                en: 'Grade Analytics — Statistics, distribution & performance comparison' },
      { url: '/teacher/assignments',      ar: 'الواجبات — إنشاء وإدارة الواجبات المنزلية وتصحيح التسليمات',            en: 'Assignments — Create, manage & grade homework submissions' },
      { url: '/teacher/conduct',          ar: 'سجل السلوك — تدوين ملاحظات إيجابية وسلبية على سلوك الطلاب',             en: 'Conduct Log — Record positive & negative student behavior notes' },
      { url: '/courses',                  ar: 'المواد والكورسات — إدارة الوحدات والدروس والاختبارات وبنك الأسئلة',      en: 'Courses — Manage units, lessons, quizzes & question bank' },
      { url: '/teacher/timetable',        ar: 'جدولي — عرض جدول حصصي الأسبوعي',                                        en: 'My Timetable — View weekly class schedule' },
      { url: '/teacher/profile',          ar: 'الملف الشخصي — تحديث بياناتي الشخصية',                                   en: 'Profile — Update personal information' },
    ],
  },
  {
    id: 'homeroom',
    email: 'homeroom@farabi.edu.eg',
    password: 'Test@1234',
    nameAr: 'المعلم المنزلي',
    nameEn: 'Homeroom Teacher',
    steps: [
      { url: '/teacher',            ar: 'لوحة التحكم — ملخص فصلك الدراسي',                              en: 'Dashboard — Your class overview' },
      { url: '/teacher/attendance', ar: 'الحضور والغياب — تسجيل حضور طلاب الفصل',                      en: 'Attendance — Record class attendance' },
      { url: '/teacher/grades',     ar: 'دفتر الدرجات — متابعة درجات جميع طلاب الفصل',                 en: 'Gradebook — Monitor all class grades' },
      { url: '/teacher/timetable',  ar: 'الجدول الدراسي — جدول حصص الفصل',                             en: 'Timetable — Class schedule' },
      { url: '/teacher/conduct',    ar: 'سجل السلوك — متابعة سلوك الطلاب وتدوين الملاحظات',             en: 'Conduct Log — Monitor & record student behavior' },
    ],
  },
  {
    id: 'parent',
    email: 'parent@farabi.edu.eg',
    password: 'Test@1234',
    nameAr: 'ولي الأمر',
    nameEn: 'Parent',
    steps: [
      { url: '/parent',   ar: 'لوحة التحكم — درجات وحضور وواجبات ابنك/ابنتك في مكان واحد',    en: 'Dashboard — Child\'s grades, attendance & assignments in one place' },
      { url: '/messages', ar: 'الرسائل — تواصل مباشر مع معلمي ابنك/ابنتك',                    en: 'Messages — Direct chat with your child\'s teachers' },
    ],
  },
  {
    id: 'student-primary',
    email: 'student.primary@farabi.edu.eg',
    password: 'Test@1234',
    nameAr: 'طالب المرحلة الابتدائية',
    nameEn: 'Primary Student',
    steps: [
      { url: '/student/primary',     ar: 'لوحة التحكم — ملخص درجاتي وحضوري',                             en: 'Dashboard — My grades & attendance summary' },
      { url: '/student/grades',      ar: 'درجاتي — عرض جميع الدرجات بجميع المواد',                       en: 'My Grades — View all grades by subject' },
      { url: '/student/assignments', ar: 'الواجبات — عرض الواجبات المطلوبة وتسليمها',                    en: 'Assignments — View due homework & submit work' },
      { url: '/student/timetable',   ar: 'جدولي — الجدول الدراسي الأسبوعي',                              en: 'My Timetable — Weekly class schedule' },
      { url: '/courses',             ar: 'الكورسات — الدروس التفاعلية والاختبارات الإلكترونية',           en: 'Courses — Interactive lessons & online quizzes' },
    ],
  },
  {
    id: 'student-secondary',
    email: 'student.sec@farabi.edu.eg',
    password: 'Test@1234',
    nameAr: 'طالب المرحلة الثانوية',
    nameEn: 'Secondary Student',
    steps: [
      { url: '/student/secondary',   ar: 'لوحة التحكم — درجات الثانوية بالمعادلة الوزارية (٤٠/٦٠)',      en: 'Dashboard — Secondary grades with MoE 40/60 weighting' },
      { url: '/student/grades',      ar: 'درجاتي — الدرجات المرجحة بالتفصيل لكل مادة',                   en: 'My Grades — Weighted grades breakdown per subject' },
      { url: '/student/timetable',   ar: 'جدولي — الجدول الأسبوعي للحصص',                               en: 'My Timetable — Weekly class schedule' },
      { url: '/student/assignments', ar: 'الواجبات — المهام والتسليمات المطلوبة',                         en: 'Assignments — Due tasks & submissions' },
    ],
  },
  {
    id: 'student-kg',
    email: 'student.kg@farabi.edu.eg',
    password: 'Test@1234',
    nameAr: 'طالب رياض الأطفال',
    nameEn: 'KG Student',
    steps: [
      { url: '/student/kg',       ar: 'لوحة التحكم — ملخص التقييم الوصفي لطفلك',                      en: 'Dashboard — Descriptive assessment summary' },
      { url: '/student/grades/kg', ar: 'تقييمي — ممتاز / جيد جداً / جيد / يحتاج تحسين',              en: 'My Assessment — Excellent / Very Good / Good / Needs Improvement' },
    ],
  },
  {
    id: 'chain-admin',
    email: 'chain@farabi.edu.eg',
    password: 'Test@1234',
    nameAr: 'مدير السلسلة',
    nameEn: 'Chain Admin',
    steps: [
      { url: '/chain', ar: 'لوحة التحكم — إحصاءات وأداء جميع المدارس في السلسلة',                      en: 'Dashboard — Cross-school stats & performance overview' },
    ],
  },
  {
    id: 'moe-supervisor',
    email: 'moe@farabi.edu.eg',
    password: 'Test@1234',
    nameAr: 'مشرف وزارة التربية والتعليم',
    nameEn: 'MoE Supervisor',
    steps: [
      { url: '/chain', ar: 'لوحة الإشراف — عرض قراءة فقط للإحصاءات على مستوى السلسلة',               en: 'Supervision Dashboard — Read-only cross-school statistics view' },
    ],
  },
  {
    id: 'it-admin',
    email: 'it@farabi.edu.eg',
    password: 'Test@1234',
    nameAr: 'مدير تقنية المعلومات',
    nameEn: 'IT Admin',
    steps: [
      { url: '/it-admin', ar: 'لوحة النظام — مراقبة صحة المنصة واستخدام الموارد',                     en: 'System Dashboard — Monitor platform health & resource usage' },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function login(page, email, password) {
  // Navigate to root — React Router handles redirect to /login
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 25000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

async function captureStep(page, step, outputPath) {
  try {
    await page.goto(`${BASE_URL}${step.url}`, { waitUntil: 'networkidle', timeout: 25000 });
  } catch {
    // networkidle timeout is fine — page loaded, React just has pending requests
  }
  await page.waitForTimeout(2000);

  // Inject bilingual caption bar at the bottom
  await page.evaluate(({ ar, en }) => {
    const old = document.getElementById('__tut');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = '__tut';
    el.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0',
      'background:linear-gradient(transparent,rgba(0,0,0,0.82))',
      'color:#fff', 'padding:28px 32px 18px', 'z-index:2147483647',
      'font-family:Cairo,"Noto Sans Arabic",Arial,sans-serif',
      'text-align:center', 'pointer-events:none',
    ].join(';');
    el.innerHTML =
      `<div style="font-size:21px;font-weight:700;direction:rtl;margin-bottom:5px;` +
      `text-shadow:0 1px 4px rgba(0,0,0,0.7)">${ar}</div>` +
      `<div style="font-size:13px;opacity:0.88;font-family:Arial,sans-serif;letter-spacing:.3px">${en}</div>`;
    document.body.appendChild(el);
  }, { ar: step.ar, en: step.en });

  await page.screenshot({ path: outputPath });
}

function makeVideo(role, screenshotsDir, outputPath) {
  const files = fs.readdirSync(screenshotsDir)
    .filter(f => f.endsWith('.png'))
    .sort()
    .map(f => path.join(screenshotsDir, f).replace(/\\/g, '/'));

  if (!files.length) throw new Error(`No screenshots found for role: ${role.id}`);

  // Build FFmpeg concat list (each slide held for SLIDE_DURATION seconds)
  const concatPath = path.join(screenshotsDir, 'concat.txt');
  const lines = files.map(f => `file '${f}'\nduration ${SLIDE_DURATION}`);
  lines.push(`file '${files[files.length - 1]}'`); // repeat last (ffmpeg quirk)
  fs.writeFileSync(concatPath, lines.join('\n'));

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions([
        '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black',
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-r 30',
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  ensureDir(SCREENSHOTS_DIR);
  ensureDir(VIDEOS_DIR);

  const only = process.argv[2]; // optional: pass a role id to run only that one
  const roles = only ? ROLES.filter(r => r.id === only) : ROLES;

  if (!roles.length) {
    console.error(`No role found with id: ${only}`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });

  for (const role of roles) {
    console.log(`\n▶  ${role.nameEn} — ${role.nameAr}`);
    const roleDir = path.join(SCREENSHOTS_DIR, role.id);
    ensureDir(roleDir);

    // Fresh isolated browser context per role (no shared cookies)
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page    = await context.newPage();

    try {
      console.log(`   Logging in as ${role.email} …`);
      await login(page, role.email, role.password);
      console.log(`   ✓ Logged in`);

      for (let i = 0; i < role.steps.length; i++) {
        const step     = role.steps[i];
        const filename = `${String(i + 1).padStart(3, '0')}.png`;
        const outPath  = path.join(roleDir, filename);
        console.log(`   [${i + 1}/${role.steps.length}] ${step.url}`);
        await captureStep(page, step, outPath);
      }
    } catch (err) {
      console.error(`   ✗ Error during capture: ${err.message}`);
    } finally {
      await context.close();
    }

    const videoPath = path.join(VIDEOS_DIR, `${role.id}.mp4`);
    console.log(`   Assembling → ${path.basename(videoPath)}`);
    try {
      await makeVideo(role, roleDir, videoPath);
      console.log(`   ✓ ${path.basename(videoPath)} saved`);
    } catch (err) {
      console.error(`   ✗ FFmpeg error: ${err.message}`);
    }
  }

  await browser.close();
  console.log(`\n✅  Done — videos saved to: ${VIDEOS_DIR}\n`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
