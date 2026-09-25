-- Normalize email before detecting duplicates.
SELECT lower(trim(email)) AS email_key, COUNT(*) AS total
FROM users GROUP BY lower(trim(email)) HAVING COUNT(*) > 1;

-- Find attempts whose user does not exist.
SELECT a.id, a.userId FROM attempts a
LEFT JOIN users u ON u.id = a.userId WHERE u.id IS NULL;
