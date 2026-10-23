# Problem Generator v0.1 — Validation Report

Generator client: GeminiProblemGeneratorClient (gemini-flash-lite-latest, gọi API thật)
Tổng số bài chạy qua pipeline: 10
Số bài reference solution pass mọi test: 7/10
Số bài sẵn sàng chờ review (pass test + không nghi trùng lặp): 7/10

| specId | Title | Slug | Syntax | Tests pass | Trùng lặp nghi vấn | Sẵn sàng review |
|---|---|---|---|---|---|---|
| spec-01 | Tính tổng các số chẵn | tinh-tong-cac-so-chan-spec-01 | OK | 4/4 | - | Có |
| spec-02 | Kiểm tra chuỗi đối xứng | kiem-tra-chuoi-doi-xung-spec-02 | OK | 4/4 | - | Có |
| spec-03 | Tim phan tu lon thu hai trong danh sach | tim-phan-tu-lon-thu-hai-trong-danh-sach-spec-03 | OK | 4/4 | - | Có |
| spec-04 | Tìm ước số nguyên tố nhỏ nhất | tim-uoc-so-nguyen-to-nho-nhat-spec-04 | OK | 4/4 | - | Có |
| spec-05 | Tìm số lớn nhất trong hai số | tim-so-lon-nhat-trong-hai-so-spec-05 | OK | 4/4 | - | Có |
| spec-06 | Tim ky tu xuat hien nhieu nhat | tim-ky-tu-xuat-hien-nhieu-nhat-spec-06 | OK | 4/4 | - | Có |
| spec-07 | Sắp xếp và lọc danh sách nâng cao | sap-xep-va-loc-danh-sach-nang-cao-spec-07 | LỖI | 0/0 | - | Không |
| spec-08 | Tính tổng ma trận có điều kiện | tinh-tong-ma-tran-co-dieu-kien-spec-08 | OK | 0/4 | - | Không |
| spec-09 | Kiểm tra chuỗi con và cắt chuỗi nâng cao | kiem-tra-chuoi-con-va-cat-chuoi-nang-cao-spec-09 | OK | 3/4 | - | Không |
| spec-10 | So sánh hai số nguyên | so-sanh-hai-so-nguyen-spec-10 | OK | 4/4 | - | Có |

## Chi tiết từng bài

### spec-01: Tính tổng các số chẵn

- Slug: `tinh-tong-cac-so-chan-spec-01`
- Độ khó: EASY
- Tags: loop, sum, python-fundamentals
- Mô tả: Viết chương trình Python nhập vào một số nguyên dương N (1 <= N <= 10^6). Sử dụng vòng lặp for để tính và in ra tổng tất cả các số chẵn từ 1 đến N (bao gồm cả N nếu N chẵn). Yêu cầu chỉ sử dụng vòng lặp, không dùng công thức toán học đóng. Định dạng input: một dòng chứa số nguyên N. Định dạng output: một dòng chứa tổng các số chẵn tìm được.
- Prompt đã dùng để sinh bài này:
  ```
  Bạn là người ra đề bài tập lập trình Python cho học viên. Hãy sinh MỘT bài tập lập trình dựa trên thông tin sau:
  
  Learning outcome (mục tiêu học): Vận dụng vòng lặp for để tính tổng có điều kiện
  Mức độ (level): EASY
  Ràng buộc (constraints): 1 <= N <= 10^6; Chỉ dùng vòng lặp, không dùng công thức đóng
  Tags: loop, sum, python-fundamentals
  
  Yêu cầu bắt buộc:
  1. Bài tập nhận input qua stdin (hàm input() của Python) và in kết quả ra stdout (print()), không dùng tham số hàm hay return value làm giao diện chấm bài.
  2. Đưa ra đúng 1 lời giải Python 3 chuẩn (solutionCode) chạy được ngay, không phụ thuộc thư viện ngoài chuẩn.
  3. Đưa ra ít nhất 4 test case: ít nhất 2 test case ví dụ minh họa (isHidden=false) và ít nhất 2 test case ẩn dùng để chấm điểm thật (isHidden=true), bao gồm cả trường hợp biên phù hợp với ràng buộc đã cho.
  4. Với MỖI test case, expectedOutput phải là kết quả CHÍNH XÁC khi chạy solutionCode với input đó — không được đoán hay tính nhẩm sai.
  5. Trả lời DUY NHẤT một object JSON đúng theo schema đã cung cấp, không thêm markdown code fence, không thêm giải thích ngoài JSON.
  
  Schema JSON bắt buộc:
  {
    "title": string,
    "description": string (đề bài đầy đủ bằng tiếng Việt, ghi rõ định dạng input/output),
    "starterCode": string (code khung ban đầu cho học viên, có đọc input sẵn),
    "solutionCode": string (lời giải đầy đủ),
    "testCases": [ { "input": string, "expectedOutput": string, "isHidden": boolean } ]
  }
  ```
- Cú pháp solution: hợp lệ
- Test case:
  - [PASS] (visible) input=`5` expected=`6` actual=`6`
  - [PASS] (visible) input=`10` expected=`30` actual=`30`
  - [PASS] (hidden) input=`1` expected=`0` actual=`0`
  - [PASS] (hidden) input=`1000` expected=`250500` actual=`250500`
- Không phát hiện nghi vấn trùng lặp với catalog hiện có.

### spec-02: Kiểm tra chuỗi đối xứng

- Slug: `kiem-tra-chuoi-doi-xung-spec-02`
- Độ khó: EASY
- Tags: string, palindrome
- Mô tả: Viết chương trình Python nhập vào một chuỗi ký tự chỉ gồm các chữ cái thường không dấu (độ dài tối đa 1000 ký tự) từ bàn phím. Kiểm tra xem chuỗi đó có phải là chuỗi đối xứng (palindrome) hay không. In ra màn hình chữ "YES" nếu đúng là chuỗi đối xứng, hoặc "NO" nếu không.

Input:
- Một dòng chứa chuỗi s.

Output:
- In ra YES hoặc NO.
- Prompt đã dùng để sinh bài này:
  ```
  Bạn là người ra đề bài tập lập trình Python cho học viên. Hãy sinh MỘT bài tập lập trình dựa trên thông tin sau:
  
  Learning outcome (mục tiêu học): Xử lý chuỗi: kiểm tra tính đối xứng (palindrome)
  Mức độ (level): EASY
  Ràng buộc (constraints): Chuỗi chỉ gồm chữ cái thường không dấu; Độ dài tối đa 1000 ký tự
  Tags: string, palindrome
  
  Yêu cầu bắt buộc:
  1. Bài tập nhận input qua stdin (hàm input() của Python) và in kết quả ra stdout (print()), không dùng tham số hàm hay return value làm giao diện chấm bài.
  2. Đưa ra đúng 1 lời giải Python 3 chuẩn (solutionCode) chạy được ngay, không phụ thuộc thư viện ngoài chuẩn.
  3. Đưa ra ít nhất 4 test case: ít nhất 2 test case ví dụ minh họa (isHidden=false) và ít nhất 2 test case ẩn dùng để chấm điểm thật (isHidden=true), bao gồm cả trường hợp biên phù hợp với ràng buộc đã cho.
  4. Với MỖI test case, expectedOutput phải là kết quả CHÍNH XÁC khi chạy solutionCode với input đó — không được đoán hay tính nhẩm sai.
  5. Trả lời DUY NHẤT một object JSON đúng theo schema đã cung cấp, không thêm markdown code fence, không thêm giải thích ngoài JSON.
  
  Schema JSON bắt buộc:
  {
    "title": string,
    "description": string (đề bài đầy đủ bằng tiếng Việt, ghi rõ định dạng input/output),
    "starterCode": string (code khung ban đầu cho học viên, có đọc input sẵn),
    "solutionCode": string (lời giải đầy đủ),
    "testCases": [ { "input": string, "expectedOutput": string, "isHidden": boolean } ]
  }
  ```
- Cú pháp solution: hợp lệ
- Test case:
  - [PASS] (visible) input=`radar` expected=`YES` actual=`YES`
  - [PASS] (visible) input=`python` expected=`NO` actual=`NO`
  - [PASS] (hidden) input=`a` expected=`YES` actual=`YES`
  - [PASS] (hidden) input=`ab` expected=`NO` actual=`NO`
- Không phát hiện nghi vấn trùng lặp với catalog hiện có.

### spec-03: Tim phan tu lon thu hai trong danh sach

- Slug: `tim-phan-tu-lon-thu-hai-trong-danh-sach-spec-03`
- Độ khó: MEDIUM
- Tags: list, array
- Mô tả: Viet chuong trinh Python nhap vao mot danh sach cac so nguyen va tim phan tu lon thu hai trong danh sach do. Dong dau tien la so luong phan tu N (2 <= N <= 10^5). Dong thu hai gom N so nguyen cach nhau boi khoang trang. In ra man hinh gia tri cua phan tu lon thu hai. Neu danh sach khong ton tai phan tu lon thu hai (vi tat ca cac phan tu deu bang nhau), in ra "Khong co".
- Prompt đã dùng để sinh bài này:
  ```
  Bạn là người ra đề bài tập lập trình Python cho học viên. Hãy sinh MỘT bài tập lập trình dựa trên thông tin sau:
  
  Learning outcome (mục tiêu học): Thao tác danh sách: tìm phần tử lớn thứ hai
  Mức độ (level): MEDIUM
  Ràng buộc (constraints): 2 <= N <= 10^5; Có thể có phần tử trùng giá trị
  Tags: list, array
  
  Yêu cầu bắt buộc:
  1. Bài tập nhận input qua stdin (hàm input() của Python) và in kết quả ra stdout (print()), không dùng tham số hàm hay return value làm giao diện chấm bài.
  2. Đưa ra đúng 1 lời giải Python 3 chuẩn (solutionCode) chạy được ngay, không phụ thuộc thư viện ngoài chuẩn.
  3. Đưa ra ít nhất 4 test case: ít nhất 2 test case ví dụ minh họa (isHidden=false) và ít nhất 2 test case ẩn dùng để chấm điểm thật (isHidden=true), bao gồm cả trường hợp biên phù hợp với ràng buộc đã cho.
  4. Với MỖI test case, expectedOutput phải là kết quả CHÍNH XÁC khi chạy solutionCode với input đó — không được đoán hay tính nhẩm sai.
  5. Trả lời DUY NHẤT một object JSON đúng theo schema đã cung cấp, không thêm markdown code fence, không thêm giải thích ngoài JSON.
  
  Schema JSON bắt buộc:
  {
    "title": string,
    "description": string (đề bài đầy đủ bằng tiếng Việt, ghi rõ định dạng input/output),
    "starterCode": string (code khung ban đầu cho học viên, có đọc input sẵn),
    "solutionCode": string (lời giải đầy đủ),
    "testCases": [ { "input": string, "expectedOutput": string, "isHidden": boolean } ]
  }
  ```
- Cú pháp solution: hợp lệ
- Test case:
  - [PASS] (visible) input=`5\n1 5 3 9 7` expected=`7` actual=`7`
  - [PASS] (visible) input=`4\n5 5 2 1` expected=`2` actual=`2`
  - [PASS] (hidden) input=`3\n10 10 10` expected=`Khong co` actual=`Khong co`
  - [PASS] (hidden) input=`6\n-1 -5 -2 -9 -3 -5` expected=`-2` actual=`-2`
- Không phát hiện nghi vấn trùng lặp với catalog hiện có.

### spec-04: Tìm ước số nguyên tố nhỏ nhất

- Slug: `tim-uoc-so-nguyen-to-nho-nhat-spec-04`
- Độ khó: MEDIUM
- Tags: loop, while
- Mô tả: Viết chương trình Python nhập vào một số nguyên dương N (1 <= N <= 10^9) từ bàn phím. Hãy tìm và in ra ước số nguyên tố nhỏ nhất của N (khác 1). Yêu cầu thuật toán phải có độ phức tạp tốt hơn O(N), ví dụ O(sqrt(N)).

Định dạng Input:
- Một dòng chứa số nguyên dương N.

Định dạng Output:
- In ra một số nguyên duy nhất là ước số nguyên tố nhỏ nhất của N.
- Prompt đã dùng để sinh bài này:
  ```
  Bạn là người ra đề bài tập lập trình Python cho học viên. Hãy sinh MỘT bài tập lập trình dựa trên thông tin sau:
  
  Learning outcome (mục tiêu học): Vòng lặp while kết hợp điều kiện dừng sớm
  Mức độ (level): MEDIUM
  Ràng buộc (constraints): 1 <= N <= 10^9; Yêu cầu độ phức tạp tốt hơn O(N)
  Tags: loop, while
  
  Yêu cầu bắt buộc:
  1. Bài tập nhận input qua stdin (hàm input() của Python) và in kết quả ra stdout (print()), không dùng tham số hàm hay return value làm giao diện chấm bài.
  2. Đưa ra đúng 1 lời giải Python 3 chuẩn (solutionCode) chạy được ngay, không phụ thuộc thư viện ngoài chuẩn.
  3. Đưa ra ít nhất 4 test case: ít nhất 2 test case ví dụ minh họa (isHidden=false) và ít nhất 2 test case ẩn dùng để chấm điểm thật (isHidden=true), bao gồm cả trường hợp biên phù hợp với ràng buộc đã cho.
  4. Với MỖI test case, expectedOutput phải là kết quả CHÍNH XÁC khi chạy solutionCode với input đó — không được đoán hay tính nhẩm sai.
  5. Trả lời DUY NHẤT một object JSON đúng theo schema đã cung cấp, không thêm markdown code fence, không thêm giải thích ngoài JSON.
  
  Schema JSON bắt buộc:
  {
    "title": string,
    "description": string (đề bài đầy đủ bằng tiếng Việt, ghi rõ định dạng input/output),
    "starterCode": string (code khung ban đầu cho học viên, có đọc input sẵn),
    "solutionCode": string (lời giải đầy đủ),
    "testCases": [ { "input": string, "expectedOutput": string, "isHidden": boolean } ]
  }
  ```
- Cú pháp solution: hợp lệ
- Test case:
  - [PASS] (visible) input=`35` expected=`5` actual=`5`
  - [PASS] (visible) input=`13` expected=`13` actual=`13`
  - [PASS] (hidden) input=`1` expected=`1` actual=`1`
  - [PASS] (hidden) input=`999999937` expected=`999999937` actual=`999999937`
- Không phát hiện nghi vấn trùng lặp với catalog hiện có.

### spec-05: Tìm số lớn nhất trong hai số

- Slug: `tim-so-lon-nhat-trong-hai-so-spec-05`
- Độ khó: EASY
- Tags: condition, basics
- Mô tả: Viết chương trình nhập vào hai số nguyên A và B từ bàn phím (mỗi số trên một dòng). Hãy so sánh và in ra số lớn hơn. Nếu hai số bằng nhau, hãy in ra giá trị đó.

Định dạng Input:
- Gồm 2 dòng, lần lượt chứa hai số nguyên A và B (-10^9 <= A, B <= 10^9).

Định dạng Output:
- In ra số lớn nhất trong hai số.
- Prompt đã dùng để sinh bài này:
  ```
  Bạn là người ra đề bài tập lập trình Python cho học viên. Hãy sinh MỘT bài tập lập trình dựa trên thông tin sau:
  
  Learning outcome (mục tiêu học): So sánh và rẽ nhánh điều kiện cơ bản
  Mức độ (level): EASY
  Ràng buộc (constraints): -10^9 <= A, B <= 10^9
  Tags: condition, basics
  
  Yêu cầu bắt buộc:
  1. Bài tập nhận input qua stdin (hàm input() của Python) và in kết quả ra stdout (print()), không dùng tham số hàm hay return value làm giao diện chấm bài.
  2. Đưa ra đúng 1 lời giải Python 3 chuẩn (solutionCode) chạy được ngay, không phụ thuộc thư viện ngoài chuẩn.
  3. Đưa ra ít nhất 4 test case: ít nhất 2 test case ví dụ minh họa (isHidden=false) và ít nhất 2 test case ẩn dùng để chấm điểm thật (isHidden=true), bao gồm cả trường hợp biên phù hợp với ràng buộc đã cho.
  4. Với MỖI test case, expectedOutput phải là kết quả CHÍNH XÁC khi chạy solutionCode với input đó — không được đoán hay tính nhẩm sai.
  5. Trả lời DUY NHẤT một object JSON đúng theo schema đã cung cấp, không thêm markdown code fence, không thêm giải thích ngoài JSON.
  
  Schema JSON bắt buộc:
  {
    "title": string,
    "description": string (đề bài đầy đủ bằng tiếng Việt, ghi rõ định dạng input/output),
    "starterCode": string (code khung ban đầu cho học viên, có đọc input sẵn),
    "solutionCode": string (lời giải đầy đủ),
    "testCases": [ { "input": string, "expectedOutput": string, "isHidden": boolean } ]
  }
  ```
- Cú pháp solution: hợp lệ
- Test case:
  - [PASS] (visible) input=`5\n10` expected=`10` actual=`10`
  - [PASS] (visible) input=`20\n20` expected=`20` actual=`20`
  - [PASS] (hidden) input=`-5\n-12` expected=`-5` actual=`-5`
  - [PASS] (hidden) input=`1000000000\n-1000000000` expected=`1000000000` actual=`1000000000`
- Không phát hiện nghi vấn trùng lặp với catalog hiện có.

### spec-06: Tim ky tu xuat hien nhieu nhat

- Slug: `tim-ky-tu-xuat-hien-nhieu-nhat-spec-06`
- Độ khó: MEDIUM
- Tags: string, ky tu
- Mô tả: Viet chuong trinh Python nham tim va in ra ky tu xuat hien nhieu nhat trong mot chuoi cho truoc. Neu co nhieu ky tu co cung so lan xuat hien nhieu nhat, hay in ra ky tu xuat hien dau tien trong chuoi. Input: Mot dong duy nhat chua chuoi S (1 <= do dai S <= 5000). Output: In ra ky tu xuat hien nhieu nhat.
- Prompt đã dùng để sinh bài này:
  ```
  Bạn là người ra đề bài tập lập trình Python cho học viên. Hãy sinh MỘT bài tập lập trình dựa trên thông tin sau:
  
  Learning outcome (mục tiêu học): Xử lý chuỗi: đếm ký tự xuất hiện nhiều nhất
  Mức độ (level): MEDIUM
  Ràng buộc (constraints): Chuỗi không rỗng, tối đa 5000 ký tự
  Tags: string, ky tu
  
  Yêu cầu bắt buộc:
  1. Bài tập nhận input qua stdin (hàm input() của Python) và in kết quả ra stdout (print()), không dùng tham số hàm hay return value làm giao diện chấm bài.
  2. Đưa ra đúng 1 lời giải Python 3 chuẩn (solutionCode) chạy được ngay, không phụ thuộc thư viện ngoài chuẩn.
  3. Đưa ra ít nhất 4 test case: ít nhất 2 test case ví dụ minh họa (isHidden=false) và ít nhất 2 test case ẩn dùng để chấm điểm thật (isHidden=true), bao gồm cả trường hợp biên phù hợp với ràng buộc đã cho.
  4. Với MỖI test case, expectedOutput phải là kết quả CHÍNH XÁC khi chạy solutionCode với input đó — không được đoán hay tính nhẩm sai.
  5. Trả lời DUY NHẤT một object JSON đúng theo schema đã cung cấp, không thêm markdown code fence, không thêm giải thích ngoài JSON.
  
  Schema JSON bắt buộc:
  {
    "title": string,
    "description": string (đề bài đầy đủ bằng tiếng Việt, ghi rõ định dạng input/output),
    "starterCode": string (code khung ban đầu cho học viên, có đọc input sẵn),
    "solutionCode": string (lời giải đầy đủ),
    "testCases": [ { "input": string, "expectedOutput": string, "isHidden": boolean } ]
  }
  ```
- Cú pháp solution: hợp lệ
- Test case:
  - [PASS] (visible) input=`banana` expected=`a` actual=`a`
  - [PASS] (visible) input=`aabbcc` expected=`a` actual=`a`
  - [PASS] (hidden) input=`z` expected=`z` actual=`z`
  - [PASS] (hidden) input=`abcabcabc` expected=`a` actual=`a`
- Không phát hiện nghi vấn trùng lặp với catalog hiện có.

### spec-07: Sắp xếp và lọc danh sách nâng cao

- Slug: `sap-xep-va-loc-danh-sach-nang-cao-spec-07`
- Độ khó: HARD
- Tags: list, array, sort
- Mô tả: Viết chương trình Python đọc vào một số nguyên N, tiếp theo là N số nguyên trên một dòng, và cuối cùng là một ngưỡng giá trị X. Hãy sắp xếp danh sách N số nguyên này theo thứ tự tăng dần bằng thuật toán tự viết (không dùng hàm sort() hay sorted() có sẵn cho phần sắp xếp), sau đó lọc ra và in trên một dòng tất cả các phần tử có giá trị lớn hơn hoặc bằng X (giữ nguyên thứ tự sau khi sắp xếp). Nếu không có phần tử nào thỏa mãn, in ra một dòng trống.\n\nĐịnh dạng Input:\n- Dòng đầu tiên chứa số nguyên N (1 <= N <= 10^5).\n- Dòng thứ hai chứa N số nguyên, cách nhau bởi khoảng trắng.\n- Dòng thứ ba chứa số nguyên X.\n\nĐịnh dạng Output:\n- Một dòng chứa các số thỏa mãn điều kiện lớn hơn hoặc bằng X, cách nhau bởi khoảng trắng.
- Prompt đã dùng để sinh bài này:
  ```
  Bạn là người ra đề bài tập lập trình Python cho học viên. Hãy sinh MỘT bài tập lập trình dựa trên thông tin sau:
  
  Learning outcome (mục tiêu học): Danh sách: sắp xếp và truy vấn theo ngưỡng
  Mức độ (level): HARD
  Ràng buộc (constraints): 1 <= N <= 10^5; Không dùng thư viện sort có sẵn cho phần lõi thuật toán
  Tags: list, array, sort
  
  Yêu cầu bắt buộc:
  1. Bài tập nhận input qua stdin (hàm input() của Python) và in kết quả ra stdout (print()), không dùng tham số hàm hay return value làm giao diện chấm bài.
  2. Đưa ra đúng 1 lời giải Python 3 chuẩn (solutionCode) chạy được ngay, không phụ thuộc thư viện ngoài chuẩn.
  3. Đưa ra ít nhất 4 test case: ít nhất 2 test case ví dụ minh họa (isHidden=false) và ít nhất 2 test case ẩn dùng để chấm điểm thật (isHidden=true), bao gồm cả trường hợp biên phù hợp với ràng buộc đã cho.
  4. Với MỖI test case, expectedOutput phải là kết quả CHÍNH XÁC khi chạy solutionCode với input đó — không được đoán hay tính nhẩm sai.
  5. Trả lời DUY NHẤT một object JSON đúng theo schema đã cung cấp, không thêm markdown code fence, không thêm giải thích ngoài JSON.
  
  Schema JSON bắt buộc:
  {
    "title": string,
    "description": string (đề bài đầy đủ bằng tiếng Việt, ghi rõ định dạng input/output),
    "starterCode": string (code khung ban đầu cho học viên, có đọc input sẵn),
    "solutionCode": string (lời giải đầy đủ),
    "testCases": [ { "input": string, "expectedOutput": string, "isHidden": boolean } ]
  }
  ```
- Cú pháp solution: LỖI — File "C:\Users\Windows\AppData\Local\Temp\code-runner-syntax-nGzqfc\0ca9c55d-d5d1-49ee-9b7d-d50158ff227e.py", line 1
    import sys\n\ndef merge_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    \n    return merge(left, right)\n\ndef merge(left, right):\n    result = []\n    i = j = 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            result.append(left[i])\n            i += 1\n        else:\n            result.append(right[j])\n            j += 1\n    result.extend(left[i:])\n    result.extend(right[j:])\n    return result\n\ndef main():\n    input_data = sys.stdin.read().split()\n    if not input_data:\n        return\n    n = int(input_data[0])\n    arr = [int(x) for x in input_data[1:n+1]]\n    threshold = int(input_data[n+1])\n    \n    sorted_arr = merge_sort(arr)\n    \n    filtered = [str(val) for val in sorted_arr if val >= threshold]\n    print(' '.join(filtered))\n\nif __name__ == '__main__':\n    main()
               ^
SyntaxError: unexpected character after line continuation character
- Không phát hiện nghi vấn trùng lặp với catalog hiện có.

### spec-08: Tính tổng ma trận có điều kiện

- Slug: `tinh-tong-ma-tran-co-dieu-kien-spec-08`
- Độ khó: HARD
- Tags: loop, for, tong
- Mô tả: Viết chương trình Python nhập vào hai số nguyên N và M (1 <= N, M <= 1000) là số hàng và số cột của một ma trận. Tiếp theo là N dòng, mỗi dòng chứa M số nguyên cách nhau bởi khoảng trắng thể hiện các phần tử của ma trận. Hãy tính và in ra tổng của tất cả các phần tử có giá trị chẵn và chia hết cho 3 trong ma trận đó.
- Prompt đã dùng để sinh bài này:
  ```
  Bạn là người ra đề bài tập lập trình Python cho học viên. Hãy sinh MỘT bài tập lập trình dựa trên thông tin sau:
  
  Learning outcome (mục tiêu học): Vòng lặp lồng nhau để tính tổng ma trận điều kiện
  Mức độ (level): HARD
  Ràng buộc (constraints): 1 <= N, M <= 1000
  Tags: loop, for, tong
  
  Yêu cầu bắt buộc:
  1. Bài tập nhận input qua stdin (hàm input() của Python) và in kết quả ra stdout (print()), không dùng tham số hàm hay return value làm giao diện chấm bài.
  2. Đưa ra đúng 1 lời giải Python 3 chuẩn (solutionCode) chạy được ngay, không phụ thuộc thư viện ngoài chuẩn.
  3. Đưa ra ít nhất 4 test case: ít nhất 2 test case ví dụ minh họa (isHidden=false) và ít nhất 2 test case ẩn dùng để chấm điểm thật (isHidden=true), bao gồm cả trường hợp biên phù hợp với ràng buộc đã cho.
  4. Với MỖI test case, expectedOutput phải là kết quả CHÍNH XÁC khi chạy solutionCode với input đó — không được đoán hay tính nhẩm sai.
  5. Trả lời DUY NHẤT một object JSON đúng theo schema đã cung cấp, không thêm markdown code fence, không thêm giải thích ngoài JSON.
  
  Schema JSON bắt buộc:
  {
    "title": string,
    "description": string (đề bài đầy đủ bằng tiếng Việt, ghi rõ định dạng input/output),
    "starterCode": string (code khung ban đầu cho học viên, có đọc input sẵn),
    "solutionCode": string (lời giải đầy đủ),
    "testCases": [ { "input": string, "expectedOutput": string, "isHidden": boolean } ]
  }
  ```
- Cú pháp solution: hợp lệ
- Test case:
  - [FAIL] (visible) input=`2 3\n1 6 3\n12 5 9` expected=`18` actual=``
  - [FAIL] (visible) input=`2 2\n2 4\n5 7` expected=`0` actual=``
  - [FAIL] (hidden) input=`1 1\n6` expected=`6` actual=``
  - [FAIL] (hidden) input=`3 3\n6 12 18\n2 4 6\n3 9 27` expected=`54` actual=``
- Không phát hiện nghi vấn trùng lặp với catalog hiện có.

### spec-09: Kiểm tra chuỗi con và cắt chuỗi nâng cao

- Slug: `kiem-tra-chuoi-con-va-cat-chuoi-nang-cao-spec-09`
- Độ khó: MEDIUM
- Tags: string, chuoi
- Mô tả: Viết chương trình Python nhận vào hai dòng từ standard input. Dòng thứ nhất là chuỗi gốc S (độ dài tối đa 2000 ký tự). Dòng thứ hai là chuỗi con T. Chương trình cần kiểm tra xem T có xuất hiện trong S hay không. Nếu có, hãy tìm vị trí xuất hiện đầu tiên của T trong S, sau đó cắt chuỗi S từ vị trí đó về sau với độ dài bằng độ dài của T và in ra chuỗi đã cắt. Nếu T không xuất hiện trong S, hãy in ra chuỗi 'KHONG'. Định dạng Input: Dòng 1 chứa chuỗi S, dòng 2 chứa chuỗi T. Định dạng Output: In ra chuỗi cắt được hoặc 'KHONG'.
- Prompt đã dùng để sinh bài này:
  ```
  Bạn là người ra đề bài tập lập trình Python cho học viên. Hãy sinh MỘT bài tập lập trình dựa trên thông tin sau:
  
  Learning outcome (mục tiêu học): Kiểm tra chuỗi con và thao tác cắt chuỗi
  Mức độ (level): MEDIUM
  Ràng buộc (constraints): Độ dài chuỗi tối đa 2000 ký tự
  Tags: string, chuoi
  
  Yêu cầu bắt buộc:
  1. Bài tập nhận input qua stdin (hàm input() của Python) và in kết quả ra stdout (print()), không dùng tham số hàm hay return value làm giao diện chấm bài.
  2. Đưa ra đúng 1 lời giải Python 3 chuẩn (solutionCode) chạy được ngay, không phụ thuộc thư viện ngoài chuẩn.
  3. Đưa ra ít nhất 4 test case: ít nhất 2 test case ví dụ minh họa (isHidden=false) và ít nhất 2 test case ẩn dùng để chấm điểm thật (isHidden=true), bao gồm cả trường hợp biên phù hợp với ràng buộc đã cho.
  4. Với MỖI test case, expectedOutput phải là kết quả CHÍNH XÁC khi chạy solutionCode với input đó — không được đoán hay tính nhẩm sai.
  5. Trả lời DUY NHẤT một object JSON đúng theo schema đã cung cấp, không thêm markdown code fence, không thêm giải thích ngoài JSON.
  
  Schema JSON bắt buộc:
  {
    "title": string,
    "description": string (đề bài đầy đủ bằng tiếng Việt, ghi rõ định dạng input/output),
    "starterCode": string (code khung ban đầu cho học viên, có đọc input sẵn),
    "solutionCode": string (lời giải đầy đủ),
    "testCases": [ { "input": string, "expectedOutput": string, "isHidden": boolean } ]
  }
  ```
- Cú pháp solution: hợp lệ
- Test case:
  - [PASS] (visible) input=`lậptrìnhpythoncơbản\ntrình` expected=`trình` actual=`trình`
  - [PASS] (visible) input=`họclậptrình\njava` expected=`KHONG` actual=`KHONG`
  - [PASS] (hidden) input=`python\npython` expected=`python` actual=`python`
  - [FAIL] (hidden) input=`a` expected=`KHONG` actual=``
- Không phát hiện nghi vấn trùng lặp với catalog hiện có.

### spec-10: So sánh hai số nguyên

- Slug: `so-sanh-hai-so-nguyen-spec-10`
- Độ khó: EASY
- Tags: condition, so sanh
- Mô tả: Viết chương trình nhập vào hai số nguyên A và B từ bàn phím (với ràng buộc -100 <= A, B <= 100). Hãy so sánh A và B, sau đó in ra màn hình thông báo tương ứng:
- Nếu A > B, in ra: A lon hon B
- Nếu A < B, in ra: A nho hon B
- Nếu A == B, in ra: A bang B

Định dạng Input:
Một dòng chứa hai số nguyên A và B cách nhau bởi khoảng trắng.

Định dạng Output:
In ra kết quả so sánh theo đúng định dạng.
- Prompt đã dùng để sinh bài này:
  ```
  Bạn là người ra đề bài tập lập trình Python cho học viên. Hãy sinh MỘT bài tập lập trình dựa trên thông tin sau:
  
  Learning outcome (mục tiêu học): So sánh số nguyên với ràng buộc biên âm/dương
  Mức độ (level): EASY
  Ràng buộc (constraints): -100 <= A, B <= 100
  Tags: condition, so sanh
  
  Yêu cầu bắt buộc:
  1. Bài tập nhận input qua stdin (hàm input() của Python) và in kết quả ra stdout (print()), không dùng tham số hàm hay return value làm giao diện chấm bài.
  2. Đưa ra đúng 1 lời giải Python 3 chuẩn (solutionCode) chạy được ngay, không phụ thuộc thư viện ngoài chuẩn.
  3. Đưa ra ít nhất 4 test case: ít nhất 2 test case ví dụ minh họa (isHidden=false) và ít nhất 2 test case ẩn dùng để chấm điểm thật (isHidden=true), bao gồm cả trường hợp biên phù hợp với ràng buộc đã cho.
  4. Với MỖI test case, expectedOutput phải là kết quả CHÍNH XÁC khi chạy solutionCode với input đó — không được đoán hay tính nhẩm sai.
  5. Trả lời DUY NHẤT một object JSON đúng theo schema đã cung cấp, không thêm markdown code fence, không thêm giải thích ngoài JSON.
  
  Schema JSON bắt buộc:
  {
    "title": string,
    "description": string (đề bài đầy đủ bằng tiếng Việt, ghi rõ định dạng input/output),
    "starterCode": string (code khung ban đầu cho học viên, có đọc input sẵn),
    "solutionCode": string (lời giải đầy đủ),
    "testCases": [ { "input": string, "expectedOutput": string, "isHidden": boolean } ]
  }
  ```
- Cú pháp solution: hợp lệ
- Test case:
  - [PASS] (visible) input=`5 3` expected=`A lon hon B` actual=`A lon hon B`
  - [PASS] (visible) input=`-10 10` expected=`A nho hon B` actual=`A nho hon B`
  - [PASS] (hidden) input=`-100 -100` expected=`A bang B` actual=`A bang B`
  - [PASS] (hidden) input=`45 100` expected=`A nho hon B` actual=`A nho hon B`
- Không phát hiện nghi vấn trùng lặp với catalog hiện có.
