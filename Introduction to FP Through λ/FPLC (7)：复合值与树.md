# 7 复合值与树
## 7.1 复合值

**复合值**（Composite values）是由多个相关子值构成的数据结构。这些子值可以是基本类型，也可以是其它复合值（即嵌套）。主要实现形式包括 C 的 struct、ML 的 tuple 等，这里采用列表形式表示。

基本复合值：

```
[名字, 姓氏]
["Anna", "Able"]
```

嵌套复合值：

```
[[名字, 姓氏], 地址, 电话号码]
[["Anna", "Able"], "Accounts", 1212]
```

复合值序列（列表的列表）：

```
[[["Anna","Able"],"Accounts",1212],
 [["Betty","Baker"],"Boiler room",4242]]
```

特点：位置具有固定含义、支持嵌套、结构统一便于处理。

## 7.2 处理复合值序列

复合值序列是用线性列表表示的复杂数据结构，处理主要涉及查找、筛选和修改三种基本操作。

查找操作（NFIND）： 根据某个子值查找对应的其他子值。

```
rec NFIND S [] = []
  or NFIND S (H::T) =
    IF STRING_EQUAL S (HEAD (TAIL H))
    THEN HEAD H
    ELSE NFIND S T

NFIND "bar" [["foo","bar"],["a","b"]] =>
"foo"
```

筛选操作（SCHECK）： 基于条件筛选出符合要求的复合值。

```
rec SCHECK [] = []
  or SCHECK (H::T) =
    IF LESS (HEAD (TAIL H)) (HEAD (TAIL (TAIL H)))
    THEN H::(SCHECK T)
    ELSE SCHECK T

SCHECK [["a",1,2],["b",3,2],["c",1,3]] =>
[["a",1,2],["c",1,3]]
```

修改操作（DCHANGE）： 根据匹配条件修改特定复合值中的某个子值。

```
rec DCHANGE S N [] = []
  or DCHANGE S N (H::T) =
    IF STRING_EQUAL S (HEAD (TAIL (HEAD H)))
    THEN [(HEAD H),(HEAD TAIL H),N]::T
    ELSE H::(DCHANGE S N T)

DCHANGE "b" 99 [[["a"],"x",1],[["b"],"y",2]] =>
[[["a"],"x",1],[["b"],"y",99]]
```

这三种操作都遵循相似的模式：

1.  空列表作为基础情况
2.  对头部元素进行条件判断
3.  根据判断结果决定是直接处理还是递归处理尾部

## 7.3 选择器函数

选择器函数（Selector function）简化从复合值中提取子值的过程，避免嵌套的 `HEAD` 和 `TAIL` 操作。

定义：

```
// 基础选择器
def FIRST X = HEAD X
def SECOND X = HEAD (TAIL X)
def THIRD X = HEAD (TAIL (TAIL X))

// 嵌套选择器
def NESTED_FIRST X = FIRST (FIRST X)
def NESTED_SECOND X = SECOND (FIRST X)
```

删除操作示例：

```
rec DELETE S [] = []
  or DELETE S (H::T) =
    IF STRING_EQUAL S (SECOND H)
    THEN T
    ELSE H::(DELETE S T)

DELETE "bar" [["foo","bar"],["a","b"]] =>
[["a","b"]]
```

插入操作示例：

```
rec INSERT E [] = [E]
  or INSERT E (H::T) =
    IF STRING_LESS (SECOND E) (SECOND H)
    THEN E::H::T
    ELSE H::(INSERT E T)

INSERT ["c","d"] [["a","b"],["e","f"]] => 
[["a","b"],["c","d"],["e","f"]]
```

特点：

-   隐藏底层列表操作
-   提高代码可读性
-   简化递归函数逻辑
-   减少数据访问错误

## 7.4 广义结构匹配

## 核心概念

结构匹配允许函数通过模式匹配来处理数据结构。函数定义包含两种基本形式：

1.  常量基本情况：用于匹配常量参数
2.  结构化递归情况：用于匹配结构化参数

## 列表匹配基础

列表处理中最基本的两种匹配模式：

-   `[]`：匹配空列表
-   `(H::T)`：H匹配头部，T匹配尾部

比如要获取列表第一个元素：

```
Copy

def GET_FIRST (H::T) = H
```

这样 `GET_FIRST [1,2,3]` 会返回 `1`

## 绑定变量列表

绑定变量列表是结构匹配的核心机制，允许将列表结构分解成多个命名组件。一个基本的绑定变量列表形如 `[A,B]`，在内部实际等价于 `A::B::NIL`。

设有一个列表表示学生的数学和英语成绩：`[85,90]`，可以这样提取：

```
def MATH [M,E] = M     // 提取数学成绩
def ENGLISH [M,E] = E  // 提取英语成绩
```

要处理多个学生的成绩列表：`[[85,90], [92,88], [78,95]]` 可以用这样的模式：

```
// 计算班级数学平均分
rec AVG_MATH [] = 0
  or AVG_MATH ([M,E]::T) = 
    (M + (AVG_MATH T)) / (LENGTH ([M,E]::T))
```

设有一个学生信息列表，包含姓名和成绩：`[["Alice",85], ["Bob",90]]`，可以这样提取信息：

```
def GET_NAME [[N,S]] = N    // 获取名字
def GET_SCORE [[N,S]] = S   // 获取分数

// 找出及格的学生名单
rec PASS_LIST [] = []
  or PASS_LIST ([[N,S]]::T) = 
    IF S >= 60 
    THEN N::(PASS_LIST T)
    ELSE PASS_LIST T
```

这些例子展示了结构匹配的基本用法：

1.  简单列表匹配：`[A,B]` 匹配两个元素的列表
2.  递归处理：使用 `(H::T)` 模式遍历列表
3.  嵌套匹配：`[[A,B]]` 匹配嵌套的列表结构

结构匹配最大的优点是使得数据提取变得直观且简洁，不需要通过索引或额外的访问函数就能获取所需的数据元素。

## 7.5 局部定义

**局部定义**（Local definitions）是在表达式内部创建名称-值关联的机制，本质上是函数应用的一种形式。

```
λ<name>.<body> <argument>
```

这种形式要求在计算 `<body>` 之前，将 `<body>` 中所有 `<name>` 的自由出现替换为 `<argument>`。可以认为 `<name>` 和 `<argument>` 在整个 `<body>` 的计算过程中是相关联的。

这可以用另外两种等价写法：

-   自下而上（`let` 形式）

```
let <name> = <argument>
in <body>
```

-   自上而下（`where` 形式）

```
<body>
where <name> = <argument>
```

在实践中，推荐使用 `let` 形式，因为符合**先定义后使用**的原则，这种形式清晰地展示了名称绑定和其作用域。

## 7.6 复合值结果匹配

绑定变量列表用于简化返回复合值的函数构建。这种技术特别适用于需要同时处理多个相关列表的场景，如将一个包含名字对的列表拆分成名字列表和姓氏列表。

```
rec SPLIT [] = []::[]             // 基本情况
  or SPLIT ([F,S]::L) =           // 递归情况
    let (FLIST::SLIST) = SPLIT L         
    in ((F::FLIST)::(S::SLIST))
```

### 函数分析

1.  基本情况：
    -   `[]::[]` 返回两个空列表
    -   这是递归的终止条件
2.  递归情况：
    -   `[F,S]::L` 中，`[F,S]` 是当前名字对，`L` 是剩余列表
    -   `let (FLIST::SLIST) = SPLIT L` 递归处理剩余列表，并通过模式匹配将结果分配给两个变量
    -   `((F::FLIST)::(S::SLIST))` 将当前的名和姓分别添加到对应的结果列表

示例：

```
SPLIT [["A","B"], ["C","D"]]
↓
let (FLIST::SLIST) = SPLIT [["C","D"]]   // 递归第一层
↓
let (FLIST::SLIST) = (                   // 递归第二层
    let (F2::S2) = SPLIT [] = []::[]     // 基本情况
    in (("C"::[])::("D"::[])))
↓
let (FLIST::SLIST) = (["C"]::["D"])
in (("A"::["C"])::("B"::["D"]))
↓
[["A","C"],["B","D"]]
```

### 优化实现：累积变量

通过引入**累积变量**（Accumulation variable）可以简化实现：

```
rec SPLIT [] L = L
  or SPLIT ([F,S]::L) (FLIST::SLIST) = SPLIT L ((F::FLIST)::(S::SLIST))
```

这个优化版本：

-   避免了中间的 `let` 绑定
-   通过累积变量直接构建结果
-   需要传入初始空列表对：`SPLIT input_list ([]::[])`

示例：

```
SPLIT [["Diane","Duck"], ["Eric","Eagle"]] ([]::[]) =>
SPLIT [["Eric","Eagle"]] (["Diane"]::["Duck"]) =>
SPLIT [] (["Eric","Diane"]::["Eagle","Duck"]) =>
(["Eric","Diane"]::["Eagle","Duck"])
```

特点：

-   一次性处理多个相关列表，避免多次遍历
-   使用模式匹配简化复合值的处理
-   可以通过累积变量优化性能
-   结果列表顺序是反向的（可以根据需要调整）

这个技术展示了函数式编程中处理复合数据结构的优雅方式，特别是在需要同时维护多个相关列表时的效率和清晰性。

## 7.7 列表的低效性

线性列表（Linear list）在访问元素时需要从头遍历，这导致了访问效率随列表长度线性增长。

对于长度为 $n$ 的列表：

-   访问第 $i$ 个元素需要跳过 $i - 1$ 个元素
-   平均访问次数：$O(n)$

使用插入排序在最坏情况下（完全逆序）：

-   插入第 $i$ 个元素需要跳过 $i - 1$ 个元素
-   总跳过次数：$O(n^2)$

在处理字符串等复杂数据类型时，效率问题更加严重：

-   每次跳过都需要比较操作
-   字符串比较需要逐字符进行
-   即使是较短的列表，实际比较次数也可能很大

对于特定问题，可以通过改变数据组织方式来提高效率：

-   利用已知的顺序信息
-   将序列组织为有序子序列的有序列表
-   如：字符串可以按首字母分组，形成26个子列表

这种低效性是线性列表这种数据结构的内在问题，在实际应用中需要根据具体场景选择适当的数据结构或优化策略。

## 7.8 树

树（Tree）是一种嵌套数据结构（Nested data structure），由节点层次组成。

每个节点包含：

-   一个数据项
-   指向子树的分支

术语：

-   根（Root）：树的第一个节点
-   叶子（Leaf）：没有分支的节点
-   N 叉树（N-ary）：每个节点有 N 个分支的树

树中的**排序关系**（Ordering relationship）表现为：

-   子树中的节点项与原始节点项具有共同关系
-   所有节点项必须是相同类型
-   有序序列可以通过树结构实现快速访问和更新

### 二叉树形式化定义

二叉树（Binary tree）是一种特殊的树结构，有两个基本规则：

-   **空树**（Empty tree）是一个二叉树
-   一个节点包含项目和两个子树（左分支和右分支）也构成二叉树

### 使用列表实现二叉树

基本实现：

```
def EMPTY = NIL                 // 空树表示
def ISEMPTY = ISNIL             // 空树判断
def NODE ITEM L R = [ITEM,L,R]  // 节点构造
```

节点访问：

```
def ITEM [I,L,R] = I             // 获取节点值
def LEFT [I,L,R] = L             // 获取左子树
def RIGHT [I,L,R] = R            // 获取右子树
```

错误处理：

```
def TREE_ERROR = LIST_ERROR       // 错误定义
def ITEM EMPTY = TREE_ERROR       // 空树访问处理
def LEFT EMPTY = TREE_ERROR
def RIGHT EMPTY = TREE_ERROR
```

特点：

-   使用列表模拟树结构
-   `EMPTY` 与 `NIL` 等价，可用于结构匹配
-   通过 `LIST_ERROR` 实现 `TREE_ERROR`
-   所有基本操作都有对空树的错误处理

这种实现方式展示了如何用列表这种基本数据结构来构建更复杂的树结构，同时保持了函数式编程的特点。

## 7.9 向有序二叉树添加值

**有序二叉树**（Ordered binary tree）的基本性质：左子树的所有节点值小于根节点，右子树的所有节点值大于根节点，每个子树也都是有序二叉树。

添加节点（TADD）的基本规则：

1.  空树情况：`TADD I EMPTY = NODE I EMPTY EMPTY`
2.  非空树且新值小于根节点：添加到左子树
3.  非空树且新值大于根节点：添加到右子树

递归实现：

```
rec TADD I EMPTY = NODE I EMPTY EMPTY
  or TADD I [NI,L,R] =
    IF LESS I NI
    THEN NODE NI (TADD I L) R
    ELSE NODE NITEM L (TADD I R)
```

批量添加（TADDLIST）：

```
rec TADDLIST [] TREE = TREE
  or TADDLIST (H::T) TREE = TADDLIST T (TADD H TREE)
```

关键示例 - 构建过程：

1.  空树添加 7：`[7,EMPTY,EMPTY]`
2.  添加 4（小于 7）：`[7,[4,EMPTY,EMPTY],EMPTY]`
3.  添加 9（大于 7）：`[7,[4,EMPTY,EMPTY],[9,EMPTY,EMPTY]]`

通过这种方式，可以构建出一个平衡的有序二叉树结构，其中每个节点都遵循左小右大的规则，保证了树的查找效率。对于任意数字序列，都可以通过 TADDLIST 函数将其转换为有序二叉树结构。

## 7.10 二叉树遍历

**二叉树遍历**（Binary tree traversal）的本质是按特定顺序访问并提取树中的所有节点值。对于有序二叉树的中序遍历（Inorder traversal），可以得到升序排列的结果。

算法定义：

```
rec TRAVERSE EMPTY = []
  or TRAVERSE [I,L,R] =
    APPEND (TRAVERSE L) (I::(TRAVERSE R))
```

遍历推导过程：

```
[7,
 [4,
  [3,EMPTY,EMPTY],
  [5,EMPTY,EMPTY]
 ],
 [9,EMPTY,EMPTY]
]
```

通过递归遍历，最终得到有序序列 `[3,4,5,7,9]`。整个过程通过 `APPEND` 将左子树的遍历结果、当前节点值和右子树的遍历结果连接起来，保证了最终序列的有序性。

## 7.11 二叉树搜索

**二叉树搜索**（Binary tree search）实现了在有序二叉树中查找特定值的功能。其基本思路遵循二叉搜索树的特性，通过比较目标值与当前节点值的大小来决定搜索方向。

算法定义：

```
rec TFIND V EMPTY = ""
  or TFIND V [NV,L,R]
    IF EQUAL V NV
    THEN TRUE
    ELSE
      IF LESS V NV
      THEN TFIND V L
      ELSE TFIND V R
```

搜索规则：

1.  空树返回 `FALSE`
2.  当前节点值等于目标值，返回 `TRUE`
3.  目标值小于当前节点值，递归搜索左子树
4.  目标值大于当前节点值，递归搜索右子树

 成功搜索示例：

```
TFIND 5 [7,[4,[3,EMPTY,EMPTY],[5,EMPTY,EMPTY]],[9,EMPTY,EMPTY]]
-> TFIND 5 [4,[3,EMPTY,EMPTY],[5,EMPTY,EMPTY]]
-> TFIND 5 [5,EMPTY,EMPTY]
-> TRUE
```

失败搜索示例：

```
TFIND 2 [7,[4,[3,EMPTY,EMPTY],[5,EMPTY,EMPTY]],[9,EMPTY,EMPTY]]
-> TFIND 2 [4,[3,EMPTY,EMPTY],[5,EMPTY,EMPTY]]
-> TFIND 2 [3,EMPTY,EMPTY]
-> TFIND 2 EMPTY
-> FALSE
```

## 7.12 复合值二叉树

**复合值二叉树**（Binary trees of composite values）是二叉树在处理复合数据时的应用。其核心是通过复合值中的某一子值作为排序依据来构建和维护树结构。

添加节点：

```
rec CTADD N EMPTY = [N,EMPTY,EMPTY]
  or CTADD [F,S] [[NF,NS],L,R] =
    IF STRING_LESS S NS
    THEN [[NF,NS],(CTADD [F,S] L),R]
    ELSE [[NF,NS],L,(CTADD [F,S] R)]
```

搜索指定值：

```
rec CTFIND S EMPTY = ""
  or CTFIND S [[NF,NS],L,R] =
    IF STRING_EQUAL S NS
    THEN NF
    ELSE
      IF STRING_LESS S NS
      THEN CTFIND S L
      ELSE CTFIND S R
```

遍历函数（TRAVERSE）无需修改即可用于复合值二叉树，因为其只关注树的结构而不涉及节点值的具体内容。

## 7.13 二叉树效率

**二叉树效率**（Binary tree efficiency）主要关注树的**平衡性**（Balance）对性能的影响。

关键特性：

-   任意节点左右分支的值数量相同
-   对于 $n$ 个值的节点，左右分支各有 $\frac{n - 1}{2}$ 个值
-   层数 $m$ 与数量关系：$2^m \le n \lt 2^{m + 1}$
-   层数计算：$n$ 个值需要 $log_2(n) + 1$ 层

查找效率：

-   平衡树：$O(log(n))$
-   非平衡树：最坏情况退化为线性列表，比较次数等于节点数

需要注意的是，基础的二叉树实现并不保证平衡性，树的形状完全依赖于插入顺序。当输入已排序时，反而会产生最差的性能表现。

## 7.14 柯里化与非柯里化函数

**柯里化**（Curried）和**非柯里化**（Uncurried）函数表示了多参数函数的两种不同表达方式。柯里化函数使用嵌套的单参数 λ 函数构建，而非柯里化函数则使用**绑定变量列表**（Bound variable lists）。本质上来说，柯里化是将一个接受多个参数的函数转换为一系列单参数函数的链。

在 λ 演算中：

```
// 非柯里化形式
λ[x,y].x+y    // 一次接收所有参数

// 柯里化形式
λx.λy.x+y     // 逐个接收参数，返回新函数
```

转换函数：

```
// 非柯里化转柯里化
def curry f x y = f [x,y]

// 柯里化转非柯里化
def uncurry g [a,b] = g a b
```

示例：

```
// 原始的非柯里化函数
def multiply [x,y] = x * y

// 使用 curry 转换
def curried_multiply = curry multiply
=> λf.λx.λy.(f [x,y]) multiply
=> λx.λy.(multiply [x,y])

// 使用 uncurry 转回
def uncurried_multiply = uncurry curried_multiply
=> λg.λ[a,b].(g a b) curried_multiply
=> λ[a,b].(curried_multiply a b)
=> λ[a,b].(multiply [a,b])

// 验证等价性
multiply [2,3]
== uncurried_multiply [2,3]
== (curried_multiply 2 3)
```

柯里化的主要优势：

-   参数复用：可以通过固定部分参数创建新函数
-   延迟求值：可以等待所有参数就绪才执行计算
-   函数组合：便于实现函数组合和管道操作

这两种形式可以相互转换且完全等价，`curry` 和 `uncurry` 之间构成了双射关系。

## 7.15 偏应用

偏应用（Partial application）是将多参数函数通过提供部分参数值来构造新函数的技术，主要用于支持函数作为一等公民（First-class citizens）的语言中。而柯里化是将多参数函数转换为一系列单参数函数的特殊技术。

### 实现特点

偏应用：

```typescript
// 可一次固定任意数量参数
const add3 = (x: number, y: number, z: number) => x + y + z;
const add3With1And2 = (z: number) => add3(1, 2, z);
```

柯里化：

```typescript
// 强制每次只接受一个参数
const sum = (x: number) => (y: number) => x + y;
const add1 = sum(1);
```

### 语言实现对比

函数式实现（支持一等公民函数）：

```
def istype t obj = equal t (type obj)
def isbool = istype bool_type  // 偏应用直观实现
```

C 实现（需要模拟）：

```c
typedef enum { BOOL_TYPE, INT_TYPE, CHAR_TYPE } Type;

bool istype(Type t, void* obj) {
    return get_type(obj) == t;
}

bool isbool(void* obj) {
    return istype(BOOL_TYPE, obj); // 通过包装函数模拟
}
```

核心区别：

-   偏应用允许一次固定任意数量参数，更灵活
-   柯里化强制每次只能处理一个参数，是特殊的偏应用
-   在支持函数作为一等公民的语言中，偏应用实现更自然
-   在传统语言中，需要通过包装函数和**闭包**（Closure）机制来模拟偏应用

## 7.16 结构、值与函数

λ 演算基础

-   所有高级函数式编程表示都可通过简单替换转换回 λ 演算，体现了 λ 演算作为基础的重要性。

统一本质

-   表面上的结构、值和函数本质上都是纯 λ 函数（Pure λ function），仅是解释方式不同，这种统一性是函数式编程的核心特征。

类型检查限制

-   由于基于纯 λ 函数，缺乏严格的语法和类型检查。数据结构的选择器（Selector）和构造器（Constructor）无法限制参数类型。虽有弱类型检查，但任何表达式理论上都可相互应用，这种自由度既是特性也是潜在问题。

## 总结

-   复合值可以用列表表示，选择器函数用于简化复合值的操作
-   列表结构匹配已被泛化
-   引入了局部定义的表示法
-   展示了朴素线性列表算法的效率限制
-   树可以用嵌套列表表示
-   开发了操作有序二叉树的函数
-   展示了平衡二叉树的效率优于线性列表
-   讨论了柯里化函数、非柯里化函数和偏应用

### 广义结构匹配

```
def <name> [<name1>,<name2>,<name3>...] =
  <expression using '<name1>','<name2>','<name3>' ==
def <name> <bound variable> = <expression using 'HEAD <bound variable>',
  'HEAD (TAIL <bound variable>)','HEAD (TAIL (TAIL <bound variable>))'>
```

### 局部定义

```
let <name> = <expression1>
in <expression2> ==
<expression2>
where <name> = <expression1> ==
λ<name>.<expression2> <expression1>
```

### 柯里化与非柯里化函数

```
λ<name1>.λ<name2>...λ<nameN>.<body> ==
λ[<name1>,<name2>...<nameN>].<body>
```

