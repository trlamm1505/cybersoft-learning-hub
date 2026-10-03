#!/usr/bin/env python3
"""
verify-independent.py - kiểm chứng ĐỘC LẬP kết quả mutation của coding-problem-validator.

Không dùng chung 1 dòng code nào với runner.js/mutation.js: đọc thẳng file mutant (.py) đã được sinh
trong solutions/mutants/<slug>/, đọc thẳng dữ liệu bài + overlay, tự chạy bằng subprocess của Python,
tự so sánh (strip 2 đầu, đổi CRLF->LF), rồi so KILLED/SURVIVED với mutation-report.json.

Dùng:  python3 verify-independent.py <report-dir> <mutants-dir> <problems.json> <slug> [overrides.json]
Thoát 0 nếu MỌI mutant khớp với report, 1 nếu có chênh lệch.
"""
import json, os, subprocess, sys, tempfile, time

def run(src, stdin, limit_ms):
    with tempfile.TemporaryDirectory() as d:
        f = os.path.join(d, 'm.py')
        open(f, 'w', encoding='utf8').write(src)
        try:
            r = subprocess.run([sys.executable, '-I', '-B', '-X', 'utf8', f], input=stdin, capture_output=True,
                               text=True, timeout=limit_ms / 1000.0, cwd=d)
        except subprocess.TimeoutExpired:
            return 'TLE', ''
        return ('RE' if r.returncode != 0 else 'OK'), r.stdout

def norm(s):
    return s.replace('\r\n', '\n').strip()

def main():
    report_dir, mutants_dir, problems_file, slug = sys.argv[1:5]
    overlay = sys.argv[5] if len(sys.argv) > 5 else None
    problems = json.load(open(problems_file, encoding='utf8'))
    p = next(x for x in problems if x['slug'] == slug)
    tests = list(p['testCases'])
    if overlay:
        o = next((x for x in json.load(open(overlay, encoding='utf8')) if x['slug'] == slug), None)
        if o:
            tests += [dict(t, isHidden=True) for t in o['extraTests']]
    report = json.load(open(os.path.join(report_dir, 'mutation-report.json'), encoding='utf8'))
    mismatches = 0
    for m in report['mutants']:
        if m['status'] == 'INVALID':
            continue
        src = open(os.path.join(mutants_dir, m['id'] + '.py'), encoding='utf8').read()
        failed = 0
        for t in tests:
            kind, out = run(src, t['input'], p['timeLimitMs'])
            if not (kind == 'OK' and norm(out) == norm(t['expectedOutput'])):
                failed += 1
        mine = 'KILLED' if failed > 0 else 'SURVIVED'
        theirs = 'KILLED' if m['status'] == 'KILLED' else 'SURVIVED'  # EQUIVALENT = sống sót do người xác nhận
        flag = 'OK ' if mine == theirs else 'MISMATCH'
        if mine != theirs:
            mismatches += 1
        print(f"{flag} {m['id']:8s} độc lập={mine:8s} tool={m['status']:10s} (fail {failed}/{len(tests)} test)")
    print('KẾT LUẬN:', 'KHỚP 100%' if mismatches == 0 else f'{mismatches} mutant CHÊNH LỆCH')
    sys.exit(1 if mismatches else 0)

main()
