# 8 表达式和状态

目前虽然完成了表达式的解析和执行，但由于程序不支持保存状态，因此无法将值绑定到一个名称，并在之后使用这个名称。

状态的保存即解释器会记住一些状态。表达式会计算一个值，而语句不返回值，但是会执行一些操作，改变某些状态，如计算一些值并保存在一个变量中，或在屏幕上打印结果，并且这些状态的后续可以被检测到，这称为**副作用**（Side effect）。

## 8.1 语句

首先扩展 Lox 的语法以支持语句，有两种语句：

-   表达式语句：将表达式放在需要语句的位置，并在后面加上一个`;`，这主要是为了计算含有副作用表达式。
-   `print` 语句：计算一个表达式，并将结果展示给用户。通常应该在标准库中完成而不是在语言中内置，但需要在开发早期就能看到结果，因此暂时内置在语言中。

Lox 是一个动态的、命令式的语言，因此程序由一组语句构成，添加语句的生成式：

```
program   -> stmt* EOF | expr;
statement -> exprStmt | printStmt;
exprStmt  -> expr ";";
printStmt -> "print" expr ";";
```

现在程序顶层由 `program` 开始，一个程序由 0 条或多条语句构成，并含有一个 `EOF` 结束标记。强制性的添加结束标记可以确保解析器能够消费所有输入内容，而不会忽略结尾处的错误、未消耗的标记。

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
    stmts = []
    stmts << statement unless at_end?
  rescue Lox::Error::ParserError
    # ...
  end
end
```

添加用于解析语句的方法：

```ruby
class Lox::Parser
  private

  # statement -> expr_stmt | print_stmt
  def statement
    if match_next?(Lox::BuiltIn::PRINT)
      print_stmt
    else
      expr_stmt
    end
  end

  # exprStmt -> expr ";"
  def expr_stmt
    expr = expression
    add_error("expect `(` before expression", ast) if match_next?(Lox::TokenType::RIGHT_PAREN)
    consume(Lox::TokenType::SEMICOLON, "expect `;` after expression", expr)
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

