# Coverage report - kiem-tra-so-nguyen-to (suite: baseline)

Reference: **AC** (4/4 test, hidden 2/2, max 29ms / limit 2000ms)

**Mutation score = 10/15 = 66.7%** (ngưỡng 80%) -> **FAIL**

Killed 10 (sample 6, hidden 4, timeout 0) - Survived 5 - Equivalent 1 (loại khỏi mẫu số) - Invalid 0

| Mutant | Loại | Sample | Hidden | Hidden test fail | Kết quả | Bị bắt bởi |
|---|---|---|---|---|---|---|
| MUT-01 | Boundary error | PASS | 1/2 | #01 | KILLED | HIDDEN |
| MUT-02 | Off-by-one | PASS | 2/2 | - | SURVIVED | - |
| MUT-03 | Missing edge case | PASS | 1/2 | #01 | KILLED | HIDDEN |
| MUT-04 | Wrong condition | FAIL | 1/2 | #02 | KILLED | SAMPLE |
| MUT-05 | Wrong operator | FAIL | 2/2 | - | KILLED | SAMPLE |
| MUT-06 | Hard-code sample | PASS | 1/2 | #02 | KILLED | HIDDEN |
| MUT-07 | Input parsing | PASS | 1/2 | #02 | KILLED | HIDDEN |
| MUT-08 | Wrong rounding | PASS | 2/2 | - | SURVIVED | - |
| MUT-09 | Wrong output format | FAIL | 0/2 | #01 #02 | KILLED | SAMPLE |
| MUT-10 | Slow algorithm | PASS | 2/2 | - | SURVIVED | - |
| MUT-11 | Wrong output format | FAIL | 0/2 | #01 #02 | KILLED | SAMPLE |
| MUT-12 | Wrong output format | FAIL | 0/2 | #01 #02 | KILLED | SAMPLE |
| MUT-13 | Wrong output format | PASS | 2/2 | - | EQUIVALENT | - |
| MUT-14 | Off-by-one | FAIL | 2/2 | - | KILLED | SAMPLE |
| MUT-15 | Over-simplified heuristic | PASS | 2/2 | - | SURVIVED | - |
| MUT-16 | Boundary error | PASS | 2/2 | - | SURVIVED | - |

## Mutant SỐNG SÓT = lỗ hổng độ phủ của bộ test

- **MUT-02** (Off-by-one): Không có test nào là bình phương của một số nguyên tố nên cận vòng lặp thiếu 1 đơn vị vẫn AC.
- **MUT-08** (Wrong rounding): Cùng nhóm lỗ hổng với MUT-02: thiếu test là bình phương của số nguyên tố.
- **MUT-10** (Slow algorithm): Không có test n rất lớn nên thuật toán O(n) chậm vẫn AC; đề cũng chưa có constraints để thêm test hiệu năng một cách công bằng.
- **MUT-15** (Over-simplified heuristic): Không có test nào là số lẻ hợp số nên heuristic 'lẻ = nguyên tố' vẫn AC.
- **MUT-16** (Boundary error): Không có test cho số nguyên tố chẵn duy nhất.

> Report này chỉ ghi số thứ tự hidden test (vd "Hidden test #03") - không ghi input/expected của hidden test.