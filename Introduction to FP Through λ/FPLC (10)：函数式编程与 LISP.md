>   Common Lisp 实现：
>
>   -   [SBCL](https://www.sbcl.org/platform-table.html)
>
>   Scheme 实现：
>
>   -   [Racket](https://racket-lang.org/)

# 10 函数式编程与 Lisp

## 10.1 原子、数字与符号

Lisp 基础对象为**原子**（Atom），由打印字符序列构成，只要遇到原子就会进行求值。

数字原子：

-   Lisp 支持整数、比率、浮点和复数
-   数字求值结果为其本身

符号原子： 非数字的原子称为**符号**（Symbol）或**字面量**（Literal），作为名称使用。每个符号都有关联值，求值时返回其关联值。系统预定义的符号称为**原语**（Primitive）。

## 10.2 形式、表达式与函数应用

**形式**（Form）是 Lisp 的基本结构单元，文法规则为：

```
<form> ::= <atom> | (<forms>) | ()
<forms> ::= <form> | <form> <forms>
```

求值规则：

1.  采用前缀表示法
2.  括号中第一个形式为函数，后续形式为参数
3.  按应用序从左至右求值
4.  使用 `->` 表示求值结果

限制：

-   函数形式：可以是函数名或 Lambda 表达式，但不能是返回函数的表达式
-   参数形式：不能是 Lambda 函数、全局定义名称或原语名称
-   函数作为值需要使用特殊原语处理

这些规则构成了 Lisp 的基础语法结构和求值机制，所有表达式和数据结构都基于形式来构建。


## 10.3 逻辑

Lisp 中的基本逻辑值：

-   TRUE：`t`
-   FALSE：`nil`

逻辑运算：

-   否定：`not`
-   合取：`and`
-   析取：`or`

Lisp 的逻辑运算具有多参数特性：`and` 和 `or` 可接受两个以上参数：

```lisp
* (and t nil t)
NIL
* (or t nil t)
T
```

## 10.4 算术与数值比较

算术运算： 四则运算原语：`+ - * /` 所有算术运算支持多参数

数值操作：

-   截断函数 `truncate`：向下舍入整数
-   取余函数 `rem`：返回整数除法余数

比较运算：`< <= = >= >` 都支持多参数

类型判断原语 `numberp`：判断参数是否为数值

```lisp
* (rem 5 2)
1
* (numberp 1)
T
```

## 10.5 Lambda 函数

Lisp 的 Lambda 函数类似于 λ 演算，用于定义匿名函数，但不完全具备 λ 演算特性。

```
(lambda (<bound variables>) <body>)
```

其中绑定变量的规则为：

```
<bound variables> ::= <bound variable> |
                      <bound variable> <bound variables>
```

Lisp 的 Lambda 函数通常是非柯里化的，参数直接跟在函数后面，同时也不是系统函数原语，而是函数形式标记符。

函数应用形式：

```
(<function> <argument1> <argument2>)
```

示例：

```lisp
* (lambda (x) (* x x))
#<FUNCTION (LAMBDA (X)) {1000AEF03B}>
* ((lambda (x) (* x x)) 2)
4
```

## 10.6 全局定义

**全局定义**（Global definitions）提供函数命名机制，使用原语 `defun`。

```
(defun <name> (<bound variables>) <body>)
```

特点：

-   定义后可在其它形式中直接使用函数名
-   可在其它定义中嵌套使用
-   建立特殊的名称-值关系，区别于绑定变量

示例：

```lisp
* (defun sq (x) (* x x))
SQ
* (defun sum_sq (x y) (+ (sq x) (sq y)))
SUM_SQ
* (sum_sq 1 2)
5
```

## 10.7 条件表达式

条件表达式的核心是 `cond` 原语，基本结构为:

```
(cond (<test1> <result1>)
      (<test2> <result2>)
      ...
      (t <resultN>))
```

执行逻辑：按正则序评估每个 `test` 表达式，当遇到真值时返回对应的 `result`。最后一个测试通常为 `t`，确保有返回值。

示例：

```
(defun max (x y)
  (cond ((> x y) x)
        (t y)))
```

Lisp 还提供了更简单的 `if` 原语：

```
(if <test> <true result> <false result>)
```

## 10.8 引用

**引用**（Quoting）是 Lisp 中用于将形式作为数据结构而非程序的机制，而 λ 演算将数据结构打包为带有绑定变量的函数。

引用的原语是 `quote`，其作用是返回未经求值的参数：

```
(quote <argument>) -> <argument>
```

Lisp 提供了简写形式：`'<argument>`，等同于 `quote` 的使用。

引用的本质是**延迟求值**（Delayed evaluation）的一种抽象机制。当一个符号被引用时，不会被其关联值替换，而是作为独立对象存在，这使得 Lisp 能够将代码本身作为数据来处理。

## 10.9 列表

空列表表示为 `nil` 或 `()`。在 Lisp 中，`nil` 同时代表 FALSE，而任何非 `nil` 值都代表 TRUE。

-   `null` 原语测试是否为空列表
-   `listp` 原语判断是否为列表

列表通过 `cons` 原语构造：

```
(cons <head> <tail>)
```

将求值后的 `head` 和 `tail` 组合成新列表。

### 表示法

点对表示法：当 `tail` 不是空列表时使用

```lisp
* (cons 1 2)
(1 . 2)
* (cons 1 (cons 2 3))
(1 2 . 3)
```

扁平表示法：当列表以空列表结尾时使用

```lisp
* (cons 1 nil)
(1)
* (cons 1 (cons 2 nil))
(1 2)
```

形式符号：为了避免与函数应用混淆，列表也可以直接通过 `'` 来构造

```lisp
* '(1 2 3)
(1 2 3)
* (listp '(1 2 3))
T
```

多参数列表可通过 `list` 原语构造，并自动以空列表结尾：

```lisp
* (list 1 2 3)
(1 2 3)
* (list (list 1 2) (list 3 4))
((1 2) (3 4))
```

## 10.10 列表选择

基本选择器：

-   `car`：选择列表的头部
-   `cdr`：选择列表的尾部

```lisp
* (car '(1 2 3))
1
* (car (cdr '(1 2 3)))
2
```

从列表中选择的子列表虽然看似形式，但不会被 `car` 或 `cdr` 进一步求值。

## 10.11 递归

Lisp 的递归通过在函数体中引用函数自身名称来实现。基本模式是在非空情况下处理当前元素，并对剩余部分递归。

计算列表长度：

```lisp
(defun my-length (l)
  (if (null l)
      0
      (+ 1 (my-length (cdr l)))))
```

有序列表插入：

```lisp
(defun insert (x l)
  (cond ((null l) (cons x nil))
        ((< x (car l)) (cons x l))
        (t (cons (car l) (insert x (cdr l))))))
```

基于插入的排序：

```lisp
(defun sort (l)
  (if (null l)
      nil
      (insert (car l) (sort (cdr l)))))
```

## 10.12 局部定义

局部定义使用 `let` 原语来引入局部变量：

```lisp
(let ((var1 value1)
      (var2 value2)
      ...)
      result)
```

这种形式等价于 Lambda 表达式的调用：

```lisp
((lambda (var1 var2 ...) result)
  value1 value2)
```

条件插入函数：

```lisp
(defun new_insert (x l)
  (if (null l)
      (cons x nil)
      (let ((hl (car l))
            (tl (cdr l)))
           (cond ((= x hl) l)
                 ((< x hl) (cons x l))
                 (t (cons hl (new_insert x tl)))))))
```

通过使用局部变量，用 `hl` 和 `tl` 分别存储列表的头部和尾部，避免重复计算。

## 10.13 Lisp 中的二叉树

Lisp 中的二叉树使用列表表示：`(<item> <left> <right>)`，其中 `nil` 表示空树。

节点构造函数：

```lisp
(defun node (item left right) (list item left right))
```

选择器函数：

```lisp
(defun item (l) (car l))
(defun left (l) (car (cdr l)))
(defun right (l) (car (cdr (cdr l))))
```

添加节点：递归地将新值插入合适位置

```lisp
(defun tadd (i tree)
  (cond ((null tree) (node i nil nil))
        ((< i (item tree)) (node (item tree)
                           (tadd i (left tree)) (right tree)))
        (t (node (item tree) (left tree) (tadd i (right tree))))))
```

添加列表：递归地将列表中的每个元素添加到树中

```lisp
(defun taddlist (l tree)
  (if (null l)
      tree
      (taddlist (cdr l) (tadd (car l) tree))))
```

遍历：中序遍历以获得升序序列

```lisp
(defun traverse (tree)
  (if (null tree)
      nil
      (append (traverse (left tree))
              (cons (item tree) (traverse (right tree))))))
```

## 10.14 动态作用域与词法作用域

### 词法作用域（Lexical scope）

词法作用域，也称**静态作用域**（Static scope），是一种变量绑定方式。表达式中的名称对应于定义它的最内层封闭函数的约束变量。这种绑定在表达式求值前就已确定，不会在运行时改变。

### 动态作用域（Dynamic scope）

动态作用域中，名称的值在表达式求值时确定。名称对应于求值过程中遇到的最近的同名约束变量-值关联。这允许函数包含自由变量。

```lisp
(defun tax (gross)
  (/ (* gross rate) 100))

(defun low_tax (gross)
  (let ((rate 25))
       (tax gross)))

(defun av_tax (gross)
  (let ((rate 30))
       (tax gross)))
```

同一个函数 `tax` 中的自由变量 `rate` 可以在不同的上下文中获得不同的值。

Lisp 采用词法作用域，但提供了原语来支持动态作用域。这种设计反映了两种作用域机制的权衡：词法作用域提供更好的可预测性，而动态作用域提供更大的灵活性。

## 10.15 函数作为值与参数

函数作为一等公民在 Lisp 中的实现涉及 [FUNARG 问题](https://en.wikipedia.org/wiki/Funarg_problem)，这源于需要处理带有自由变量的函数作为参数时的作用域问题。

### 函数值的处理机制

Lisp 中的函数值需要显式标识和应用，这与 λ 演算中的自由操作不同。

主要通过以下两种方式实现：

-   函数标识：

```lisp
; 简写形式：#'<function>
(function <function>)
```

这种形式创建函数值，并将自由变量与定义作用域中的约束变量关联。

-   函数应用：

```lisp
(funcall <function value> <argument1> <argument2> ...)
```

用于显式调用函数值。

### 应用示例

税率计算是一个典型例子：

```lisp
* (defun gen_tax (rate)
  #'(lambda (gross) (/ (* gross rate) 100)))
GEN_TAX
* (funcall (gen_tax 25) 10000)
2500
```

这个例子展示了如何创建和使用带有冻结自由变量的函数值。

### 映射函数

`mapcar` 函数的实现展示了函数值作为参数的使用方式：

```lisp
* (defun my-mapcar (fn arg)
  (if (null arg)
      nil
      (cons (funcall fn (car arg)) (my-mapcar fn (cdr arg)))))
MY-MAPCAR
* (defun sq_list (l)
  (my-mapcar #'(lambda (x) (* x x)) l))
SQ_LIST
* (sq_list '(1 2 3))
(1 4 9)
```

注意点：

-   即使是简单的函数名作为参数，也需要用 `#'` 进行引用
-   大多数 Lisp 系统不直接显示函数值的文本形式
-   这种机制通过闭包实现，使自由变量能在定义作用域中被正确冻结

这种设计反映了 Lisp 在处理函数作为值时的权衡：通过显式的标识和应用机制，解决了动态作用域环境下的 FUNARG 问题，同时保持了函数作为一等公民的能力。

## 10.16 符号、引用与求值

符号除了作为变量名，被引用后可作为独立对象使用。

```lisp
; 定义符号
'Monday 'Tuesday 'Wednesday 'Thursday 'Friday 'Saturday 'Sunday

; 后继函数实现
(defun next_day (day)
  (cond ((eq day 'Monday) 'Tuesday)
        ((eq day 'Tuesday) 'Wednesday)
        ; ... 其它日期映射
        ((eq day 'Sunday) 'Monday)))
```

Lisp 提供 `eval` 原语用于强制对引用形式进行求值，这使得能够：

-   将数据结构转换为可执行的程序
-   实现元编程

### 中缀表达式转换

语法定义：

```
<expression> ::= <number> |
                 (<expression> + <expression>) |
                 (<expression> - <expression>) |
                 ...
```

转换实现：

```lisp
* (defun trans (l)
  (if (numberp l)
      l
      (let ((e1 (trans (car l)))
            (op (car (cdr l)))
            (e2 (trans (car (cdr (cdr l))))))
        (list op e1 e2))))
TRANS
* (trans '((6 * 7) + (8 - 9)))
(+ (* 6 7) (- 8 9))
```

### 作用域影响

引用形式中自由变量的处理依赖于作用域系统：

-   词法作用域：被引用的自由变量仅与全局定义关联，忽略局部作用域的约束变量
-   动态作用域：被引用的自由变量在求值时与当前作用域的约束变量关联

这种机制展示了 Lisp 强大的元编程能力，通过符号操作和动态求值，可以实现代码生成和语言处理等高级功能。

## 10.17 Lisp 中的 λ 演算

Lisp中实现 λ 演算的核心在于使用 `function` 和 `funcall` 进行显式的函数值表示和应用，这种实现基于应用序求值策略。

### 恒等函数

```lisp
; Lambda 形式
#'(lambda (x) x)

; 定义形式
(defun identity (x) x)

; 自应用
(funcall #'identity #'identity)
```

### 自应用函数

```lisp
; Lambda 形式
#'(lambda (s) (funcall s s))

; 定义形式
(defun self_apply (s) (funcall s s))

; 与恒等函数组合
(funcall #'self_apply #'identity)
```

### 函数应用函数

```lisp
(defun apply (f a) (funcall f a))

; 组合示例
(funcall #'apply #'self_apply #'identity)
```

限制：

-   函数值和应用必须显式表示（通过 `#'` 和 `funcall`）
-   函数值缺乏统一的表示方式（不同 Lisp 实现可能有不同输出表示）

## 10.18 λ 演算与 Scheme

Scheme 是 Lisp 族语言，其关键特征：

-   使用基于括号的形式构建程序和数据
-   采用弱类型
-   使用应用序求值
-   使用词法作用域
-   函数是一等对象

在Scheme中，函数值的处理具有以下特点：函数可以作为参数传递，函数表达式可以出现在任何函数位置。这使得 λ 演算示例可以轻松转换到 Scheme 中执行。

恒等函数：

```scheme
(lambda (x) x)
```

自应用函数：

```scheme
((lambda (x) x) (lambda (x) x))
```

标准函数定义语法：

```
(define (<name> <argument1> <argument2> ...) <body>)
```

自应用和函数应用的完整实现：

```scheme
(lambda (s) (s s))
((lambda (s) (s s)) (lambda (x) x))
(define (self_apply s) (s s))
(define (apply f a) (f a))
```

这种函数值的显式使用方式使 Scheme 比 Lisp 更接近 λ 演算的本质。

## 10.19 其它特性

Lisp 包含多种数据类型：

-   字符
-   数组
-   字符串
-   结构
-   多值对象

同时还包含输入/输出和系统接口等功能。

## 总结

-   探讨了 Lisp 与函数式编程方法之间的关系
-   在 Lisp 中将函数作为对象处理需要使用显式符号；对于函数结果没有标准的表示方法
-   Scheme 简化了将函数作为对象的处理方式，但同样缺乏函数结果的标准表示方法
