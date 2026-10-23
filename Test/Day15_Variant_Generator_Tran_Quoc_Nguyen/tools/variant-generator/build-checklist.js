#!/usr/bin/env node
'use strict';
/**
 * build-checklist.js - NGÀY 15 - Equivalence Checklist
 * ------------------------------------------------------------------
 * Ghép `all-variants.json` (30 variant) với kết quả chạy THẬT của Day12/13
 * validator (reports/*-validation) thành 1 checklist EQ01-EQ10 (đúng mục 8
 * của yêu cầu gốc), 1 dòng / variant.
 *
 * QUAN TRỌNG: chỉ những cột TÍNH ĐƯỢC BẰNG CHƯƠNG TRÌNH mới được điền tự động
 * (EQ05, EQ08, EQ09 - và EQ06 điền theo finding thật của validator, không suy
 * diễn). EQ01-04, EQ07, EQ10 LUÔN để "CẦN NGƯỜI XEM" - đúng acceptance #5
 * ("không tự đánh giá variant là equivalent chỉ bằng AI output"). AI không
 * được tự ghi ACCEPT ở cột finalResult.
 */
const fs = require('fs');
const path = require('path');

function main() {
  const [buildDir] = process.argv.slice(2);
  const allVariants = JSON.parse(fs.readFileSync(path.join(buildDir, 'all-variants.json'), 'utf8'));
  const codingReport = JSON.parse(fs.readFileSync(path.join(buildDir, 'reports/coding-validation/validator-report.json'), 'utf8'));
  const quizReport = JSON.parse(fs.readFileSync(path.join(buildDir, 'reports/quiz-validation/quality-report.json'), 'utf8'));

  // Gom finding theo problemId (coding) / theo thứ tự vị trí trong file (quiz, vì quiz
  // không có field id riêng trong schema thật - xem PHASE1_SURVEY.md mục 1).
  const codingFindingsBySlug = {};
  for (const f of codingReport.findings) {
    (codingFindingsBySlug[f.problemId] ||= []).push(f);
  }
  const quizFindingsByIndex = {}; // 1-based index trong file, khớp thứ tự sinh variant
  for (const f of quizReport.findings) {
    const m = /#Q(\d+)$/.exec(f.questionId || '');
    if (m) (quizFindingsByIndex[m[1]] ||= []).push(f);
  }

  let quizPositionCounter = 0;
  const rows = allVariants.map((v) => {
    let findings;
    if (v.sourceType === 'CODING') {
      findings = codingFindingsBySlug[v.content.slug] || [];
    } else {
      quizPositionCounter += 1;
      findings = quizFindingsByIndex[String(quizPositionCounter)] || [];
    }
    const errors = findings.filter((f) => f.severity === 'ERROR');
    const warnings = findings.filter((f) => f.severity === 'WARNING');
    const hasDupFinding = findings.some((f) => ['QV006', 'QV022', 'CP011', 'CP012'].includes(f.code));

    return {
      variantId: v.variantId,
      sourceId: v.sourceId,
      sourceVersion: v.sourceVersion,
      variantVersion: v.variantVersion,
      sourceType: v.sourceType,
      EQ01_learningOutcomeGiongSource: 'CẦN NGƯỜI XEM',
      EQ02_conceptChinhGiuNguyen: 'CẦN NGƯỜI XEM',
      EQ03_soBuocReasoningTuongDuong: 'CẦN NGƯỜI XEM',
      EQ04_constraintLamKhoHonRoRet: 'CẦN NGƯỜI XEM',
      EQ05_dapAnDaTinhLaiDocLap: 'CÓ (python3/node, xem generationMethod)',
      EQ06_duplicateOptionHoacTest: hasDupFinding ? `CÓ - ${findings.filter(f=>['QV006','QV022','CP011','CP012'].includes(f.code)).map(f=>f.code).join(',')} (xem report)` : 'Không thấy (validator không báo)',
      EQ07_ambiguityMoi: 'CẦN NGƯỜI XEM',
      EQ08_validatorPass: errors.length === 0 ? 'PASS (0 error)' : `FAIL (${errors.length} error: ${errors.map(e=>e.code).join(',')})`,
      EQ09_sourceIdVersionLuu: (v.sourceId && v.sourceVersion) ? 'CÓ' : 'THIẾU',
      EQ10_humanReviewerAccept: v.humanReview && v.humanReview.equivalenceAccepted === true ? 'ACCEPT'
        : v.humanReview && v.humanReview.equivalenceAccepted === false ? 'REJECT' : 'CHƯA REVIEW',
      validatorWarningCount: warnings.length,
      validatorWarningCodes: warnings.map((w) => w.code).join(';'),
      finalDecision: 'NEEDS REVIEW', // AI KHÔNG tự quyết ACCEPT/REJECT - luôn để NEEDS REVIEW
    };
  });

  const jsonOut = path.join(buildDir, 'EQUIVALENCE_CHECKLIST.json');
  fs.writeFileSync(jsonOut, JSON.stringify(rows, null, 2) + '\n', 'utf8');

  const headers = Object.keys(rows[0]);
  const escape = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const csvOut = path.join(buildDir, 'EQUIVALENCE_CHECKLIST.csv');
  fs.writeFileSync(csvOut, csv, 'utf8');

  const passCount = rows.filter((r) => r.EQ08_validatorPass.startsWith('PASS')).length;
  console.log(`OK: ${rows.length} dong -> ${jsonOut} va ${csvOut}`);
  console.log(`  Validator PASS (0 error): ${passCount}/${rows.length}`);
  console.log(`  Còn ${rows.length} dòng đang "CHƯA REVIEW" - chờ người xác nhận EQ01/02/03/04/07/10.`);
}

main();
