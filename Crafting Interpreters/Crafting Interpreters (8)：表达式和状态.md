# 8 表达式和状态

目前虽然完成了表达式的解析和执行，但由于程序不支持保存状态，因此无法将值绑定到一个名称，并在之后使用这个名称。

状态的保存即解释器会记住一些状态。表达式会计算一个值，而语句不返回值，但是会执行一些操作，改变某些状态，如计算一些值并保存在一个变量中，或在屏幕上打印结果，并且这些状态的后续可以被检测到，这称为**副作用**（Side effect）。

## 8.1 语句

首先扩展 Lox 的语法以支持语句，有两种语句：

-   `print` **语句**：计算一个表达式，并将结果展示给用户。通常应该在标准库中完成而不是在语言中内置，但需要在开发早期就能看到结果，因此暂时内置在语言中。
-   **表达式语句**：将表达式放在需要语句的位置，并在后面加上一个 `;`，这主要是为了计算含有副作用表达式。

Lox 是一个动态的、命令式的语言，因此程序由一组语句构成，并可选的在最后有一个表达式。

添加语句的生成式：

```
prog -> stmt* expr? EOF;
stmt -> print_stmt | expr_stmt;
print_stmt -> "print" expr ";";
expr_stmt  -> expr ";";
```

现在程序顶层由 `prog` 开始，一个程序由 0 条或多条语句，在结尾可选地有一个表达式，并含有一个 `EOF` 结束标记组成。强制性的添加结束标记可以确保解析器能够消费所有输入内容，而不会忽略结尾处的错误、未消耗的标记。

### 8.1.1 Statement 语法树

Lox 语法中并没有地方既允许表达式也允许语句，因此两种表达式和语句式不相干的，不需要提供一个共同的基类。

在 `bin/gen_ast` 中添加：

```ruby
Lox::AstGenerator.new(output_path:, type: 'stmt', productions: [
                        'printStmt  : value',
                        'exprStmt   : expr'
                      ]).generate
```

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

添加错误类：

```ruby
class Lox::Error::NotStmtError < Lox::Error::ParserError; end
```

添加用于解析语句的方法，首先是 `program`：

```ruby
class Lox::Parser
  private

  # program -> statement* expression? EOF
  def program
    from = peek
    stmts = []
    until at_end?
      begin
        save_current = @current
        stmt = statement
        if stmt.is_a?(Array)
          stmts.concat(stmt)
        else
          stmts << stmt
        end
      rescue Lox::Error::NotStmtError
        @current = save_current
        @error_collector.pop
        break
      end
    end
    stmts.compact!
    expr = expression unless at_end?
    add_error('expect EOF at the end of program', from: peek, to: peek) unless at_end?

    Lox::Ast::Prog.new(stmts:, expr:, location: location(from:))
  end
end
```

因为程序最后可能含有一个表达式，因此先不断解析语句，若遇到 `NotStmtError`，就认为语句解析结束，剩下的是表达式，但由于已经添加了错误，因此从 `@error_collector` 删除最后一个错误。这里实际上是相当于进行了**预读**，用于确定剩下的是否为语句，因此结束后需要将 `@current` 复原，然后进行表达式的解析，表达式应该是程序最后一条，因此如果表达式解析完成后还没有遇到 `EOF` 则报错。

然后是具体语句的解析方法：

```ruby
class Lox::Parser
  private

  # statement -> ";" | print_stmt | expr_stmt
  def statement
   if match_next?(Lox::TokenType::SEMICOLON)
      nil
    elsif match_next?(Lox::Keyword::PRINT)
      print_stmt
    else
      expr_stmt
    end
  end

  # print_stmt -> "print" expression ";"
  def print_stmt
    from = previous
    value = expression
    add_error('expect `(` before expression', from: value) if match_next?(Lox::TokenType::RIGHT_PAREN)
    consume(Lox::TokenType::SEMICOLON, 'print statement must end with `;`', from:)
    Lox::Ast::PrintStmt.new(value:, location: location(from:))
  end

  # expr_stmt -> expression ";"
  def expr_stmt
    from = previous
    expr = expression
    add_error('expect `(` before expression', from: expr) if match_next?(Lox::TokenType::RIGHT_PAREN)
    consume(Lox::TokenType::SEMICOLON, 'expression statement must end with `;`', error_type: Lox::Error::NotStmtError, from:)
    Lox::Ast::ExprStmt.new(expr:, location: location(from:))
  end
end
```

### 8.1.3 执行语句

和利用访问者模式对表达式进行执行，语句也是类似的，实现语句相关地访问者方法：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_print_stmt(print_stmt)
    value = evaluate(print_stmt.value)
    puts value
  end

  def visit_expr_stmt(expr_stmt)
    execute(expr_stmt.expr)
  end

  private

  def execute(ast_node)
    evaluate(ast_node)
    nil
  end
end
```

这里实现了一个 `execute` 方法，用于执行语句。和 `evaluate` 唯一区别为语句总是返回 `nil`。

## 8.2 全局变量

能够处理语句后，就可以开始处理状态了，先从全局变量开始。

**变量声明语句**用于创建一个新变量：

```javascript
var s = "hello";
```

该语句用于创建一个绑定，将名称和值关联起来。一旦声明完成，**变量表达式**就可以访问该绑定，当标识符 `s` 被用作一个表达式时，程序会查找与该名称绑定的值并返回。

### 8.2.1 变量语法

变量声明是一种语句，但不同于其它语句，需要特殊处理 `stmt` 语法，因为语法需要限制某个位置上哪种类型的语句是被允许的。

在 C 中，控制流语句中的子句，若只有一行，则可以省略大括号，但该语句就不能为声明语句，除非放在一个块中：

```c
if (cond) printf("hello"); // ok
if (cond) char *s = "hello"; // error
if (cond) { char *s = "hello" } // ok
```

或许也可以允许后者，但是这会导致 `s` 的作用域不清晰。语句好像有两种优先级，有些允许语句的地方，如程序顶层或块中，可以允许任何语句，其它地方只允许非声明语句和优先级更高的语句。

为了处理这种情况，Lox 对于控制语句的语句体，只允许块语句的形式，而不允许单行。并对语句进行分类，分成声明语句和执行语句。声明语句如变量声明和函数声明，执行语句如块语句和表达式语句。

修改语句的生成式：

```
stmt -> decl_stmt | exec_stmt;
decl_stmt -> var_decl;
exec_stmt -> print_stmt
             | expr_stmt;
```

声明语句属于新的 `decl_stmt` 规则，目前有变量声明，后续还会添加函数和类。

对 `var_decl` 进行定义：

```
var_decl -> "var" var_defs ";";
var_defs -> var_def ("," var_def)*;
var_def -> IDENT ("=" expr)?;
```

变量声明以 `var` 关键字开头，然后是一个标识符作为名称，可选的有一个初始化表达式，这部分可以有多个，最后以 `;` 结尾。

块以 `{` 开头，中间可以有若干个语句，并以 `}` 结尾。

为了访问变量，需要对表达式中的 `primary` 生成式进行修改：

```
primary -> "(" expression ")"
           | NUMBER
           | STRING
           | "true"
           | "false"
           | "nil"
           | IDENT;
```

`IDENT` 会匹配标识符标记，被看作要访问变量的名称。

这些新的语法规则需要重新生成 AST 节点，更新 `bin/gen_ast`：

```ruby
Lox::AstGenerator.new(output_path:, type: 'stmt', productions: [
                        'varDecl    : ident, init',
                        # ...
                      ]).generate

Lox::AstGenerator.new(output_path:, type: 'expr', productions: [
                        # ...
                        'varExpr      : ident'
                      ]).generate
```

### 8.2.2 解析变量

更新解析器，修改 `Parser` 类：

```ruby
class Lox::Parser
  private

  def identifier
    ident = advance
    if Lox::TokenType.keyword?(previous.type)
      add_error('expected an identifier, found a keyword')
    elsif previous.type != Lox::TokenType::IDENT
      add_error('expect an identifier')
    end
    ident
  end

  # statement -> declaration | execution
  def statement
    if check?(Lox::Keyword::VAR, Lox::Keyword::FN)
      declaration
    else
      execution
    end
  end

  # declaration -> var_decl
  def declaration
    if match_next?(Lox::Keyword::VAR)
      var_decl
    end
  end

  # var_decl -> "var" var_defs ";"
  def var_decl
    from = previous
    vars = var_defs
    consume(Lox::TokenType::SEMICOLON, 'expect `;` after variable declaration', from:)
    vars
  end

  # var_defs -> var_def ("," var_def)*
  def var_defs
    vars = [var_def]
    vars << var_def while match_next?(Lox::TokenType::COMMA)
    vars
  end

  # var_def -> IDENT ("=" expression)?
  def var_def
    from = peek
    ident = identifier
    init = expression if match_next?(Lox::TokenType::EQUAL)
    Lox::Ast::VarDecl.new(ident:, init:, location: location(from:))
  end

  # execution -> ";"
  #              | print_stmt
  #              | expr_stmt
  def execution
    if match_next?(Lox::TokenType::SEMICOLON)
      nil
    elsif match_next?(Lox::Keyword::PRINT)
      print_stmt
    else
      expr_stmt
    end
  end

  # primary -> "(" expression ")"
  #            | NUMBER
  #            | STRING
  #            | "true"
  #            | "false"
  #            | "nil"
  #            | IDENT
  def primary
    from = peek
    if match_next?(Lox::TokenType::LEFT_PAREN)
      # ...
    elsif match_next?(Lox::TokenType::IDENT)
      Lox::Ast::VarExpr.new(ident: previous, location:)
    else
      # ...
    end
  end
end
```

由于 `var_decl` 返回的是一个数组，因此在 `program` 中根据情况进行语句的追加，否则就会造成语句的嵌套。

## 8.3 环境

变量与值的绑定关系需要保存在一个数据结构中，称为**环境**（Environment）。

![Env](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/20250510233644638.png)

其本质是一个名称到值的映射的集合，通常用哈希表来实现。通过创建一个单独的 `Env` 类来实现：

```ruby
class Lox::Env
  def initialize
    @vars = {}
  end

  def define(name, value)
    @vars[name] = value
  end

  def value(var)
    name = var.ident.lexeme

    if @vars.key?(name)
      return @vars[name] unless @vars[name] == :uninit

      raise Lox::Error::UninitError
    end

    raise Lox::Error::UndefError
  end
end
```

通过 Ruby 的 Hash 来保存变量，变量名作为键。`define` 用于创建一个变量或者覆盖已有的变量。`value` 获取变量的值，当变量不存在或未初始化时，抛出一个错误。

添加错误类型：

```ruby
class Lox::Error::UndefError < Lox::Error::InterpError; end
class Lox::Error::UninitError < Lox::Error::InterpError; end
```

可以不允许覆盖已有变量，或在使用不存在的变量时返回一个 `nil`，亦或者在使用未初始化的变量时抛出一个错误，这取决于语言设计时的考量。

当抛出错误时，可以视为语法错误，也可以是运行时错误。若是前者，那么可能不允许使用相互递归的程序：

```javascript
fn is_odd(n) {
  if (n == 0) {
      return false;
  }
  return isEven(n - 1);
}

fn is_even(n) {
  if (n == 0) {
      return true;
  }
  return isOdd(n - 1);
}
```

当解析 `isOdd` 时，`isEven` 被调用的时候还没有被声明，即使交换顺序也会导致相同的问题。

因此视为语法错误这类**静态错误**会使递归声明过于困难，因此视为运行时错误，在一个变量被定义之前可以**引用**，但不能**求值**。

### 8.3.1 解释全局变量

每一个 Lox 实例都会创建一个全局变量环境，这样只要在实例运行期间，所有的代码都能共享。

更新 `Entry`，把 `@env` 传递到每个 `Interpreter` 实例中：

```ruby
class Lox::Entry
  def initialize(options = {})
    @options = options
    @error_collector = Lox::ErrorCollector.new
    @env = Lox::Env.new
  end

  private

  def run(repl: false, ast_only: false)
    # ...
    result = Lox::Interpreter.new(src_map: @src_map, error_collector: @error_collector, ast:, env: @env).interpret
    raise Lox::Error::InterpError if @error_collector.error?
    # ...
  end
```

更新 `Lox::Interpreter`：

```ruby
class Lox::Interpreter
  def initialize(src_map:, error_collector:, ast:, env:)
    # ...
    @env = env
  end

  def interpret
    ast.accept(Lox::Visitor::Interpreter.new(src_map: @src_map, env: @env))
  rescue Lox::Error::InterpError => e
    # ...
  end
end
```

在 `Interpreter` 中添加对 `var_decl` 的访问者，同时需要接受环境：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  attr_accessor :env

  def initialize(src_map:, env:)
    @src_map = src_map
    @env = env
  end

  def visit_var_decl(var_decl)
    name = var_decl.ident.lexeme
    value = var_decl.init ? evaluate(var_decl.init) : :uninit
    @env.define(name, value)
    nil
  end
end
```

同样地，在 `Interpreter` 中添加 `var_expr` 的访问者：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_var_expr(var_expr)
    @env.value(var_expr)
  rescue Lox::Error::UndefError
    error("undefined variable `#{var_expr.ident.lexeme}`", var_expr)
  rescue Lox::Error::UninitError
    error("variable `#{var_expr.ident.lexeme}` is not initialized", var_expr)
  end
end
```

## 8.4 赋值

在有些函数式语言中，由于不变性，通常只允许变量定义，而不允许赋值。因为更改变量的值实际上是一种副作用。但 Lox 是一门命令式语言，没有那么严格。因此除了支持变量定义外，还支持赋值。

### 8.4.1 赋值语法

与 C 类似，赋值是一个优先级最低的表达式，而不是语句，更新表达式的产生式：

```
expression -> assign;
assign -> IDENT "=" assign
          | condition
```

更新 `bin/gen_ast`，添加 `Assign` 节点：

```ruby
Lox::AstGenerator.new(output_path:, type: 'expr', productions: [
                        'assignExpr   : ident, value'
                      ]).generate
```

更新 `Parser#expression`：

```ruby
class Lox::Parser
  private

  # expression -> assign
  def expression
    assign
  end
end
```

对于赋值表达式的需要特殊处理，因为单个标记前瞻的递归下降解析器只有在解析完左侧的标记并遇到 `=` 后才知道这是一个赋值表达式。虽然算术运算的解析也是这样的，先计算左侧才能得知下一个是 `+`。但是两者有一个根本的区别：赋值表达式的左侧不是可以求值的表达式，而是一种伪表达式，计算出的结果是一个可以被复制的对象，即**左值**和**右值**的区别，左值计算得到一个存储位置，右值可以保存在该位置上。

```
a = value
```

这里不会对 `a` 进行求值，而是要知道 `a` 指向的是什么变量，这样就能知道右侧的表达式要在哪保存。

因此语法树对左值的处理，不会像常规表达式那样计算，而且解析器直到遇到 `=` 才能得知正在解析一个左值。在一个复杂的左值中，可能在很多个标记之后才能识别，因此无法提前得知要前瞻多少个标记。

```
a().b().c.d = value
```

Lox 的解析器只会前瞻一个标记，因此使用一种小技巧来解决：

```ruby
class Lox::Parser
  private

  # assign -> IDENT ("=" | "+=" | "-=" | "*=" | "/=" | "%=" | "^=") assign
  #           | condition
  def assign
    expr = condition

    if match_next?(Lox::TokenType::EQUAL) # =
      value = assign

      if expr.is_a?(Lox::Ast::VarExpr)
        ident = expr.ident
        expr = Lox::Ast::AssignExpr.new(ident:, value:, location: location(from: expr))
      else
        add_error('invalid assignment target', from: expr, to: expr)
      end
    end

    expr
  end
end
```

既然不确定是否是一个赋值运算，就先当成表达式来解析，因此先解析 `condition`（`IDENT` 的解析也包含在其中），然后看后面是否是一个 `=`。如果是， 则前面 `condition` 解析得到的结果就应该是一个 `Var` 节点，那么就继续解析右边的表达式即可，否则报错。

目前只有变量是有效的左值，其它语言中的对象字段访问、数组的索引访问等都是有效的左值。

### 8.4.2 赋值语义

现在有了一个新的 `Assign` 节点，同样添加一个访问者方法，更新 `Interpreter`：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_assign_expr(assign_expr)
    value = evaluate(assign_expr.value)
    @env.assign(assign_expr.ident, value)
    value
  rescue Lox::Error::UndefError
    error("undefined variable `#{assign_expr.ident.lexeme}`", assign_expr.ident)
  end
end
```

在 `Env` 中添加 `assign` 方法：

```ruby
class Lox::Env
  def assign(ident, value)
    name = ident.lexeme

    return @vars[name] = value if @vars.key?(name)

    raise Lox::Error::UndefError
  end
end
```

赋值与声明的区别在于，赋值不允许创建新变量，把值赋给不存在的变量会抛出运行时错误。

### 8.4.3 赋值语法糖

类似这种表达式：

```
a = a + b
a = a - b
a = a * b
a = a / b
a = a % b
a = a ^ b
```

这种写法十分繁琐，可以增加如下语法糖：

```
a += b
a -= b
a *= b
a /= b
a %= b
a ^= b
```

这可以不增加新的语法树节点，而是利用赋值和二元运算的组合来实现，也可以增加的一个新的节点来实现。为了实现简单，这里通过新增节点实现：

更新 `bin/gen_ast`，添加 `AssignOp` 节点：

```ruby
Lox::AstGenerator.new(output_path:, type: 'expr', productions: [
                        'assignOpExpr : ident, op, value'
                      ]).generate
```

更新 `Parser`：

```ruby
class Lox::Parser
  private

  # assign -> IDENT ("=" | "+=" | "-=" | "*=" | "/=" | "%=" | "^=") assign
  #           | condition
  def assign
    expr = condition

    if match_next?(Lox::TokenType::EQUAL) # =
      # ...
    elsif match_next?(Lox::TokenType::PLUS_EQUAL, Lox::TokenType::MINUS_EQUAL,
                      Lox::TokenType::STAR_EQUAL, Lox::TokenType::SLASH_EQUAL,
                      Lox::TokenType::PERCENT_EQUAL, Lox::TokenType::CARET)
      op = previous
      value = assign

      if expr.is_a?(Lox::Ast::VarExpr)
        ident = expr.ident
        expr = Lox::Ast::AssignOpExpr.new(ident:, op:, value:, location: location(from: expr))
      else
        add_error('invalid assignment target', from: expr, to: expr)
      end
    end

    expr
  end
end
```

## 8.5 作用域

**作用域**（Scope）定义了名称的有效范围。多个作用域允许同一个名称在不同上下文指向不同内容。

**词法作用域**（Lexical scope），也称**静态作用域**（Static scope）是一种作用域定义方式。程序本身的文本位置就已经决定了作用域的范围。Lox 也是静态作用域的，变量只在作用域内有效。

```javascript
{
  var a = "first";
  print a; // "first".
}

{
  var a = "second";
  print a; // "second".
}
```

在两个块中声明了同名变量，但指向的值不同。

**动态作用域**（Dynamic scope）中，作用域是在运行时确定的，Lox 虽然没有动态作用域变量，但对象上的方法和字段是动态作用域的。

```javascript
class Foo {
  run() {
    print "from Foo";
  }
}

class Bar {
  run() {
    print "from Bar";
  }
}

fn f(obj) {
  obj.run();
}
```

当 `f` 调用 `obj.run` 时，无法静态的知道调用的是 `Foo` 还是 `Bar`，亦或者两者都不是，这取决于实际传递的是什么。

作用域是概念，而环境则是实现它的机制。解释器在执行时，影响作用域的语法树节点会改变环境的上下文。在 Lox 中，环境是由**块**（Block）控制的，称为**块作用域**（Block scope）。

```javascript
{
  var a = "in block";
}
print a; // error
```

### 8.5.1 嵌套和遮蔽

当访问块中的每个语句时，跟踪所有变量，执行完块中最后一条一句时，删除环境中的所有变量，但要注意，只能删除该块所属的环境，否则其它作用域的环境会被干扰。

当局部变量与外部作用域的变量有相同名称时，内部变量会遮蔽外部变量，块内部无法获取外部同名变量的值。

基于这种机制，除了全局作用域能被所有代码访问到以外，每个局部作用域都应该有一个新的环境。当代码块结束时，该环境将被丢弃，并恢复前一个环境。同时，块中没有被遮蔽的外部变量也应该能通过外部环境被正常访问。

```javascript
var global = "outside";
{
  var local = "inside";
  print global + local;
}
```

`global` 在外部环境中，`local` 在内部环境中，两者都应该能被正常访问。

可以通过将环境链接起来实现。这类似树，每个环境都持有对外部环境的引用。当寻找一个变量时，从最内层的环境开始向上遍历直到找到该变量。

![Env chaining](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/20250510233705115.png)

更新 `Env`，添加对外部环境的引用：

```ruby
class Lox::Env
  def initialize(enclosing = nil)
    @vars = {}
    @enclosing = enclosing
  end
end
```

全局环境没有外部环境，默认为 `nil`。

修改 `value` 函数，使其能够递归查找：

```ruby
class Lox::Env
  def value(var)
    # ...
    return @enclosing&.value(var) if @enclosing

    raise Lox::Error::UndefError
  end
end
```

赋值也是如此：

```ruby
class Lox::Env
  def assign(ident, value)
    # ...
    return @enclosing&.assign(ident, value) if @enclosing

    raise Lox::Error::UndefError
  end
end
```

### 8.5.2 块语法和语义

已经完成了环境的嵌套，然后添加块，更新 `exec_stmt` 的产生式：

```
exec_stmt -> print_stmt
             | block_stmt
             | expr_stmt
block_stmt -> "{" stmt* "}"
```

块是一种语句，由 `{}` 组成，其中可以包含任意语句。

更新 `bin/gen_ast`：

```ruby
Lox::AstGenerator.new(output_path:, type: 'stmt', productions: [
                        # ...
                        'blockStmt  : body',
                        # ...
                      ]).generate
```

更新 `Parser` 添加解析块的部分：

```ruby
class Lox::Parser
  private

  # execution -> ";"
  #              | print_stmt
  #              | block_stmt
  #              | expr_stmt
  def execution
    if match_next?(Lox::TokenType::SEMICOLON)
      nil
    elsif match_next?(Lox::Keyword::PRINT)
      print_stmt
    elsif match_next?(Lox::TokenType::LEFT_BRACE)
      block_stmt
    else
      expr_stmt
    end
  end

  # block_stmt -> "{" statement* "}"
  def block_stmt
    from = previous
    body = []
    until at_end? || check?(Lox::TokenType::RIGHT_BRACE)
      begin
        stmt = statement
        if stmt.is_a?(Array)
          body.concat(stmt)
        else
          body << stmt
        end
      rescue Lox::Error::NotStmtError => e
        raise Lox::Error::ParserError, e
      end
    end
    body.compact!
    consume(Lox::TokenType::RIGHT_BRACE, 'block must be end with `}`', from:)
    Lox::Ast::BlockStmt.new(body:, location: location(from:))
  end
end
```

`block_stmt` 其实与 `program` 是类似的，因为都是解析 `statement`。

修改 `program` 来对块进行错误处理：

```ruby
class Lox::Parser
  private

  def program
    stmts = []
    until at_end?
      begin
        add_error('block must be start with `{`') if match_next?(Lox::TokenType::RIGHT_BRACE)
        # ...
      rescue Lox::Error::NotStmtError
        # ...
      end
    end
    # ...
  end
end
```

然后添加对块的访问者：

```ruby
class Lox::Visitor::Interpreter < Lox::Visitor::Base
  def visit_block_stmt(block_stmt)
    block_env = Lox::Env.new(@env)
    execute_block(block_stmt, block_env)
  end

  def execute_block(block, block_env)
    pre_env = @env
    @env = block_env
    block.body.each { execute(it) }
    nil
  ensure
    @env = pre_env
  end
end
```

每一个块都会创建一个新的环境，并把链接上层环境。每个块都会在给定上下文中执行语句，因此会先将当前环境指定为 `block_env`，并在执行结束后恢复之前的环境，并通过 `ensure` 来确保即使发生了异常也能恢复。

## 设计笔记：隐式变量声明

Lox 使用不同的语法来声明变量和为已有变量赋值，有些语言则只有赋值，当为不存在的变量赋值时会自动创建该变量，即**隐式变量声明**（Implicit variable declaration），如 Python 和 Ruby，而 JavaScript 两者皆可。

当相同的语法既可以用作声明，也可以用作赋值时，语言实现就必须决定在非预期情况下的行为，如隐式变量声明与变量遮蔽的交互方式，以及隐式变量属于哪个作用域。

-   Python 赋值总会在当前作用域内创建一个变量，即使外部作用域已经有同名变量。

-   Ruby 则通过对不同类型的变量用不同命名规则，避免了一些歧义，但 Ruby 中的块也具有自己的作用域，当外部作用域存在同名变量，则不创建新变量，否则在当前作用域内创建新变量。

-   JavaScript 的赋值会修改任意外部作用域中已有变量，否则在全局作用域创建新变量（非严格模式下）。

隐式声明的优点是简单，没有额外的概念需要学习。像 C 这类早期的静态语言必须显式声明，因为需要提前告诉编译器为这些类型预留多少存储空间，而动态类型语言中其实是没有必要的。

但隐式声明可能存在一些问题：

-   为现有变量赋值时，由于拼写错误，隐式创建了一个新变量而没有报错，这可能会干扰其它代码
-   JavaScript、Ruby 通过判断是否存在同名变量来决定是赋值还是声明，但这也意味着外部作用域中添加一个变量会改变局部作用域中代码的含义，可能会造成副作用。
-   Python 中想要为外部作用域的变量赋值，但是无法做到这一点，因为总是创建新变量。

很多具有隐式声明的语言都额外做了很多措施来处理这些问题：

-   JavaScript 的严格模式会将全局隐式声明视为一个错误
-   Python 添加了 `global` 和 `nonlocal` 语句
-   Ruby 扩展了块语法允许显式声明新变量

显式还是隐式取决于语言设计和目的，脚本语言可能倾向于简单，静态类型语言可能倾向于尽可能多的发现错误。
