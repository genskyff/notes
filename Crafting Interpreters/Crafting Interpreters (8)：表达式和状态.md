# 8 表达式和状态

目前虽然完成了表达式的解析和执行，但由于程序不支持保存状态，因此无法将值绑定到一个名称，并在之后使用这个名称。

状态的保存即解释器会记住一些状态。表达式会计算一个值，而语句不返回值，但是会执行一些操作，改变某些状态，如计算一些值并保存在一个变量中，或在屏幕上打印结果，并且这些状态的后续可以被检测到，这称为**副作用**（Side effect）。

## 8.1 语句

首先扩展 Lox 的语法以支持语句，有三种语句：

-   表达式语句：将表达式放在需要语句的位置，并在后面加上一个`;`，这主要是为了计算含有副作用表达式。
-   `print` 语句：计算一个表达式，并将结果展示给用户。通常应该在标准库中完成而不是在语言中内置，但需要在开发早期就能看到结果，因此暂时内置在语言中。
-   空语句：一个空的 `;` 构成一个空语句，即什么也不做。

Lox 是一个动态的、命令式的语言，因此程序由一组语句构成，并可选的在最后有一个表达式。

添加语句的生成式：

```
program   -> stmt* expr? EOF;
statement -> exprStmt | printStmt | ";";
exprStmt  -> expr ";";
printStmt -> "print" expr ";";
```

现在程序顶层由 `program` 开始，一个程序由 0 条或多条语句，或最后一条是一个表达式，并含有一个 `EOF` 结束标记。强制性的添加结束标记可以确保解析器能够消费所有输入内容，而不会忽略结尾处的错误、未消耗的标记。

### 8.1.1 Statement 语法树

Lox 语法中并没有地方既允许表达式也允许语句，因此两种表达式和语句式不相干的，不需要提供一个共同的基类。

在 `bin/gen_ast` 中添加：

```ruby
Lox::AstGenerator.new(output_path:, basename: "stmt", productions: [
                        "exprStmt  : expr",
                        "printStmt : expr"
                      ]).make
```

运行后就会生成 `Stmt` 对应的 AST 类型。

### 8.1.2 解析语句

之前的解析器只能解析表达式，现在修改使其能够解析语句。

修改 `parse` 方法：

```ruby
class Lox::Parser
  def parse
    program
  rescue Lox::Error::ParserError
    # ...
  end
end
```

添加用于解析语句的方法，首先是 `program`：

```ruby
class Lox::Parser
  private

  # program -> stmt* expr? EOF
  def program
    stmt_list = []
    until at_end?
      begin
        save_current = @current
        stmt = statement
        stmt_list << stmt unless stmt.nil?
      rescue Lox::Error::NotStatementError
        @current = save_current
        @error_collector.pop
        break
      end
    end

    final_expr = expression unless at_end?
    add_error("expect EOF", peek, peek, Lox::Error::ParserError) unless at_end?

    { stmts: stmt_list, expr: final_expr }
  end
end
```

因为程序最后可能含有一个表达式，因此先不断解析语句，若遇到 `NotStatementError`，就认为语句解析结束，剩下的是表达式，但由于已经添加了错误，因此从 `@error_collector` 删除最后一个错误。这里实际上是相当于进行了**预读**，用于确定剩下的是否为语句，因此结束后需要将 `@current` 复原，然后进行表达式的解析，表达式应该是程序最后一条，因此如果表达式解析完成后还没有遇到 `EOF` 则报错。这里最后返回的是一个对象，包含了语句的 AST 和表达式 AST，两者皆有可能为空。

然后是具体语句的解析方法：

```ruby
class Lox::Parser
  private

  # statement -> expr_stmt | print_stmt | ";"
  def statement
    if match_next?(Lox::BuiltIn.key("print"))
      print_stmt
    elsif match_next?(Lox::TokenType::SEMICOLON)
      nil
    else
      expr_stmt
    end
  end

  # exprStmt -> expr ";"
  def expr_stmt
    expr = expression
    add_error("expect `(` before expression", ast) if match_next?(Lox::TokenType::RIGHT_PAREN)
    consume(Lox::TokenType::SEMICOLON, "expect `;` after expression", expr, previous, Lox::Error::NotStatementError)
    Lox::Ast::ExprStmt.new(location: location(expr), expr:)
  end

  # printStmt -> "print" expr ";"
  def print_stmt
    expr = expression
    consume(Lox::TokenType::SEMICOLON, "expect `;` after expression", expr)
    Lox::Ast::PrintStmt.new(location: location(expr), expr:)
  end
end
```

### 8.1.3 执行语句

和利用访问者模式对表达式进行执行，语句也是类似的，添加用于执行语句的 `StmtInterpreter` 类：

```ruby
class Lox::Visitor::StmtInterpreter < Lox::Ast::StmtVisitor
  def initialize(src_map)
    @src_map = src_map
    @expr_interpreter = Lox::Visitor::ExprInterpreter.new(src_map)
  end

  def visit_expr_stmt(expr_stmt)
    evaluate_expr(expr_stmt.expr)
    nil
  end

  def visit_print_stmt(print_stmt)
    puts evaluate_expr(print_stmt.expr).inspect
  end

  private

  def evaluate_expr(ast_node)
    ast_node.accept(@expr_interpreter)
  end
end
```

由于语句包含了表达式，且需要对表达式进行计算，因此这里还需要利用 `ExprInterpreter` 类。和表达式不同，语句不会产生值，或者说语句隐式的返回一个空值。

然后修改 `Interpreter` 类的执行入口：

```ruby
class Lox::Interpreter
  def interpret
    if @ast.is_a?(Lox::Ast::Expr)
      @ast.accept(Lox::Visitor::ExprInterpreter.new(@src_map))
    else
      @ast&.each do |stmt|
        stmt.accept(Lox::Visitor::StmtInterpreter.new(@src_map))
      end
      nil
    end
  rescue Lox::Error::InterpreterError => e
    @error_collector.add(e)
    nil
  end
end
```

表达式和语句调用的访问者是不同的，因此在开始需要进行判断。

然后修改 `Entry` 中的 `run` 方法：

```ruby
class Lox::Entry
  private

  def run(repl: false)
    tokens = Lox::Scanner.new(src_map: @src_map, error_collector: @error_collector).scan
    raise Lox::Error::ScannerError if @error_collector.error?

    ast = Lox::Parser.new(src_map: @src_map, error_collector: @error_collector, tokens:).parse
    raise Lox::Error::ParserError if @error_collector.error?

    Lox::Interpreter.new(src_map: @src_map, error_collector: @error_collector, ast: ast[:stmts]).interpret if ast[:stmts].any?
    result = Lox::Interpreter.new(src_map: @src_map, error_collector: @error_collector, ast: ast[:expr]).interpret
    raise Lox::Error::InterpreterError if @error_collector.error?

    puts "#{"=>".blue} #{result.inspect}" if repl
  end
end
```

