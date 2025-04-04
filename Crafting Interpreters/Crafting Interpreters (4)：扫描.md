# 4 扫描

任何编译器或解释器的第一步就是扫描。扫描器接受字符串，并将其分组成一系列标识，即词法单元序列，这些有意义的单词和标点构成了语言的语法。

> - 原文使用 Java 实现，这里改为使用 Ruby 实现
> - 为了简略，代码只展示核心部分

## 4.1 解释器框架

`bin/lox.rb`：执行入口，可以读取文件执行，或使用交互式的方式执行。

```ruby
if ARGV.length > 1
  puts "Usage: ruby lox.rb [file]"
elsif ARGV.length == 1
  Lox.new.run_file(ARGV[0])
else
  Lox.new.run_prompt
end
```

`lib/lox.rb`：`Lox` 类文件，用于生成一个新的 `Lox` 实例。其中 `run_file` 用于读文件然后运行源代码。`run_prompt` 用于交互式的执行，暂时未考虑到多行输入的情况。目前 `run` 仅仅是将 `tokens` 打印然后返回，先将整体框架搭好，后面会慢慢完善。

```ruby
class Lox
  def initialize
    @has_error = false
  end

  def run_file(file)
    source = File.read(file)
    run(source)
    exit(-1) if @has_error
  rescue StandardError
    puts "Error reading file: #{file}"
  end

  def run_prompt
    loop do
      print '> '
      line = gets.chomp.strip
      next if line.empty?
      break if %w[q quit e exit].include?(line)

      run(line)
      @has_error = false
    rescue IOError => e
      puts "I/O error: #{e}"
      break
    end
  end

  private

  def run(source)
    scanner = Scanner.new(self, source)
    tokens = scanner.scan_tokens
    tokens.each { |token| puts token }
    tokens
  end
end
```

### 4.1.1 错误处理

当运行出现错误时，需要提供报错信息。前端的各个阶段都会检测到错误，理想情况下，应该提供一个供各个阶段使用的 `ErrorReporter` 接口，但为了简单起见，统一在 `Lox` 类中处理。

在 `Lox` 类中添加：

```ruby
class Lox
  def error(line, line_content, column, message, where = '')
    @has_error = true
    report(line, line_content, column, message, where)
  end

  private

  def report(line, line_content, column, message, where)
    puts "[line #{line}:#{column}] Error - #{message}: #{where}"
    puts "#{line} | #{line_content}"
    puts "#{' ' * (line.to_s.length + column + 2)}^-- here"
  end
end
```

## 4.2 词素和标记

```javascript
var language = "lox";
```

这里 `var` 是用于声明变量的关键字，因此 `v`、`a`、`r` 这三个字符是有意义的。而词法分析就是通过扫描来确定有意义的字符，称为**词素**（Lexeme）。

上面代码中，其词素就应该为：

![img](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202404302306344.png)

词素只是源代码的原始字符串，在将字符序列分组为词素的过程中，还会有一些其它的信息，如标记类型、所处代码行数等额外信息，把词素和这些其它信息组合在一起，就是一个**标记**（Token，词法单元）。

### 4.2.1 标记类型

**关键字**（Keyword）是语法的重要组成，一个**标识符**（Identifier）不应该和关键字有冲突，因此关键字也是**保留字**（Reserved word）。

解释器在识别词素时，要记住是哪种类型的词素，每个关键字、操作符、标点、字面量等都有不同的类型。

`lib/scanner/token_type.rb` 文件：创建一个 `TokenType` 枚举，用于保存 Token 的类型。由于 Ruby 原生不支持枚举类型，因此在 `Gemfile` 中添加一个 `ruby-enum` 包。

```ruby
class TokenType
  include Ruby::Enum

  # Single-character tokens
  define :LEFT_PAREN, 'LEFT_PAREN' # (
  define :RIGHT_PAREN, 'RIGHT_PAREN' # )
  define :LEFT_BRACE, 'LEFT_BRACE' # {
  define :RIGHT_BRACE, 'RIGHT_BRACE' # }
  define :COMMA, 'COMMA' # ,
  define :DOT, 'DOT' # .
  define :SEMICOLON, 'SEMICOLON' # ;
  define :PLUS, 'PLUS' # +
  define :MINUS, 'MINUS' # -
  define :STAR, 'STAR' # *
  define :SLASH, 'SLASH' # /
  define :PERCENT, 'PERCENT' # %

  # One or two character tokens
  define :BANG, 'BANG' # !
  define :BANG_EQUAL, 'BANG_EQUAL' # !=
  define :EQUAL, 'EQUAL' # =
  define :EQUAL_EQUAL, 'EQUAL_EQUAL' # ==
  define :GREATER, 'GREATER' # >
  define :GREATER_EQUAL, 'GREATER_EQUAL' # >=
  define :LESS, 'LESS' # <
  define :LESS_EQUAL, 'LESS_EQUAL' # <=

  # Literals
  define :STRING, 'STRING' # "string"
  define :NUMBER, 'NUMBER' # 123.45
  define :IDENTIFIER, 'IDENTIFIER' # identifier

  # Keywords
  define :VAR, 'VAR' # var
  define :NIL, 'NIL' # nil
  define :TRUE, 'TRUE' # true
  define :FALSE, 'FALSE' # false
  define :AND, 'AND' # and
  define :OR, 'OR' # or
  define :IF, 'IF' # if
  define :ELSE, 'ELSE' # else
  define :WHILE, 'WHILE' # while
  define :FOR, 'FOR' # for
  define :FN, 'FN' # fn
  define :RETURN, 'RETURN' # return
  define :CLASS, 'CLASS' # class
  define :SELF, 'SELF' # self
  define :SUPER, 'SUPER' # super
  define :PRINT, 'PRINT' # print

  # End of file
  define :EOF, 'EOF'
end
```

### 4.2.2 字面量

字面量有对应词素——数字和字符串等。由于扫描器必须遍历每个字符才能正确识别，所以它还可以将值的文本表示转换为运行时对象，解释器后续将使用该对象。

### 4.2.3 位置信息

当发生错误时，需要抛出错误，并且附上错误对应的行号和其它必要信息。

`lib/scanner/token.rb` 文件：将这些 Token 信息都存放在 `Token` 类中。

```ruby
class Token
  def initialize(type, lexeme, literal, line)
    @type = type
    @lexeme = lexeme
    @literal = literal
    @line = line
  end

  def to_s
    format('type: %-13s lexeme: %-13s literal: %-13s line: %s', @type, @lexeme, @literal, @line)
  end
end
```

## 4.3 正则语言和表达式

扫描器的核心就是一个循环，从源码第一个字符开始扫描，计算该字符属于哪个词素，当达到词素末尾时，就输出一个标记。

决定一门语言如何将字符分组为词素的规则称为**词法语法**。通常能够使用正则表达式来进行匹配分组，这种语法规则能够被正则匹配的语言称为**正则语言**。

## 4.4 Scanner 类

`scanner.rb`：创建一个 Scanner 类用于扫描。

```ruby
class Scanner
  def initialize(lox, source)
    @lox = lox
    @source = source
    @tokens = []
    @position = 0
    @start = 0
    @current = 0
    @line = 1
    @column = 0
  end
end
```

`@tokens` 用于保存每次扫描后的 Token，`@position` 表示当前行开始字符下标，`@start` 表示当前词素开始字符下标，`@current` 表示当前字符下标，`@line` 表示当前字符所在行数，`@column` 表示当前字符所在列数。

然后添加 `scan_tokens` 方法：

```ruby
class Scanner
  def scan_tokens
    until at_end?
      @start = @current
      scan_token
    end
    @tokens << Token.new(TokenType::EOF, '', nil, @line)
  end
end
```

`scan_tokens` 通过遍历源代码，添加 Token，直到遍历完后在最后添加一个类型为 `EOF` 的 Token，这不是必须的，但可以使解析器实现更加清晰。

在 `scan_tokens` 中，使用了辅助函数 `at_end?`，用于判断是否已经遍历完源代码字符：

```ruby
class Scanner
  private

  def at_end?
    @current >= @source.length
  end
end
```

## 4.5 识别词素

每次循环都会扫描出一个 Token。若每个词素长度只有 1，那么扫描器只需要读取一个字符，然后为其选择一个 Token 类型即可。在 Lox 中，有些词素的确只有一个字符长，先从这些简单的词素开始。

模式匹配十分适合用来识别词素，在 `scan_tokens` 中，每次循环都会调用 `scan_token` 方法，这里也在 `Scanner` 中定义：

```ruby
class Scanner
  private

  def scan_token
    char = advance
    case char
    # Single-character tokens
    when '(' then add_token(TokenType::LEFT_PAREN)
    when ')' then add_token(TokenType::RIGHT_PAREN)
    when '{' then add_token(TokenType::LEFT_BRACE)
    when '}' then add_token(TokenType::RIGHT_BRACE)
    when ',' then add_token(TokenType::COMMA)
    when '.' then add_token(TokenType::DOT)
    when ';' then add_token(TokenType::SEMICOLON)
    when '+' then add_token(TokenType::PLUS)
    when '-' then add_token(TokenType::MINUS)
    when '*' then add_token(TokenType::STAR)
    end
  end
end
```

其中，也使用了一些辅助方法：

- `advance`：从源代码中获取后面指定个数的字符并返回；
- `add_token`：为当前词素添加一个 Token 类型。

```ruby
class Scanner
  private

  def advance(by = 1)
    @current += by
    @column += by
    @source[@current - by...@current]
  end

  def add_token(type, literal = nil)
    lexeme = @source[@start...@current]
    @tokens << Token.new(type, lexeme, literal, @line)
  end
end
```

### 4.5.1 词法错误

当源代码包含了一些 Lox 中不使用的字符，这些无法被识别为词素，就会抛出错误，同时该字符也会被消费，并更新 `@current`。

在 `case` 中添加处理错误的逻辑：

```ruby
class Scanner
  private

  def line_content
    @source[@position..@source.index("\n", @position)]
  end

  def scan_token
    char = advance
    case char
    # ...
    else
      @lox.error(@line, line_content, @column, 'Unexpected character', @source[@start...@current])
    end
  end
end
```

其中 `line_content` 是为了在发生错误时，取得当前错误行的内容，以提供更友好的错误提示。

### 4.5.2 操作符

单字符词素已经可以识别了，但不能涵盖所有的操作符，如 `!` 有时候是取非，但与 `=` 组合在一起时为 `!=` 不等于，在这种情况下，就需要再查看第二个字符。

在 `case` 中添加查看第二个字符的逻辑：

```ruby
class Scanner
  private

  def scan_token
    char = advance
    case char
    # ...
    # One or two character tokens
    when '!' then add_token(match('=') ? TokenType::BANG_EQUAL : TokenType::BANG)
    when '=' then add_token(match('=') ? TokenType::EQUAL_EQUAL : TokenType::EQUAL)
    when '>' then add_token(match('=') ? TokenType::GREATER_EQUAL : TokenType::GREATER)
    when '<' then add_token(match('=') ? TokenType::LESS_EQUAL : TokenType::LESS)
    when '%' then add_token(TokenType::PERCENT)
    # ...
  end
end
```

其中使用了 `match` 辅助方法，由于在 `advance` 中已经将 `@current` 更新了，所以这里直接可以获得下一个字符。

```ruby
def match(expected)
  return false if at_end? || @source[@current] != expected

  @current += 1
  @column += 1
  true
end
```

## 4.6 更长的词素

还缺少一个 `/` 操作符，但这个操作符不仅可以表示除法，还可以表示注释，当为注释时，判断是单行注释还是多行注释，并把表示注释的所有字符都消费掉，然后更新 `@line`

在 `case` 中添加处理 `/` 的逻辑：

```ruby
class Scanner
  private

  def scan_token
    char = advance
    case char
    # ...
    when '/'
      if match('/')
        skip_line_comment
      elsif match('*')
        skip_block_comment
      else
        add_token(TokenType::SLASH)
      end
    # ...
  end
end
```

添加 `skip_line_comment` 和 `skip_block_comment` 辅助方法：

```ruby
class Scanner
  private

  def skip_line_comment
    advance while peek != "\n" && !at_end?
  end

  def skip_block_comment
    advance
    while !(peek == '*' && peek(1) == '/') && !at_end?
      @line += 1 if peek == "\n"
      advance
    end
    advance(2)
  end
end
```

这是处理长词素的一般策略：当检测到一个词素的开头后，会分流属于该词素的字符，直到结尾。

其中使用了 `peek` 辅助方法，用于预读后面的字符，但是不消费，称为**前瞻**（Lookahead）。词法语法规则决定了在识别某些词素时需要前瞻多少个字符，前瞻字符越少，扫描器速度就越快。

`peek` 默认会前瞻后面第 `offset + 1` 个字符：

```ruby
class Scanner
  private

  def peek(offset = 0)
    return "\0" if @current + offset >= @source.length

    @source[@current + offset]
  end
end
```

对于注释选择无视，对于空白字符，同样也可以无视，当遇到换行符时，更新 `@position` 和 `@line`。

```ruby
class Scanner
  private

  def scan_token
    char = advance
    case char
    # ...
    when ' ', "\r", "\t" # Ignore whitespace
    when "\n"
      @position = @current
      @line += 1
      @column = 0
    # ...
  end
end
```

### 4.6.1 字符串字面量

字符串都以 `"` 开头和结尾，因此可以根据该特征识别字符串字面量：

```ruby
class Scanner
  private

  def scan_token
    char = advance
    case char
    # ...
    when '"' then string
    # ...
  end
end
```

其中使用了 `string` 辅助方法，会一直读取下一个字符，直到遇到下一个 `"`，如果遇到了错误则抛出。

```ruby
class Scanner
  private

  def string
    while peek != '"' && !at_end?
      @line += 1 if peek == "\n"
      advance
    end

    if at_end?
      @lox.error(@line, line_content, @column, 'Unterminated string', @source[@start...@current])
      return
    end

    advance
    literal = @source[(@start + 1)...(@current - 1)]
    add_token(TokenType::STRING, literal)
  end
end
```

可以看到，Lox 支持多行字符串，并在遇到新行时更新 `@line` 和 `@column`，并在创建 Token 时，把前后的引号剥离，因此取 `@start + 1...@current - 1`。

### 4.6.2 数字字面量

Lox 中所有数字在运行时都是浮点数，但支持整数和浮点数字面量：

```
1234
12.34
```

为了简单起见，**不支持**小数点处于开头或末尾：

```
.1234
1234.
```

若支持前者，那么在解析时需要更多的前瞻处理，若支持后者，那么在进行方法调用时会比较奇怪。

在 `case` 中添加对数字的处理逻辑：

```ruby
class Scanner
  private

  def scan_token
    char = advance
    case char
    # ...
    when /[0-9]/ then number
    # ...
  end
end
```

其中使用了 `number` 辅助方法，会先读取所有遇到的数字，当读取完毕后，前瞻一个字符判断是不是 `.`，如果是，则再前瞻一个字符判断是否为数字，如果是，则继续读取剩余数字。

```ruby
class Scanner
  private

  def number
    advance while peek >= '0' && peek <= '9'
    if peek == '.' && peek(1) >= '0' && peek(1) <= '9'
      advance
      advance while peek >= '0' && peek <= '9'
    end
    add_token(TokenType::NUMBER, @source[@start...@current].to_f)
  end
end
```

由于在运行时所有数字都由浮点数表示，因此最后使用 `to_f` 转换。

## 4.7 保留字和标识符

词法语法中还需要实现的部分仅剩保留字和标识符了。如果采用之前多字符操作符匹配的方法，那么当遇到 `orchid` 这种标识符时，会直接将前两个字符 `or` 识别为 `OR`，这样肯定是不对的。

针对这种情况，扫描器采取**最长匹配**（Maximal munch）原则：当多个语法规则都能匹配扫描器正在处理的一段代码时，使用匹配字符最多的那个。这表示只有在扫描完一个可能是标识符的全部片段，才能确认是否是一个保留字，因为保留字本质上也是一个标识符，只不过被语言本身所使用。

可以将 `orchid` 匹配为一个 `or` 关键字和一个 `chid` 标识符，也可以匹配为一个 `orchid` 标识符，根据该原则，则使用后者。

首先任何以字母或下划线开头的词素都是一个标识符：

```ruby
class Scanner
  private

  def scan_token
    char = advance
    case char
    # ...
    when /[a-zA-Z_]/ then identifier
    # ...
  end
end
```

添加辅助方法 `identifier`，先一直匹配属于标识符的字符，然后判断该标识符是否属于保留字。

```ruby
class Scanner
  private

  def identifier
    advance while peek.match?(/[a-zA-Z0-9_]/)
    lexeme = @source[@start...@current]
    type = TokenType.key(lexeme.upcase).to_s if TokenType.key?(lexeme.upcase.to_sym)
    type ||= TokenType::IDENTIFIER
    add_token(type)
  end
end
```

## 设计笔记：隐藏的分号

很多语言对表达式和语句的处理是有差别的。如使用 `;` 作为语句的结束，或使用换行作为语句的结束。尽管大多数的语句都是在同一行，但如果需要将一个语句扩展到多行，这其中的换行符就不应该被视为语句结束符。

在大多数明显忽略换行的情况下都比较容易辨别，但也有少数难以区分的情况。

---

返回值在下一行：

```
if (cond) return
("value")
```

`"value"` 是代表返回值还是一个单纯的放在 `if` 后的字符串字面量的表达式语句？

---

下一行中带有圆括号的表达式：

```
foo
(a)
```

这是一个 `foo(a)` 的函数调用还是两个表达式语句？

---

`-` 在下一行：

```
a
-b
```

这是一个 `a - b` 表达式还是两个表达式语句？

在所有上面这些情况下，无论是否将换行视为分隔符，都会产生有效的代码，虽然可能和代码的意图不一样。在不同的语言中，有不同的规则来区分哪些是换行那些是分隔符。

---

Lua 完全忽略换行，下面代码是合法的：

```lua
a = 1 b = 2
```

Lua 还要求 `return` 必须是块中最后一条语句。

---

Go 会处理换行符，如果在词法单元之后出现，且该词法标记是已知可能结束语句的少数标记类型之一，则将其视为分隔符，否则就忽略。

Python 将所有换行符视为有效，除非在行末使用 `\` 来延续到下一行，但 `[]`、`()` 和 `{}` 内的任何换行都会被忽略。因此 Python 要求 Lambda 必须在同一行上，否则还需要一套不同的隐式连接行的规则

这确保了语句永远不会出现在表达式内。C 语言也是如此，但是很多带有 Lambda 的语言则不然，如 JavaScript：

```javascript
console.log(() => {
  foo();
});
```

`console.log()` 表达式包含了一个函数，这个函数又包含了 `foo` 语句。

JavaScript 还有自动分号插入规则。在很多语言中，大部分的换行都是有意义的，只有少数换行应该在多行语句中被忽略。而 JavaScript 相反，将所有换行都视为无意义空白，除非遇到解析错误，如果遇到了，则会把前面遇到的换行变成分号以期望得到正确的语法。
