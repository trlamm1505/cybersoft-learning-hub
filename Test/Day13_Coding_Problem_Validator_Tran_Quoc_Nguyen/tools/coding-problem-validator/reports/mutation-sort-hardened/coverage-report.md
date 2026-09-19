# Coverage report - sap-xep-tang-dan (suite: hardened)

Reference: **AC** (10/10 test, hidden 8/8, max 72ms / limit 2000ms)

**Mutation score = 11/11 = 100%** (ngưỡng 80%) -> **PASS**

Killed 11 (sample 8, hidden 2, timeout 1) - Survived 0 - Equivalent 1 (loại khỏi mẫu số) - Invalid 0

| Mutant | Loại | Sample | Hidden | Hidden test fail | Kết quả | Bị bắt bởi |
|---|---|---|---|---|---|---|
| SRT-01 | Wrong condition | FAIL | 2/8 | #02 #03 #05 #06 #07 #08 | KILLED | SAMPLE |
| SRT-02 | Missing logic | FAIL | 3/8 | #02 #03 #05 #07 #08 | KILLED | SAMPLE |
| SRT-03 | Duplicate handling error | PASS | 4/8 | #02 #03 #04 #08 | KILLED | HIDDEN |
| SRT-04 | Off-by-one | FAIL | 0/8 | #01 #02 #03 #04 #05 #06 #07 #08 | KILLED | SAMPLE |
| SRT-05 | Wrong comparison | FAIL | 6/8 | #06 #08 | KILLED | SAMPLE |
| SRT-06 | Wrong comparison | FAIL | 5/8 | #02 #06 #07 | KILLED | SAMPLE |
| SRT-07 | Hard-code sample | PASS | 2/8 | #02 #03 #05 #06 #07 #08 | KILLED | HIDDEN |
| SRT-08 | Wrong output format | FAIL | 1/8 | #02 #03 #04 #05 #06 #07 #08 | KILLED | SAMPLE |
| SRT-09 | Wrong output format | FAIL | 1/8 | #02 #03 #04 #05 #06 #07 #08 | KILLED | SAMPLE |
| SRT-10 | Slow algorithm | PASS | 7/8 | #08 | KILLED | TIMEOUT |
| SRT-11 | Off-by-one | FAIL | 3/8 | #02 #03 #05 #07 #08 | KILLED | SAMPLE |
| SRT-12 | Wrong output format | PASS | 8/8 | - | EQUIVALENT | - |

> Report này chỉ ghi số thứ tự hidden test (vd "Hidden test #03") - không ghi input/expected của hidden test.