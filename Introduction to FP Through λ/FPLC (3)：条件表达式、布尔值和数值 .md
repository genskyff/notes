# 3 条件表达式、布尔值和数值

## 3.1 真值和条件表达式

布尔逻辑的基础是 `true` 和 `false` 两个真值，以及 NOT、AND、OR 等逻辑运算。

真值定义为：

```
def true = select_frist
def false = select_second
```

条件表达式的形式为：

```
<condition> ? <expression1> : <expression2>
```

当条件为 `true` 时选择 `expression1`，为 `false` 时选择 `expression2`。

这个条件表达式可以用 `make_pair` 的形式表示为：

```
def cond = λe1.λe2.λc.((c e1) e2)
```

其中：

- `e1` 对应第一个表达式
- `e2` 对应第二个表达式
- `c` 为条件

这些定义构成了实现逻辑运算的基础。

## 3.2 NOT

NOT 是一元运算符：

```
not <operand>
```

用条件表达式来表达：

```
x ? false : true
```

用 λ 表达式可写成：

```
def not = λx.(((cond false) true) x)
== λx.((x false) true)
```

现在 `not false` 可写成：

```
(not false)
=> (λx.((x false) true) false)
=> ((false false) true)
=> true
```

## 3.3 AND

AND 是二元运算符：

```
<operand> and <operand>
```

用条件表达式来表达：

```
x ? y : false
```

用 λ 表达式可写成：

```
def and = λx.λy.(((cond y) false) x)
== λx.λy.((x y) false)
```

现在 `true and false` 可以写成：

```
((and true) false)
=> ((λx.λy.((x y) false) true) false)
=> (λy.((true y) false) false)
=> ((true false) false)
=> false
```

## 3.4 OR

OR 是二元运算符：

```
<operand> or <operand>
```

用条件表达式来表达：

```
x ? true : y
```

用 λ 表达式可写成：

```
def or = λx.λy.(((cond true) y) x)
== λx.λy.((x true) y)
```

现在 `false or true` 可以写成：

```
((or false) true)
=> ((λx.λy.((x true) y) false) true)
=> (λy.((false true) y) true)
=> ((false true) true)
=> true
```

## 3.5 自然数

### 自然数表示

自然数都可表示为 0 的后继：

- 1 是 0 的后继
- 2 是 1 的后继（即 0 的两次后继）
- 3 是 2 的后继（即 0 的三次后继)

```
def 2 = (succ (succ 0))
def 3 = (succ (succ 1)) == (succ (succ (succ 0)))
```

### 基本函数定义

对于 `succ`，`n` 是一个接受选择器参数的函数，即数字：

```
def 0 = identity
def succ = λn.λs.((s false) n)
```

当 `succ` 应用到一个数字 `n` 上时：

- 接收一个 `s` 作为参数
- 然后构造 `(s false) n`

实际上是在原来的数 `n` 的基础上多应用了一次函数。

从函数复合的视角来看：

- `(s false)` 创建了一个新的函数层
- `n` 代表原有的函数复合次数
- `((s false) n)` 就在原有复合的基础上又增加了一次复合

这就是为什么 `succ` 要这样定义，因为增加一次复合本质上就相当于自然数对后继的定义。其中的 `s` 是什么并不重要，相当于一个占位符，用来保持这种复合结构。而 0 不需要复合，因此定义为恒等函数。

### 数字构建

```
def 1 = (succ 0)
== λs.((s false) 0)

def 2 = (succ 1)
== λs.((s false) λs.((s false) 0))

def 3 = (succ 2)
== λs.((s false) λs.((s false) λs.((s false) 0)))
```

### 辅助函数

判断一个数是否为零，`iszero` 是将数字应用于选择器而非将选择器应用于数字。

```
def iszero = λn.(n true)
```

之所以能够进行判断，是因为非零的数 `n` 必然是如下结构：

```
λs.((s false) ...)
```

将其应用于 `true`，得到：

```
(λs.((s false) ...) true)
=> ((true false) ...)
=> false
```

### 前驱函数

要找到一个数的前驱，实际上就是减小一层复合，一个非 0 的数必然是如下结构：

```
λs.((s false) ...)
```

减小一层复合实际上就是取 `...` 这部分，也就是选择第二个，`pred` 定义为：

```
def pred = λn.(n false)
```

但没有处理为 0 时情况，因此可以使用 `iszero`，完整的 `pred` 定义为

```
def pred = λn.(((iszero n) 0) (n false))
```

现在 1 可以表示为：

```
(pred 2)
=> (λn.(((iszero n) 0) (n false)) 2)
=> (((iszero 2) 0) (2 false))
=> (2 false)
=> (λs.((s false) λs.((s false) 0)) false)
=> ((false false) λs.((s false) 0))
=> λs.((s false) 0)
=> 1
```

## 3.6 简化记法

处理 λ 表达式需要使用大量括号，这不仅繁琐且容易出错，应当在语义明确时可以省略括号。

### 括号简化规则

原始形式：

```
(... ((<function> <argument1>) <argument2>) ... <argumentN>)
```

简化形式：

```
<function> <argument1> <argument2> ... <argumentN>
```

限制条件：

- 参数如果是应用必须保留括号
- 函数体中的应用必须保留括号

### 函数定义简化

原始形式：

```
def <names> = λ<name>.<expression>
```

简化形式：

```
def <names> <name> = <expression>
```

### 条件表达式简化

原始形式：

```
def cond = <true choice> <false choice> <condition>
```

简化形式：

```
if <condition>
then <true choice>
else <false choice>
```

### 函数简化示例

简单函数：

```
def identity x = x
def self_apply s = s s
def apply func arg = func arg
```

选择和配对函数：

```
def select_first first second = first
def select_second first second = second
def make_pair e1 e2 c = c e1 e2
```

布尔函数：

```
def cond e1 e2 c = c e1 e2
def true first second = first
def false first second = second

def not x = x false true
== if x
   then false
   else true

def and x y = x y false
== if x
   then y
   else false

def or x y = x true y
== if x
   then true
   else y

def implies x y = if x
                  then y
                  else true

def equiv x y = if x
                then y
                else not y
```

后继、前驱函数：

```
def succ n = λs.(s false n)
def pred n = if iszero n
             then 0
             else n false
```
