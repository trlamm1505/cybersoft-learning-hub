/**
 * DA Lab Pack (Day 22): 10 bài SQL + 5 bài Insight trên dataset Sales
 * Performance của Data & AI Resource (TTS 01).
 *
 * Mỗi bài chỉ giữ `resource_id` trỏ sang Dataset Registry; cấu trúc bảng và
 * dữ liệu nằm ở sandbox do TTS 01 cấp. `solutionCode` là câu tham chiếu, được
 * chạy lại trên sandbox mỗi lần chấm để lấy tập kết quả chuẩn (SQL) hoặc dữ
 * liệu đối chiếu cho LLM (Insight). Bài nào có ORDER BY ở câu ngoài cùng thì
 * thứ tự dòng cũng được chấm.
 *
 * Tự nạp khi backend khởi động (DaLabsService.onModuleInit), upsert theo slug.
 */
import type { InsightRubricCriterion } from '../modules-api/da-labs/insight-guardrails';

export const SALES_RESOURCE_ID = 'ds-retail-ecommerce-sales-v1';

export interface DaLabSeed {
  slug: string;
  title: string;
  description: string;
  type: 'SQL_LAB' | 'DA_INSIGHT';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  orderInTopic: number;
  starterCode: string;
  solutionCode: string;
  insightRubric?: InsightRubricCriterion[];
}

const sql = (
  n: number,
  difficulty: DaLabSeed['difficulty'],
  title: string,
  description: string,
  solutionCode: string,
): DaLabSeed => ({
  slug: `da-sql-${String(n).padStart(2, '0')}`,
  title,
  description,
  type: 'SQL_LAB',
  difficulty,
  points: difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 15 : 20,
  orderInTopic: n,
  starterCode: '-- Viết câu truy vấn của bạn ở đây\nSELECT\n',
  solutionCode,
});

const insightRubric = (
  recommendationTitle: string,
  recommendationDesc: string,
): InsightRubricCriterion[] => [
  {
    id: 'accuracy',
    title: 'Nhận định đúng với dữ liệu',
    maxPoints: 4,
    description:
      'Kết luận chính khớp với kết quả truy vấn tham chiếu, không suy diễn sai hoặc đảo chiều xu hướng.',
  },
  {
    id: 'evidence',
    title: 'Dẫn chứng bằng số liệu',
    maxPoints: 3,
    description:
      'Nêu số liệu cụ thể (giá trị, tỷ trọng, chênh lệch) lấy từ dữ liệu để chứng minh nhận định.',
  },
  {
    id: 'recommendation',
    title: recommendationTitle,
    maxPoints: 3,
    description: recommendationDesc,
  },
];

const insight = (
  n: number,
  title: string,
  description: string,
  solutionCode: string,
  rubric: InsightRubricCriterion[],
): DaLabSeed => ({
  slug: `da-insight-${String(n).padStart(2, '0')}`,
  title,
  description,
  type: 'DA_INSIGHT',
  difficulty: 'MEDIUM',
  points: 10,
  orderInTopic: 10 + n,
  starterCode: '',
  solutionCode,
  insightRubric: rubric,
});

export const INITIAL_DA_LABS: DaLabSeed[] = [
  sql(
    1,
    'EASY',
    'Đơn hàng giá trị cao',
    'Liệt kê `order_id`, `order_date`, `total_amount` của các đơn có trạng thái `Completed` và `total_amount` lớn hơn 20.000.000. Sắp xếp theo `total_amount` giảm dần.',
    `SELECT order_id, order_date, total_amount
FROM orders
WHERE order_status = 'Completed' AND total_amount > 20000000
ORDER BY total_amount DESC`,
  ),
  sql(
    2,
    'EASY',
    'Số khách hàng theo thành phố',
    'Đếm số khách hàng ở mỗi thành phố. Kết quả gồm 2 cột: thành phố và số khách hàng.',
    `SELECT city, COUNT(*) AS customer_count
FROM customers
GROUP BY city`,
  ),
  sql(
    3,
    'EASY',
    'Sản phẩm sắp hết hàng',
    'Liệt kê `product_id`, `product_name`, `stock_quantity` của các sản phẩm đang kinh doanh (`status = \'Active\'`) có tồn kho dưới 30.',
    `SELECT product_id, product_name, stock_quantity
FROM products
WHERE status = 'Active' AND stock_quantity < 30`,
  ),
  sql(
    4,
    'MEDIUM',
    'Doanh thu theo phương thức thanh toán',
    'Tính tổng doanh thu (`total_amount`) của các đơn `Completed` theo từng `payment_method`. Sắp xếp doanh thu giảm dần.',
    `SELECT payment_method, SUM(total_amount) AS revenue
FROM orders
WHERE order_status = 'Completed'
GROUP BY payment_method
ORDER BY revenue DESC`,
  ),
  sql(
    5,
    'MEDIUM',
    'Doanh thu theo phân khúc khách hàng',
    'Tính tổng doanh thu đơn `Completed` theo `customer_segment` của khách hàng. Kết quả gồm phân khúc và doanh thu.',
    `SELECT c.customer_segment, SUM(o.total_amount) AS revenue
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
WHERE o.order_status = 'Completed'
GROUP BY c.customer_segment`,
  ),
  sql(
    6,
    'MEDIUM',
    'Top 3 sản phẩm bán chạy',
    'Tìm 3 sản phẩm có tổng số lượng bán (`quantity`) cao nhất trong các đơn `Completed`. Kết quả gồm `product_name` và tổng số lượng, sắp xếp số lượng giảm dần, cùng số lượng thì theo tên sản phẩm tăng dần.',
    `SELECT p.product_name, SUM(d.quantity) AS total_quantity
FROM order_details d
JOIN orders o ON o.order_id = d.order_id
JOIN products p ON p.product_id = d.product_id
WHERE o.order_status = 'Completed'
GROUP BY p.product_name
ORDER BY total_quantity DESC, p.product_name ASC
LIMIT 3`,
  ),
  sql(
    7,
    'MEDIUM',
    'Doanh thu theo tháng năm 2025',
    'Tính doanh thu đơn `Completed` theo từng tháng của năm 2025. Cột tháng có dạng `YYYY-MM` (gợi ý: `TO_CHAR`). Sắp xếp theo tháng tăng dần.',
    `SELECT TO_CHAR(order_date, 'YYYY-MM') AS month, SUM(total_amount) AS revenue
FROM orders
WHERE order_status = 'Completed'
  AND order_date >= DATE '2025-01-01' AND order_date < DATE '2026-01-01'
GROUP BY TO_CHAR(order_date, 'YYYY-MM')
ORDER BY month`,
  ),
  sql(
    8,
    'HARD',
    'Khách hàng chưa có đơn hoàn tất',
    'Liệt kê `customer_id`, `full_name` của các khách hàng chưa có đơn hàng `Completed` nào (kể cả khách chưa từng đặt hàng).',
    `SELECT c.customer_id, c.full_name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o
  WHERE o.customer_id = c.customer_id AND o.order_status = 'Completed'
)`,
  ),
  sql(
    9,
    'HARD',
    'Nhân viên có doanh thu trên 30 triệu',
    'Với mỗi nhân viên, tính số đơn `Completed` và tổng doanh thu của các đơn đó. Chỉ giữ nhân viên có doanh thu lớn hơn 30.000.000. Kết quả gồm `full_name`, `region`, số đơn, doanh thu; sắp xếp doanh thu giảm dần.',
    `SELECT e.full_name, e.region, COUNT(*) AS completed_orders, SUM(o.total_amount) AS revenue
FROM employees e
JOIN orders o ON o.employee_id = e.employee_id
WHERE o.order_status = 'Completed'
GROUP BY e.employee_id, e.full_name, e.region
HAVING SUM(o.total_amount) > 30000000
ORDER BY revenue DESC`,
  ),
  sql(
    10,
    'HARD',
    'Xếp hạng sản phẩm trong ngành hàng',
    'Tính doanh thu (`line_total`) của từng sản phẩm trong các đơn `Completed`, rồi xếp hạng sản phẩm trong cùng `category` theo doanh thu giảm dần (dùng `RANK()`). Kết quả gồm `category`, `product_name`, doanh thu, hạng; sắp xếp theo `category` rồi hạng.',
    `SELECT category, product_name, revenue,
       RANK() OVER (PARTITION BY category ORDER BY revenue DESC) AS rank_in_category
FROM (
  SELECT p.category, p.product_name, SUM(d.line_total) AS revenue
  FROM order_details d
  JOIN orders o ON o.order_id = d.order_id
  JOIN products p ON p.product_id = d.product_id
  WHERE o.order_status = 'Completed'
  GROUP BY p.category, p.product_name
) t
ORDER BY category, rank_in_category, product_name`,
  ),

  insight(
    1,
    'Phân khúc khách hàng đóng góp doanh thu',
    'Dựa trên doanh thu các đơn Completed theo phân khúc khách hàng, phân khúc nào đóng góp nhiều nhất và chiếm bao nhiêu phần trăm? Đề xuất một hành động cho đội kinh doanh.',
    `SELECT c.customer_segment, COUNT(*) AS completed_orders, SUM(o.total_amount) AS revenue,
       ROUND(100.0 * SUM(o.total_amount) / SUM(SUM(o.total_amount)) OVER (), 2) AS revenue_share_pct
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
WHERE o.order_status = 'Completed'
GROUP BY c.customer_segment
ORDER BY revenue DESC`,
    insightRubric(
      'Đề xuất hành động',
      'Đề xuất cụ thể, khả thi và suy ra trực tiếp từ nhận định về phân khúc.',
    ),
  ),
  insight(
    2,
    'Xu hướng doanh thu theo quý',
    'Nhận xét xu hướng doanh thu đơn Completed theo quý trong giai đoạn dữ liệu có. Quý nào cao nhất, thấp nhất, và điều gì có thể giải thích?',
    `SELECT TO_CHAR(order_date, 'YYYY-"Q"Q') AS quarter, COUNT(*) AS completed_orders, SUM(total_amount) AS revenue
FROM orders
WHERE order_status = 'Completed'
GROUP BY TO_CHAR(order_date, 'YYYY-"Q"Q')
ORDER BY quarter`,
    insightRubric(
      'Giải thích và giới hạn',
      'Đưa ra giả thuyết giải thích hợp lý và nêu giới hạn của dữ liệu (số đơn ít, thiếu quý).',
    ),
  ),
  insight(
    3,
    'Hiệu suất nhân viên theo khu vực',
    'So sánh hiệu suất bán hàng của các nhân viên và khu vực. Nhân viên hoặc khu vực nào cần được hỗ trợ, vì sao?',
    `SELECT e.region, e.full_name, COUNT(o.order_id) FILTER (WHERE o.order_status = 'Completed') AS completed_orders,
       COALESCE(SUM(o.total_amount) FILTER (WHERE o.order_status = 'Completed'), 0) AS revenue
FROM employees e
LEFT JOIN orders o ON o.employee_id = e.employee_id
GROUP BY e.region, e.full_name
ORDER BY e.region, revenue DESC`,
    insightRubric(
      'Đề xuất hỗ trợ',
      'Chỉ ra đúng đối tượng cần hỗ trợ và hình thức hỗ trợ phù hợp với số liệu.',
    ),
  ),
  insight(
    4,
    'Rủi ro theo phương thức thanh toán',
    'Phân tích tỷ lệ đơn Completed, Cancelled, Pending theo phương thức thanh toán. Phương thức nào rủi ro hơn và nên làm gì?',
    `SELECT payment_method, order_status, COUNT(*) AS orders, SUM(total_amount) AS amount
FROM orders
GROUP BY payment_method, order_status
ORDER BY payment_method, order_status`,
    insightRubric(
      'Đề xuất giảm rủi ro',
      'Đề xuất biện pháp giảm rủi ro gắn với phương thức thanh toán có vấn đề.',
    ),
  ),
  insight(
    5,
    'Chất lượng dữ liệu trạng thái đơn',
    'Kiểm tra sự nhất quán giữa trạng thái đơn hàng và ngày giao hàng. Có bất thường nào không, và nó ảnh hưởng thế nào tới KPI giao hàng?',
    `SELECT order_status, (shipping_date IS NOT NULL) AS has_shipping_date, COUNT(*) AS orders
FROM orders
GROUP BY order_status, (shipping_date IS NOT NULL)
ORDER BY order_status, has_shipping_date`,
    insightRubric(
      'Ảnh hưởng và cách xử lý',
      'Nêu đúng KPI bị ảnh hưởng và cách xử lý bản ghi bất thường trước khi báo cáo.',
    ),
  ),
];
