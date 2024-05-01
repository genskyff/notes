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
    scanner = Scanner.new(source)
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

词素只是源代码的原始字符串，在将字符序列分组为词素的过程中，还会有一些其它的信息，如标记类型、所处代码行数等额外信息，把词素和这些其它信息组合在一起，就是一个**标记**（token，词法单元）。

### 4.2.1 标记类型

**关键字**（Keyword）是语法的重要组成，一个**标识符**（Identifier）不应该和关键字有冲突，因此关键字也是**保留字**（Reserved word）。

解释器在识别词素时，要记住是哪种类型的词素，每个关键字、操作符、标点、字面量等都有不同的类型。

`token_type.rb` 文件：创建一个 `TokenType` 枚举，用于保存标记的类型。由于 Ruby 原生不支持枚举类型，因此在 `Gemfile` 中添加一个 `ruby-enum` 包。

```ruby
class TokenType
  include Ruby::Enum

  # Single-character tokens
  define :LEFT_PAREN, 'LEFT_PAREN'
  define :RIGHT_PAREN, 'RIGHT_PAREN'
  define :LEFT_BRACE, 'LEFT_BRACE'
  define :RIGHT_BRACE, 'RIGHT_BRACE'
  define :COMMA, 'COMMA'
  define :DOT, 'DOT'
  define :MINUS, 'MINUS'
  define :PLUS, 'PLUS'
  define :SEMICOLON, 'SEMICOLON'
  define :SLASH, 'SLASH'
  define :STAR, 'STAR'

  # One or two character tokens
  define :BANG, 'BANG'
  define :BANG_EQUAL, 'BANG_EQUAL'
  define :EQUAL, 'EQUAL'
  define :EQUAL_EQUAL, 'EQUAL_EQUAL'
  define :GREATER, 'GREATER'
  define :GREATER_EQUAL, 'GREATER_EQUAL'
  define :LESS, 'LESS'
  define :LESS_EQUAL, 'LESS_EQUAL'

  # Literals
  define :IDENTIFIER, 'IDENTIFIER'
  define :STRING, 'STRING'
  define :NUMBER, 'NUMBER'

  # Keywords
  define :AND, 'AND'
  define :CLASS, 'CLASS'
  define :ELSE, 'ELSE'
  define :FALSE, 'FALSE'
  define :FUN, 'FUN'
  define :FOR, 'FOR'
  define :IF, 'IF'
  define :NIL, 'NIL'
  define :OR, 'OR'
  define :PRINT, 'PRINT'
  define :RETURN, 'RETURN'
  define :SUPER, 'SUPER'
  define :THIS, 'THIS'
  define :TRUE, 'TRUE'
  define :VAR, 'VAR'
  define :WHILE, 'WHILE'

  # End of file
  define :EOF, 'EOF'
end
```

### 4.2.2 字面量

字面量有对应词素——数字和字符串等。由于扫描器必须遍历每个字符才能正确识别，所以它还可以将值的文本表示转换为运行时对象，解释器后续将使用该对象。

### 4.2.3 位置信息

当发生错误时，需要抛出错误，并且附上错误对应的行号和其它必要信息。为了简单起见，只实现行号信息，而不包括列位置和长度。

`token.rb` 文件：将这些标记信息都存放在 `Token` 类中。

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

