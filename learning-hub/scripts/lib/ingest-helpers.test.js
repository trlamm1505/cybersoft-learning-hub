const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./ingest-helpers');

const col = (name, data_type, extra = {}) => ({ name, data_type, nullable: false, ...extra });

test('parseCsv xử lý nháy kép, dấu phẩy và xuống dòng trong ô, bỏ BOM và dòng trống cuối', () => {
  const rows = h.parseCsv('﻿a,b\r\n"x,1","dòng ""một""\nhai"\r\n\r\n');
  assert.deepEqual(rows, [['a', 'b'], ['x,1', 'dòng "một"\nhai']]);
});

test('orderTables đặt bảng được tham chiếu trước và báo vòng khóa ngoại', () => {
  const t = (table_name, fk) => ({ table_name, columns: [col('id', 'INT'), ...(fk ? [col('r', 'INT', { is_foreign_key: true, foreign_key_target: fk })] : [])] });
  assert.deepEqual(h.orderTables([t('d', 'o.id'), t('o', 'c.id'), t('c')]).map((x) => x.table_name), ['c', 'o', 'd']);
  assert.throws(() => h.orderTables([t('a', 'b.id'), t('b', 'a.id')]), /Vòng khóa ngoại/);
});

test('createTableSql: DATETIME thành TIMESTAMP, có PK/FK/NOT NULL; bản dirty toàn TEXT không ràng buộc', () => {
  const table = {
    table_name: 'orders',
    columns: [
      col('order_id', 'VARCHAR(10)', { is_primary_key: true }),
      col('customer_id', 'VARCHAR(10)', { is_foreign_key: true, foreign_key_target: 'customers.customer_id' }),
      col('created_at', 'DATETIME'),
      col('shipping_date', 'DATE', { nullable: true }),
    ],
  };
  const clean = h.createTableSql(table);
  assert.match(clean, /"created_at" TIMESTAMP NOT NULL/);
  assert.match(clean, /"shipping_date" DATE(,|\n)/);
  assert.match(clean, /PRIMARY KEY \("order_id"\)/);
  assert.match(clean, /FOREIGN KEY \("customer_id"\) REFERENCES "public"\."customers" \("customer_id"\)/);
  const dirty = h.createTableSql(table, { constraints: false, schema: 'dirty' });
  assert.match(dirty, /"dirty"\."orders"/);
  assert.doesNotMatch(dirty, /PRIMARY KEY|FOREIGN KEY|NOT NULL|TIMESTAMP/);
});

test('ident và sqlType chặn chuỗi có thể bẻ câu DDL', () => {
  assert.throws(() => h.ident('a"; DROP TABLE x;--'));
  assert.throws(() => h.sqlType('INT); DROP TABLE x;--'));
  assert.equal(h.sqlType('NUMERIC(12,2)'), 'NUMERIC(12,2)');
});

test('coerceRow: ô rỗng thành NULL trừ cột chuỗi NOT NULL; raw giữ nguyên', () => {
  const table = { columns: [col('s', 'VARCHAR(5)'), col('d', 'DATE', { nullable: true }), col('n', 'INT')] };
  assert.deepEqual(h.coerceRow(table, ['', '', '']), ['', null, null]);
  assert.deepEqual(h.coerceRow(table, ['x', '2025-01-01', '3']), ['x', '2025-01-01', '3']);
  assert.deepEqual(h.coerceRow(table, ['', ''], { raw: true }), ['', '', null]);
});

test('sha256 đúng vector chuẩn', () => {
  assert.equal(h.sha256(Buffer.from('')), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
});
