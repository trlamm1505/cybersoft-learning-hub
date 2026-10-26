import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { BAND_TABS, BankPicker } from './BankPicker';

describe('BankPicker: tab lọc khối', () => {
  it('có đủ 3 tab Tất cả / Khối 6–9 / Khối 10–12', () => {
    expect(BAND_TABS.map((t) => t.label)).toEqual(['Tất cả', 'Khối 6–9', 'Khối 10–12']);
  });

  it('mặc định chọn tab theo khối của lớp', () => {
    const html = renderToString(<BankPicker type="CODING" selectedSlug="" selectedIds={[]} onPickExercise={() => {}} onToggleQuestion={() => {}} defaultBand="10-12" />);
    expect(html).toMatch(/aria-selected="true"[^>]*>Khối 10–12/);
    expect(html).toMatch(/aria-selected="false"[^>]*>Tất cả/);
  });

  it('không có khối lớp thì mở ở tab Tất cả', () => {
    const html = renderToString(<BankPicker type="QUIZ" selectedSlug="" selectedIds={[]} onPickExercise={() => {}} onToggleQuestion={() => {}} />);
    expect(html).toMatch(/aria-selected="true"[^>]*>Tất cả/);
  });
});
