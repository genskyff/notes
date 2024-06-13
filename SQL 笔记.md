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


```

