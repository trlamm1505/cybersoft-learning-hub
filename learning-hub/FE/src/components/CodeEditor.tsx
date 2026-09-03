import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
  height?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, isDark, height = '360px' }) => {
  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border-color)] shadow-xs">
      <CodeMirror
        value={value}
        height={height}
        theme={isDark ? 'dark' : 'light'}
        extensions={[python()]}
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
