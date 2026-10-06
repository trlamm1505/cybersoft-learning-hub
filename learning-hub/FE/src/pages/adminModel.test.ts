import { describe, expect, it } from 'vitest';
import {
  clampSidebarWidth,
  formatRate,
  loadSidebarState,
  pageInfo,
  saveSidebarState,
  SIDEBAR_COLLAPSED,
  SIDEBAR_DEFAULT,
  SIDEBAR_MAX,
  SIDEBAR_MIN,
  sidebarPixelWidth,
  slugify,
  validateNewUser,
} from './adminModel';

const memory = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
};

describe('slugify', () => {
  it('bỏ dấu tiếng Việt, đ thành d, nối bằng gạch ngang, cắt gọn', () => {
    expect(slugify('Lớp Python Cơ Bản 01')).toBe('lop-python-co-ban-01');
    expect(slugify('  Đồ án -- Cuối kỳ!! ')).toBe('do-an-cuoi-ky');
    expect(slugify('A'.repeat(200))).toHaveLength(80);
    expect(slugify('***')).toBe('');
  });
});

describe('pageInfo', () => {
  it('nhãn khoảng và cờ trước/sau', () => {
    expect(pageInfo(1, 20, 53)).toEqual({ label: '1–20 / 53', hasPrev: false, hasNext: true });
    expect(pageInfo(3, 20, 53)).toEqual({ label: '41–53 / 53', hasPrev: true, hasNext: false });
    expect(pageInfo(1, 20, 20)).toEqual({ label: '1–20 / 20', hasPrev: false, hasNext: false });
    expect(pageInfo(1, 20, 0)).toEqual({ label: '0 / 0', hasPrev: false, hasNext: false });
  });
});

describe('validateNewUser', () => {
  const ok = { fullName: 'An', email: 'an@x.com', password: '123456' };
  it('hợp lệ trả null; mỗi lỗi có thông báo riêng', () => {
    expect(validateNewUser(ok)).toBeNull();
    expect(validateNewUser({ ...ok, fullName: '  ' })).toBe('Nhập họ tên.');
    expect(validateNewUser({ ...ok, email: 'an@x' })).toBe('Email không hợp lệ.');
    expect(validateNewUser({ ...ok, email: 'a n@x.com' })).toBe('Email không hợp lệ.');
    expect(validateNewUser({ ...ok, password: '12345' })).toBe('Mật khẩu từ 6 ký tự.');
  });
});

describe('formatRate', () => {
  it('phần trăm làm tròn, null thành gạch ngang', () => {
    expect(formatRate(0.6667)).toBe('67%');
    expect(formatRate(0)).toBe('0%');
    expect(formatRate(null)).toBe('—');
  });
});

describe('sidebar: độ rộng và trạng thái lưu', () => {
  it('clampSidebarWidth giữ trong khoảng cho phép, số hỏng về mặc định', () => {
    expect(clampSidebarWidth(100)).toBe(SIDEBAR_MIN);
    expect(clampSidebarWidth(9999)).toBe(SIDEBAR_MAX);
    expect(clampSidebarWidth(250.4)).toBe(250);
    expect(clampSidebarWidth(Number.NaN)).toBe(SIDEBAR_DEFAULT);
    expect(clampSidebarWidth(Number.POSITIVE_INFINITY)).toBe(SIDEBAR_DEFAULT);
  });

  it('độ rộng thực: thu gọn thì cố định 64px, mở thì theo width', () => {
    expect(sidebarPixelWidth({ collapsed: true, width: 300 })).toBe(SIDEBAR_COLLAPSED);
    expect(sidebarPixelWidth({ collapsed: false, width: 300 })).toBe(300);
  });

  it('lưu rồi đọc lại đúng; chưa có dữ liệu hoặc dữ liệu hỏng thì dùng mặc định', () => {
    const s = memory();
    saveSidebarState({ collapsed: true, width: 280 }, s);
    expect(loadSidebarState(s)).toEqual({ collapsed: true, width: 280 });
    expect(loadSidebarState(memory())).toEqual({ collapsed: false, width: SIDEBAR_DEFAULT });
    const broken = memory();
    broken.setItem('admin_sidebar_v1', '{không phải json');
    expect(loadSidebarState(broken)).toEqual({ collapsed: false, width: SIDEBAR_DEFAULT });
    const evil = memory();
    evil.setItem('admin_sidebar_v1', JSON.stringify({ collapsed: 'yes', width: 99999 }));
    expect(loadSidebarState(evil)).toEqual({ collapsed: false, width: SIDEBAR_MAX });
  });

  it('storage bị chặn (ném lỗi) không làm hỏng giao diện', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadSidebarState(throwing)).toEqual({ collapsed: false, width: SIDEBAR_DEFAULT });
    expect(() => saveSidebarState({ collapsed: false, width: 250 }, throwing)).not.toThrow();
  });
});

describe('vai trò được phép cấp', () => {
  it('chỉ học viên và giảng viên, không bao giờ ADMIN', async () => {
    const { ASSIGNABLE_ROLES } = await import('./adminModel');
    expect(ASSIGNABLE_ROLES).toEqual(['STUDENT', 'TEACHER']);
    expect(ASSIGNABLE_ROLES).not.toContain('ADMIN');
  });
});
