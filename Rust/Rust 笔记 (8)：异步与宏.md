# 1 异步

操作系统的中断机制提供了程序级别的并发，但对程序内部更细粒度的控制则无法做到。特别是对于 I/O 密集型任务，处理器会花大量时间来等待读写操作，这类任务会**阻塞**（Blocking）当前线程。

虽然可以通过把这类任务放到新线程中去执行避免阻塞当前线程，但操作系统提供的线程数是有限的，线程的创建、同步也会造成不小的开销，当这类任务变多时，管理也会变得异常困难。

即使是并发和并行的任务，也可能阻塞。当某个任务依赖于另一个的结果时，若另一个任务尚未完成，则会陷入等待。

在单核处理器上，借助线程、进程、异步这类机制，通过上下文切换来实现并发。在多核处理器上，这些任务可以分别跑在各个核心上实现真正的并行。而 Rust 中的**异步**（Asynchronous）则是一种高效的实现并发的机制。

Rust 的异步编程主要围绕 `future` 这一概念，以及 `async`、`await` 关键字展开。`future` 是一个现在可能还未准备好，但将来会准备好的值，类似于 JavaScript 中的 `Promise`。

标准库提供了 `Future` 作为基础组件，然后可以为不同数据结构实现，实现了 `Future` 的类型会维护自己的状态信息。

```rust
pub trait Future {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

`async` 可用于代码块和函数，表明可以被中断并恢复，并在其中使用 `await` 来等待一个 `future` 准备就绪，称为**等待一个** `future`。每个等待 `future` 的位置都可能是一个中断并恢复的点。不断地检查一个 `future` 是否已经准备就绪的过程称为**轮询**（Polling）。

Rust 会把使用 `async`、`await` 的代码编译成等同于使用 `Future` 的代码，类似于 `for` 是 `Iterator` 的语法糖。

Rust 本身只提供对异步的抽象，定义了一些最基础的数据结构和 trait。要实际运行异步任务，还需要异步运行时，这部分由第三方库负责。其中 [futures](https://github.com/rust-lang/futures-rs) crate 是 Rust 异步代码实现的官方仓库，也是 `Future` 最初设计的地方，并被很多其他异步运行时使用。目前最广泛使用的异步运行时的是 [tokio](https://github.com/tokio-rs/tokio)，此外还有 [async-std](https://github.com/async-rs/async-std) 和 [smol](https://github.com/smol-rs/smol)，这些都使用了 futures crate 提供的一些功能。

## 异步程序

创建一个异步版本的计数器：

```rust
use std::time::Duration;

async fn async_count(label: &str, count: u32) {
    for i in 0..count {
        println!("{label}: {i}");
        tokio::time::sleep(Duration::from_millis(200)).await;
    }
}
```

该函数是异步的，因为使用了 `async` 来标记。由于所有需要交给异步运行时执行的函数都必须是异步的，因此同步 API 无法使用，这里使用 tokio 提供的异步版本 `sleep`，且由于是一个异步函数，因此会返回一个 `Future`，而这在 Rust 中是惰性的，在使用 `await` 之前都不会实际执行，这与迭代器必须通过消耗适配器才会执行类似。

当 Rust 遇到 async 函数或代码块时，会将其编译成实现了 `Future` 的、唯一的、匿名的类型。异步函数会被编译成拥有异步代码块的非异步函数，其返回值类型是编译器为异步代码块所创建的**匿名数据类型**。

因此 `async fn` 与返回类型为 `Future` 并包含一个异步代码块的同步函数等价，上述函数等价于以下定义：

```rust
use std::future::Future;
use std::time::Duration;

fn async_count(label: &str, count: u32) -> impl Future<Output = ()> + '_ {
    async move {
        for i in 0..count {
            println!("{label}: {i}");
            tokio::time::sleep(Duration::from_millis(200)).await;
        }
    }
}
```

原函数的返回类型为 `()`，实际上就是一个关联类型为 `()` 的 `Future`。由于 `label` 是一个引用，因此返回值需要加上一个匿名的生命周期，且 `count` 需要 move 进 async 块，否则会以引用形式捕获，而 async 代码会交由异步运行时来运行，这会导致异步代码捕获引用的生命周期与实际的生命周期可能不同。

现在可以执行该函数了，由于该函数是异步的，因此需要在调用后使用 `await`，否则仅仅返回一个 `Future`，而不执行里面的代码。

```rust
fn main() {
    async_count("A", 5).await; // 实际会报错
}
```

但这样实际上会报错，因为 `await` 只能在 async 函数或块中使用，而 `main` 不是异步函数。

若给 `main` 也加上 `async`：

```rust
// 也会报错
async fn main() { /* ... */ }
```

这样也会报错，因为 `main` 不能被标记为 `async`。要执行异步代码，需要异步运行时，`main` 作为程序的入口函数，可以初始化一个异步运行时，但本身并不是一个异步运行时，一个要执行异步代码的程序必须至少要有一个设置异步运行时并执行 `Future` 的地方。

像 Golang、JavaScript 这类语言的异步运行时会直接集成在语言内部的运行时中，但 Rust 由第三方库来负责，这主要是因为不同的场景对运行时有不同的需求。

tokio 提供了异步运行时，可以使用其中的 `block_on` 方法来执行异步代码，其中的异步代码可以避免阻塞，但外面的代码会阻塞到 `block_on` 返回。即**程序级别的异步代码具有比操作系统级别更细粒度的控制，因为可以控制在何处阻塞**，很多第三方运行时中的执行器都会命名为 `block_on` 。

定义一个 `run` 函数来执行一个 `Future`：

```rust
fn run<F: Future>(future: F) -> F::Output {
    tokio::runtime::Runtime::new().unwrap().block_on(future)
}
```

然后就可以在 `main` 中执行：

```rust
fn main() {
    run(async {
        async_count("A", 5).await
    });
}
```

每个使用 `await` 的地方，就表示此处的控制权交给异步运行时，会在未来的某个时间点回到同步代码中来。为此需要记录异步代码块中涉及的状态，即**保存上下文**，这样就可以在恢复后继续运行，这类似于线程间切换时操作系统也需要保存上下文。

Rust 会自动创建用于管理异步代码的状态机数据结构，这些数据结构同样会被检查所有权、借用规则和生命周期规则，并最终由异步运行时来执行状态机。这也是为什么 `main` 不能被标记为 `async`，作为程序入口点，若也返回一个 `Future`，则该 `Future` 生成的状态机就没有执行器来执行了。

tokio 提供了一个 `#[tokio::main]` 来使 `main` 可被标记为 `async`，但实际上会被重写为正常的同步函数。

```rust
#[tokio::main]
async fn main() {
    async_count("A", 5).await;
}
```

## 并发与异步

### select 与 Either

`futures` crate 中提供了 `select`，其接收两个 `Future` 作为参数，将其封装成一个新 `Future` 并返回。

```rust
use futures::future::{select, Either};
use std::pin::pin;

let a = async_count("A", 10);
let b = async_count("B", 5);

match select(pin!(a), pin!(b)).await {
    Either::Left(_) => println!("A is done"),
    Either::Right(_) => println!("B is done"),
}
```

由于传递的这两个 `Future` 都可能完成，因此封装后的 `Future` 的返回值是一个 `Either`，表示先完成的那个。

```rust
pub enum Either<A, B> {
    Left(A),
    Right(B),
}
```

当一个完成后，另一个不管什么状态都会立即结束。

### join

与用 `thread::spawn` 创建一个线程执行任务类似，`tokio` 提供了异步版本的 `spawn`，但最大的不同是无需产生新线程来执行。

```rust
tokio::spawn(async_count("A", 10));
tokio::spawn(async_count("B", 5)).await.unwrap();
```

同样的，当主线程结束时，异步任务也会停止。同时 `spawn` 也并返回一个异步版本的 `JoinHandle`，但不使用 `join` 而是 `.await` 来阻塞任务直到完成。

```rust
let h = tokio::spawn(async_count("A", 10));
tokio::spawn(async_count("B", 5)).await.unwrap();
h.await.unwrap();
```

`futures` crate 提供了一个 `join` 函数来同时阻塞两个 future：

```rust
use futures::future;

let f1 = async_count("A", 10);
let f2 = async_count("B", 5);
future::join(f1, f2).await;
```

和线程不同，这里会输出完全相同的顺序，因为 `future::join` 是**公平的**，它以相同的频率检查每个 future 并交替执行。对于线程来说，操作系统的调度机制决定了线程的执行顺序和时间。虽然异步运行时在底层使用线程作为并发管理的一部分，但提供不同的 API 来选择是否需要公平性。

### 消息传递

在 future 之间共享数据也与线程类似，通过异步信道来进行消息传递。

```rust
use tokio::sync::mpsc;

let (tx, mut rx) = mpsc::unbounded_channel();
tx.send("Hello from the async channel!").unwrap();
let msg = rx.recv().await.unwrap();
println!("Received: {msg}");
```

`tokio::sync::mpsc` 是类似于线程的多生产者、单消费者信道 API 的异步版本。与基于线程的版本的区别为使用  `mut rx`，且 `recv` 方法产生一个需要 await 的 future 而不是直接返回值。

`std::mpsc::channel` 中的同步 `Receiver::recv` 方法阻塞执行直到接收一个消息，而异步版本则不会阻塞。不同于阻塞，它将控制权交还给运行时，直到接收到一个消息或信道的发送端关闭。而 `send` 由于不会阻塞因此不需要 `await`。

多个消息的发送与接受可通过 `for` 与 `while let` 来完成：

```rust
let (tx, mut rx) = mpsc::unbounded_channel();
let vals = vec![1, 2, 3, 4, 5];

for val in vals {
    tx.send(val).unwrap();
    tokio::time::sleep(Duration::from_millis(200)).await;
}

while let Some(val) = rx.recv().await {
    println!("Received: {val}");
}
```

但这里有两个问题：

1.  输出不是间隔 200 毫秒而是等待后一瞬间完成
2.  `while let` 会一直阻塞

第一个问题是因为这里只有一个异步代码块，而异步代码块是异步运行时中最小的并发单位，同一个异步代码块中的代码是线性地执行的，所以这里并不存在并发，所有的 `tx.send` 与 `sleep` 调用都是依次进行的，只有在此之后 `while let` 循环才开始执行 `recv` 调用上的 `await`，而这时 `tx` 已经全部发送完毕，因此会在一瞬间输出所有结果。

第二个问题是因为信道只会在发送端或接收端被丢弃时才会关闭，而 `tx` 的生命周期直到结束都存在，`while let` 只有在 `tx` 关闭后才能收到 `None` 从而结束，因此永远阻塞。

可以通过修改为两个 `async` 块来解决：

```rust
let (tx, mut rx) = mpsc::unbounded_channel();
let vals = vec![1, 2, 3, 4, 5];

let f1 = async move { // move 使 tx 在异步块结束时被丢弃
    for val in vals {
        tx.send(val).unwrap();
        tokio::time::sleep(Duration::from_millis(200)).await;
    }
};

let f2 = async {
    while let Some(val) = rx.recv().await {
        println!("Received: {val}");
    }
};

future::join(f1, f2).await;
```

注意这里需要使用 `move` 将 `tx` 移动到 `async` 块中，这样在异步块结束时自动被丢弃，否则就是以借用的方式，在异步块结束后依然存在，从而导致 `while let` 一直阻塞。

## 处理任意数量的 futures



# 2 宏

模板预处理器、reader和quasi-quotation是三种不同的宏系统实现方式，它们各有特点和适用场景：

## 模板预处理器 (Template Preprocessor)

模板预处理器是最简单的宏系统，它基本上就是进行文本替换。它在编译之前处理源代码，将宏定义替换为其对应的文本内容。

特点：

-   仅执行简单的文本替换，不了解语言的语法结构
-   通常是在编译前的独立阶段运行
-   不检查替换后代码的语法正确性
-   示例包括C/C++的预处理器(#define)和传统的M4宏处理器

## Reader宏 (Reader Macros)

Reader宏在"读取阶段"操作，它们能干预程序文本被解析成抽象语法树(AST)的过程。

特点：

-   在解析代码成语法树的过程中工作
-   可以改变语言的读取语法
-   允许创建新的语法形式
-   通常在Lisp系语言中使用(如Common Lisp)，其中reader宏可以扩展语言的基本读取器

## Quasi-Quotation

Quasi-quotation是一种更高级的宏系统，它允许你操作和生成代码片段，同时保持代码的语法结构。

特点：

-   直接操作语法树或语言的结构化表示
-   提供了在编译时组合和生成代码的方法
-   通常包含"unquote"机制，允许在引用的表达式内插入计算结果
-   在Lisp家族语言(如Scheme、Racket)中特别常见，但现代语言如Rust和Julia也采用了类似概念

## 主要区别

1.  处理阶段不同

    ：

    -   模板预处理器：在解析前处理纯文本
    -   Reader宏：在读取阶段介入，影响解析过程
    -   Quasi-quotation：在语法树层面操作，通常在编译时运行

2.  语法感知程度

    ：

    -   模板预处理器：几乎没有语法感知，只是盲目文本替换
    -   Reader宏：部分语法感知，可以改变语言的读取规则
    -   Quasi-quotation：完全语法感知，操作结构化的代码表示

3.  表达能力

    ：

    -   模板预处理器：能力最弱，容易导致错误(如C中臭名昭著的宏问题)
    -   Reader宏：能力更强，但可能使代码难以理解
    -   Quasi-quotation：最强大和安全，因为它保持了代码的结构完整性

这三种宏系统反映了编程语言设计中不同的抽象层次和权衡选择，每种都有其特定的用例和优势。

## 抽象层次与稳定性要求

1.  模板预处理器

    :

    -   操作层次：原始字符串/文本
    -   影响：词法分析阶段(token生成)
    -   要求：几乎没有特殊要求，只需要支持文本替换
    -   例子：C/C++的#define，简单的文本替代

2.  Reader宏

    :

    -   操作层次：token序列
    -   影响：解析阶段(AST构建)
    -   要求：token系统需要相对稳定，语言需要支持读取器干预
    -   例子：Common Lisp的reader宏，可以自定义语法符号如#{ }等

3.  Quasi-quotation

    :

    -   操作层次：语法树/AST
    -   影响：编译/代码生成阶段
    -   要求：语法树表示必须稳定且可操作
    -   例子：Lisp的`(backquote) 和 ,@(unquote-splicing)

## Reader宏的平衡性

您对reader宏是"最灵活最强大最平衡的"这一观点很有见地。确实，reader宏处于一个独特的位置：

-   比模板预处理器更有语法意识，避免了许多文本替换的陷阱
-   比quasi-quotation要求更少，不需要整个语言的AST稳定性(这在语言演化过程中确实很难保证)
-   提供了足够的能力来扩展语言语法，但又不像操作完整AST那样复杂

Reader宏尤其适合：

-   引入新的字面量语法(如Racket中的#px正则表达式)
-   创建领域特定语言(DSL)
-   在保持语言核心稳定性的同时扩展语法

但需要注意的是，过度使用reader宏也可能导致代码可读性问题，因为它们可能会创建与语言标准语法大相径庭的新结构。

---

好的，我们来详细解释一下模板预处理器（Template Preprocessor）、读取器宏（Reader Macros）和准引用/语法宏（Quasi-quotation / Syntactic Macros）这三种宏系统的主要区别。它们都允许在编译或解释过程的不同阶段进行代码生成或转换，但它们的工作方式、能力和应用场景有显著差异。

**1. 模板预处理器 (Template Preprocessor)**

-   **工作阶段:** 在编译器或解释器处理源代码*之前*运行。它通常是一个独立的工具或编译过程的第一个阶段。
-   **操作对象:** 主要操作**原始文本或词法单元流（Token Stream）**。它不（或很少）理解代码的语法结构或语义。
-   **工作方式:** 基于简单的文本替换、条件包含（如 C 的 `#ifdef`）、文件包含（`#include`）和简单的循环/宏展开。通常使用特殊的指令或标记（如 C 的 `#define`, `#include`，或者 Web 模板引擎中的 `<% %>`, `{{ }}` 等）。
-   **语法感知:** 通常**不感知**宿主语言的语法。替换是基于文本模式匹配的，可能导致语法错误或意外行为（例如，宏参数的副作用、名称冲突）。
-   **能力:** 相对有限。适合执行简单的代码重复消除、平台特定代码的条件编译、常量定义等。
-   **卫生性 (Hygiene):** 通常**不卫生**。宏展开时可能会意外地捕获或覆盖局部变量，需要程序员特别小心（例如 C 宏中对参数加括号）。
-   例子:
    -   C/C++ 预处理器 (CPP)
    -   M4 (通用宏处理器)
    -   Web 模板引擎 (如 Jinja2, ERB, JSP/ASP 标签) - 虽然常用于生成 HTML/文本，但原理类似。

**2. 读取器宏 (Reader Macros / Read Macros)**

-   **工作阶段:** 在**读取（Parsing）阶段**工作。即在源代码文本被转换为内部数据结构（如 Lisp 中的 S-表达式或抽象语法树 AST）的*过程中*。
-   **操作对象:** 操作**输入字符流**。
-   **工作方式:** 允许程序员定义当读取器遇到特定字符或字符序列时应执行的函数。这个函数会消耗一部分输入流，并返回一个代表该输入的*数据结构*（而不是仅仅是文本）。这使得可以扩展语言的基本语法。
-   **语法感知:** **深度集成**于语言的解析器。它们直接参与将文本转换为语言内部数据结构的过程，因此可以创建全新的字面量表示或语法形式。
-   **能力:** 非常强大，可以直接扩展语言的词法和语法。可以用来创建新的数据类型字面量、嵌入式 DSL（领域特定语言）的特殊语法等。
-   **卫生性 (Hygiene):** 读取器宏本身不直接涉及变量绑定和作用域问题，因此卫生性概念在此处不太直接适用。它们生成的是数据，后续宏（如语法宏）或代码处理这些数据时才涉及卫生性。
-   例子:
    -   Common Lisp: 允许通过 `set-dispatch-macro-character` 和 `set-macro-character` 定义新的读取行为（例如 `#.` 用于读时求值，`#+` 用于条件读取，或自定义的 `#C(...)` 来表示复数）。
    -   Scheme: SRFI-10 定义了类似的机制。
    -   Clojure: Dispatch macros (`#`) 和 tagged literals (`#tag<data>`) 允许自定义数据读取。

**3. 准引用 / 语法宏 (Quasi-quotation / Syntactic Macros)**

-   **工作阶段:** 在**解析之后，编译/求值之前**的宏展开阶段。
-   **操作对象:** 操作**代码的抽象表示**，通常是抽象语法树（AST）或类似的数据结构（如 Lisp 中的 S-表达式列表）。
-   **工作方式:** 宏是一个函数（或类似结构），它接收代码结构作为输入，并生成新的代码结构作为输出。**准引用 (Quasiquotation)** 是一种常用的*语法工具*（通常涉及 `` `(backquote),`,`(unquote),`,@` (unquote-splicing) 等特殊符号），使得在宏定义中可以方便地构造目标代码模板，并有选择地将输入或计算结果“嵌入”到模板中。
-   **语法感知:** **完全感知**宿主语言的语法和结构，因为它们操作的是解析后的代码表示。
-   **能力:** 非常强大，可以执行任意的代码转换和生成。适合创建新的控制结构、嵌入式 DSL、自动实现接口、代码模式抽象等。
-   **卫生性 (Hygiene):** 现代语法宏系统（如 Scheme 的 `syntax-rules` / `syntax-case`, Rust 的 `macro_rules!` 和过程宏）通常是**卫生**的。这意味着宏展开时会自动处理变量名，避免宏内部的变量与宏使用处的变量发生意外冲突。Common Lisp 的传统 `defmacro` 是不卫生的，需要程序员手动使用 `gensym` 等技术来保证卫生性。
-   例子:
    -   Common Lisp: `defmacro` (不卫生，但强大且灵活)
    -   Scheme: `define-syntax` 配合 `syntax-rules` (卫生) 或 `syntax-case` (更强大，卫生)
    -   Rust: 声明宏 (`macro_rules!`, 卫生) 和过程宏 (Procedural Macros, 更强大，在编译期运行 Rust 代码来操作 TokenStream)
    -   Julia: Macros (`@macro_name`)
    -   Elixir: Macros (`defmacro`)

**总结区别:**

| 特性         | 模板预处理器 (Template Preprocessor) | 读取器宏 (Reader Macros)          | 准引用/语法宏 (Quasi-quotation / Syntactic Macros)   |
| ------------ | ------------------------------------ | --------------------------------- | ---------------------------------------------------- |
| **工作阶段** | 编译前                               | 读取/解析时                       | 解析后，编译/求值前                                  |
| **操作对象** | 原始文本 / Token 流                  | 输入字符流                        | 代码结构 (AST / S-表达式)                            |
| **语法感知** | 无 / 弱                              | 强 (改变解析行为)                 | 强 (操作代码结构)                                    |
| **主要目的** | 文本替换、条件编译                   | 扩展语言词法/语法，定义新字面量   | 代码转换、生成新语法结构、DSL                        |
| **卫生性**   | 不卫生                               | 不直接适用                        | 通常卫生 (现代系统) / 可不卫生 (如 Lisp defmacro)    |
| **典型例子** | C Preprocessor, Web Templates        | Common Lisp/Scheme/Clojure Reader | Lisp/Scheme Macros, Rust Macros, Julia/Elixir Macros |
| **核心机制** | 文本指令                             | 字符触发函数调用，返回数据结构    | 代码模板 (准引用)，接收/返回代码结构                 |

简单来说：

-   **预处理器**像是在用 Word 的“查找替换”功能处理代码文本。
-   **读取器宏**像是在教打字员遇到特殊符号时直接打出某种格式化的数据。
-   **语法宏**则像是在用代码（作为数据）来编写能生成新代码的程序。

这三种系统提供了不同层次和方式的代码抽象与生成能力。
