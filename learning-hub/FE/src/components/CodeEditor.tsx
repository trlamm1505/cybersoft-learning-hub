import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { useIsDarkTheme } from '../hooks/useIsDarkTheme';
import { lightEditorTheme } from './editorTheme';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Bỏ trống để theo giao diện hiện tại của app (khuyến nghị). */
  isDark?: boolean;
  height?: string;
}

/**
 * Trình soạn code Python. Màu editor luôn theo giao diện Sáng/Tối của app
 * (trước đây một số nơi truyền sai cờ nên editor lệch màu so với nền trang).
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, isDark, height = '360px' }) => {
  const detectedDark = useIsDarkTheme();
  const dark = isDark ?? detectedDark;
  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border-color)] shadow-xs text-sm">
      <CodeMirror
        value={value}
        height={height}
        theme={dark ? 'dark' : 'light'}
        extensions={dark ? [python()] : [python(), lightEditorTheme]}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          autocompletion: true,
          bracketMatching: true,
          closeBrackets: true,
          indentOnInput: true,
        }}
      />
    </div>
  );
};
