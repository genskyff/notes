# 5 类型

## 5.1 类型与编程

在一个纯粹的 λ 演算系统中：

- 唯一对象是函数
- 函数可解释为布尔值、数字等
- 函数无固有含义

尽管可以将函数解释为布尔值或数字，但这种解释是外部赋予的，函数本身没有内在的类型。这种无类型会导致无意义的应用，如 `iszero` 应返回布尔值，却得到选择函数。

```
iszero true ==
λn.(n select_first) true =>
(λfirst.λsecond.first select_first) =>
λsecond.select_first
```

这类似于在机器码层面，其中内存中的位模式没有固有类型，可以被解释为整数、地址或指令，从而可能导致逻辑错误。

## 5.2 类型作为对象和操作

**类型**（Type）的核心目的是控制对象的**操作组合**，确保具有语义上的意义。

**定义**：一个类型规定了一类**对象**（Object）以及与之关联的**操作**（Operation）。

在编程语言中，这种控制通过变量的抽象机制来实现。根据类型约束的强度，可以将语言分为三类：

-   **强类型**（Strongly typed）：变量和对象都受类型约束（如 SML，Pascal）
-   **弱类型**（Weakly typed）：对象有类型，但变量无类型（如 LISP，Prolog）
-   **无类型**（Typeless）：对象和操作的组合不受限制

类型系统主要通过两种方式定义类型：

- 枚举法：直接列出类型的所有可能值

```
TRUE is a boolean
FALSE is a boolean
```

- 构造法：定义基础值和构造规则

```
0 is a number
SUCC N is a number (if N is a number)
```

操作定义分为三种主要形式：

- 穷举定义：适用于有限值集合的简单操作

```
NOT TRUE = FALSE
NOT FALSE = TRUE
```

- 构造性定义：通过基本情况和递归规则描述

```
ADD X 0 = X
ADD X (SUCC Y) = ADD (SUCC X) Y
```

- 条件式定义：当操作取决于值而非结构时使用

```
DIV X 0 = NUMBER ERROR
DIV X Y = 0 if (GREATER Y X)
DIV X Y = SUCC (DIV (SUB X Y) Y) if NOT (GREATER Y X)
```

这些操作可以在同一类型内进行映射，也可以产生不同类型的结果（如比较操作返回布尔值）。条件式定义特别重要，因为它处理了那些无法仅通过结构模式匹配来确定的情况。

一个常见的需求是谓词，用于测试对象的属性并返回布尔值。如对于数字：

```
EQUAL 0 0 = TRUE
EQUAL (SUCC X) 0 = FALSE
EQUAL 0 (SUCC X) = FALSE
EQUAL (SUCC X) (SUCC Y) = EQUAL X Y
```

## 5.3 表示带类型的对象

对象的基本结构是**类型-值对**（Type-value pair），通过以下机制实现：

```
// 构造器
def make_obj type value = λs.(s type value)

// 选择器
def type obj = obj select_first
def value obj = obj select_second

// 类型检查
def istype t obj = equal (type obj) t
```

类型操作的标准流程：

- 检查参数类型
- 从类型化的参数中提取无类型值
- 对无类型值执行无类型操作
- 从无类型结果构造有类型对象

一个重要的原则是：**在定义类型时必须使用无类型操作（这是不可避免的起点），但一旦定义完成，就应该只使用有类型操作来确保类型安全**。

这个系统使用数字表示有类型值（如 0），用大写表示有类型构造（如 BOOL），小写表示无类型构造（如 bool）。这提供了一个从无类型 λ 演算到类型系统的基础转换机制。

## 5.4 错误

### 基本结构

```
def error_type = 0                    // 使用 0 表示错误类型
def MAKE_ERROR = make_obj error_type  // 构造错误对象的函数
def ERROR = MAKE_ERROR error_type     // 通用错误实例
  = make_obj error_type error_type
  = λs.(s error_type error_type)
```

这里体现了类型-值对的设计：

- 类型是 `error_type`（0）
- 值也是 `error_type`（0）
- 整体仍是一个标准的类型-值对结构

### 错误检测

定义错误检测函数：

```
def iserror = istype error_type
```

当检测错误时：

```
iserror ERROR
= equal (type ERROR) error_type
= equal error_type error_type
= true
```

### 错误处理链

当一个操作期望类型 A 但收到类型 B：

- 若 B 是错误类型：保持错误传播
- 若 B 是其它类型：生成新的类型错误

这种设计的优点：

- 保持了类型系统的一致性（错误也是类型）
- 支持错误的传播和检测
- 可以携带具体错误信息（通过错误值）

## 5.5 布尔值

### 基础定义

```
def bool_type = 1
def MAKE_BOOL = make_obj bool_type
  = λvalue.λs.(s bool_type value)
```

类型化布尔值的构造：`TRUE` 和 `FALSE` 从未类型化版本构造：

```
def TRUE  = MAKE_BOOL true  = λs.(s bool_type true)
def FALSE = MAKE_BOOL false = λs.(s bool_type false)
```

### 布尔类型检测

```
def isbool = istype bool_type
  = λobj.(equal (type obj) bool_type)
def BOOL_ERROR = MAKE_ERROR bool_type
  = λs.(s error_type bool_type)
```

### 类型化函数

NOT 运算：

```
def NOT X =
  if isbool X
  then MAKE_BOOL (not (value X))
  else BOOL_ERROR
```

AND 运算：

```
def AND X Y =
  if and (isbool X) (isbool Y)
  then MAKE_BOOL (and (value X) (value Y))
  else BOOL_ERROR
```

OR 运算：

```
def OR X Y =
  if and (isbool X) (isbool Y)
  then MAKE_BOOL (or (value X) (value Y))
  else BOOL_ERROR
```

现在 `AND TRUE FALSE` 的执行为：

1.  类型检查：验证 `isbool TRUE` 和 `isbool FALSE` 都返回 `true`
2.  值提取：`value TRUE` 得到 `true`，`value FALSE` 得到 `false`
3.  执行未类型化 `and` 操作：`and true false`
4.  结果封装：`MAKE_BOOL false`，最终得到 `FALSE`

这个布尔类型系统实现了类型安全的布尔运算，通过类型检查确保操作数的正确性，并在类型错误时返回错误对象而不是直接执行运算。核心在于将未类型化的布尔值和操作封装在类型化的结构中，同时保持了类型检查的能力。

## 5.6 带类型的条件表达式

基础定义：

```
def COND E1 E2 C =
  if isbool C
  then
    if value C
    then E1
    else E2
  else BOOL_ERROR
```

这个条件表达式系统包含两个关键特性：

- 类型安全：检查条件 `C` 是否为布尔类型来保证类型安全
- 错误处理：对于非布尔类型的条件，返回 `BOOL_ERROR`

语法糖： 引入了更直观的 `IF-THEN-ELSE` 语法来替代 `COND`：

```
IF <condition> THEN <expr1> ELSE <expr2>
// 替代
COND <expr1> <expr2> <condition>
```

类型化测试函数： 为了保持类型系统的一致性，提供了返回类型化布尔值的测试函数。

```
def ISERROR E = MAKE_BOOL (iserror E)
def ISBOOL B = MAKE_BOOL (isbool B)
```

因为 `iserror` 和 `isbool` 返回未类型化的 `true` 或 `false`，而不是类型化的 `TRUE` 或 `FALSE`。

## 5.7 数字和算术

基础定义：

```
def numb_type = 2
def MAKE_NUMB = make_obj numb_type
```

错误处理与类型检查：

```
def NUMB_ERROR = MAKE_ERROR numb_type
def isnumb = istype numb_type
def ISNUMB N = MAKE_BOOL (isnumb N)
```

数值构造系统：

```
def SUCC N -
  if isnumb N
  then MAKE_BUMB (succ (value N))
  else NUMB_ERROR

def 0 = MAKE_NUMB identity
def 1 = SUCC 0
def 2 = SUCC 1
...

def PRED N =
  if isnmub N
  then
    if iszero (value N)
    then NUMB_ERROR
    else MAKE_NUMB ((value N) select second)
  else NUMB_ERROR

def ISZERO N =
  if isnumb N
  then MAKE_BOOL (iszero (value N))
  else NUMB_ERROR
```

错误处理机制：

- NUMB_ERROR 用于处理类型错误
- 特殊情况处理（如零的前驱、除零）

算术运算：

- `both_numbs` 检查操作数类型

```
// 检查双操作数
def both_numbs X Y = and (isnumb X) (isnumb Y)

// 加法
def + X Y =
  if both_numbs X Y
  then MAKE_NUMB (add (value X) (value Y))
  else NUMB_ERROR

// 乘法
def * X Y =
  if both_numbs X Y
  then MAKE_NUMB (mult (value X) (value Y))
  else NUMB_ERROR

// 除法（带零除检查）
def / X Y =
  if both_numbs X Y
  then
    if iszero (value Y)
    then NUMB_ERROR
    else MAKE_NUMB (div1 (value X) (value Y))
  else NUMB_ERROR

// 相等性检查
def EQUAL X Y =
  if both_numbs X Y
  then MAKE_BOOL (equal (value X) (value Y))
  else NUMB_ERROR
```

## 5.8 字符

基础定义：

```
def char_type = four
def MAKE_CHAR = make_obj char_type
def CHAR_ERROR = MAKE_ERROR char_type
```

字符映射：

- 使用 ASCII 编码将字符映射到自然数
- 字符值实际上是未类型化的数字，但被 `char_type` 包装
- 通过这种映射建立了统一的字符排序系统

字符构造：

```
// 数字字符
def '0' = MAKE_CHAR forty_eight
def '1' = MAKE_CHAR (succ (value '0'))
...

// 大写字母
def 'A' = MAKE_CHAR sixty_five
def 'B' = MAKE_CHAR (succ (value 'A'))
...

// 小写字母
def 'a' = MAKE_CHAR ninety_seven
def 'b' = MAKE_CHAR (succ (value 'a'))
...
```

字符比较：通过转换为数值进行比较。

```
def CHAR_LESS C1 C2 =
  if and (ischar C1) (ischar C2)
  then MAKE_BOOL (less (value C1) (value C2))
  else CHAR_ERROR
```

类型转换：

```
// 字符到数字
def ORD C =
  if ischar C
  then MAKE_NUMB (value C)
  else CHAR_ERROR

// 数字到字符
def CHAR N =
  if isnumb N
  then MAKE_CHAR (value N)
  else NUMB_ERROR
```

特点：

- 通过 ASCII 映射实现了统一的排序系统
- 支持字符和数字之间的双向转换
- 保持了类型安全性，提供错误处理
- 通过复用数值比较简化了字符比较操作

## 5.9 重复的类型检查

重构类型化布尔运算：

```
// 无需显式类型检查，IF 已包含检查
def NOT X =
  IF X
  THEN FALSE
  ELSE TRUE
```

类型检查的冗余示例：

```
def ADD X Y =
  IF AND (ISNUMB X) (ISNUMB Y)
  THEN ADD1 X Y
  ELSE NUMB_ERROR

rec ADD1 X Y =
  IF ISZERO Y
  THEN X
  ELSE ADD1 (SUCC X) (PRED Y)
```

重复类型检查问题剖析（以 `ADD 1 2` 为例）：

1.  初始检查层：
    - `ISNUMB 1` 和 `ISNUMB 2` 各执行一次类型检查
    - `AND` 再次检查其结果是否为布尔值
    - `IF` 又检查 `AND` 的结果
2.  递归过程中：
    - 每次 `ISZERO` 都检查其参数是否为数字
    - 每个 `IF` 都检查条件是否为布尔值
    - `SUCC` 和 `PRED` 的每次调用都涉及类型检查

主要问题：

1.  类型检查的重复执行
2.  由正则序求值导致的重复参数求值
3.  相同值被重复检查多次

这表明了类型化 λ 演算实现中的效率问题，需要在保持类型安全和运行效率之间找到平衡。

## 5.10 静态和动态类型检查

类型检查的两种基本方式：静态检查和动态检查。

**静态类型检查**： 在程序运行前通过符号检查进行类型一致性验证。主要实现方式：

- 显式类型声明：如 C、Pascal，要求明确声明类型
- 类型推导：如 Rust、Haskell，可以从上下文推导出类型，但某些情况下仍需显式声明

**动态类型检查**： 程序运行时进行类型检查。典型实现有两种：

- 完全无类型函数：如汇编，完全不进行类型检查
- 运行时检查：如 JavaScript，在程序运行时对每个操作进行类型检查

类型系统的扩展： 现代语言中的类型系统通常支持用户自定义类型。如 ML 中的**抽象数据类型**（Abstract data types），允许在类型定义上进行函数抽象，这种设计基于**类型理论**（Type theory）。

在实践中，类型化函数通常从无类型函数（Untyped function）构建。这种方法虽然可能导致过度的类型检查，但为了类型安全性这是必要的代价，特别是在处理大型程序时，类型不匹配的错误难以避免。

## 5.11 中缀运算符

运算符记法的两种形式：

- **前缀记法**（Prefix notation）：函数名在参数前，如 `AND a b`
- **中缀记法**（Infix notation）：函数名在两个参数中间，如 `a AND b`

两种记法等价性：

```
a AND b == AND a b
a + b == + a b
a * b == * a b
```

由于没有引入运算符优先级（Operator precedence）和隐式结合性（Implicit associativity），必须使用明确的括号来消除歧义。

- 示例：`7 + (8 * 9) == + 7 (* 8 9)`
- 避免：`7 + 8 * 9`（有歧义）

扩展性：某些但是语言如 ML 支持自定义中缀运算符，可指定其优先级和结合性。

## 5.12 分支定义和结构

类型的形式化定义为：

- 布尔类型：通过枚举 `TRUE` 和 `FALSE`
- 数值类型：通过 `0` 和后继函数 `SUCC`
- 这代表了函数定义的基本情况和递归情况

多分支函数定义的表示方法：

```
// 条件表达式方式（原始形式）
def <name> <bound variable> =
  IF <bound variable>
  THEN <expr1>
  ELSE <expr2>

// 结构匹配方式（改进形式）
def <name> <names1> = <expr1>
  or <name> <names2> = <expr2>
  or ...
```

**结构匹配**（Structure matching）：

- 匹配过程：参数与结构化序列（绑定变量、常量、构造函数）进行匹配
- 变量绑定：成功匹配后，绑定变量关联到对应的参数子结构
- 匹配顺序：从前到后，且假设情况互斥

布尔函数：

```
// 原始形式
def NOT X =
  IF X
  THEN FALSE
  ELSE TRUE

// 结构匹配形式
def NOT TRUE = FALSE
  or NOT FALSE = TRUE
```

数值函数（递归）：

```
// 原始形式
rec SUM X =
  IF ISZERO X
  THEN 0
  ELSE X + (SUM(PRED X))

// 结构匹配形式
rec SUM 0 = 0
  or SUM (SUCC X) = (SUCC X) + (SUM X)
```

重要特性：

- 递归函数使用 `rec` 替代 `def`
- 每个情况都必须互斥
- 最多只有一个匹配成功
- 类似于 ML 的直接情况定义
- 避免了显式条件表达式的复杂性
- 对结构化数据的处理更自然

## 总结

类型的基本概念与作用：

- 确保函数参数的有意义性
- 可视为操作和对象的类别
- 使用类型-值对表示类型化对象

已开发的基本类型系统：

- 错误类型
- 布尔类型及其运算
- 数字类型及其运算
- 字符类型及其运算

三种重要的定义形式：

- 条件表达式

- 中缀运算表达式

- 分支定义

  - 原始形式

  - 结构匹配形式

类型检查策略：

- 静态类型检查
- 动态类型检查
- 用于避免重复的类型检查

这些形式和规则构成了一个完整的类型系统框架，支持函数式编程中的类型安全和表达式求值。
