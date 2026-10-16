// Test đơn vị chạy Python trực tiếp trên máy để không phụ thuộc Docker Desktop.
// Lệnh `docker run` được kiểm tra riêng trong code-runner.docker.spec.ts.
process.env.PYTHON_SANDBOX ??= 'local';
