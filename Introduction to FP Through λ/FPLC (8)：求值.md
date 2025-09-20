# 8 求值

## 8.1 终止与范式

**范式**（Normal form）是指 λ 表达式无法继续进行 β 归约的状态。一个可归约的函数应用表达式称为**可归约式**（Redex）。

β 归约不会在表达式不再是函数应用时就终止，而是应继续对函数体求值直到没有可归约式。这确保了相同的表达式不会因归约顺序不同而得到不同的结果。

如下面两个看似不同的表达式，在完全归约后得到相同的范式。

```
λx.x λa.(a a) => λa.(a a)
λf.λa.(f a) λs.(s s) => λa.(λs.(s s) a) => λa.(a a)
```

**弱头范式**（Weak head normal form）：

- 整体表达式必须是一个 λ 函数
- 该函数的函数体内部可以包含可归约式
- 如：`λx.(((λy.y) z) x)` 是弱头范式，因为最外层是一个函数，尽管函数体 `(((λy.y) z) x)` 中还包含可归约式 `(λy.y) z`。

**头范式**（Head normal form）：

- 是弱头范式的进一步归约
- 函数体不能直接是一个可归约式
- 函数体可以是一个函数应用 ，如 `(M N)`
  - M 必须已经不能归约为函数（否则整体就是可归约式了）
  - N 可以包含可归约式
- 如：`λx.(y x)` 是头范式，因为 y 不能被归约为函数，但若在上下文中 `x` 被替换为某个可归约式，如 `λx.(y ((λz.z) w))`，则 `x` 的位置仍可继续归约。

在实际应用中，通常在达到可识别的函数或函数应用时就停止求值，如保留列表形式 `<value1>::<value2>` 而非继续归约为 `CONS <value1> <value2>`。

## 8.2 正则序

**正则序 β 归约**（Normal order β reduction）的基本原则是始终对最左边的可归约式进行求值。关键特征为函数应用时会先对函数表达式求值，但参数保持未求值状态进行替换。

特点：

- 延迟求值：参数在实际需要时才被求值
- 重复求值：同一表达式可能被多次求值

示例：

```
rec ADD X Y =
   IF ISZERO Y
   THEN X
   ELSE ADD (SUCC X) (PRED Y)
```

求值过程：

```
// 此时 X = 1, Y = (ADD 1 2)，Y 未被求值直接替换
ADD 1 (ADD 1 2) =>

// 第一次求值 ADD 1 2，因为 ISZERO 需要知道结果
IF ISZERO (ADD 1 2)
THEN 1
ELSE ADD (SUCC 1) (PRED (ADD 1 2)) =>

// 第二次求值需要算出 PRED 的参数，所以又要求值 ADD 1 2
ADD (SUCC 1) (PRED (ADD 1 2)) =>

// ...
```

重复求值原因：

- 正则序先替换后求值的策略导致 `ADD 1 2` 这个表达式被完整复制到多个位置
- 每当需要实际使用这个表达式的值时（如在 `ISZERO` 或 `PRED` 中），都必须重新计算
- 之前的计算结果没有被保存，每次都是独立的计算过程

正则序虽然保证了求值的正确性，但可能导致严重的性能问题，因此在实践中常常采用记忆化或惰性求值等优化策略。

## 8.3 应用序

**应用序 β 归约**（Applicative order β reduction）的基本原则是对不含内部可归约式的最左可归约式进行求值。这意味着在处理函数应用时，函数和参数都会先被求值。

与正则序的区别：

- 参数在传递前就被求值，而不是直接替换后再求值
- 每个表达式只会被求值一次

示例：

```
ADD 1 (ADD 1 2)
-> ADD 1 3        // 先把内层的 ADD 1 2 求值为 3
-> IF ISZERO 3    // 然后正常进行运算
   THEN 1
   ELSE ADD (SUCC 1) (PRED 3)
-> ADD 2 2        // 每个中间结果都是具体的数值，不再包含需要重复计算的表达式
-> ADD 3 1
-> ADD 4 0
-> 4
```

这表明应用序在效率上具有优势：所有表达式（如 `ADD 1 2` 和 `PRED (ADD 1 2)`）都只被计算一次。这种策略避免了正则序中的重复计算问题，使得整个计算过程更为高效。

## 8.4 一致的应用序使用

在一致应用序中，`if` 被视为普通函数，其形式为 `cond e1 e2 c = c e1 e2`，这要求在函数调用前必须对所有参数求值。

```
rec add x y =
   if iszero y
   then x
   else add (succ x) (pred y)

succ (add one two)
```

无限展开过程：

1.  `add one two` 会被展开为条件函数：

    ```
    cond one (add (succ one) (pred two)) (iszero two)
    ```

2.  应用序要求在执行 `cond` 前必须对全部参数求值，包括 `else` 分支：

    ```
    add (succ one) (pred two)
    ```

3.  为了求值这个参数，又遇到了新的 `add`调用，并展开为一个新的 `cond`：

    ```
    cond two (add (succ two) (pred one)) (iszero one)
    ```

4.  该过程会无限持续，因为每次展开都会引入一个新的必须立即求值的递归调用

正则序下 `if` 的条件为真时，`else` 分支根本不会被求值，因此避免了无限递归。这是因为正则序允许参数在实际需要时才求值，而不是提前求值所有参数。

这说明在处理递归结构时，严格的应用序可能会带来求值终止性问题。

## 8.5 延迟求值

在应用序求值中，需要一种机制来显式延迟参数求值。这主要是为了避免在不必要的时候进行计算，特别是在条件语句中，希望只计算被选中的分支。这种机制在现代编程中通常通过闭包来实现。

延迟求值的本质： 将计算包装在函数中，只在真正需要结果时才执行这个函数，如 JavaScript 中：

```javascript
// 即时求值：计算立即发生
const regularAdd = (a, b) => a + b;
console.log(regularAdd(1 + 2, 3 * 4));

// 延迟求值：计算被延迟到调用时
const lazyAdd = (getA, getB) => {
  return () => getA() + getB();
};
const computation = lazyAdd(
  () => 1 + 2,
  () => 3 * 4,
);
console.log(computation()); // 这时才计算
```

在函数式编程中的具体实现：对条件语句进行简单重构，将条件抽象成函数。

```
def cond e1 e2 c = c λdummy.e1 λdummy.e2
```

但 `e1` 和 `e2` 在传入前就被求值了，所以这样是不行的。

要正确实现延迟求值，需要改变 `if`：

```
if <condition>
then <e1>
else <e2>
```

改为：

```
if <condition>
then λdummy.<e1>
else λdummy.<e2>
```

并重新定义布尔值：

```
def true x y = x identity
def false x y = y identity
```

这个重定义通过函数封装实现了延迟计算：

- `true` 接收两个函数作为参数，选择第一个函数并应用 `identity`
- `false` 接收两个函数作为参数，选择第二个函数并应用 `identity`

```
if true
then λdummy.<expr1>
else λdummy.<expr2>
```

1.  `true` 选择第一个参数
2.  应用 `identity`
3.  最终只计算 `<expr1>`，而 `<expr2>` 完全不会被求值

这种模式在现代编程中很常见：

- JavaScript 的 Promise
- React 的惰性初始化

在像 Lisp 这样的函数式语言中，通常采用混合方案：

- 默认使用应用序求值
- `cond` 内置延迟求值机制
- 提供专门的操作符（如 `quote` 和 `eval`）来显式控制求值时机

当使用这种机制时，若同一个延迟表达式在多个地方使用，每个位置都需要重新计算。这种多重求值特性是使用延迟机制的代价之一，但通过适当的缓存策略可以优化。

## 8.6 求值终止、停机问题、求值等价性与 Church-Rosser 定理

正则序和应用序的问题：

- 正则序可能导致重复求值
- 两种求值顺序都可能不终止，如：

```
λs.(s s) λs.(s s)
```

**停机问题**（Halting problem）：不可能构造一个算法来判断任意表达式的求值是否会终止。这一结论最初由图灵基于图灵机（Turing machine）证明，并通过丘奇论题（Church's thesis）扩展到了所有计算模型，包括 λ 演算。

**Church-Rosser 定理**阐明了两种求值顺序的关系：

第一定理（求值唯一性）：

- 每个表达式都有唯一的范式
- 若两种不同求值顺序都能终止，则都会得到相同的结果
- 这保证了正则序和应用序在终止时的等价性

第二定理（正则序的完备性）：

- 若表达式存在范式，则正则序求值一定能到达这个范式
- 即：若任何求值顺序能终止，则正则序保证能终止
- 这说明正则序在寻找范式时更可靠

虽然正则序在理论上更有保证，但在实践中常常混合使用两种策略：

- 选择性地使用应用序可以避免重复计算
- 有时会选择不完全求值到范式，以提高效率

这种混合策略虽然可能影响终止性或范式的达成，但在实际应用中更有效率。

## 8.7 无限对象

正则序求值的关键特性是延迟求值，这使得构造和处理无限数据结构成为可能。这种特性在函数式编程中尤为重要，在现代编程语言中演化为**生成器**（Generator）模式。

### λ 演算中的实现

定义：

```
def cons h t s = s h t
def head I = I λx.λy.x
def tail I = I λx.λy.y
```

构造自然数列表：

```
rec numblist n = cons n (numblist (succ n))
def numbers = numblist zero
```

初始展开：

```
numblist zero =>
cons zero (numblist (succ zero)) =>
λs.(s zero (numblist (succ zero)))
```

获取首个元素：

```
head numbers => zero
```

获取后续元素：

```
tail numbers =>
numblist (succ zero) =>
λs.(s (succ zero) (numblist (succ (succ zero))))
```

### JavaScript 生成器

```javascript
function* numbers() {
  let n = 0;
  while (true) {
    yield n++;
  }
}

const nums = numbers();
nums.next().value; // 0
nums.next().value; // 1
nums.next().value; // 2
```

### 实现方式的对比

λ 演算中的正则序：

- 应用序会试图立即求值整个表达式，导致无限递归而不会终止
- 正则序通过延迟求值使得无限结构成为可能，但有两个代价：
  - 重复计算：如 `succ zero`、`succ (succ zero)` 等会被多次求值
  - 重新计算：每次访问列表元素都需要重新计算到该位置

生成器：

- 保留了延迟求值的核心思想
- 通过内部状态记录避免了重复计算
- 提供了更简洁的语法和更高的性能

这展示了同一个概念在不同时期的实现方式：λ 演算中通过正则序实现的理论基础，发展成为了现代编程语言中的生成器特性。尽管实现方式不同，但核心思想是一致的，即通过延迟计算来处理潜在的无限序列。

## 8.8 惰性求值

**惰性求值**（Lazy evaluation）是一种通过推迟计算时机、避免重复计算的求值策略，并结合了正则序和应用序求值的优点。表达式仅在需要其值时才计算，且计算后的结果会被保留以供后续使用。现代编程语言如 JavaScript 中的生成器就是一种惰性求值。

λ 演算中通过**约束对**（Bound pair）的标记和更新系统实现惰性求值。

```
(λs.(s s))_1 (λx.x λy.y)_2)_3
=> ((λx.x λy.y)_2 (λx.x λy.y)_2)_4
=> (λy.y λy.y)_5
=> λy.y
```

表达式 `(λx.x λy.y)_2` 虽然出现两次，但只计算一次，结果被重用。

如无限序列：

```
def SQ X = X * X
rec SQLIST N = (SQ N)::(SQLIST (SUCC N))
def SQUARES = SQLIST 0

rec IFIND N L =
  IF ISZERO N
  THEN HEAD L
  ELSE IFIND (PRED N) (TAIL L)
def SQUARE N = IFIND N SQUARES
```

存储机制：

```
// 初始状态
SQUARES = (SQ 0)::(SQLIST (SUCC 0)_1)_2

// 计算后状态
SQUARES = (SQ 0)::1::4::(SQLIST (SUCC 2))
```

特点：

- 避免不必要的计算
- 能够处理无限数据结构
- 已计算的值被保存，避免重复计算

## 总结

- 正则序可能比应用序效率更低
- 使用条件表达式表示法进行一致的应用序会导致不终止
- 应用序求值可以通过多种方法延迟执行
- 停机问题是不可解的，但 Church-Rosser 定理暗示正则序最有可能终止
- 正则序使得构造无限对象成为可能
- 惰性求值是一种结合正则序和应用序最佳特性的方法

### 惰性求值步骤

(1) 为每个约束对编号

(2) 要惰性求值 `(<func expression> <arg expression>)`

- (a) 对 `<func expression>` 进行惰性求值得到 `<func value>`
- (b) 若 `<func value>` 是 `λ<name>.<body>`，则用 `<arg expression>` 替换 `<body>` 中所有 `<name>` 的自由出现，并一致地重新编号所有周围的约束对，然后用新的 `<body>` 替换所有 `(<func expression> <arg expression>)_i` 的出现，并对新的 `<body>` 进行惰性求值
- (c) 若 `<func value>` 不是函数，则对 `<arg expression>` 进行惰性求值得到 `<arg value>`，并用 `(<func value> <arg value>)` 替换所有 `(<func expression> <arg expression>)_i` 的出现，然后返回 `(<func value> <arg value>)`
