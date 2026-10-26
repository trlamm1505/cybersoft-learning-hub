import { useEffect, useRef, type DependencyList } from 'react';
import * as Blockly from 'blockly/core';

/**
 * Dựng một workspace Blockly trong ô `hostRef`, tự co giãn theo kích thước và hủy khi đổi màn hoặc rời trang.
 * `build` nhận ô chứa và trả về workspace đã nạp khối ban đầu; chạy lại mỗi khi `deps` đổi.
 */
export function useBlocklyWorkspace(build: (host: HTMLDivElement) => Blockly.WorkspaceSvg, deps: DependencyList) {
  const hostRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ws = build(host);
    wsRef.current = ws;
    // Blockly chỉ gán thuộc tính display="none" cho thanh cuộn của ngăn khối đã đóng, nhưng Tailwind đặt svg { display: block }
    // nên thanh cuộn vẫn hiện: ép bằng style trực tiếp.
    const syncFlyoutScrollbar = () => {
      const flyout = ws.getFlyout();
      const bar = (flyout?.getWorkspace() as Blockly.WorkspaceSvg | undefined)?.scrollbar;
      if (flyout && bar) bar.setVisible(flyout.isVisible());
      host.querySelectorAll<SVGElement>('svg.blocklyFlyoutScrollbar').forEach((el) => {
        el.style.display = el.getAttribute('display') === 'none' ? 'none' : '';
      });
    };
    ws.addChangeListener((e: Blockly.Events.Abstract) => {
      if (e.isUiEvent) syncFlyoutScrollbar();
    });
    const ro = new ResizeObserver(() => Blockly.svgResize(ws));
    ro.observe(host);
    return () => {
      ro.disconnect();
      ws.dispose();
      wsRef.current = null;
    };
    // `build` thay đổi mỗi lần render; chỉ dựng lại khi deps đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { hostRef, wsRef };
}
