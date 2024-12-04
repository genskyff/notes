# 2 λ 演算

## 2.1 抽象

**抽象**（Abstraction）的核心是从具体情况中提取共性，形成通用解决方案。通过引入名称来替代具体值可以实现**泛化**（Generalization），而后通过用具体值替换这些名称来实现**特化**（Specialization），从而将通用方案应用到具体问题中。抽象的层次递进（以购物计算为例）：

第一层：将具体数量抽象为变量 `items`：

```
10 * 9 -> 10 * items
```

第二层：将单价也抽象为变量 `cost`：

```
10 * items -> cost * items
```

第三层：将运算符也抽象为变量 `op`：

```
cost * items -> cost op items
```

这种抽象方式的强大之处在于同一个抽象模式可以用于解决多个相关问题。如 `cost op items` 这一抽象结构，既可以通过指定 `op` 为乘法来计算总价，也可以通过指定 `op` 为除法来计算单价，本质上是在创建可重用的函数模板。当然在抽象过程中需要注意类型匹配的约束，确保在具体使用时名称被恰当类型的值或操作所替换。

这种思维方式体现了函数式编程的基本概念：通过名称替换实现抽象（即函数抽象），通过具体值替换实现特化（即函数应用）。抽象提供了一种强大的问题解决思路：**先将具体问题泛化为通用形式，再通过特化来解决具体实例**。

## 2.2 编程语言中的抽象

编程语言的本质是抽象。最基本的是变量抽象——用名称和值替代具体内存地址。抽象可以层层递进，在 C 中：

-   变量和指针是对内存的抽象：
    -   变量提供命名的内存空间
    -   指针提供间接访问内存的能力
-   函数抽象了一系列操作步骤，通过返回值传递结果
-   预处理宏（#define）提供编译时的代码抽象
-   函数参数提供了额外抽象层
    -   值传递抽象了数据复制
    -   指针参数抽象了内存位置
    -   数组参数退化为指针

不同语言的抽象机制反映其特点，如 C 和 C++ 对比：

-   C 使用基本数据类型（int、指针等），C++ 增加了布尔类型（bool）和引用类型

-   C 用 char 数组处理字符串，C++ 提供了 string 类进行封装
-   C 主要依靠结构体和函数实现抽象，C++ 通过类、继承、多态实现抽象
-   C 仅支持面向过程的抽象，C++ 支持面向对象的抽象
-   C 通过函数指针实现有限的多态，C++ 通过虚函数提供完整的运行时多态支持

## 2.3  λ 演算简介

λ 演算由邱奇在 1930 年代创建，最初用于研究可计算性问题，后来成为计算机科学的重要理论基础。其核心思想是基于纯粹的抽象，这种抽象能力使其可以形式化地描述编程语言的各个方面，尤其适合作为函数式编程的理论基础。

λ 演算的概念会逐步构建：从基本的表达式写法和操作规则开始，逐步构建更复杂的函数，这些基本函数又会成为构建更高级概念的基础。这种渐进式的方式反映了 λ 演算本身的特点：通过简单的基本元素，层层组合，最终能够表达复杂的计算概念。

## 2.4 λ 表达式

λ 演算的基本单元是 **λ 表达式**（Lambda expression），可由标识抽象的名称、引入抽象的函数，或用于特化抽象的函数应用。其定义为：

```
<expression> ::= <name> | <function> | <application>
```

名称的定义为任意非空字符串，如 `foo`、`bar_`、`123!` 等。

函数是对 λ 表达式的抽象，其中 λ 符号位于前面并引入用于抽象的名称，作为函数的**绑定变量**（Bound variable），即形式参数，但函数本身无需名称。`.` 将名称与进行抽象的表达式分开。这个表达式称为函数的**主体**（Body），主体可以是任何 λ 表达式。其定义为：

```
<function> ::= λ<name>.<body>
<body> ::= <expression>
```

函数应用通过为名称提供一个值来特化抽象。将函数表达式应用于参数表达式，这类似函数调用，而参数表达式对应实际参数。区别在于传统语言的函数调用使用函数名，编译器会找到相应的定义，λ 演算则允许函数定义直接出现在函数调用中。其定义为：

```
<application> ::= (<function expression> <argument expression>)
<function expression> ::= <expression>
<argument expression> ::= <expression>
```

以下都是合法的 λ 表达式：

-   函数：`λx.x`、`λx.λy.x`、`λf.λa.(f a)`
-   函数应用：`(λx.x λa.λb.b)`

函数应用的求值有两种方式：

-   **应用序**（Applicative order）：类似传值调用，参数先求值
-   **正则序**（Normal order）：类似传名调用，参数延迟求值

求值过程都是将函数体中的绑定变量替换为参数，区别在于替换的是**参数的值**还是**参数表达式本身**。

这种简洁的形式系统通过名称、抽象（函数）和特化（应用）的组合，为计算提供了强大而统一的形式化基础。

## 2.5 简单 λ 函数

### 2.5.1 恒等函数（Identity function）

```
(λs.s E)
=> s := E    // 替换 s
=> E         // 得到输入本身

(λx.x λs.s)
=> x := λs.s  // 第一个函数的 x 被替换为第二个函数
=> λs.s       // 结果仍然是恒等函数
```

-   形式：`λs.s`
-   行为：返回输入参数本身
-   特点：不做任何改变，类似于加法中的 0，乘法中的 1，即幺元
-   意义：体现了函数式中最简单的变换，即保持不变

等价于一般语言中的：

```typescript
function identity<T>(x: T): T {
  return x;
}
```

### 2.5.2 自应用函数（Self-application function）

```
(λx.x λs.(s s))       // 应用于恒等函数
=> x := λs.(s s)
=> λs.(s s)           // 得到本身

(λx.(x x) λs.(s s))   // 应用于自身
=> x := λs.(s s)
=> (λx.(x x) λs.(s s)) // 得到原始表达式
=> ...
```

-   形式：`λs.(s s)`
-   行为：应用于恒等函数时，得到自身；应用于自身时，会导致无限循环
-   特点：函数可作为参数传递，并将参数应用于自身

-   意义：体现了计算可能永远不会终止，为递归函数和复杂计算提供了理论基础

等价于一般语言中的：

```typescript
type Fn = (f: Fn) => any;

function self_apply(f: Fn) {
  return f(f);
}
```

### 2.5.3 函数应用函数（Function application function）

```
((λfunc.λarg.(func arg) λx.x) λs.(s s))
=> func := λx.x
=> (λarg.(λx.x arg) λs.(s s))
=> arg := λs.(s s)
=> (λx.x λs.(s s))
=> x := λs.(s s)
=> λs.(s s)
```

-   形式：`λfunc.λarg.(func arg)`
-   行为：接受两个参数，并将第一个参数（作为函数）应用到第二个参数上
-   特点：函数可以作为参数传递和返回，并可动态组合使用
-   意义：体现了函数组合的灵活性，并展示了高阶函数的基本工作方式

等价于一般语言中的：

```typescript
type Fn<T, R> = (x: T) => R;

function apply<T, R>(f: Fn<T, R>): Fn<T, R> {
  return (x) => f(x);
}
```

## 2.6 引入新语法

**语法糖**（Syntactic sugar）允许在不改变语言本质的前提下，提供更友好的语法形式。具名函数、中缀表达式和条件表达式等特性使复杂的 λ 表达式变得更容易编写和理解。

语法扩展遵循两个关键原则：

1.   替换的确定性：

     -   所有高级语法都能转换回基础 λ 表达式

     -   替换过程是有限且确定的

     -   不需要对基础 λ 演算做任何修改

2.   时序无关性：

     -   所有语法替换必须是静态的

     -   不同的替换顺序不会导致不同的结果

     -   确保语言的一致性和可预测性

在实践应用中，理论上所有高级语法都可以被完全展开为基础 λ 表达式，但为保持代码可读性，通常不会进行完全展开。这种平衡既保持了语言理论基础的纯粹性，又提供了便利的编程接口。

## 2.7 具名函数和 β 归约的表示法

**具名函数**（Naming function）机制通过 `def` 语法提供了一种简化函数表达式的方法，将复杂的函数定义与简单的名称关联起来。基本语法形式为 `def <name> = <function>`，使得函数可以通过名称重复使用。

```
def identity = λx.x
def self_apply = λs.(s s)
def apply = λfunc.λarg.(func arg)
```

具名函数遵循两个核心规则：

1.  替换时机
    -   理论上所有名称都应在求值前被替换
    -   实践中仅在作为应用表达式的函数部分时才替换
    -   使用 `(<name> <argument>) == (<function> <argument>)` 表示替换过程
2.  β 归约规则
    -   用参数替换函数体中绑定变量的过程称为 **β 归约**（Beta reduction）
    -   使用 `(<function> <argument>) => <expression>` 表示归约结果
    -   归约序列可用 `...` 省略中间步骤

这种命名机制在保持语言形式严谨性的同时，通过提供简洁的命名方式来提高代码的可读性和可重用性。函数定义只需编写一次，之后可通过名称多次引用，简化了复杂表达式的编写过程。

## 2.8 由函数构造函数

函数等价性构造展示了如何通过已有函数构建新的等价函数。

恒等函数的等价构造：

```
def identity = λx.x
def identity2 = λx.((apply identity) x)
```

证明等价性：

```
(identity2 <argument>)
=> (λx.((apply identity) x) <argument>)
=> (λx.(identity x) <argument>)
=> ...
=> <argument>
```

-   通过 `apply` 函数包装原始恒等函数
-   对任意参数，两个函数都返回相同结果

自应用函数的变体构造：

```
def self_apply = λs.(s s)
def self_apply2 = λs.((apply s) s)
```

证明等价性：

```
(self_apply2 <argument>)
=> ((apply <argument>) <argument>)
=> (<argument> <argument>)
```

-   通过 `apply` 函数重新构造自应用函数
-   对任意参数，两个函数产生相同的自应用效果

函数应用函数的自身构造：

```
def apply = λfunc.λarg.(func arg)
```

证明等价性：

```
(apply <function>)
=> λarg.(<function> arg)
=> (<function> <argument>)
```

-   对任意函数和参数，可生成与自身效果相同的新函数
-   添加一层 β 归约但保持相同的应用效果

这些构造展示了函数式编程中函数等价性的核心概念：不同的函数定义可以产生相同的计算效果，通过归约步骤可以严格证明这种等价性。

## 2.9 参数选择和参数配对

### 2.9.1 选择两个参数中的第一个

```
def select_first = λfirst.λsecond.first

((select_first <argument1>) <argument2>)
=> (λsecond.<argument1> <argument2>)
=> <argument1>
```

-   形式：`λfirst.λsecond.first`

-   行为：返回第一个参数，忽略第二个参数
-   特点：函数体中不包含 `second`，因此第二个参数永远不会被使用

等价于一般语言中的：

```typescript
function select_first<F, S>(first: F): (second: S) => F {
  return (second: S) => first;
}
```

### 2.9.2 选择两个参数中的第二个

```
def select_second = λfirst.λsecond.second

((select_second <argument1>) <argument2>)
=> (λsecond.second <argument2>)
=> <argument2>
```

-   形式：`λfirst.λsecond.second`

-   行为：忽略第一个参数，返回第二个参数（实际上是恒等函数的另一种形式）

-   特点：当应用于任何参数时都会返回一个恒等函数的等价版本

等价于一般语言中的：

```typescript
function select_second<F, S>(first: F): (second: S) => S {
  return (second: S) => second;
}
```

### 2.9.3 从两个参数创建配对

```
def make_pair = λfirst.λsecond.λfunc.((func first) second)

((make_pair <argument1>) <argument2>)
=> (λsecond.λfunc.((func <argument1>) second) <argument2>)
=> λfunc.((func <argument1>) <argument2>)

// 应用于 select_first 时
=> <argument1>

// 应用于 select_second 时
=> <argument2>
```

-   形式：`λfirst.λsecond.λfunc.((func first) second)`

-   行为：返回可以根据选择函数（func）返回不同参数的配对函数

-   特点：将两个参数打包成一个函数，该函数可通过接收 `select_first` 或 `select_second` 来分别获取第一或第二个参数，实现了一种数据结构组合机制。

等价于一般语言中的：

```typescript
type SelectFn<F, S> =
  | ((first: F) => (second: S) => F)
  | ((first: F) => (second: S) => S);

function make_pair<F, S>(
  first: F
): (second: S) => (func: SelectFn<F, S>) => F | S {
  return (second: S) => {
    return (func) => func(first)(second);
  };
}
```

## 2.10 自由变量和绑定变量

绑定变量**作用域**（Scope）：

-   形式：`λ<name>.<body>`
-   规则：绑定变量的作用域仅限于 `<body>`
-   特点：相同名称的变量可能在不同作用域中表示不同的绑定

自由变量和绑定变量：

-   自由变量：不在任何相关函数的绑定作用域内的变量引用

-   绑定变量：在其函数体作用域内的变量引用

```
λf.(f λx.x)  // f 在外层是绑定的
(f λx.x)     // f 是自由的
```

绑定的正式定义：

-   在名称中：单独出现的变量名都是自由变量
-   在函数中：`λ<name>.<body>` 中变量名是 `<name>` 或在 `<body>` 中绑定

-   在应用中：`(<function> <argument>)` 中任一部分有绑定出现

变量替换规则：

```
(λf.(f λf.f) λs.(s s))
=> (λs.(s s) λf.f)
=> (λf.f λf.f)
=> λf.f
```

作用域重叠处理：

```
// 第一个 f 是自由的（对应外层绑定）
// 第二个 f 是新的绑定变量
(f λf.f)
```

正则序 β 归约规则：

-   形式：`(λ<name>.<body> <argument>)`
-   操作：仅替换 `<body>` 中自由出现的 `<name>`
-   目的：确保只替换实际对应于当前绑定变量的出现

关键点：

-   变量可以在同一表达式的不同位置既是绑定的又是自由的
-   名称重用不会影响变量的实际绑定关系
-   正则序 β 归约时必须谨慎识别并仅替换自由变量的出现
-   作用域规则是确保正确替换的关键机制

## 2.11 名称冲突和 α 变换

对于 `apply`，当 `arg` 既被用作函数绑定变量名，又被用作自由变量名时，正则序 β 归约就会出错：

```
((λfunc.λarg.(func arg) arg) boing)
=> (λarg.(arg arg) boing)
=> (boing boing)    // 错误
```

通过 **α 变换**（Alpha conversion），即重命名绑定变量可以解决该问题。

```
((λfunc.λarg1.(func arg1) arg) boing)
=> (λarg1.(arg arg1) boing)
=> (arg boing)
```

α 变换规则：

-   将函数 `λ<name1>.<body>` 中的绑定变量及其对应的自由出现替换为新名称
-   前提：新名称不能与现有自由变量冲突

## 2.12 通过 η 归约简化

形如这样的表达式：

```
λ<name>.(<expression> <name>)
```

这类似 `apply`，但在应用于任意参数时：

```
(λ<name>.(<expression> <name>) <argument>)
=> (<expression> <argument>)
```

也就是说，原表达式可以直接简化为 `<expression>`，这种简化过程称为 **η 归约**（Eta reduction）。

```
// x 不在 M 中自由出现
λx.(M x) => M
```

本质上讲，若一个函数仅是包装了对另一个表达式的直接调用，那该函数就等价于那个表达式本身。

## 总结

### 主要内容

-   介绍了 λ 演算语法并用于分析简单表达式的结构
-   使用正则序 β 归约来化简表达式（并非所有归约都会终止）
-   引入了定义函数和简化常见归约序列的记法
-   展示了如何从其他函数构建新函数
-   构建了用于创建值对和从中选择值的函数
-   形式化了基于自由变量替换的正则序 β 归约
-   介绍了用于消除表达式中名称冲突的 α 变换
-   介绍了用于简化表达式的 η 归约

### 语法规范

```
<expression> ::= <name> | <function> | <application>
<name> ::= 非空字符序列
<function> ::= λ<name>.<body>
<body> ::= <expression>
<application> ::= (<function expression> <argument expression>)
<function expression> ::= <expression>
<argument expression> ::= <expression>
```

### 自由变量规则

-   `<name>` 在 `<name>` 中是自由的
-   在 `λ<name1>.<body>` 中，若 `<name1>` 不是 `<name>` 且 `<name>` 在 `<body>` 中是自由的，则 `<name>` 是自由的
-   在 `(<function expression> <argument expression>)` 中，若 `<name>` 在函数表达式或参数表达式中是自由的，则 `<name>` 是自由的

### 绑定变量规则

-   在 `λ<name1>.<body>` 中，若 `<name>` 是 `<name1>` 或 `<name>` 在 `<body>` 中是绑定的，则 `<name>` 是绑定的
-   在 `(<function expression> <argument expression>)` 中，若 `<name>` 在函数表达式或参数表达式中是绑定的，则 `<name>` 是绑定的

### 正则序 β 归约规则

对于不含自由变量的 `(<function expression> <argument expression>)`：

1.  对函数表达式进行正则序 β 归约得到函数值
2.  若函数值是 `λ<name>.<body>`，则用参数表达式替换 `<body>` 中所有自由出现的 `<name>`，并对新的 `<body>` 进行正则序 β 归约
3.  若函数值不是函数，则对参数表达式进行正则序 β 归约得到参数值，返回 `(<function value> <argument value>)`

### 记号约定

-   `=>` 表示正则序 β 归约
-   `=> ... =>` 表示多步正则序 β 归约
-   `def <name> = <expression>` 定义替换规则
-   `==` 表示定义名称替换
-   α 变换：在 `λ<name1>.<body>` 中重命名 `<name1>` 为 `<name2>`
-   η 归约：`(λ<name>.(<expression> <name>) <argument>) => (<expression> <argument>)`
