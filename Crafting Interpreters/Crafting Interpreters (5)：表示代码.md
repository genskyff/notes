# 5 表示代码

在上一步的词法分析中，已经将字符串形式的源代码转换成了 Token 序列。下一步就应该将这些 Token 转换为 AST。但在进行这种转化之前，需要先对其定义。

代码的表示形式应该易于解析器生成，和易于解释器使用。如 `1 + 2 * 3 - 4` 这样的表达式，具有运算优先级。可以使用树来表达这种具有优先级顺序的结构，叶子节点是数字，内部节点是运算符，每一个操作数都对应一个分支。要计算一个节点，需要先计算其子树的值，这相当于后序遍历。

![img](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202405071552798.png)

若给出一个算术表达式，可以很容易构造这样的树，根据这棵树也可以进行计算。因此从直观上看，代码的一种可行的表示方式是一颗与语法结构（运算符嵌套）相匹配的树。

## 5.1 上下文无关语法

在词法分析阶段，用来定义词法语法（字符如何被分组为 Token 的规则）的形式体系，被称为正则语言。这对于扫描器来说是可以的，因为其输出都是扁平化的 Token 序列。但正则语言的表达能力有线，仅能用于描述简单文本，无法处理如任意深度嵌套表达式这样的复杂场景。

在形式化语法（Formal grammar）中，有一个重要的工具——**上下文无关语法**（Context-free grammar，CFG）。形式化语法需要一组原子片段——**字母表**（Alphabet），其定义了一组任意长度的**字符串**（String），而这些字符串包含在语法中，每个字符串都是字母表中**字符**（Letter）的序列。形式化语法的工作就是指定哪些字符串有效。

在词法分析和语法分析阶段，相同的术语指代不同的含义：

| 术语                | 词法分析 Lexing | 语法分析 Parsing  |
| ------------------- | --------------- | ----------------- |
| 字母表 Alphabet     | 字符 Character  | 词法标记 Token    |
| 字符串 String       | 词法标记 Token  | 表达式 Expression |
| 实现 Implementation | 扫描器 Scanner  | 解析器 Parser     |

### 5.1.1 语法规则

显然无法列举一个包含无限多有效字符串的语法，但可以提供一组有限多的规则，称为**生成式**（Production），从这些规则中生成语法中的字符串被称为**推导式**（Derivation）。

CFG 中每个生成式都有一个**头部**（Head）和描述其生成内容的**主体**（Body）。从形式上看，主体只是一系列符号，符号分为两类：

-   **终止符**（Terminal symbol）：语言的基本构建块，是语法分析中直接处理的符号，不能再被其它规则替换或分解的原子单位，如关键字（`if`、`else`）、字面值（`123`、`"foo"`）、标识符（`foo`）、操作符（`+`、`-`）等；
-   **非终止符**（Non-terminal symbol）：用于构建语言结构的符号，定义了一组可能的产生式规则中的替换规则，可以被进一步展开成非终止符或终止符的符号，如表达式、语句等。

为了让这些规则具体化，需要一种方式来描述这些生成规则，现在通常使用[巴科斯范式](https://zh.wikipedia.org/wiki/%E5%B7%B4%E7%A7%91%E6%96%AF%E8%8C%83%E5%BC%8F)（BNF）及其[扩展](https://zh.wikipedia.org/wiki/%E6%89%A9%E5%B1%95%E5%B7%B4%E7%A7%91%E6%96%AF%E8%8C%83%E5%BC%8F)（EBNF）或其它变形。

一种简单的形式：

-   每个规则都有一个名称，后跟 `->`，再跟一些列符号；
-   以 `;` 结尾；
-   终止符是带引号的字符串，非终止符是小写的单词。

以此为基础，一个用于早餐菜单的语法可以这样来表述：

```
breakfast -> protein "with" breakfast "on the side";
breakfast -> protein;
breakfast -> bread;

protein -> crispiness "crispy" "bacon";
protein -> "sausage";
protein -> cooked "eggs";

crispiness -> "really";
crispiness -> "really" crispiness;

cooked -> "scrambled";
cooked -> "poached";
cooked -> "fried";

bread -> "toast";
bread -> "biscuits";
bread -> "English muffin";
```

可以使用这个语法来生成一个早餐，选择 `breakfast` 的第一条，得到：

```
protein "with" breakfast "on the side"
```

`protein` 是一个非终止符，选择其第三条，得到：

```
cooked "eggs" "with" breakfast "on the side"
```

`cooked` 是一个非终止符，选择其第二条，得到：

```
"poached" "eggs" "with" breakfast "on the side"
```

下一个非终止符还是 `breakfast`，生成式递归的指向了自身，这表明语言是上下文无关，而不是正则的。可以选择第一条，然后继续不断地递归下去，但是这里选择第三条，得到：

```
"poached" "eggs" "with" bread "on the side"
```

`bread` 是一个非终止符，选择其第三条，得到：

```
"poached" "eggs" "with" "English muffin" "on the side"
```

现在所有非终止符都被展开了，最后仅包含终止符。

![img](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202405071656599.png)

每当遇到具有多个结果的规则时，都只是随意选择了一个。正是这种灵活性允许用少量的语法规则来编码出组合性更强的字符串集。一个规则可以直接或间接地引用自身，这种递归的性质使得上下文无关语法能够描述嵌套的结构，这是正则语法做不到的。

一个正则语法描述任意数量的 `a` 后跟任意数量的 `b` 组成的字符串，如 `aaabbb`、`ab`，其语法可以这样表示：

```
S -> aS
S -> bT
T -> bT
T -> end
```

其中 `S` 表示从此开始，可以添加任意数量的 `a` 然后转换到状态 `T` 并添加任意数量的 `b`，`end` 表示结束。

但如果要描述一个嵌套的括号，如 `()`、`(())`，通过上下文无关语法可以轻松表达，但正则语法就不行。其上下文语法可以这样表示：

```
S -> (S)
S -> SS
S -> end
```

因此正则语法通常用于简单的模式匹配和处理，如日志分析或输入验证，而上下文无关语法则用于解析更复杂的结构，如语言解析器（函数调用、控制流语句）或复杂数据格式（JSON、XML）的解析。

### 5.1.2 增强符号

更进一步，可以对生成式规则添加一些语法糖：

-   使用 `|` 分隔生成式，避免在每次添加一个生成式时重复名称
-   使用 `()` 进行分组，在分组中使用 `|` 表示选择其一
-   使用 `*` 表达生成式可以出现 0 次或多次
-   使用 `+` 表达生成式可以出现 1 次或多次
-   使用 `?` 表达生成式可以出现 0 次或 1次

因此上面表达早餐菜单的语法可以简化为：

```
breakfast  -> protein ("with" breakfast "on the side")?
              | bread;
protein    -> crispiness "crispy" "bacon"
              | "sausage"
              | cooked "eggs";
crispiness -> "really"+;
cooked     -> "scrambled" | "poached" | "fried";
bread      -> "toast" | "biscuits" | "English muffin";
```

更进一步可以简化为：

```
breakfast -> protein ("with" breakfast "on the side")?
             | ("toast" | "biscuits" | "English muffin");
protein   -> "really"+ "crispy" "bacon"
             | "sausage"
             | ("scrambled" | "poached" | "fried") "eggs";
```

这实际上将一部分正则语法应用在了生成式规则的表达上，但本质还是上下文无关语法。这种精确化描述可以将非正式的语法设计具体化。

### 5.1.3 Lox 表达式语法

将 Lox 语法规则使用生成式规则来表达，因为整个语法十分多，所以先从表达式开始。

Lox 中的表达式，如：

```javascript
1 - (2 * 3) < 4 == false
```

可以分为：

-   字面量（Literal）：数字（Number）、字符串（String）、布尔值（Boolean）、`nil`
-   一元表达式（Unary expression）：逻辑非 `!`、数字取反 `-`
-   二元表达式（Binary expression）：`+`、`-`、`*`、`/`、`%`、`==`、`!=`、`<`、`<=`、`>`、`>=`
-   括号（Parentheses）：`(`、`)`

除了与精确词素相匹配的终止符会加引号外，还对表示单一词素的终止符进行**大写化**，这些词素的文本表示方式可能会有所不同。`NUMBER` 是任何数字字面量，`STRING` 是任何字符串字面量，对 `IDENTIFIER` 也进行同样的处理。这些符号使用生成式语法可以表达为：

```
expression -> literal
              | unary
              | binary
              | group;
literal    -> NUMBER | STRING | "true" | "false" | "nil";
unary      -> ("!" | "-") expression;
binary     -> expression operator expression;
operator   -> "+" | "-" | "*" | "/" | "%"
              | "==" | "!=" | "<" | "<=" | ">" | ">="
group      -> "(" expression ")"
```

>   目前这个语法是有歧义的，之后会修改。

## 5.2 实现语法树

根据上述 Lox 的表达式语法，可以将表达式构成一颗递归的树——**语法树**（Syntax tree）。

扫描器使用一个 Token 类来表示所有类型词素，TokenType 枚举用于区分不同类型的词素。而语法树则没有那么同质，一元表达式只有一个操作数，二元表达式由两个，而字面量则没有。

可以将所有这些内容放到一个可以包含任意子列表的 Expression 类中。还可以定义一个基类，然后为 Expression 中的每一个生成式都创建一个子类，该子类含有非终止字符字段，这样若对一元表达式访问其第二个操作数时就会得到一个错误。

如定义一个 `Expression` 作为所有表达式类型的基类：

```ruby
class Expression; end

class Binary < Expression
  def initialize(left, operator, right)
    @left = left
    @operator = operator
    @right = right
  end
end
```

### 5.2.1 非面向对象

`Expression` 类没有定义任何方法。在编译的上下文中，`Expression` 类和其它语法树节点类似，主要用于表示程序代码的结构而非其行为。这些类的对象通常在解析阶段被创建，并在整个编译或解释过程中传递。如果这些类包含了特定行为，如解析或解释的逻辑，那么会违背作为数据通信介质的角色，因为这会导致类与特定的处理阶段或逻辑过度绑定，而将这些结构设计为简单的数据容器，这样在不同的处理阶段之间更加通用和灵活。

在面向对象语言中，数据和行为通常是绑定的，而函数式语言更倾向于将数据和行为分开，数据结构通常只是静态的，不含任何方法，而行为则通过函数来操作这些数据。虽然函数式语言更适合用来构建解释器，但其中的一些组件，如扫描器，则更适合用面向对象的方式来构建。关键在于如何保持对象行为封装的同时，合理地管理那么必须在多个阶段间流动的数据结构。

### 5.2.2 节点树元编程

与其繁琐地手写每个类的定义、字段声明、构造函数和初始化器，不如编写一个用于生成这些样板代码的生成器脚本。创建一个 `lib/parser/ast_generator.rb` 文件：

```ruby
class AstGenerator
  def initialize(output_path:, basename:, productions:)
    @output_path = output_path
    @basename = basename.downcase
    @productions = productions.map(&:downcase)
  end

  def make_ast
    path = File.join(@output_path, "#{@basename}.rb")
    File.open(path, "w:UTF-8") do |file|
      file.puts "# frozen_string_literal: true"
      file.puts
      file.puts "# This file was generated by AstGenerator."
      file.puts "# !! Do not edit it directly. !!"
      file.puts
      file.puts "class #{@basename.capitalize}"
      file.puts "end"

      @productions.each do |production|
        head, body = production.split(":").map(&:strip)
        names = body.split(",").map(&:strip)
        make_production(file, head, names)
      end

      make_visitor(file)
    end
  end

  private

  def make_production(file, head, names)
    file.puts
    file.puts "class #{head.capitalize} < #{@basename.capitalize}"
    file.puts "  attr_reader #{names.map { |name| ":#{name}" }.join(', ')}"
    file.puts
    file.puts "  def initialize(#{names.join(', ')})"
    names.each do |name|
      file.puts "    @#{name} = #{name}"
    end
    file.puts "  end"
    file.puts "end"
  end
end
```

然后就可以在之后传入定义的 CFG，然后执行 `make_ast`：

```ruby
project_path = File.expand_path("..", File.dirname(__FILE__))
output_path = File.join(project_path, "lib", "parser", "ast")

AstGenerator.new(output_path:, basename: "Expression", productions: [
                   "Literal   : value",
                   "Unary     : operator, right",
                   "Binary    : left, operator, right",
                   "Group     : expression",
                   "Condition : cond, then_branch, else_branch",
                   "Comma     : expressions"
                 ]).make_ast
```

之后就会在 `lib/parser/ast/expression.rb` 下生成如下代码：

```ruby
# frozen_string_literal: true

# This file was generated by AstGenerator.
# !! Do not edit it directly. !!

class Expression
end

class Literal < Expression
  attr_reader :value

  def initialize(value)
    @value = value
  end
end

class Unary < Expression
  attr_reader :operator, :right

  def initialize(operator, right)
    @operator = operator
    @right = right
  end
end

class Binary < Expression
  attr_reader :left, :operator, :right

  def initialize(left, operator, right)
    @left = left
    @operator = operator
    @right = right
  end
end

class Group < Expression
  attr_reader :expression

  def initialize(expression)
    @expression = expression
  end
end

class Condition < Expression
  attr_reader :cond, :then_branch, :else_branch

  def initialize(cond, then_branch, else_branch)
    @cond = cond
    @then_branch = then_branch
    @else_branch = else_branch
  end
end

class Comma < Expression
  attr_reader :expressions

  def initialize(expressions)
    @expressions = expressions
  end
end
```

## 5.3 处理树结构

由于每种表达式在运行时的行为都不同，因此解释器需要选择不同的代码块来处理每种表达式类型。或许可以通过判断表达式类型然后进行操作：

```ruby
def execute(expr)
  case expr
  when Literal
    # ...
  when Unary
    # ...
  end
end
```

但这无疑会导致效率降低，因为在找到正确的类型之前，都需要进行判断，并且随着需要执行操作越来越多，类型越来越多，会导致代码过于臃肿且紧耦合。

更进一步的方法是，由于每个表达式都是一个类，因此可以将行为与类关联起来。可以为 `Expression` 类添加一个 `execute` 方法，然后每个子类都分别实现该方法。

```ruby
class Expression
  def execute
    raise NotImplementedError
  end
end

class Literal < Expression
  # ...
  def execute
    @value
  end
end

class Unary < Expression
  # ...
  def execute
    case @operator
    when :+
      +@right.execute
    when :-
      -@right.execute
    # ...
    end
  end
end
```

但这样会导致扩展性和可维护性变得很差，因为表达式类不仅用于语法分析部分生成语法树，还用于解释器执行，若语言是静态类型的，还需要在语义分析部分进行类型检查等操作。

这会导致不同的模块都会用到这部分，因此表达式类是一个跨越多个模块的共通部分，而这些模块不一定会用到类中的所有方法，如语法分析不会用到 `execute`，解释器不会用到 `check`。为每一个操作的表达式类中添加方法，就会将不同模块需要的部分混在一起，这违反了关注点分离原则。

### 5.3.1 表达式问题

对于面向对象语言来说，可以认为一个类或其子类做的事情是类似的且相互关联的，因此可以将行为都定义在同一个类的方法里面。要扩展新类型，无需修改现有代码，只需要再添加一个新类并实现其中的方法即可。

```ruby
class Expression
  def execute
    # ...
  end
end

# add Literal
class Literal < Expression
  def execute
    # ...
  end
end

# ...
```

但反过来，若要添加新方法，则需要为现有的每个类都进行添加：

```ruby
class Expression
  def execute
    # ...
  end

  # add other
  def other
    # ...
  end
end

class Literal < Expression
  def execute
    # ...
  end

  # add other
  def other
    # ...
  end
end

# ...
```

而对于 ML 这类函数式语言来说，由于类型和操作是分开的，因此要添加一个新的操作，只需定义一个新的函数，然后在函数体中，通过模式匹配对对应的类型实现相应的操作即可。

```ruby
Literal = Struct.new(:type, :value)
Unary = Struct.new(:type, :operator, :right)

def literal(value)
  Literal.new(:literal, value)
end

def unary(operator, right)
  Unary.new(:unary, operator, right)
end

def execute(expr)
  case expr.type
  when :literal
    expr.value
  when :unary
    case expr.operator
    when :+
      +execute(expr.right)
    when :-
      -execute(expr.right)
      # ...
    end
  end
end

# add print
def print(expr)
  case expr.type
  when :literal
    puts expr.value
  when :unary
    puts "#{expr.operator}#{expr.right}"
  end
end
```

但反过来，若要添加新类型，则需要修改所有现有函数：

```ruby
Literal = Struct.new(:type, :value)
Unary = Struct.new(:type, :operator, :right)
Binary = Struct.new(:type, :left, :operator, :right)

def literal(value)
  Literal.new(:literal, value)
end

def unary(operator, right)
  Unary.new(:unary, operator, right)
end

# add binary
def binary(left, operator, right)
  Binary.new(:binary, left, operator, right)
end

def execute(expr)
  case expr.type
  when :literal
    expr.value
  when :unary
    case expr.operator
    when :+
      +execute(expr.right)
    when :-
      -execute(expr.right)
      # ...
    end
  # add binary
  when :binary
    case expr.operator
    when :+
      execute(expr.left) + execute(expr.right)
    when :-
      execute(expr.left) - execute(expr.right)
    # ...
    end
  end
end

def print(expr)
  case expr.type
  when :literal
    puts expr.value
  when :unary
    puts "#{expr.operator}#{expr.right}"
  # add binary
  when :binary
    puts "#{expr.left} #{expr.operator} #{expr.right}"
  end
end
```

这就是范式不同导致的代码结构不同：

-   面向对象语言按照类型来组织代码，这导致添加类型容易，添加操作复杂；
-   函数式语言将代码都归纳为函数，这导致添加操作容易，添加类型复杂。

这个困境被称为**表达式问题**：要如何设计代码结构，使得既可以方便地添加新类型，又可以方便地添加新操作。

### 5.3.2 访问者模式

访问者模式实际上近似于面向对象语言中的函数式，可以很容易的实现添加类型和操作。通过添加一个中间层，在这里定义针对一组类型的操作，而不必触及类型本身。

如有一个 `User` 类，其有 `Admin` 和 `Normal` 子类：

```ruby
class User; end
class Admin < User; end
class Normal < User; end
```

再定义一个抽象的接口，用于充当访问者，这样当需要添加新方法时，就在这里添加，而不需要去类本身中添加：

```ruby
class UserVisitor
  def visit_admin(admin)
    raise NotImplementedError
  end

  def visit_normal(normal)
    raise NotImplementedError
  end
end
```

然后在 `User` 中添加一个根据类型路由到正确访问者的方法：

```ruby
class User
  def accept(visitor)
    raise NotImplementedError
  end
end
```

然后每个子类都需要实现该方法：

```ruby
class Admin < User
  def accept(visitor)
    visitor.visit_admin(self)
  end
end

class Normal < User
  def accept(visitor)
    visitor.visit_normal(self)
  end
end
```

当要添加一个新操作时，就实现一个进行该操作的访问者：

```ruby
class UserPrinter < UserVisitor
  def visit_admin(admin)
    puts "Printer: #{admin}"
  end

  def visit_normal(normal)
    puts "Printer: #{normal}"
  end
end
```

当需要实际进行某项操作时，就对实例的 `accept` 方法传递某个操作的访问者：

```ruby
admin = Admin.new
normal = Normal.new
admin.accept(UserPrinter.new)
normal.accept(UserPrinter.new)
```

若又添加了一个操作，如 `UserOther`，则实现该访问者然后传递该访问者给实例：

```ruby
admin.accept(UserOther.new)
normal.accept(UserOther.new)
```

这样一来，对于面向对象语言，不仅添加新类型容易，添加新操作也不需要对所有现有类型进行修改。

### 5.3.3 表达式访问者

可以将表达式访问者代码编入到生成脚本中。

修改 `make_ast`：

```ruby
def make_ast
  path = File.join(@output_path, "#{@basename}.rb")
  File.open(path, "w:UTF-8") do |file|
    file.puts "# frozen_string_literal: true"
    file.puts
    file.puts "# This file was generated by AstGenerator."
    file.puts "# !! Do not edit it directly. !!"
    file.puts
    file.puts "class #{@basename.capitalize}"
    file.puts "  def accept(visitor)"
    file.puts "    raise NotImplementedError,"
    file.puts "          \"\#{self.class.to_s.highlight}#\#{__method__.to_s.highlight} must be implemented.\""
    file.puts "  end"
    file.puts "end"

    @productions.each do |production|
      head, body = production.split(":").map(&:strip)
      names = body.split(",").map(&:strip)
      make_production(file, head, names)
    end

    make_visitor(file)
  end
end
```

然后修改 `make_production`，并添加 `make_visitor`：

```ruby
def make_production(file, head, names)
  file.puts
  file.puts "class #{head.capitalize} < #{@basename.capitalize}"
  file.puts "  attr_reader #{names.map { |name| ":#{name}" }.join(', ')}"
  file.puts
  file.puts "  def initialize(#{names.join(', ')})"
  names.each do |name|
    file.puts "    @#{name} = #{name}"
  end
  file.puts "  end"
  file.puts
  file.puts "  def accept(visitor)"
  file.puts "    visitor.visit_#{head}(self)"
  file.puts "  end"
  file.puts "end"
end

def make_visitor(file)
  file.puts
  file.write "class #{@basename.capitalize}Visitor"

  @productions.each do |production|
    file.puts
    head, = production.split(":").map(&:strip)
    file.puts "  def visit_#{head}(#{head})"
    file.puts "    raise NotImplementedError,"
    file.puts "          \"\#{self.class.to_s.highlight}#\#{__method__.to_s.highlight} must be implemented.\""
    file.puts "  end"
  end
  file.puts "end"
end
```

实际上就是对每个产生式添加了接受一个 `visitor` 的 `accept` 方法，然后再定义每个产生式对应的访问者。

## 5.4  一个（不是很）漂亮的打印

当需要调试解析器和解释器时，通常需要查看解析后的语法树并确保其与期望的是结构一致。因此可以利用访问者模式，新增一个继承于`ExpressionVisitor` 的 `AstPrinter`，在给定语法树的情况下，生成一个显示树的嵌套结构的字符串表示。其接收一个名称和一组子表达式作为参数，然后包装在圆括号中，通过递归在每个子表达式上调用 `accept` 并传递自身，这样可以打印整棵树。

定义一个新类：

```ruby
# frozen_string_literal: true

class AstPrinter < ExpressionVisitor
  def visit_literal(literal)
    literal.value.to_s
  end

  def visit_unary(unary)
    parenthesize(unary.operator.lexeme, unary.right)
  end

  def visit_binary(binary)
    parenthesize(binary.operator.lexeme, binary.left, binary.right)
  end

  def visit_group(group)
    parenthesize("group", group.expression)
  end

  def visit_condition(condition)
    parenthesize("?:", condition.cond, condition.then_branch, condition.else_branch)
  end

  def visit_comma(comma)
    parenthesize(",", *comma.expressions)
  end

  private

  def parenthesize(name, *expressions)
    "(#{name} #{expressions.map { |expr| expr.accept(self) }.join(' ')})"
  end
end
```

如给定一个语法树，如：

![img](https://raw.githubusercontent.com/GuoYaxiang/craftinginterpreters_zh/main/content/5.%E8%A1%A8%E7%A4%BA%E4%BB%A3%E7%A0%81/expression.png)



```ruby
expr = Binary.new(
  Unary.new(Token.new(type: :MINUS, lexeme: "-"), Literal.new(123)),
  Token.new(type: :STAR, lexeme: "*"),
  Group.new(Condition.new(Literal.new(12), Literal.new(34), Comma.new([Literal.new(56), Literal.new(78)])))
)

puts expr.accept(AstPrinter.new)
```

输出结果为：

```
(* (- 123) (group (?: 12 34 (, 56 78))))
```
