import { describe, expect, it } from 'vitest';
import {
  AUDIT_LABEL,
  AUDIT_TONE,
  ageGroupLabel,
  CLASS_AGE_FILTERS,
  CLASS_STATUS,
  classActionLabel,
  countByAgeGroup,
  filterClasses,
  type ClassFilter,
  auditActionLabel,
  buildDiffView,
  hideIds,
  EXERCISE_STATUS,
  filterByText,
  initials,
  rankStudentSuggestions,
  removeTeacher,
  unassignedTeachers,
  auditTargetLabel,
  barHeights,
  changedKeys,
  charCounter,
  DASHBOARD_REFETCH_MS,
  formatLatency,
  HEALTH_LIGHT,
  HEALTH_TONE,
  isSelectable,
  percent,
  prettyJson,
  QUERY_STALE_MS,
  selectionLabel,
  shortDay,
  toggleId,
  togglePage,
  toggleTeacher,
  validateApiKey,
  validatePrompt,
} from './adminPortalModel';

describe('cấu hình làm mới dữ liệu', () => {
  it('Dashboard làm mới mỗi 30 giây, dữ liệu tươi 10 giây', () => {
    expect(DASHBOARD_REFETCH_MS).toBe(30_000);
    expect(QUERY_STALE_MS).toBe(10_000);
  });
});

describe('chọn nhiều người dùng', () => {
  it('toggleId bất biến: thêm rồi bỏ', () => {
    const a = new Set<string>();
    const b = toggleId(a, 'x');
    expect([...a]).toEqual([]);
    expect([...b]).toEqual(['x']);
    expect([...toggleId(b, 'x')]).toEqual([]);
  });

  it('togglePage: chưa đủ thì chọn thêm hết, đủ rồi thì bỏ hết trang (giữ lựa chọn ở trang khác)', () => {
    const picked = togglePage(new Set(['other']), ['a', 'b']);
    expect([...picked].sort()).toEqual(['a', 'b', 'other']);
    const cleared = togglePage(picked, ['a', 'b']);
    expect([...cleared]).toEqual(['other']);
    expect([...togglePage(new Set(), [])]).toEqual([]);
  });

  it('thanh nổi hiển thị đúng "Đã chọn X người dùng"', () => {
    expect(selectionLabel(3)).toBe('Đã chọn 3 người dùng');
  });

  it('không chọn được chính mình hoặc tài khoản Admin', () => {
    expect(isSelectable({ id: 'u1', role: 'STUDENT' }, 'me')).toBe(true);
    expect(isSelectable({ id: 'me', role: 'TEACHER' }, 'me')).toBe(false);
    expect(isSelectable({ id: 'a1', role: 'ADMIN' }, 'me')).toBe(false);
  });
});

describe('nhật ký (audit)', () => {
  it('nhãn hành động đúng yêu cầu: KHÓA USER, GÁN LỚP, ĐỔI API KEY', () => {
    expect(auditActionLabel({ action: 'USER_LOCK', targetId: 'u' })).toBe('KHÓA USER');
    expect(auditActionLabel({ action: 'CLASS_ASSIGN', targetId: 'c' })).toBe('GÁN LỚP');
    expect(auditActionLabel({ action: 'CONFIG_UPDATE', targetId: 'GEMINI_API_KEY' })).toBe('ĐỔI API KEY');
    expect(auditActionLabel({ action: 'CONFIG_UPDATE', targetId: 'prompt.coach' })).toBe('ĐỔI PROMPT');
  });

  it('mọi hành động đều có nhãn và màu', () => {
    for (const k of Object.keys(AUDIT_LABEL)) expect(AUDIT_TONE[k as keyof typeof AUDIT_TONE]).toBeTruthy();
  });

  it('đối tượng hiển thị thân thiện: email, tên lớp, tên cấu hình, số người trong thao tác hàng loạt', () => {
    const diff = (after: unknown) => ({ before: null, after });
    expect(auditTargetLabel({ targetType: 'USER', targetId: 'u1', diff: diff({ email: 'a@x.vn' }) })).toBe('a@x.vn');
    expect(auditTargetLabel({ targetType: 'CLASS', targetId: 'c1', diff: diff({ className: '10A1' }) })).toBe('Lớp 10A1');
    expect(auditTargetLabel({ targetType: 'CONFIG', targetId: 'prompt.ailab', diff: diff({}) })).toBe('Prompt AI Lab Evaluator');
    expect(auditTargetLabel({ targetType: 'USER', targetId: 'bulk:5', diff: diff([]) })).toBe('5 người dùng');
    expect(auditTargetLabel({ targetType: 'USER', targetId: 'u9', diff: { before: null, after: null } })).toBe('u9');
  });

  it('diff: prettyJson thụt lề, null có nhãn; changedKeys chỉ trả trường khác nhau', () => {
    expect(prettyJson({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(prettyJson(null)).toContain('không có');
    expect(changedKeys({ status: 'ACTIVE', role: 'STUDENT' }, { status: 'LOCKED', role: 'STUDENT' })).toEqual(['status']);
    expect(changedKeys(null, { a: 1 })).toEqual(['a']);
    expect(changedKeys('x', 'y')).toEqual([]);
  });
});

describe('trạng thái hệ thống', () => {
  it('đèn xanh/vàng/đỏ khớp trạng thái', () => {
    expect(HEALTH_LIGHT).toEqual({ HEALTHY: '🟢', DEGRADED: '🟡', DOWN: '🔴' });
    expect(HEALTH_TONE).toEqual({ HEALTHY: 'green', DEGRADED: 'yellow', DOWN: 'red' });
  });

  it('formatLatency', () => {
    expect(formatLatency(240.4)).toBe('240 ms');
    expect(formatLatency(null)).toBe('—');
    expect(formatLatency(NaN)).toBe('—');
  });
});

describe('biểu đồ Dashboard', () => {
  it('barHeights: cột lớn nhất 100, ngày 0 bài = 0, giá trị nhỏ vẫn thấy được', () => {
    expect(barHeights([0, 5, 10])).toEqual([0, 50, 100]);
    expect(barHeights([0, 0])).toEqual([0, 0]);
    expect(barHeights([1, 1000])[0]).toBeGreaterThanOrEqual(4);
  });

  it('shortDay và percent', () => {
    expect(shortDay('2026-10-16')).toBe('T6 16/10');
    expect(shortDay('xx')).toBe('xx');
    expect(percent(1, 4)).toBe(25);
    expect(percent(5, 0)).toBe(0);
  });

  it('nhãn khối tuổi', () => {
    expect(ageGroupLabel('CAREER_ADULT')).toBe('Người đi làm');
    expect(ageGroupLabel('6-9')).toBe('Khối 6-9 tuổi');
    expect(ageGroupLabel(null)).toBe('Chưa chọn');
  });
});

describe('cấu hình hệ thống', () => {
  it('bộ đếm ký tự đổi trạng thái khi gần/vượt giới hạn', () => {
    expect(charCounter(100, 8000).tone).toBe('ok');
    expect(charCounter(7300, 8000).tone).toBe('warn');
    expect(charCounter(8001, 8000).tone).toBe('over');
    expect(charCounter(5, 8000).text).toContain('/');
  });

  it('validatePrompt: trống = về mặc định; quá ngắn/dài bị chặn', () => {
    expect(validatePrompt('   ', 8000)).toBeNull();
    expect(validatePrompt('ngắn', 8000)).toMatch(/20 ký tự/);
    expect(validatePrompt('x'.repeat(30), 8000)).toBeNull();
    expect(validatePrompt('x'.repeat(9000), 8000)).toMatch(/tối đa/);
  });

  it('validateApiKey: độ dài và khoảng trắng', () => {
    expect(validateApiKey('ngắn')).toBeTruthy();
    expect(validateApiKey('AIza' + 'x'.repeat(30))).toBeNull();
    expect(validateApiKey('co khoang trang ' + 'x'.repeat(30))).toBeTruthy();
  });
});

describe('phân công giảng viên', () => {
  it('giữ thứ tự chọn (người đầu là chính), bật/tắt, chặn quá giới hạn', () => {
    expect(toggleTeacher([], 'a')).toEqual(['a']);
    expect(toggleTeacher(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleTeacher(['a', 'b'], 'a')).toEqual(['b']);
    expect(toggleTeacher(['a', 'b'], 'c', 2)).toEqual(['a', 'b']);
  });
});

describe('lớp học & khóa học', () => {
  const rows = [
    { name: 'Lập trình Sáng tạo Nhí (K3-5)', code: 'CL-35KID01', ageGroup: '3-5', status: 'OPEN', teachers: [{ name: 'Cô Hương' }] },
    { name: 'Python Căn bản (K6-9)', code: 'CL-69PY01', ageGroup: '6-9', status: 'ARCHIVED', teachers: [{ name: 'Cô Lan' }] },
    { name: 'Kiểm thử phần mềm thực chiến (Tester QA)', code: 'CL-CAREER-TESTER', ageGroup: 'CAREER_ADULT', status: 'OPEN', teachers: [{ name: 'Thầy Bảo' }] },
    { name: 'Phân tích dữ liệu & Truy vấn SQL (Data Lab)', code: 'CL-CAREER-DATA', ageGroup: 'CAREER_ADULT', status: 'OPEN', teachers: [] },
  ];

  it('hai trạng thái có nhãn, màu và giải thích nghiệp vụ khác nhau', () => {
    expect(CLASS_STATUS.OPEN.label).toBe('Đang hoạt động');
    expect(CLASS_STATUS.OPEN.hint).toMatch(/nộp bài/);
    expect(CLASS_STATUS.ARCHIVED.label).toBe('Lưu trữ / Đã bế giảng');
    expect(CLASS_STATUS.ARCHIVED.hint).toMatch(/không còn nộp bài mới/);
    expect(CLASS_STATUS.OPEN.tone).not.toBe(CLASS_STATUS.ARCHIVED.tone);
    expect(classActionLabel('OPEN')).toBe('Chuyển vào Lưu trữ');
    expect(classActionLabel('ARCHIVED')).toBe('Kích hoạt lại');
  });

  it('bộ lọc khối: Tất cả | 3–5 | 6–9 | 10–12 | Người đi làm', () => {
    expect(CLASS_AGE_FILTERS.map((f) => f.label)).toEqual(['Tất cả', 'Lớp 3–5', 'Lớp 6–9', 'Lớp 10–12', 'Người đi làm']);
  });

  it('lọc theo khối, trạng thái và từ khóa (tên, mã, giảng viên)', () => {
    const none: ClassFilter = { ageGroup: '', status: '', q: '' };
    expect(filterClasses(rows, none)).toHaveLength(4);
    expect(filterClasses(rows, { ...none, ageGroup: 'CAREER_ADULT' }).map((r) => r.code)).toEqual(['CL-CAREER-TESTER', 'CL-CAREER-DATA']);
    expect(filterClasses(rows, { ...none, status: 'ARCHIVED' }).map((r) => r.code)).toEqual(['CL-69PY01']);
    expect(filterClasses(rows, { ...none, q: 'bảo' }).map((r) => r.code)).toEqual(['CL-CAREER-TESTER']);
    expect(filterClasses(rows, { ...none, q: 'cl-35' }).map((r) => r.code)).toEqual(['CL-35KID01']);
    expect(filterClasses(rows, { ageGroup: '6-9', status: 'OPEN', q: '' })).toEqual([]);
  });

  it('đếm số lớp theo khối cho các tab lọc', () => {
    expect(countByAgeGroup(rows)).toEqual({ '': 4, '3-5': 1, '6-9': 1, CAREER_ADULT: 2 });
  });

  it('nhật ký có nhãn LƯU TRỮ LỚP', () => {
    expect(auditActionLabel({ action: 'CLASS_ARCHIVE', targetId: 'c1' })).toBe('LƯU TRỮ LỚP');
  });
});

describe('buildDiffView (nhật ký trực quan)', () => {
  const ID = '6ac7380b1f77bcf86cd79943';

  it('đổi giảng viên: trước/sau là tên người, không phải id', () => {
    const rows = buildDiffView({ action: 'CLASS_ASSIGN', targetId: ID, diff: { before: { teacherIds: [ID], teacherNames: ['Thầy Nam'] }, after: { teacherIds: [ID], teacherNames: ['Cô Lan', 'Thầy Khoa'] } } });
    expect(rows).toEqual([{ label: 'Giảng viên phụ trách', before: { type: 'tags', values: ['Thầy Nam'] }, after: { type: 'tags', values: ['Cô Lan', 'Thầy Khoa'] } }]);
  });

  it('bản ghi cũ thiếu tên: không in id, giảng viên đã xóa có nhãn riêng', () => {
    const rows = buildDiffView({ action: 'CLASS_ASSIGN', targetId: 'c', diff: { before: { teacherIds: [ID] }, after: { teacherIds: [ID], teacherNames: [''] } } });
    expect(JSON.stringify(rows)).not.toContain(ID);
    expect(rows[0].after).toEqual({ type: 'tags', values: ['Giảng viên đã xóa'] });
  });

  it('khóa/mở khóa: chỉ trường Trạng thái, nhãn tiếng Việt; bỏ trường không đổi và email', () => {
    const rows = buildDiffView({ action: 'USER_LOCK', targetId: 'u', diff: { before: { status: 'ACTIVE', role: 'STUDENT', email: 'a@x' }, after: { status: 'LOCKED', role: 'STUDENT', email: 'a@x' } } });
    expect(rows).toEqual([{ label: 'Trạng thái', before: { type: 'text', value: 'Hoạt động' }, after: { type: 'text', value: 'Đã khóa' } }]);
  });

  it('đổi vai trò, sửa người dùng (mật khẩu chỉ hiện "Đã đặt lại"), lưu trữ lớp', () => {
    expect(buildDiffView({ action: 'ROLE_CHANGE', targetId: 'u', diff: { before: { role: 'STUDENT' }, after: { role: 'TEACHER' } } })[0]).toMatchObject({ label: 'Vai trò', after: { value: 'Giảng viên' } });
    const upd = buildDiffView({ action: 'USER_UPDATE', targetId: 'u', diff: { before: { fullName: 'Cũ', ageGroup: '6-9' }, after: { fullName: 'Mới', ageGroup: '6-9', passwordReset: true } } });
    expect(upd.map((r) => r.label)).toEqual(['Họ tên', 'Mật khẩu']);
    expect(upd[1].after).toEqual({ type: 'text', value: 'Đã đặt lại' });
    expect(buildDiffView({ action: 'CLASS_ARCHIVE', targetId: 'c', diff: { before: { archived: false }, after: { archived: true } } })[0]).toMatchObject({ label: 'Trạng thái lớp', before: { value: 'Đang hoạt động' }, after: { value: 'Lưu trữ / Đã bế giảng' } });
  });

  it('hàng loạt: mỗi người một dòng theo email; cấu hình: API key che, prompt có xem trước + số ký tự', () => {
    const bulk = buildDiffView({ action: 'BULK_LOCK', targetId: 'bulk:2', diff: { before: [{ id: ID, email: 'a@x', status: 'ACTIVE' }, { id: ID, email: 'b@x', status: 'ACTIVE' }], after: [{ id: ID, email: 'a@x', status: 'LOCKED' }, { id: ID, email: 'b@x', status: 'LOCKED' }] } });
    expect(bulk.map((r) => r.label)).toEqual(['a@x', 'b@x']);
    expect(JSON.stringify(bulk)).not.toContain(ID);
    const key = buildDiffView({ action: 'CONFIG_UPDATE', targetId: 'GEMINI_API_KEY', diff: { before: { masked: 'AQ.Ab8...****' }, after: { masked: 'AIzaSy...****' } } });
    expect(key[0]).toMatchObject({ label: 'Gemini API Key', after: { value: 'AIzaSy...****' } });
    const prompt = buildDiffView({ action: 'CONFIG_UPDATE', targetId: 'prompt.coach', diff: { before: { value: 'a'.repeat(300) }, after: { value: 'Bản mới ngắn gọn cho AI Tutor' } } });
    expect(prompt[0].label).toBe('Nội dung prompt');
    expect((prompt[0].before as { value: string }).value).toContain('…');
    expect((prompt[0].before as { value: string }).value).toContain('300 ký tự');
  });

  it('hideIds che ObjectId; trạng thái bài tập có nhãn Đang mở / Chưa mở / Đã hết hạn', () => {
    expect(hideIds(ID)).toBe('(mã nội bộ)');
    expect(hideIds('Cô Lan')).toBe('Cô Lan');
    expect(EXERCISE_STATUS.OPEN.label).toBe('Đang mở');
    expect(EXERCISE_STATUS.UPCOMING.label).toBe('Chưa mở');
    expect(EXERCISE_STATUS.CLOSED.label).toBe('Đã hết hạn');
  });

  it('không có thay đổi nghiệp vụ thì không có dòng nào', () => {
    expect(buildDiffView({ action: 'USER_UNLOCK', targetId: 'u', diff: { before: { status: 'ACTIVE' }, after: { status: 'ACTIVE' } } })).toEqual([]);
  });
});

describe('chọn nhanh tại dòng', () => {
  it('removeTeacher: gỡ được khi còn ≥2, giữ nguyên khi chỉ còn một (lớp luôn có giảng viên)', () => {
    expect(removeTeacher(['a', 'b'], 'a')).toEqual(['b']);
    expect(removeTeacher(['a'], 'a')).toEqual(['a']);
  });

  it('initials lấy chữ cái đầu họ và tên', () => {
    expect(initials('Nguyễn Văn An')).toBe('NA');
    expect(initials('An')).toBe('AN');
    expect(initials('  ')).toBe('?');
  });

  it('gợi ý học viên: bỏ người đã trong lớp, ưu tiên cùng khối rồi người chưa vào lớp nào', () => {
    const list = [
      { id: 'a', fullName: 'An', email: 'a@x', ageGroup: '10-12', classCount: 1 },
      { id: 'b', fullName: 'Bình', email: 'b@x', ageGroup: '6-9', classCount: 0 },
      { id: 'c', fullName: 'Chi', email: 'c@x', ageGroup: '6-9', classCount: 1 },
      { id: 'd', fullName: 'Dũng', email: 'd@x', ageGroup: '6-9', classCount: 0 },
      { id: 'e', fullName: 'Em', email: 'e@x', ageGroup: '6-9', classCount: 0 },
    ];
    const ranked = rankStudentSuggestions(list, new Set(['e']), '6-9').map((s) => s.id);
    expect(ranked).toEqual(['b', 'd', 'c', 'a']);
    expect(rankStudentSuggestions(list, new Set(), null).map((s) => s.id)[0]).toBe('b');
  });

  it('filterByText lọc theo tên/email không phân biệt hoa thường và dấu', () => {
    const ts = [{ fullName: 'Cô Nguyễn Thị Lan', email: 'lan@x.vn' }, { fullName: 'Thầy Đặng Anh Tuấn', email: 'tuan@x.vn' }];
    expect(filterByText(ts, 'nguyen')).toHaveLength(1);
    expect(filterByText(ts, 'DANG')).toHaveLength(1);
    expect(filterByText(ts, 'tuan@')).toHaveLength(1);
    expect(filterByText(ts, '')).toHaveLength(2);
    expect(filterByText(ts, 'zzz')).toHaveLength(0);
  });
});

describe('giảng viên chưa phân công', () => {
  it('chỉ trả giảng viên chưa có trong lớp', () => {
    const all = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(unassignedTeachers(all, ['b'])).toEqual([{ id: 'a' }, { id: 'c' }]);
    expect(unassignedTeachers(all, [])).toHaveLength(3);
    expect(unassignedTeachers(all, ['a', 'b', 'c'])).toEqual([]);
  });
});
