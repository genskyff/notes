# 1 函数

## 函数定义

`fn` 定义函数，类型表示为 `fn(T, U, ..) -> R`，函数类型都实现了 `FnOnce`、`FnMut`、`Fn`、`Copy`、`Clone`、`Send`、`Sync` 和 `Sized`。

```rust
fn add(x: i32, y: i32) -> i32 {
    x + y
}
```

当函数的第一个参数带有 `self`，则是在 trait 或 impl 块中的方法。

```rust
trait T {
    fn foo(&self);
}

struct S;
impl S {
    fn bar(&self) {}
}
```

对于 `extern` 块，可在最后一个参数处使用 `...` 来表示可变参数。

```rust
unsafe extern "C" {
    fn foo(x: i32, ...);
}
```

## 常量函数

常量函数是在编译期执行的函数，通过 `const` 定义，必须是**纯函数**，也不能包含如堆分配这样的运行时操作。

```rust
const fn read_header(buf: &[u8]) -> (u8, u8, u8, u8) {
    (buf[0], buf[1], buf[2], buf[3])
}

const FILE_HEADER: (u8, u8, u8, u8) = read_header(include_bytes!("test.txt"));
```

## 参数属性

函数参数也可以有属性。

```rust
fn len(
    #[cfg(linux)]
    slice: &[u8],
    #[cfg(not(linux))]
    slice: &[u16]
) -> usize {
    slice.len()
}
```

## 函数指针

函数也可以作为函数指针来赋值或传递参数。

```rust
fn add(x: i32, y: i32) -> i32 {
    x + y
}

fn do_add(x: i32, y: i32, f: fn(i32, i32) -> i32) {
    f(x, y);
}

fn main() {
    let f = add;
    do_add(1, 2, f);
}
```

由于函数类型具有 `Sized`，因此可以直接返回函数指针。

```rust
fn ret_fn() -> fn(i32) -> i32 {
    fn bar(n: i32) -> i32 {
        n + 1
    }
    bar
}
```

# 2 闭包

闭包也叫 Lambda 表达式，其定义了一个闭包类型，每个闭包都具有**唯一性**和**匿名性**。可以在一个地方创建闭包，然后在不同的上下文中执行闭包。

## 闭包定义

闭包本质上是一个**匿名函数**，可以保存在变量中。

```rust
let sum = |x: i32, y: i32| -> i32 { x + y };
```

闭包的定义中，`||` 表示接受的参数，大括号中为闭包体，若只有一行则可省略大括号，闭包体中最后一个表达式的值作为闭包的返回值。定义了闭包之后，就可以像函数那样调用。

```rust
assert_eq!(3, sum(1, 2));
```

闭包语法和函数语法十分类似：

```rust
fn  sum_v1   (x: i32, y: i32) -> i32 { x + y }
let sum_v2 = |x: i32, y: i32| -> i32 { x + y };
let sum_v3 = |x, y|                    x + y;
```

## 闭包类型推断

闭包通常很短，只关联小范围的上下文，因此编译器可推断出参数和返回值的类型，可以不用像函数定义那样必须显式标注类型。

闭包定义会为每个参数和返回值推断一个具体类型：

```rust
let c = |x| x;
let s = example_closure(String::from("hello"));
let n = example_closure(5);    // 错误，闭包参数和返回值类型已确定
```

每个闭包都是唯一的类型，即使签名相同：

```rust
// 两者闭包类型不同
let c1 = |x: i32| -> i32 { x + 1 };
let c2 = |x: i32| -> i32 { x + 1 };
```

这两个闭包虽然签名相同，类型都表示为 `Fn(i32) -> i32`，但实际上是不同的类型。

## 捕获方式

闭包周围的作用域被定义为其所处的**环境**，因此闭包除了能够作为匿名函数来使用外，和函数有一个最大的区别：**可以捕获环境中的值**。当闭包从环境中捕获一个值，闭包会在闭包体中储存这个值，这会产生额外的内存开销，而函数不允许捕获环境，因此定义和使用函数也就没有这些额外开销。

```rust
let x = 3;
let equal_to_x = |n| n == x; // 捕获 x
assert!(equal_to_x(3));
```

闭包通过三种方式捕获值，对应函数的三种获取参数的方式：

- 获取所有权

- 可变借用

- 不可变借用

这三种捕获值的方式对应三个 `Fn` trait，所有函数都自动实现了这三个 trait，所有闭包都自动实现了其中一个或多个 trait：

- `std::ops::FnOnce` 从环境获取值的所有权，因此该类闭包只能使用一次
- `std::ops::FnMut` 从环境获取值的可变借用
- `std::ops::Fn` 从环境获取值的不可变借用

定义闭包时，若没有使用 `move`，则编译器会自动推断捕获值的方式：

- 由于所有闭包都可以被至少调用一次，因此所有闭包都实现了 `FnOnce`
- 没有获取被捕获值的所有权的闭包都实现了 `FnMut`
- 没有对被捕获值进行可变访问的闭包都实现了 `Fn`

```rust
// FnOnce
let s = String::from("FnOnce");
let puts = || println!("{}", s + "!");
println!("{s}");    // 错误，s 已被移动
puts();
puts();             // 错误，FnOnce 只能被调用一次

// FnMut
let mut s = String::from("FnMut");
let mut add_suffix = || s.push_str("!");  // 定义 FnMut 必须加上 mut
println!("{s}");    // 错误，s 已被可变借用
add_suffix();
add_suffix();
println!("{s}");

// Fn
let s = String::from("Fn");
let puts = || println!("{s}");
println!("{s}");
puts();
puts();
```

这三种闭包 trait 的限制程度依次增大，因为一个 `FnOnce` 闭包还可以接受 `&mut T` 和 `&T`，而一个 `Fn` 闭包则只能接受 `&T`。编译器会在满足使用需求的前提下尽量以限制最多的方式捕获。此外，定义 `FnMut` 闭包必须加上 `mut`。

所有闭包类型都实现了 `Sized`。此外，若闭包捕获值的类型实现了以下 trait，则闭包类型也会自动实现这些 trait：

- `Clone`、`Copy`、`Sync`、`Send`

由于捕获通常是通过引用进行的，因此有以下一般规则：

- 若所有捕获值都实现了 `Sync`，则此闭包也实现了 `Sync`
- 若所有**非唯一不可变引用**的捕获值都实现了 `Sync`，且所有由唯一不可变引用、可变引用、复制或移动语义捕获的值都实现了 `Send`，则此闭包也实现了 `Send`
- 若闭包没有通过唯一不可变引用或可变引用捕获任何值，并且它通过复制或移动语义捕获的所有值都分别实现了 `Clone` 或 `Copy`，则此闭包也实现了 `Clone` 或 `Copy`

对于非 `Copy` 类型，`move` 会强制获取捕获值的所有权，但闭包类型依然会根据使用方式进行推断：

```rust
let s = String::from("hello");
let equal_to_s = move |n| s == n;   // 依然是 Fn
println!("{s}");                    // 错误，s 已被移动
assert!(equal_to_s(String::from("hello")));
```

对于如数组，始终是捕获整个值，而不是各个元素分开捕获。

```rust
let mut v = vec!["hello".to_string(), "world".to_string()];
let mut f = || v[0].push('!');
println!("{:?}", v[1]);         // 错误, v 已被可变借用
f();
println!("{v:?}");
```

但对于如元组、结构体，则只捕获使用的字段。

```rust
let mut foo = Foo {
    x: "hello".to_string(),
    y: "world".to_string(),
};
let mut f = || foo.x.push('!'); // 仅捕获 foo.x
println!("{:?}", foo.y);        // 可以使用 foo.y
f();
println!("{foo:?}");

let mut v = ("hello".to_string(), "world".to_string());
let mut f = || v.0.push('!');   // 仅捕获 v.0
println!("{:?}", v.1);          // 可以使用 v.1
f();
println!("{v:?}");
```

### 唯一不可变引用

捕获方式中有一种被称为**唯一不可变引用**的特殊类型的借用捕获，这种借用不能在语言的其它任何地方使用，也不能显式写出。

唯一不可变引用发生在修改可变引用的引用对象时：

```rust
let mut b = false;
let x = &mut b;
{
    let mut f = || {
        *x = true;
    };
    let y = &x; // 错误
    f();
}
let z = &x;
```

由于 `x` 没有 `mut`，所以 `f` 不会以 `FnMut` 来捕获。若以 `Fn` 来捕获，则闭包中 `x` 的类型为 `&&mut`，但这个引用可能不是唯一的，所以对 `x` 的赋值操作也是不安全的。因此这里以唯一不可变借用的形式来捕获：以不可变的方式借用了 `x`，但又像可变借用一样，前提是此借用必须唯一。因此 `y` 的声明是错误的，因为这违反了闭包对 `x` 的借用的唯一性。`z` 的声明是有效的，因为闭包的生命周期在块结束时释放对 `x` 的借用。

## 闭包作为参数和返回值

可以将函数指针作为参数和返回值，闭包同样也可以。不同于函数，闭包虽然也实现了 `Sized`，但函数的 `fn` 是一个类型，而闭包的 `Fn` 是一个 trait，因此只能作为 trait 才能把闭包当作参数或返回值，有效 trait 为：`FnOnce`、`FnMut` 和 `Fn`。

当返回一个闭包时，必须使用 `move` 关键字，因为在离开函数作用域时，任何通过引用捕获的值都会被丢弃。

```rust
fn get_and_ret_closure<F: Fn(String) -> String>(f: F) -> impl Fn() {
    move || println!("{}", f("Fn".to_string()))
}

fn main() {
    let f = get_and_ret_closure(|s| s);
    f();
}
```

作为 trait 返回时，若为动态 trait 对象，则需要放在像 `Box<dyn T>` 这类指针中。

```rust
fn ret_closure(flag: bool) -> Box<dyn Fn(i32) -> i32> {
    if flag {
        Box::new(|x| x + 1)
    } else {
        Box::new(|x| x + 2)
    }
}
```

由于函数指针实现了 `FnOnce`、`FnMut` 和 `Fn`，因此一个接受闭包作为参数的函数就一定能够接受一个函数指针，但反过来就不一定。

如 `map` 方法接受一个闭包：

```rust
let list = vec![1, 2, 3];
let list: Vec<String> = list.iter().map(|i| i.to_string()).collect();
```

但也可以把函数指针作为 `map` 的参数来替代闭包：

```rust
let list: Vec<String> = list.iter().map(ToString::to_string).collect();
```

在枚举中，含有关联值的变体也是一个构造函数，可以该构造函数当作参数来传递。

```rust
enum Status {
    Value(i32),
    Stop,
}

// 函数指针
let list: Vec<Status> = (0..10).map(Status::Value).collect();

// 闭包
let list: Vec<Status> = (0..10).map(|i| Status::Value(i)).collect();
```

## 闭包原理

闭包实际上是通过一个特殊的结构体实现的。每次声明都会产生一个匿名结构体类型，会包含所有捕获的变量，但这个类型无法被其它地方使用。该结构体对象实现了一个或多个 `Fn` trait，以便可以像函数一样使用它。当定义一个闭包时，编译器会根据闭包的代码和捕获的变量生成一个结构体类型，该结构体类型实现了对应的 `Fn` trait。这也是为什么 `FnMut` 闭包必须加上 `mut`，因为修改捕获的值相当于修改该结构体存储的变量。

如以下闭包示例：

```rust
fn f<F: FnOnce() -> String>(f: F) {
    println!("{}", f());
}

fn main() {
    let mut s = String::from("foo");
    let t = String::from("bar");

    f(|| {
        s += &t;
        s
    });
}
```

编译时会生成类似如下的结构体类型：

```rust
struct Closure<'a> {
    s: String,
    t: &'a String,
}

impl<'a> FnOnce<()> for Closure<'a> {
    type Output = String;

    fn call_once(self) -> Output {
        self.s += &*self.t;
        self.s
    }
}
```

因此调用 `f` 相当于：

```rust
f(Closure { s: s, t: &t });
```

由于闭包可以捕获变量，因此闭包的大小与捕获的变量有关：

```rust
use std::mem::{size_of, size_of_val};

fn main() {
    let c1 = || println!("hello");
    let c2 = |n: i32| println!("{n}");
    let s = String::from("hello");
    let s1 = s.clone();
    let c3 = || println!("{s}");
    let c4 = move || println!("{s1}");

    println!("size of c1: {}", size_of_val(&c1));
    println!("size of c2: {}", size_of_val(&c2));
    println!(
        "size of c3: {}, size of &String: {}",
        size_of_val(&c3),
        size_of::<&String>()
    );
    println!(
        "size of c4: {}, size of String: {}",
        size_of_val(&c4),
        size_of::<String>()
    );
    println!("size of main: {}", size_of_val(&main));
}
```

可以看到如下输出：

```
size of c1: 0
size of c2: 0
size of c3: 8, size of &String: 8
size of c4: 24, size of String: 24
size of main: 0
```

由此可知**闭包的大小跟参数、局部变量都无关，只与捕获的变量有关**。

# 3 错误处理

Rust 有两种错误类别：

- **不可恢复错误**：无法恢复的 Bug，如数组访问越界，通常使用 `panic!`
- **可恢复错误**：报告错误并重试，如未找到文件，通常使用 `Result`

## 不可恢复错误

当执行 `panic!` 时，会打印出错误信息，并进行**栈展开**并清理栈数据；或不进行清理而直接**终止**，转而由操作系统来清理。发生 panic 的线程会结束，若为主线程，则整个程序结束。

通过在 _Cargo.toml_ 的 `[profile]` 设置策略，`abort` 表示直接终止：

```toml
[profile.release]
panic = "abort"
```

手动 panic：

```rust
panic!("Crash here!");
```

### backtrace

设置环境变量来设置 backtrace，从而在 panic 时输出详细信息。

```shell
# PowerShell
$env:RUST_BACKTRACE=1; cargo run

# CMD
set RUST_BACKTRACE=1 && cargo run

# Bash
RUST_BACKTRACE=1 cargo run

# Fish
env RUST_BACKTRACE=1 cargo run
```

> 仅在 Debug 下有效。

## 可恢复的错误

`Result` 枚举通常用于可恢复错误，其含有 `Ok` 和 `Err` 这两个变体：

```rust
pub enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`T` 代表成功时返回的 `Ok` 中的数据类型，`E` 代表失败时返回的 `Err` 中的数据类型。

```rust
let f = match std::fs::File::open("hello.txt") {
    Ok(file) => file,
    Err(error) => panic!("Error: {:?}", error),
};
```

`File::open` 会打开一个文件，并返回一个 `Result<T, E>`。`T` 为 `std::fs::File`，`E` 为 `std::io::Error`。

## 匹配错误

大部分情况下并不是任何错误都将程序 panic，而是根据错误类型来进行不同的处理方式。

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = match File::open("hello.txt") {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Problem creating the file: {:?}", e),
            },
            _ => panic!("Problem opening the file: {:?}", error),
        },
    };
}
```

`File::open` 返回的 `Err` 的类型为 `io::Error`，该结构体的 `kind` 方法返回 `io::ErrorKind` 枚举，该枚举的变体对应 IO 操作可能导致的不同错误类型。

## Result 方法

常见 `Result` 方法：

- `is_ok`、`is_err`
- `and`、`and_then`
- `or`、`or_else`
- `map`、`map_err`
- `map_or`、`map_or_else`
- `expect`、`expect_err`
- `unwrap`、`unwrap_err`
- `unwrap_or`、`unwrap_or_else`

> 更多关于 `Result` 的方法，可参考 [Result in std::result](https://doc.rust-lang.org/std/result/enum.Result.html#implementations)。

## 传播错误

当发生错误时，除了在当前函数中处理外，还可以选择沿调用栈向上传播，称为**传播错误**。

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_content(path: &str) -> Result<String, io::Error> {
    let mut f = match File::open(path) {
        Ok(file) => file,
        Err(error) => return Err(error),
    };

    let mut s = String::new();
    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(e) => Err(e),
    }
}

fn main() {
    let s = read_content("hello.txt").unwrap();
    println!("{}", s);
}
```

### 简化传播错误

使用传播错误的模式十分常见，因此 Rust 提供了 `?` 运算符来简化，用于返回 `Result` 的表达式后。

```rust
fn read_content(path: &str) -> Result<String, io::Error> {
    let mut f = File::open(path)?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}
```

`?` 被定义为与使用 `match` 有着完全相同的处理方式。若 `Result` 的值为 `Ok`，则会返回 `Ok` 中的值而程序将继续执行。若值为 `Err`，则使用 `Err` 作为返回值从函数中提前返回，因此只能作用返回 `Result` 的函数中。

与使用 `match` 不同的是，`?` 所使用接收的错误值被传递给了 `from` 函数，它定义于标准库的 `From` trait 中，用来将错误从一种类型转换为另一种类型。当 `?` 调用 `from` 函数时，收到的错误类型被转换为**由当前函数返回类型所指定的错误类型**。这在当函数返回单个错误类型来代表所有可能失败的方式时十分有效，即使其可能会因很多种原因失败。只要每一个错误类型都实现了 `from` 函数来定义如何将自身转换为返回的错误类型，`?` 运算符会自动处理这些转换。

还可以在 `?` 之后使用链式方法调用来进一步简化代码：

```rust
fn read_content(path: &str) -> Result<String, io::Error> {
    let mut s = String::new();
    File::open(path)?.read_to_string(&mut s)?;
    Ok(s)
}
```

`?` 也可用于 `Option`，其行为与在 `Result` 上使用类似：若值是 `None`，此时 `None` 会从函数中提前返回；若值是 `Some<T>`，则 `T` 作为表达式的返回值，并继续执行。

```rust
fn plus_one(n: Option<i32>) -> Option<i32> {
    Some(n? + 1)
}
```
