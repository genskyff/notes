# 6 列表和字符串

## 6.1 列表概述

列表（List）是函数式和逻辑编程中的基础数据结构，可用于实现栈、队列和树结构。

定义：

1.  列表要么为**空**（`NIL`）
2.  要么是一个**构造对**（Constructed pair），包含：
    -   头部（Head）：可以是任何对象
    -   尾部（Tail）：必须是一个列表

列表构造规则： 使用 `CONS` 构造器（Constructor）创建列表。

基本形式：

```
CONS H T
```

其中：`H` 为任意对象，`T` 必须是列表，所有列表都以 `NIL` 结束。

基本操作：

-   `HEAD`：获取列表头部
-   `TAIL`：获取列表尾部
-   对 `NIL` 执行 `HEAD` 或 `TAIL` 操作会产生 `LIST_ERROR`

列表特性：

-   线性列表（Linear list）：当列表及其所有子列表的头部都不是列表时
-   原子（Atom）：列表中非列表且非函数的对象
-   嵌套结构：列表的头部可以是另一个列表，这使得可以构建树形结构

构造示例：

```
CONS 3 NIL                    // 单元素列表
CONS 2 (CONS 3 NIL)           // 双元素列表
CONS 1 (CONS 2 (CONS 3 NIL))  // 三元素列表
```

操作示例：

```
HEAD (CONS 1 (CONS 2 (CONS 3 NIL))) = 1
TAIL (CONS 1 (CONS 2 (CONS 3 NIL))) = CONS 2 (CONS 3 NIL)
```

通过 `HEAD` 和 `TAIL` 的组合，可以访问列表中的任意元素。每次 `TAIL` 操作会移除一个元素，每次 `HEAD` 操作会获取当前列表的第一个元素。最终，连续的 `TAIL` 操作会得到 `NIL`，表示列表结束。

## 6.2 列表的表示

定义：

```
def list_type = three
def islist = istype list_type
def ISLIST L = MAKE_BOOL (islist L)
def LIST_ERROR = MAKE_ERROR list_type
```

列表的内部表示形式基于 λ 演算：

```
λs.(s list_type
  λs.(s <head> <tail>))
```

构造器 `CONS` 的实现：

```
def MAKE_LIST = make_obj list_type
def CONS H T =
  if islist T
  then MAKE_LIST λs.(s H T)
  else LIST_ERROR
```

空列表 `NIL` 的实现：头部和尾部均为 `LIST_ERROR` 的特殊列表。

```
def NIL = MAKE_LIST λs.(s LIST_ERROR LIST_ERROR)
```

`HEAD` 操作：提取列表的第一个元素

```
def HEAD L =
  if islist L
  then (value L) select_first
  else LIST_ERROR
```

`TAIL` 操作：获取除第一个元素外的剩余列表

```
def TAIL L =
  if islist L
  then (value L) select_second
  else LIST_ERROR
```

推导示例：

```
CONS 2 (CONS 1 NIL) =>
λs.(s list_type
  λs.(s 2 λs.(s list_type
    λs.(s 1 NIL))))
```

空列表判断： 通过检查头部是否为错误对象来实现。

```
def isnil L =
  if islist L
  then iserror (HEAD L)
  else false

def ISNIL L =
  if islist L
  then MAKE_BOOL (iserror (HEAD L))
  else LIST_ERROR
```

错误处理特性：

-   对空列表执行 `HEAD` 或 `TAIL` 操作将返回 `LIST_ERROR`
-   `CONS` 操作的第二个参数必须是列表，否则返回 `LIST_ERROR`
-   非列表对象的 `HEAD`、`TAIL` 操作返回 `LIST_ERROR`

这种实现方式通过 λ 演算提供了列表的完整功能，包括构造、访问和错误处理，为更高级的列表操作奠定了基础。所有操作都建立在类型检查和错误处理的基础之上，确保了列表操作的安全性。

## 6.3 列表操作

### 6.3.1 列表的线性长度

列表长度（Length）的定义：

-   空列表长度为 0：`LENGTH NIL = 0`
-   非空列表长度为尾部长度加 1：`LENGTH (CONS H T) = SUCC (LENGTH T)`

递归实现：

```
rec LENGTH L =
  IF ISNIL L
  THEN 0
  ELSE SUCC (LENGTH (TAIL L))
```

推导示例：

```
LENGTH (CONS 1 (CONS 2 (CONS 3 NIL))) -> ... ->
SUCC (LENGTH (CONS 2 (CONS 3 NIL))) -> ... ->
SUCC (SUCC (LENGTH (CONS 3 NIL))) -> ... ->
SUCC (SUCC (SUCC (LENGTH NIL))) -> ... ->
SUCC (SUCC (SUCC 0)) ==
3
```

### 6.3.2 连接列表

列表连接（Append）的核心在于将两个列表合并为一个更长的列表。

定义：

-   当第一个列表为空时：`APPEND NIL L = L`
-   当第一个列表非空时：`APPEND (CONS H T) L = CONS H (APPEND T L)`

递归实现：

```
rec APPEND L1 L2 =
  IF ISNIL L1
  THEN L2
  ELSE CONS (HEAD L1) (APPEND (TAIL L1) L2)
```

推导示例：

```
APPEND (CONS 1 (CONS 2 NIL))
  (CONS 3 (CONS 4 NIL)) -> ... ->
CONS 1 (APPEND (CONS 2 NIL)
  (CONS 3 (CONS 4 NIL))) -> ... ->
CONS 1 (CONS 2 (APPEND NIL (CONS 3
  (CONS 4 NIL)))) -> ... ->
CONS 1 (CONS 2 (CONS 3 (CONS 4 NIL)))
```

这个操作的本质是通过递归将第一个列表的所有元素依次构造到新列表的前端，最后将第二个列表接在末尾。在递归实现中，需要显式使用 `HEAD` 和 `TAIL` 操作来访问列表的头部和尾部。

## 6.4 列表记法

用函数形式表示列表会导致存在过多的括号和 `CONS`。

### 中缀运算符 `::` 记法

用二元中缀运算符 `::` 替代 `CONS`：

```
<expression1>::<expression2> == CONS <expression1> <expression2>
```

推导示例：

```
CONS 1 (CONS 2 (CONS 3 NIL)) ==
1::(2::(3::NIL))
```

### 方括号记法

使用方括号 `[]` 表示带隐式 `NIL`的列表：

```
X::NIL == [X]
X::[Y] == [X,Y]
NIL == []
```

转换示例：

```
CONS 1 NIL == 1::NIL == [1]
CONS 1 (CONS 2 NIL) == 1::(2::NIL) == [1,2]
CONS 1 (CONS 2 (CONS 3 NIL)) == 1::(2::(3::NIL)) == [1,2,3]
```

`HEAD` 和 `TAIL` 操作在新记法下保持不变：

```
HEAD (X::Y) = X
TAIL (X::Y) = Y

HEAD [1,2,3] = 1
TAIL [1,2,3] = [2,3]
```

### 简化规则

方括号记法中隐含末尾 `NIL`：

```
[<first>, <second>] == CONS <first> (CONS <second> NIL)
```

可省略 `::` 记法中的中间括号：

```
1::(2::(3::(4::[]))) == 1::2::3::4::[] == [1,2,3,4]
```

该记法的优势在复杂结构（如嵌套列表）中尤为明显：

```
CONS (CONS 5 (CONS 12 NIL))
  (CONS (CONS 10 (CONS 15 NIL)) NIL)) ==
[[5,12],[10,15]]
```

## 6.5 列表与求值

基础列表形式：

-   `<exp1>::<exp2>` 本质上是 `CONS <exp1> <exp2>`
-   `[<exp1>, <exp2>]` 本质上是 `CONS <exp1> (CONS <exp2> NIL)`

求值规则：采用修改版的应用序求值。具体表现为：

1.  只对参数部分进行求值：`<exp1>` → `<value1>`，`<exp2>` → `<value2>`
2.  得到 `CONS <value1> <value2>` 后停止，不再进一步求值
3.  对于 `[<exp1>, <exp2>]` 形式，仅求值至 `[<value1>, <value2>]`，虽然它等价于 `CONS <value1> (CONS <value2> NIL)`，但不会继续求值

这种特殊的求值规则是弱形式的 β 归约，构成了列表处理的基础机制。

## 6.6 列表元素的删除

基本原理： 列表删除操作通过递归搜索完成。当找到目标值时返回剩余部分，未找到时保持当前元素并继续搜索。

删除函数的定义：

-   空列表：`DELETE X [] = []`
-   匹配：`DELETE X (H::T) = T if <equal> X H`
-   未匹配：`DELETE X (H::T) = H::(DELETE X T) if NOT (<equal> X H)`

递归实现：

```
rec DELETE V L =
  IF ISNIL L
  THEN NIL
  ELSE
    IF EQUAL V (HEAD L)
    THEN TAIL L
    ELSE (HEAD L)::(DELETE V (TAIL L))
```

示例：删除操作的执行过程

```
DELETE 3 [1,2,3,4] ->
1::(DELETE 3 [2,3,4]) ->
1::(2::(DELETE 3 [3,4])) ->
1::(2::[4]) ->
[1,2,4]
```

要点：

-   列表为空时返回空列表
-   使用 `HEAD` 和 `TAIL` 进行显式的列表操作
-   删除操作的 `<equal>` 依赖于列表元素类型
-   操作失败（未找到元素）时返回空列表是常见做法

这种删除操作的实现体现了函数式编程中的递归思想和不可变数据处理方式。每次操作都会产生新的列表，而不是修改原有列表。

## 6.7 列表比较

基本原理： 递归比较两个列表的每个对应元素，比较过程中同时考虑列表长度和元素值的相等性。

空列表情况：

```
LIST_EQUAL [] [] = TRUE
LIST_EQUAL [] (H::T) = FALSE
LIST_EQUAL (H::T) [] = FALSE
```

非空列表情况：

```
LIST_EQUAL (H1::T1) (H2::T2) = LIST_EQUAL T1 T2 if <equal> H1 H2
LIST_EQUAL (H1::T1) (H2::T2) = FALSE if NOT (<equal> H1 H2)
```

递归实现：

```
rec LIST_EQUAL L1 L2 =
  IF AND (ISNIL L1) (ISNIL L2)
  THEN TRUE
  ELSE
    IF OR (ISNIL L1) (ISNIL L2)
    THEN FALSE
    ELSE
      IF EQUAL (HEAD L1) (HEAD L2)
      THEN LIST_EQUAL (TAIL L1) (TAIL L2)
      ELSE FALSE
```

示例：

```
LIST_EQUAL [1,2,3] [1,2,4]
```

1. 比较头部：`1 == 1` → `TRUE`
2. 递归比较 `[2,3]` 和 `[2,4]`
3. 比较头部：`2 == 2` → `TRUE`
4. 递归比较 `[3]` 和 `[4]`
5. 比较头部：`3 != 4` → `FALSE`
6. 最终结果：`FALSE`

要点：

1.  首先检查列表是否同时为空
2.  其次检查是否其中一个为空（长度不等）
3.  递归比较对应位置的元素值
4.  任一步骤失败即返回 `FALSE`，全部成功才返回 `TRUE`

列表比较操作体现了函数式编程中的递归思想和模式匹配特性，通过递归逐步分解问题，直到达到基本情况。

## 6.8 字符串

字符串是文本处理的基础数据结构。不同语言实现方式不同：有的作为独立类型，如 Rust；有的基于字符数组，如 C。这里将字符串视作字符列表来处理。

字符串判定：

```
ISSTRING [] = TRUE
ISSTRING (H::T) = (ISCHAR H) AND (ISSTRING T)
```

递归实现：

```
rec ISSTRING S =
  IF ISNIL S
  THEN TRUE
  ELSE AND (ISCHAR (HEAD S)) (ISSTRING (TAIL S))
```

字符串表示：

-   基本表示：使用引号 `"` 包围字符序列，如 `"Here is a string!"`
-   列表等价形式： 字符串 `"<字符> <字符序列>"` 等价于列表 `'<字符>'::"<字符序列>"`

等价推导：

```
"cat" ==
'c'::"at" ==
'c'::'a'::"t" ==
'c'::'a'::'t'::""
```

空字符串表示： 空字符串 `""` 用 `[]` 表示：

```
"cat" ==
'c'::'a'::'t'::[] ==
['c','a','t']
```

这种表示方法建立了字符串和列表之间的直接映射关系，使得可以用列表操作来处理字符串。

## 6.9 字符串比较

字符串比较是列表比较的特化版本，主要包含相等性比较和大小比较两种操作。

相等性比较基本条件：

-   都为空串时相等
-   头部字符相等且尾串相等时整体相等

```
STRING_EQUAL "" "" = TRUE
STRING_EQUAL "" (C::S) = FALSE
STRING_EQUAL (C::S) "" = FALSE
STRING_EQUAL (C1::S1) (C2:S2) = STRING_EQUAL S1 S2 if CHAR_EQUAL C1 C2
STRING_EQUAL (C1:S1) (C2:S2) = FALSE if NOT (CHAR_EQUAL C1 C2)
```

递归实现：

```
rec STRING_EQUAL S1 S2 =
  IF (ISNIL S1) AND (ISNIL S2)
  THEN TRUE
  ELSE
    IF (ISNIL S1) OR (ISNIL S2)
    THEN FALSE
    ELSE
      IF CHAR_EQUAL (HEAD S1) (HEAD S2)
      THEN STRING_EQUAL (TAIL S1) (TAIL S2)
      ELSE FALSE
```

示例：

```
STRING_EQUAL "dog" "dog" ==
STRING_EQUAL ('d'::"og") ('d'::"og") ->
STRING_EQUAL "og" "og" ==
STRING_EQUAL ('o'::"g") ('o'::"g") ->
STRING_EQUAL "g" "g" ==
STRING_EQUAL ('g'::"") ('g'::"") ->
STRING_EQUAL "" "" ->
TRUE
```

大小比较基本条件：

-   空串小于非空串
-   当前头部字符较小时，整个串较小
-   头部字符相等时，比较尾串

```
STRING_LESS "" (C::S) TRUE
STRING_LESS (C::S) "" = FALSE
STRING_LESS (C1:S1) (C2:S2) = TRUE if CHAR_LESS C1 C2
STRING_LESS (C1::S1) (C2:S2) = (CHAR_EQUAL C1 C2) AND
  (STRING_LESS S1 S2)
  if NOT (CHAR_LESS C1 C2)
```

递归实现：

```
rec STRING_LESS S1 S2 =
  IF ISNIL S1
  THEN NOT (ISNIL S2)
  ELSE
    IF ISNIL L2
    THEN FALSE
    ELSE
      IF CHAR_LESS (HEAD S1) (HEAD S2)
      THEN TRUE
      ELSE (CHAR_EQUAL (HEAD S1) (HEAD S2)) AND
        (STRING_LESS1 (TAIL S1) (TAIL S2))
```

两种比较操作都基于递归，将字符串拆分为头部字符和尾部字符串，通过逐步分解来完成比较。相等比较需要所有字符都相等，而大小比较在发现第一个不同字符时即可确定结果。

## 6.10 数字字符串到数字的转换

### 核心概念

数字字符的数值通过从其 ASCII 值中减去字符 `'0'` 的 ASCII 值得到：

```
'1' = ASCII('1') - ASCII('0') = forty_nine - forty_eight = 1
'2' = ASCII('2') - ASCII('0') = fifty - forty_eight = 2
```

转换函数定义：

```
def digit_value d = sub (value d) (value '0')
def DIGIT_VALUE d = MAKE_NUMB (digit_value d)
```

### 递归规则

任意长度数字字符串的值遵循以下规则：

-   单个数字字符串的值等于该数字本身
-   N 位数字字符串的值 = 前 N - 1 位数字的值 × 10 + 第 N 位数字的值
-   空字符串的值为 0

示例：

```
value of "987"
= 10 * value of "98" + value of '7'
= 10 * (10 * value of "9" + value of '8') + value of '7'
= 10 * (10 * 9 + 8) + 7
= 987
```

### 实现

采用从左到右遍历的方式，使用累加器 `v` 存储中间结果：

```
STRING_VAL V "" = V
STRING_VAL V D::T = STRING_VAL 10*V+(DIGIT_VALUE D) T
```

无类型算术实现：

```
rec string_val v L =
  IF ISNIL L
  THEN v
  ELSE string_val (add (mult v ten) (digit_value (HEAD L))) (TAIL L)

def STRING_VAL S = MAKE_NUMB (string_val zero S)
```

核心思想：维护一个累加器 `v`，每读取一个新数字，就将当前累加器的值乘以 10，再加上新读取的数字的值。当字符串读取完毕时，累加器中的值就是最终结果。

## 6.11 列表的结构匹配

**结构匹配**（Structure matching）是一种简化列表处理函数定义的语法形式。主要用于替代传统的**显式列表选择**（Explicit list selection）方法，使代码更加简洁和直观。

传统的列表处理写法：

```
rec <name> <bound variable> =
  IF ISNIL <bound variable>
  THEN <expression1>
  ELSE <expression2 using (HEAD <bound variable>) and (TAIL <bound variable>)>
```

使用结构匹配的新写法：

```
rec <name> [] = <expression1>
  or <name> (<head>::<tail>) = <expression2 using <head> and <tail>>
```

以计算列表长度函数为例：

```
// 传统写法
rec LENGTH L =
  IF ISNIL L
  THEN 0
  ELSE SUCC (LENGTH (TAIL L))

// 结构匹配写法
rec LENGTH [] = 0
  or LENGTH (H::T) = SUCC (LENGTH T)
```

再复杂一点的示例，以 `FLAT` 函数为例：

```
FLAT [[1,2,3],[[4,5],[6,7,[8,9]]]] => [1,2,3,4,5,6,7,8,9]
```

使用结构匹配的完整实现：

```
rec FLAT [] = []
  or FLAT (H::T) =
    IF NOT (ISLIST H)
    THEN H::(FLAT T)
    ELSE APPEND (FLAT H) (FLAT T)
```

结构匹配只能区分结构差异，无法区分结构内的具体值。因此在某些情况下（如 `FLAT`），仍需要在模式匹配内部使用条件表达式来处理不同情况。

## 6.12 有序线性列表、插入与排序

有序列表的定义：

-   空列表是有序的
-   单元素列表是有序的
-   多元素列表中，头部元素必须小于第二个元素，且剩余部分必须有序

插入（Insert）操作定义： 将元素 `X` 插入有序列表时有三种情况：

-   插入空列表：`INSERT X [] = [X]`
-   `X` 小于头部 `H` 时：`INSERT X (H::T) = X::H::T`
-   `X` 不小于头部 `H` 时：`INSERT X (H::T) = H::(INSERT X T)`

示例：

```
INSERT "cherry" ["apple","banana","date"] =>
"apple"::(INSERT "cherry" ["banana","date"]) ->
"apple"::"banana"::(INSERT "cherry" ["date"]) ->
["apple","banana","cherry","date"]
```

排序（Sort）实现： 基于插入操作构建，定义为：

-   空列表：`SORT [] = []`
-   非空列表：`SORT (H::T) = INSERT H (SORT T)`

示例：

```
SORT ["cat","bat","ass"] =>
INSERT "cat" (SORT ["bat","ass"]) ->
INSERT "cat" (INSERT "bat" (SORT ["ass"])) ->
INSERT "cat" (INSERT "bat" ["ass"]) ->
["ass","bat","cat"]
```

注意：列表中所有元素必须为同一类型，且该类型必须定义了**顺序关系**（Order relation）。对于字符串类型，使用 `STRING_LESS` 作为比较函数。

## 6.13 索引线性列表访问

**索引访问**（Indexed access）是通过位置来访问、修改、删除或插入线性列表元素的操作集合，列表索引从 0 开始计数。

查找操作（IFIND） 通过索引查找元素的递归定义：

```
rec IFIND N [] = []
  or IFIND 0 (H::T) = H
  or IFIND (SUCC N) (H::T) = IFIND N T
```

示例：

```
IFIND 3 ["Chris","Jean","Les","Pat","Phil"] =>
IFIND 2 ["Jean","Les","Pat","Phil"] =>
IFIND 1 ["Les","Pat","Phil"] =>
IFIND 0 ["Pat","Phil"] =>
"Pat"
```

删除操作（IDELETE） 删除指定位置元素：

```
rec IDELETE N [] = []
  or IDELETE 0 (H::T) = T
  or IDELETE (SUCC N) (H::T) = H::(IDELETE N T)
```

示例：

```
IDELETE 2 ["Chris","Jean","Les","Pat","Phil"] =>
"Chris"::(IDELETE 1 ["Jean","Les","Pat","Phil"]) ->
"Chris"::"Jean"::(IDELETE 0 ["Les","Pat","Phil"]) ->
["Chris","Jean","Pat","Phil"]
```

插入操作（IBEFORE） 在指定位置前插入新元素：

```
rec IBEFORE N E [] = []
  or IBEFORE 0 E L = E::L
  or IBEFORE (SUCC N) E (H::T) = H::(IBEFORE N E T)
```

示例：

```
IBEFORE 2 "Jo" ["Chris","Jean","Les","Pat","Phil"] =>
"Chris"::(IBEFORE 1 "Jo" ["Jean","Les","Pat","Phil"]) ->
"Chris"::"Jean"::(IBEFORE 0 "Jo" ["Les","Pat","Phil"]) ->
["Chris","Jean","Jo","Les","Pat","Phil"]
```

替换操作（IREPLACE） 替换指定位置的元素，有两种实现方式：

```
// 直接替换
rec IREPLACE N E [] = []
  or IREPLACE 0 E (H::T) = E::T
  or IREPLACE (SUCC N) E (H::T) = H::(IREPLACE N E T)

// 组合操作
IREPLACE N E L = IBEFORE N E (IDELETE N L)
```

示例：

```
IREPLACE 2 "Jo" ["Chris","Jean","Les","Pat","Phil"] =>
"Chris"::(IREPLACE 1 "Jo" ["Jean","Les","Pat","Phil"]) ->
"Chris"::"Jean"::(IREPLACE 0 "Jo" ["Les","Pat","Phil"]) ->
["Chris","Jean","Jo","Pat","Phil"]
```

这些操作都遵循类似的递归模式：基本情况处理空列表，位置为 0 时直接操作头部，其它情况递归处理尾部。这里所有操作都没有处理索引越界的情况。

## 6.14 映射函数

映射函数是一种针对具有相似结构的函数的抽象。其核心思想是定义通用函数来处理常见结构，再通过插入特定函数来执行具体任务。

基本映射函数：`MAPCAR`

-   功能：将函数应用于列表的每个元素
-   定义：

```
rec MAPCAR FUNC [] = []
  or MAPCAR FUNC (H::T) = (FUNC H)::(MAPCAR FUNC T)
```

以 `DOUBLE` 为例：

原始定义：

```
rec DOUBLE [] = []
  or DOUBLE (H::T) = (2*H)::(DOUBLE T)
```

使用 `MAPCAR` 重写：

```
def DOUBLE = MAPCAR λX.(2*X)
```

双参数映射函数：`MAPCARS`

-   功能：同时处理两个列表的对应元素
-   定义：

```
rec MAPCARS FUNC [] [] = []
  or MAPCARS FUNC (H1::T1) (H2::T2) = (FUNC H1 H2)::(MAPCARS FUNC T1 T2)
```

以 `SUM2` 为例：

-   功能：将两个数字列表对应位置的数字相加
-   实现：

```
def SUM2 = MAPCARS λX.λY.(X+Y)
```

这种映射函数的抽象方法最早源于 Lisp，被称为 car 映射，因为函数被映射到列表的 car 上。通过这种抽象，可将具有相似模式的函数统一用映射函数来表达，提高了代码的复用性和简洁性。

这一抽象过程展示了函数式编程中的一个重要思想：通过高阶函数（如 `MAPCAR`）来抽象共同的计算模式，再通过传入不同的函数来实现具体的功能。

## 总结

- 列表要么为空，要么是由头部和尾部构造的序对
- 列表可以通过列表类型和类型化的列表操作来表示
- 用于操作线性列表的基本函数
- 字符串是具有简化记法的字符列表
- 用于构造有序线性列表和进行索引列表访问的函数
- 映射函数用于泛化线性列表操作

### 列表记法

```
<expression1 >::<expression2> ==
  CONS <expression1><expression2>
[<expression1 >, <expression2>] ==
<expression1>::[<expression2>]
[<expression>] == <expression>::NlL
[] == NIL
<expression1>::(<expression2>::<expression3>) ==
<expression1>::<expression2>::<expression3>
```

### 字符串记法

```
"<character><characters>" == <character>::"<characters>"
""=[]
```

### 列表匹配定义

```
rec <name> [] = <expression1>
  or <name> (<head>::<tail>) =
    <expression2 using '<head>' and '<tail>'> ==
rec <name> <bound variable> =
  IF ISNIL <bound variable>
  THEN <expression1>
  ELSE <expression2 using “HEAD <bound variable>' and
    'TAIL <bound variable>'>
```
