# 1 模式匹配

**模式**是 Rust 中特殊的语法，用来匹配类型中的结构，由以下内容组合而成：

-   字面值、命名变量
-   解构元组、数组、结构体和枚举
-   通配符、占位符

## 使用模式的位置

### let 语句

一个 let 语句就是一个模式。

```rust
let x = 5;
```

其更正式的形式为：

```rust
let PATTERN = EXPRESSION;
```

这样的语句中变量名位于 `PATTERN` 位置，`x` 代表将匹配到的值绑定到变量 `x` 的模式。

```rust
let (x, y, z) = (1, 2, 3);
```

这里将一个元组与模式匹配。`(1, 2, 3)` 与模式 `(x, y, z)` 相匹配匹配，因此这个元组模式可看作是将三个独立的变量模式结合在一起。

---

如果模式中元素的数量不匹配元组中元素的数量，则整个类型不匹配，并会得到一个编译时错误。

```rust
// 错误
let (x, y) = (1, 2, 3);
```

### for 循环

在 `for` 循环中使用模式来解构元组：

```rust
let v = vec!['a', 'b', 'c'];

for (index, value) in v.iter().enumerate() {
    println!("{} is at index {}", value, index);
}
```

这里使用 `enumerate` 方法适配一个迭代器，返回一个包含当前元素的索引和值的元组。

### match 分支

一个常用的位置是 `match` 表达式的分支。

```rust
match VALUE {
    PATTERN1 => EXPRESSION1,
    PATTERN2 => EXPRESSION2,
}
```

匹配变量 `x` 中 `Option<i32>` 值的 `match` 表达式：

```rust
match x {
    None => None,
    Some(i) => Some(i + 1),
}
```

`match` 表达式必须是**穷尽**的，即所有可能的值都必须被考虑到。

### if let 条件表达式

当只关心一种情况的模式，可以使用 `if let` 来省略，并可选组合 `else if`、`else if let` 和 `else` 来匹配，并且匹配之间可以不相关联，其缺点在于被编译器检查穷尽性。

```rust
let value = Some(5);
let flag = false;
if let Some(1) = value {
    println!("1");
} else if let Some(2) = value {
    println!("2");
} else if flag {
    println!("true");
} else {
    println!("other");
}
```

### while let 条件循环

当只要模式能匹配就一直进行 `while` 循环。

```rust
let mut stack = Vec::new();

stack.push(1);
stack.push(2);
stack.push(3);

while let Some(top) = stack.pop() {
    println!("{}", top);
}
```

`while` 循环只要 `pop` 返回 `Some` 就会一直运行其块中的代码。一旦其返回 `None`，`while` 循环停止。

>   `while let` 不能使用 `else if`、`else if let` 和 `else` 分支组合。

### 函数参数

函数参数也是模式。

```rust
fn foo(x: i32) {}
```

类似 `let`，`x` 就是一个模式，可以在函数参数中进行匹配。

```rust
fn pair(&(x, y): &(i32, i32)) {
    println!("({}, {})", x, y);
}
```

这里就可以将一个元组参数，解构为两个 i32 类型的值。

>   闭包参数也能使用模式。

## 可反驳性

模式有两种形式：

-   可反驳的：可能会匹配会失败的模式，如 `match` 分支、`if let` 和 `while let` 表达式；
-   不可反驳的：能匹配任何值的模式，如 `let` 语句、`for` 循环和函数参数。

```rust
// 错误
let Some(x) = value;
```

因为 `let` 语句只接受不可反驳的模式，而 `value` 还有可能为 `None`，因此可能会失败。

由于可能会失败，因此可以加上 `if` 来构成 `if let` 表达式。

```rust
if let Some(x) = value {}
```

## 模式语法

### 匹配字面值

可以直接匹配字面值。

```rust
let x = 1;

match x {
    1 => println!("one"),
    2 => println!("two"),
    3 => println!("three"),
    _ => println!("anything"),
}
```

### 匹配命名变量

命名变量是匹配任何值的不可反驳模式。

```rust
let x = Some(5);
let y = 10;

match x {
    Some(20) => todo!(),
    Some(y) => println!("y = {y}"),
    _ => println!("x = {:?}", x),
}

println!("x = {:?}, y = {y}", x);
```

第一个分支不匹配，第二个分支匹配任意值，并将该值绑定到 `y` 上，这相当于在这条分支中创建了一个局部变量，并使用 `let y = 5;`，因此这里的 `y` 和 `match` 外面的 `y` 是不同的，当 `match` 表达式结束，其作用域也就结束了。

### 多个模式

使用**或**运算符 `|` 来匹配多个模式。

```rust
let x = 1;

match x {
    1 | 2 => println!("one or two"),
    3 => println!("three"),
    _ => println!("anything"),
}
```

### 匹配范围

使用 `..=` 来匹配一个闭区间内的值。

```rust
let x = 5;

match x {
    1..=5 => println!("1 ~ 5"),
    _ => println!("others"),
}
```

匹配 `char` 类型值的范围。

```rust
let x = 'c';

match x {
    'a'..='z' => println!("lowercase"),
    'A'..='Z' => println!("uppercase"),
    _ => println!("others"),
}
```

### 解构结构体

创建了变量 `a` 和 `b` 来匹配结构体 `p` 中的 `x` 和 `y` 字段。

```rust
struct Point {
    x: i32,
    y: i32,
}

let p = Point { x: 0, y: 1 };
let Point { x: a, y: b } = p;
assert_eq!(0, a);
assert_eq!(1, b);
```

模式中的变量名可以不与结构体中的字段名一致，一致的情况下，可以简写。

```rust
let p = Point { x: 0, y: 1 };
let Point { x, y } = p;
assert_eq!(0, x);
assert_eq!(1, y);
```

可以匹配部分字段值。

```rust
let p = Point { x: 0, y: 1 };

match p {
    Point { x, y: 0 } => todo!(),
    Point { x: 0, y } => todo!(),
    Point { x, y } => todo!()
}
```

### 解构枚举

解构枚举和枚举包含的值。

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

let msg = Message::ChangeColor(0, 160, 255);

match msg {
    Message::Quit => todo!(),
    Message::Move { x, y } => todo!(),
    Message::Write(s) => todo!(),
    Message::ChangeColor(r, g, b) => todo!(),
}
```

### 解构嵌套值

解构结构体和枚举的嵌套。

```rust
enum IpKind {
    Ipv4,
    Ipv6,
}

struct IpAddr {
    kind: IpKind,
    value: String,
}

let ip = IpAddr {
    kind: IpKind::Ipv4,
    value: String::from("127.0.0.1"),
};

match ip {
    IpAddr { kind: IpKind::Ipv4, value } => todo!(),
    IpAddr { kind: IpKind::Ipv6, value} => todo!()
}
```

解构结构体和元组的嵌套。

```rust
let ((a, b), Point { x, y }) = ((1, 2), Point { x: 3, y: 4 });
```

### 忽略模式值

有时并不需要使用全部匹配到的模式，可以使用 `_` 模式来进行忽略，或使用 `..` 忽略所剩部分的值。

使用 `_` 可以忽略匹配到的值，且不进行绑定。

```rust
// 忽略函数参数
fn foo(_: i32, y: i32) {}

// 忽略模式匹配
match value {
    Some(_) => todo!(),
    _ => todo!()
}

// 忽略嵌套的匹配
match (value1, value2) {
    (Some(_), Some(_)) => todo!(),
    _ => todo!()
}

// 忽略多个部分
let nums = (1, 2, 3, 4, 5);

match nums {
    (first, _, third, _, fifth) => todo!(),
    _ => todo!()
}
```

还可以使用 `..` 来忽略剩余值。

```rust
let nums = (1, 2, 3, 4, 5);

// 忽略中间值
match nums {
    (first, .., last) => todo!()
}

// 忽略尾部值
match nums {
    (first, ..) => todo!()
}
```

通过 `..` 来匹配不能产生歧义。

```rust
let nums = (1, 2, 3, 4, 5);

// 错误
match nums {
    (.., mid, ..) => todo!()
}
```

因为不能确定中间的是哪个，所以会报错。

### 匹配额外条件

**匹配守卫**是一个指定于 `match` 分支模式之后的额外 `if` 条件，它也必须被满足才能选择此分支。

```rust
let num = Some(5);

match num {
    Some(x) if x % 2 == 0 => todo!(),
    Some(x) => todo!(),
    None => todo!()
}
```

还可以在匹配守卫中使用 `|` 来指定多个模式。

```rust
let x = 1;
let y = false;

match x {
    1 | 2 | 3 if y => todo!(),
    _ => todo!()
}
```

使用 `1 | 2 | 3 if y` 实际上是相当于 `(4 | 5 | 6) if y`，而不是 `4 | 5 | (6 if y)`。

### @ 绑定

`@` 运算符在 `match` 语句中用于绑定变量到模式。这可以在一个匹配分支中，同时访问整个值和部分值。

设有一个 `Option<T>`，匹配在 `Some` 的时候使用命名变量获取内部值，但同时也需要整个 `Option<T>` 值。

```rust
let value = Some(1);

match value {
    v@ Some(t) => {
        println!("value: {:?}", v);
        println!("inner value: {t}");
    },
    None => println!("None"),
}
```

这里 `v` 就相当于是 `value`，`t` 就相当于是 `Option<T>` 的内部值。由于值是 Copy 的，因此即使模式的命名变量会造成绑定，但是依然可以使用值。

### ref 匹配

如果值不是 Copy 的，还想重复使用的话，那么就需要使用 `ref` 来匹配。

```rust
let value = Some(String::from("hello"));

match value {
    ref v@ Some(ref t) => {
        println!("value: {:?}", v);
        println!("inner value: {t}");
    },
    None => println!("None"),
}

println!("value: {:?}", value);
```

这里通过 `ref` 匹配的是值的引用，因此没有获取所有权，可以在后续继续使用。

`ref` 还可以用在 `let` 语句和函数参数中。

```rust
let s1 = String::from("hello");
let s2 = String::from("world");

let (ref r1, ref r2) = (s1, s2);

// 错误，s1 和 s2 已经被移动
println!("{s1}, {s2}");
```

这里 `r1` 和 `r2` 实际上是一个引用，其类型为 `&String`，但 `s1` 和 `s2` 则移动了所有权。

```rust
let (r1, r2) = (&s1, &s2);
```

而这里 `r1` 和 `r2` 也是一个 `&String`，但 `s1` 和 `s2` 则没有所有权。

---

而在函数中，实际上参数也是一个命名变量，并将传进来的值进行绑定。

```rust
let s = String::from("hello");
foo(s);
println!("{s}");  // 错误，s 已经被移动

fn get(ref v: String) {
    let t = v;    // t 的类型为 &String
}
```

这里通过 `ref` 将参数变成了一个引用，但是获取了外部参数的所有权。

实际上就相当于做了以下操作：

```rust
let ref v = t;

// 相当于
let v = t;
let v = &v;
```

# 2 高级特性

## Unsafe Rust

Rust 在编译时会进行安全检查以保证内存安全。由于编译器是保守的，就算遇到实际上没有问题的代码，但如果在编译期进行静态分析时没有足够的信息来确定是安全的，也会拒绝这类代码，而通过 **Unsafe Rust** 可以不进行这些检查。

此外，底层计算机硬件固有的特性导致如果不允许进行不安全操作，那么有些任务则根本无法完成。而且如果要与操作系统交互，甚至进行驱动、系统的开发，那么进行这些不安全操作是十分有必要的。

### unsafe 关键字

可以通过 `unsafe` 关键字来切换到 Unsafe Rust，然后在这个 Unsafe 代码块中，可以进行如下操作。

-   解引用裸指针；
-   调用不安全的函数和方法；
-   访问和修改可变的静态变量；
-   实现不安全 trait；
-   访问 `union` 的字段。

实际上，`unsafe` 并不会禁用安全检查，该关键字仅让这几种原本不能通过的代码变得能通过。

另外，`unsafe` 块中的代码并不代表一定不安全，只是需要开发者自己来保证安全，相当于在安全与不安全之间明确了界限，并缩小了可能出问题的代码的范围。

将不安全代码隔离，并封装到一个安全的抽象层，然后提供安全 API 是常用做法，在 Rust 标准库中有很多这类实现。

### 解引用裸指针

安全 Rust 确保引用总是有效的，不会出现悬垂引用，而不安全 Rust 有两个被称为**裸指针**的类似于引用的新类型，同样分为不可变或可变的，分别写作 `*const T` 和 `*mut T`。这里的 `*` 不是解引用运算符，而是类型名称的一部分。在裸指针的上下文中，**不可变**意味着指针解引用后不能直接赋值。

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
```

这里使用 `as` 将不可变和可变引用强转为对应的裸指针类型。

创建一个指向任意内存地址的裸指针，然后使用它是未定义行为，因为不能确定地址数据有效性，还可能出现段错误，但是没有解引用之前都是合法的安全代码，因为还没有使用它。

```rust
// 可以创建，不能使用
let address = 0x012345usize;
let r = address as *const i32;
```

若要解引用裸指针，就需要放在 unsafe 块中。

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

### 调用不安全函数和方法

不安全函数和方法与常规函数和方法类似，只需在开头添加 `unsafe`，且 unsafe 函数也必须在 unsafe 块中调用。

```rust
unsafe fn danger() {}

unsafe {
    danger();
}
```

不安全函数体也是有效的 `unsafe` 块，所以在不安全函数中进行另一个不安全操作时无需添加额外的 `unsafe` 块。

#### 不安全代码的安全抽象

一个安全的函数中包含 unsafe 块并不代表整个函数不安全。将不安全代码封装进安全函数是一个常见的抽象。如标准库中的 `split_at_mut` 函数，它获取一个可变的 slice 并从给定的索引参数开始将其分为两个可变 slice，并返回一个包含这个两个元素的元组。

```rust
let mut list = vec![1, 2, 3, 4, 5, 6];
let (a, b) = list.split_at_mut(3);
assert_eq!(&mut [1,2,3], a);
assert_eq!(&mut [4,5,6], b);
```

该函数无法只通过安全 Rust 实现，其实现类似如下代码，但并不能编译：

```rust
// 不能通过编译
fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = values.len();
    assert!(mid <= len);

    (&mut values[..mid], &mut values[mid..])
}
```

此函数首先获取 slice 的长度，然后通过检查参数长度来断言参数为合法索引，然后在一个元组中返回两个可变的 slice。

借用检查器并不能分析出只是借用这个 slice 的两个不同部分，且这两个部分没有重叠，只知道借用了同一个 slice 两次，因此会报错，但实际上这样做是安全的。

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

但这样使用可能会崩溃：

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

#### 使用 extern 调用外部函数

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

#### 其它语言调用 Rust 函数

还可以使用 `extern` 来创建一个允许其他语言调用 Rust 函数的接口。

不同于创建整个 `extern` 块，在 `fn` 之前增加 `pub` 和 `extern` 关键字并指定所用到的 ABI，还需增加 `#[no_mangle]` 注解来告诉 Rust 编译器不要 **mangle** 此函数的名称。编译器在编译时会修改函程序中变量、函数等参数的名字，用以增加一些额外编译链接时所需要的信息，这个过程被称为 **mangling**。每个语言的编译器都会以稍微不同的方式进行这个过程，因此各个语言是不相兼容的，所以为了使 Rust 函数能在其他语言中使用，必须禁用 mangle。

一旦其编译为动态库并从 C 语言中链接，`call_rust_func` 函数就能够在 C 代码中使用。

```rust
#[no_mangle]
pub extern "C" fn call_rust_func() {
    println!("Just called a Rust function!");
}
```

> `extern` 给其它语言调用的时候使用无需使用 `unsafe`。

### 访问和修改可变静态变量

全局变量在 Rust 中被称为**静态变量**，但所有权机制会有问题，因为全局变量能够被程序中所有部分所访问，若有多个线程访问相同的可变全局变量，则可能会造成数据竞争，因此在安全 Rust 中，只能访问不可变全局变量。

```rust
static HELLO_WORLD: &str = "Hello, world!";

fn main() {
    println!("name is: {}", HELLO_WORLD);
}
```

静态变量类似于常量，但名称采用大写蛇形命名法。静态变量只能储存拥有 `'static` 生命周期的引用，因此编译器可以计算出生命周期而无需显式标注。

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

### 实现不安全 trait

要实现不安全 trait 也必须使用 `unsafe`，当 trait 中至少有一个方法中不安全代码是时，该 trait 是不安全的，同时 trait 的实现也必须标记为 `unsafe`。

```rust
unsafe trait Foo {}
unsafe impl Foo {}
```

并发中的 `Sync` 和 `Send` trait，编译器会自动为完全由 `Send` 和 `Sync` 类型组成的类型自动实现。若实现了一个包含一些不是 `Send` 或 `Sync` 的类型，如裸指针，并希望将此类型标记为 `Send` 或 `Sync`，则必须使用 `unsafe`，因为Rust 不能验证该类型是否可以安全的跨线程发送或在多线程间访问。

### 访问 union 的字段

仅适用于 `unsafe` 的最后一个操作是访问**共用体**，主要用于和 C 中的共用体进行交互。`union` 和 `struct` 类似，但在一个实例中同时只能使用一个声明的字段。访问共用体的字段是不安全的，因为 Rust 无法保证当前存储在联合体实例中数据的类型。

>   关于 Rust 中共用体的信息，可参考 [Unions - The Rust Reference](https://doc.rust-lang.org/reference/items/unions.html)。

### 何时使用不安全代码

可以使用 `unsafe` 来进行这五种操作，但是需要自己来保证安全，通过使用显式的 `unsafe` 标注可以更容易地在错误发生时追踪问题的源头。

>   更多关于 Unsafe Rust 的信息，可参考 [Rust 秘典](https://nomicon.purewhite.io)。
