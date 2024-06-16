> DBMS: MySQL

执行顺序：

1.   FROM / JOIN
2.   WHERE
3.   GROUP BY
4.   HAVING
5.   SELECT
6.   ORDER BY

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

SELECT SUM(DISTINCT col) FROM table WHERE col = 'a';

SELECT col, COUNT(*) AS aaa FROM table WHERE col2 > 10 GROUP BY col HAVING aaa > 5;
SELECT a1, a2 FROM table1 WHERE a1 IN (
    SELECT a1 FROM table2 WHERE a2 IN (
        SELECT a2 FROM table3 WHERE a3 = 10));
SELECT col, (SELECT SUM(col2) FROM table2 WHERE table1.col1=table2.col1) FROM table1;
SELECT col FROM table WHERE EXISTS(SELECT 1 FROM table2 WHERE a = 1);

SELECT col1, col2 FROM table1, table2 WHERE table1.col = table2.col;
SELECT col1, col2 FROM table1 INNER JOIN table2 ON table1.col = table2.col;
SELECT cust_name, orders.order_num,
    SUM(quantity*item_price) AS total
    FROM customers
    INNER JOIN orders
    ON customers.cust_id = orders.cust_id
    INNER JOIN orderitems
    ON orders.order_num = orderitems.order_num
    GROUP BY cust_name, orders.order_num
    ORDER BY cust_name, orders.order_num;
SELECT col, col2 FROM table AS t1, table2 AS t2
    WHERE t1.col = t2.col;
SELECT t1.col, t2.col FROM table AS t1, table AS t2 WHERE t1.col1 = 'a' AND t2.col2 = 'b';
SELECT t1.*, t2.col FROM table AS t1, table2 AS t2;

SELECT c.cust_id, o.order_num FROM customers AS c LEFT OUTER JOIN orders AS o ON c.cust_id = o.cust_id;
SELECT c.cust_id, o.order_num FROM orders AS o RIGHT OUTER JOIN customers as c on c.cust_id = o.cust_id;

SELECT col1 FROM table WHERE a = 'a'
    UNION / UNION ALL / INTERSECT / EXCEPT
    SELECT col1 FROM table WHERE b > 10;

INSERT INTO table VALUES(1, 'aaa', 123, NULL);
INSERT INTO table(id, v1, v2, v3) VALUES(1, 'aaa', 123 , null);
INSERT INTO table(v1, v2) SELECT v1, v2 FROM table2;
CREATE TABLE dup_table AS SELECT * FROM table;

UPDATE table set col = 1;
UPDATE table SET col1 = 'value1', col2 = 'value2' WHERE id = 1;
UPDATE dup_cust, customers SET dup_cust.cust_name = customers.cust_name WHERE dup_cust.cust_id = customers.cust_id;
UPDATE dup_cust JOIN customers ON dup_cust.cust_id = customers.cust_id SET dup_cust.cust_name = customers.cust_name;

DELETE FROM table;
TRUNCATE TABLE table;
DELETE FROM table where id = 1;

CREATE TABLE mytable
(
    id   SERIAL PRIMARY KEY,
    name TEXT   NOT NULL,
    age  INT    NOT NULL DEFAULT 0
);

ALTER TABLE table ADD COLUMN col CHAR(20);
ALTER TABLE table DROP column col;
DROP TABLE table;
DROP VIEW view;

CREATE VIEW aaa AS SELECT col1, col2 FROM table;
CREATE VIEW custwithorders AS SELECT customers.* FROM customers JOIN orders ON customers.cust_id = orders.cust_id;
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
-   AVG, COUNT(*), MAX, MIN, SUM
