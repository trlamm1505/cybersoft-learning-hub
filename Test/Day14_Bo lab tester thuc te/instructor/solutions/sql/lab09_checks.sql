-- LỜI GIẢI MENTOR — LAB-09 trên data/day14_snapshot.sqlite
-- Buggy mode: mỗi query trả 1 nhóm/dòng. Clean mode: cả hai query trả 0 dòng.

-- F-D14-009-A: email trùng sau trim + lowercase.
SELECT lower(trim(email)) AS email_key, COUNT(*) AS total
FROM users
GROUP BY lower(trim(email))
HAVING COUNT(*) > 1;

-- F-D14-009-B: attempt tham chiếu user không tồn tại.
SELECT a.id AS attempt_id, a.userId
FROM attempts a
LEFT JOIN users u ON u.id = a.userId
WHERE u.id IS NULL;
