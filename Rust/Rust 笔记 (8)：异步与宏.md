# 1 异步

根据计算机处理任务的类型，主要分为：

-   计算密集型（Compute bound）：主要占用大量用于计算的运行时间，如科学计算、代码编译等
-   I/O 密集型（I/O bound）：主要占用对数据读取的时间，如硬盘读写、网络传输等

操作系统的中断机制提供了程序级别的并发，但对程序内部更细粒度的控制则无法做到。特别是对于 I/O 密集型任务，处理器会花大量时间来等待读写操作，这类任务会**阻塞**（Blocking）当前线程。

虽然可以通过把这类任务放到新线程中去执行避免阻塞当前线程，但操作系统提供的线程数是有限的，线程的创建、同步也会造成不小的开销，当这类任务变多时，管理也会变得异常困难。

即使是并发和并行的任务，也可能阻塞。当某个任务依赖于另一个的结果时，若另一个任务尚未完成，则会陷入等待。

在单核处理器上，借助线程、进程、异步这类机制，通过上下文切换来实现并发。在多核处理器上，这些任务可以分别跑在各个核心上实现真正的并行。而 Rust 中的异步（Asynchronous）则是一种高效的实现并发的机制。

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

Rust 本身只提供对异步的抽象，定义了一些最基础的数据结构和 trait。要实际运行异步任务，还需要异步运行时，这部分由第三方库负责。其中 [futures](https://github.com/rust-lang/futures-rs) crate 是 Rust 异步代码实现的官方仓库，也是 `Future` 最初设计的地方，并被很多其它异步运行时使用。目前最广泛使用的异步运行时的是 [tokio](https://github.com/tokio-rs/tokio)，此外还有 [async-std](https://github.com/async-rs/async-std) 和 [smol](https://github.com/smol-rs/smol)，这些都使用了 futures crate 提供的一些功能。

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

该函数是异步的，因为使用了 `async` 来标记。由于所有需要交给异步运行时执行的函数都必须是异步的，因此同步 API 无法使用，这里使用 tokio 提供的异步版本 `sleep`，且由于是一个异步函数，因此会返回一个 `Future`，而这在 Rust 中是惰性的，在使用 `await` 之前都不会实际执行，这与迭代器必须通过消耗适配器才会真正执行类似。

当 Rust 遇到 async 函数或代码块时，会将其编译成实现了 `Future` 的唯一的、匿名的类型。异步函数会被编译成拥有异步代码块的非异步函数，其返回值类型是编译器为异步代码块所创建的**匿名数据类型**。

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

这样也会报错，因为 `main` 不能被标记为 `async`。要执行异步代码，需要异步运行时，`main` 作为程序的入口函数，可以初始化一个异步运行时，但本身并不是一个运行时，一个要执行异步代码的程序必须至少要有一个设置运行时并执行 `Future` 的地方。

像 Golang、JavaScript 这类语言的异步运行时会直接集成在语言内部的运行时中，但 Rust 由第三方库来负责，这主要是因为不同的场景对运行时有不同的需求。

tokio 提供了异步运行时，可以使用其中的 `block_on` 方法来执行异步代码，其中的异步代码可以避免阻塞，但外面的代码会阻塞到 `block_on` 返回。即**程序级别的异步代码具有比操作系统级别更细粒度的控制，因为可以控制在何处阻塞**，很多第三方运行时中的执行器都会命名为 `block_on` 。

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

每个使用 `await` 的地方，就表示此处的控制权交给异步运行时，会在未来的某个时间点回到同步代码中来。为此需要记录异步代码块中涉及的状态，即保存上下文，这样就可以在恢复后继续运行，这类似于线程间切换时操作系统也需要保存上下文。

Rust 会自动创建用于管理异步代码的状态机数据结构，这些数据结构同样会被检查所有权、借用规则和生命周期规则，并最终由异步运行时来执行状态机。这也是为什么 `main` 不能被标记为 `async`，作为程序入口点，若也返回一个 `Future`，则该 `Future` 的生成的状态机就没有执行器来执行了。

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

当一个结束后，另一个也会立即结束，即使任务还没结束。

### join



# 2 宏

