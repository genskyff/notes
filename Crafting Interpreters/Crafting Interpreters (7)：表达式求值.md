# 7 表达式求值

对于语言实现来说，要执行源代码，可以将其编译为机器码，也可以编译为字节码由 VM 运行，或者编译为另一种语言，不过最简单的方式是直接执行语法树本身。

目前的解释器只支持表达式，而表达式最终会产生一个值，要计算一个表达式构成的语法树，需要对每一种表达式语法规定要如何计算出值，如字面量、操作符等。

## 7.1 值描述

在 Lox 中，值由字面量创建，由表达式计算，并存储在变量中，并将其视作 Lox 对象，但其底层使用 Ruby 写的，因此需要建立 Lox 到 Ruby 之间值的映射。

| Lox Type | Ruby Type (Value)                     |
| -------- | ------------------------------------- |
| any      | Object                                |
| nil      | NilClass (nil)                        |
| boolean  | TrueClass (true) / FalseClass (false) |
| number   | Numeric                               |
| string   | String                                |

可以看到，Ruby 本身的数据类型能够很方便的映射到 Lox 中。

## 7.2 表达式求值

在之前，已经使用访问者模式创建了一个 `AstPrinter`，实际上这就是递归遍历语法树，并最终返回一个构建的字符串，本质上就是在语法树上执行，但不是求值，而是连接字符串。因此创建一个 `AstInterpreter` 类，作为一个新的访问者用于求值。

### 7.2.1 字面量求值

一个表达式树的叶子节点就是字面量，而字面量就是用于产生值的语法单元。要将字面量转换为值，只需要根据字面量的类型，直接转化为 Ruby 中所映射的值就可以了。在之前构建 AST 的过程中实际上已经转化为了运行时的值，直接使用即可。

`lib/parser/visitor/ast_interpreter.rb`：

```ruby
class AstInterpreter < ExpressionVisitor
  def visit_literal(literal)
    literal.value
  end
end
```

### 7.2.2 括号求值

下一个要求值的节点是分组，而括号中的也是一个表达式，即最终括号中的值就是表达式的值：

```ruby
class AstInterpreter < ExpressionVisitor
  def visit_group(group)
    evaluate(group.expression)
  end
end
```

为了计算表达式的值，引入了 `evaluate`，这会递归地计算子表达式的值并返回：

```ruby
class AstInterpreter < ExpressionVisitor
  private

  def evaluate(expression)
    expression.accept(self)
  end
end
```

### 7.2.3 一元表达式求值

和分组表达式类似，一元表达式也必须先求子表达式的值，然后根据操作符类型计算最终值：

```ruby
class AstInterpreter < ExpressionVisitor
  def visit_unary(unary)
    right = evaluate(unary.right)

    case unary.operator.type
    when TokenType::BANG
      ["nil", false].include?(right)
    when TokenType::PLUS
      right
    when TokenType::MINUS
      -right
    end
  end
end
```

首先调用 `evaluate` 计算右操作数的值，然后根据操作符类型对值做转换。如逻辑非操作，Lox 和 Ruby 一样，只要不是 `nil` 和 `false`，则都视为 `true`。

### 7.2.4 二元表达式求值

与一元表达式是类似的，只不过先求两边的操作数的值，最后根据中缀运算符计算最终值。

```ruby
class AstInterpreter < ExpressionVisitor
  def visit_binary(binary)
    left = evaluate(binary.left)
    right = evaluate(binary.right)

    case binary.operator.type
    when TokenType::PLUS
      left + right
    when TokenType::MINUS
      left - right
    when TokenType::STAR
      left * right
    when TokenType::SLASH
      left / right
    when TokenType::PERCENT
      left % right
    when TokenType::CARET
      left**right
    when TokenType::EQUAL_EQUAL
      left == right
    when TokenType::BANG_EQUAL
      left != right
    when TokenType::GREATER
      left > right
    when TokenType::GREATER_EQUAL
      left >= right
    when TokenType::LESS
      left < right
    when TokenType::LESS_EQUAL
      left <= right
    end
  end
end
```

这里对 `+` 操作实际上可以有两种语义，一种是数字相加，另一种是字符串连接，由于 Ruby 本身支持这种操作，所以这里把对两种不同类型的 `+` 操作合并了，如果实现解释器的语言本身不支持这种操作的话，就需要判断两边值的类型，再进行对应的操作，就有可能是如下写法：

```Ruby
when TokenType::PLUS
  if left.is_a?(Numeric) && right.is_a?(Numeric)
      left + right
  elsif left.is_a?(String) && right.is_a?(String)
      left.concat(right)
  end
```

同样，对 `==` 操作也可能有多种语义。如 IEEE 754 规定了 `NaN == NaN` 为 `false`，或对于有类型的语言而言，`i32` 和 `i64` 不能直接比较，以及有些语言中，比较操作是通过在内部调用类似 `eq` 方法实现的，而有些类型的值比如 `nil` 没有这个方法，就会造成运行时错误。这些情况都需要进行特殊处理，这里由于借用了 Ruby 的逻辑，因此不需要做特殊处理。

### 7.2.5 条件表达式

条件表达式需要先计算条件中的表达式的值，然后再对分支进行求值。

```ruby
class AstInterpreter < ExpressionVisitor
  def visit_condition(condition)
    cond = evaluate(condition.cond)
    if cond && cond != "nil"
      evaluate(condition.then_branch)
    else
      evaluate(condition.else_branch)
    end
  end
end
```

### 7.2.6 逗号表达式

逗号表达式中的每个子表达式都需要计算，但最后只需要保留最后一个表达式的值。

```ruby
class AstInterpreter < ExpressionVisitor
  def visit_comma(comma)
    last = nil
    comma.expressions.each do |expression|
      last = evaluate(expression)
    end
    last
  end
end
```

## 7.3 运行时错误

