#!/usr/bin/env node
'use strict';
/**
 * build-overrides.js - sinh problems-hardened/overrides.json (bộ test "hardened" do QA đề xuất).
 *
 * File overrides KHÔNG sửa dữ liệu gốc trong BE - nó chỉ là "overlay": thêm constraints khai báo +
 * test hidden bổ sung cho 2 bài đã làm mutation. expectedOutput của test bổ sung được tính bằng code
 * JS ĐỘC LẬP (không dùng lời giải Python reference) để tránh vòng tròn "đề xuất test bằng chính đáp
 * án đang cần kiểm".
 *
 * Chạy: node problems-hardened/build-overrides.js   (kết quả xác định - dùng LCG có seed cố định)
 */
const fs = require('fs');
const path = require('path');

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

// LCG cố định để dữ liệu sinh ra giống hệt nhau mỗi lần chạy
function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s; };
}

const primeTests = [
  { n: 2, note: 'số nguyên tố chẵn duy nhất' },
  { n: 4, note: 'chính phương của số nguyên tố nhỏ nhất' },
  { n: 9, note: 'số lẻ hợp số, chính phương' },
  { n: 15, note: 'số lẻ hợp số, không chính phương' },
  { n: 49, note: 'chính phương của số nguyên tố lẻ' },
  { n: 999999937, note: 'số nguyên tố lớn nhất < 10^9 - kiểm hiệu năng O(sqrt n) vs O(n)' },
].map(({ n, note }) => ({ input: String(n), expectedOutput: isPrime(n) ? 'YES' : 'NO', isHidden: true, note }));

const rnd = lcg(20260919);
const bigN = 12000;
// Giá trị nhỏ (0..99) để OUTPUT < 64KB: judge cắt stdout ở 64KB (MAX_OUTPUT_BYTES), output lớn hơn sẽ làm chính lời giải đúng bị WA (rule CP019).
const bigNums = Array.from({ length: bigN }, () => rnd() % 100);
const sorted = (arr) => [...arr].sort((a, b) => a - b).join(' ');
const sortTests = [
  { arr: [3, 3, 1, 2, 2, 3], note: 'có phần tử trùng lặp' },
  { arr: [5, 5, 5, 5], note: 'tất cả phần tử bằng nhau' },
  { arr: [9, 7, 5, 3, 1], note: 'đã sắp giảm dần (xấu nhất cho một số thuật toán)' },
  { arr: [-9, -3, 0, 4, 8], note: 'đã sắp tăng dần, có số âm' },
  { arr: [1000000000, -1000000000, 0], note: 'giá trị biên |a_i| = 10^9' },
  { arr: bigNums, note: `N=${bigN} - kiểm hiệu năng O(n log n) vs O(n^2)` },
].map(({ arr, note }) => ({ input: `${arr.length}\n${arr.join(' ')}`, expectedOutput: sorted(arr), isHidden: true, note }));

const overrides = [
  {
    slug: 'kiem-tra-so-nguyen-to',
    constraintsText: '1 ≤ N ≤ 10^9',
    constraints: [{ name: 'N', line: 0, min: 1, max: 1000000000 }],
    extraTests: primeTests,
  },
  {
    slug: 'sap-xep-tang-dan',
    constraintsText: '1 ≤ N ≤ 10^5; |a_i| ≤ 10^9',
    constraints: [
      { name: 'N', line: 0, min: 1, max: 100000 },
      { name: 'a_i', line: 1, all: true, min: -1000000000, max: 1000000000 },
    ],
    extraTests: sortTests,
  },
];

fs.writeFileSync(path.join(__dirname, 'overrides.json'), JSON.stringify(overrides, null, 2) + '\n', 'utf8');
console.log('Đã ghi problems-hardened/overrides.json');
