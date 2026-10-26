import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (mode, lab) => JSON.parse(fs.readFileSync(path.join(root, mode, `${lab}.json`), 'utf8')).data;

// Mỗi hàm trả true khi dữ liệu fixture VI PHẠM quy tắc của lab. buggy phải vi phạm, clean không được vi phạm.
const faultPresent = {
  'LAB-01': d => d.requiredFields.length < 5 || d.requestSentWhenEmailInvalid === true,
  'LAB-02': d => d.status >= 500,
  'LAB-03': d => new Date(d.checkOut) <= new Date(d.checkIn) || d.guests <= 0,
  'LAB-04': d => 'TokenCybersoft' in d.requestHeaders && !('Authorization' in d.requestHeaders),
  'LAB-05': d => d.resourceOwner !== d.requestUser && d.updateAllowed === true,
  'LAB-06': d => d.status >= 500 || Boolean(d.body && d.body.stack),
  'LAB-07': d => d.danhGia < 0 || d.danhGia > 10,
  'LAB-08': d => d.uiCount !== d.apiTotal,
  'LAB-09': d => d.duplicateEmails > 0 || d.orphanAttempts > 0,
  'LAB-10': d => /\.sc-|nth-child/.test(d.locator),
  'LAB-11': d => d.serverStatus === 'BOOKED' && d.uiSelectable === true,
  'LAB-12': d => new Set(d.caseIds).size !== d.caseIds.length || d.cleanupRequired === false,
};
for (const lab of Object.keys(faultPresent)) {
  test(`${lab}: buggy vi phạm quy tắc, clean thì không`, () => {
    assert.equal(faultPresent[lab](load('buggy', lab)), true, 'buggy phải có lỗi');
    assert.equal(faultPresent[lab](load('clean', lab)), false, 'clean không được có lỗi');
  });
}
