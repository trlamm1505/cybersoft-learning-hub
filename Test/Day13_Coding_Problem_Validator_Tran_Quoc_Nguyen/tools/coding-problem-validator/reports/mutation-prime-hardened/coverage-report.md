# Coverage report - kiem-tra-so-nguyen-to (suite: hardened)

Reference: **AC** (10/10 test, hidden 8/8, max 36ms / limit 2000ms)

**Mutation score = 15/15 = 100%** (ngưỡng 80%) -> **PASS**

Killed 15 (sample 6, hidden 8, timeout 1) - Survived 0 - Equivalent 1 (loại khỏi mẫu số) - Invalid 0

| Mutant | Loại | Sample | Hidden | Hidden test fail | Kết quả | Bị bắt bởi |
|---|---|---|---|---|---|---|
| MUT-01 | Boundary error | PASS | 7/8 | #01 | KILLED | HIDDEN |
| MUT-02 | Off-by-one | PASS | 4/8 | #04 #05 #06 #07 | KILLED | HIDDEN |
| MUT-03 | Missing edge case | PASS | 7/8 | #01 | KILLED | HIDDEN |
| MUT-04 | Wrong condition | FAIL | 5/8 | #02 #04 #08 | KILLED | SAMPLE |
| MUT-05 | Wrong operator | FAIL | 4/8 | #04 #05 #06 #07 | KILLED | SAMPLE |
| MUT-06 | Hard-code sample | PASS | 5/8 | #02 #03 #08 | KILLED | HIDDEN |
| MUT-07 | Input parsing | PASS | 6/8 | #02 #08 | KILLED | HIDDEN |
| MUT-08 | Wrong rounding | PASS | 5/8 | #04 #05 #07 | KILLED | HIDDEN |
| MUT-09 | Wrong output format | FAIL | 0/8 | #01 #02 #03 #04 #05 #06 #07 #08 | KILLED | SAMPLE |
| MUT-10 | Slow algorithm | PASS | 7/8 | #08 | KILLED | TIMEOUT |
| MUT-11 | Wrong output format | FAIL | 0/8 | #01 #02 #03 #04 #05 #06 #07 #08 | KILLED | SAMPLE |
| MUT-12 | Wrong output format | FAIL | 0/8 | #01 #02 #03 #04 #05 #06 #07 #08 | KILLED | SAMPLE |
| MUT-13 | Wrong output format | PASS | 8/8 | - | EQUIVALENT | - |
| MUT-14 | Off-by-one | FAIL | 7/8 | #04 | KILLED | SAMPLE |
| MUT-15 | Over-simplified heuristic | PASS | 4/8 | #03 #05 #06 #07 | KILLED | HIDDEN |
| MUT-16 | Boundary error | PASS | 7/8 | #03 | KILLED | HIDDEN |

> Report này chỉ ghi số thứ tự hidden test (vd "Hidden test #03") - không ghi input/expected của hidden test.