# 10 函数

## 10.1 函数调用

函数调用语法通常指向命名的函数：

```
foo(1, 2);
```

但和赋值一样，不一定是一个名称，被调用者可以是计算结果为函数的任意表达式：

```
foo()()();
```

这里有三个函数调用，第一对括号将 `foo` 作为被调用者，返回的结果是一个函数，然后第二个再将作为被调用者，第三个括号同理。

一个表达式后面的括号表示函数调用，可以看作是一种 `(` 开头的后缀运算符。该运算符比一元运算符具有更高优先级，在生成式中添加新的函数调用规则。

```
power -> call ("^" power)?;
call -> primary ("(" args? ")")*;
args -> expr ("," expr)*;
```

该规则匹配一个基本表达式，同时可以有 0 个或多个函数调用，若没有函数调用，则解析为基本表达式。当存在函数调用时，有 0 个或多个参数表达式，参数之间用逗号分隔，也允许没有参数。

更新 `bin/gen_ast` 添加函数调用节点：

```ruby
Lox::AstGenerator.new(output_path:, basename: "expr", productions: [
                        # ...
                        "call    : callee, args"
                      ]).make
```

该节点保存了被调用者表达式和参数表达式列表。

更新 `Parser`：

```ruby
class Lox::Parser
  private

  # power -> call ("^" power)?
  def power
    expr = call
    # ...
  end

  # call -> primary ("(" args? ")")*
  def call
    finish_call = lambda do |expr|
      args = []

      unless peek.type == Lox::TokenType::RIGHT_PAREN
        args << expression
        args << expression while match_next?(Lox::TokenType::COMMA)
      end

      consume(Lox::TokenType::RIGHT_PAREN, "expect `)` after arguments", expr)
      Lox::Ast::Call.new(callee: expr, args:, location: location(expr))
    end

    expr = primary

    loop do
      break unless match_next?(Lox::TokenType::LEFT_PAREN)

      expr = finish_call.call(expr)
    end

    expr
  end
end
```

首先定义了一个 lambda 表达式，用于解析括号内的内容。然后先解析基本表达式，若不是以 `(` 开始，则返回基本表达式的结果，否则就认为是一个函数调用，然后调用 `finish_call` 解析参数表达式。

`finish_call` 里面会先创建一个空参数列表，然后检查下一个是否是 `)` 来判断是否进入参数解析循环。

### 10.1.1 最大参数数量

解析参数的数量没有限制，但大多数语言通常都对参数数量做了限制，如 Java 规定参数数量不超过 255，C 则要求参数数量至少要支持 127。对于 Lox 来说，虽然可以没有限制，但设置最大参数数量可以简化字节码解释器。

添加参数数量限制：

```ruby
class Lox::Parser
  private

  def call
    finish_call = lambda do |expr|
      args = []

      unless peek.type == Lox::TokenType::RIGHT_PAREN
        args << expression
        while match_next?(Lox::TokenType::COMMA)
          add_error("cannot have more than 255 arguments", args.first, args.last) if args.size > 255
          args << expression
        end
      end
      # ...
    end
    # ...
  end
end
```

### 10.1.2 解释函数调用

添加对函数调用的访问者：

```ruby
class Lox::Visitor::ExprInterpreter < Lox::Ast::ExprVisitor
  def visit_call(call)
    callee = evaluate(call.callee)
    args = call.args.map { evaluate(it) }
    callee.call(self, args)
  end
end
```

首先对调用者进行求值，最后应该得到的是一个可供调用的结果，然后对每个参数依次求值，并将结果保存在列表中，把参数传给可供调用的 `callee` 完成调用。

可供调用的指的是一个 `Callable` 对象，该对象都包含一个 `call` 方法。

定义 `Callable` 类：

```ruby
class Lox::Callable
  def call(interpreter, args)
    raise NotImplementedError,
          "#{self.class.to_s.highlight}##{__method__.to_s.highlight} must be implemented"
  end
end
```

所有继承自 `Callable` 的类都需要实现 `call` 方法。

### 10.1.3 调用类型错误

在 `visit_call` 中求得的 `callee` 实际上并不一定是 `Callable` 的，只有函数和类才能够被调用，因此添加类型检查。

```ruby
class Lox::Visitor::ExprInterpreter < Lox::Ast::ExprVisitor
  def visit_call(call)
    # ...
    if callee.is_a?(Lox::Callable)
      callee.call(self, args)
    else
      error("can only call functions and classes", call)
    end
  end
end
```

### 10.1.4 检查元数

**元数**（Arity）指一个操作所期望的参数数量，该数量在声明时确定。若元数为 3 的函数，在调用时只接受了 2 个参数，或接受了 4 个参数，即元数不匹配，不同的语言对此有不同的处理方式。JavaScript 会将多余的参数忽略，缺少的参数会用 `undefined` 来补充；而 Python 则必须要求参数数量匹配，否则抛出运行时错误。

Lox 要求参数数量必须一致，在 `Callable` 中添加元数属性：

```ruby
class Lox::Callable
  attr_reader :arity

  def initialize(arity = 0)
    @arity = arity
  end
end
```

然后在 `visit_call` 中添加元数检查：

```ruby
class Lox::Visitor::ExprInterpreter < Lox::Ast::ExprVisitor
  def visit_call(call)
    # ...
    if callee.is_a?(Lox::Callable)
      error("expected #{callee.arity} arguments but got #{args.size}", call) if callee.arity != args.size
      callee.call(self, args)
    else
      error("can only call functions and classes", call)
    end
  end
end
```

在 `visit_call` 中统一做检查而不是在实现 `call` 时做检查可以避免验证逻辑分散在多个类中。

## 10.2 原生函数

现在就可以调用函数了，但是目前还没有任何可以调用的函数，也还没有实现函数声明功能，但可以有**原生函数**（Native function）。

原生函数也叫本地函数，是解释器内部实现的，用户可以直接调用，但并不是由 Lox 编写，而是由实现 Lox 的语言编写（Ruby），这些函数也叫做**原语**（Primitive）、**外部函数**（External function）或**外来函数**（Foreign function）。

语言本身提供的原生函数是非常关键的，因为通常这些函数提供了对基础服务的访问，如文件系统访问等，如果让用户使用 Lox 来实现这个功能那将会非常困难甚至无法做到。

许多语言还允许用户提供自己的原生函数，称为**外来函数接口**（Foreign function interface，FFI）、**原生扩展**（Native extension）或**原生接口**（Native interface），这种机制允许语言实现者无需提供对底层平台所有功能的访问。

### 10.2.1 报时

衡量一个程序的性能其中一点就是时间，这需要进行基准测试，而要测量 Lox 代码的性能，就需要一个能计算时间的功能。通常的做法是在程序的一个部分前后插入两行获取当前时间的函数，最后计算两者的间隔就能计算出执行时间。但这需要访问系统底层时钟，这可以通过添加一个原生的报时函数来解决。

`unix_stamp` 是一个原生函数，返回当前 unix 时间戳，两次连续调用可以计算出时间间隔，该函数定义在全局作用域内，这样整个解释器都可以访问该函数。

新增一个 `Global` 类，用于定义全局生效的项：

```ruby
class Lox::Global
  attr_reader :env

  def initialize
    @env = Lox::Env.new
    define_native_functions
  end

  private

  def define_native_functions
    @env.define("unix_stamp", Lox::NativeFunction.new do |_interpreter, _args|
      Time.now.to_f
    end)
  end
end
```

`Global` 定义了一个新的环境，初始化会调用 `define_native_functions` 在这个新环境中定义项。`NativeFunction` 用于定义原生函数，其继承自 `Callable`，因此具有 `call` 方法。

定义 `NativeFunctino` 类：

```ruby
class Lox::NativeFunction < Lox::Callable
  def initialize(arity = 0, &block)
    super(arity)
    @block = block
  end

  def call(interpreter, args)
    @block&.call(interpreter, args)
  end

  def to_s
    "<native fn>"
  end
end
```

修改 `Entry`，将 `Global` 传递进去，使其成为最外层的环境。

```ruby
class Lox::Entry
  def initialize
    # ...
    @env = Lox::Env.new(Lox::Global.new.env)
  end
end
```

当在 `Parser` 中解析函数调用时，若没有遇到括号，则会当成 `primary` 来解析。当直接使用函数名称但不带括号时，则会把该函数当成一个 `Var` 对象，返回并不是一个简单值。

期望在函数上下文时，对一个函数名称求值，返回一个简单字符串，即 `NativeFunction` 中定义的 `to_s` 方法。

增加一个 `@fun_ctx` 用于表示当前是否为函数上下文：

```ruby
class Lox::Visitor::ExprInterpreter < Lox::Ast::ExprVisitor
  def initialize(src_map, env)
    # ...
    @fun_ctx = false
  end
end
```

修改 `visit_var` 和 `visit_call`：

```ruby
class Lox::Visitor::ExprInterpreter < Lox::Ast::ExprVisitor
  def visit_var(var)
    result = @env.value(var)
    return result if @fun_ctx

    if @env.value(var).is_a?(Lox::Callable)
      result.to_s
    else
      result
    end
  # ...
  end

  def visit_call(call)
    @fun_ctx = true
    # ...
  ensure
    @fun_ctx = false
  end
end
```

## 10.3 函数声明

