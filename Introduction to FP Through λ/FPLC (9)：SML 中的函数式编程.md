# 9 SML 中的函数式编程

> SML 实现：
>
> - [Standard ML of New Jersey](https://www.smlnj.org/)

## 9.1 类型

类型是 SML（Standard ML）的核心要素。其主要特点是每个对象和构造都必须有类型，且这些类型可以通过静态推导得出。

基本类型表示：

```
<value> : <type>
```

函数值表示：

```
fn : <type>
```

### 基本类型

布尔类型：

- 类型标识：`bool`
- 可能的值：`true` 和 `false`

整数类型：

- 类型标识：`int`
- 包含正负整数值
- 负号使用 `~` 表示

字符串类型：

- 类型标识：`string`
- 使用 `"` 包围的字符序列

字符类型：

- 类型标识：`char`
- 使用 `#` 开头的字符串表示

```sml
- true;
val it = true : bool
- 123;
val it = 123 : int
- ~20;
val it = ~20 : int
- "foo";
val it = "foo" : string
- #"a";
val it = #"a" : char
```

## 9.2 列表

列表的核心特征在于其同构性和有限性。所有元素必须是相同类型，并以空列表结尾。这与 Lisp 和 λ 演算的列表定义有所不同。

列表类型表示：

```
<type> list
```

空列表表示：

```
[] 或 nil
```

列表示例：

```sml
(* 整数列表 *)
- [1,2,3];
val it = [1,2,3] : int list

(* 字符串列表 *)
- ["a","b","c"];
val it = ["a","b","c"] : string list

(* 嵌套列表 *)
- [[1,2],[3,4]];
val it = [[1,2],[3,4]] : int list list

(* 空列表 *)
- nil;
val it = [] : 'a list
```

## 9.3 元组

元组是固定长度的异构数据结构，可容纳不同类型的元素。

元组类型表示：

```
<type1> * <type2> * ...
```

元组示例：

```sml
- (1,"a",2);
val it = (1,"a",2) : int * string * int

(* 嵌套元组 *)
- ((1,"a"),2,"b");
val it = ((1,"a"),2,"b") : (int * string) * int * string
```

元组列表（Tuple Lists）将元组作为列表元素，以组合成复合数据结构：

```
- [("a",1),("b",2),("c",3)];
val it = [("a",1),("b",2),("c",3)] : (string * int) list
```

求值顺序：元组中的表达式从左到右求值。

## 9.4 函数类型与表达式

函数类型由其域类型（Domain type）和值域类型（Range type）决定：

```
fn : <domain type> -> <range type>
```

SML 的函数表达式遵循前缀表示法，按照应用序求值：

```
<func expression> <arg expression>
```

部分二元函数可以用作中缀运算符，通过 `op` 前缀可将中缀运算符转换为前缀函数：

```sml
- op +;
val it = fn : int * int -> int
- (op +) (1,2);
val it = 3 : int
```

## 9.5 标准函数

### 9.5.1 布尔标准函数

布尔函数由基本的否定函数 `not` 和两个中缀运算符构成：

```sml
- not;
val it = fn : bool -> bool

- not true;
val it = false : bool

- true andalso false;
val it = false : bool

- true orelse false;
val it = true : bool
```

### 9.5.2 数值函数和运算符重载

**运算符重载**（Operator overloading）是 SML 中的重要概念，允许同一运算符用于不同数值类型。

```sml
- op +;
val it = fn : int * int -> int

- op /;
val it = fn : real * real -> real
```

### 9.5.3 字符串标准函数

```sml
(* 字符串连接 *)
- op ^;
val it = fn : string * string -> string
- "foo" ^ "bar";
val it = "foobar" : string

(* 字符串长度 *)
- size;
val it = fn : string -> int
- size "foo";
val it = 3 : int
```

### 9.5.4 列表标准函数与多态

列表操作中引入了**多态**（Polymorphic），使用 `'a`、`'b` 的形式表示任意类型。

```sml
(* 获取头部 *)
- hd;
val it = fn : 'a list -> 'a
- hd [1,2,3];
val it = 1 : int

(* 获取尾部 *)
- tl;
val it = fn : 'a list -> 'a list
- tl [1,2,3];
val it = [2,3] : int list

(* 列表构造 *)
- op ::;
val it = fn : 'a * 'a list -> 'a list
- 1::2::3::nil;
val it = [1,2,3] : int list
```

### 9.5.5 字符串与列表的转换系统

SML 使用单字母字符串表示字符，提供了完整的字符串转换机制：

```sml
(* 字符转换为数字 *)
- ord;
val it = fn : char -> int
- ord #"a";
val it = 97 : int

(* 数字转换为字符 *)
- chr;
val it = fn : int -> char
- chr 65;
val it = #"A" : char

(* 字符串分解为字符列表 *)
- explode;
val it = fn : string -> char list
- explode "foo";
val it = [#"f",#"o",#"o"] : char list

(* 字符列表组合成字符串 *)
- implode;
val it = fn : char list -> string
- implode [#"f",#"o",#"o"];
val it = "foo" : string
```

## 9.6 比较运算符

SML 的比较运算符分为两类：

等值比较： `=` 和 `<>` （可用于布尔值、整数、字符串、列表和元组）

顺序比较： `<`、`<=`、`>=`、`>`（用于数字和字符串，字符串比较基于字典序）

这些运算符都是重载的，但要求操作数类型相同。

```sml
- op =;
val it = fn : ''a * ''a -> bool
- 1 = 2;
val it = false : bool

- op <;
val it = fn : int * int -> bool
- "ab" < "ac";
val it = true : bool
```

## 9.7 函数

基本语法结构：

```
fn <bound variables> => <expr>
```

其中绑定变量必须符合标识符规则：`^[a-zA-z][a-zA-Z0-9_]*`。

函数类型推导：

```sml
(* + 是重载的，但 1 是 int，因此 x 被推导为 int *)
- fn x => x + 1;
val it = fn : int -> int
```

复合函数：

```sml
- fn x => fn y => x orelse y;
val it = fn : bool -> bool -> bool

- fn (x,y) => x orelse y;
val it = fn : bool * bool -> bool
```

这两种形式等价：

- 柯里化形式（Curried form）： `fn x => fn y => ...`
- 元组形式（Tuple form）： `fn (x,y) => ...`

## 9.8 显式声明绑定变量的类型

约束变量的类型声明对于避免类型推导的模糊性至关重要。

基本形式：

```
(<bound variable1> : <type1>, <bound variable2> : <type2>, ...)
```

示例：

```sml
fn (x:int) => x + 1;
fn (x:int, y:int) => x + y;
```

## 9.9 定义

全局定义采用 `val <name> = <expr>` 的语法结构，定义完成后的名称可以在后续表达式或定义中被引用。

示例：

```sml
- val sq = fn (x:int) => x * x;
val sq = fn : int -> int
- sq 3;
val it = 9 : int

- val sum_sq = fn (x:int) => (sq x) + (sq x);
val sum_sq = fn : int -> int
- sum_sq 3;
val it = 18 : int
```

## 9.10 条件表达式

条件表达式遵循如下语法结构：

```
if <expr1>
then <expr2>
else <expr3>
```

其中 `<expr1>` 必须返回布尔值，两个分支的表达式必须具有相同的类型。SML 中的条件表达式按照正则序求值。

示例：

```sml
- val max = fn (x:int, y:int) =>
= if x < y
= then y
= else x;
val max = fn : int * int -> int
- max (1,2);
val it = 2 : int

- val max = fn x:int => fn y:int =>
= if x < y
= then y
= else x;
val max = fn : int -> int -> int
- max 1 2;
val it = 2 : int
```

若使用元组形式，则参数必须以元组形式传递，而柯里化形式则可以单独传递参数：

```sml
- val max_1 = max 1;
val max_1 = fn : int -> int
- max 1 3;
val it = 3 : int
```

## 9.11 递归与函数定义

递归函数通过 `rec` 关键字声明。SML 提供了两种等价的函数定义形式：

```
// 完整形式
val rec <name> = fn <bound variables> => <expr>

// 简化形式
fun <name> <bound variables> = <expr>
```

完整形式的计算列表长度：

```sml
- val rec length = fn (l:int list) =>
= if l=[]
= then 0
= else 1 + (length (tl l));
val length = fn : int list -> int
```

简化形式的斐波那契数列：

```sml
- fun fib (n:int) =
= if n=0 orelse n=1
= then 1
= else fib(n-1) + fib(n-2);
```

## 9.12 元组选择

通过定义具有适当约束变量元组的函数来选择元组元素。SML 提供**通配符变量**（Wild card variable）`_` 用于忽略不需要的元组元素。

```
// 基本元组选择
fun tname (n:(string * string),_,_) = n;  // 第一个元素
fun tage (_,a:int,_) = a;                 // 第二个元素
fun tgender (_,_,g:int) = g;              // 第三个元素

// 嵌套元组选择
fun fname ((f:string,_),_,_) = f;         // 选择嵌套元组的第一个元素
fun sname ((_,s:string),_,_) = s;         // 选择嵌套元组的第二个元素
```

这种选择方式为元组元素的访问提供了简洁而强大的语法支持，特别是在处理复杂的嵌套数据结构时。

## 9.13 模式匹配

**模式匹配**（Pattern matching）是 SML 中定义函数的一种重要机制，允许使用常量、构造器和变量来创建绑定变量模式。

函数定义主要采用子句形式定义（Clausal form definitions）：

```
fun <name> <pattern1> = <expr1> |
    <name> <pattern2> = <expr2> |
    ...
    <name> <patternN> = <exprN>
```

每个模式按顺序匹配，直到找到第一个成功的匹配，匹配成功后返回对应表达式的值。

对于列表，使用列表构造器 `::` 进行模式匹配：

```
fun ihd ((h:int)::(t:int list)) = h;
```

这种模式可以提取列表的头部和尾部，但对空列表会失败。

基于案例的函数定义（Case-style function definitions）：这是 SML 中常用的实践方式，相比在函数体中使用条件表达式更为优雅。

### 常量匹配

```sml
- fun upper #"a" = "A" |
= upper #"b" = "B" |
= upper #"c" = "C" |
= upper _ = "Other";
val upper = fn : char -> string
- upper #"a";
val it = "A" : string
```

### 递归列表匹配

处理列表的基本情况和递归情况：

```sml
- fun length [] = 0 |
= length (_::(t:int list)) = 1 + (length t);
val length = fn : int list -> int
- length [1,2,3];
val it = 3 : int
```

### 柯里化函数匹配

可以同时处理多个参数的模式匹配：

```sml
- fun sfind _ [] = "Not found" |
= sfind 0 ((h:string)::_) = h |
= sfind (i:int) (_::(t:string list)) = sfind (i-1) t;
val sfind = fn : int -> string list -> string
- sfind 1 ["a", "b", "c"];
val it = "b" : string
```

模式匹配的主要优势在于它提供了一种声明式的方法来处理不同的输入情况，特别适合处理复杂的数据结构和递归算法。

## 9.14 局部定义

SML中局部定义使用 `let in` 语法结构，主要有两种形式：

- 值定义：

```
let val <name> = <expr1>
in <expr2>
end
```

- 函数定义：

```
let fun <name> <pattern> = <expr1>
in <expr2>
end
```

局部定义创建的值或函数只在 `in` 和 `end` 之间的表达式中可见。这种机制特别适用于需要在特定计算中重用某个值或函数的场景。

计算组合数示例：

```sml
- fun comb (i:int) (n:int) =
= let fun fac 0 = 1 |
= fac n = n * (fac (n-1))
= in (fac n) div ((fac i) * (fac (n-1)))
= end;
val comb = fn : int -> int -> int
- comb 1 2;
val it = 2 : int
```

- 局部定义了阶乘函数 `fac`
- 函数仅在 `comb` 作用域内可用
- 实现了组合数公式：`n! / (i! * (n-i)!)`
- 整体函数为柯里化形式

这种局部定义方式提高了代码的模块性，避免了全局命名空间的污染，同时保持了代码的清晰度和可维护性。

## 9.15 类型表达式与类型缩写

**类型表达式**（Type expression）是 SML 中指定变量类型的基本方式，由**类型构造器**（Type constructor）构建，包括基本类型如 `int`、`bool`、`string` 和 `list`。

类型表达式可以采取以下形式：单一类型构造器、类型变量（Type variable）、函数类型（Function type）、积类型（Product type）、括号类型表达式，或带前缀类型变量的类型构造器。

SML 提供类型缩写（Abbreviated type）功能，允许为复杂的类型表达式创建简短的别名。通过类型绑定（Type binding）实现，基本语法为：

```
type <abbreviation> = <type expression>
```

这一机制的关键特性在于，新定义的类型构造器在语法层面与其定义表达式完全等价。

```
(* a、b、int 可以互换不会引发类型错误 *)
type a = int
type b = int
```

类型缩写可以用于构建数据结构：

```
type username = string;
type password = string;
type user = username * password;
```

## 9.16 类型变量与多态性

**类型变量**（Type variable）是 SML 中实现类型泛化的核心机制。以 `'` 开头（如 `'a`、`'b`），使函数可以处理不同类型的数据而无需重写代码。这种机制在强类型语言中尤其重要，因为这既保持了类型安全性，又提供了代码复用的灵活性。

列表操作函数的实现：

```sml
- fun hd (h::t) = h;
val hd = fn : 'a list -> 'a

- fun tl (h::t) = t;
val tl = fn : 'a list -> 'a list

- fun length [] = 0 |
= length (h::t) = 1 + (length t);
val length = fn : 'a list -> int
```

### 多态函数的类型特化

将通用**多态函数**（Polymorphic function）特化为指定类型的函数：

```sml
- fun insert comp i (h::t) =
= if comp (i,h)
= then i::h::t
= else h::(insert comp i t);
val insert = fn : ('a * 'a -> bool) -> 'a -> 'a list -> 'a list
```

通过参数化比较操作实现了类型无关的排序，可以被特化为具体类型：

```sml
(* 字符串特化 *)
- val sinsert = insert (fn (s1:string,s2:string) => s1 < s2);
val sinsert = fn : string -> string list -> string list

(* 整数特化 *)
- val iinsert = insert (fn (i1:int,i2:int) => i1 < i2);
val iinsert = fn : int -> int list -> int list
```

### 多态分类

多态系统分为几种主要类型：

- 特设多态（Ad hoc polymorphism）：通过函数或运算符重载实现
- 参数化多态（Parameterized polymorphism）：通过类型抽象实现

  - 显式（Explicit）参数化：类型本身是参数，需要明确指定
  - 隐式（Implicit）参数化：类型变量用于类型表达式，由编译器推导

- 子类型多态（Subtype polymorphism）：通过继承关系实现的类型兼容性

特设多态通过重载实现，同一个操作符可以用于不同类型，如 `+` 就是特设多态，对不同类型有不同的实现。

```
1 + 2      // 整数加法
1.1 + 2.2  // 浮点数加法
```

参数化多态通过类型变量实现，一个函数可以处理任何类型：

```
fun identity x = x    (* 'a -> 'a *)
fun pair x y = (x,y)  (* 'a -> 'b -> ('a * 'b) *)
(* ('a -> 'b) -> 'a list -> 'b list *)
fun map f [] = [] |
    map f (x::xs) = f x :: map f xs
```

显式参数化多态需要显式声明类型参数：

```rust
// Rust 语法示例，SML 不支持这种形式
fn max<T: Ord>(list: &[T]) -> &T;
```

SML 采用隐式参数化多态系统，通过**类型推导**（Type inference）自动确定类型：

```sml
- fun compose f g x = f (g x);
val compose = fn : ('a -> 'b) -> ('c -> 'a) -> 'c -> 'b
```

子类型多态通过继承或接口的形式，当类型 T 是类型 U 的子类型时，则 T 的对象可以在任何需要类型 U 的对象的上下文中使用。

```rust
trait Animal {}
struct Dog;

// Dog 成为了 Animal 的子类型,任何需要 Animal 的地方都可以使用 Dog
impl Animal for Dog {}
```

区别：

- 特设多态需要为每种类型提供具体实现
- 参数化多态通过类型变量实现通用处理，可以是显式指定类型参数或隐式类型推导
- 子类型多态通过类型的兼容性关系实现，子类型可以在任何需要父类型的地方使用

## 9.17 新类型

**数据类型绑定**（Datatype binding）是引入新具体类型的方式，通过两种方式定义：列出基础值和定义结构化值。新类型通过**类型构造器**（Type constructors）来构建和操作值。

```
datatype <constructor> = <constructor1> | <constructor2> | ... | <constructorN>
```

这种形式定义了最简单的枚举类型，如布尔类型：

```
(* 仅示例，SML 不支持这种形式 *)
datatype bool = true | false
```

结构化数据类型通过扩展语法定义：

```
datatype <constructor> = <constructor1> of <type expression1> |
                         <constructor2> of <type expression2> |
                         ...
```

如整数列表的定义：

```
datatype intlist = intnil | intcons of int * intlist
```

这里 `intnil` 表示空列表，`intcons` 是构造函数，将一个整数和一个列表组合成新列表。

参数化数据类型允许类型变量的使用，实现了多态性，如通用列表类型：

```
datatype 'a list = lnil | cons of 'a * ('a list)
```

这里 `'a` 是类型变量，可以是任何类型，使得列表可以存储任意类型的元素。

SML 中现有类型不能直接用作基础类型，必须通过结构化构造器封装。正确示例：

```
datatype number = intnumb of int | realnumb of real
```

模式匹配用于提取和操作数据类型中的值：

```
fun sum intnil = 0 |
    sum (intcons(x:int, y:intlist)) = x + (sum y)
```

## 9.18 树

二叉整数树的基本定义通过数据类型绑定实现：

```
datatype inttree = empty | node of int * inttree * inttree;
```

该定义体现了二叉树的基本特征：要么是空，要么是一个包含值和两个子树的节点。

树的添加通过比较操作将较小的值放入左子树，较大的值放入右子树：

```sml
- fun tadd (v:int) empty = node(v,empty,empty) |
= tadd (v:int) (node(nv:int,l:inttree,r:inttree)) =
= if v < nv
= then node(nv,tadd v l,r)
= else node(nv,l,tadd v r);
val tadd = fn : int -> inttree -> inttree
```

树的遍历通过中序遍历实现有序访问：

```
fun traverse empty = [] |
    traverse (node(v:int,l:inttree,r:inttree)) =
    append (traverse l) (v::traverse r)
```

多态树的实现是对整数树的泛化，通过类型变量实现：

```
datatype 'a tree = empty | node of 'a * ('a tree) * ('a tree);
```

多态树的关键在于其添加函数需要一个比较函数作为参数：

```
fun tadd (less:'a -> ('a -> bool)) (v:'a) ...
```

## 9.19 SML 中的 λ 演算

SML 中可以直接表示部分 λ 演算中的函数：

恒等函数：

```sml
- fn x => x;
val it = fn : 'a -> 'a
```

函数应用函数：

```sml
- fn f => fn x => (f x);
val it = fn : ('a -> 'b) -> 'a -> 'b
```

SML 的类型系统限制了某些 λ 演算结构的直接表示，特别是自应用：

```sml
- fn s => (s s);
stdIn:20.10-20.13 Error: operator is not a function [circularity]
  operator: 'Z
  in expression:
    s s
```

这个限制源于类型不一致性：`s` 作为函数时类型为 `'a -> 'b`，而作为参数时需要类型 `'a`，造成类型冲突。

## 9.20 其它特性

SML 的其它重要功能包括：

1.  抽象类型构造和模块化
2.  异常处理机制
3.  命令式编程特性
    - 赋值操作
    - 输入输出
    - 迭代结构

这些附加特性使 SML 成为一个功能完备的编程语言，而不仅仅是 λ 演算的实现载体。

## 总结

- SML 是一种非常适合函数式编程的通用编程语言
- 前面章节的算法可以在 SML 中实现
- 某些 λ 函数无法在 SML 中表示
