# 4 扫描

任何编译器或解释器的第一步就是扫描。扫描器接受字符串，并将其分组成一系列标识，即词法单元序列，这些有意义的单词和标点构成了语言的语法。

> - 原文使用 Java 实现，这里改为使用 Ruby 实现
> - 为了简略，代码只展示核心部分

## 4.1 解释器框架

`exe/lox`：执行入口，可以读取文件执行，或使用交互式的方式执行。

```ruby
require_relative "../lib/lox"

if ARGV.length > 1
  warn "Usage: ruby exe/lox [file]"
elsif ARGV.length == 1
  Lox::Entry.new.run_file(ARGV[0])
else
  Lox::Entry.new.run_prompt
end
```

`lib/lox.rb`：定义整个 `Lox` 模块的根入口。

```ruby
module Lox; end
```

`lib/lox`：所有的 `Lox` 模块中的具体定义都在该目录下实现。

`Entry` 类：执行入口，用于生成一个新的 `Lox` 实例。其中 `run_src` 用于执行给定的字符串。`run_prompt` 用于交互式的执行，暂时未考虑到多行输入的情况。`run_file` 用于读文件执行。`run` 用于统一开始执行流程。

```ruby
class Lox::Entry
  def initialize
    @error_collector = Lox::ErrorCollector.new
  end

  def run_src(src)
    line_from = 1

    if src[..1] == "#!"
      eol = Lox::Utils.detect_eol(src)
      return unless eol

      idx = src.index(eol)
      return unless idx

      line_from += 1
    end

    @src_map = Lox::SourceMap.new(src:, line_from:).freeze
    run(repl: true)
  rescue Lox::Error
    handle_run_src_or_prompt_error
  rescue StandardError => e
    handle_exception(e)
  end

  def run_prompt
    line = 1
    has_error = false

    puts "Welcome to Lox REPL!".yellow
    puts "Type #{":h".blue} for more information."

    Readline.completion_append_character = nil
    Readline.completion_proc = proc do |input|
      commands = %w[:q :quit :h :help]
      commands.grep(/^#{Regexp.escape(input)}/)
    end

    loop do
      prompt = if has_error
                 "lox:#{line}> ".red
               else
                 "lox:#{line}> ".green
               end

      line += 1
      src = Readline.readline(prompt, false)&.strip
      break if src.nil? # Ctrl+D
      next if src.empty?
      break if %w[:q :quit].include?(src)

      Readline::HISTORY.push(src) unless src == Readline::HISTORY.last

      if %w[:h :help].include?(src)
        puts "Type #{":q".blue} or #{":quit".blue} to quit the REPL."
        puts "Type #{":h".blue} or #{":help".blue} to display this help message."
        next
      end

      @src_map = Lox::SourceMap.new(src:, line_from: line - 1).freeze
      run(repl: true)

      has_error = @error_collector.error?
    rescue Lox::Error
      has_error = true
      handle_run_src_or_prompt_error
    end
  rescue StandardError => e
    handle_exception(e)
  end

  def run_file(file)
    src = Lox::Utils.read_file_without_bom(file)
    line_from = 1

    if src[..1] == "#!"
      eol = Lox::Utils.detect_eol(src)
      return unless eol

      idx = src.index(eol)
      return unless idx

      line_from += 1
    end

    @src_map = Lox::SourceMap.new(file:, src:, line_from:)
    run
  rescue Lox::Error
    handle_run_file_error(file)
  rescue StandardError => e
    handle_exception(e)
  end

  private

  def run(repl: false)
    tokens = Lox::Scanner.new(src_map: @src_map, error_collector: @error_collector).scan
    pp tokens
    raise Lox::Error::ScannerError if @error_collector.error?
  end

  def handle_run_src_or_prompt_error
    @error_collector.report
    @error_collector.clear
  end

  def handle_run_file_error(file)
    error_count = @error_collector.errors.count
    @error_collector.report
    warn "#{"error".red}: failed to run #{file} with #{error_count.to_s.highlight} error#{error_count > 1 ? "s" : ""}"
    warn "\n"
    exit 65
  end

  def handle_exception(exception)
    warn "#{"error".red}: #{exception.message.highlight}"
    warn "#{"backtrace".yellow}:"
    warn exception.backtrace.map { "  #{it}" }.join("\n")
    exit(-1)
  end
end
```

### 4.1.1 错误处理

当运行出现错误时，需要提供报错信息。前端的各个阶段都会检测到错误，需要收集错误的上下文和位置信息，还需要错误收集器和各个阶段的错误类型，以及管理源代码映射的类，并在每个阶段传递这些必要的信息。

创建用于管理源代码的 `SourceMap` 类：

```ruby
class Lox::SourceMap
  attr_reader :file, :src, :line_from, :eol, :line_start_offsets, :line_end_offsets

  def initialize(file: nil, src: "", line_from: 1)
    @file = file.freeze
    @src = src.freeze
    @line_from = line_from
    @eol = Lox::Utils.detect_eol(src).freeze
    @line_start_offsets = [0]
    @line_end_offsets = []

    unless @eol
      @line_end_offsets << [@src.length - 1, 0].max
      return
    end

    line_offset = 0
    while (newline_offset = @src.index(@eol, line_offset))
      line_offset = newline_offset + @eol.length
      @line_start_offsets << line_offset if line_offset < @src.length
      @line_end_offsets << (line_offset - 1) if line_offset < @src.length
    end
    @line_end_offsets << [@src.length - 1, 0].max

    @line_start_offsets.freeze
    @line_end_offsets.freeze
  end

  def offset_to_line(offset)
    return 1 if offset <= 0

    @line_start_offsets.bsearch_index { it > offset } || @line_start_offsets.size
  end

  def offset_to_column(offset)
    offset = @src.length - 1 if offset >= @src.length
    return 1 if offset <= 0

    offset - @line_start_offsets[offset_to_line(offset) - 1] + 1
  end

  def offset_to_line_column(offset)
    [offset_to_line(offset), offset_to_column(offset)]
  end

  def line_to_start_offset(line)
    return 0 if line <= 0

    line = @line_start_offsets.size if line > @line_start_offsets.size
    @line_start_offsets[line - 1]
  end

  def line_to_end_offset(line)
    return @line_end_offsets[0] if line <= 0

    line = @line_start_offsets.size if line > @line_start_offsets.size
    @line_end_offsets[line - 1]
  end

  def line_to_src(line)
    start_offset = line_to_start_offset(line)
    end_offset = line_to_end_offset(line)
    @src[start_offset..end_offset].freeze
  end

  def line_range_to_src(line_range)
    start_line = line_range.begin.clamp(1, @line_start_offsets.size)
    end_line = line_range.end.clamp(start_line, @line_start_offsets.size)
    start_offset = line_to_start_offset(start_line)
    end_offset = line_to_end_offset(end_line)
    @src[start_offset..end_offset].freeze
  end
end
```

创建用于保存位置信息的 `Location` 类：

```ruby
class Lox::Location
  attr_reader :file, :offset, :line, :column

  def initialize(src_map:, start_offset:, end_offset:)
    start_line, start_column = src_map.offset_to_line_column(start_offset)
    start_line += src_map.line_from - 1 unless src_map.file
    end_line, end_column = src_map.offset_to_line_column(end_offset)
    end_line += src_map.line_from - 1 unless src_map.file
    @file = src_map.file
    @offset = { start: start_offset, end: end_offset }.freeze
    @line = { start: start_line, end: end_line }.freeze
    @column = { start: start_column, end: end_column }.freeze
  end
end
```

创建用于获取上下文的 `Context` 类：

```ruby
class Lox::Context
  attr_reader :location

  def initialize(src_map, location)
    @src_map = src_map
    @location = location
  end

  def start_line_prefix
    start_offset = @location.offset[:start]
    start_line = @location.line[:start]
    start_line_offset = @src_map.line_to_start_offset(start_line)
    @src_map.src[start_line_offset...start_offset]
  end

  def end_line_prefix
    end_offset = @location.offset[:end]
    end_line = @location.line[:end]
    end_line_offset = @src_map.line_to_start_offset(end_line)
    @src_map.src[end_line_offset..end_offset]
  end

  def part
    start_offset = @location.offset[:start]
    end_offset = @location.offset[:end]
    @src_map.src[start_offset..end_offset]
  end

  def ctx
    start_line = @location.line[:start]
    end_line = @location.line[:end]
    @src_map.line_range_to_src(start_line..end_line)
  end
end

```

创建用于错误收集的 `ErrorCollector` 类：

```ruby
class Lox::ErrorCollector
  attr_reader :errors

  def initialize
    @errors = []
  end

  def error?
    !@errors.empty?
  end

  def add(error)
    @errors << error
  end

  def pop
    @errors.pop
  end

  def clear
    @errors.clear
  end

  def merge(other_errors)
    @errors.concat(other_errors)
  end

  def report
    @errors.each do |error|
      warn error
      warn "\n"
    end
  end
end
```

创建错误类型，并格式化错误信息：

```ruby
class Lox::Error < StandardError
  attr_reader :message, :context

  MAX_CTX_LINES = 5

  def initialize(message = "", context = {})
    super(message)
    @message = message
    @context = context
  end

  def to_s
    format_error
  end

  protected

  def format_error
    ctx = @context.ctx.lines
    part = @context.part
    start_line = @context.location.line[:start]
    end_line = @context.location.line[:end]
    start_column = @context.location.column[:start]

    gap_len = [start_line, end_line].max.to_s.length
    gap_len = [gap_len, "...".length].max if ctx.size > MAX_CTX_LINES
    gap = " " * gap_len
    gap_with_bar = "#{gap} |".blue

    info = ["#{"error".red}: #{@message.highlight}"]
    info << "#{gap}#{"-->".blue} #{@context.location.file}:#{start_line}:#{start_column}"
    info << gap_with_bar

    part_width = Unicode::DisplayWidth.of(part)
    start_line_prefix_width = Unicode::DisplayWidth.of(@context.start_line_prefix)
    end_line_prefix_width = Unicode::DisplayWidth.of(@context.end_line_prefix)

    if ctx.size <= 1
      info << ("#{start_line} | ".blue + ctx.last.chomp)
      info << ("#{"#{gap_with_bar} #{" " * start_line_prefix_width}"}#{part_mark(part_width)}")
    elsif ctx.size <= MAX_CTX_LINES
      info << ("#{start_line.to_s.rjust(gap_len)} |   ".blue + ctx.first.chomp)
      info << ("#{gap_with_bar}  #{"_".red * (start_line_prefix_width + 1)}#{"^".red}")
      ctx[1..].each_with_index do |line, index|
        info << ("#{(start_line + index + 1).to_s.rjust(gap_len)} | ".blue + "| ".red + line.chomp)
      end
      info << ("#{gap_with_bar} #{"|".red}#{"_".red * end_line_prefix_width}#{"^".red}")
    else
      info << ("#{start_line.to_s.rjust(gap_len)} |   ".blue + ctx.first.chomp)
      info << ("#{gap_with_bar}  #{"_".red * (start_line_prefix_width + 1)}#{"^".red}")
      ctx[1..2].each_with_index do |line, index|
        info << ("#{(start_line + index + 1).to_s.rjust(gap_len)} | ".blue + "| ".red + line.chomp)
      end
      info << ("...   ".blue + "|".red)
      ctx[-2..].each_with_index do |line, index|
        info << ("#{(start_line + index + ctx[...-2].size).to_s.rjust(gap_len)} | ".blue + "| ".red + line.chomp)
      end
      info << ("#{gap_with_bar} #{"|".red}#{"_".red * end_line_prefix_width}#{"^".red}")
    end

    info.join("\n")
  end

  private

  def part_mark(length)
    ("^" * [1, length].max).red
  end
end

class Lox::Error::ScannerError < Lox::Error; end
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

创建一个 `TokenType` 枚举，用于保存 Token 的类型。由于 Ruby 原生不支持枚举类型，因此在 `Gemfile` 中添加一个 `ruby-enum` 包。

```ruby
module Lox
  class TokenType
    include Ruby::Enum

    # single-character tokens
    define :LEFT_BRACE # {
    define :RIGHT_BRACE # }
    define :LEFT_PAREN # (
    define :RIGHT_PAREN # )
    define :COMMA # ,
    define :DOT # .
    define :COLON # :
    define :QMARK # ?
    define :SEMICOLON # ;
    define :PLUS # +
    define :MINUS # -
    define :STAR # *
    define :SLASH # /
    define :PERCENT # %
    define :CARET # ^

    # one or two character tokens
    define :BANG # !
    define :BANG_EQUAL # !=
    define :EQUAL # =
    define :EQUAL_EQUAL # ==
    define :GREATER # >
    define :GREATER_EQUAL # >=
    define :LESS # <
    define :LESS_EQUAL # <=

    # literals
    define :STRING # e.g. "abc" "abc\n123"
    define :NUMBER # e.g. 0 123.45
    define :IDENTIFIER # e.g. abc abc123 _abc abc_123

    # end of file
    define :EOF

    def self.keyword?(lexeme)
      Keyword.values.any? { it == lexeme }
    end

    def self.builtin?(lexeme)
      BuiltIn.values.any? { it == lexeme }
    end
  end

  class Keyword < TokenType
    define :VAR, "var"
    define :NIL, "nil"
    define :AND, "and"
    define :OR, "or"
    define :TRUE, "true"
    define :FALSE, "false"
    define :IF, "if"
    define :ELSE, "else"
    define :WHILE, "while"
    define :FOR, "for"
    define :BREAK, "break"
    define :NEXT, "next"
    define :FUN, "fun"
    define :RETURN, "return"
    define :CLASS, "class"
    define :THIS, "this"
    define :SUPER, "super"
  end

  class BuiltIn < TokenType
    define :PRINT, "print"
    define :READ, "read"
  end
end

```

### 4.2.2 字面量

字面量有对应词素——数字和字符串等。由于扫描器必须遍历每个字符才能正确识别，所以它还可以将值的文本表示转换为运行时对象，解释器后续将使用该对象。

### 4.2.3 位置信息

将这些 Token 信息都存放在 `Token` 类中。

```ruby
class Lox::Token
  attr_reader :type, :location, :lexeme, :literal

  def initialize(type:, location: nil, lexeme: "", literal: nil)
    @type = type
    @location = location
    @lexeme = lexeme
    @literal = literal
  end
end
```

## 4.3 正则语言和表达式

扫描器的核心就是一个循环，从源码第一个字符开始扫描，计算该字符属于哪个词素，当达到词素末尾时，就输出一个标记。

决定一门语言如何将字符分组为词素的规则称为**词法语法**。通常能够使用正则表达式来进行匹配分组，这种语法规则能够被正则匹配的语言称为**正则语言**。

## 4.4 Scanner 类

创建一个 `Scanner` 类用于扫描，`@pos` 表示当前字符开始的下标，`@lexeme_pos` 表示当前词素开始字符的下标，`@tokens` 用于保存每次扫描后的 Token。

```ruby
class Lox::Scanner
  def initialize(src_map:, error_collector:)
    @src_map = src_map
    @error_collector = error_collector
    @src = @src_map.src
    @pos = @src_map.line_to_start_offset(@src_map.line_from)
    @lexeme_pos = @pos
    @tokens = []
  end
end
```

然后添加 `scan` 方法：

```ruby
class Lox::Scanner
  def scan
    tokenize until at_end?
    @lexeme_pos = @pos
    add_token(Lox::TokenType::EOF)
  end
end
```

`scan` 通过遍历源代码，添加 Token，直到遍历完后在最后添加一个类型为 `EOF` 的 Token，这不是必须的，但可以使解析器实现更加清晰。

在 `scan` 中，使用了辅助函数 `at_end?`，用于判断是否已经遍历完源代码字符：

```ruby
class Lox::Scanner
  private

  def at_end?(offset = 0)
    @pos + offset >= @src.length
  end
end
```

## 4.5 识别词素

每次循环都会扫描出一个 Token。若每个词素长度只有 1，那么扫描器只需要读取一个字符，然后为其选择一个 Token 类型即可。在 Lox 中，有些词素的确只有一个字符长，先从这些简单的词素开始。

模式匹配十分适合用来识别词素，在 `scan` 中，每次循环都会调用 `tokenize` 方法，这里也在 `Scanner` 中定义：

```ruby
class Lox::Scanner
  private

  def tokenize
    @lexeme_pos = @pos
    case advance
    # single-character tokens
    when "{" then add_token(Lox::TokenType::LEFT_BRACE)
    when "}" then add_token(Lox::TokenType::RIGHT_BRACE)
    when "(" then add_token(Lox::TokenType::LEFT_PAREN)
    when ")" then add_token(Lox::TokenType::RIGHT_PAREN)
    when "," then add_token(Lox::TokenType::COMMA)
    when "." then add_token(Lox::TokenType::DOT)
    when ":" then add_token(Lox::TokenType::COLON)
    when "?" then add_token(Lox::TokenType::QMARK)
    when ";" then add_token(Lox::TokenType::SEMICOLON)
    when "+" then add_token(Lox::TokenType::PLUS)
    when "-" then add_token(Lox::TokenType::MINUS)
    when "*" then add_token(Lox::TokenType::STAR)
    end
  end
end
```

其中，也使用了一些辅助方法：

- `advance`：从源代码中消耗一个字符并返回
- `location`：获取当前要添加 Token 的位置信息
- `add_token`：为当前词素添加一个 Token 类型
- `lexeme`：获取当前词素

```ruby
class Lox::Scanner
  private

  def advance
    @pos += 1
    @src[@pos - 1]
  end

  def location
    Lox::Location.new(src_map: @src_map, start_offset: @lexeme_pos, end_offset: @pos - 1)
  end

  def add_token(type, literal = nil)
    @tokens << if type == Lox::TokenType::EOF
                 Lox::Token.new(type:, location:)
               else
                 Lox::Token.new(type:, location:, lexeme:, literal:)
               end
  end

  def lexeme
    @src[@lexeme_pos...@pos].freeze
  end
end
```

### 4.5.1 词法错误

当源代码包含了一些 Lox 中不使用的字符，这些无法被识别为词素，就会抛出错误，同时该字符也会被消费，并更新 `@pos`。

在 `case` 中添加处理错误的逻辑：

```ruby
class Lox::Scanner
  private

  def tokenize
    @lexeme_pos = @pos

    case advance
    # ...
    else
      add_error
    end
  end

  def error_context
    Lox::Context.new(@src_map, location)
  end

  def add_error(message = "unknown start of token")
    @error_collector.add(Lox::Error::ScannerError.new(message, error_context))
  end
end
```

当发生错误时，可选地传递一个错误信息，并获取上下文，然后添加该错误到错误收集器中。

### 4.5.2 操作符

单字符词素已经可以识别了，但不能涵盖所有的操作符，如 `!` 有时候是取非，但与 `=` 组合在一起时为 `!=` 不等于，在这种情况下，就需要再查看第二个字符。

在 `case` 中添加查看第二个字符的逻辑：

```ruby
class Lox::Scanner
  private

  def tokenize
    @lexeme_pos = @pos

    case advance
    # ...
    # one or two character tokens
    when "!" then add_token(match_next?("=") ? Lox::TokenType::BANG_EQUAL : Lox::TokenType::BANG)
    when "=" then add_token(match_next?("=") ? Lox::TokenType::EQUAL_EQUAL : Lox::TokenType::EQUAL)
    when ">" then add_token(match_next?("=") ? Lox::TokenType::GREATER_EQUAL : Lox::TokenType::GREATER)
    when "<" then add_token(match_next?("=") ? Lox::TokenType::LESS_EQUAL : Lox::TokenType::LESS)
    # ...
  end
end
```

其中使用了 `match_next` 辅助方法，由于在 `advance` 中已经将 `@pos` 更新了，所以这里直接可以获得下一个字符。

```ruby
class Lox::Scanner
  private

  def match_next?(expect)
    if at_end? || @src[@pos] != expect
      false
    else
      advance
      true
    end
  end
end
```

## 4.6 更长的词素

还缺少一个 `/` 操作符，但这个操作符不仅可以表示除法，还可以表示注释。当为注释时，还需要判断是单行注释还是多行注释，并把表示注释的所有字符都消费掉，并更新 `@pos`。

在 `case` 中添加处理 `/` 的逻辑：

```ruby
class Lox::Scanner
  private

  def tokenize
    @lexeme_pos = @pos

    case advance
    # ...
    when "/"
      if match_next?("/")
        skip_line_comment
      elsif match_next?("*")
        skip_block_comment
      else
        add_token(Lox::TokenType::SLASH)
      end
    # ...
  end
end
```

添加 `skip_line_comment` 和 `skip_block_comment` 辅助方法：

```ruby
class Lox::Scanner
  private

  def skip_line_comment
    advance while peek != "\n" && !at_end?
  end

  def skip_block_comment
    advance while !at_end? && !(peek == "*" && peek(1) == "/")

    if at_end?
      add_error("unterminated block comment")
      return
    end

    advance
    advance
  endance(2)
  end
end
```

这是处理长词素的一般策略：当检测到一个词素的开头后，会分流属于该词素的字符，直到结尾。

其中使用了 `peek` 辅助方法，用于预读后面的字符，但是不消费，称为**前瞻**（Lookahead）。词法语法规则决定了在识别某些词素时需要前瞻多少个字符，前瞻字符越少，扫描器速度就越快。

`peek` 默认会前瞻后面第 `offset + 1` 个字符：

```ruby
class Lox::Scanner
  private

  def peek(offset = 0)
    return "" if at_end?(offset)

    @src[@pos + offset]
  end
end
```

对于注释选择无视，对于空白字符，同样也可以无视。

```ruby
class Lox::Scanner
  private

  def tokenize
    @lexeme_pos = @pos

    case advance
    # ...
    when " ", "\t", "\r", "\n" # ignore whitespace
    # ...
  end
end
```

### 4.6.1 字符串字面量

字符串都以 `"` 开头和结尾，因此可以根据该特征识别字符串字面量：

```ruby
class Lox::Scanner
  private

  def tokenize
    @lexeme_pos = @pos

    case advance
    # ...
    when '"' then string
    # ...
  end
end
```

其中使用了 `string` 辅助方法，会一直读取下一个字符，直到遇到下一个 `"`，如果遇到了错误则抛出。

```ruby
class Lox::Scanner
  private

  def string
    advance while !at_end? && peek != '"'

    if at_end?
      add_error("unterminated double quote string")
      return
    end

    advance
    add_token(Lox::TokenType::STRING, string_literal)
  end
end
```

可以看到，Lox 支持多行字符串。其中还使用了 `string_literal` 来将字符串转化为 Ruby 内部的字符串表示，主要是去掉了前后的双引号。

```ruby
class Lox::Scanner
  private

  def string_literal
    literal = lexeme
    literal = literal[1...] if literal[0] == '"'
    literal = literal[...-1] if literal[-1] == '"'
    literal.freeze
  end
end
```

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

在 `case` 中添加对数字的处理逻辑，支持半角和全角数字：

```ruby
class Lox::Scanner
  private

  def tokenize
    @lexeme_pos = @pos

    case advance
    # ...
    when /[0-9０-９]/ then number
    # ...
  end
end
```

其中使用了 `number` 辅助方法，会先读取所有遇到的数字，当读取完毕后，前瞻一个字符判断是不是小数点（半角或全角），如果是，则再前瞻一个字符判断是否为数字，如果是，则继续读取剩余数字。

```ruby
class Lox::Scanner
  private

  def number
    advance while peek =~ /[0-9０-９]/
    if peek =~ /[.．]/ && peek(1) =~ /[0-9０-９]/
      advance
      advance while peek =~ /[0-9０-９]/
    end

    add_token(Lox::TokenType::NUMBER, number_literal)
  end
end
```

其中又使用了 `number_literal` 来将数字转换为 Ruby 内部的数字字面量：

```ruby
class Lox::Scanner
  private

  def number_literal
    literal = lexeme.tr("０-９．", "0-9.")
    if literal.include?(".")
      literal.to_f
    else
      literal.to_i
    end
  end
 end
```

## 4.7 保留字和标识符

词法语法中还需要实现的部分仅剩保留字和标识符了。如果采用之前多字符操作符匹配的方法，那么当遇到 `orchid` 这种标识符时，会直接将前两个字符 `or` 识别为 `OR`，这样肯定是不对的。

针对这种情况，扫描器采取**最长匹配**（Maximal munch）原则：当多个语法规则都能匹配扫描器正在处理的一段代码时，使用匹配字符最多的那个。这表示只有在扫描完一个可能是标识符的全部片段，才能确认是否是一个保留字，因为保留字本质上也是一个标识符，只不过被语言本身所使用。

可以将 `orchid` 匹配为一个 `or` 关键字和一个 `chid` 标识符，也可以匹配为一个 `orchid` 标识符，根据该原则，则使用后者。

通过 Unicode 属性，任何被认为可以当作标识符的符号都支持：

```ruby
class Lox::Scanner
  private

  def tokenize
    @lexeme_pos = @pos

    case advance
    # ...
    when /(\p{XID_Start}|\p{Emoji})/ then identifier
    # ...
  end
end
```

`\p{XID_Start}` 用于匹配所有可以作为标识符开头的 Unicode 字符，包括：

-   所有字母字符（Latin、Greek、Cyrillic、CJK 等各种语言的字母）
-   下划线
-   一些其他被 Unicode 标准认为可以开始标识符的特殊字符

`\p{Emoji}` 匹配所有的 emoji 字符。

添加辅助方法 `identifier`，这里利用了 `\p{XID_Continue}` 同样匹配后续可以被当作标识符的符号，然后判断该标识符是否属于保留字。

```ruby
class Lox::Scanner
  private

  def identifier
    advance while peek.match?(/(\p{XID_Continue}|\p{Emoji})/)
    type = if Lox::TokenType.keyword?(lexeme)
             Lox::Keyword.key(lexeme)
           elsif Lox::TokenType.builtin?(lexeme)
             Lox::BuiltIn.key(lexeme)
           else
             Lox::TokenType::IDENTIFIER
           end
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
