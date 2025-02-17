# 1 异步

根据计算机处理任务的类型，主要分为：

-   计算密集型（Compute bound）：主要占用大量用于计算的运行时间，如视频编解码、代码编译等
-   I/O 密集型（I/O bound）：主要占用对数据读取的时间，如硬盘读写、网络传输等

操作系统的中断机制提供了程序级别的并发，但对于程序内部更细粒度的控制则无法完成。特别是对于 I/O 密集型任务，处理器会花大量时间用于等待读写操作，在这期间什么也不做，这类任务会**阻塞**（Blocking）当前线程。

虽然可以通过把这类任务放到新的线程中去执行避免阻塞当前线程，但操作系统提供的线程数是有限的，线程的创建、同步也会造成不小的开销，当这类任务变多时，管理也会变得异常困难。

即使是并发和并行的任务，也可能阻塞。当某个任务依赖于另一个的结果时，若另一个任务尚未完成，则会陷入等待。

在单核处理器上，借助线程、进程、异步这类机制，通过上下文切换来实现并发。在多核处理器上，这些任务可以分别跑在各个核心上实现真正的并行。而 Rust 中的异步（Asynchronous）则是一种高效的实现并发的机制。

Rust 的异步编程主要围绕 `future` 这一概念，以及 `async`、`await` 关键字展开。`future` 是一个现在可能还未准备好，但将来会准备好的值，类似于 JavaScript 中的 `Promise`。

标准库提供了 `Future` 作为基础组件，然后可以为不同数据结构实现，实现了 `Future` 的类型会维护自己的进度状态信息。

```rust
pub trait Future {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

`async` 可用于代码块和函数，表明可以被中断并恢复，并在其中使用 `await` 来等待一个 `future` 准备就绪，称为**等待一个** `future`。每一个等待 `future` 的位置都可能是一个中断并恢复的点。不断地检查一个 `future` 是否已经准备就绪的过程称为**轮询**（Polling）。

Rust 会把使用 `async`、`await` 的代码编译成等同于使用 `Future` 的代码，类似于 `for` 是 `Iterator` 的语法糖。

Rust 本身只提供对异步的抽象，定义了一些最基础的数据结构和 trait。要实际运行异步任务，还需要异步运行时，这部分由第三方库负责。不过 [futures](https://github.com/rust-lang/futures-rs) crate 是 Rust 异步代码实现的官方仓库，也是 `Future` 最初设计的地方，并被很多其它异步运行时使用。目前最广泛使用的异步运行时的是 [tokio](https://github.com/tokio-rs/tokio)，此外还有 [async-std](https://github.com/async-rs/async-std) 和 [smol](https://github.com/smol-rs/smol)，这些都使用了 futures crate。



# 2 宏

