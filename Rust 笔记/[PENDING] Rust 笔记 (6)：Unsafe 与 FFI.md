# 1 使用 Unsafe

Rust 在编译时会进行安全检查以保证内存安全。由于编译器是保守的，就算遇到实际上没有问题的代码，但如果在编译期进行静态分析时没有足够的信息来确定是安全的，也会拒绝这类代码，而通过 **Unsafe Rust** 可以不进行这些检查。

此外，底层计算机硬件固有的特性导致如果不允许进行不安全操作，那么有些任务则根本无法完成。而且如果要与操作系统交互，甚至进行驱动、系统的开发，那么进行这些不安全操作是十分有必要的。

## unsafe 关键字

可以通过 `unsafe` 关键字来切换到 Unsafe Rust，然后在这个 Unsafe 代码块中，可以进行如下操作。

-   解引用裸指针；
-   调用不安全的函数和方法；
-   访问和修改可变的静态变量；
-   实现不安全 trait；
-   访问 `union` 的字段。

实际上，`unsafe` 并不会禁用安全检查，该关键字仅让以上几种原本不能通过的代码变得能通过，其余的安全检查依然存在。因此即使使用 unsafe 代码，也能够获得一定的安全性。

另外，`unsafe` 块中的代码并不代表一定不安全，只是需要开发者自己来保证安全，相当于在安全与不安全之间明确了界限，并缩小了可能出问题的代码范围。

## 解引用裸指针

安全 Rust 确保引用总是有效的，不会出现悬垂引用，而不安全 Rust 有两个被称为**裸指针**的类似于引用的新类型，同样分为不可变或可变的，分别写作 `*const T` 和 `*mut T`。这里的 `*` 不是解引用运算符，而是类型名称的一部分。在裸指针的上下文中，**不可变**意味着指针解引用后不能直接赋值，可变的裸指针也没有实现 `Copy` trait

裸指针与引用、智能指针的区别在于：

-   允许忽略借用规则，可以同时拥有不可变和可变的指针，或多个指向**相同位置**的可变指针；
-   不保证指向有效的内存；
-   允许为空；
-   不能实现任何自动清理功能。

可以在安全代码中**创建**裸指针，但不能**解引用**裸指针。

```rust
let mut num = 5;
let r1 = &num as *const i32;
let r2 = &mut num as *mut i32;

let num2 = 10;
let r3 = &num2 as *const i32 as *mut i32;
```

这里使用 `as` 将不可变和可变引用强转为对应的裸指针类型，但不可变类型不能直接转换为 `*mut T`，但可以先转换为 `*const T` 再转换为 `*mut T`。

创建一个指向任意内存地址的裸指针并使用是未定义行为，因为不能确定地址数据有效性，还可能出现段错误，但是没有解引用之前都是合法的安全代码，因为还没有使用它。

```rust
// 可以创建，不能使用
let address = 0x012345usize;
let r = address as *const i32;
```

要解引用裸指针，需要放在 unsafe 块中。

```rust
let mut n = 5;
let r1 = &n as *const i32;
let r2 = &mut n as *mut i32;

unsafe {
    println!("{}", *r1);
    *r2 = 10;
    println!("{}", *r2);
}
```

`r1` 和 `r2` 同时指向相同的内存地址，并对其进行操作，这在安全的 Rust 中是不被允许的。

## 调用不安全函数和方法

不安全函数和方法与常规函数和方法类似，只需在开头添加 `unsafe`，且 unsafe 函数也必须在 unsafe 块中调用。

```rust
unsafe fn danger() {}

unsafe {
    danger();
}
```

不安全函数体也是有效的 `unsafe` 块，所以在不安全函数中进行另一个不安全操作时无需添加额外的 `unsafe` 块。

### 不安全代码的安全抽象

一个安全的函数中包含 unsafe 块并不代表整个函数不安全。将不安全代码隔离，并封装到一个安全的抽象层，然后提供安全 API 是常用做法。在 Rust 标准库中有很多这类实现，如标准库中的 `split_at_mut` 函数，它获取一个可变的 slice 并从给定的索引参数开始将其分为两个可变 slice，并返回一个包含这个两个元素的元组。

```rust
let mut list = vec![1, 2, 3, 4, 5, 6];
let (a, b) = list.split_at_mut(3);
assert_eq!(&mut [1,2,3], a);
assert_eq!(&mut [4,5,6], b);
```

该函数无法只通过安全 Rust 实现，其实现类似如下代码，但并不能通过编译：

```rust
// 不能通过编译
fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = values.len();
    assert!(mid <= len);

    (&mut values[..mid], &mut values[mid..])
}
```

此函数首先获取 slice 的长度，然后通过检查参数长度来断言参数为合法索引，然后在一个元组中返回两个可变的 slice。

这仅借用这个 slice 的两个不同部分，且这两个部分没有重叠，因此实际上是安全的。但借用检查器并不能分析出，只知道借用了同一个 slice 两次，因此会报错。

可以通过使用 `unsafe` 块，裸指针和一些不安全函数调用来实现 `split_at_mut`：

```rust
use std::slice;

fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = values.len();
    let ptr = values.as_mut_ptr();

    assert!(mid <= len);

    unsafe {
        (
            slice::from_raw_parts_mut(ptr, mid),
            slice::from_raw_parts_mut(ptr.add(mid), len - mid)
        )
    }
}
```

slice 是一个指向一些数据的指针，并带有该 slice 的长度。可以使用 `len` 方法获取 slice 的长度，使用 `as_mut_ptr` 方法访问 slice 的裸指针。

其中的不安全代码 `slice::from_raw_parts_mut` 函数获取一个裸指针和一个长度来创建一个 slice，在 `ptr` 上调用 `add` 方法相当于将指针往后移动。该函数不安全的原因是它获取一个裸指针，并必须确信这个指针是有效的，其 `add` 方法也是不安全的，因为其必须确信指向偏移地址的指针也是有效的。

不需要将 `split_at_mut` 函数的结果标记为 `unsafe`，并可以在安全 Rust 中调用此函数。这里创建了一个不安全代码的安全抽象，其代码以一种安全的方式使用了 `unsafe` 代码，因为只是从给定的参数中的数据创建了新的数据，可以保证肯定是有效的。

但这样使用就可能会崩溃：

```rust
use std::slice;

let addr = 0x01234usize;
let ptr = addr as *mut i32;
let values: &[i32] = unsafe { slice::from_raw_parts_mut(ptr, 1000) };
```

因为在调用 unsafe 代码前，就已经不能保证该地址有效。

就算能够保证地址有效，但若在 unsafe 块中使用了非有效地址，也会造成未定义行为。

```rust
let mut list = vec![1, 2, 3, 4, 5, 6];
let ptr = (&mut list).as_mut_ptr();
let values: &[i32] = unsafe {
    slice::from_raw_parts_mut(ptr, 10)  // 未定义行为
};
```

这里访问了原本不属于有效地址范围的数据。

### 使用 extern 调用外部函数

Rust 可以方便的与其它语言进行交互。使用 `extern` 关键字，可以创建和使用**外部函数接口**（Foreign Function Interface，FFI）。外部函数接口是一个编程语言用以定义函数的方式，其允许不同编程语言调用这些函数。

`extern` 块中声明的函数在 Rust 代码中总是不安全的，因为其他语言不会强制执行 Rust 的规则且 Rust 也无法检查它们，必须在 `unsafe` 块中进行调用。

如调用 C 标准库中的 `abs` 函数：

```rust
extern "C" {
    fn abs(input: i32) -> i32;
}

fn main() {
    unsafe {
        println!("{}", abs(-3));
    }
}
```

在 `extern "C"` 块中，定义了能够调用的另一个语言中的外部函数签名。`"C"` 表示外部函数所使用的**应用二进制接口**（Application Binary Interface，ABI），ABI 定义了如何在汇编语言层面调用此函数。`"C"` ABI 是最常见的，表示遵循 C 语言的 ABI。

### 其它语言调用 Rust 函数

还可以使用 `extern` 来创建一个允许其他语言调用 Rust 函数的接口。

不同于创建整个 `extern` 块，在 `fn` 之前增加 `pub` 和 `extern` 关键字并指定所用到的 ABI，还需增加 `#[no_mangle]` 注解来告诉 Rust 编译器不要 **mangle** 此函数的名称。编译器在编译时会修改函程序中变量、函数等参数的名字，用以增加一些额外编译链接时所需要的信息，这个过程被称为 **mangling**。每个语言的编译器都会以稍微不同的方式进行这个过程，因此各个语言是不相兼容的，所以为了使 Rust 函数能在其他语言中使用，必须禁用 mangle。

一旦其编译为动态库并从 C 语言中链接，`call_rust_fn` 函数就能够在 C 代码中使用。

```rust
#[no_mangle]
pub extern "C" fn call_rust_fn() {
    println!("Hello from Rust!");
}
```

> `extern` 给其它语言调用的时候使用无需使用 `unsafe`。

## 访问和修改可变静态变量

全局变量在 Rust 中被称为**静态变量**，但所有权机制会引起问题，因为全局变量能够被程序中所有部分所访问，若有多个线程访问相同的可变全局变量，则可能会造成数据竞争，因此在安全 Rust 中，只能访问不可变全局变量。

```rust
static HELLO_WORLD: &str = "Hello, world!";

fn main() {
    println!("name is: {}", HELLO_WORLD);
}
```

静态变量类似于常量，但名称采用大写蛇形命名法，且必须显式标注类型。静态变量只能储存拥有 `'static` 生命周期的引用，因此编译器可以计算出生命周期而无需显式标注。

常量与不可变静态变量的一个区别是静态变量是作为程序二进制的一部分被保存在 `.rodata` 区块中，因此当程序加载时静态变量有一个固定的地址。

在 `unsafe` 块中访问可变全局变量：

```rust
static mut COUNTER: u32 = 0;

fn add_to_count(inc: u32) {
    unsafe {
        COUNTER += inc;
    }
}

fn main() {
    add_to_count(3);

    unsafe {
        println!("COUNTER: {}", COUNTER);
    }
}
```

像常规变量一样，使用 `mut` 关键来指定可变性，任何读写 `COUNTER` 的代码都必须位于 `unsafe` 块中。在多个线程访问的情况下， `COUNTER` 可能导致数据竞争。

## 实现不安全 trait

要实现不安全 trait 也必须使用 `unsafe`，当 trait 中至少有一个方法中不安全代码时，该 trait 是不安全的，同时 trait 的实现也必须标记为 `unsafe`。

```rust
unsafe trait Foo {}
unsafe impl Foo {}
```

并发中的 `Sync` 和 `Send` trait，编译器会自动为完全由 `Send` 和 `Sync` 类型组成的类型自动实现。若实现了一个包含一些不是 `Send` 或 `Sync` 的类型，如裸指针，并希望将此类型标记为 `Send` 或 `Sync`，则必须使用 `unsafe`，因为Rust 不能验证该类型是否可以安全的跨线程发送或在多线程间访问。

可以看到，unsafe trait 是对 trait 的实现者的约束，它告诉 trait 的实现者：实现我的时候要小心，要保证内存安全，所以实现的时候需要加 unsafe 关键字。但 unsafe trait 对于调用者来说，可以正常调用，不需要任何 unsafe block，因为这里的 safety 已经被实现者保证了，毕竟如果实现者没保证，调用者也做不了什么来保证 safety，就像我们使用 Send/Sync 一样。而 unsafe fn 是函数对调用者的约束，它告诉函数的调用者：如果你胡乱使用我，会带来内存安全方面的问题，请妥善使用，所以调用 unsafe fn 时，需要加 unsafe block 提醒别人注意。

下面这段代码在智能指针的那一讲中我们见到过，通过 GlobalAlloc 我们可以实现自己的内存分配器。因为内存分配器对内存安全的影响很大，所以实现者需要保证每个实现都是内存安全的。同时，alloc/dealloc 这样的方法，使用不正确的姿势去调用，也会发生内存安全的问题，所以这两个方法也是 unsafe 的：

```rust
use std::alloc::{GlobalAlloc, Layout, System};

struct MyAllocator;

unsafe impl GlobalAlloc for MyAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        let data = System.alloc(layout);
        eprintln!("ALLOC: {:p}, size {}", data, layout.size());
        data
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        System.dealloc(ptr, layout);
        eprintln!("FREE: {:p}, size {}", ptr, layout.size());
    }
}

#[global_allocator]
static GLOBAL: MyAllocator = MyAllocator;
```



## 访问 union 的字段

这主要用于和 C 中的共用体进行交互。`union` 和 `struct` 类似，但在一个实例中同时只能使用一个声明的字段，且仅允许 Copy 类型作为其字段。访问共用体的字段是不安全的，因为 Rust 无法保证当前存储在共用体实例中数据的类型。

```rust
#[repr(C)]
union Metric {
    rounded: u32,
    precise: f32,
}
fn main() {
    let mut a = Metric { rounded: 323 };
    unsafe {
        println!("{}", a.rounded);
    }
    unsafe {
        println!("{}", a.precise);
    }
    a.precise = 33.3;
    unsafe {
        println!("{}", a.precise);
    }
}
```



>   关于 Rust 中共用体的信息，可参考 [Unions - The Rust Reference](https://doc.rust-lang.org/reference/items/unions.html)。

## 何时使用不安全代码

可以使用 `unsafe` 来进行这五种操作，但需要自己来保证安全，通过使用显式的 `unsafe` 标注可以更容易地在错误发生时追踪问题的源头。

>   更多关于 Unsafe Rust 的信息，可参考 [Rust 秘典](https://nomicon.purewhite.io)。

# 2 裸指针

## 什么是裸指针

裸指针也叫**裸指针**，是一个具有 `usize` 大小的、没有额外保证的内存地址，因此是不安全的。Rust 中的引用实际上会被向下编译为裸指针，因此引用的性能实际上和裸指针是一样的。

指针和内存地址有时可以互用，因为它们本质上都是一个整数，只是编译器解释它们的角度不同，如 `*const T` 是一个从某个地址起始，并且由于知道 `T ` 的大小，因此编译器知道要连续读取多少个字节才能把这些字节解释成对应类型的值，这个过程就叫做**解引用裸指针**。

Rust 中可以使用 `std::mem::transmute` 函数来将同一个内存数据解释为其它类型的值，但这种操作是不安全的，因此需要放在 unsafe 块中。

```rust
let i: i64 = 10;
let i_ptr = &i as *const i64;
let i_addr: usize = unsafe {
    transmute(i_ptr)
};

// i: 10, ptr: 0xd1d62ffab8..0xd1d62ffabf
println!("i: {}, ptr: {:p}..0x{:x}", i, i_ptr, i_addr + 7);
```

使用 `transmute` 函数需要保证两种类型都必须具有相同的大小，否则编译会失败。该函数极其不安全，一般不使用，但还有一些用途，如将指针转换为函数指针。

```rust
fn foo() -> i32 {
    0
}

let fp = foo as *const ();
let func: fn() -> i32 = unsafe {
    transmute(fp)
};
assert_eq!(0, func());
```

## 创建裸指针

创建任何类型的裸指针始终是安全的：

```rust
let v = 10 as *const Vec<i32>;

unsafe {
    let new_addr = v.offset(7);
    println!("{:p} -> {:p}", v, new_addr);
}
```

很明显从一个整数 `10` 创建一个 `Vec<i32>` 的裸指针是不合理的，但创建依然是安全的操作，一旦要使用它，就会变得不安全。

# 3 Rust 的指针生态

裸指针是不安全的，其替代选择就是智能指针。智能指针通常是对裸指针进行包装，并提供额外的保证。在 C/C++ 中，智能指针与 Rust 中的 `core::ptr::Unique`、`core::ptr::Shared` 和 `std::rc::Weak ` 这类更为相似。

>   **胖指针**通常指的是内存布局。瘦指针如裸指针，就是一个 `usize` 大小，除了存有一个内存地址外其它什么也不保证。胖指针通常具有多个 `usize` 大小，一个用来存放内存地址，其它的用来存放额外保证，比如长度、容量等等，如 Rust 中的切片的引用、`Vec<T>` 这种智能指针就是一个胖指针。

## 指针类型

Rust 中有多种指针类型。

| 指针            | 作用                                                         | 备注                                                   |
| --------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| `Raw Pointer`   | 裸指针 `*const T` 和 `*mut T`，速度快，能与外部交互          | 不安全                                                 |
| `Box<T>`        | 将值进行装箱，并放在堆上                                     | 占用额外空间                                           |
| `Rc<T>`         | 引用计数，提供多所有权的不可变共享访问                       | 占用额外空间，运行时开销                               |
| `Arc<T>`        | 原子引用计数，提供跨线程安全的多所有权的不可变共享访问       | 占用额外空间，运行时开销                               |
| `Cell<T>`       | 提供不可变值类型的内部可变性                                 | 占用额外空间，运行时开销                               |
| `RefCell<T>`    | 提供不可变引用类型的内部可变性，与 `Rc<T>` 结合使用          | 占用额外空间，运行时开销，缺少编译时保证               |
| `Mutex<T>`      | 提供跨线程安全的不可变引用类型的内部可变性，与 `Arc<T>` 结合使用 | 占用额外空间，运行时开销，缺少编译时保证，可能导致死锁 |
| `Cow<T>`        | 提供写时复制，提高性能                                       | 占用额外空间                                           |
| `String`        | 按需动态增长，提供对 UTF-8 的保证                            | 占用额外空间                                           |
| `Vec<T>`        | 按需动态增长                                                 | 占用额外空间                                           |
| `UnsafeCell<T>` | 提供内部可变性，是需要内部可变性类型的基础类型               | 为上层类型提供支持，一般不直接使用                     |
| `RawVec<T>`     | 按需动态增长，是需要动态增长类型的基础类型                   | 为上层类型提供支持，一般不直接使用                     |
| `Unique<T>`     | 保证一个值有唯一所有者，是需要独占类型的基础类型             | 为上层类型提供支持，一般不直接使用                     |
| `Shared<T>`     | 共享所有权，是需要多所有权类型的基础类型                     | 为上层类型提供支持，一般不直接使用                     |

## 智能指针构建

大部分智能指针类型，如 `Box<T>`，是基于更基础的类型构建。这些类型通常位于更核心的模块中，如 `core` 和 `aloc`。此外，C/C++ 中的智能指针类型在 Rust 中都有相对应的类型。

在构建指针指针时，可参考现有的一些实现：

-   `core::ptr::Unique`：是 `String`、`Box<T>`、 `Vec<T>` 等类型的基础类型；
-   `core::ptr::Shared`：是 `Rc<T>` 和 `Arc<T>` 的基础类型；
-   `std::rc::Weak` 和 `std::arc::Weak`：用于内部互连的数据结构，可防止循环引用；
-   `alloc::raw vec::RawVec`：是 `Vec<T>` 和 `VecDeque<T>` 的基础类型；
-   `std::cell::UnsafeCell`：是 `Cell<T>` 和 `RefCell<T>` 的基础类型。

