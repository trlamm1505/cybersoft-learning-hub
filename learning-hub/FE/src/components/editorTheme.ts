import { EditorView } from '@uiw/react-codemirror';

/**
 * Giao diện Sáng tường minh cho CodeMirror. Theme 'light' có sẵn của thư viện
 * gần như rỗng nên chữ kế thừa màu của trang: khi app ở giao diện Tối (chữ trắng)
 * mà editor lại sáng thì chữ trắng trên nền trắng, gõ code không thấy gì. Ép màu
 * chữ, nền, số dòng và con trỏ để editor luôn đọc được bất kể màu trang.
 */
export const lightEditorTheme = EditorView.theme(
  {
    '&': { backgroundColor: '#ffffff', color: '#0f172a' },
    '.cm-content': { caretColor: '#0f172a' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#0f172a' },
    '.cm-gutters': { backgroundColor: '#f1f5f9', color: '#475569', border: 'none' },
    '.cm-activeLine': { backgroundColor: 'rgba(99, 102, 241, 0.08)' },
    '.cm-activeLineGutter': { backgroundColor: 'rgba(99, 102, 241, 0.12)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'rgba(99, 102, 241, 0.25)' },
  },
  { dark: false },
);
