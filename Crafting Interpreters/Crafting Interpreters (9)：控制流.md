# 9 控制流

## 9.1 图灵机

可计算性理论主要研究的是一个问题是否是可计算的，可计算的问题是否是有穷的。若把这个计算步骤封装成一个函数，那么就变成什么函数是可计算的。这些可计算函数组成的系统有多种，其中比较著名计算模型就是图灵的图灵机和邱奇的 λ 演算，在计算能力上两者是等价的，而在编程语言中，任何具有最低表达能力的语言都可以计算任何可计算函数，任何具备这一点的语言被称为**图灵完备**（Turing-complete）的。

若一个语言具备算术、控制流以及分配和使用任意内存大小（理论上）的能力，则可以看作是图灵完备的。

目前 Lox 可以进行算术运算，能够定义变量（分配和使用内存），还缺少控制流的能力。

## 9.2 条件执行

条件或分支流控制用来选择性的执行某些代码，循环控制流用来多次执行某些代码，也可以使用条件来停止循环。

先从分支开始。在 C 中，主要有 `if` 语句和条件运算符构成的表达式来表达分支。Lox 已经有了条件表达式，再添加 `if` 语句的生成式。

```
stmt -> ";" | exprStmt | printStmt | blockStmt | ifStmt;
ifStmt -> "if" "(" expr ")" stmt ("else" stmt)?;
```

`if` 语句以一个括号包裹的表达式作为条件，然后是条件为真时要执行的语句，语句可选的 `else` 分支。

更新 `bin/gen_ast` 添加 `IfStmt` 节点：

```ruby
Lox::AstGenerator.new(output_path:, basename: "stmt", productions: [
                        # ...
                        "ifStmt    : expr, then_branch, else_branch"
                      ]).make
```

更新 `Parser`，解析 `if` 语句：

```ruby
class Lox::Parser
  private

  # statement -> ";" | expr_stmt | print_stmt | block_stmt | if_stmt
  def statement
    # ...
    elsif match_next?(Lox::Keyword.key("if"))
      if_stmt
    # ...
  end

  # if_stmt -> "if" "(" expression ")" statement ("else" statement)?
  def if_stmt
    from = previous
    consume(Lox::TokenType::LEFT_PAREN, "expect `(` after if-statement")
    expr = expression
    consume(Lox::TokenType::RIGHT_PAREN, "expect `)` before if-statement", from)
    then_branch = statement
    else_branch = statement if match_next?(Lox::Keyword.key("else"))
    Lox::Ast::IfStmt.new(expr:, then_branch:, else_branch:, location: location(from))
  end
end
```

若遇到 `if` 关键字，就解析表达式，然后解析分支，但当嵌套 `if` 时该解析可能会引起一些歧义。

```javascript
if (first)
    if (second)
        print 1;
else
    print 2;
```

由于 `else` 是可选的，当嵌套时 `else` 关联的 `if` 会难以判断。可以定义一个新的语法来避免歧义，如一种允许带有 `else` 的语句，另一种不允许，但这样可能会更加迷惑。实际上大多数语言和解析器通过总是将 `else` 与最近的 `if` 配对来解决这个问题。

Lox 的解析也同样如此，因此上面这段实际上应该是这样的：

```
if (first)
    if (second)
        print 1;
    else
        print 2;
```

有些语言这不允许这种单独的语句，而是强制使用花括号：

```
if (first) {
    if (second) {
        print 1;
    } else {
        print 2;
    }
}
```

在 `StmtInterpreter` 中添加 `if_stmt` 的访问者：

```ruby
class Lox::Visitor::StmtInterpreter < Lox::Ast::StmtVisitor
  def visit_if_stmt(if_stmt)
    if evaluate_expr(if_stmt.expr)
      execute_stmt(if_stmt.then_branch)
    elsif if_stmt.else_branch
      execute_stmt(if_stmt.else_branch)
    end
  end
end
```

注意这里只会执行对应的分支，从而避免了另一个分支中可能的副作用。

## 9.3 逻辑操作符

逻辑运算和其它二元运算不同，因为是**短路**（Short-circuit）运算。

```
true or side_effect();
false and side_effect();
```

当计算第一个操作数就知道结果时，就不需要对第二个操作数进行计算，从而避免了可能的副作用。

逻辑运算的优先级仅高于条件表达式，更新产生式：

```
condition -> logic_or "?" condition ":" condition | logic_or;
logic_or -> logic_and ("or" logic_and)*;
logic_and -> equality ("and" equality)*;
```

更新 `bin/gen_ast`，添加逻辑运算的节点：

```ruby
Lox::AstGenerator.new(output_path:, basename: "expr", productions: [
                        # ...
                        "logic   : left, op, right"
                      ]).make
```

然后修改 `Parser`，解析逻辑运算：

```ruby
class Lox::Parser
  private

  # condition -> logic_or "?" condition ":" condition | logic_or
  def condition
    expr = logic_or
    # ...
  end

  # logic_or -> logic_and ("or" logic_and)*
  def logic_or
    expr = logic_and

    while match_next?(Lox::Keyword.key("or"))
      op = previous
      right = logic_and
      expr = Lox::Ast::Logic.new(left: expr, op:, right:, location: location(expr))
    end

    expr
  end

  # logic_and -> equality ("and" equality)*;
  def logic_and
    expr = equality

    while match_next?(Lox::Keyword.key("and"))
      op = previous
      right = equality
      expr = Lox::Ast::Logic.new(left: expr, op:, right:, location: location(expr))
    end

    expr
  end
end
```

在 `ExprInterpreter` 中添加 `logic` 的访问者：

```ruby
class Lox::Visitor::ExprInterpreter < Lox::Ast::ExprVisitor
  def visit_logic(logic)
    left = evaluate(logic.left)

    if logic.op.type == Lox::Keyword.key("or")
      return true if left
    else
      return false unless left
    end

    !!evaluate(logic.right)
  end
end
```

先计算左操作数，然后看是否可以短路，不能短路时才计算右操作数。

返回的结果可以保持原始值，这样对动态语言来说就可以保持一定灵活性：

```
print "hi" or 1;    // "hi"
print nil or "yes"; // "yes"
```

也可以强制转化为逻辑值，这样语义更加明确，一切取决于语言设计，Lox 采用后者。

## 9.4 while 循环

`while` 循环和 `if` 结构上是类似的，只不过没有 `else` 分支，更新生成式：

```
stmt -> ";" | exprStmt | printStmt | blockStmt | ifStmt | whileStmt;
whileStmt -> "while" "(" expr ")" stmt;
```

更新 `bin/gen_ast` 生成 `while` 的语法节点：

```ruby
Lox::AstGenerator.new(output_path:, basename: "stmt", productions: [
                        # ...
                        "whileStmt : expr, body",
                      ]).make
```

更新 `Parser`，几乎和 `if` 一样的解析步骤：

```ruby
class Lox::Parser
  private

  # statement -> ";" | expr_stmt | print_stmt | block_stmt | if_stmt | while_stmt
  def statement
    # ...
    elsif match_next?(Lox::Keyword.key("while"))
      while_stmt
    #...
  end

  # while_stmt -> "while" "(" expression ")" statement
  def while_stmt
    from = previous
    consume(Lox::TokenType::LEFT_PAREN, "expect `(` after while-statement")
    expr = expression
    consume(Lox::TokenType::RIGHT_PAREN, "expect `)` before while-statement", from)
    body = statement
    Lox::Ast::WhileStmt.new(expr:, body:, location: location(from))
  end
end
```

然后添加对 `while` 的访问者：

```ruby
class Lox::Visitor::StmtInterpreter < Lox::Ast::StmtVisitor
  def visit_while_stmt(while_stmt)
    execute_stmt(while_stmt.body) while evaluate_expr(while_stmt.expr)
  end
end
```

现在 Lox 就已经基本实现了图灵完备。

## 9.5 for 循环

最后是 C 风格的 `for` 循环，看起来是这样的：

```javascript
for (var i = 0; i < 10; i = i + 1)
    print i;
```

更新语句的生成式：

```
stmt -> ";" | exprStmt | printStmt | blockStmt | ifStmt | whileStmt | forStmt;
forStmt -> "for" "(" (varDecl | exprStmt | ";") expr? ";" expr? ")" stmt;
```

在括号内，有 3 个分号分隔的子句，且都可以忽略：

-   第一个是初始化式，在整个 `for` 中只会执行一次，通常是一个表达式或作用域为 `for` 的其余部分的变量声明。
-   第二个条件表达式，会在每次循环开始前执行一次，若为真则执行循环体，否则结束循环。
-   第三个是增量式，在每次结束循环时执行。

### 9.5.1 语法脱糖

`for` 语句咋一看多了很多部分，但实际上都可以用已有的语句实现，换句话说，Lox 其实不需要 `for` 语句，只是这样能够让代码更容易编写，所有这类功能被称为**语法糖**（Syntactic sugar）。

所有的 `for` 都可以用 `while` 来完成：

```
{
  var i = 0;
  while (i < 10) {
    print i;
    i = i + 1;
  }
}
```

这个 `while` 的写法与 `for` 的语义完全等价。因此没有必要为语言添加一个 `for` 节点，而是通过**脱糖**（Desugaring）——将使用语法糖的代码转换成更基础形式的组合来实现，`for` 就可以脱糖为 `while` 和其它解释器已经可以处理语句。

更新 `Parser`，添加对 `for` 解析的方法：

```ruby
class Lox::Parser
  private

  # statement -> ";" | expr_stmt | print_stmt | block_stmt | if_stmt | while_stmt | for_stmt
  def statement
    # ...
    elsif match_next?(Lox::Keyword.key("for"))
      for_stmt
    # ...
  end

  # for_stmt -> "for" "(" (var_decl | expr_stmt | ";") expression? ";" expression? ")" statement
  def for_stmt
    from_for = previous
    consume(Lox::TokenType::LEFT_PAREN, "expect `(` after for-statement")
    init = if match_next?(Lox::TokenType::SEMICOLON)
             Lox::Ast::BlankStmt.new(location:)
           elsif match_next?(Lox::Keyword.key("var"))
             var_decl
           else
             expr_stmt
           end

    from_cond = peek
    cond = if peek.type == Lox::TokenType::SEMICOLON
             Lox::Ast::Literal.new(value: true, location: location(from_cond))
           else
             expression
           end
    consume(Lox::TokenType::SEMICOLON, "expect `;` after for-condition", from_cond)

    from_inc = peek
    inc = if peek.type == Lox::TokenType::RIGHT_PAREN
            Lox::Ast::BlankStmt.new(location:)
          else
            Lox::Ast::ExprStmt.new(expr: expression, location: location(from_inc))
          end
    consume(Lox::TokenType::RIGHT_PAREN, "expect `)` before for-statement", from_for)

    from_body = peek
    body = Lox::Ast::BlockStmt.new(stmts: [body, inc], location: location(from_body))
    while_part = Lox::Ast::WhileStmt.new(expr: cond, body:, location: location(from_body))
    Lox::Ast::BlockStmt.new(stmts: [init, while_part].flatten, location: location(from_body))
  end
end
```

依次对初始化、条件、增量进行解析，分别创建语法树节点，最后再和 `body` 连接起来，这样就利用现有的节点，而无需创建新的语法树节点，以及对 `StmtInterpreter` 做修改。同时 `init` 可能含有多条初始化语句构成的数组，因此需要进行 `flatten`。

## 9.6 break 和 next

通常语言中的循环还有 `break` 和 `next` 语句，用于跳出循环或立即开始下次循环。

更新产生式：

```
stmt -> ";" | exprStmt | printStmt | blockStmt | ifStmt | whileStmt | forStmt | breakStmt | nextStmt;
breakStmt -> "break" ";";
nextStmt -> "next" ";";
```

更新 `bin/gen_ast`，添加 `break` 和 `next` 语句：

```ruby
Lox::AstGenerator.new(output_path:, basename: "stmt", productions: [
                        # ...
                        "breakStmt",
                        "nextStmt"
                      ]).make
```

这两个的产生式都是空的，因为仅仅起到一个标记作用。

添加对 `break` 和 `next` 的解析：

```ruby
class Lox::parser
  private

  # statement -> ";" | expr_stmt | print_stmt | block_stmt | if_stmt | while_stmt | for_stmt | break_stmt | next_stmt
  def statement
    #...
    elsif match_next?(Lox::Keyword.key("break"))
      break_stmt
    elsif match_next?(Lox::Keyword.key("next"))
      next_stmt
    # ...
  end
end
```

注意 `break` 和 `next` 只能在循环的上下文中使用，并可以嵌套在其它需要退出的代码块和 `if` 语句中，因此这里对 `Parser` 类增加一个 `@loop_depth` 的类变量，用于记录当前循环深度，在任何深度为小于等于 0 的上下文中，都视为语法错误。

```ruby
class Lox::Parser
  def initialize(src_map:, error_collector:, tokens:)
    # ...
    @loop_depth = 0
  end

  private

  def while_stmt
    # ...
    consume(Lox::TokenType::RIGHT_PAREN, "expect `)` before while-statement", from)
    begin
      @loop_depth += 1
      body = statement
    ensure
      @loop_depth -= 1
    end
    # ...
  end

  def for_stmt
    # ...
    from_body = peek
    begin
      @loop_depth += 1
      body = statement
    ensure
      @loop_depth -= 1
    end
    # ...
  end

  # break_stmt -> "break" ";"
  def break_stmt
    from = previous
    consume(Lox::TokenType::SEMICOLON, "break statement must end with `;`", from)
    add_error("break statement must be inside a loop", from) if @loop_depth.zero?
    Lox::Ast::BreakStmt.new(location: location(from))
  end

  # next_stmt -> "next" ";"
  def next_stmt
    from = previous
    consume(Lox::TokenType::SEMICOLON, "next statement must end with `;`", from)
    add_error("break statement must be inside a loop", from) if @loop_depth.zero?
    Lox::Ast::NextStmt.new(location: location(from))
  end
end
```

然后在 `StmtInterpreter` 中添加访问者：

```ruby
class Lox::Visitor::StmtInterpreter < Lox::Ast::StmtVisitor
  def visit_break_stmt(_break_stmt)
    raise Lox::Error::BreakError
  end

  def visit_next_stmt(_next_stmt)
    raise Lox::Error::NextError
  end
end
```

这里直接通过抛出一个异常来解决，添加错误类：

```ruby
class Lox::Error::BreakError < Lox::Error::InterpreterError; end
class Lox::Error::NextError < Lox::Error::InterpreterError; end
```

然后修改 `while` 访问者，捕获异常：

```ruby
class Lox::Visitor::StmtInterpreter < Lox::Ast::StmtVisitor
  def visit_while_stmt(while_stmt)
    while evaluate_expr(while_stmt.expr)
      begin
        execute_stmt(while_stmt.body)
      rescue Lox::Error::BreakError
        break
      rescue Lox::Error::NextError
        next
      end
    end
  end
end
```

目前还有一个问题，由于 `for` 是通过 `while` 的语法糖实现的，而 `while` 并不包含增量式，当循环中包含 `next` 时，`for` 的正确行为应该是需要执行一次增量式，然后开始下一轮循环，但现在会直接跳过导致可能产生死循环。

可以通过当遇到 `next` 时，执行一次最后一条语句来解决：

```ruby
class Lox::Visitor::StmtInterpreter < Lox::Ast::StmtVisitor
  def visit_while_stmt(while_stmt)
    while evaluate_expr(while_stmt.expr)
      begin
        execute_stmt(while_stmt.body)
      rescue Lox::Error::BreakError
        break
      rescue Lox::Error::NextError
        execute_stmt(while_stmt.body.stmts.last)
        next
      end
    end
  end
end
```

在 `for` 中已经将增量式添加到最后一个语句中去了，但是 `while` 不一定，因此还需要在 `while` 解析时，把 `body` 转成块语句，然后追加一条空语句，以防止 `while` 在遇到 `next` 时执行不必要的代码。

```ruby
class Lox::Parser
  private

  def while_stmt
    # ...
    body = Lox::Ast::BlockStmt.new(stmts: [body, Lox::Ast::BlankStmt.new(location:)], location: body.location)
    Lox::Ast::WhileStmt.new(expr:, body:, location: location(from))
  end
end
```

