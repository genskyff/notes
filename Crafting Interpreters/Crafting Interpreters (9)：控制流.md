# 9 控制流

## 9.1 图灵机

可计算性理论主要研究的是一个问题是否是可计算的，可计算的问题是否是有穷的。若把这个计算步骤封装成一个函数，那么就变成什么函数是可计算的。这些可计算函数组成的系统有多种，其中比较著名计算模型就是图灵的图灵机和邱奇的 λ 演算，在计算能力上两者是等价的，而在编程语言中，任何具有最低表达能力的语言都可以计算任何可计算函数，任何具备这一点的语言被称为**图灵完备**（Turing-complete）的。

若一个语言具备算术、控制流以及分配和使用任意内存大小（理论上）的能力，则可以看作是图灵完备的。

目前 Lox 可以进行算术运算，能够定义变量（分配和使用内存），还缺少控制流的能力。

## 9.2 条件执行

条件或分支流控制用来选择性的执行某些代码，循环控制流用来多次执行某些代码，也可以使用条件来停止循环。

先从分支开始。在 C 中，主要有 `if` 语句和条件运算符构成的表达式来表达分支。Lox 已经有了条件表达式，再添加 `if` 语句的产生式。

```
exec_stmt -> print_stmt
             | block_stmt
             | if_stmt
             | expr_stmt;
if_stmt -> "if" expr block_stmt ("else" (if_stmt | block_stmt))?;
```

`if` 语句以一个表达式作为条件，然后是条件为真时要执行的块，并可选的 `else` 分支。`if` 语句可以嵌套，这样就可以支持 `else if` 的形式而不用额外添加一个像 `elsif` 这样的关键字。

更新 `bin/gen_ast` 添加 `ifStmt` 节点：

```ruby
Lox::AstGenerator.new(output_path:, type: 'stmt', productions: [
                        # ...
                        'ifStmt     : cond, then_branch, else_branch',
                        'exprStmt   : expr'
                      ]).generate
```

更新 `Parser`，解析 `if` 语句：

```ruby
class Lox::Parser
  private

  # execution -> ";"
  #              | print_stmt
  #              | block_stmt
  #              | if_stmt
  #              | expr_stmt
  def execution
    if match_next?(Lox::TokenType::SEMICOLON)
    # ...
    elsif match_next?(Lox::Keyword::IF)
      if_stmt
    else
      expr_stmt
    end
  end

  # if_stmt -> "if" expression block_stmt ("else" (if_stmt | block_stmt))?
  def if_stmt
    from = previous
    cond = expression
    consume(Lox::TokenType::LEFT_BRACE, 'expect `{` before then branch')
    then_branch = block_stmt
    else_branch = if match_next?(Lox::Keyword::ELSE)
                    if match_next?(Lox::Keyword::IF)
                      if_stmt
                    else
                      consume(Lox::TokenType::LEFT_BRACE, 'expect `{` before else branch')
                      block_stmt
                    end
                  end
    Lox::Ast::IfStmt.new(cond:, then_branch:, else_branch:, location: location(from:))
  end
end
```

若遇到 `if` 关键字，就解析表达式，然后解析分支。若语言允许单行而不需要块，则嵌套 `if` 时解析可能会引起一些歧义。

在 C 中，像这样单行的 `if` 嵌套：

```c
if (first)
    if (second)
        printf("1");
else
    printf("2");
```

由于 `else` 是可选的，当嵌套时 `else` 关联的 `if` 会难以判断。可以定义一个新的语法来避免歧义，如一种允许带有 `else` 的语句，另一种不允许，但这样可能会更加迷惑。实际上大多数语言和解析器通过总是将 `else` 与最近的 `if` 配对来解决这个问题。

因此上面这段实际上应该是这样的：

```c
if (first)
    if (second)
        printf("1");
    else
        printf("2");
```

Lox 以及有些语言这不允许这种单独的语句，而是强制使用花括号，则不存在这种问题。

```
if (first) {
    if (second) {
        print 1;
    } else {
        print 2;
    }
}
```

在 `Interpreter` 中添加 `if_stmt` 的访问者方法：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_if_stmt(if_stmt)
    if evaluate(if_stmt.cond)
      execute(if_stmt.then_branch)
    elsif if_stmt.else_branch
      execute(if_stmt.else_branch)
    end
  end
end
```

注意这里只会执行对应的分支，从而避免了另一个分支中可能的副作用。

## 9.3 逻辑操作符

逻辑运算和其他二元运算不同，因为是**短路**（Short-circuit）运算。

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
Lox::AstGenerator.new(output_path:, type: 'expr', productions: [
                        # ...
                        'logicExpr    : left, op, right'
                      ]).generate
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

    while match_next?(Lox::Keyword::OR)
      op = previous
      right = logic_and
      expr = Lox::Ast::LogicExpr.new(left: expr, op:, right:, location: location(from: expr))
    end

    expr
  end

  # logic_and -> equality ("and" equality)*
  def logic_and
    expr = equality

    while match_next?(Lox::Keyword::AND)
      op = previous
      right = equality
      expr = Lox::Ast::LogicExpr.new(left: expr, op:, right:, location: location(from: expr))
    end

    expr
  end
end
```

在 `Interpreter` 中添加 `logic` 的访问者方法：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_logic_expr(logic_expr)
    left = evaluate(logic_expr.left)

    if logic_expr.op.type == Lox::Keyword::OR
      return true if left
    else
      return false unless left
    end

    !!evaluate(logic_expr.right)
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

`while` 循环和 `if` 结构上是类似的，只不过没有 `else` 分支，更新产生式：

```
exec_stmt -> print_stmt
             | block_stmt
             | if_stmt
             | while_stmt
             | expr_stmt;
while_stmt -> "while" expr block_stmt;
```

更新 `bin/gen_ast` 生成 `while` 的语法节点：

```ruby
Lox::AstGenerator.new(output_path:, type: 'stmt', productions: [
                        # ...
                        'whileStmt  : cond, body'
                      ]).make
```

更新 `Parser`，几乎和 `if` 一样的解析步骤：

```ruby
class Lox::Parser
  private

  # execution -> ";"
  #              | print_stmt
  #              | block_stmt
  #              | if_stmt
  #              | while_stmt
  #              | expr_stmt
  def execution
    if match_next?(Lox::TokenType::SEMICOLON)
    # ...
    elsif match_next?(Lox::Keyword::WHILE)
      while_stmt
    else
      expr_stmt
    end
  end

  # while_stmt -> "while" expression block_stmt
  def while_stmt
    from = previous
    cond = expression
    consume(Lox::TokenType::LEFT_BRACE, 'expect `{` before while body')
    body = block_stmt
    Lox::Ast::WhileStmt.new(cond:, body:, location: location(from:))
  end
end
```

然后添加 `while` 的访问者方法：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_while_stmt(while_stmt)
    while evaluate(while_stmt.cond)
      execute(while_stmt.body)
    end
  end
end
```

现在 Lox 就已经基本实现了图灵完备。

## 9.5 for 循环

最后是 C 风格的 `for` 循环，看起来像这样：

```javascript
for var i = 0, j = i; i + j < 100; i += 1, j += i {
    print i + j;
}
```

更新语句的产生式：

```
exec_stmt -> print_stmt
             | block_stmt
             | if_stmt
             | while_stmt
             | for_stmt
             | expr_stmt;
for_stmt -> "for" for_init? ";" expr? ";" items? block_stmt;
for_init -> "var" var_defs | expr;
items -> expression ("," expression)*;
```

有三个由分号分隔的子句，且都可以忽略：

-   第一个是初始化式，在整个 `for` 中只会执行一次，通常是一个表达式或作用域为 `for` 的其余部分的变量声明。
-   第二个条件表达式，会在每次循环开始前执行一次，若为真则执行循环体，否则结束循环。
-   第三个是增量式，在每次结束循环时执行。

### 9.5.1 语法脱糖

`for` 语句咋一看多了很多部分，但实际上都可以用已有的语句实现，换句话说，Lox 其实不需要 `for` 语句，只是这样能够让代码更容易编写，所有这类功能被称为**语法糖**（Syntactic sugar），像赋值 `+=` 这类可由已有功能组合实现的也可以称为语法糖。

所有的 `for` 都可以用 `while` 来完成：

```
{
  var i = 0;
  while i < 10 {
    print i;
    i += 1;
  }
}
```

这个 `while` 的写法与 `for` 的语义完全等价。因此没有必要为语言添加一个 `for` 节点，而是通过**脱糖**（Desugaring）——将使用语法糖的代码转换成更基础形式的组合来实现，`for` 就可以脱糖为 `while` 和其他解释器已经可以处理语句。

但这种不添加额外节点的做法，在某些情况下并不会带来实现上的便利性，如要为语言实现格式化工具，由于 `for` 是用的组合实现，因此实际上语法树没有保存原始 `for` 语句的信息，导致很难生成原本的代码。

Lox 选择额外添加一个 `for` 节点，更新 `bin/gen_ast`：

```ruby
Lox::AstGenerator.new(output_path:, type: 'stmt', productions: [
                        # ...
                        'forStmt    : init, cond, inc, body',
                        'exprStmt   : expr'
                      ]).generate
```

更新 `Parser`，添加对 `for` 的解析：

```ruby
class Lox::Parser
  private

  # execution -> ";"
  #              | print_stmt
  #              | block_stmt
  #              | if_stmt
  #              | while_stmt
  #              | for_stmt
  #              | expr_stmt
  def execution
    if match_next?(Lox::TokenType::SEMICOLON)
    # ...
    elsif match_next?(Lox::Keyword::FOR)
      for_stmt
    else
      expr_stmt
    end
  end

  # for_stmt -> "for" for_init? ";" expr? ";" items? block_stmt
  def for_stmt
    from_for = previous
    init = for_init unless check?(Lox::TokenType::SEMICOLON)
    consume(Lox::TokenType::SEMICOLON, 'expect `;` after for-initializer', from: from_for)
    from_cond = peek
    cond = expression unless check?(Lox::TokenType::SEMICOLON)
    consume(Lox::TokenType::SEMICOLON, 'expect `;` after for-condition', from: from_cond)
    inc = items unless check?(Lox::TokenType::LEFT_BRACE)
    from_body = peek
    consume(Lox::TokenType::LEFT_BRACE, 'expect `{` before for body', from: from_body)
    body = block_stmt
    Lox::Ast::ForStmt.new(init:, cond:, inc:, body:, location: location(from: from_for))
  end

  # for_init -> "var" var_defs | expr ("," expr)*
  def for_init
    if match_next?(Lox::Keyword::VAR)
      var_defs
    else
      exprs = [expression]
      exprs << expression while match_next?(Lox::TokenType::COMMA)
      exprs
    end
  end

  # items -> expression ("," expression)*
  def items
    item_list = []
    unless check?(Lox::TokenType::RIGHT_PAREN)
      item_list << expression
      item_list << expression while match_next?(Lox::TokenType::COMMA)
    end
    item_list
  end
end
```

然后添加 `for` 的访问者方法：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_for_stmt(for_stmt)
    for_stmt.init&.each { it.accept(self) }
    cond = for_stmt.cond
    inc = for_stmt.inc
    while cond.nil? || evaluate(cond)
      execute(for_stmt.body)
      inc&.each { it.accept(self) }
    end
  end
end
```

## 9.6 break 和 next

通常语言中的循环还有 `break` 和 `next` 语句，用于跳出循环或立即开始下次循环。

更新产生式：

```
exec_stmt -> print_stmt
             | block_stmt
             | if_stmt
             | while_stmt
             | for_stmt
             | break_stmt
             | next_stmt
             | expr_stmt;
break_stmt -> "break" ";";
next_stmt -> "next" ";";
```

更新 `bin/gen_ast`，添加 `break` 和 `next` 节点：

```ruby
Lox::AstGenerator.new(output_path:, type: 'stmt', productions: [
                        'breakStmt',
                        'nextStmt',
                        'exprStmt   : expr'
                      ]).generate
```

这两个的产生式都是空的，因为仅仅起到一个标记作用。

添加对 `break` 和 `next` 的解析：

```ruby
class Lox::parser
  private

  # execution -> ";"
  #              | print_stmt
  #              | block_stmt
  #              | if_stmt
  #              | while_stmt
  #              | for_stmt
  #              | break_stmt
  #              | next_stmt
  #              | expr_stmt
  def execution
    if match_next?(Lox::TokenType::SEMICOLON)
    # ...
    elsif match_next?(Lox::Keyword::BREAK)
      break_stmt
    elsif match_next?(Lox::Keyword::NEXT)
      next_stmt
    else
      expr_stmt
    end
  end
end
```

注意 `break` 和 `next` 只能在循环的上下文中使用，并可以嵌套在其他需要退出的代码块和 `if` 语句中，因此这里对 `Parser` 类增加一个 `@loop_depth` 的类变量，用于记录当前循环深度，在任何深度为小于等于 0 的上下文中，都视为语法错误。

```ruby
class Lox::Parser
  def initialize(src_map:, error_collector:, tokens:)
    # ...
    @loop_depth = 0
  end

  private

  def while_stmt
    # ...
    begin
      @loop_depth += 1
      consume(Lox::TokenType::LEFT_BRACE, 'expect `{` before while body')
      body = block_stmt
    ensure
      @loop_depth -= 1
    end
    Lox::Ast::WhileStmt.new(cond:, body:, location: location(from:))
  end

  def for_stmt
    # ...
    begin
      @loop_depth += 1
      consume(Lox::TokenType::LEFT_BRACE, 'expect `{` before for body', from: from_body)
      body = block_stmt
    ensure
      @loop_depth -= 1
    end
    Lox::Ast::ForStmt.new(init:, cond:, inc:, body:, location: location(from: from_for))
  end

  # break_stmt -> "break" ";"
  def break_stmt
    from = previous
    consume(Lox::TokenType::SEMICOLON, 'break statement must end with `;`')
    add_error('break statement must be inside a loop', from:) if @loop_depth.zero?
    Lox::Ast::BreakStmt.new(location: location(from:))
  end

  # next_stmt -> "next" ";"
  def next_stmt
    from = previous
    consume(Lox::TokenType::SEMICOLON, 'next statement must end with `;`')
    add_error('break statement must be inside a loop', from:) if @loop_depth.zero?
    Lox::Ast::NextStmt.new(location: location(from:))
  end
end
```

然后添加 `break` 和 `next` 的访问者方法：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
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
class Lox::Error::BreakError < Lox::Error::InterpError; end
class Lox::Error::NextError < Lox::Error::InterpError; end
```

然后修改 `while` 和 `for` 访问者方法，捕获异常：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_while_stmt(while_stmt)
    while evaluate(while_stmt.cond)
      begin
        execute(while_stmt.body)
      rescue Lox::Error::BreakError
        break
      rescue Lox::Error::NextError
        next
      end
    end
  end

  def visit_for_stmt(for_stmt)
    for_stmt.init&.each { it.accept(self) }
    cond = for_stmt.cond
    inc = for_stmt.inc
    while cond.nil? || evaluate(cond)
      begin
        execute(for_stmt.body)
      rescue Lox::Error::BreakError
        break
      rescue Lox::Error::NextError
        inc&.each { it.accept(self) }
        next
      end
      inc&.each { it.accept(self) }
    end
  end
end
```

若 `for` 是通过 `while` 和语句的组合实现的，那么这里就会面临一个问题。由于 `while` 并不包含增量式，当循环中包含 `next` 时，`for` 的正确行为应该是需要执行一次增量式，然后开始下一轮循环，通过 `while` 语法糖实现实现的话，就需要添加额外的处理，这增加了代码实现的复杂度。
