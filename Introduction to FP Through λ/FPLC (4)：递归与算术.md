# 4 递归与算术

## 4.1 重复、迭代与递归

### 基本概念

**重复**（Repetition）：同一操作零次或多次执行

-   **有界重复**（Bounded repetition）：固定次数且已知
-   **无界迭代**（Unbounded iteration）：直到满足条件，次数未知

使用场景：

-   有界重复：处理已知长度的线性序列（如数组）
-   无界重复：处理未知深度的嵌套结构（如文件系统）

### 不同范式中的实现

命令式：

-   基于迭代结构
-   通过改变共享内存中的变量实现
-   典型结构：
    -   for ... in：有界迭代
    -   while：无界迭代

函数式：

-   基于嵌套函数调用
-   无共享内存概念
-   通过函数间传递结果
-   核心机制：**递归**（Recursion）

### 迭代 vs. 递归：吃苹果问题

迭代方式：重复执行吃 1 个苹果的动作 n 次。

```ruby
def eat_apples_downto(n)
  n.downto(1) { gobble_apple }
end

# 或
def eat_apples_while(n)
  count = n
  while count > 0
    gobble_apple
    count -= 1
  end
end
```

递归方式：吃 1 个苹果，递归处理剩余 n - 1 个。

```ruby
def eat_apples_recursive(n)
  if n > 0
    gobble_apple
    eat_apples_recursive(n - 1)
  end
end
```

### 递归的分类

**原始递归**（Primitive recursion）：

-   重复次数已知
-   有限深度函数调用嵌套
-   等价于有限内存的有界重复

**一般递归**（General recursion）：

-   重复次数未知
-   未知深度函数调用嵌套
-   等价于无限内存的无界重复

## 4.2 通过定义实现递归？

递归定义的基本形式：在定义右侧使用定义左侧的名称。

```
def add x y
= if iszero y
  then x
  else add (succ x) (pred y)
```

但 λ 演算中的替换规则要求：

-   表达式求值前，所有名称必须替换为其定义
-   这导致递归定义中的替换永远不会终止

如 `add` 定义为：

```
λx.λy.
  if iszero y
  then x
  else add (succ x) (pred y)
```

函数体中出现了 `add`，因此继续替换：

```
λx.λy.
  if iszero y
  then x
  else
    ((λx.λy.
      if iszero y
      then x
      else add (succ x) (pred y)) (succ x) (pred y))
```

然而又出现了 `add`，因此替换永不终止。

问题在于：

-   需求：希望替换次数是有限的，取决于具体参数
-   现实：定义函数时无法预知将要使用的参数值
-   目标：需要某种机制来延迟函数的重复使用，直到实际需要时才进行

因此简单的递归定义在 λ 演算中是行不通的，需要特殊的处理机制来实现递归。

## 4.3 函数自身传递

对于函数应用，这两种形式是等价的：

```
(<function> <argument>)
= (λf.(f <argument>) <function>)
```

由于表达式求值前，所有名称必须替换为其定义。而唯一求值的场景就是函数应用，要延迟这种求值，可以将表达式按上述方式进行转换。

因此对 `add` 中需要递归的点，即 else 分支进行抽象来消除递归，增加一个参数 `f`，改写成 `add1`：

```
def add1 f x y
= if iszero y
  then x
  else f (succ x) (pred y)
```

现在需要找到一个 `f` 使其效果和 `add` 相同，但不能直接将 `add` 当成参数传递，因为这样又会无限替换下去。可以将 `add1` 传递给自身，但这只是将问题延迟到下一层而已，如展开定义为：

```
def add = add1 add1
== (λf.λx.λy.
     if iszero y
     then x
     else f (succ x) (pred y)) add1)
=> λx.λy.
     if iszero y
     then x
     else add1 (succ x) (pred y)
```

可以看到，`f` 的传递深度不够，递归时缺少对 `f` 的引用，其中：

```
f (succ x) (pred y)
```

只有两个参数，替换后变成：

```
add1 (succ x) (pred y)
```

此时就不存在对于 `f` 的参数了，需要的效果是：

```
add1 add1 (succ x) (pred y)
```

这样才能继续把 `add1` 传递给后续递归，因此将其改为这种形式：

```
def add2 f x y
= if iszero y
  then x
  else f f (succ x) (pred y)

def add = add2 add2
== (λf.λx.λy.
     if iszero y
     then x
     else f f (succ x) (pred y)) add2)
=> λx.λy.
     if iszero y
     then x
     else add2 add2 (succ x) (pred y)
```

现在 `1 + 2` 可表示为：

```
add 1 2
== (λx.λy.
     if iszero y
     then x
     else add2 add2 (succ x) (pred y) 1 2)
=> if iszero 2
   then 1
   else add2 add2 (succ 1) (pred 2)
=> add2 add2 2 1
== if iszero y
   then x
   else f f (succ x) (pred y) add2 2 1
=> if iszero 1
   then 2
   else add2 add2 (succ 2) (pred 1)
=> add2 add2 3 0
== if iszero 0
   then 3
   else f f (succ 3) (pred 0) add2 3 0)
=> 3
```

思路：

-   通过在函数应用点进行抽象来延迟递归
-   函数自身作为参数的双重传递机制

意义：

-   解决了 λ 演算中递归定义的基本问题
-   提供了一种在函数式编程中实现递归的形式化方法

## 4.4 应用序归约

应用序归约：

-   在参数传递给函数前先对参数求值
-   使用 `->` 表示单步应用序归约
-   使用 `-> ... ->` 表示多步应用序归约

与正则序归约的关系：

-   等价情况：
    -   当归约终止时，两者结果相同
-   不等价情况：
    -   应用序归约不一定会终止
    -   正则序归约一定会终止


## 4.5 递归函数

核心概念：

-   通用递归函数构造方法：从非递归函数构建，在递归点使用单一抽象
-   基本思路：找到**构造函数**（Constructor function），从而移除**自引用**（Self-reference）

如乘法 `x * y` 可以看作 `x + x * (y - 1)`，其原始递归版本定义为：

```
def mult1 x y
= if iszero y
  then 0
  else add x (mult x (pred y))
```

这里包含了自引用，同样对该递归点进行抽象，移除后的版本定义为：

```
def mult1 f x y
= if iszero y
  then 0
  else add x (f x (pred y))
```

这里可以按照之前的方法，找到 `f` 的替代，但不手动构造，而是找到一个 `recursive` 函数，将 `mult1` 当作参数，可以返回一个递归版本的新函数 `mult`。

目标：`def mult = recursive mult1`

要求：

-   必须传递参数副本
-   确保自引用继续
-   复制机制必须传递

基本形式：`def recursive f = f <'f' and copy>`

要实现这种形式，可以使用 `self_apply`：

1.  使用自应用函数：`self_apply = λs.(s s)`
2.  通过抽象延迟自应用：`λf.λs.(f (s s))`
3.  最终形式：`def recursive f = λs.(f (s s)) λs.(f (s s))`

其中，`λs.(f (s s)) λs.(f (s s))` 就是 `<'f' and copy>`。

按照这种方式，将 `recursive` 应用于 `mult1`：

```
def mult = recursive mult1
=> mult1 <'mult1' and copy>
=> λx.λy.
     if iszero y
     then 0
     else add x (<'mult1' and copy> x (pred y))
```

现在计算 `3 * 2` 可表示为：

```
mult 3 2
=> if iszero 2
   then 0
   else add 3 (<'mult1' and copy> 3 (pred 2))
=> add 3 (<'mult1' and copy> 3 1)
=> add 3 (add 3 (<'mult1' and copy> 3 0))
=> add 3 (add 3 0)
=> 6
```

## 4.6 递归记法

`recursive` 函数也被称为：

-   悖论组合子（Paradoxical combinator）
-   不动点查找器（Fixed point finder）
-   Y 组合子

```
Y = λf.(λs.(f (s s)) λs.(f (s s)))
```

Y 组合子实际上就是一个不动点组合子，可以在没有递归能力的 λ 演算中实现递归。

`Y f = f (Y f)` 表明 `Y f` 是 `f` 的不动点。

使用简化记法：

-   形式：`rec <name> = <expression>`
-   作用：直接在定义中使用递归名称

旧记法：

```
def add1 f x y
= if iszero y
  then x
  else f (succ x) (pred y)
def add = recursive add1
```

新记法：

```
rec add x y
= if iszero y
  then x
  else add (succ x) (pred y)

rec mult x y
= if iszero y
  then zero
  else add x (mult x (pred y))
```

## 4.7 算术运算

### 4.7.1 幂运算

思路：

-   基础情况：当 `y = 0` 时，返回 1
-   递归情况：`x ^ y = x * (x ^ (y - 1))`

定义：

```
rec power x y
= if iszero y
  then 1
  else mult x (power x (pred y))
```

### 4.7.2 自然减法

思路：

-   基础情况：减 0 返回原数
-   递归情况：两数同时减 1
-   当被减数小于减数时返回 0

定义：

```
rec sub x y =
  if iszero y
  then x
  else sub (pred x) (pred y)
```

### 4.7.3 比较

相等比较：

```
// 通过绝对差
def abs_diff x y = add (sub x y) (sub y x)
def equal x y = iszero (abs_diff x y)

// 递归比较
rec equal x y
= if and (iszero x) (iszero y)
  then true
  else if or (iszero x) (iszero y)
  then false
  else equal (pred x) (pred y)
```

不等比较：

```
// 大于
def greater x y = not (iszero (sub x y))

// 大于等于
def greater_or_equal x y = iszero (sub y x)
```

### 4.7.4 除法

思路：

-   除零情况：返回 0
-   实现：通过反复减法计数
-   本质：计算除数可以从被除数中减去多少次

定义：

```
rec div1 x y
= if greater y x
  then 0
  else succ (div1 (sub x y) y)

def div x y
= if iszero y
  then 0
  else div1 x y
```

## 总结

-   递归是函数式编程中的一种重复手段
-   通过函数定义的递归会导致非终止的替换序列
-   递归可以通过在函数中进行递归的地方进行抽象，然后将函数传递给自身来实现
-   求值可以通过应用序 β 归约来简化
-   递归可以通过递归函数在其自身递归点处进行函数替换来泛化
-   递归函数可以通过递归记法来定义
-   递归可以用来开发标准算术运算

### 通过将函数传递给自身的递归

对于：

```
def <name> = ... (<name> ...) ...
```

写作：

```
def <name1> f = ...(f f ...) ...
def <name> = <name1> <name1>
```

### 应用序 β 归约

对于不含自由变量的 `(<function> <argument>)`：

-   对 `<argument>` 进行应用序 β 归约得到 `<argument value>`
-   对 `<function>` 进行应用序 β 归约得到 `<function value>`
-   若 `<function value>` 是 `λ<name>.<body>`，则用 `<argument value>` 替换 `<body>` 中所有自由出现的 `<name>`，并对新的 `<body>` 进行应用序 β 归约
-   若 `<function value>` 不是函数，则返回 `(<function value> <argument value>)`

### 应用序归约记法

```
->        -- 应用序 β 归约
-> ... -> -- 多次应用序 β 归约
```

### 递归函数

```
def recursive f = λs.(f (s s)) λs.(f (s s))
```

对于：

```
def <name> = ... (<name> ...) ...
```

写作：

```
def <name1> f = ... (f ...) ...
def <name> = recursive <name1>
```

注意：

```
recursive <name1> => ... => <name1> (recursive <name1>)
```

### 递归记法

```
rec <name> = <expression using '<name>'>
== def <name> = recursive λf.<expression using 'f'>
```
