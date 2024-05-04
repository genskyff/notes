# 4 扫描

任何编译器或解释器的第一步就是扫描。扫描器接受字符串，并将其分组成一系列标识，即词法单元序列，这些有意义的单词和标点构成了语言的语法。

>   -   原文作者使用 Java 实现，这里改为使用 Ruby 实现；
>   -   为了简略，代码只展示核心部分。

## 4.1 解释器框架

`main.rb`：执行入口，可以读取文件执行，或使用交互式的方式执行。

```ruby
if ARGV.length > 1
  puts 'Usage: ruby main.rb [file]'
elsif ARGV.length == 1
  Lox.new.run_file(ARGV[0])
else
  Lox.new.run_prompt
end
```

`lox.rb`：`Lox` 类文件，用于生成一个新的 `Lox` 实例。其中 `run_file` 用于读文件然后 `run` 其中的源代码。`run_prompt` 用于交互式的执行，暂时未考虑到多行输入的情况。目前 `run` 仅仅是将 `tokens` 打印出来，先将整体框架搭好，后面会慢慢完善。

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
      line = gets.chomp
      next if line.empty?
      break if %w[quit exit].include?(line)

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
  end
end
```

### 4.1.1 错误处理

当运行出现错误时，需要提供报错信息。前端的各个阶段都会检测到错误，理想情况下，应该提供一个供各个阶段使用的 `ErrorReporter` 接口，但为了简单起见，统一在 `Lox` 类中处理。

在 `Lox` 类中添加：

```ruby
class Lox
  def error(line, message)
    @has_error = true
    report(line, '', message)
  end

  private

  def report(line, where, message)
    puts "[line #{line}] Error #{where}: #{message}"
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

`token_type.rb` 文件：创建一个 `TokenType` 枚举，用于保存 Token 的类型。由于 Ruby 原生不支持枚举类型，因此在 `Gemfile` 中添加一个 `ruby-enum` 包。

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
  define :MINUS, 'MINUS' # -
  define :PLUS, 'PLUS' # +
  define :SEMICOLON, 'SEMICOLON' # ;
  define :SLASH, 'SLASH' # /
  define :STAR, 'STAR' # *

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
  define :IDENTIFIER, 'IDENTIFIER' # variable name
  define :STRING, 'STRING' # "string"
  define :NUMBER, 'NUMBER' # 123.12

  # Keywords
  define :AND, 'AND' # and
  define :CLASS, 'CLASS' # class
  define :ELSE, 'ELSE' # else
  define :FALSE, 'FALSE' # false
  define :FUN, 'FUN' # fun
  define :FOR, 'FOR' # for
  define :IF, 'IF' # if
  define :NIL, 'NIL' # nil
  define :OR, 'OR' # or
  define :PRINT, 'PRINT' # print
  define :RETURN, 'RETURN' # return
  define :SUPER, 'SUPER' # super
  define :THIS, 'THIS' # this
  define :TRUE, 'TRUE' # true
  define :VAR, 'VAR' # var
  define :WHILE, 'WHILE' # while

  # End of file
  define :EOF, 'EOF'
end
```

### 4.2.2 字面量

字面量有对应词素——数字和字符串等。由于扫描器必须遍历每个字符才能正确识别，所以它还可以将值的文本表示转换为运行时对象，解释器后续将使用该对象。

### 4.2.3 位置信息

当发生错误时，需要抛出错误，并且附上错误对应的行号和其它必要信息。为了简单起见，只实现行号信息，而不包括列位置和长度。

`token.rb` 文件：将这些 Token 信息都存放在 `Token` 类中。

```ruby
class Token
  def initialize(type, lexeme, literal, line)
    @type = type
    @lexeme = lexeme
    @literal = literal
    @line = line
  end

  def to_s
    "#{@type} #{@lexeme} #{@literal}"
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
    @start = 0
    @current = 0
    @line = 1
  end
end
```

`@tokens` 用于保存每次扫描后的 Token，`@start` 表示当前词素开头的字符下标，`@current` 表示当前扫描的字符下标，`@line` 表示 `@current` 所在行数。

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

模式匹配十分使用用来识别词素，在 `scan_tokens` 中，每次循环都会调用 `scan_token` 方法，这里也在 `Scanner` 中定义：

```ruby
class Scanner
  private

  def scan_token
    char = advance
    case char
    when '(' then add_token(TokenType::LEFT_PAREN)
    when ')' then add_token(TokenType::RIGHT_PAREN)
    when '{' then add_token(TokenType::LEFT_BRACE)
    when '}' then add_token(TokenType::RIGHT_BRACE)
    when ',' then add_token(TokenType::COMMA)
    when '.' then add_token(TokenType::DOT)
    when '-' then add_token(TokenType::MINUS)
    when '+' then add_token(TokenType::PLUS)
    when ';' then add_token(TokenType::SEMICOLON)
    when '*' then add_token(TokenType::STAR)
    end
  end
end
```

其中，也使用了一些辅助方法：

-   `advance`：从源代码中获取下一个字符并返回；
-   `add_token`：为当前词素添加一个 Token 类型。

```ruby
class Scanner
  private

  def advance
    @current += 1
    @source[@current - 1]
  end

  def add_token(type, literal = nil)
    text = @source[@start...@current]
    @tokens << Token.new(type, text, literal, @line)
  end
end
```

### 4.5.1 词法错误

当源代码包含了一些 Lox 中不使用的字符，这些无法被识别为词素，就会抛出错误，同时该字符也会被消费，并将 `@current` 加 1。

在 `case` 中添加处理错误的逻辑：

```ruby
class Scanner
  private

  def scan_token
    char = advance
    case char
    # ...
    else
      @lox.error(@line, 'Unexpected character')
    end
  end
end
```

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
    when '!' then add_token(match('=') ? TokenType::BANG_EQUAL : TokenType::BANG)
    when '=' then add_token(match('=') ? TokenType::EQUAL_EQUAL : TokenType::EQUAL)
    when '<' then add_token(match('=') ? TokenType::LESS_EQUAL : TokenType::LESS)
    when '>' then add_token(match('=') ? TokenType::GREATER_EQUAL : TokenType::GREATER)
    # ...
  end
end
```

其中使用了 `match` 辅助方法，由于在 `advance` 中已经将 `@current` 加 1 了，所以这里直接可以获得下一个字符。

```ruby
def match(expected)
  return false if at_end? || @source[@current] != expected

  @current += 1
  true
end
```

## 4.6 更长的词素

还缺少一个 `/` 操作符，但这个操作符不仅可以表示除法，还可以表示注释，当为注释时，需要把当前行之后的所有字符都消费掉然后调至下一行开始继续识别。

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
        advance while peek != "\n" && !at_end?
      else
        add_token(TokenType::SLASH)
      end
    # ...
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

对于注释选择无视，对于空白字符，同样也可以无视，当遇到换行符时，将 `@line` 加 1。

```ruby
class Scanner
  private

  def scan_token
    char = advance
    case char
    # ...
    when ' ', "\r", "\t"
      # Ignore whitespace
    when "\n"
      @line += 1
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
    @lox.error(@line, 'Unterminated string') if at_end?
    advance
    value = @source[(@start + 1)...(@current - 1)]
    add_token(TokenType::STRING, value)
  end
end
```

可以看到，Lox 支持多行字符串，并在遇到新行时更新 `@line` 值，并在创建 Token 时，把前后的引号剥离，因此取 `@start + 1...@current - 1`。

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
    when '0'..'9' then number
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

由于在运行时所有数字都已浮点数表示，因此最后使用 `to_f` 转换。

## 4.7 保留字和标识符

