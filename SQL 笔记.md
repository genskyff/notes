```sql
-- comment
SELECT * FROM table LIMIT 5 OFFSET 10;
SELECT col1, col2 FROM table LIMIT 10, 5;
SELECT DISTINCT col FROM table;

SELECT * FROM table ORDER BY col3, col4; -- ORDER BY 必须放最后
SELECT * FROM table ORDER BY 3, 4;
SELECT * FROM table ORDER BY 3 DESC, 4;

SELECT * FROM table WHERE col < 10;
SELECT * FROM table WHERE col BETWEEN 2 AND 10;
SELECT * FROM table WHERE col IS NULL;

SELECT * FROM table WHERE (col1 = 'abc' OR col2 != 'abc') AND col3 > 10;
SELECT * FROM table WHERE col IN (1, 2, 3); -- IN 比 OR 更快
SELECT * FROM table WHERE NOT col1 = 11 OR col2 = 'aa';
SELECT * FROM table WHERE NOT col IN (1, 2, 3);

SELECT * FROM table WHERE col LIKE '%aaa%';
SELECT * FROM table WHERE col LIKE '_aaa_';

SELECT CONCAT(RTRIM(col1), ' (', LTRIM(col2), ')') AS filed FROM table;
SELECT col1, col2, col1*col2 AS result FROM table WHERE col1 = 10;
SELECT col1 AS a1, col2 AS a2, a1 * a2 AS result FROM table WHERE col2 > 10 ORDER BY result;
```

