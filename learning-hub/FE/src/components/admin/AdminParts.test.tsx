import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AgeGroupBars, HealthSummaryCard, MetricCard, SubmissionBars } from './DashboardParts';
import { ConfirmModal, errorMessage, Modal, Pill } from './AdminUi';
import { ClassStatusBadge } from './ClassStatusBadge';
import { RemovableTag } from './ClassPickers';
import { Collapse, PanelToggle } from './ClassPanels';
import { ClusterCard, HealthGrid } from '../../pages/AdminHealthPage';
import { DiffView } from '../../pages/AdminAuditPage';
import type { HealthReport } from '../../types/adminPortal';

const text = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

const report: HealthReport = {
  status: 'DEGRADED',
  checkedAt: '2026-10-16T03:00:00.000Z',
  clusters: [
    { key: 'auth_db', label: 'Auth & Database', status: 'HEALTHY', latencyMs: 12, detail: 'MongoDB: Connected' },
    { key: 'core_engine', label: 'Core Engine (SQLite in-memory)', status: 'HEALTHY', latencyMs: 3, detail: 'SQLite: Ready (in-process)' },
    { key: 'ai_gateway', label: 'AI Gateway (Gemini)', status: 'DOWN', latencyMs: 90, detail: 'Gemini: Gemini từ chối API key.' },
    { key: 'submissions_classes', label: 'Submissions & Classes', status: 'DEGRADED', latencyMs: 1200, detail: '2 lớp chưa có giảng viên' },
    { key: 'contests', label: 'Contests', status: 'HEALTHY', latencyMs: 20, detail: 'Không có cuộc thi đang diễn ra' },
  ],
};

describe('Health cards', () => {
  it('mỗi cụm có đèn trạng thái, "Latency", độ trễ và dòng chi tiết', () => {
    const t = text(renderToString(<ClusterCard cluster={report.clusters[0]} />));
    expect(t).toContain('Auth & Database');
    expect(t).toContain('Latency');
    expect(t).toContain('12 ms');
    expect(t).toContain('MongoDB: Connected');
    expect(renderToString(<ClusterCard cluster={report.clusters[0]} />)).toContain('🟢');
    expect(renderToString(<ClusterCard cluster={report.clusters[2]} />)).toContain('🔴');
    expect(renderToString(<ClusterCard cluster={report.clusters[3]} />)).toContain('🟡');
  });

  it('lưới hiển thị đúng 5 thẻ theo thứ tự yêu cầu', () => {
    const t = text(renderToString(<HealthGrid report={report} />));
    const order = ['Auth & Database', 'In-Memory SQLite', 'AI Gateway', 'Submissions & Classes', 'Contests'].map((s) => t.indexOf(s));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('thẻ tóm tắt ở Dashboard: đang tải thì có khung xương; có dữ liệu thì hiện tổng thể', () => {
    const loading = renderToString(<HealthSummaryCard report={undefined} loading failed={false} />);
    expect(loading).toContain('animate-pulse');
    const ok = text(renderToString(<HealthSummaryCard report={report} loading={false} failed={false} />));
    expect(ok).toContain('Chậm / cần chú ý');
    expect(ok).toContain('AI Gateway');
    expect(text(renderToString(<HealthSummaryCard report={undefined} loading={false} failed />))).toContain('Chưa kiểm tra được');
  });
});

describe('Dashboard parts', () => {
  it('MetricCard: skeleton khi đang tải, giá trị khi có', () => {
    expect(renderToString(<MetricCard label="Tổng người dùng" loading />)).toContain('animate-pulse');
    expect(text(renderToString(<MetricCard label="Tổng người dùng" value={42} />))).toContain('42');
  });

  it('biểu đồ khối tuổi liệt kê đủ 4 khối kèm số lượng và phần trăm', () => {
    const t = text(renderToString(<AgeGroupBars data={{ '3-5': 1, '6-9': 1, '10-12': 2, CAREER_ADULT: 0, NONE: 0 }} />));
    for (const label of ['Khối 3-5 tuổi', 'Khối 6-9 tuổi', 'Khối 10-12 tuổi', 'Người đi làm']) expect(t).toContain(label);
    expect(t).toContain('50%');
  });

  it('biểu đồ 7 ngày có đủ 7 cột', () => {
    const days = Array.from({ length: 7 }, (_, i) => ({ date: `2026-10-${String(10 + i).padStart(2, '0')}`, count: i }));
    const html = renderToString(<SubmissionBars days={days} />);
    expect(html.match(/rounded-t-md/g)).toHaveLength(7);
    expect(text(html)).toContain('16/10');
  });
});

describe('Modal & diff', () => {
  it('ConfirmModal có tiêu đề, nội dung, nút xác nhận và nút Hủy', () => {
    const t = text(renderToString(<ConfirmModal title="Khóa tài khoản?" message="Sẽ bị đăng xuất" confirmLabel="Khóa" danger onConfirm={() => {}} onClose={() => {}} />));
    expect(t).toContain('Khóa tài khoản?');
    expect(t).toContain('Sẽ bị đăng xuất');
    expect(t).toContain('Hủy');
    expect(renderToString(<ConfirmModal title="x" message="y" confirmLabel="Khóa" onConfirm={() => {}} onClose={() => {}} />)).toContain('role="dialog"');
  });

  it('DiffView mặc định là thẻ tiếng Việt Trước đây → Hiện tại, dùng tên người, KHÔNG in ObjectId hay JSON thô', () => {
    const ID = '6ac7380b1f77bcf86cd79943';
    const html = renderToString(
      <DiffView
        item={{
          action: 'CLASS_ASSIGN',
          targetType: 'CLASS',
          targetId: ID,
          diff: { before: { className: 'Lớp 6-9', teacherIds: [ID], teacherNames: ['Thầy Hoàng Nam'] }, after: { className: 'Lớp 6-9', teacherIds: [ID, ID], teacherNames: ['Cô Nguyễn Thị Lan'] } },
        }}
      />,
    );
    const t = text(html);
    expect(t).toContain('Giảng viên phụ trách');
    expect(t).toContain('Trước đây');
    expect(t).toContain('Hiện tại');
    expect(t).toContain('Thầy Hoàng Nam');
    expect(t).toContain('Cô Nguyễn Thị Lan');
    expect(t).toContain('Lớp: Lớp 6-9');
    expect(html).not.toContain(ID);
    expect(html).not.toContain('<pre');
    expect(t).toContain('Xem mã JSON');
  });

  it('DiffView trạng thái người dùng hiện "Hoạt động → Đã khóa" bằng tiếng Việt', () => {
    const t = text(renderToString(<DiffView item={{ action: 'USER_LOCK', targetType: 'USER', targetId: 'u1', diff: { before: { status: 'ACTIVE', email: 'a@x.vn' }, after: { status: 'LOCKED', email: 'a@x.vn' } } }} />));
    expect(t).toContain('Trạng thái');
    expect(t).toContain('Hoạt động');
    expect(t).toContain('Đã khóa');
    expect(t).not.toContain('LOCKED');
  });

  it('Pill và errorMessage', () => {
    expect(renderToString(<Pill tone="green">Hoạt động</Pill>)).toContain('emerald');
    expect(renderToString(<Pill tone="red">Đã khóa</Pill>)).toContain('rose');
    expect(errorMessage({ response: { data: { message: ['a', 'b'] } } }, 'x')).toBe('a, b');
    expect(errorMessage({ response: { data: { message: 'Lỗi' } } }, 'x')).toBe('Lỗi');
    expect(errorMessage(new Error('?'), 'dự phòng')).toBe('dự phòng');
  });
});

describe('ClassStatusBadge', () => {
  it('có nhãn và tooltip giải thích nghiệp vụ cho cả hai trạng thái', () => {
    const open = renderToString(<ClassStatusBadge status="OPEN" />);
    expect(text(open)).toContain('Đang hoạt động');
    expect(open).toContain('title="Lớp đang trong kỳ học');
    const arch = renderToString(<ClassStatusBadge status="ARCHIVED" />);
    expect(text(arch)).toContain('Lưu trữ / Đã bế giảng');
    const fixed = renderToString(<ClassStatusBadge status="ARCHIVED" fixed />);
    expect(fixed).toContain('w-28');
    expect(text(fixed)).toContain('Lưu trữ');
    expect(text(fixed)).not.toContain('Đã bế giảng');
    expect(text(renderToString(<ClassStatusBadge status="OPEN" fixed />))).toContain('Hoạt động');
    expect(arch).toContain('không còn nộp bài mới');
  });
});

describe('Modal đóng được', () => {
  it('có nút ✕ có nhãn "Đóng" và vùng nền để bấm đóng', () => {
    const html = renderToString(
      <Modal title="Chi tiết lớp" onClose={() => {}} footer={<button>Đóng</button>}>
        nội dung
      </Modal>,
    );
    expect(html).toContain('aria-label="Đóng"');
    expect(html).toContain('bg-neutral-950/50');
    expect(text(html)).toContain('nội dung');
  });
});

describe('thao tác tại chỗ', () => {
  it('RemovableTag có nút ✕ gỡ với nhãn rõ ràng; bị khóa (có lý do) khi là giảng viên cuối cùng', () => {
    const html = renderToString(<RemovableTag label="Cô Lan" tone="violet" removeLabel="Gỡ Cô Lan khỏi lớp" onRemove={() => {}} />);
    expect(html).toContain('aria-label="Gỡ Cô Lan khỏi lớp"');
    expect(html).toContain('group-hover:opacity-100');
    const sole = renderToString(<RemovableTag label="Cô Lan" tone="violet" removeLabel="Gỡ" onRemove={() => {}} disabledReason="Lớp cần ít nhất một giảng viên" />);
    expect(sole).toContain('aria-disabled="true"');
    expect(sole).toContain('Lớp cần ít nhất một giảng viên');
    expect(renderToString(<RemovableTag label="HS" tone="plain" removeLabel="Gỡ" />)).not.toContain('<button');
  });

  it('giảng viên bị khóa: tag xám gạch ngang kèm tooltip "Tài khoản đang bị khóa"', () => {
    const html = renderToString(<RemovableTag label="Cô Lan · Đã khóa" tone="locked" title="Tài khoản đang bị khóa" removeLabel="Gỡ" />);
    expect(html).toContain('line-through');
    expect(html).toContain('title="Tài khoản đang bị khóa"');
    expect(html).toContain('bg-neutral-200');
  });

  it('Collapse nằm trong luồng trang (không absolute/fixed): mở thì 1fr đẩy nội dung xuống, đóng thì 0fr và inert', () => {
    const open = renderToString(<Collapse open>nội dung</Collapse>);
    expect(open).toContain('grid-rows-[1fr]');
    expect(open).not.toContain('inert');
    const closed = renderToString(<Collapse open={false}>nội dung</Collapse>);
    expect(closed).toContain('grid-rows-[0fr]');
    expect(closed).toContain('inert');
    for (const html of [open, closed]) {
      expect(html).not.toMatch(/(absolute|fixed)/);
      expect(html).not.toContain('role="dialog"');
    }
  });

  it('PanelToggle: đóng thì là nút "+ nhãn", mở thì thành "Đóng"', () => {
    expect(text(renderToString(<PanelToggle open={false} onClick={() => {}} label="Thêm học viên" controls="p" />))).toContain('Thêm học viên');
    const open = renderToString(<PanelToggle open onClick={() => {}} label="Thêm học viên" controls="p" />);
    expect(text(open)).toContain('Đóng');
    expect(open).toContain('aria-expanded="true"');
  });
});
