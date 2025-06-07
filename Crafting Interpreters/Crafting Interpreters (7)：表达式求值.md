# 7 表达式求值

对于语言实现来说，要执行源代码，可以将其编译为机器码，也可以编译为字节码由 VM 运行，或者编译为另一种语言，不过最简单的方式是直接执行语法树本身。

目前的解释器只支持表达式，而表达式最终会产生一个值，要计算一个表达式构成的语法树，需要对每一种表达式语法规定要如何计算出值，如字面量、操作符等。

## 7.1 值描述

在 Lox 中，值由字面量创建，由表达式计算，并存储在变量中，并将其视作 Lox 对象，但其底层是用 Ruby 写的，因此需要建立 Lox 到 Ruby 之间值的映射。

| Lox Type | Ruby Type (Value)                     |
| -------- | ------------------------------------- |
| any      | Object                                |
| nil      | NilClass (nil)                        |
| boolean  | TrueClass (true) / FalseClass (false) |
| number   | Numeric                               |
| string   | String                                |

可以看到，Ruby 本身的数据类型能够很方便的映射到 Lox 中。

## 7.2 表达式求值

在之前，已经使用访问者模式创建了一个 `ExprFormatter`，实际上这就是遍历语法树，并最终返回一个构建的字符串，本质上就是在语法树上执行，但不是求值，而是连接字符串。因此创建一个 `Interpreter` 类，作为一个新的访问者用于求值。

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def initialize(src_map:)
    @src_map = src_map
  end
end
```

### 7.2.1 字面量求值

一个表达式树的叶子节点就是字面量，而字面量就是用于产生值的语法单元。要将字面量转换为值，只需要根据字面量的类型，直接转化为 Ruby 中所映射的值就可以了。在之前构建 AST 的过程中实际上已经转化为了运行时的值，直接使用即可。

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_literal_expr(literal_expr)
    literal_expr.value
  end
end
```

### 7.2.2 括号求值

下一个要求值的节点是分组，而括号中的也是一个表达式，即最终括号中的值就是表达式的值：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_group_expr(group_expr)
    evaluate(group_expr.expr)
  end
end
```

为了计算表达式的值，引入了 `evaluate`，这会递归地计算子表达式的值并返回：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  private

  def evaluate(ast_node)
    ast_node.accept(self)
  end
end
```

### 7.2.3 一元表达式求值

和分组表达式类似，一元表达式也必须先求子表达式的值，然后根据操作符类型计算最终值：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_unary_expr(unary_expr)
    right = evaluate(unary.right)

    case unary_expr.op.type
    when Lox::TokenType::BANG
      !right
    when Lox::TokenType::PLUS
      right
    when Lox::TokenType::MINUS
      -right
    end
  end
end
```

首先调用 `evaluate` 计算右操作数的值，然后根据操作符类型对值做转换。如逻辑非操作，Lox 和 Ruby 一样，只要不是 `nil` 和 `false`，则都视为 `true`。

### 7.2.4 二元表达式求值

与一元表达式是类似的，只不过先求两边的操作数的值，最后根据中缀运算符计算最终值。

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_binary_expr(binary_expr)
    left = evaluate(binary_expr.left)
    right = evaluate(binary_expr.right)

    case binary_expr.op.type
    when Lox::TokenType::PLUS
      if (left.is_a?(String) && right.is_a?(Numeric)) || (left.is_a?(Numeric) && right.is_a?(String))
        "#{left}#{right}"
      else
        left + right
      end
    when Lox::TokenType::MINUS
      left - right
    when Lox::TokenType::STAR
      left * right
    when Lox::TokenType::SLASH
      left / right
    when Lox::TokenType::PERCENT
      left % right
    when Lox::TokenType::CARET
      left**right
    when Lox::TokenType::EQUAL_EQUAL
      left == right
    when Lox::TokenType::BANG_EQUAL
      left != right
    when Lox::TokenType::GREATER
      left > right
    when Lox::TokenType::GREATER_EQUAL
      left >= right
    when Lox::TokenType::LESS
      left < right
    when Lox::TokenType::LESS_EQUAL
      left <= right
    end
  end
end
```

这里对 `+` 操作实际上可以有两种语义，一种是数字相加，另一种是字符串连接，由于 Ruby 本身支持这种操作，所以这里把对两种不同类型的 `+` 操作合并了，仅需要额外实现数字和字符串相加的逻辑即可。若实现解释器的语言本身不支持这种操作的话，就需要判断两边值的类型，再进行对应的操作，就有可能是如下写法：

```Ruby
if left.is_a?(Numeric) && right.is_a?(Numeric)
  left + right
elsif left.is_a?(String) && right.is_a?(String)
  left.concat(right)
end
```

同样，对 `==` 操作也可能有多种语义。如 IEEE 754 规定了 `NaN == NaN` 为 `false`，或对于强类型的语言而言，`u32` 和 `i64` 不能直接比较，以及有些语言中，比较操作是通过在内部调用类似 `eq` 方法实现的，而某些类型的值如 `nil` 没有这个方法，就会造成运行时错误。这些情况都需要进行特殊处理，这里由于借用了 Ruby 自身的逻辑，因此不需要做特殊处理。

### 7.2.5 条件表达式

条件表达式需要先计算条件中的表达式的值，然后再对分支进行求值。

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_cond_expr(cond_expr)
    if evaluate(cond_expr.cond)
      evaluate(cond_expr.then_expr)
    else
      evaluate(cond_expr.else_expr)
    end
  end
end
```

## 7.3 运行时错误

在扫描和语法分析阶段，会检查词法和语法错误，并在解析时抛出。在执行语法树的过程中，也可能出现错误，如对一个字符串做减法，这虽然没有语法错误，但是并没有对这种操作进行定义，只会在执行语法树时动态地抛出，这称为**运行时错误**（Runtime error）。

目前的解释器发生这种错误时，利用 Ruby 本身的异常处理机制，会抛出错误和堆栈信息，然后退出程序。但实际用户并不需要这些信息，应该对用户隐藏这些底层细节，并抛出更加友好的错误信息。在 REPL 中执行时，应该还能够继续输入，而不是直接退出程序。

### 7.3.1 检测运行时错误

在递归遍历语法树时，出现错误后，会跳出所有的调用层，但不使用 Ruby 自己的异常机制，而是添加一个 `InterpError` 类。

```ruby
class Lox::Error::InterpError < Lox::Error; end
```

在对语法树每个表达式节点进行计算前，先进行类型检查：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_unary(unary)
    # ...
    when Lox::TokenType::MINUS
      check_operands(unary, [right])
      -right
    end
  end

  private

  def check_operands(ast_node, operands = [], types = [Numeric])
    return if operands.empty? || types.empty?

    types.any? do |type|
      operands.all? { it.is_a?(type) }
    end || error("operands must be #{types.map(&:to_s).map(&:downcase).join(', ')}", ast_node)
  end
end
```

同样的，对二元计算表达式也添加检查。其中 `+` 由于还被用作字符串连接，比较运算符还可以比较字符串大小， 因此做特殊处理。

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_binary(binary)
    # ...
    case binary_expr.op.type
    when Lox::TokenType::PLUS
      if (left.is_a?(String) && right.is_a?(Numeric)) || (left.is_a?(Numeric) && right.is_a?(String))
        "#{left}#{right}"
      else
        check_operands(binary_expr, [left, right], [String, Numeric])
        left + right
      end
    when Lox::TokenType::MINUS
      check_operands(binary_expr, [left, right])
      left - right
    when Lox::TokenType::STAR
      check_operands(binary_expr, [left, right])
      left * right
    when Lox::TokenType::SLASH
      check_operands(binary_expr, [left, right])
      begin
        left / right
      rescue ZeroDivisionError
        error('division by zero', binary_expr.right)
      end
      left / right
    when Lox::TokenType::PERCENT
      check_operands(binary_expr, [left, right])
      begin
        left % right
      rescue ZeroDivisionError
        error('division by zero', binary_expr.right)
      end
    when Lox::TokenType::CARET
      check_operands(binary_expr, [left, right])
      left**right
    when Lox::TokenType::EQUAL_EQUAL
      left == right
    when Lox::TokenType::BANG_EQUAL
      left != right
    when Lox::TokenType::GREATER
      check_operands(binary_expr, [left, right], [String, Numeric])
      left > right
    when Lox::TokenType::GREATER_EQUAL
      check_operands(binary_expr, [left, right], [String, Numeric])
      left >= right
    when Lox::TokenType::LESS
      check_operands(binary_expr, [left, right], [String, Numeric])
      left < right
    when Lox::TokenType::LESS_EQUAL
      check_operands(binary_expr, [left, right], [String, Numeric])
      left <= right
    end
  end
end
```

这样就可以对检查运行时错误，并抛出需要的错误，而不是 Ruby 内部的运行时错误。接下来需要将解释器类连接到驱动 Lox 程序的主类中。

## 7.4 连接解释器

`visit` 方法是 `Interpreter` 访问者的核心，但还需要封装一层，以方便与其它部分对接。通过创建一个 `Interpreter` 类作为执行的入口，`interpret` 方法执行 AST 然后返回结果。

```ruby
class Lox::Interpreter
  def initialize(src_map:, error_collector:, ast:)
    @src_map = src_map
    @error_collector = error_collector
    @ast = ast
  end

  def interpret
    @ast.accept(Lox::Visitor::Interpreter.new(src_map: @src_map))
  rescue Lox::Error::InterpError => e
    @error_collector.add(e)
    nil
  end
end
```

### 7.4.1 报告运行时错误

在 `Interpreter` 访问者中发生错误时调用了 `error` 方法，用于抛出一个错误，具体实现如下：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  private

  def location(ast_node)
    loc = ast_node.location
    Lox::Location.new(src_map: @src_map, start_offset: loc.offset[:start], end_offset: loc.offset[:end])
  end

  def error_context(ast_node)
    Lox::Context.new(src_map: @src_map, location: location(ast_node))
  end

  def error(message, ast_node)
    raise Lox::Error::InterpError.new(message, error_context(ast_node))
  end
end
```

这会收集上下文和位置信息，抛出错误后 `Lox::Interpreter#interpret` 会捕获并添加错误到错误收集器中。

### 7.4.2 运行解释器

然后就可以在 `Entry` 中使用，若没有错误则打印出结果的字符串表示。Ruby 内置了 `inspect` 方法，因此不需要额外增加一个 `stringify` 方法。

```ruby
class Lox::Entry
  private

  def run(repl: false, ast_only: false)
    # ...
    ast = Lox::Parser.new(src_map: @src_map, error_collector: @error_collector, tokens:).parse
    raise Lox::Error::ParserError if @error_collector.error?

    pp ast if @options[:ast] && !ast_only
    return ast if ast_only

    result = Lox::Interpreter.new(src_map: @src_map, error_collector: @error_collector, ast:).interpret
    raise Lox::Error::InterpError if @error_collector.error?

    return unless repl

    puts "#{'=>'.blue} #{result.inspect}"
  end
end
```

现在，就有一个完整的解释器管道，扫描得到 Token 序列，解析得到语法树，并在语法树上执行得到结果，且具有良好的报错信息。
