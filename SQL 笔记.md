> DBMS: MySQL

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
SELECT * FROM table WHERE col REGEXP '^[a-zA-Z0-9-_]';

SELECT CONCAT(RTRIM(col1), ' (', LTRIM(col2), ')') AS filed FROM table;
SELECT col1, col2, col1*col2 AS result FROM table WHERE col1 = 10;
SELECT col1 AS a1, col2 AS a2, a1 * a2 AS result FROM table WHERE col2 > 10 ORDER BY result;
SELECT 1 + 2;
SELECT TRIM('  aaa  ');

SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'table';
```

函数

-   LTRIM('  aaa'), RTRIM('aaa   '), TRIM('   aaa   ')
-   UPPER('aaa'), LOWER('AAA')
-   QUOTE('aaa')
-   LENGTH('aaa')
-   SUBSTRING('abcdef', 2, 3)
-   LEFT('abcdef', 3), RIGHT('abcdef', 3)
-   CONCAT('a', 'b', 'c')
-   SOUNDEX('aaa')
-   NOW, CURDATE, CURTIME, DATE('2023-06-14 08:30:00'), TIME
-   YEAR(NOW()), MONTH, DAY, HOUR, MINUTE, SECOND
-   DATEDIFF('2023-06-14', '2023-01-01'), TIMEDIFF
-   DATE_ADD('2023-06-14', INTERVAL 1 DAY), DATE_SUB, DAYOFYEAR('2023-06-14'), DAYOFWEEK, LAST_DAY('2023-06-14')
-   STR_TO_DATE('14-06-2023', '%d-%m-%Y'), DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s')
-   TIME_TO_SEC(TIMEDIFF(end_time, start_time)), UNIX_TIMESTAMP
-   CONVERT('哈哈' using utf8mb4), CONVERT('123', SIGNED), CONVERT(123, FLOAT), CONVERT(25.6, SIGNED)
-   CEIL, FLOOR, ROUND
-   SIN, TAN, COS, ABS, EXP, SQRT, PI
