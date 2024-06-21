# 5 表示代码

在上一步的词法分析中，已经将字符串形式的源代码转换成了 Token 序列。下一步就应该将这些 Token 转换为 AST。但在进行这种转化之前，需要先对其定义。

代码的表示形式应该易于解析器生成，和易于解释器使用。如 `1 + 2 * 3 - 4` 这样的表达式，具有运算优先级。可以使用树来表达这种具有优先级顺序的结构，叶子节点是数字，内部节点是运算符，每一个操作数都对应一个分支。要计算一个节点，需要先计算其子树的值，这相当于后序遍历。

![img](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202405071552798.png)

若给出一个算术表达式，可以很容易构造这样的树，根据这棵树也可以进行计算。因此从直观上看，代码的一种可行的表示方式是一颗与语法结构（运算符嵌套）相匹配的树。

## 5.1 上下文无关语法

在词法分析阶段，用来定义词法语法（字符如何被分组为 Token 的规则）的形式体系，被称为正则语言。这对于扫描器来说是可以的，因为其输出都是扁平化的 Token 序列。但正则语言的表达能力有线，仅能用于描述简单文本，无法处理如任意深度嵌套表达式这样的复杂场景。

在形式化语法（Formal grammar）中，有一个重要的工具——**上下文无关语法**（Context-free grammar，CFG）。形式化语法需要一组原子片段——**字母表**（Alphabet），其定义了一组任意长度的**字符串**（String），而这些字符串包含在语法中，每个字符串都是字母表中**字符**（Letter）的序列。形式化语法的工作就是指定哪些字符串有效。

在词法分析和语法分析阶段，相同的术语指代不同的含义：

| 术语                | 词法分析 Lexing                     | 语法分析 Parsing                     |
| ------------------- | ----------------------------------- | ------------------------------------ |
| 字母表 Alphabet     | 字符 Character                      | 词法标记 Token                       |
| 字符串 String       | 词素或标记 Lexeme or token          | 表达式 Expression                    |
| 实现 Implementation | 扫描器或词法分析器 Scanner or lexer | 解析器或语法分析器 Scanner or parser |

### 5.1.1 语法规则

显然无法列举一个包含无限多有效字符串的语法，但可以提供一组有限多的规则，称为**生成式**（Production），从这些规则中生成语法中的字符串被称为**推导式**（Derivation）。

CFG 中每个生成式都有一个**头部**（Head）和描述其生成内容的**主体**（Body）。从形式上看，主体只是一系列符号，符号分为两类：

-   **终止符**（Terminal symbol）：语言的基本构建块，是语法分析中直接处理的符号，不能再被其它规则替换或分解的原子单位，如关键字（`if`、`else`）、字面值（`123`、`"foo"`）、标识符（`foo`）、操作符（`+`、`-`）等；
-   **非终止符**（Non-terminal symbol）：用于构建语言结构的符号，定义了一组可能的产生式规则中的替换规则，可以被进一步展开成非终止符或终止符的符号，如表达式、语句等。

为了让这些规则具体化，需要一种方式来描述这些生成规则，现在通常使用[巴科斯范式](https://zh.wikipedia.org/wiki/%E5%B7%B4%E7%A7%91%E6%96%AF%E8%8C%83%E5%BC%8F)（BNF）及其[扩展](https://zh.wikipedia.org/wiki/%E6%89%A9%E5%B1%95%E5%B7%B4%E7%A7%91%E6%96%AF%E8%8C%83%E5%BC%8F)（EBNF）或变形。

一种简单的形式：

-   每个规则都有一个名称，后跟 `->`，再跟一些列符号；
-   以 `;` 结尾；
-   终止符是带引号的字符串，非终止符是小写的单词。

以此为基础，一个用于早餐菜单的语法可以这样来表述：

```
breakfast -> protein "with" breakfast "on the side";
breakfast -> protein;
breakfast -> bread;

protein -> crispiness "crispy" "bacon";
protein -> "sausage";
protein -> cooked "eggs";

crispiness -> "really";
crispiness -> "really" crispiness;

cooked -> "scrambled";
cooked -> "poached";
cooked -> "fried";

bread -> "toast";
bread -> "biscuits";
bread -> "English muffin";
```

可以使用这个语法来生成一个早餐，选择 `breakfast` 的第一条，得到：

```
protein "with" breakfast "on the side"
```

`protein` 是一个非终止符，选择其第三条，得到：

```
cooked "eggs" "with" breakfast "on the side"
```

`cooked` 是一个非终止符，选择其第二条，得到：

```
"poached" "eggs" "with" breakfast "on the side"
```

下一个非终止符还是 `breakfast`，生成式递归的指向了自身，这表明语言是上下文无关，而不是正则的。可以选择第一条，然后继续不断地递归下去，但是这里选择第三条，得到：

```
"poached" "eggs" "with" bread "on the side"
```

`bread` 是一个非终止符，选择其第三条，得到：

```
"poached" "eggs" "with" "English muffin" "on the side"
```

现在所有非终止符都被展开了，最后仅包含终止符。

![img](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202405071656599.png)

每当遇到具有多个结果的规则时，都只是随意选择了一个。正是这种灵活性允许用少量的语法规则来编码出组合性更强的字符串集。一个规则可以直接或间接地引用自身，这种递归的性质使得上下文无关语法能够描述嵌套的结构，这是正则语法做不到的。

一个正则语法描述任意数量的 `a` 后跟任意数量的 `b` 组成的字符串，如 `aaabbb`、`ab`，其语法可以这样表示：

```
S -> aS
S -> bT
T -> bT
T -> end
```

其中 `S` 表示从此开始，可以添加任意数量的 `a` 然后转换到状态 `T` 并添加任意数量的 `b`，`end` 表示结束。

但如果要描述一个嵌套的括号，如 `()`、`(())`，通过上下文无关语法可以轻松表达，但正则语法就不行。其上下文语法可以这样表示：

```
S -> (S)
S -> SS
S -> end
```

因此正则语法通常用于简单的模式匹配和处理，如日志分析或输入验证，而上下文无关语法则用于解析更复杂的结构，如语言解析器（函数调用、控制流语句）或复杂数据格式（JSON、XML）的解析。

### 5.1.2 增强符号

更进一步，可以对生成式规则添加一些语法糖：

-   使用 `|` 分隔生成式，避免在每次添加一个生成式时重复名称；
-   使用 `()` 进行分组，在分组中使用 `|` 表示选择其一；
-   使用 `*` 表达生成式可以出现 0 次或多次；
-   使用 `+` 表达生成式可以出现 1 次或多次；
-   使用 `?` 表达生成式可以出现 0 次或 1次。

因此上面表达早餐菜单的语法可以简化为：

```
breakfast  -> protein ("with" breakfast "on the side")?
              | bread;
protein    -> crispiness "crispy" "bacon"
              | "sausage"
              | cooked "eggs";
crispiness -> "really"+;
cooked     -> "scrambled" | "poached" | "fried";
bread      -> "toast" | "biscuits" | "English muffin";
```

更进一步可以简化为：

```
breakfast -> protein ("with" breakfast "on the side")?
             | ("toast" | "biscuits" | "English muffin");
protein   -> "really"+ "crispy" "bacon"
             | "sausage"
             | ("scrambled" | "poached" | "fried") "eggs";
```

这实际上将一部分正则语法应用在了生成式规则的表达上，但本质还是上下文无关语法。这种精确化描述可以将非正式的语法设计具体化。

### 5.1.3 Lox 表达式语法

将 Lox 语法规则使用生成式规则来表达，因为整个语法十分多，所以先从表达式开始。

Lox 中的表达式，如：

```javascript
1 - (2 * 3) < 4 == false
```

可以分为：

-   字面量（Literal）：数字（Number）、字符串（String）、布尔值（Boolean）、`nil`；
-   一元表达式（Unary expression）：逻辑非 `!`、数字取反 `-`；
-   二元表达式（Binary expression）：`+`、`-`、`*`、`/`、`==`、`!=`、`<`、`<=`、`>`、`>=`；
-   括号（Parentheses）：`(`、`)`。

除了对精确匹配词素的终止符加引号外，还会对表示单一词素的终止符进行大写。这些符号使用生成式语法可以表达为：

```
expression -> literal
              | unary
              | binary
              | group;
literal    -> NUMBER | STRING | "true" | "false" | "nil";
unary      -> ("!" | "-") expression;
binary     -> expression operator expression;
operator   -> "+" | "-" | "*" | "/"
              | "==" | "!=" | "<" | "<=" | ">" | ">="
group      -> "(" expression ")"
```

## 5.2 实现语法树

根据上述 Lox 的表达式语法，可以将表达式构成一颗递归的树——**语法树**（Syntax tree）。

扫描器使用一个 Token 类来表示所有类型词素，TokenType 枚举用于区分不同类型的词素。而语法树则没有那么同质，一元表达式只有一个操作数，二元表达式由两个，而字面量则没有。

可以将所有这些内容放到一个可以包含任意子列表的 Expression 类中。还可以定义一个基类，然后为 expression 中的每一个生成式都创建一个子类，该子类含有非终止字符字段，这样若对一元表达式访问其第二个操作数时就会得到一个错误。

如定义一个 `Expr` 作为所有表达式类型的基类：

```ruby
class Expr
end

class Binary < Expr
  def initialize(left, operator, right)
    @left = left
    @operator = operator
    @right = right
  end
end
```

### 5.2.1 非面向对象

`Expr` 类没有定义任何方法。在编译原理的上下文中，`Expr` 类和其它语法树节点类似，主要用于表示程序代码的结构而非其行为。这些类的对象通常在解析阶段被创建，并在整个编译或解释过程中传递。如果这些类包含了特定行为，如解析或解释的逻辑，那么会违背作为数据通信介质的角色，因为这会导致类与特定的处理阶段或逻辑过度绑定，而将这些结构设计为简单的数据容器，这样在不同的处理阶段之间更加通用和灵活。

在面向对象语言中，数据和行为通常是绑定的，而函数式语言更倾向于将数据和行为分开，数据结构通常只是静态的，不含任何方法，而行为则通过函数来操作这些数据。虽然函数式语言更适合用来构建解释器，但其中的一些组件，如扫描器，则更适合用面向对象的方式来构建。关键在于如何保持对象行为封装的同时，合理地管理那么必须在多个阶段间流动的数据结构。

### 5.2.2 节点树元编程

