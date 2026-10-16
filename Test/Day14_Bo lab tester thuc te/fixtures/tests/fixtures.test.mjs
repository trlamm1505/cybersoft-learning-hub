import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)); const root=path.resolve(here,'..');
for(const mode of ['clean','buggy']) test(`${mode} có đủ 12 fixture và reset được`,()=>{
 const dir=path.join(root,mode); const files=fs.readdirSync(dir).filter(x=>x.endsWith('.json'));
 assert.equal(files.length,12); execFileSync(process.execPath,[path.join(root,'reset.mjs'),'--mode',mode,'--lab','all']);
 for(const f of files){const a=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')); const b=JSON.parse(fs.readFileSync(path.join(root,'runtime',f),'utf8')); assert.deepEqual(b,a);}
});
test('manifest map đủ 12 lab/fault duy nhất',()=>{const m=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8')); assert.equal(m.faults.length,12); assert.equal(new Set(m.faults.map(x=>x.labId)).size,12); assert.equal(new Set(m.faults.map(x=>x.faultId)).size,12);});
