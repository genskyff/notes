# 6 解析表达式

## 6.1 歧义与解析游戏

上下文无关文法可以生成字符串，而解析器则相反，给定一个字符串，确定该字符串是否可以归约为产生式的起始符号，或从起始符号开始，选择合适的产生式，看是否能够推导出该字符串。

之所以是选择合适的，是因为可能由不同的产生式产生相同的字符串。虽然对于最终产物是相同的，但是解析器在解析时会对这种产生歧义的情况做出错误的结果，因为解析器不仅需要判断字符串是否符合语法，还要记录很多其它信息，如优先级、类型、对应到源代码等。

如下面 Lox 的表达式语法：

```
expr    -> literal
        | unary
        | binary
        | group
        | cond;
literal -> NUMBER | STRING | "true" | "false" | "nil";
unary   -> ("!" | "+" | "-") expr;
binary  -> expr op expr;
op      -> "+" | "-" | "*" | "/" | "%" | "^";
        | "==" | "!=" | "<" | "<=" | ">" | ">=";
group   -> "(" expr ")";
cond    -> expr ? expr : expr;
```

而对于如下字符串：

```
6 / 3 - 1
```

可以有如下最左推导：

```
expr
binary
expr op expr
(binary) op expr
(expr op expr) op expr
(literal op expr) op expr
(NUMBER op expr) op expr
(6 op expr) op expr
(6 / expr) op expr
(6 / literal) op expr
(6 / NUMBER) op expr
(6 / 3) op expr
(6 / 3) - expr
(6 / 3) - literal
(6 / 3) - NUMBER
(6 / 3) - 1
```

还可以有如下最左推导：

```
expr
binary
expr op expr
literal op expr
NUMBER op expr
6 op expr
6 / expr
6 / (binary)
6 / (expr op expr)
6 / (literal op expr)
6 / (NUMBER op expr)
6 / (3 op expr)
6 / (3 - expr)
6 / (3 - literal)
6 / (3 - NUMBER)
6 / (3 - 1)
```

两次都使用最左推导，但最终得到的结果在四则运算下是错的。该语法具有歧义，因为可以将该表达式看作是 `(6 / 3) - 1` 或 `6 / (3 - 1)`。

![Syntax trees](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/20250510233810078.png)

**优先级**决定了在一个包含不同运算符的混合表达式中，哪个运算符先被执行。优先级较高的运算符在优先级较低的运算符之前计算，因此优先级较高的运算符被称为**更严格的绑定**，如 `*` 的优先级比 `+` 高。

**结合性**决定在一系列相同操作符中先计算哪个操作符。若一个操作符是**左结合**的，左边的操作符在右边的操作符之前计算，如 `+` 是左结合的，而 `^` 是右结合的。

若语法中没有定义优先级和结合性，则使用多个运算符就会造成歧义。修改表达式语法，通过**分层**将不同优先级的表达式定义在不同的产生式中：

```
expression
conditon
equality
comparison
term
factor
unary
power
primary
```

每条规则仅匹配其当前优先级或更高优先级的表达式。如 `unary` 匹配一元表达式（如 `!a`）或 `primary`（如 `123`）。`term` 可以匹配 `1 + 2`，但也可以匹配 `3 * 4 / 5`，最后的 `primary` 涵盖优先级最高的形式——字面量和括号表达式。

一元表达式以一元操作符开头，后跟操作数。因为一元操作符可以嵌套，如 `!!expr`，因此可以用递归来解决，而每条规则都需要匹配该优先级或更高优先级的表达式，因此还需要使其与 `primary` 匹配：

```
unary -> ("!" | "+" | "-") unary | power;
```

然后是二元表达式，先从乘除法开始：

```
factor -> factor ("*" | "/" | "%") unary | unary;
```

但这会导致左递归，使匹配陷入死循环。

消除左递归的方法是，若有一个左递归产生式，其中 $A$ 为**非终止符**，$\alpha$ 和 $\beta$ 是**终止符或非终止符**，且 $\alpha$ 不为空串：

$$
A \rightarrow A\alpha\mid\beta
$$

通过选择 $n\ (n \ge 0)$ 次 $A \rightarrow A\alpha$，最后再选择一次 $A \rightarrow \beta$，即可产生如下字符串：

$$
\beta\alpha^n\ (n \ge 0)
$$

设 $\alpha^n$ 为 $B$，其产生式为：

$$
B \rightarrow\alpha B \mid\alpha
$$

则 $A$ 可以转化为：

$$
A \rightarrow \beta B \mid \beta \\
B \rightarrow \alpha B\mid\alpha
$$

将 $B$ 代入 $A$ 得：

$$
A \rightarrow \beta\alpha^*
$$

因此 `factor` 也可以转换，其中左递归的 `factor` 就是 $A$，`("*" | "/") unary` 就是 $\alpha$，`unary` 就是 $\beta$：

```
factor -> factor ("*" | "/" | "%") unary | unary;
↓
factor -> unary (("*" | "/" | "%") unary)*;
```

一般地，对于左递归产生式：

$$
A \rightarrow A\alpha_1 \mid A\alpha_2 \mid\cdots\mid A\alpha_n \mid \beta_1 \mid \beta_2 \mid\cdots\mid \beta_m
$$

消除左递归后的产生式为：

$$
A \rightarrow \beta_1B \mid \beta_2B \mid\cdots\mid \beta_mB \mid \beta_1 \mid \beta_2 \mid\cdots\mid \beta_m \\
B \rightarrow \alpha_1B \mid \alpha_2B \mid\cdots\mid \alpha_nB \mid \alpha_1 \mid \alpha_2 \mid\cdots\mid \alpha_n
$$

将 $B$ 代入 $A$ 得：

$$
A \rightarrow \beta_1(\alpha_1 \mid\alpha_2 \mid\cdots\mid \alpha_n)^* \\
\mid \beta_2(\alpha_1 \mid\alpha_2 \mid\cdots\mid \alpha_n)^* \\
\mid\cdots \\
\mid\beta_m(\alpha_1 \mid\alpha_2 \mid\cdots\mid \alpha_n)^* \\
= (\beta_1 \mid\beta_2 \mid\cdots\mid \beta_m)(\alpha_1 \mid\alpha_2 \mid\cdots\mid \alpha_n)^*
$$

对于**多重**左递归，如以下产生式：

$$
A \rightarrow AA\alpha\mid\beta
$$

可以把 $A$ 改写成：

$$
A \rightarrow A\alpha'\mid\beta \\
\alpha' \rightarrow A\alpha \\
$$

然后根据上述一般左递归的消除方法，可以转换成：

$$
A \rightarrow \beta B \mid\beta \\
B \rightarrow \alpha'B \mid\alpha' \\
\alpha' \rightarrow A\alpha
$$

将 $\alpha'$ 代入 $B$ 得：

$$
A \rightarrow \beta B \mid\beta \\
B \rightarrow A\alpha B \mid A\alpha
$$

此时出现了间接左递归，将 $A$ 代入 $B$ 来消除得：

$$
A \rightarrow \beta B \mid\beta \\
B \rightarrow (\beta B \mid \beta)(\alpha B \mid \alpha)
= \beta B\alpha B \mid \beta\alpha B \mid \beta B\alpha \mid \beta\alpha
$$

对于上述表达式文法，可以做如下转换：

```
expression -> condition
condition -> equality "?" condition ":" condition | equality;
equality -> comparison (("==" | "!=") comparison)*;
comparison -> term (( ">" | ">=" | "<" | "<=" ) term)*;
term -> factor (("+" | "-") factor)*;
factor -> unary (("*" | "/" | "%") unary)*;
unary -> ("!" | "+" | "-") unary | power;
power -> primary ("^" power)?;
primary -> "(" expression ")" | NUMBER | STRING | "true" | "false" | "nil";
```

这个语法虽然更复杂，但消除了歧义，可以被解析器正常解析。

## 6.2 递归下降分析

有很多解析技术，如 LL、LR、LALR、解析器组合子、Pratt 解析等，但最适合手工编码是**递归下降**。

递归下降实现简单，不需要使用像 Yacc、Bison 或 ANTLR 这种解析器生成器，可以手工编写，解析器速度快、健壮、可维护性好，且可支持复杂的错误处理。GCC、V8、LLVM、Roslyn 等大部分成熟的编译器都采用手工编码的递归下降分析算法。

递归下降是一种自顶向下解析器，从起始符号开始，如 Lox 表达式为 `expression`，一直向下进入嵌套子表达式，最后到达语法树的叶子。这与 LR 等自底向上的不同，后者从 `primary` 开始。

递归下降解析器是一种将语法规则直接翻译成命令式代码的文本翻译器。每条产生式都会变成一个函数，规则主体基本按照以下流程：

- 首先读取一个 Token 进行匹配
- 若为终止符，则匹配并消费一个 Token
- 若为非终止符，则调用对应产生式函数
- 若该产生式可重复 0 / 1 次或多次，即 `*` 或 `+`，则使用 `while`
- 若该产生式可重复 0 次或 1 次，即 `?`，则使用 `if`
- 若读取的 Token 最终不匹配，则报错

由于每条产生式都可能会调用另外产生式的函数，甚至调用自身，且是从起始符号开始解析，因此被称为递归下降。

对于可能有多个操作数的操作符，根据结合性不同也会使用不同的解析方式：

1.  左结合操作符：
    - 通常使用 `while`：循环可以不断地将新的右操作数添加到当前表达式的右侧，实现从左到右的结合
    - 从左到右迭代处理操作符
    - 如：加法 (`+`)、减法 (`-`)、乘法 (`*`)、除法 (`/`)
2.  右结合操作符：
    - 通常使用 `if` 语句和递归：递归可以先解析右侧的表达式，然后将其作为整体与左操作数结合，实现从右到左的结合。
    - 递归调用处理右边的表达式
    - 如：幂运算 (`^`)、赋值 (`=`)

### 6.2.1 Parser 类

创建一个 `Parser` 类，用于接受一个 Token 序列，并使用 `@current` 记录当前 Token 位置：

```ruby
class Lox::Parser
  def initialize(src_map:, error_collector:, tokens:)
    @src_map = src_map
    @error_collector = error_collector
    @tokens = tokens
    @current = 0
  end
end
```

为每一个产生式定义一个解析函数，从起始符号 `expr` 开始：

```ruby
class Lox::Parser
  private

  # expression -> condition
  def expression
    condition
  end
end
```

`condition` 优先级最低，首先解析：

```ruby
class Lox::Parser
  private

  # condition -> equality "?" condition ":" condition | equality
  def condition
    expr = equality

    if match_next?(Lox::TokenType::QMARK)
      then_expr = condition
      consume(Lox::TokenType::COLON, 'expect `:` after condition', from: expr)
      else_expr = condition
      expr = Lox::Ast::CondExpr.new(cond: expr, then_expr:, else_expr:, location: location(from: expr))
    end

    expr
  end
end
```

先通过解析 `condition` 得到 `expr`，然后判断终止条件，定义一个 `match_next?` 来匹配。

```ruby
class Lox::Parser
  private

  def match_next?(*types)
    if check?(*types)
      advance
      true
    else
      false
    end
  end
end
```

`match_next?` 会判断当前的 Token 是否属于给定的类型之一，然后消费该 Token 并返回 `true`，否则返回 `false` 并保留当前 Token。其中又定义了 `check` 和 `advance`：

```ruby
class Lox::Parser
  private

  def advance
    @current += 1 unless at_end?
    previous
  end

  def check?(*types)
    !at_end? && types.include?(peek.type)
  end
end
```

而这些方法又基于 `at_end?`、`peek` 和 `previous`：

```ruby
class Lox::Parser
  private

  def at_end?
    @tokens[@current].type == Lox::TokenType::EOF
  end

  def peek
    @tokens[@current]
  end

  def previous
    @tokens[@current - 1]
  end
end
```

`at_end?` 检查 Token 是否结束，`peek` 返回还未消费的当前 Token，`previous` 会返回最后一个被消费的Token。

生成 `CondExpr` 节点时，还需要传入位置信息，定义一个 `location` 来获取指定的位置信息：

```ruby
class Lox::Parser
  private

  def location(from: previous, to: previous)
    start_offset = from.location.offset[:start]
    end_offset = to.location.offset[:end]
    Lox::Location.new(src_map: @src_map, start_offset:, end_offset:)
  end
end
```

然后是 `equality`：

```ruby
class Lox::Parser
  private

  # equality -> comparison (("==" | "!=") comparison)*
  def equality
    expr = comparison

    while match_next?(Lox::TokenType::EQUAL_EQUAL, Lox::TokenType::BANG_EQUAL)
      op = previous
      right = comparison
      expr = Lox::Ast::BinaryExpr.new(left: expr, op:, right:, location: location(from: expr))
    end

    expr
  end
end
```

匹配完中间的 Token 后，就知道要处理什么表达式，然后再次调用 `comparison` 解析右边的操作数，最后通过 `BinaryExpr` 生成一个新的语法树节点，然后继续循环。每次迭代都将结果表达式存储在同一个 `expr` 中，这样就会连续创建一个由二元操作符节点组成的左结合嵌套树。

然后 `comparison`、`term` 和 `factor` 都是类似的：

```ruby
class Lox::Parser
  private

  # comparison -> term (( ">" | ">=" | "<" | "<=" ) term)*
  def comparison
    expr = term

    while match_next?(Lox::TokenType::GREATER, Lox::TokenType::GREATER_EQUAL,
                      Lox::TokenType::LESS, Lox::TokenType::LESS_EQUAL)
      op = previous
      right = term
      expr = Lox::Ast::BinaryExpr.new(left: expr, op:, right:, location: location(from: expr))
    end

    expr
  end

  # term -> factor (("+" | "-") factor)*
  def term
    expr = factor

    while match_next?(Lox::TokenType::PLUS, Lox::TokenType::MINUS)
      op = previous
      right = factor
      expr = Lox::Ast::BinaryExpr.new(left: expr, op:, right:, location: location(from: expr))
    end

    expr
  end

  # factor -> unary (("*" | "/" | "%") unary)*
  def factor
    expr = unary

    while match_next?(Lox::TokenType::STAR, Lox::TokenType::SLASH, Lox::TokenType::PERCENT)
      op = previous
      right = unary
      expr = Lox::Ast::BinaryExpr.new(left: expr, op:, right:, location: location(from: expr))
    end

    expr
  end
end
```

然后是 `unary`：

```ruby
class Lox::Parser
  private

  # unary -> ("!" | "+" | "-") unary | power
  def unary
    if match_next?(Lox::TokenType::BANG, Lox::TokenType::PLUS, Lox::TokenType::MINUS)
      op = previous
      right = unary
      Lox::Ast::UnaryExpr.new(op:, right:, location: location(from: op))
    else
      power
    end
  end
end
```

需要先检查 Token 以确认要如何解析。若是 `!`、`+` 或 `-`，则一定是一个一元表达式，接着就可以递归调用 `unary` 来解析操作数，并将所有这些都包装到 `UnaryExpr` 节点中。

然后是 `power`：

```ruby
class Lox::Parser
  private

  # power -> primary ("^" power)?
  def power
    expr = primary

    if match_next?(Lox::TokenType::CARET)
      op = previous
      right = power
      expr = Lox::Ast::BinaryExpr.new(left: expr, op:, right:, location: location(from: expr))
    end

    expr
  end
end
```

需要注意的是，`power` 是**右结合**的，因此不使用 `while`，而是 `if`，这样可以递归调用处理右边的表达式。

最后是 `primary`：

```ruby
class Lox::Parser
  private

  # primary -> "(" expression ")"
  #            | NUMBER
  #            | STRING
  #            | "true"
  #            | "false"
  #            | "nil"
  def primary
    from = peek
    if match_next?(Lox::TokenType::LEFT_PAREN)
      expr = expression
      consume(Lox::TokenType::RIGHT_PAREN, 'expect `)` after expression', from:)
      Lox::Ast::GroupExpr.new(expr:, location: location(from:))
    elsif match_next?(Lox::TokenType::NUMBER, Lox::TokenType::STRING)
      Lox::Ast::LiteralExpr.new(value: previous.literal, location:)
    elsif match_next?(Lox::Keyword::TRUE, Lox::Keyword::FALSE, Lox::Keyword::NIL)
      value_map = { 'true' => true, 'false' => false, 'nil' => nil }
      Lox::Ast::LiteralExpr.new(value: value_map[previous.lexeme], location:)
    end
  end
end
```

该产生式大部分是终止符，可以直接解析成字面量，对于嵌套的 `expression`，则利用同样的方式解析。

## 6.3 语法错误

解析器除了需要解析 Token 序列生成语法树外，还需要对无效的 Token 进行错误处理。现代编辑器中的 LSP 为了语法高亮和自动补齐等功能，在编辑代码时，解析器就会不断地重新解析代码，这表示总会遇到不完整的、半错误状态的代码。

当遇到错误时，解析器必须：

- 检测并报告错误
- 避免崩溃或挂起

还需尽可能做到：

- 快速解析
- 尽可能报告多个错误
- 最小化级联错误
- 尽可能从错误中恢复

对于级联错误，通常是由于发生了一个错误时，会导致后续本来正确的代码也被视为了错误，这会让用户错误的认为自己的代码含有大量的错误。因此当发生错误时，解析器应尽可能地从错误中恢复。

### 6.3.1 恐慌模式错误恢复

**恐慌模式**（Panic mode）是一种成熟的恢复技术。一旦解析器遇到一个错误，就进入恐慌模式。此时至少有一个 Token 是没有意义的，且当前解析器处于一些产生式的堆栈中间。

要继续进行解析，需要将状态和要读取的 Token 对齐，使下一个 Token 能够匹配正确的产生式，该过程称为**同步**（Synchronization）。

要进行同步，需要选择一些产生式来当作同步点，解析器会跳出所有嵌套的产生式直到退回到同步点以修复解析状态，并不断丢弃标记直到第一个可以匹配同步点的 Token。

这些被丢弃的 Token 所对应的语法错误都不会被报告，但由初始错误引起的级联错误也不会被报告，这是一种较好的平衡。

### 6.3.2 进入恐慌模式

添加错误类：

```ruby
class Lox::Error::ParserError < Lox::Error; end
class Lox::Error::NotExprError < Lox::Error::ParserError; end
```

在 `condition` 和 `primary` 中，有一行调用 `consume` 来检查需要的 Token 是否匹配，否则抛出错误，实现如下：

```ruby
class Lox::Parser
  private

  def error_context(from:, to:)
    Lox::Context.new(src_map: @src_map, location: location(from:, to:))
  end

  def add_error(message = 'unknown parsing error', error_type: Lox::Error::ParserError, from: previous, to: previous)
    @error_collector.add(error_type.new(message, error_context(from:, to:)))
    raise error_type
  end

  def consume(token_type, message = 'unknown parsing error', error_type: Lox::Error::ParserError, from: previous, to: previous)
    check?(token_type) ? advance : add_error(message, error_type:, from:, to:)
  end
end
```

其主要作用就是检查下一个标记是否是预期的类型。若是就消费该标记，否则就进行错误处理，并传递错误上下文。

### 6.3.3 同步递归下降解析器

在递归下降时，解析器当前处于某个产生式的状态是没有被保存在字段中的，但可以使用 Ruby 本身的调用栈来跟踪解析器当前状态。每条正在被解析的规则都是栈上的一个调用帧。要重置状态，可以清除这些调用帧。

最自然的方式就是通过异常来进行清理，因此在 `add_error` 中抛出指定的错误类型，然后在解析器最顶层处理，这样就可以在语句边界上同步。

进行同步需要丢弃标记，直至达到下一条语句的开头。这个边界很容易判断，如在 `;` 后就视为语句结束，以及大多数语句都以 `if`、 `while`、 `return`、 `class` 等关键字开头。当下一个标记是其中之一时，表示一条新语句的开始，只需要丢弃新语句之前的标记就可以完成同步。

```ruby
class Lox::Parser
  private

  def sync
    until at_end?
      case peek.type
      when Lox::TokenType::SEMICOLON, Lox::TokenType::LEFT_BRACE,
        Lox::Keyword::VAR,
        Lox::Keyword::IF,
        Lox::Keyword::WHILE, Lox::Keyword::FOR,
        Lox::Keyword::BREAK, Lox::Keyword::NEXT,
        Lox::Keyword::FN, Lox::Keyword::RETURN,
        Lox::Keyword::CLASS
        return
      else
        advance
      end
    end
  end
end
```

`sync` 会不断丢弃标记，直到发现一个语句的边界。但由于目前还没有语句，因此还没有应用，当出现错误时，就直接进入恐慌模式，一直跳出到最顶层，并停止解析。

## 6.4 调整解析器

现在基本上已经完成了对表达式的解析，但还需要增加一些错误处理。当解析器在每个语法规则的解析方法中下降时，最终会进入 `primary`。若该方法中的分支都不匹配，则表明不是一个表达式。

```ruby
class Lox::Parser
  private

  def primary
    from = peek
    if match_next?(Lox::TokenType::LEFT_PAREN)
    # ...
    else
      add_error('expect expression', error_type: Lox::Error::NotExprError, from:, to: peek)
    end
  end
end
```

同时定义一个 `parse` 方法来启动解析过程。

```ruby
class Lox::Parser
  def parse
    ast = expression
    add_error('expect `(` before expression', from: expr) if match_next?(Lox::TokenType::RIGHT_PAREN)
    add_error('expect EOF at the end of program', from: peek, to: peek) unless at_end?
    ast
  rescue Lox::Error::ParserError
    sync
    parse unless at_end?
    nil
  end
end
```

使用 `sync` 同步完后可以继续解析，这样就可以在一次解析中尽可能地报告多个错误。
