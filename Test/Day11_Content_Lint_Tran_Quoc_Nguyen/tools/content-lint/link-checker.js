'use strict';
/**
 * link-checker.js
 * ------------------------------------------------------------------
 * Kiểm tra link "chết" (dead link / trả về lỗi HTTP như 404, 500...) bằng
 * request HTTP THẬT. Đây là tính năng RIÊNG, TÙY CHỌN (bật bằng cờ
 * --check-links), tách khỏi bộ 20 rule CT001-CT020 vì 2 lý do:
 *
 *   1. 20 rule còn lại là phân tích TĨNH (đọc file, không cần mạng) - đây là
 *      yêu cầu đã chốt và có test khẳng định "đúng 20 rule". Kiểm tra link
 *      sống/chết cần gọi mạng thật ra ngoài, khác bản chất - nên tách thành
 *      1 bước RIÊNG chạy sau, không tính vào 20 rule.
 *   2. Cần mạng ra ngoài nên KHÔNG mặc định bật (máy chạy CI/offline vẫn
 *      lint bình thường) - chỉ chạy khi người dùng chủ động thêm
 *      --check-links.
 *
 * Không dùng package ngoài - chỉ http/https có sẵn của Node.
 *
 * Phân loại kết quả (quan trọng để không báo oan):
 *   - 'ok'          : server trả về 2xx/3xx -> link còn sống.
 *   - 'dead'        : server trả về 4xx/5xx (server THẬT SỰ xác nhận lỗi,
 *                      ví dụ 404 Not Found) -> chắc chắn là link hỏng.
 *   - 'unreachable' : lỗi mạng/timeout/DNS (không có phản hồi từ server) ->
 *                      KHÔNG chắc link chết hay do máy đang chạy không có
 *                      mạng ra ngoài - báo WARNING thay vì ERROR để tránh
 *                      báo oan hàng loạt khi chạy trong môi trường offline.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

function checkOneUrl(url, { timeoutMs = 5000 } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    let u;
    try {
      u = new URL(url);
    } catch (e) {
      finish({ status: 'unreachable', error: 'URL không hợp lệ để kiểm tra' });
      return;
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      finish({ status: 'unreachable', error: `protocol không hỗ trợ kiểm tra sống/chết: ${u.protocol}` });
      return;
    }
    const lib = u.protocol === 'https:' ? https : http;

    const attempt = (method, allowRetryOnError) => {
      let req;
      try {
        req = lib.request(u, {
          method,
          timeout: timeoutMs,
          headers: { 'User-Agent': 'content-lint/1.0 (+dead-link-check, offline-first tool)' },
        }, (res) => {
          res.resume(); // xả body, không cần đọc nội dung
          const code = res.statusCode || 0;
          if (method === 'HEAD' && (code === 405 || code === 501)) {
            attempt('GET', false); // 1 số server chặn HEAD -> thử lại bằng GET trước khi kết luận
            return;
          }
          if (code >= 200 && code < 400) {
            finish({ status: 'ok', httpStatus: code });
          } else {
            finish({ status: 'dead', httpStatus: code });
          }
        });
      } catch (err) {
        finish({ status: 'unreachable', error: err.message });
        return;
      }
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', (err) => {
        if (allowRetryOnError) {
          attempt('GET', false);
          return;
        }
        finish({ status: 'unreachable', error: err.message });
      });
      req.end();
    };

    attempt('HEAD', true);
  });
}

async function checkUrls(urls, { timeoutMs = 5000, concurrency = 5 } = {}) {
  const unique = [...new Set(urls)];
  const results = new Map();
  let idx = 0;
  async function worker() {
    while (idx < unique.length) {
      const my = idx++;
      const url = unique[my];
      // eslint-disable-next-line no-await-in-loop
      results.set(url, await checkOneUrl(url, { timeoutMs }));
    }
  }
  const workerCount = Math.max(1, Math.min(concurrency, unique.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

module.exports = { checkUrls, checkOneUrl };
