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
    consume(Lox::TokenType::LEFT_PAREN, "expect `(` after if-statement")
    expr = expression
    consume(Lox::TokenType::RIGHT_PAREN, "expect `)` before if-statement", from)
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
