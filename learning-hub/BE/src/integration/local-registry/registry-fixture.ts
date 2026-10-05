/**
 * Dữ liệu giả lập phản hồi của Dataset Registry (TTS 01), dùng cho mock server
 * khi phát triển Learning Hub độc lập. Cấu trúc theo `DatasetDetail` trong
 * OpenAPI 3.1 Day 21 của TTS 01, cộng hai trường mở rộng v1.1 đề xuất:
 * `data_dictionary` (nhiều bảng, theo mô tả bộ sales_v1 Day 06) và
 * `sandbox_db_url`. Đây là bản mô phỏng hợp đồng, không phải dữ liệu gốc.
 */
const col = (
  name: string,
  type: string,
  description: string,
  extra: { pk?: boolean; fk?: string; nullable?: boolean } = {},
) => ({
  name,
  type,
  nullable: extra.nullable ?? false,
  pk: extra.pk ?? false,
  fk: extra.fk ?? null,
  description,
});

export const SALES_V1_ID = 'ds-retail-ecommerce-sales-v1';

export function buildRegistryFixture(sandboxDbUrl: string) {
  return {
    [SALES_V1_ID]: {
      id: SALES_V1_ID,
      name: 'Sales Performance (Retail Sales v1.0)',
      domain: 'Retail',
      difficulty_level: 'intermediate',
      format: 'csv',
      records_count: 10500,
      current_version: 'v1.0',
      tags: ['retail', 'ecommerce', 'sales', 'sql'],
      is_public: true,
      description:
        'Bộ dữ liệu bán hàng đa bảng chuẩn hóa: khách hàng, nhân viên, sản phẩm, đơn hàng và chi tiết đơn hàng.',
      checksum_sha256: 'mock',
      file_size_bytes: 0,
      created_at: '2026-09-08T08:00:00Z',
      license: 'CyberSoft Academy Educational License',
      schema_definition: [],
      sample_preview: [],
      data_dictionary: {
        tables: [
          {
            name: 'customers',
            description: 'Khách hàng',
            primary_key: 'customer_id',
            columns: [
              col('customer_id', 'VARCHAR(10)', 'Mã khách hàng duy nhất', { pk: true }),
              col('full_name', 'VARCHAR(100)', 'Họ và tên khách hàng'),
              col('email', 'VARCHAR(150)', 'Địa chỉ thư điện tử'),
              col('phone', 'VARCHAR(15)', 'Số điện thoại di động'),
              col('city', 'VARCHAR(50)', 'Tỉnh/Thành phố sinh sống'),
              col('customer_segment', 'VARCHAR(20)', 'Phân khúc (Retail, Wholesale, VIP)'),
              col('created_at', 'TIMESTAMP', 'Thời gian đăng ký tài khoản'),
            ],
          },
          {
            name: 'employees',
            description: 'Nhân viên kinh doanh',
            primary_key: 'employee_id',
            columns: [
              col('employee_id', 'VARCHAR(10)', 'Mã nhân viên bán hàng', { pk: true }),
              col('full_name', 'VARCHAR(100)', 'Họ và tên nhân viên'),
              col('department', 'VARCHAR(50)', 'Phòng ban công tác'),
              col('position', 'VARCHAR(50)', 'Vị trí chức danh'),
              col('hire_date', 'DATE', 'Ngày tuyển dụng'),
              col('region', 'VARCHAR(30)', 'Khu vực thị trường phụ trách'),
            ],
          },
          {
            name: 'products',
            description: 'Sản phẩm',
            primary_key: 'product_id',
            columns: [
              col('product_id', 'VARCHAR(10)', 'Mã sản phẩm duy nhất', { pk: true }),
              col('product_name', 'VARCHAR(150)', 'Tên sản phẩm thương mại'),
              col('category', 'VARCHAR(50)', 'Ngành hàng sản phẩm'),
              col('cost_price', 'NUMERIC(12,2)', 'Giá vốn nhập kho (VNĐ)'),
              col('selling_price', 'NUMERIC(12,2)', 'Giá bán niêm yết (VNĐ)'),
              col('stock_quantity', 'INT', 'Số lượng tồn kho'),
              col('status', 'VARCHAR(20)', 'Trạng thái kinh doanh'),
            ],
          },
          {
            name: 'orders',
            description: 'Đơn hàng',
            primary_key: 'order_id',
            columns: [
              col('order_id', 'VARCHAR(10)', 'Mã đơn hàng duy nhất', { pk: true }),
              col('customer_id', 'VARCHAR(10)', 'Khách hàng đặt mua', { fk: 'customers.customer_id' }),
              col('employee_id', 'VARCHAR(10)', 'Nhân viên phụ trách', { fk: 'employees.employee_id' }),
              col('order_date', 'DATE', 'Ngày chốt đơn'),
              col('shipping_date', 'DATE', 'Ngày bàn giao vận chuyển', { nullable: true }),
              col('order_status', 'VARCHAR(20)', 'Trạng thái đơn (Completed, Cancelled, Pending)'),
              col('payment_method', 'VARCHAR(30)', 'Phương thức thanh toán'),
              col('total_amount', 'NUMERIC(14,2)', 'Tổng giá trị thanh toán'),
            ],
          },
          {
            name: 'order_details',
            description: 'Chi tiết đơn hàng',
            primary_key: 'order_detail_id',
            columns: [
              col('order_detail_id', 'VARCHAR(12)', 'Mã dòng chi tiết', { pk: true }),
              col('order_id', 'VARCHAR(10)', 'Mã đơn hàng sở hữu', { fk: 'orders.order_id' }),
              col('product_id', 'VARCHAR(10)', 'Mã sản phẩm được mua', { fk: 'products.product_id' }),
              col('quantity', 'INT', 'Số lượng mua'),
              col('unit_price', 'NUMERIC(12,2)', 'Đơn giá tại thời điểm mua'),
              col('discount', 'NUMERIC(4,2)', 'Tỷ lệ chiết khấu'),
              col('line_total', 'NUMERIC(14,2)', 'Thành tiền của dòng'),
            ],
          },
        ],
      },
      sandbox_db_url: sandboxDbUrl,
    },
  };
}
