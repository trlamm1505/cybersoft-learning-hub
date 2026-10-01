import type {
  ArtifactFileType,
  RubricCriterion,
  TesterLabCategory,
} from '../modules-system/database/schemas/tester-lab.schema';

/** Rubric 10 điểm gốc của Day 14 (5 tiêu chí x 2 điểm). */
const RUBRIC: RubricCriterion[] = [
  {
    key: 'scope-design',
    label: 'Phạm vi và test design phù hợp',
    maxScore: 2,
    kind: 'quality',
  },
  {
    key: 'actual-expected',
    label: 'Actual/Expected dựa trên Swagger, UI hoặc rule đã nêu',
    maxScore: 2,
    kind: 'quality',
  },
  {
    key: 'evidence',
    label: 'Evidence tái hiện được',
    maxScore: 2,
    kind: 'quality',
  },
  {
    key: 'severity-result',
    label: 'Phân loại severity/result hợp lý',
    maxScore: 2,
    kind: 'severity',
  },
  {
    key: 'cleanup',
    label: 'Cleanup/reset và giải thích kết quả',
    maxScore: 2,
    kind: 'quality',
  },
];

interface LabSeed {
  labCode: string;
  title: string;
  description: string;
  category: TesterLabCategory;
  environmentUrl: string;
  requiredColumns: string;
  allowedFileTypes?: ArtifactFileType[];
}

const LABS: LabSeed[] = [
  {
    labCode: 'LAB-01',
    title: 'Bug hunt Đăng ký / Đăng nhập',
    description:
      'Thiết kế ca âm cho đăng ký/đăng nhập và viết bug report tái hiện được. Nộp Bug_Report_LAB01.csv.',
    category: 'BUG_REPORT',
    environmentUrl: 'https://demo2.cybersoft.edu.vn/login',
    requiredColumns:
      'ID,Tieu_de,Moi_truong,Tien_dieu_kien,Cac_buoc,Du_lieu,Expected,Actual,Severity,Priority,Evidence,Phan_A_hay_B,Ghi_chu',
  },
  {
    labCode: 'LAB-02',
    title: 'Exploratory Danh sách phim & Đặt vé',
    description:
      'Khám phá danh sách phim, chi tiết, suất chiếu và luồng vào sơ đồ ghế. Nộp Exploratory_Report_LAB02.csv.',
    category: 'BUG_REPORT',
    environmentUrl: 'https://demo1.cybersoft.edu.vn/',
    requiredColumns:
      'Session,Charter,Khu_vuc,Y_tuong_test,Cac_buoc,Quan_sat,La_bug,Bug_ID,Severity,Cau_hoi_cho_PO,Evidence',
  },
  {
    labCode: 'LAB-03',
    title: 'Functional Tìm phòng & Đặt phòng',
    description:
      'Dùng decision table để kiểm tìm phòng, ngày ở và số khách. Nộp Functional_Test_Cases_LAB03.csv.',
    category: 'TEST_CASE_DESIGN',
    environmentUrl: 'https://demo5.cybersoft.edu.vn/',
    requiredColumns:
      'TC_ID,Muc_tieu,Ky_thuat,Tien_dieu_kien,Cac_buoc,Du_lieu,Expected,Actual,Ket_qua,Bug_ID,Evidence',
  },
  {
    labCode: 'LAB-04',
    title: 'Auth API bệnh viện',
    description:
      'Đọc Swagger và kiểm cơ chế Bearer JWT mà không suy diễn endpoint. Nộp LAB04_Auth_API.postman_collection.json.',
    category: 'API_TESTING',
    environmentUrl: 'https://api-hospital.cybersoft.edu.vn/swagger/index.html',
    requiredColumns: 'info,item',
    allowedFileTypes: ['json', 'pdf'],
  },
  {
    labCode: 'LAB-05',
    title: 'Project & Task API',
    description:
      'Thực hiện chuỗi CRUD bằng endpoint đọc trực tiếp từ Swagger và dọn dữ liệu đã tạo. Nộp LAB05_API_Report.csv.',
    category: 'API_TESTING',
    environmentUrl: 'https://jiranew.cybersoft.edu.vn/swagger/index.html',
    requiredColumns:
      'Request,Method_URL,Du_lieu,Expected,Actual,Ket_qua,Bug_ID,Ghi_chu',
  },
  {
    labCode: 'LAB-06',
    title: 'Negative & Error Handling',
    description:
      'Thiết kế negative tests từ Swagger và phân biệt 400/401/403/404/500. Nộp LAB06_Negative_API_Report.csv.',
    category: 'API_TESTING',
    environmentUrl: 'https://fiverrnew.cybersoft.edu.vn/swagger/index.html',
    requiredColumns:
      'Request,Loai_loi,Du_lieu,Expected_status,Actual_status,Lo_thong_tin,Ket_qua,Bug_ID,Ghi_chu',
  },
  {
    labCode: 'LAB-07',
    title: 'Kiểm chất lượng dữ liệu phim',
    description:
      'Biến quy tắc dữ liệu thành kiểm tra chạy lại được trên JSON phim. Nộp LAB07_Data_Check.csv.',
    category: 'TEST_CASE_DESIGN',
    environmentUrl: 'https://movie0706.cybersoft.edu.vn/swagger/index.html',
    requiredColumns:
      'Rule_ID,Quy_tac,Query,Expected,So_dong_loi,ID_mau,Severity,De_xuat_sua,Evidence',
  },
  {
    labCode: 'LAB-08',
    title: 'Đối chiếu UI ↔ API khóa học',
    description:
      'Đối chiếu danh sách/chi tiết khóa học giữa UI và API. Nộp LAB08_Integrity_Report.csv.',
    category: 'TEST_CASE_DESIGN',
    environmentUrl: 'https://demo2.cybersoft.edu.vn/',
    requiredColumns:
      'Check_ID,Bat_bien,Nguon_doi_chieu,Query_hoac_request,Expected,Actual,ID_mau,Ket_qua,Bug_ID',
  },
  {
    labCode: 'LAB-09',
    title: 'Data Quality Hunt trên SQLite',
    description:
      'Tìm dữ liệu trùng và mồ côi bằng GROUP BY/HAVING và LEFT JOIN. Nộp LAB09_Data_Quality_Findings.csv.',
    category: 'BUG_REPORT',
    environmentUrl: 'Fixture offline — data/day14_snapshot.sqlite',
    requiredColumns:
      'Finding_ID,Loai,Bang,Query,So_dong,ID_mau,Anh_huong,Severity,De_xuat',
  },
  {
    labCode: 'LAB-12',
    title: 'Mini Regression Suite',
    description:
      'Xây regression read-only, data-driven và kết luận GO/NO-GO có bằng chứng. Nộp Regression_Summary.csv.',
    category: 'TEST_CASE_DESIGN',
    environmentUrl: 'https://demo1.cybersoft.edu.vn/',
    requiredColumns:
      'Flow,Ly_do_chon,So_test,Pass,Fail,Phan_loai_fail,Rui_ro_release,Khuyen_nghi',
  },
];

export const INITIAL_TESTER_LABS = LABS.map((lab) => ({
  labCode: lab.labCode,
  title: lab.title,
  description: lab.description,
  category: lab.category,
  environmentUrl: lab.environmentUrl,
  fixtureUrls: [`${lab.labCode}.json`],
  templateArtifact: `${lab.labCode}.csv`,
  allowedFileTypes: lab.allowedFileTypes ?? ['csv', 'xlsx', 'pdf'],
  requiredColumns: lab.requiredColumns.split(','),
  rubricCriteria: RUBRIC,
}));
