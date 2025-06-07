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
  MAX_ARGS = 255

  private

  def call
    finish_call = lambda do |expr|
      args = []

      unless peek.type == Lox::TokenType::RIGHT_PAREN
        args << expression
        while match_next?(Lox::TokenType::COMMA)
          add_error("cannot have more than #{MAX_ARGS} arguments", args.first, args.last) if args.size > MAX_ARGS
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
class Lox::Visitor::Interpreter < Lox::Visitor::Base
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
class Lox::Visitor::Interpreter < Lox::Visitor::Base
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
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_call(call)
    # ...
    if callee.is_a?(Lox::Callable)
      error("expected #{callee.arity} arguments but got #{args.size}", call) if callee.arity != args.size
      callee.call(Lox::Visitor::Interpreter.new(@src_map, @env), args)
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

`unixstamp` 是一个原生函数，返回当前 unix 时间戳，两次连续调用可以计算出时间间隔，该函数定义在全局作用域内，这样整个解释器都可以访问该函数。

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
    @env.define("unixstamp", Lox::NativeFunction.new do |_interpreter, _args|
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
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def initialize(src_map, env)
    # ...
    @fun_ctx = false
  end
end
```

修改 `visit_var` 和 `visit_call`：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
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

现在就可以添加函数声明的产生式了：

```
decl -> varDecl | funDecl | stmt;
funDecl -> "fun" func;
func -> IDENT "(" params? ")" blockStmt;
params -> IDENT ("," IDENT)*;
```

一个函数声明以 `fun` 开头，然后引入了 `func` 来描述后面的部分：一个标识符，一对括号，括号中有 0 个或多个参数。在后面定义类中的方法时，可以复用 `func`。

更新 `bin/gen_ast`，添加函数声明节点：

```ruby
Lox::AstGenerator.new(output_path:, basename: "stmt", productions: [
                        # ...
                        "varStmt   : ident, expr",
                        "funStmt   : ident, params, body",
                        # ...
                      ]).make
```

函数声明节点由标识符、参数和函数体构成。

更新 `Parser`，添加函数声明解析：

```ruby
class Lox::Parser
  private

  # declaration -> var_decl | fun_decl | statement
  def declaration
    if match_next?(Lox::Keyword.key("var"))
      var_decl
    elsif match_next?(Lox::Keyword.key("fun"))
      fun_decl
    else
      statement
    end
  end

  # fun_decl -> "fun" func
  def fun_decl
    func
  end

  # func -> IDENT "(" params? ")" block_stmt
  def func
    from = previous
    advance
    if Lox::Keyword.key?(previous.type) || Lox::BuiltIn.key?(previous.type)
      add_error("expected identifier, found keyword or built-in", previous, previous)
    elsif previous.type != Lox::TokenType::IDENT
      add_error("expect identifier", previous, previous)
    end
    ident = previous
    consume(Lox::TokenType::LEFT_PAREN, "expect `(` after identifier")
    params_from = previous
    param_list = params
    consume(Lox::TokenType::RIGHT_PAREN, "expect `)` after parameters", params_from)
    consume(Lox::TokenType::LEFT_BRACE, "expect `{` before function body")
    Lox::Ast::FunStmt.new(ident:, params: param_list, body: block_stmt, location: location(from))
  end

  # params -> IDENT ("," IDENT)*
  def params
    params_list = []
    unless peek.type == Lox::TokenType::RIGHT_PAREN
      params_list << consume(Lox::TokenType::IDENT, "expect identifier", peek)
      while match_next?(Lox::TokenType::COMMA)
        add_error("cannot have more than #{MAX_ARGS} parameters", params_list.first, params_list.last) if params_list.size > MAX_ARGS
        params_list << consume(Lox::TokenType::IDENT, "expect identifier", peek)
      end
    end
    params_list
  end
end
```

注意在调用 `block_stmt` 前，需要先消费 `{`，因为 `block_stmt` 假定前面已经出现过该符号。

## 10.4 函数对象

现在能够定义函数了，但是在调用函数之前，需要考虑一个函数对象如何表示。在调用一个函数时，需要跟踪形参，以便将形参与实参进行绑定。

对于一个可以被调用的对象，其继承了 `Callable`，原生函数 `NativeFunction` 就是如此，而自定义的函数也应该这样，可以定义一个 `UserFunction` 类来继承。

```ruby
class Lox::UserFunction < Lox::Callable
  def initialize(decl)
    super(decl.params.size)
    @decl = decl
  end

  def call(interpreter, args)
    env = Lox::Env.new(interpreter.env)
    @decl.params.each_with_index do |param, i|
      env.define(param.lexeme, args[i])
    end

    interpreter.execute_block(@decl.body, env)
  end

  def to_s
    "<fn #{@decl.ident.lexeme}>"
  end
end
```

一个用户定义的函数接受一个 `FunStmt` 对象。首先获得实参数量，因为在实际调用时需要验证是否与形参相符。

然后定义 `call` 方法，这部分是最重要的，因为参数是函数的核心，且参数只能在函数中使用，其它地方是无法看到的。这表示每个函数都有自己的环境，并在其中存储这些变量，且该环境必须动态创建，这样在递归调用时就不会影响调用者的环境，即使是同一个函数。

通过创建一个新的环境，并链接到当前环境，然后遍历形参和实参列表，并把参数绑定进这个动态创建的环境中。

如类似这样的代码：

```
fun add(a, b, c) {
    print a + b + c;
}

add(1, 2, 3);
```

在调用 `add` 时，解释器会创建一个新的环境，并将这三个参数绑定进去。

![Binding](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/20250510233611212.png)

通过最后通过 `interpreter.execute_block` 来指定函数体，并把这个动态创建的 `env` 传进去，块执行完毕后会返回一个 `nil`。

最后定义 `to_s` 方法，这样在直接执行函数名而不进行调用时，就会打印出函数名。修改 REPL 模式下的输出，不然会直接把函数的 AST 给打印出来。

```ruby
class Lox::Entry
  private

  def run(repl: false)
    # ...
    return unless repl

    if result.is_a?(Lox::Callable)
      puts "#{"=>".blue} #{result}"
    else
      puts "#{"=>".blue} #{result.inspect}"
    end
  end
end
```

### 10.4.1 解释函数声明

现在就可以解释函数声明了，添加对函数声明的访问者，用于创建一个 `UserFunction`，并把该函数保存在定义时的环境中，这样名称就能被找到。

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  attr_accessor :env

  def visit_fun_stmt(fun_stmt)
    user_function = Lox::UserFunction.new(fun_stmt)
    @env.define(fun_stmt.ident.lexeme, user_function)
    nil
  end
end
```

## 10.5 return 语句

可以将参数传递到函数中，自然也可以将值从函数中返回。在基于表达式的语言中，函数会隐式地返回函数体中最后一个表达式的值，但在 Lox 中，函数体由语句构成，虽然也可以说隐式地返回 `nil`，但能够返回有意义的值会使函数功能更强大。

返回语句是一个 `return` 语句，并可选的有一个表达式，添加生成式：

```
stmt -> ... | returnStmt;
returnStmt -> "return" expr? ";";
```

返回值是可选的，用以支持从不返回值的函数中提前返回，这时相当于返回了 `nil`。

更新 `bin/gen_ast`，添加 `return` 节点：

```ruby
Lox::AstGenerator.new(output_path:, basename: "stmt", productions: [
                        # ...
                        "returnStmt : expr",
                        # ...
                      ]).make
```

更新 `Parser`：

```ruby
class Lox::Parser
  private

  # statement -> ... | return_stmt
  def statement
    # ...
    elsif match_next?(Lox::Keyword.key("return"))
      return_stmt
    else
    # ...
  end

  # return_stmt -> "return" expression? ";"
  def return_stmt
    from = previous
    expr = expression if peek.type != Lox::TokenType::SEMICOLON
    consume(Lox::TokenType::SEMICOLON, "return statement must end with `;`", from)
    add_error("return statement must be inside a function", from) if @fun_depth.zero?
    Lox::Ast::ReturnStmt.new(expr:, location: location(from))
  end
end
```

在消耗 `return` 关键字后，由于表达式是可选的，而判断是否为一个表达式比较困难，因此先查看是否为分号，如果不是，则认为是一个表达式。

同时，`return` 关键字只能在函数声明上下文中使用，因此添加一个表示函数上下文的变量：

```ruby
class Lox::Parser
  def initialize(src_map:, error_collector:, tokens:)
    # ...
    @fun_depth = 0
  end

  private

  def fun_decl
    @fun_depth += 1
    func
  ensure
    @fun_depth -= 1
  end
end
```

### 10.5.1 从函数调用中返回

解释 `return` 需要注意，`return` 可以出现在函数中的任意位置，甚至嵌套在其他语句中，而解释器需要跳出当前所在上下文，即跳出到调用者的位置。对于这种需要层层跳出的情况，和在循环中使用 `break` 类似，通过异常来处理。

添加一个错误类：

```ruby
class Lox::Error::ReturnError < Lox::Error::InterpError
  attr_reader :value

  def initialize(value = nil)
    super
    @value = value
  end
end
```

然后添加对 `return` 语句的访问者：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_return_stmt(return_stmt)
    value = return_stmt.expr ? evaluate_expr(return_stmt.expr) : nil
    raise Lox::Error::ReturnError, value
  end
end
```

如果有返回值，则对其求值，否则返回一个 `nil`，然后把这个值封装进错误类中，由上层捕获。

然后修改函数调用处的逻辑：

```ruby
class Lox::UserFunction < Lox::Callable
  def call(interpreter, args)
    # ...
  rescue Lox::Error::ReturnError => e
    e.value
  end
end
```

这样在调用时若遇到了返回，则会捕获并从中取出返回值，否则隐式返回 `nil`。

## 10.6 局部函数和闭包

每当调用一个函数时，`UserFunction` 的 `call` 方法都会创建一个新的环境，并把环境链接到调用者的环境上，这样若一个变量不在函数的作用域中定义，那么就会到更上一层的作用域去查找。

可以在函数内部嵌套定义一个局部函数，并把函数当作值返回：

```
fun makeCounter() {
  var i = 0;
  fun count() {
    i = i + 1;
    print i;
  }

  return count;
}

var counter = makeCounter();
counter(); // "1"
counter(); // "2"
```

这里 `makeCounter` 返回一个函数，绑定到 `counter` 变量上。而 `count` 使用了 `i`，即使返回时定义 `i` 的函数已经退出。

但目前 Lox 执行这段程序会报错，因为函数的环境已经被丢弃， 而 `i` 此时时未定义的。当调用 `counter` 时，此时的环境链接如下图所示。

![Global env](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/20250510233604584.png)

此时 `count` 的父环境就是全局环境，而不是 定义 `makeCounter` 中的环境。而当在 `makeCounter` 中声明 `count` 时，此时的环境链接如下图所示。

![Body env](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/20250510233600206.png)

因此，在函数声明的地方是可以看到 `i` 的，但从函数返回后就看不到了，因为解释器不会保留 `count` 的外部环境，所以需要靠函数本身来保存。一个能够保存或捕获外部环境的函数称为**闭包**（Closure），因为其封闭并保留了函数声明的外部变量。

更新 `UserFunction`，为函数对象添加一个闭包：

```ruby
class Lox::UserFunction < Lox::Callable
  def initialize(decl, clo)
    super(decl.params.size)
    @decl = decl
    @clo = clo
  end
end
```

在创建函数时，捕获当前环境并保存。这是函数声明时的环境，不是调用时的环境，因为作用域是静态的词法作用域。

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_fun_stmt(fun_stmt)
    user_function = Lox::UserFunction.new(fun_stmt, @env)
    # ...
  end
end
```

然后当调用函数时，使用该环境作为上层环境：

```ruby
class Lox::UserFunction < Lox::Callable
  def call(interpreter, args)
    env = Lox::Env.new(@clo)
    # ...
  end
end

```

这样就创建了一个环境链，从函数体开始，经过被声明的环境，然后再到上层环境，环境链接如图所示。

![Closure env](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/20250510233553608.png)

## 10.7 Lambda 表达式

Lox 的函数声明是一个语句，创建一个函数并绑定到一个名称上。但在函数式的代码中，创建函数不一定需要绑定到名称，而是当作值赋给一个变量、当作参数或立即执行。这其实就是**匿名函数**或 **Lambda 表达式**。

Lox 中的 Lambda 表达式语法和函数基本一致，除了没有标识符，其生成式为：

```
primary -> ... | lambdaFun;
lambdaFun -> "fun" "(" params? ")" blockStmt;
```

更新 `bin/gen_ast`，添加 Lambda 表达式节点：

```ruby
Lox::AstGenerator.new(output_path:, basename: "expr", productions: [
                        # ...
                        "lambdaFun : params, body"
                      ]).make
```

更新 `Parser`，解析 Lambda 表达式：

```ruby
class Parser
  private

  # primary -> ...
  #            | lambda_fun
  def primary
    # ...
    if match_next?(Lox::TokenType::LEFT_PAREN)
      # ...
    elsif match_next?(Lox::Keyword.key("fun"))
      begin
        @fun_depth += 1
        lambda_fun
      ensure
        @fun_depth -= 1
      end
    else
      # ...
    end
  end

  # lambda_fun -> "fun" "(" params? ")" block_stmt
  def lambda_fun
    from = previous
    consume(Lox::TokenType::LEFT_PAREN, "expect `(` in lambda function")
    param_list = params
    consume(Lox::TokenType::RIGHT_PAREN, "expect `)` after parameters")
    consume(Lox::TokenType::LEFT_BRACE, "expect `{` before function body")
    Lox::Ast::LambdaFun.new(params: param_list, body: block_stmt, location: location(from))
  end
end
```

由于 `fun` 在非明确的表达式上下文中，会先被当作函数声明来解析，因此在函数声明解析中，若没有遇到标识符就会报错，需要修改此处的逻辑，使其在没有标识符时，当作表达式来解析：

```ruby
class Parser
  private

  def declaration
    if match_next?(Lox::Keyword.key("var"))
      var_decl
    elsif peek.type == Lox::Keyword.key("fun") && @tokens[@current + 1].type != Lox::TokenType::LEFT_PAREN
      advance
      fun_decl
    else
      statement
    end
  end

  def func
    from = previous
    advance
    add_error("expected identifier, found keyword or built-in", previous, previous) if Lox::Keyword.key?(previous.type) || Lox::BuiltIn.key?(previous.type)
    # ...
  end
end
```

这里前瞻了两个 Token 来判断到底是声明还是 Lambda 表达式，然后函数声明不会再报标识符错误了，因此去掉。

由于 Lambda 表达式也是一个 `Callable`，因此需要修改 `UserFunction` 的 `to_s` 方法，使其打印出不一样的字符串表示。

```ruby
class Lox::UserFunction < Lox::Callable
  def to_s
    @decl.respond_to?(:ident) ? "<fn #{@decl.ident.lexeme}>" : "<lambda fn>"
  end
end
```

最后添加对 Lambda 表达式的访问者：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_lambda_fun(lambda_fun)
    Lox::UserFunction.new(lambda_fun, @env)
  end
end
```
