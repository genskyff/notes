# 1 智能指针

**指针**是一个值为内存地址的变量，但该值本质上也是一个整数，可对其做运算，这导致直接使用指针是一种不安全的操作，这种指针被称为**裸指针**。

**引用**也是一种指针，但只借用数据，没有数据的所有权，是裸指针的一种抽象，除了能解引用外没有其它功能，因此使用引用是安全的。

**智能指针**是一种数据结构，拥有数据的所有权，以及额外的元数据和功能，是引用的一种封装，可以像使用引用一样使用。

`String` 和 `Vec` 就是智能指针，因为它们拥有数据的所有权，并实现了相关 trait，同时也含有元数据（裸指针、长度和容量等）和额外的功能（如 `String` 含有各种方法，并保证数据总是有效的 UTF-8 编码）。

## Box

`Box` 是最简单的智能指针，仅进行堆分配并把数据放在堆上，留在栈上的则是指向堆数据的 `Box` 变量。

通常应用于：

- 编译时大小未知但又需要在确切大小的上下文中使用的数据
- 在确保数据不被复制的情况下转移所有权
- 需要拥有一个值并确保是否实现了特定 trait

```rust
let b = Box::new(0);
let v = *b;
println!("{b} {v}");
```

`b` 是一个在栈上的 `Box<i32>` 变量，其值指向被分配在堆上的数据 `0`。当离开作用域时，栈和堆上的数据都将自动释放。

### 递归类型

一种无法在编译时知道大小的类型是**递归类型**，其值的一部分是相同类型的另一个值。

一种典型的递归类型是 **Cons List**，这种数据结构的每一项都包含两个元素：当前项的值和下一项，其最后一项以 `Nil` 值表示结束。

```rust
// 错误，递归类型具有无限的大小
enum List {
    Cons(i32, List),
    Nil,
}
```

但这样定义会报错，因为 `List` 是递归的，因此其大小是无限的。

<img src="https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202204261452079.png" alt="无限大小的 Cons" style="zoom: 67%;" />

### 用 Box 处理递归类型

由于 `Box` 的大小是固定的，因此可以通过 `Box` 来存放另一个位于堆上的 `List` 值。

```rust
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let list = Cons(1,
        Box::new(Cons(2,
            Box::new(Cons(3,
                Box::new(Nil))))));
}
```

`Nil` 不存储值，因此一个 `List` 枚举至少需要一个 `Cons` 的大小，而 `Cons` 需要一个 `i32` 和 `Box` 的大小，都可以在编译期被计算出。

<img src="https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202204261550930.png" alt="使用 Box 存储" style="zoom: 50%;" />

## 智能指针 trait

智能指针通常使用结构体实现，之所以能够像使用指针一样使用，是因为实现了 `Deref` 和 `Drop`。`Deref` 重载了解引用运算符 `*`，让智能指针可以像引用一样使用。`Drop` 用于智能指针析构。在 Rust 中，若持有堆上数据的数据结构实现了 `Deref` 和 `Drop`，则为智能指针。如 `Box` 实现了 `Deref` 和 `Drop`，因此是一个智能指针。

### Deref

`Deref` 用于重载不可变引用的 `*`。

```rust
pub trait Deref {
    type Target: ?Sized;

    fn deref(&self) -> &Self::Target;
}
```

要让类型值能解引用，就需要实现其中的 `deref`。

```rust
struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(v: T) -> Self {
        Self(v)
    }
}

impl<T> std::ops::Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let n = MyBox::new(0);
    assert_eq!(0, *n);
}
```

解引用运算符只能对引用使用，即只能用 `*&T` 得到 `T`。而对智能指针 `T` 使用解引用，编译器实际上隐式地调用了 `deref` 方法，因此实际上是对内部值的引用进行解引用。

```rust
// *n 相当于
*(n.deref())
```

### DerefMut

`DerefMut` 用于重载可变引用的 `*`。

```rust
pub trait DerefMut: Deref {
    fn deref_mut(&mut self) -> &mut Self::Target;
}
```

要实现 `DerefMut` 就必须先实现 `Deref`，且由于 `Deref` 已经定义了关联类型，因此在 `DerefMut` 中无需再定义，然后再实现其中的 `deref_mut`。

```rust
use std::ops::DerefMut;

impl<T> DerefMut for MyBox<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

fn main() {
    let mut m = MyBox::new(0);
    *m = 1;
    assert_eq!(1, *m);
}
```

### Deref 自动强转

实现了 `Deref` 的类型作为参数传递或调用方法时，若与函数或方法签名不符，就会**自动隐式地递归调用** `deref`，返回值再次作为参数或调用方法，直到符合为止，这称为 **Deref 自动强转**。

类型和 trait 实现满足以下条件时会进行 Deref 自动强转：

- 当 `T: Deref<Target = U>` 时，从 `&T` 或 `&mut T` 到 `&U`
- 当 `T: DerefMut<Target = U>` 时，从 `&mut T` 到 `&mut U`

`MyBox` 并没有实现 `abs`，因此发生 Deref 自动强转。隐式地调用 `deref` 获得了 `&i32`，而 `i32` 实现了 `abs`。

```rust
let n: MyBox<i32> = MyBox::new(-1);

// 相当于 (*(n.deref()).abs()
// 或 (*n).abs()
println!("{}", n.abs());
```

`&s` 是一个 `&MyBox`，但由于与 `say` 的函数签名不符，因此发生 Deref 自动强转。隐式地调用 `deref` 获得了 `&String`，但依然不符合形参，而 `String` 在标准库中也实现了 `Deref`，再次强转获得了 `&str`，此时参数就符合函数签名了。

```rust
fn say(s: &str) {
    println!("{s}");
}

fn main() {
    let s = MyBox::new(String::from("foo"));

    // 相当于 say(s.deref().deref())
    // 或 say(&(*s)[..])
    say(&s);
}
```

使用 newtype 可以为外部类型实现外部 trait，从而绕过了孤儿规则，但这样不能使用类型已有的方法，但通过为类型实现 `Deref`，利用 Deref 自动强转则可避免这个问题，并在函数和方法调用时避免过多的 `&` 和 `*`。

### Drop

`Drop` 用于类型的析构，如 `Box` 被丢弃时会释放堆内存。

```rust
pub trait Drop {
    fn drop(&mut self);
}
```

要让类型值在离开作用域时执行代码，就需要实现其中的 `drop`。`drop` 会在值离开作用域时被自动调用，且调用的顺序与创建值的顺序相反。

```rust
struct MyString {
    data: String,
}

impl Drop for MyString {
    fn drop(&mut self) {
        println!("{}", self.data);
    }
}

fn main() {
    let s1 = MyString {
        data: String::from("foo"),
    };
    let s2 = MyString {
        data: String::from("bar"),
    };
    println!("done");
}
```

不能直接在实例上调用 `drop`，只能在离开作用域时由编译器自动调用，否则会导致二次释放。若要在作用域结束之前就强制释放值，可使用 `std::mem::drop`，它是一个析构函数，编译器会确保值只被释放一次。

```rust
let s = MyString {
    data: String::from("foo"),
};

s.drop(); // 错误
drop(s);  // 正确
```

> `Drop` 与 `Copy` 是互斥的。

## 共享所有权

所有权规则决定了一个值有且仅有一个所有者，但一个值有多个所有权也是常见的需求，而 `rc::Rc` 就是用于模拟多所有权的类型。该类型在堆上分配内存，并持有一个指向堆数据的引用。通过**引用计数**来记录堆数据被引用的数量，若引用计数为 0，就表示没有任何有效引用，堆数据可以被清理。

`Rc` 主要用于让程序的多个部分**只读地**共享数据，且无法在编译时确定程序的哪一部分会最后使用。

> `rc` 中的类型都是**非原子**的，没有实现并发安全，只能用于**单线程**。

### 使用 Rc 共享数据

列表 `a` 的所有权被列表 `b` 和 `c` 所共享。

<img src="https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202204291124165.png" alt="共享 List" style="zoom: 67%;" />

这里不能使用 `Box`，因为 `a` 的所有权已经移动到 `b`，因此 `c` 不能再获得 `a` 的所有权。

```rust
let a = Cons(5, Box::new(Cons(10, Box::new(Nil))));
let b = Cons(3, Box::new(a));  // a 移动到 b
let c = Cons(4, Box::new(a));  // 错误
```

可以修改 `Cons` 的定义来存放一个引用，但必须指定生命周期参数，这样代码就会变得很复杂，更好的方法是使用 `Rc` 代替 `Box`。

```rust
use std::rc::Rc;

enum List {
    Cons(i32, Rc<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let a = Rc::new(Cons(5, Rc::new(Cons(10, Rc::new(Nil)))));
    let b = Cons(3, Rc::clone(&a));
    let c = Cons(4, Rc::clone(&a));
}
```

### 引用计数

`Rc` 实现了 `Clone`，但只会在栈上复制 `Rc` 并增加引用计数，不会进行堆上的复制。`Rc` 的 `Drop` 实现会让 `Rc` 实例在离开作用域后减少引用计数，在减少到 0 之前堆上的数据都不会被清理。

> 为了避免与内部类型的方法发生冲突，`Rc` 的方法最好都使用关联函数的形式。

引用计数分两类：**强引用**和**弱引用**。`Rc::clone` 增加的就是强引用计数，`Rc::downgrade` 会创建一个 `rc::Weak` 类型，并增加弱引用计数。

强引用代表共享 `Rc` 实例的所有权，计数为 0 时就会进行析构，因此强引用会造成循环引用。而弱引用并不计入所有权，即使计数为 0 也不影响是否析构，因此弱引用不会造成循环引用。

`Rc::strong_count` 和 `Rc::weak_count` 可获得强引用和弱引用计数。

```rust
let a = Rc::new(1);
assert_eq!(1, Rc::strong_count(&a));
assert_eq!(0, Rc::weak_count(&a));

let aa = Rc::clone(&a);
assert_eq!(2, Rc::strong_count(&a));

let w = Rc::downgrade(&a);
assert_eq!(1, Rc::weak_count(&a));
```

由于 `Weak` 引用不计入所有权，不影响析构，因此不保证引用的值有效，当要使用 `Weak` 引用的数据时，需要先使用 `upgrade` 将其升级到 `Rc`，其返回一个 `Option`，当数据已经被丢弃时，会返回 `None`。

```rust
let a = Rc::new(1);
let w = Rc::downgrade(&a);
let aa = w.upgrade().unwrap();
assert_eq!(2, Rc::strong_count(&a));
assert_eq!(1, Rc::weak_count(&a));
```

## 内部可变性

`cell` 中的类型提供了**内部可变性**，允许通过不可变引用修改内部数据。而 Rust 的借用规则通常不允许这样做，因此在其内部的数据结构中使用了 Unsafe 代码来绕过，并被封装进安全的 API 中。

> `cell` 中的类型都是**非原子**的，没有实现并发安全，只能用于**单线程**。

### Cell

`Cell` 用于实现了 `Copy` 的类型，通过移入移出来实现内部可变性，因此无法获得内部值的可变引用，也就不会违反借用规则。

常用方法：

- `new`、`get`、`take`
- `swap`、`set`、`replace`

```rust
use std::cell::Cell;

struct Wrap {
    value: Cell<i32>,
}

fn main() {
    let w = Wrap {
        value: Cell::new(0),
    };

    assert_eq!(0, w.value.replace(10));
    assert_eq!(10, w.value.get());
}
```

### RefCell

`RefCell` 用于没有实现 `Copy` 的类型，并**在运行时进行借用检查**，当通过如 `borrow` 和 `borrow_mut` 这类方法获得内部值的引用时，若违反了借用规则会导致 panic。通过其上的方法获得引用时，实际上是获得一个 `Ref` 或 `RefMut` 智能指针，`RefCell` 会对这两种指针进行计数，类似借用规则，同时只能有多个 `Ref` 或一个 `RefMut`。

常用方法：

- `new`、`take`
- `swap`、`replace`、`replace_with`
- `borrow`、`borrow_mut`
- `try_borrow`、`try_borrow_mut`

```rust
use std::cell::RefCell;

struct Wrap {
    value: RefCell<String>,
}

fn main() {
    let w = Wrap {
        value: RefCell::new("foo".to_string()),
    };

    assert_eq!("foo", w.value.borrow().as_str());

    w.value.borrow_mut().push_str("bar");
    assert_eq!("foobar", w.value.borrow().as_str());
}
```

### OnceCell

`OnceCell` 用于只需要设置一次的值，除非 `OnceCell` 是可变的，否则一旦设置则不能更新。这表示无需移动或复制内部值，也无需运行时检查即可获得内部值的不可变引用。

常用方法：

- `new`、`take`

- `get`、`set`、`get_or_init`

```rust
use std::cell::OnceCell;

struct Wrap {
    value: OnceCell<String>,
}

fn main() {
    let w = Wrap {
        value: OnceCell::new(),
    };

    assert!(w.value.get().is_none());
    assert!(w.value.set("foo".to_string()).is_ok());

    assert!(w.value.get().is_some());
    assert!(w.value.set("bar".to_string()).is_err());
}
```

### LazyCell

`LazyCell` 用于将数据的初始化推迟到第一次访问为止。

```rust
use std::cell::LazyCell;

fn main() {
    let lazy = LazyCell::new(|| {
        println!("init");
        10
    });
    assert_eq!(10, *lazy);
    assert_eq!(10, *lazy);
}
```

## 循环引用

Rust 虽然拥有极高的内存安全性，无法轻易引起内存泄漏，但也可以通过 `Rc` 和 `RefCell` 创造循环引用导致内存泄漏，因为引用计数永远也到不了 0，值也就永远不会被丢弃。

```rust
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
enum List {
    Cons(i32, RefCell<Rc<List>>),
    Nil,
}

impl List {
    fn tail(&self) -> Option<&RefCell<Rc<List>>> {
        match self {
            Cons(_, item) => Some(item),
            Nil => None,
        }
    }
}

use List::{Cons, Nil};

fn main() {
    let a = Rc::new(Cons(1, RefCell::new(Rc::new(Nil))));
    let b = Rc::new(Cons(2, RefCell::new(Rc::clone(&a))));

    if let Some(link) = a.tail() {
        *link.borrow_mut() = Rc::clone(&b);
    }

    println!("a: {} b: {}", Rc::strong_count(&a), Rc::strong_count(&b));

    // println!("{a:?}");  // 无限打印
}
```

将 `Rc` 改为 `Weak` 可避免循环引用：

```rust
use std::cell::RefCell;
use std::rc::{Rc, Weak};

#[derive(Debug)]
enum List {
    Cons(i32, RefCell<Weak<List>>),
    Nil,
}

impl List {
    fn tail(&self) -> Option<&RefCell<Weak<List>>> {
        match self {
            Cons(_, item) => Some(item),
            Nil => None,
        }
    }
}

use List::{Cons, Nil};

fn main() {
    let a = Rc::new(Cons(1, RefCell::new(Rc::downgrade(&Rc::new(Nil)))));
    let b = Rc::new(Cons(2, RefCell::new(Rc::downgrade(&a))));

    if let Some(link) = a.tail() {
        *link.borrow_mut() = Rc::downgrade(&b);
    }

    println!("a: {} b: {}", Rc::strong_count(&a), Rc::strong_count(&b));
    println!("a: {} b: {}", Rc::weak_count(&a), Rc::weak_count(&b));

    println!("{a:?}");
}
```

## Cow

`borrow::Cow` 用于写时复制，提供对数据的不可变访问，同时在需要可变或所有权时再复制数据，以避免不必要的复制和和运行时内存分配。

```rust
pub enum Cow<'a, B: ?Sized + ToOwned + 'a> {
    Borrowed(&'a B),
    Owned(<B as ToOwned>::Owned),
}
```

当需要可变或所有权时，`Cow` 变量本身需要可变，其上的 `to_mut` 返回含有数据。

```rust
use std::borrow::Cow;

fn abs_all(input: &mut Cow<'_, [i32]>) {
    for i in 0..input.len() {
        let v = input[i];
        if v < 0 {
            input.to_mut()[i] = -v;
        }
    }
}

fn main() {
    // 这里不需要复制，因为没有负数
    let slice = [0, 1, 2];
    let mut input = Cow::from(&slice[..]);
    abs_all(&mut input);

    // 这里复制了，因为含有负数
    let slice = [-1, 0, 1];
    let mut input = Cow::from(&slice[..]);
    abs_all(&mut input);
}
```

> `Rc` 和 `Arc` 的 `make_mut` 作用也是相同的。

# 2 并发

**并发**代表程序的不同部分可以相互独立的执行，而**并行**代表程序的不同部分可以同时执行。并行实际上是并发的一种实现形式。当只有一个 CPU 核心时，通过上下文切换来实现并发；当有多个 CPU 核心时，通过并行来实现并发。通常使用并发来表示轮流执行，并行来表示同时执行。而当任务数大于 CPU 核心数时，并行和并发都同时存在，即**并行一定是并发，并发只有在多核 CPU 上才能并行**。

> 在 Rust 中统一使用并发来指代这两者。

## 使用线程

程序代码通常在**进程**中运行，操作系统管理多个进程。程序内部可以有多个同时运行的**线程**。程序从主线程 `main` 开始，可创建子线程，子线程也能创建线程。线程同时运行，执行顺序不确定，依赖操作系统调度。主线程结束时，不论子线程是否完成，程序都会结束。子线程完成后自动结束，但其创建的线程会继续执行。操作系统提供结束线程的接口，但直接终止线程可能导致如资源未释放之类的问题。

程序执行的任务通常有两类：

- **计算密集型**：需要大量的计算，如图像处理、复杂运算等
- **I/O 密集型**：有大量的 I/O 操作，如文件读写、网络请求等

通常对 CPU 密集型任务使用多线程会有显著的性能提升，但也会导致以下问题：

- **数据竞争**：多个线程以不一致的顺序同时访问同一个数据
- **死锁**：线程之间相互等待对方停止使用其所拥有的数据，导致双方永远等待

### 线程模型

不同语言实现线程方式不同。操作系统通常会提供创建线程的 API，这种调用系统 API 创建线程的模型称为 **1:1** 模型，即一个 OS 线程对应一个程序线程。而 **M:N** 模型称为**协程**，即程序内部实现的 M 个线程会映射到 N 个 OS 线程中。

> 为了较小的运行时和性能，Rust 标准库只提供了 1:1 线程实现，一些第三方库，如 [Tokio](https://github.com/tokio-rs/tokio) 则提供了 M:N 线程实现。

### 创建线程

`thread::spawn` 接收一个闭包并在新线程中运行闭包，会立即返回一个 `JoinHandle`，其上的 `join` 会阻塞当前线程直到所代表的线程结束，**阻塞**表示阻止当前线程的执行。因此 `join` 放置的位置会影响线程的执行结果，在主线程结尾调用 `join` 来确保子线程的代码能够全部执行。

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let h = thread::spawn(|| {
        for i in 0..5 {
            println!("spawn: {i}");
            thread::sleep(Duration::from_millis(100));
        }
    });

    for i in 0..5 {
        println!("main: {i}");
        thread::sleep(Duration::from_millis(100));
    }

    h.join().unwrap();
}
```

`println!` 使用 `io::Stdout::lock()` 来确保输出没有被中断，称为**输出锁定**。这会等待直到任意并发表达式执行结束后再写入输出，否则输出可能会交错。

由于线程可能运行直到程序执行结束，因此产生的线程要求捕获的值具有 `'static` 生命周期。

```rust
pub fn spawn<F, T>(self, f: F) -> io::Result<JoinHandle<T>>
where
    F: FnOnce() -> T + Send + 'static,
    T: Send + 'static,
```

对闭包使用 `move` 可以把值在多个线程间传递。

```rust
let v = vec![1, 2, 3];

// 若不使用 move，则报错
let h = thread::spawn(move || {
    println!("{v:?}");
});

h.join().unwrap();
```

若不使用 `move`，`println!` 以引用的方式使用值，因此自动推断为借用 `v`，但主线程可能使该值无效，因此报错。

要从线程中返回一个值，可以通过闭包返回一个值。该值可以通过 `join` 返回的 `Result` 中获取：

```rust
let n = thread::spawn(|| 10).join().unwrap();
assert_eq!(10, n);
```

### 线程 Builder

`thread::spawn` 实际上是 `thread::Builder::new().spawn().unwrap()` 的简写。`thread::Builder` 允许在产生线程之前为新线程做一些配置，如配置栈大小和线程名称等。`thread::Builder` 返回一个 `Result`，这表示新线程可能产生失败，如内存不足等。但 `thread::spawn` 在无法产生线程的情况下会直接 panic。

```rust
thread::Builder::new()
    .name("foo".to_string())
    .stack_size(1024 * 1024 * 8)
    .spawn(|| println!("{}", thread::current().name().unwrap()))
    .unwrap()
    .join()
    .unwrap();
```

### 作用域内线程

若线程的生命周期不会比某个作用域更长，那么线程可以安全地借用生命周期更长的非 `'static` 数据，如局部变量等。

`thread::scope` 可以产生此类**作用域内线程**。

```rust
let v = vec![1, 2];
let r = thread::scope(|s| {
    s.spawn(|| println!("{}", v[0]));
    s.spawn(|| println!("{}", v[1]));
    0
});

println!("{:?}", v);
assert_eq!(0, r);
```

`thread::scope` 将提供一个 `Scope` 对象，即参数 `s`，可以产生线程并借用非 `'static` 数据，当 `scope` 的作用域结束，所有仍没有 join 的线程都会自动 join。这保证了在作用域产生的线程没有会比作用域更长的生命周期。

若作用域中的线程进行了修改，则会报错，因为借用规则不允许同一个作用域中同时存在不可变和可变借用。

```rust
let mut v = vec![1, 2];
thread::scope(|s| {
    s.spawn(|| v.push(10));
    s.spawn(|| println!("{}", v[1])); // 报错
});
```

### 线程阻塞

当数据由多个线程更改时，可能需要等待一些条件成立才继续执行。如一个由 `Mutex` 保护的 `VecDeque`，当队列不为空时才进行操作。

`Mutex` 允许线程等待直到解锁，但不提供检查其它条件的功能。要判断队列中是否为空，则当前线程必须不断检查队列是否为空。

```rust
use std::collections::VecDeque;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

static COUNT: Mutex<i32> = Mutex::new(0);

fn main() {
    let v = Mutex::new(VecDeque::new());

    thread::scope(|s| {
        // 消费线程
        s.spawn(|| {
            loop {
                *COUNT.lock().unwrap() += 1;
                let item = v.lock().unwrap().pop_back();
                if let Some(item) = item {
                    println!("{item}");
                }
            }
        });

        // 生产线程
        for i in 0..5 {
            v.lock().unwrap().push_front(i);
            thread::sleep(Duration::from_secs(1));
        }

        println!("COUNT: {}", *COUNT.lock().unwrap());
    });
}
```

可以看到 `COUNT` 的值最后会变得非常大，意味这种方式会导致线程一直处于活跃状态，并占用时钟周期，导致效率降低。

当队列为空的时候，可以使用 `park` 让当前线程进行阻塞（睡眠），然后其它线程在将数据准备好后使用 `unpark` 唤醒线程。

```rust
thread::scope(|s| {
    let h = s.spawn(|| {
        loop {
            *COUNT.lock().unwrap() += 1;
            let item = v.lock().unwrap().pop_back();
            if let Some(item) = item {
                println!("{item}");
            } else {
                thread::park(); // 阻塞
            }
        }
    });

    for i in 0..5 {
        v.lock().unwrap().push_front(i);
        h.thread().unpark();    // 唤醒
        thread::sleep(Duration::from_secs(1));
    }

    println!("COUNT: {}", *COUNT.lock().unwrap());
});
```

可以看到最后 `COUNT` 的值很小，也就是说这种方式确实避免了不必要的调用。

### 线程屏障

`sync::Barrier` 可以让多个线程都执行到某个点后，才继续往后执行。其接收一个参数 `N`，表示阻塞指定线程数，它会阻塞前 `N - 1` 个调用 `wait` 的线程，然后在第 `N` 个线程调用 `wait` 时立即继续执行所有线程。

```rust
use std::sync::Barrier;
use std::thread;

fn main() {
    let b = Barrier::new(4);
    thread::scope(|s| {
        for i in 0..4 {
            let b = &b;
            s.spawn(move || {
                println!("{i}: start");
                b.wait();
                println!("{i}: end");
            });
        }
    });
}
```

## 并发 trait

Rust 有两个标记并发安全的 trait：`std::marker::{Send, Sync}`。实现了 `Send` 和 `Sync` 的类型就是并发安全的。

```rust
pub unsafe auto trait Send {}
pub unsafe auto trait Sync {}
```

`auto` 表示编译器会在适当的情况下，自动为数据结构实现该 trait。`unsafe` 表示手动实现该 trait 是不安全的。

### Send

实现了 `Send` 的类型可以在线程间安全地转移所有权。除了除了裸指针和 `rc` 中的类型外，绝大部分类型都实现了 `Send` ，由实现了 `Send` 的类型组成的类型也是 `Send` 的。

### Sync

实现了 `Sync` 的类型可以安全地在多个线程共享其引用，这代表：

- 若 `T` 实现了 `Sync`，则 `&T` 为 `Send` 的

- 若 `&T` 实现了 `Send`，则 `T` 为 `Sync` 的

除了裸指针、`cell` 和 `rc` 中的类型外，绝大部分类型都实现了 `Sync`，由实现了 `Sync` 的类型组成的类型也是 `Sync` 的。

### Send 和 Sync 实现

通常并不需要手动实现 `Send` 和 `Sync`，因为任何由 `Send` 和 `Sync` 的类型组成的类型，自动就是 `Send` 和 `Sync` 的。

取消其中任何一种的方式是**增加**没有实现该 trait 的字段：

```rust
use std::marker::PhantomData;

// 该结构体是 Send
struct Foo {
    n: i32,
    _not_sync: PhantomData<Cell<()>>, // Cell 没有实现 Sync
}
```

裸指针和 `rc` 中的类型没有实现 `Send` 和 `Sync`，因此不是并发安全的。

```rust
impl<T: ?Sized> !Send for *const T {}
impl<T: ?Sized> !Sync for *const T {}

impl<T: ?Sized> !Send for Rc<T> {}
impl<T: ?Sized> !Sync for Rc<T> {}
```

`cell` 中的类型只实现了一种或都没有实现，因此也不是并发安全的。

```rust
unsafe impl<T: ?Sized + Send> Send for Cell<T> {}
impl<T: ?Sized> !Sync for Cell<T> {}

unsafe impl<T: ?Sized + Send> Send for RefCell<T> {}
impl<T: ?Sized> !Sync for RefCell<T> {}
```

`sync` 中的类型都实现了 `Send` 和 `Sync`，因此是并发安全的。

```rust
unsafe impl<T: ?Sized + Sync + Send> Send for Arc<T> {}
unsafe impl<T: ?Sized + Sync + Send> Sync for Arc<T> {}

unsafe impl<T: ?Sized + Send> Send for Mutex<T> {}
unsafe impl<T: ?Sized + Send> Sync for Mutex<T> {}

unsafe impl<T: ?Sized + Send> Send for RwLock<T> {}
unsafe impl<T: ?Sized + Send + Sync> Sync for RwLock<T> {}
```

实现了并发安全的类型自身可能含有没有实现并发安全的字段，如 `Mutex`、`RwLock` 都含有没有实现 `Sync` 的 `UnsafeCell` 字段，而 `Arc` 含有没有实现 `Send` 和 `Sync` 的 `NonNull` 字段。

```rust
impl<T: ?Sized> !Sync for UnsafeCell<T> {}

impl<T: ?Sized> !Send for NonNull<T> {}
impl<T: ?Sized> !Sync for NonNull<T> {}
```

手动为含有没有实现并发安全字段的类型实现 `Send` 和 `Sync` 涉及编写 Unsafe 代码，因此通常是不安全的。如通过 newtype 为 `Rc` 实现并发安全：

```rust
use std::ops::Deref;
use std::rc::Rc;
use std::sync::Mutex;
use std::thread;

struct SafeRc<T>(Rc<T>);

unsafe impl<T: Send + Sync> Send for SafeRc<T> {}
unsafe impl<T: Send + Sync> Sync for SafeRc<T> {}

impl<T> SafeRc<T> {
    fn new(v: T) -> Self {
        Self(Rc::new(v))
    }

    fn clone(&self) -> Self {
        Self(Rc::clone(&self.0))
    }
}

impl<T> Deref for SafeRc<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let sr = SafeRc::new(Mutex::new(0));

    thread::spawn({
        let sr = SafeRc::clone(&sr);
        move || {
            *sr.lock().unwrap() += 10;
        }
    })
    .join()
    .unwrap();

    println!("{}", sr.lock().unwrap());
}
```

## 消息传递

一种确保并发安全的方式是**消息传递**，线程通过发送包含数据的消息来进行通信。

实现消息传递的主要方式是**信道**，由**发送端**和**接收端**这两部分组成。**当所有发送端或接收端都被丢弃时**，可以认为信道被关闭了。

### 信道

信道把锁封装在了队列读写的小块区域内，然后把读写完全分离，使得读写完全和锁无关，就像访问本地队列一样。对于大部分并发问题，都可以用信道或类似的技术来处理（如 Actor Model）。

信道在具体实现的时候，根据不同的使用场景，会选择不同的工具：

- `oneshot`：最简单的信道，发送端就只发一次数据，而接收端也只读一次。这种一次性的、多个线程间的同步可以用该方式完成，实现的时候可直接用 Atomic Swap 来完成。
- `rendezvous`：当只需要通过信道来控制线程间的同步，并不需要发送数据时使用。实际上是信道缓冲值为 0 的一种特殊情况。

上述两情况下，用互斥锁和条件变量来实现就足够了。

- `bounded`：使用有限队列，一旦队列被写满了，发送端也需要被挂起等待。当阻塞发生后，接收端一旦读取数据，信道内部就会使用条件变量来通知发送端，唤醒使其能够继续写入。因此实现中一般会用互斥锁、条件变量和 `VecDeque` 来实现。
- `unbounded`：队列没有上限，若写满了就自动扩容。和 `bounded` 相比，除了不阻塞，其它实现都很类似。

根据信道发送端和接收端的数量，信道又可以分为：

- **SPSC**（Single-Producer Single-Consumer）：单生产者，单消费者。最简单，可以不依赖于 Mutex，只用 Atomic 就可以实现。
- **SPMC**（Single-Producer Multi-Consumer）：单生产者，多消费者。需要在消费者这侧读取时加锁。
- **MPSC**（Multi-Producer Single-Consumer）：多生产者，单消费者。需要在生产者这侧写入时加锁，使用最广泛的类型。
- **MPMC**（Multi-Producer Multi-Consumer）：多生产者，多消费者。需要在生产者写入或消费者读取时加锁。

### MPSC 信道

`mpsc::channel` 用于创建有**多个发送端、一个接收端**的信道，其返回一个代表发送端和接收端的元组 `(Sender, Receiver)`，`tx` 和 `rx` 通常作为这两者的缩写。

> 信道的内部实现使用了泛型，一旦确定了信道传输值的类型，就不能再改变。

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let v = String::from("hello");
        tx.send(v).unwrap();
    });

    let recv = rx.recv().unwrap();
    println!("{recv}");
}
```

必须使用 `move` 将 `tx` 移动到闭包中，因为**线程需要拥有发送端所有权才能向信道发送消息**。

发送端使用 `send` 来向信道发送消息，其返回一个 `Result`，若接收端已被丢弃，则会返回错误。`send` 会获取值的所有权，这样可以保证接收端使用的值一定有效。

接收端有两个常用的方法：`recv` 和 `try_recv`：

- `recv` 会阻塞当前线程执行直到从信道中接收到一个消息。其返回一个 `Result`，`Ok` 包含接收到的值，`Err` 表示发送端被关闭。

- `try_recv` 不会阻塞。其立刻返回一个 `Result`，`Ok` 包含接收到的值，`Err` 代表没有任何消息。若线程在等待消息过程中还有其它代码需要执行时使用 `try_recv`，如通过循环调用 `try_recv`，在有可用消息时进行处理，否则继续其它任务。

  ```rust
  let (tx, rx) = mpsc::channel();
  
  thread::spawn(move || {
      tx.send(1).unwrap();
  });
  
  loop {
      if let Ok(v) = rx.try_recv() {
          println!("{v}");
          break;
      }
  }
  ```

### 接收多个值

在子线程中发送多个消息到主线程，接收端不再显式调用 `recv`，而是将 `rx` 当作迭代器。**当信道被关闭时，迭代才会结束**。

```rust
let (tx, rx) = mpsc::channel();

thread::spawn(move || {
    let vec = vec![
        String::from("hello"),
        String::from("hi"),
        String::from("ok"),
    ];

    for v in vec {
        tx.send(v).unwrap();
        thread::sleep(Duration::from_millis(100));
    }
});

for v in rx {
    println!("{v}");
}
```

### 多个发送端

由于线程需要发送端的所有权才能发送消息，因此可以通过 `clone` 来复制发送端，这样就可以在不同线程向同一个接收端发送消息。

```rust
let (tx, rx) = mpsc::channel();

for i in 0..5 {
    thread::spawn({
        let t = tx.clone();
        move || {
            t.send(i).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
    });
}

// 由于 tx 还未被关闭，若不 drop 则一直阻塞
drop(tx);
for v in rx {
    println!("from thread {v}");
}
```

需要注意的是:

- 所有发送端都被 `drop` 掉后，信道才会被关闭，接收端才会收到错误，从而终止迭代。
- 不能确定子线程的创建顺序，因此消息的发送顺序也不能确定。但对信道而言，其中的消息是有序的，符合先进先出原则。

### 异步信道

`mpsc` 的信道分为异步和同步信道。异步信道表示无论接收端是否正在接收消息，发送端在发送消息时都不会阻塞。通过 `mpsc::channel` 创建的就是异步信道。主线程在阻塞结束后，才从信道中接收了消息，而子线程却在此期间完成了消息的发送。

```rust
let (tx, rx) = mpsc::channel();
thread::spawn(move || {
    println!("before send");
    tx.send(1).unwrap();
    println!("after send");
})
.join()
.unwrap();

println!("before recv");
thread::sleep(Duration::from_secs(1));
println!("after recv: {}", rx.recv().unwrap());
```

### 同步信道

同步信道表示发送消息是阻塞的，只有在消息被接收后才解除阻塞。通过 `mpsc::sync_channel` 创建的就是同步信道，其需要一个参数，表示消息缓冲值。当设定为 `N` 时，发送端可以无阻塞的往信道中发送 `N` 条消息，当消息缓冲队列满了后，新消息的发送将被阻塞。若没有接收端从缓冲队列中接收消息，那么第 `N + 1` 条消息的发送将被阻塞。

```rust
let (tx, rx) = mpsc::sync_channel(1);
tx.send(1).unwrap();

thread::spawn(move || {
    tx.send(2).unwrap();
});
thread::sleep(Duration::from_secs(1));

for v in rx {
    println!("{v}");
}
```

缓冲值可为 0，这意味着必须提前在另一个线程中接收发送端的消息，否则发送端会一直阻塞。而异步信道创建则没有这个缓冲值，上限取决于内存大小，因此异步信道非常高效且不会导致发送线程阻塞，但也存在由于消息未及时接收，导致占用内存过大等问题。

### MPMC 信道

Rust 标准库只提供了 MPSC 信道，若要使用多发送端、多接收端的 MPMC 信道，可以使用第三方库，如 [Crossbeam](https://github.com/crossbeam-rs/crossbeam)。

## 共享内存

使用信道来进行消息传递是实现并发的方式之一，信道类似于单所有权，一旦将一个值传送到信道中，就无法再使用这个值。共享内存类似于多所有权，多个线程可以同时访问相同内存的数据。

### 互斥锁

**互斥锁**表示在任意时刻，在某种条件下，只允许一个线程访问互斥器中的数据。为了访问数据，线程需要先获取互斥器的**锁**。锁是一个作为互斥器一部分的数据结构，记录了谁有数据的访问权，互斥器通过锁避免数据竞争。

使用互斥器需要注意：

- 使用数据前必须获取锁
- 使用完后必须释放锁，这样其它线程才能加锁
- 互相等待对方线程释放锁会造成死锁

### Mutex

`Mutex` 是一种互斥锁，`lock` 和 `try_lock` 用于获取锁，前者阻塞，后者非阻塞。

```rust
use std::sync::Mutex;
use std::thread;

fn main() {
    let m = Mutex::new(0);
    thread::scope(|s| {
        for _ in 0..10 {
            s.spawn(|| {
                let mut guard = m.lock().unwrap();
                *guard += 1;
            });
        }
    });
    assert_eq!(10, m.into_inner().unwrap());
}
```

线程完成后，可通过 `into_inner` 安全地移除保护，其获取 `Mutex` 的所有权，`unwrap` 获取内部值。

### RwLock

`Mutex` 每次使用都需要加锁，这在高并发读时有较大性能损耗。而 `RwLock` 作为并发安全的 `RefCell`，允许多个读操作同时进行，但同时只能有一个写操作，这十分适合高并发读的场景。

`read`、`write` 用于阻塞地读写，`try_read` 和 `try_write` 用于非阻塞地读写。

```rust
use std::sync::RwLock;
use std::thread;

fn main() {
    let rw = RwLock::new(0);
    thread::scope(|s| {
        for _ in 0..10 {
            s.spawn(|| assert_eq!(0, *rw.read().unwrap()));
        }
    });
    *rw.write().unwrap() = 1;
    assert_eq!(1, rw.into_inner().unwrap());
}
```

### 锁中毒

当在 `Mutex` 或 `RwLock` 上使用 `lock` 或 `read`、`write` 等方法获取锁时，会得到一个指示锁状态的 `Result`。当返回 `Ok` 时，其中包含 `MutexGuard` 或 `RwLockReadGuard`、`RwLockWriteGuard`，其中含有内部数据；当返回 `Err` 时，其中包含 `PoisonError`，表示**锁已中毒**。

**中毒策略**是一种防止由锁保护的数据处于不一致状态的机制。正常情况下锁会在作用域结束后自动释放，但若线程在释放前发生了 panic，锁就不会被释放也不能再被获取，该锁被视为**中毒的**。

### Guard 生命周期

获取锁实际上就是获取一个 `Guard` 智能指针，当 `Guard` 还存在时，就处于锁定状态，作用域结束时，`Guard` 被自动丢弃，即解锁。因此可以手动 `drop` 掉 `Guard` 来提前解锁。获取的锁若不绑定到一个变量上，则相当于是一个临时变量，在当前语句结束后就会立即解锁。

```rust
list.lock().unwrap().push(1);
```

在判断锁状态时，通常涉及 `match`、`if let` 和 `while let` 语句，但这里有一个**陷阱**：

```rust
if let Some(item) = list.lock().unwrap().pop() {
    do_something(item);
} // 2024 版在此处 drop
else {
    do_other(item);
} // 2021 版在此处 drop
```

对于这类语句，在 2021 及更早版本中，`Guard` 虽然没有绑定到某个变量上，但 `Guard` 这个临时变量的生命周期会延长到整个 `if let` 语句后才结束，这表示在处理 `item` 时不必要地持有锁，延误了锁释放的时机。但从 2024 版开始，`if let` 的临时生命周期缩短为在 `else` 之前就丢弃。

对 2021 版的情况，可以通过将操作移动到单独的 `let` 语句来避免：

```rust
let item = list.lock().unwrap().pop();
if let Some(item) = item {
    do_something(item);
}
```

对于 `if` 语句，由于在进入块之前就已经丢弃了，因此不会出现上述情况：

```rust
if list.lock().unwrap().pop() == Some(1) {
    do_something();
}
```

通常 `if` 语句的条件总是一个布尔值，并不借用任何东西，因此没有必要将临时的生命周期延长到语句结尾，而对于 `if let` 语句则不一定。

### Condvar

通过 `park`、`unpark` 机制可以做到等待条件成立后再执行，但仅限于简单的情况下。如当有多个消费线程从相同的队列获取数据时，生产线程将不会知道有哪些消费线程实际上在等待以及应该被唤醒。生产线程必须知道消费线程正在等待的时间以及正在等待的条件。

**条件变量**（Condvar）用于等待受 `Mutex` 保护的数据变化，主要有**等待**和**通知**两种操作。多个线程可以等待同一个条件变量，通知可以唤醒一个或所有等待线程。

- 等待：线程在队列中等待条件满足
- 通知：条件满足时通知等待线程，可以是单个或多个通知

如可以创建一个条件变量来等待队列非空的事件。事件发生时，任何线程都可以通知条件变量，无需知道哪些线程在等待。

`sync::Condvar` 提供了这种条件变量。`wait` 接收 `MutexGuard`，先解锁 `Mutex` 并进入睡眠，唤醒时重新锁定 `Mutex` 并返回新的 `MutexGuard`。`notify_one` 唤醒一个线程，`notify_all` 唤醒所有线程。

互斥锁解决并发安全问题，但不能同步并发数据。条件变量作为**同步原语**，控制线程同步，阻塞线程直到满足条件，并通常仅与 `Mutex` 配合使用：`Mutex` 保证条件在读写时互斥，条件变量控制线程等待和唤醒。

```rust
let c = Condvar::new();
let v = Mutex::new(VecDeque::new());

thread::scope(|s| {
    s.spawn(|| loop {
        let mut v = v.lock().unwrap();
        let mut len = v.len();

        while len == 0 {
            v = c.wait(v).unwrap();
            len = v.len();
        }

        println!("{}", v.pop_back().unwrap());
    });

    for i in 0..5 {
        v.lock().unwrap().push_front(i);
        c.notify_one();
        thread::sleep(Duration::from_secs(1));
    }
});
```

`wait` 会自动解锁传递的锁，并阻塞当前线程，此时任何 `notify` 都可唤醒该线程。由于 `wait` 易受虚假唤醒的影响，因此使用 `while` 来对每次返回都进行检查。当 `Mutex` 中毒时，`wait` 将返回 `Err`。

### Arc

`rc::Rc` 的操作不是原子的，因此没有实现并发安全。要在多个线程间共享所有权，可以使用**原子引用计数**类型 `sync::Arc`，和 `Rc` 有相同的 API，并同样具有弱引用版本 `sync::Weak`，但由于 `Arc` 为了保证并发安全因此有一定性能损失。

`Mutex` 提供了内部可变性，这与 `Rc` 配合 `cell` 中的类型，`Arc` 也会配合 `sync` 中的类型使用。

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let a = Arc::new(Mutex::new(0));

    thread::scope(|s| {
        for _ in 0..10 {
            s.spawn({
                let a = Arc::clone(&a);
                move || {
                    *a.lock().unwrap() += 1;
                }
            });
        }
    });

    println!("{}", *a.lock().unwrap());
}
```

### OnceLock

`OnceLock` 就是并发安全的 `OnceCell`。

```rust
use std::sync::OnceLock;
use std::thread;

static ONCE: OnceLock<String> = OnceLock::new();

fn main() {
    thread::spawn(|| ONCE.get_or_init(|| "foo".to_string()))
        .join()
        .unwrap();
    println!("{}", ONCE.get().unwrap());
}
```

### LazyLock

`LazyLock` 就是线程安全的 `LazyCell`。由于多个线程都调用初始化，因此若当前其它线程正在进行初始化，则任何解引用调用都将阻塞调用线程。

```rust
use std::sync::LazyLock;
use std::thread;
use std::time::Instant;

static TIME: LazyLock<Instant> = LazyLock::new(|| Instant::now());

fn main() {
    thread::scope(|s| {
        for _ in 0..5 {
            s.spawn(|| {
                println!("{:?}", *TIME);
            });
        }
    });
}
```

由于仅在第一次访问时初始化，因此所有线程得到的值都是一样的。

## 原子类型

基于信道的消息传递安全但有诸多限制，`Mutex` 简单但不支持并发读，`RwLock` 支持并发读但性能有限。而 CPU 本身提供原子操作指令，Rust 中的原子类型会利用这些指令，因此也是并发安全的。其性能优于消息传递和锁，并具有**内部可变性**。虽为无锁类型，但原子类型内部使用 CAS（Compare and Swap）循环——通过一条指令读取某个内存地址，判断其值是否等于某个前置值，若相等，将其修改为新的值。虽然还是有等待阻塞的可能，但总体性能优于锁。原子类型作为**并发原语**，为并发任务的同步奠定了基础，是 `Cell` 的并发版本，实际上很多并发类型在内部就是使用原子类型来构建的。

原子类型包括：

- 有符号整数：`AtomicI8`、`AtomicI16`、`AtomicI32`、`AtomicI64`、`AtomicIsize`

- 无符号整数：`AtomicU8`、`AtomicU16`、`AtomicU32`、`AtomicU64`、`AtomicUsize`
- 布尔：`AtomicBool`
- 裸指针：`AtomicPtr`

### 内存顺序

由于 CPU 在访问内存时的顺序可能受以下因素的影响：

- 代码中的顺序
- 编译器优化导致的重排序
- 运行阶段因 CPU 的缓存机制导致的重排序

因此操作原子类型的方法都接收一个 `Ordering` 枚举来限制操作内存的顺序，包含五个变体：

- `Relaxed`：最宽松的规则，对编译器和 CPU 不做任何限制，可以乱序
- `Release`：设定内存屏障，保证其之前的操作一定在前面，但后面的操作也有可能在前面
- `Acquire`：设定内存屏障，保证其之后的操作问一定在后面，但之前的操作也有可能在后面
- `AcqRel`：结合 `Acquire` 和 `Release`，但只保证直接同步的线程之间的顺序关系
- `SeqCst`：和 `AcqRel` 类似，但保证所有线程看到一致的全局顺序，性能开销更大

这些规则由操作系统提供，通常 `Acquire` 用于读，而 `Release` 用于写，同时读写则用 `AcqRel`，要求强一致性则用 `SecCst`。

### 使用原子类型

原子类型虽然是并发安全的，但依然遵循所有权，因此通常会配合 `Arc` 使用。

```rust
use std::sync::atomic::{AtomicI32, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    let a = Arc::new(AtomicI32::new(0));

    thread::scope(|s| {
        for _ in 0..8 {
            s.spawn({
                let a = Arc::clone(&a);
                move || {
                    for _ in 0..100000 {
                        a.fetch_add(1, Ordering::SeqCst);
                    }
                }
            });
        }
    });

    println!("{a:?}");
}
```

### 应用场景

原子类型虽然具有优异的并发特性，但与信道和锁相比，还是存在一些局限性：

- 支持类型有限
- 复杂场景不如信道和锁使用简单
- 一些场景必须使用锁，如 `Mutex` 配合 `Condvar`

虽然原子类型不太常用，但经常出现在标准库、高性能库中，是实现并发的基石，通常应用于：

- 无锁数据结构
- 全局变量
- 跨线程计数器

## 选择并发原语

- 原子类型在处理简单的原生类型时很有用，若数据可通过 `AtomicT` 进行同步，那么是最好的选择。
- 若数据无法通过 `AtomicT` 进行同步，但又的确需要在多个线程中共享数据，那么互斥锁是不错的选择。但还需要考虑锁的粒度，粒度太大的互斥锁效率较低。
- 若有 N 份资源可供多个并发任务竞争使用，那么，信号量是一个不错的选择，如 DB 连接池。
- 若需要在并发任务中通知、协作时，条件变量提供了最基本的通知机制，而信道把这个通知机制进一步扩展，因此可以用条件变量进行点对点的同步，用信道做一对多、多对一、多对多的同步。信道兼具接口、同步和数据流三种功能，是最常用的并发手段。

