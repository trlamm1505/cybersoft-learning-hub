#!/usr/bin/env node
/**
 * Xuất dữ liệu bộ bảng mẫu sales_v1 (customers, employees, products, orders, order_details) từ Postgres Sandbox
 * thành file TypeScript nhúng sẵn trong backend, để Data Lab chạy bằng SQLite in-memory (không cần Docker/Postgres):
 *   node scripts/export-sales-fixture.js            # ghi BE/src/data/sandbox/sales-v1.fixture.ts
 * Chỉ cần chạy lại khi bộ dữ liệu sandbox thay đổi. Kết nối chỉ ĐỌC (lab_reader hoặc chủ sở hữu DB theo biến môi trường).
 */
const fs = require('fs');
const path = require('path');

const BE = path.join(__dirname, '..', 'BE');
const OUT = path.join(BE, 'src', 'data', 'sandbox', 'sales-v1.fixture.ts');
const TABLES = {
  customers: ['customer_id', 'full_name', 'email', 'phone', 'city', 'customer_segment', 'created_at'],
  employees: ['employee_id', 'full_name', 'department', 'position', 'hire_date', 'region'],
  products: ['product_id', 'product_name', 'category', 'cost_price', 'selling_price', 'stock_quantity', 'status'],
  orders: ['order_id', 'customer_id', 'employee_id', 'order_date', 'shipping_date', 'order_status', 'payment_method', 'total_amount'],
  order_details: ['order_detail_id', 'order_id', 'product_id', 'quantity', 'unit_price', 'discount', 'line_total'],
};
const ORDER_BY = { customers: 'customer_id', employees: 'employee_id', products: 'product_id', orders: 'order_id', order_details: 'order_detail_id' };

(async () => {
  const { Client, types } = require(path.join(BE, 'node_modules', 'pg'));
  // Ngày giữ nguyên chuỗi, số thập phân đổi sang number (SQLite lưu REAL/INTEGER).
  const parsers = {
    getTypeParser: (oid, fmt) => {
      if ([1082, 1114, 1184].includes(oid)) return (v) => v;
      if (oid === 1700) return (v) => Number(v);
      return types.getTypeParser(oid, fmt);
    },
  };
  const client = new Client({
    host: process.env.SANDBOX_DB_HOST || 'localhost',
    port: Number(process.env.SANDBOX_DB_PORT || 55432),
    database: 'sales_v1',
    user: process.env.SANDBOX_DB_OWNER || 'sandbox_owner',
    password: process.env.SANDBOX_DB_OWNER_PASSWORD || 'sandbox_owner_pw',
    connectionTimeoutMillis: 5000,
    types: parsers,
  });
  await client.connect();
  const data = {};
  for (const [t, cols] of Object.entries(TABLES)) {
    const res = await client.query({ text: `SELECT ${cols.join(', ')} FROM ${t} ORDER BY ${ORDER_BY[t]}`, rowMode: 'array' });
    data[t] = res.rows;
    console.log(`${t}: ${res.rows.length} dòng`);
  }
  await client.end();

  const body = Object.entries(data)
    .map(([t, rows]) => `  ${t}: [\n${rows.map((r) => `    ${JSON.stringify(r)},`).join('\n')}\n  ],`)
    .join('\n');
  const src = `/**
 * Dữ liệu mẫu sales_v1 cho Data Lab chạy trên SQLite in-memory (không cần Docker/Postgres).
 * File sinh tự động bởi scripts/export-sales-fixture.js từ Postgres Sandbox, không sửa tay.
 */
export const SALES_V1_TABLES: Record<string, string[]> = ${JSON.stringify(Object.fromEntries(Object.entries(TABLES)))};

export const SALES_V1_ROWS: Record<string, Array<Array<string | number | null>>> = {
${body}
};
`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, src);
  console.log(`Đã ghi ${OUT} (${Math.round(src.length / 1024)} KB)`);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
