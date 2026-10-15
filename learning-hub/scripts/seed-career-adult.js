#!/usr/bin/env node
/**
 * Seed tài khoản mẫu Người đi làm / Trái ngành (CAREER_ADULT) và kích hoạt tiến độ cả 3 lộ trình lab:
 *   node scripts/seed-career-adult.js                 # tạo/cập nhật tài khoản + nộp 1 bài mẫu mỗi lab (cần backend đang chạy)
 *   node scripts/seed-career-adult.js --no-activate   # chỉ tạo tài khoản
 *   node scripts/seed-career-adult.js --reset-password
 *   node scripts/seed-career-adult.js --remove        # gỡ tài khoản mẫu và bài nộp của nó
 *
 * Tài khoản: nguoidilam1@gmail.com — role STUDENT (hệ thống chỉ có 3 vai trò) với ageGroup = CAREER_ADULT.
 * Mật khẩu mẫu: biến SEED_CAREER_PASSWORD, mặc định "NguoiDiLam@2026" (đủ quy tắc mật khẩu mạnh; chỉ dùng cho demo).
 * Bài nộp mẫu được tạo qua API THẬT của backend (token ký cục bộ bằng JWT_SECRET) nên có đúng định dạng điểm/lịch sử
 * như học viên tự nộp, không ghi tay vào DB. Chạy lại không tạo trùng: lab nào đã có lịch sử thì bỏ qua.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const h = require('./lib/setup-helpers');

const BE = path.join(__dirname, '..', 'BE');
const envText = fs.existsSync(path.join(BE, '.env')) ? fs.readFileSync(path.join(BE, '.env'), 'utf8') : '';
const uri = process.env.DATABASE_URL || h.readEnvValue(envText, 'DATABASE_URL') || '';
const secret = process.env.JWT_SECRET || h.readEnvValue(envText, 'JWT_SECRET') || '';
const port = process.env.PORT || h.readEnvValue(envText, 'PORT') || '3000';
const BASE = process.env.SEED_API_BASE || `http://localhost:${port}/api`;
const args = process.argv.slice(2);
const noActivate = args.includes('--no-activate');
const resetPassword = args.includes('--reset-password');
const remove = args.includes('--remove');

const EMAIL = 'nguoidilam1@gmail.com';
const FULL_NAME = 'Người Đi Làm Mẫu 1';
const PASSWORD = process.env.SEED_CAREER_PASSWORD || 'NguoiDiLam@2026';

const SAMPLE = {
  sqlWrong: 'SELECT order_id, order_date FROM orders LIMIT 5',
  aiPrompt:
    'Bạn là trợ giảng học vụ của CyberSoft. Nhiệm vụ của bạn là trả lời câu hỏi FAQ của học viên một cách ngắn gọn, đúng quy chế, tối đa 2 câu. Nếu không có thông tin trong quy chế, hãy từ chối lịch sự.',
  tester: {
    testCases: [
      { code: 'TC01', description: 'Để trống email khi đăng nhập', input: 'email: (trống), mật khẩu: Abc@1234', expected: 'Báo lỗi "Vui lòng nhập email"' },
      { code: 'TC02', description: 'Email sai định dạng', input: 'email: abc@, mật khẩu: Abc@1234', expected: 'Báo lỗi email không hợp lệ' },
      { code: 'TC03', description: 'Mật khẩu dài nhất 32 ký tự (giá trị biên)', input: 'mật khẩu 32 ký tự', expected: 'Đăng nhập được' },
      { code: 'TC04', description: 'Nhập <script>alert(1)</script> vào họ tên (ký tự đặc biệt)', input: '<script>alert(1)</script>', expected: 'Chuỗi được mã hóa, không chạy script' },
      { code: 'TC05', description: 'Đăng ký email đã tồn tại (trùng)', input: 'email đã đăng ký', expected: 'Báo email đã được sử dụng' },
    ],
    bugReports: [
      {
        title: 'Đăng nhập sai mật khẩu 5 lần vẫn không bị khóa',
        steps: '1. Mở trang đăng nhập\n2. Nhập đúng email, sai mật khẩu 5 lần liên tiếp\n3. Quan sát thông báo',
        expected: 'Tài khoản bị tạm khóa hoặc yêu cầu chờ',
        actual: 'Vẫn cho thử tiếp không giới hạn',
        severity: 'HIGH',
      },
    ],
  },
};

async function api(token, method, p, body) {
  const res = await fetch(BASE + p, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* không phải JSON */ }
  return { status: res.status, json };
}

(async () => {
  if (!uri) { console.error('Thiếu DATABASE_URL.'); process.exit(1); }
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const bcrypt = require(path.join(BE, 'node_modules', 'bcrypt'));
  const jwt = require(path.join(BE, 'node_modules', 'jsonwebtoken'));
  console.log(`CSDL: ${uri.replace(/(:\/\/[^:/@]+:)[^@]*@/, '$1***@')}${remove ? '  [remove]' : ''}`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  let userId;
  try {
    const db = mongoose.connection.db;
    const users = db.collection('users');

    if (remove) {
      const u = await users.findOne({ email: EMAIL, isSeedCareerDemo: true });
      if (!u) { console.log('Không có tài khoản mẫu để gỡ.'); return; }
      const id = String(u._id);
      const a = await db.collection('da_lab_submissions').deleteMany({ userId: id });
      const b = await db.collection('ai_lab_submissions').deleteMany({ userId: id });
      const c = await db.collection('tester_lab_submissions').deleteMany({ userId: id });
      await users.deleteOne({ _id: u._id });
      console.log(`Đã gỡ tài khoản và ${a.deletedCount + b.deletedCount + c.deletedCount} bài nộp lab.`);
      return;
    }

    const now = new Date();
    const existing = await users.findOne({ email: EMAIL });
    if (existing && existing.role !== 'STUDENT') {
      console.error(`Email ${EMAIL} đã thuộc tài khoản ${existing.role}, không đổi vai trò. Dừng.`);
      process.exit(1);
    }
    // Tài khoản ĐÃ CÓ (vd tự đăng ký) thì chỉ đảm bảo nhóm CAREER_ADULT + ACTIVE: không đổi tên, avatar, mật khẩu (trừ khi
    // --reset-password) và KHÔNG gắn cờ seed (nên --remove không bao giờ xóa tài khoản thật). Chỉ tài khoản do script TẠO MỚI
    // mới có cờ isSeedCareerDemo.
    const res = existing
      ? await users.findOneAndUpdate(
          { email: EMAIL },
          { $set: { ageGroup: 'CAREER_ADULT', status: 'ACTIVE', updatedAt: now, ...(resetPassword ? { password: await bcrypt.hash(PASSWORD, 10) } : {}) } },
          { returnDocument: 'after' },
        )
      : await users.findOneAndUpdate(
          { email: EMAIL },
          {
            $set: { updatedAt: now },
            $setOnInsert: { email: EMAIL, fullName: FULL_NAME, role: 'STUDENT', ageGroup: 'CAREER_ADULT', status: 'ACTIVE', isSeedCareerDemo: true, password: await bcrypt.hash(PASSWORD, 10), phone: '', bio: '', createdAt: now },
          },
          { upsert: true, returnDocument: 'after' },
        );
    userId = String(res._id);
    console.log(`${existing ? 'Giữ tài khoản có sẵn' : 'Tạo tài khoản'} ${EMAIL} (STUDENT, ageGroup=CAREER_ADULT)${existing && !resetPassword ? ', giữ nguyên mật khẩu' : `, mật khẩu mẫu: ${PASSWORD}`}`);
    if (noActivate) return;

    // ---- Kích hoạt tiến độ cả 3 lộ trình bằng cách nộp 1 bài mẫu qua API thật ----
    if (!secret) { console.log('Thiếu JWT_SECRET: bỏ qua bước nộp bài mẫu.'); return; }
    const token = jwt.sign({ sub: userId, email: EMAIL, role: 'STUDENT' }, secret, { expiresIn: '10m' });
    const ping = await api(token, 'GET', '/da-labs').catch(() => ({ status: 0 }));
    if (ping.status !== 200) {
      console.log(`Backend chưa chạy tại ${BASE} (HTTP ${ping.status}): chưa nộp bài mẫu. Bật backend rồi chạy lại: node scripts/seed-career-adult.js`);
      return;
    }

    // Data Lab (SQL): nộp 1 câu sai rồi 1 câu đúng (đáp án mẫu) để có lịch sử 2 lần.
    const sqlLab = (ping.json || []).find((l) => l.type === 'SQL_LAB');
    if (sqlLab) {
      const hist = await api(token, 'GET', `/da-labs/${sqlLab.slug}/history`);
      if (Array.isArray(hist.json) && hist.json.length > 0) console.log(`- Data Lab: đã có ${hist.json.length} lần nộp, bỏ qua.`);
      else {
        const full = await db.collection('exercises').findOne({ slug: sqlLab.slug }, { projection: { solutionCode: 1 } });
        await api(token, 'POST', `/da-labs/${sqlLab.slug}/submit`, { sql: SAMPLE.sqlWrong });
        const ok = await api(token, 'POST', `/da-labs/${sqlLab.slug}/submit`, { sql: full.solutionCode });
        console.log(`- Data Lab (${sqlLab.slug}): đã nộp 2 lần, lần cuối ${ok.json && ok.json.status}`);
      }
    }

    // AI Lab (Prompting): 1 lần nộp (không bật Gemini để nhanh và tiết kiệm quota).
    const aiHist = await api(token, 'GET', '/ai-labs/ai-lab-01/my-submission');
    if (aiHist.json && aiHist.json.submissionId) console.log('- AI Lab: đã có bài nộp, bỏ qua.');
    else {
      const ai = await api(token, 'POST', '/ai-labs/ai-lab-01/submit', { prompt: SAMPLE.aiPrompt, model: 'gemini-2.5-flash-lite', config: { temperature: 0.2, maxTokens: 256 } });
      console.log(`- AI Lab (ai-lab-01): HTTP ${ai.status}${ai.json && ai.json.status ? `, ${ai.json.status} ${ai.json.score}/${ai.json.maxScore}` : ` ${JSON.stringify(ai.json).slice(0, 120)}`}`);
    }

    // Tester Lab (QA): 1 bài nộp bằng biểu mẫu.
    const mine = await api(token, 'GET', '/tester-labs/LAB-01/submissions/mine');
    if (Array.isArray(mine.json) && mine.json.length > 0) console.log(`- Tester Lab: đã có ${mine.json.length} bài nộp, bỏ qua.`);
    else {
      const t = await api(token, 'POST', '/tester-labs/LAB-01/form-submissions', SAMPLE.tester);
      console.log(`- Tester Lab (LAB-01): HTTP ${t.status}${t.json && t.json.statusLabel ? `, ${t.json.statusLabel}` : ''}`);
    }
    console.log(`Xong. Đăng nhập: ${EMAIL} / ${existing && !resetPassword ? '(mật khẩu hiện có)' : PASSWORD}`);
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
void crypto;
