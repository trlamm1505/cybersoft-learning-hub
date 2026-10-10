const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('net');
const h = require('./setup-helpers');

test('versionAtLeast so sánh đúng từng số', () => {
  assert.equal(h.versionAtLeast('v22.1.0', '20.12.0'), true);
  assert.equal(h.versionAtLeast('20.12.0', '20.12.0'), true);
  assert.equal(h.versionAtLeast('20.11.9', '20.12.0'), false);
  assert.equal(h.versionAtLeast('18.20.4', '20.12.0'), false);
  assert.equal(h.versionAtLeast('v24.14.0', '20.12.0'), true);
});

test('generateSecret: đủ dài, không trùng, chỉ ký tự an toàn cho .env', () => {
  const a = h.generateSecret();
  const b = h.generateSecret();
  assert.notEqual(a, b);
  assert.ok(a.length >= 48);
  assert.match(a, /^[A-Za-z0-9_-]+$/);
});

test('renderEnv điền biến trống, giữ biến đã có giá trị và dòng chú thích', () => {
  const example = ['# chú thích', 'PORT=3000', 'JWT_SECRET=', 'GEMINI_API_KEY=""', 'DATA_SERVICE_BASE_URL=', 'NAME="a b"'].join('\n');
  const out = h.renderEnv(example, { JWT_SECRET: 'xyz' });
  assert.match(out, /^JWT_SECRET="xyz"$/m);
  assert.match(out, /^PORT=3000$/m);
  assert.match(out, /^GEMINI_API_KEY=""$/m); // không có trong fill: để nguyên
  assert.match(out, /^# chú thích$/m);
  assert.match(out, /^NAME="a b"$/m);
});

test('renderEnv không ghi đè biến đã có giá trị dù có trong fill', () => {
  assert.equal(h.renderEnv('JWT_SECRET=abc', { JWT_SECRET: 'new' }), 'JWT_SECRET=abc');
});

test('readEnvValue bỏ ngoặc kép và trả undefined khi không có', () => {
  const text = 'A="x"\nB=y\nC=\n';
  assert.equal(h.readEnvValue(text, 'A'), 'x');
  assert.equal(h.readEnvValue(text, 'B'), 'y');
  assert.equal(h.readEnvValue(text, 'C'), '');
  assert.equal(h.readEnvValue(text, 'D'), undefined);
});

test('parseMongoTarget: local, có tài khoản, nhiều host, Atlas srv, rỗng', () => {
  assert.deepEqual(h.parseMongoTarget('mongodb://localhost:27017/cybersoft'), { host: 'localhost', port: 27017, external: false });
  assert.deepEqual(h.parseMongoTarget('mongodb://127.0.0.1/db'), { host: '127.0.0.1', port: 27017, external: false });
  assert.deepEqual(h.parseMongoTarget('mongodb://user:pw@db.example.com:27018/x'), { host: 'db.example.com', port: 27018, external: true });
  assert.equal(h.parseMongoTarget('mongodb+srv://u:p@cluster0.mongodb.net/x').external, true);
  assert.deepEqual(h.parseMongoTarget(''), { host: 'localhost', port: 27017, external: false });
});

test('needsSeed: chỉ khi MỌI collection chính đều trống (không bao giờ seed đè dữ liệu thật)', () => {
  assert.equal(h.needsSeed({ users: 0, exercises: 0, questions: 0 }), true);
  assert.equal(h.needsSeed({ users: 1, exercises: 0, questions: 0 }), false);
  assert.equal(h.needsSeed({ users: 0, exercises: 76, questions: 0 }), false);
});

test('tcpOpenSync: true khi có server nghe (kết nối hoàn tất ở tầng OS dù vòng lặp bị chặn), false khi cổng đóng', async () => {
  const server = net.createServer().listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const { port } = server.address();
  assert.equal(h.tcpOpenSync('127.0.0.1', port), true);
  server.close();
  assert.equal(h.tcpOpenSync('127.0.0.1', 1), false);
});
