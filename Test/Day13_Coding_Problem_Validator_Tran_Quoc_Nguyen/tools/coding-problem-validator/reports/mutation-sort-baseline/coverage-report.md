# Coverage report - sap-xep-tang-dan (suite: baseline)

Reference: **AC** (4/4 test, hidden 2/2, max 44ms / limit 2000ms)

**Mutation score = 10/11 = 90.9%** (ngưỡng 80%) -> **PASS**

Killed 10 (sample 8, hidden 2, timeout 0) - Survived 1 - Equivalent 1 (loại khỏi mẫu số) - Invalid 0

| Mutant | Loại | Sample | Hidden | Hidden test fail | Kết quả | Bị bắt bởi |
|---|---|---|---|---|---|---|
| SRT-01 | Wrong condition | FAIL | 1/2 | #02 | KILLED | SAMPLE |
| SRT-02 | Missing logic | FAIL | 1/2 | #02 | KILLED | SAMPLE |
| SRT-03 | Duplicate handling error | PASS | 1/2 | #02 | KILLED | HIDDEN |
| SRT-04 | Off-by-one | FAIL | 0/2 | #01 #02 | KILLED | SAMPLE |
| SRT-05 | Wrong comparison | FAIL | 2/2 | - | KILLED | SAMPLE |
| SRT-06 | Wrong comparison | FAIL | 1/2 | #02 | KILLED | SAMPLE |
| SRT-07 | Hard-code sample | PASS | 1/2 | #02 | KILLED | HIDDEN |
| SRT-08 | Wrong output format | FAIL | 1/2 | #02 | KILLED | SAMPLE |
| SRT-09 | Wrong output format | FAIL | 1/2 | #02 | KILLED | SAMPLE |
| SRT-10 | Slow algorithm | PASS | 2/2 | - | SURVIVED | - |
| SRT-11 | Off-by-one | FAIL | 1/2 | #02 | KILLED | SAMPLE |
| SRT-12 | Wrong output format | PASS | 2/2 | - | EQUIVALENT | - |

## Mutant SỐNG SÓT = lỗ hổng độ phủ của bộ test

- **SRT-10** (Slow algorithm): Không có test N rất lớn nên thuật toán O(n^2) vẫn AC; đề chưa có constraints cho N.

> Report này chỉ ghi số thứ tự hidden test (vd "Hidden test #03") - không ghi input/expected của hidden test.