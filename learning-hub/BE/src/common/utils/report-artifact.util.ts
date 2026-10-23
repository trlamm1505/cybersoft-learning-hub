/**
 * Các báo cáo nghiệm thu trong docs/day27..29 là tài liệu đã commit. Trước Day 30, mỗi lần chạy test hay gọi API dashboard
 * đều ghi đè chúng nên `git status` luôn bẩn. Giờ chỉ ghi khi CHỦ ĐỘNG bật WRITE_REPORT_ARTIFACTS=true (vd khi chuẩn bị nộp
 * báo cáo); mặc định không ghi gì vào thư mục docs.
 */
export const shouldWriteReportArtifacts = (env: NodeJS.ProcessEnv = process.env): boolean => env.WRITE_REPORT_ARTIFACTS === 'true';
