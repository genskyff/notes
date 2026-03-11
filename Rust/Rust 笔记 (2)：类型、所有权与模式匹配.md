# 1 语言基础

## 标识符

- 由任意非空的，且非 emoji 的 Unicode 字符构成
- 不能以数字开头，且不能为关键字
- 单个 `_` 作为标识符表示**忽略**

### 原始标识符

当和外部 FFI 进行交互时，如调用 C 库中名为 `match` 的函数。在 C 中 match 不是关键字，但在 Rust 中是关键字，因此需要使用以 `r#` 开头的原始标识符。

```rust
struct S<'r#struct> {
    r#struct: &'r#struct str,
}

fn r#fn() {
    let r#i32 = 10;
    println!("{}", r#i32);
}

fn main() {
    r#fn();
}
```

## 常量和变量

**常量**使用 `const` 声明，必须显式标注类型，并在声明时初始化，声明后值不可变。

**变量**使用 `let` 声明，可以不显式声明类型，值与变量通过**绑定**来关联。但 Rust 默认变量也是**不可变的**，需要显式使用 `mut` 修饰来使其可变。

```rust
const MAX: i32 = 5;  // 常量
let x = 1;           // 不可变变量
let mut y: u32 = 2;  // 可变变量
```

`let` 和 `mut` 是一个**模式**，可以利用**模式匹配**来声明变量：

```rust
let (mut a, b) = (1, 2);  // a 可变，b 不可变
```

变量可以不必在声明时初始化，但使用前必须被初始化：

```rust
let x;
x = 1;
println!("{x}");
```

常量和不可变变量的区别：

- 常量的值必须能够在编译期就计算出，不能是在运行时才计算出的值
- 常量可以在任何作用域中声明，包括全局作用域，而变量只能在函数作用域声明

### 隐藏

可以通过 `let` 来定义一个与已声明变量或函数同名的新变量，新变量会隐藏之前的变量或函数。

```rust
fn sum(x: i32, y: i32) -> i32 {
    x + y
}

fn main() {
    let x = 1;
    let x = x + 2;
    let x = 1.2;    // 类型可以不同
    let sum = sum(1, 2);
    sum(3, 4);      // 错误，sum 函数在此处不可用
}
```

新变量只在其作用域内起作用，当离开作用域时，外部被隐藏的项会恢复：

```rust
let v = 2;
{
    let v = 4;
    println!("{v}");   // 输出 4
}
println!("{v}");       // 输出 2
```

被隐藏的变量实际上依然存在：

```rust
let x = 5;
let ref_x = &x;
let x = 1.0;
assert_eq!(*ref_x, 5);
```

## 静态项

静态项使用 `static` 声明，必须显式标注类型和初始化。类似于常量，但在程序中表示一个精确的内存地址，通常保存在二进制文件的 `.data` 区块中。所有对静态项的引用都指向相同的内存地址，并具有 ` 'static` 生命周期，且不会在程序结束时调用析构函数 `drop`。

能够在编译期求值的常量表达式可作为静态项的初始化，并可引用其他静态项。

所有访问静态项的操作都是安全的，但有一些限制：

- 静态项的数据类型必须实现 `Sync`
- 常量项不能引用静态项

静态项可使用 `mut` 声明，但对其所有访问操作都是不安全的，需要在 `unsafe` 块中使用。

```rust
static mut COUNT: i32 = 0;

unsafe fn read_count() -> i32 {
    COUNT
}

unsafe fn write_count(n: i32) {
    COUNT += n;
}
```

## 基本类型

Rust 是**静态类型**语言，编译器能够进行类型推断。当多种类型均有可能时，必须增加**类型标注**。

```rust
let x: u32 = 10;
let y: f32 = 3.14;
```

每一个值都属于某种数据类型，Rust 有两种数据类型：**标量**和**复合**。

### 标量类型

标量类型代表一个单独的值。Rust 有四种基本标量类型：**整型**、**浮点型**、**布尔类型**和**字符类型**。

#### 整型

| **长度** | **有符号** | **无符号** |
| -------- | ---------- | ---------- |
| 8 bit    | i8         | u8         |
| 16 bit   | i16        | u16        |
| 32 bit   | i32 (默认) | u32        |
| 64 bit   | i64        | u64        |
| 128 bit  | i128       | u128       |
| arch     | isize      | usize      |

- 有符号数以**补码**形式存储

- `isize` 和 `usize` 依赖于运行程序的计算机架构

| **字面值**     | **例**        |
| -------------- | ------------- |
| Decimal        | `10_000`      |
| Hex            | `0xfe`        |
| Octal          | `0o77`        |
| Binary         | `0b1010_1000` |
| Byte (仅 `u8`) | `b'A'`        |

- 除 Byte 以外的所有字面值允许使用类型后缀，如 `12_u8`，也允许使用 `_` 作为分隔符

- 对于整数溢出，非优化编译时，会检查这类问题并 panic。优化编译时不检查，并按照补码计算实际值

#### 浮点型

Rust 有 `f32` 和 `f64` 两种浮点类型，遵循 [IEEE 754](https://zh.wikipedia.org/wiki/IEEE_754) 标准，字面值默认为 `f64`。

#### 布尔型

`bool` 表示布尔类型，仅有两个可能的值：`true` 和 `false`。

#### 字符类型

`char` 表示字符类型，值由单引号包括。

```rust
let a: char = 'a';
let b = '你';
let c = 'あ';
let d = 'Ω';
let e = '😅';
let f = '\u{102c0}';
```

`char` 可以是合法的 Unicode 标量值，一个 `char` 占 4 个字节。

Unicode 中有一些字符是**零宽度字符**，这些与 `''` 这种空字符是不一样的。**Rust 没有空值**，因此 `''` 是不被允许的。

```rust
let c = '';  // 错误，不能为空值
```

可以将字符值赋给整型变量，但限制如下：

- 必须增加类型前缀 `b`

- 仅支持 `u8`

```rust
let n: u8 = b'A';   // n = 65
```

### 复合类型

复合类型是由多个值组合而成的类型，Rust 的原生复合类型为**元组**和**数组**。

#### 元组类型

元组是一个包含多个**相同或不同类型值**的列表，且长度固定，类型表示为 `(T, U, ..)`。可通过模式匹配来**解构**其中的值，或使用 `.index` 来直接访问其中的值。

```rust
let tup: (i32, f64, u8) = (100, 2.1, 20);
let (x, ..) = tup;
assert!(x == tup.0);
```

为了避免歧义，单元素元组需要追加 `,`：

```rust
let tup = (1,);
```

#### 数组类型

数组是一个包含多个**相同类型值**的列表，且长度固定，类型表示为 `[T; N]`。可通过模式匹配解构或使用 `[index]` 来直接访问其中的值。

```rust
let arr: [i32; 5] = [1, 2, 3, 4, 5];
let [x, ..] = arr;
assert_eq!(x, arr[0]);
```

可通过 `[v; N]` 来创建一个长度为 `N`，元素值都为 `v` 的数组：

```rust
let arr = [0; 5];
```

当对无效的数组元素进行访问时会 panic：

```rust
arr[10];  // panic
```

### 引用类型

引用表示拥有某个值的借用，包含两种类型：

- `&T`：不可变引用

- `&mut T`：可变引用

引用是一个对齐且非 `null` 的指针，指向包含有效值 `T` 的内存。在值上使用 `&` 或 `&mut`，以及 `ref` 或 `ref mut` 模式可获得该值的借用。

```rust
let n1 = 1;
let rn1 = &n1;
let mut n2 = 2;
let rn2 = &mut n2;

*rn2 = *rn1;

let mut x = 5;
let ref mut y = x;
*y += 1;
assert_eq!(x, 6);
```

### 裸指针类型

裸指针包含两种类型：

- `*const T`：不可变裸指针

- `*mut T`：可变裸指针

裸指针可以是未对齐或为 `null` 的。当使用 `*` 解引用裸指针时，要求必须对齐且非 `null`，因此对裸指针**进行解引用是不安全的**。

```rust
let n1 = 1;
let pn1: *const i32 = &n1;
let mut n2 = 2;
let pn2: *mut i32 = &mut n2;

unsafe {
    *pn2 = *pn1;
}
```

或者使用 `&raw` 来定义裸指针：

```rust
let x = 1;

// 两者等价
let px = &x as *const i32;
let px2 = &raw const x;

unsafe {
    assert_eq!(*px, *px2);
}
```

### 单元类型

没有任何值的元组为**单元类型**，仅有一个**单元值** `()`。不返回任何值的表达式和函数、以 `;` 结束的语句都隐式地返回 `()`。

```rust
fn foo() {}
let empty: () = ();
()
```

### never 类型

`!` 为 **never 类型**，主要用于在函数永不返回时充当返回值，这类函数也被称为**发散函数**。

```rust
fn foo() -> ! {}
```

在 match 表达式中，需要返回一个值，且返回值类型必须相同。

```rust
fn sample_match(val: bool) -> i32 {
    match val {
        true => 42,
        false => "error",   // 错误，类型不匹配
    }
}
```

通过返回一个 `!`，可以避免这种情况。

```rust
fn loop_with_match(val: bool) {
    loop {
        match val {
            true => {
                println!("True condition detected!");
                break;
            }
            false => loop {},
        }
    }
}
```

`loop`、`break`、`continue`、`panic!`、`std::process:exit` 以及 `unwrap`、`expect` 的失败情况也返回的是 `!`。

`!` 实际上是所有类型的子类型，因此可以被强转为任何其他类型。

```rust
let x = loop {};
let y: u32 = x;
```

## 动态大小类型

在编译时就已知大小的类型为**固定大小类型**，具有 `Sized`。而在运行时才知道大小的类型为**动态大小类型**（Dynamically Sized Types，DST），具有 `?Sized`。如切片 `[T]` 和 trait 对象 `dyn Trait` 都是 DST，这种类型都不能直接使用，**必须通过指针或引用来间接使用**，如 `&[T]`、`&dyn Trait` 或 `Box<dyn Trait>` 等。

```rust
let s1: str = "foo";  // 错误
let s2: &str = "bar"
```

- 指向 DST 的指针大小是固定的，且为指向 `Sized` 的指针大小的两倍：
  - 指向切片的指针额外存储了切片的元素数量
  - 指向 trait 对象的指针额外存储了 vtable 的地址
- DST 可以作为实参来传递给有 `?Sized` 约束的泛型类型参数。当关联类型的声明有 `?Sized` 约束时，也可以被用于关联类型定义
- 默认情况下，任何泛型参数或关联类型都有 `Sized` 约束，除非使用 `?Sized` 来放宽约束
- 与泛型类型参数不同，trait 定义中的默认约束为 `Self: ?Sized`，因此可以为 DST 实现 trait
- 结构体的最后一个字段可以为 DST，这让该结构体也是一个 DST

> 静态项、常量、变量和函数参数必须具有 `Sized`。

## 类型别名

使用 `type` 关键字来给现有类型声明一个类型别名。

```rust
type MyType = i32;
```

`MyType` 实际上是 `i32` 的同义词，而不是一个全新的类型 ，该类型的值将被当作 `i32` 来对待。

```rust
type MyType = i32;

let x: i32 = 5;
let y: MyType = 5;

println!("x + y = {}", x + y);
```

类型别名主要用于减少重复，如一个很长的类型：

```rust
Box<dyn Fn() + Send + 'static>
```

在函数签名或类型注解中写这个是十分繁琐且冗长的：

```rust
let f: Box<dyn Fn() + Send + 'static> = Box::new(|| println!("hi"));
fn takes_long_type(f: Box<dyn Fn() + Send + 'static>) {}
fn returns_long_type() -> Box<dyn Fn() + Send + 'static> {}
```

通过类型别名简化后：

```rust
type Thunk = Box<dyn Fn() + Send + 'static>;
let f: Thunk = Box::new(|| println!("hi"));
fn takes_long_type(f: Thunk) {}
fn returns_long_type() -> Thunk {}
```

类型别名也常与 `Result<T, E>` 结合使用来减少重复。

```rust
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

fn inverse_number(num: f64) -> Result<f64> {
    if num == 0.0 {
        Err(Box::new(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "Cannot divide by zero",
        )))
    } else {
        Ok(1.0 / num)
    }
}
```

元组结构体和单元结构体的类型别名**不能用于充当该类型的构造函数**。

```rust
struct MyStruct(i32);
use MyStruct as UseAlias;
type TypeAlias = MyStruct;

fn main() {
    let _ = UseAlias(5);
    let _ = TypeAlias(5); // 错误
}
```

## 字符串

Rust 中主要有 `str` 和 `String` 两种字符串类型，其中 `str` 是原生类型，存储在栈上，`String` 存储在堆上。这两种值的表示方法与 `[u8]` 相同，且都保证数据是有效的 UTF-8 序列。由于 `str` 是一个 DST，具有 `?Sized`，因此只能通过指针类型间接使用，如 `&str` 和 `Box<str>`。

```rust
let s1: &str = "foo";  // 实际上会被推断为 &'static str
let s2: &'static str = "bar";
let s3: String = String::from("haha");
let s4: &str = &s3;
let s5: Box<str> = String::from("hehe").into_boxed_str();
```

`&str` 和 `String`：

- `&str`：一个字符串切片，表示对某个字符串数据的不可变引用
- `String`：在堆上分配的字符串

`&str` 和 `&'static str`：

- 不是所有的 `&str` 都是 `&'static str`。一个字符串字面量如 `"hello"`，则默认具有 `'static` 生命周期
- 若从 `String` 创建一个切片，该切片的生命周期则不是 `'static`

大多数时候，可以不用显式标注 `&str` 或 `&'static str`，因为编译器会自动推断生命周期。

### 原始字符串

以 `r` 或 `r#` 的形式来表示原始字符串，不会对字符进行转义。

```rust
let s = r"foo\t\nbar";
let s1 = r#"foo\t\nbar"#;
let s2 = r##"foo\t\nbar"##;
let s3 = r###"foo\t\nbar"###;
```

当使用 `r#` 的形式时，需要确保前后 `#` 的数量是一致的。

### C 字符串

Rust 也支持 `c"foo"` 形式的 C 风格字符串，其以 `\0` 结束，实际上是 `&'static std::ffi::CStr` 类型。

```rust
let s = c"foo"; // &'static CStr;
assert_eq!(4, std::mem::size_of_val(s));
assert_eq!(s, std::ffi::CStr::from_bytes_with_nul(b"foo\0").unwrap());
```

原始字符串也可以和特定格式字符串组合：

```rust
let s1 = cr"foo\t\nbar";
let s2 = cr#"foo\t\nbar"#;
let s3 = br"foo\t\nbar";
let s4 = br#"foo\t\nbar"#;
```

## 语句和表达式

Rust 是一种基于表达式的语言，求值都通过表达式完成。表达式可内嵌到另一个表达式中，求值规则包括指定表达式产生的值和指定其各个子表达式的求值顺序。语句则主要用于包含表达式，以及显式安排表达式的求值顺序。表达式和语句的显著区别：表达式**计算并产生一个值**，语句执行操作但**不返回值**。

### 声明语句

声明语句是在其封闭语句块内部引入一个或多个名称的语句，包含两种：程序项声明和 `let` 声明。

#### 程序项声明

程序项声明语句不会隐式捕获外部作用域中的函数参数、泛型参数和局部变量。

```rust
fn foo(a: i32) {
    let v = a + 1;

    fn bar() {
        a + v;  // 错误，参数 a 和局部变量 v 都不能被捕获
    }
}
```

#### let 声明

`let` 语句通过不可反驳的模式引入了一组新的变量。除非被另一个变量声明隐藏，否则任何变量从声明点到封闭块作用域的结束都是可见的。`let` 还通过**绑定**使值和变量关联起来，任何值只有被绑定后，才能继续存在，否则其**生命周期会在当前语句结束时结束**。

### 表达式语句

表达式语句是对表达式求值并忽略其结果的语句。

```rust
1 + 2;  // 忽略计算值
```

### 语句属性

语句可以有外部属性，在语句中有意义的属性是 `cfg` 和 lint 检查属性。

```rust
#[cfg(target_os = "windows")]
#[allow(unused)]
let greet = "Hello Windows!";

#[cfg(target_os = "linux")]
let greet = "Hello Linux!";
```

### 控制流表达式

Rust 中有 4 中控制流表达式：`if`、`loop`、`while` 和 `for`，其中的条件**必须是 `bool` 值**。

`if` 用于控制分支，可与 `else` 搭配使用。

```rust
let mut x = 10;
x = if x < 3 {
    x + 1
} else if x < 6 {
    x + 2
} else {
    x + 3
};
```

`loop` 用于无限循环，`while` 用于条件循环，`for` 用于遍历，`break` 用于提前跳出循环，`continue` 用于提前结束本次循环。由于 `loop` 默认返回一个 `!`，因此**只有 `loop` 能够使用 `break + <value>` 的形式来返回一个值**。

```rust
// loop
let mut x = 0;
let y = loop {
    x = x + 1;
    if x > 10 {
        break x;
    }
};

// while
let arr = [1, 2, 3];
let mut i = 0;
while i < arr.len() {
    println!("{}", arr[i]);
    i += 1;
}

// for
for e in 1..4 {
    println!("{e}");
}
```

`break` 和 `continue` 只能用于内层循环，使用 `'` + `标识符` 的形式定义一个**循环标签**，则可作用于外层循环。

```rust
'out: loop {
    loop {
        println!("Do this");
        break 'out;
    }
    println!("Never do");
}
println!("Do this after loop");
```

### 其他表达式

Rust 中的表达式有很多种，主要有：

- 字面量表达式
- 路径表达式
- 块表达式
- 运算符表达式
- 结构体表达式
- 调用表达式
- 闭包表达式
- 区间表达式
- 模式匹配表达式
- 返回表达式
- 异步表达式
- ...

> 更多关于表达式的信息，可参考 [Expressions](https://doc.rust-lang.org/nightly/reference/expressions.html)。

# 2 所有权

## 所有权规则

所有权是 Rust 用来管理内存的机制。

- 每个值都有一个**所有者**
- 值**有且仅有一个**所有者
- 当所有者离开作用域时，这个值将被丢弃

### 作用域

作用域是项在程序中有效的范围。

```rust
let s1 = "foo";       // s1 生效
{                     // 作用域开始
    let s2 = "bar";   // s2 生效
}                     // 作用域结束，s2 无效，s1 有效
```

当变量进入作用域时，就是有效的，并一直持续到离开作用域为止。变量按其定义的相反顺序丢弃，结构体和元组的字段按其定义的顺序丢弃。

### 堆上的数据

在编译时就知道的大小的数据通常放在栈上，而变化的或运行时才知道大小的数据通常放在堆上。`String` 类型就是一种放在堆上的数据。

```rust
let mut s = String::from("foo");
s.push_str("bar");
```

`&str` 在编译时就知道其内容，被直接硬编码进二进制文件的只读区块中，因此效率高，但不可变。

对于 `String` 类型，为了支持一个可变的文本片段，需要在堆上分配一块在编译时未知大小的内存来存放内容，这需要：

- 在运行时向操作系统申请内存
- 在处理完后释放内存的方法

在有垃圾回收的语言中， GC 管理这部分内存，在没有 GC 的语言中，需要手动管理。提前释放和重复释放都会导致问题，这需要精确配对每一个申请和释放，特别是在并发环境下，这种问题会更严重。

所有权的策略为：**变量离开作用域后内存就自动释放**。

```rust
{
    let s = String::from("foo");  // s 从此处开始生效
}                                 // s 无效
```

当变量离开作用域时，在结尾的 `}` 处将自动调用析构函数 `drop` 释放内存。

> 在 C++ 中，这种在生命周期结束时释放**资源**的模式被称作 RAII（Resource Acquisition Is Initialization，资源获取即初始化）。资源可以是内存地址，包含某个值的变量、共享内存引用、文件句柄、网络套接字或数据库连接句柄等。

### 移动语义

Rust 中的多个变量可以采用一种独特的方式与同一数据交互。

```rust
let x = 5;
let y = x;
let s1 = String::from("hello");
let s2 = s1;
```

`x` 和 `y` 都是固定大小类型，直接存放在栈上，因此 `y` 复制了 `x`。对于 `String`，`s2` 并不会复制 `s1`。

`String` 由三部分组成：**指向字符串的指针、长度和容量**。这一组数据存储在栈上，堆上则存放字符串的内容。

![String 在内存中的表示](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203232352837.png)

当把 `s1` 赋值给 `s2` 时，`String` 在栈上的数据被复制了，而堆上的数据没有复制。只复制指针、长度和容量这些栈上的数据可看做**浅拷贝**，而把栈和堆上的数据都进行复制可看做**深拷贝**。Rust 不会自动创建数据的深拷贝，因此任何自动的复制可以被认为对运行时性能影响较小。

![s1 和 s2 指向同一块堆内存](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203240158188.png)

按照所有权规则，当变量离开作用域后，会自动调用析构函数，但 `s1` 和 `s2` 都指向了同一个堆内存，这就会导致二次释放。为了确保内存安全，这种情况下就认为 `s1` 不再有效，因此 `s1` 不需要在离开作用域时进行清理。

```rust
let s1 = String::from("hello");
let s2 = s1;        // s1 失效
println!("{s1}");   // 错误
```

这种行为可以看作 `s1` 被移动到了 `s2` 中，称为**移动**。当持有堆中数据的变量离开作用域时，其值将通过 `drop` 函数被清理掉，**除非数据被移动为另一个变量所有**。

### 显式深拷贝

若确实需要复制堆上的数据，而不仅仅是栈上的数据，可以使用 `clone`。

```rust
let s1 = String::from("foo");
let s2 = s1.clone();
println!("{s1}, {s2}");
```

由于 `clone` 需要复制堆上的数据，因此会影响运行时性能。

### Copy 和 Clone

任何能够在编译期就知道大小的类型，都具有 `Copy`，在赋值时会自动进行复制，具有复制语义，如基本类型、函数类型、函数指针、没有捕获值或捕获的值具有 `Copy` 的闭包。而在堆上的数据则不具有 `Copy`，但可能具有 `Clone`，可以显式调用 `clone` 进行深拷贝。同时任何实现了 `Drop` 的类型也不能具有 `Copy`。

对于指针类型，所有的 `&T` 和 `*const T` 都具有 `Copy`，而 `&mut T` 和 `*mut T` 则不具有。

### 所有权与函数

将值传递给函数在语义上与给变量赋值类似，向函数传递值可能会移动或复制。

```rust
fn print_number(n: i32) {
    println!("{n}");
}   // n 被移出作用域

fn print_string(s: String) { // s 作用域开始
    println!("{s}");
}   // s 被移出作用域并调用 drop 函数

fn main() {
    let n = 1;
    let s = String::from("foo");
    print_number(n);      // n 的值移动到函数中，但 i32 是 Copy 的，可在之后继续使用
    print_string(s);      // s 的值移动到函数中，之后不能继续使用
    println!("{n}");      // n 依旧有效
    println!("{s}");      // 错误，s 已经无效
}   // n 被移出作用域，s 的值已被移走，不会调用析构函数
```

### 返回值与作用域

返回值也可以转移所有权。

```rust
fn ret() -> String {
    let s = String::from("foo");
    s   // 将 s 的值移出，返回给调用它的函数
}

fn take_and_ret(ts: String) -> String {
    ts  // 将 ts 的值移出，返回给调用它的函数
}

fn main() {
    let s1 = ret();             // 函数将返回值移动到 s1
    let s2 = String::from("foo");
    let s3 = take_and_ret(s2);  // s2 的值被移动到函数中，函数将返回值移动到 s3
}   // s1、s3 被移出作用域，调用析构函数，s2 的值已被移走，不会调用析构函数
```

## 引用和借用

### 引用类型

以一个对象的**引用**作为参数而不获取值的所有权，类型表示为 `&T`，创建一个引用的行为称为**借用**。

```rust
fn str_len(s: &String) -> usize {   // s 是对 String 的引用
    s.len()
}   // s 离开作用域，但它并不拥有引用值的所有权，所以不会调用析构函数

fn main() {
    let s1 = String::from("hello");
    let len = str_len(&s1);
    println!("s1: {s1}, len: {len}");
}
```

传递 `&s1` 给函数，同时在函数定义中，获取 `&String` 而不是 `String`。`&` 表示引用，允许使用值但不获取其所有权。因为并不拥有这个值，当引用离开作用域时其指向的值也不会被丢弃。函数签名使用 `&` 来表明参数 `s` 的类型是一个引用。

![对象的引用](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203240005250.png)

引用和指针类似，其保存了一个地址，可以由此访问储存于该地址的数据，并且确保指向的值是有效的。

> 与 `&` 相反的操作是**解引用**，使用解引用运算符 `*`。

### 区分引用和借用

`s1` 是一个引用，借用了来自 `s` 的值，即来自 `String` 的借用，因此 `s1` 的类型为 `&String`。

```rust
let s = String::new();
let s1 = &s;
```

> 通常情况下可以不用严格区分这两者。

### 可变引用

变量默认是不可变的，引用也一样，**默认不允许修改引用的值**。

```rust
let s = String::from("foo");
let ps = &s;
ps.push_str("bar");  // 错误，引用默认不可变
```

使用 `mut` 修饰变量和引用，可以使引用可变，类型表示为 `&mut T`。

```rust
let mut s = String::from("foo");
let ps = &mut s;
ps.push_str("bar");
```

`mut` 变量可被引用为 `&` 或 `&mut`，非 `mut` 变量只能被引用为 `&`。

```rust
let x = 1;
let mut y = 2;
let rx = &mut x;    // 错误，非 mut 变量只能被引用为 &
let ry = &y;        // 正确，可以对 mut 变量引用为 &
```

`mut` 变量指的是该变量本身是否可变，`mut` 引用指的是所引用的值是否可变。

```rust
let x = 1;
let y = 2;
let mut rx = &x;
rx = &y;    // 改变的是变量自身

let mut z = 3;
let rz = &mut z;
*rz = 6;    // 改变的是引用的值
```

若变量本身的类型是引用，则 `&` 和 `&mut` 是两种数据类型，因此一个 `mut` 变量的类型不能在 `&` 和 `&mut` 之间切换。

```rust
let mut x = 1;
let mut y = 2;
let mut rx = &mut x;    // rx 的类型被确定为 &mut
rx = &y;                // 错误，不能将一个 & 类型赋值给 rx
let rx = &y;            // 正确，可以通过隐藏来改变 rx 的类型
```

**值在同一作用域内有且仅有一个可变引用**，这个限制可以避免数据竞争。

```rust
let mut s = String::from("foo");
let r1 = &mut s;
let r2 = &mut s;    // 错误
```

通过创建新的作用域，以允许拥有多个可变引用。

```rust
let mut s = String::from("foo");
{
    let r1 = &mut s;
}   // r1 离开作用域，r2 可以拥有 s 的可变引用
let r2 = &mut s;
```

**不能在拥有不可变引用的同时拥有可变引用，但可以拥有多个不可变引用**。

```rust
let mut s = String::from("foo");
let r1 = &s;
let r2 = &s;
let r3 = &mut s;    // 错误，已有不可变引用
```

一个引用的作用域从声明的地方开始一直持续到**最后一次使用为止**。如最后一次使用不可变引用在声明可变引用之前，或仅在最后一次使用可变引用**之后**，原始数据才可再次被不可变或可变地借用。编译器在作用域结束之前判断不再使用的引用的能力称为**非词法作用域生命周期**。

```rust
let mut s = String::from("foo");
let r1 = &s;
let r2 = &s;
println!("{r1}, {r2}");   // 最后一次使用引用，r1、r2 作用域结束
let r3 = &mut s;          // 可以使用
println!("{r3}");
```

在引用的生命周期内，被引用的变量本身不允许改变，不管是 `&` 还是 `&mut`。

```rust
let mut x = 1;
let rx = &mut x;              // 亦或是 &x
x = 2;                        // 错误，不允许 x 本身改变
println!("{rx}");
```

### 多重引用

`&&T`：对不可变引用的不可变引用。

```rust
let x: i32 = 5;
let y: &i32 = &x;
let z: &&i32 = &y;
```

`&&mut T`：对可变引用的不可变引用，不能通过这个引用改变原始数据，但原始数据可被其他方式修改。

```rust
let mut x: i32 = 5;
let y: &mut i32 = &mut x;
let z: &&mut i32 = &y;
**z = 10;  // 错误
*y = 10;
```

`&mut &T`：对不可变引用的可变引用，可以改变引用本身，如指向另一个不可变引用，但不能通过该引用修改被引用的值。

```rust
let x: i32 = 5;
let y: i32 = 10;
let mut a: &i32 = &x;
let b: &mut &i32 = &mut a;
*b = &y;
**b = 6;  // 错误
```

`&mut &mut T`：对可变引用的可变引用，既可以改变引用本身，也可以通过该引用修改被引用的值。

```rust
let mut x: i32 = 5;
let mut y: &mut i32 = &mut x;
let z: &mut &mut i32 = &mut y;
**z = 10;
```

### 引用规则

- 在任意时刻，要么仅有一个可变引用，要么仅有一个或多个不可变引用
- 引用的作用域持续到**最后一次使用**为止
- 引用必须总是有效

### 悬垂引用

在某些语言中，可以在释放内存时保留指向它的指针从而错误地生成一个悬垂指针。**悬垂指针**是其指向的内存可能已经被分配给其他所有者。Rust 确保引用永远也不会变成悬垂状态：**编译器确保数据不会在其引用之前离开作用域**。

```rust
fn main() {
    let r = dr();            // 引用指向无效的 String
}

fn dr() -> &String {        // 返回一个字符串引用
    let s = String::from("foo");
    &s                      // 错误
}   // s 离开作用域，其内存将被释放
```

## 切片类型

切片是没有所有权的数据类型，也是一种 DST，记作 `[T]`，其引用记作 `&[T]`。它允许引用集合中一段连续的元素序列，而不是引用整个集合。由于切片只能通过引用使用，通常不用严格区分切片和切片的引用。

### 字符串切片

字符串切片是对 `String` 或 `str` 中一部分值的引用，记作 `&str`。实际上 `str` 就是一个类型为 `[u8]` 的动态大小类型，而 `&str` 就是一个 `&[u8]`。和通常的 `[u8]` 或 `&[u8]` 的区别为，`&str` 保证其中的值为合法的 UTF-8 编码，所以也可看作一个 `[char]` 或 `&[char]`。

```rust
let s = String::from("hello world");
let s1 = &s[0..5];
let s2 = &s[6..=10];
```

`..` 为**区间表达式**，`=` 表示闭区间。`s1` 将引用整个 `String` 中索引值为 `[0..5]` 部分。它不是对整个 `String` 的引用，而是对部分 `String` 的引用。

![字符串切片](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203240457604.png)

字符串切片的索引必须位于有效的 UTF-8 字符边界内，若尝试从一个多字节字符的中间位置创建字符串切片，则会 panic。

```rust
let s = String::from("你好");
let s1 = &s[0..3];
let s2 = &s[0..2];   // panic，UTF-8 中汉字占 3 个字节
```

对于区间表达式，若从索引 0 开始或到尾部结束，可以不写两个点号之前或之后的值。

```rust
let s1 = &s[..5];
let s2 = &s[6..];
let s3 = &s[..];    // 获取整个字符串的切片
```

#### 字符串字面值就是切片

字符串字面值被储存在二进制文件中，因此它就是一个切片。

```rust
let s = "foo";
```

这里 `s` 的类型是 `&str`：它是一个指向二进制文件特定位置的切片，这也就是为什么字符串字面值是不可变的。

#### 字符串切片作为参数

对于一个接受 `&String` 参数的函数：

```rust
fn foo(s: &String) {}
```

可以改为接受 `&str`：

```rust
fn foo(s: &str) {}
```

这样可以对 `String` 值和 `&str` 值使用相同的函数，使 API 更加通用。

```rust
let s1 = String::from("foo");
let s2 = "bar";

foo(&s1);
foo(&s1[..]);
foo(s2);
foo(&s2[..]);
```

### 其他切片类型

除了字符串切片，任何 `&[T]` 都是切片，如 `&[i32]`。

```rust
let arr = [1, 2, 3, 4, 5];
let slice = &arr[1..3];
assert_eq!(slice, &[2, 3]);
```

### 切片方法

常见切片方法：

- `chunks`、`concat`、`contains`、`flatten`、`to_vec`
- `first`、`last`
- `start_with`、`end_with`、`fill`、`fill_with`
- `strip_prefix`、`strip_suffix`
- `get`、`swap`、`join`、`len`
- `repeat`、`reverse`、`windows`
- `is_ascii`、`is_empty`、`is_sorted`
- `make_ascii_lowercase`、`make_ascii_uppercase`
- `to_ascii_lowercase`、`to_ascii_uppercase`
- `rotate_left`、`rotate_right`
- `sort`、`sort_by`
- `split`、`split_at`、`splitn`

> 更多关于切片的方法，可参考 [slice - Rust](https://doc.rust-lang.org/std/primitive.slice.html#implementations)。

# 3 自定义类型

## 结构体

### 结构体定义

结构体是一种**积类型**（Product type），通过 `struct` 定义。没有任何字段的为**单元结构体**，通常用于不存储数据仅实现某个 trait 时使用。没有字段名只有类型的为**元组结构体**。

```rust
struct User {
    name: String,
    age: u8,
}

struct U;
struct Rgb(u8, u8, u8);

fn main() {
    let mut user1 = User {
        name: String::from("Alice"),
        age: 18
    };

    let user2 = User {
        name: String::from("Bob"),
        ..user1
    };

    let u = [U, U {}];
    let color = Rgb(255, 255, 255);

    user1.age = 20;
}
```

在初始化结构体时，可以使用**结构体更新语法** `..`，来指定剩余未显式设置值的字段与给定实例对应字段的值相同，但若给定实例中的这些对应字段没有实现 `Copy`，则会发生移动。

当使用变量来进行初始化时，若变量名与字段名相同，则可使用**字段初始化简写语法**。

```rust
fn new(name: String, age: u8) -> User {
    User {
        name,
        age
    }
}
```

### 所有权

结构体不是标量类型，没有实现 `Copy`，因此直接赋值会发生移动。

```rust
struct Foo;

fn main() {
    let s1 = Foo;
    let s2 = s;    // s1 被移动到 s2
}
```

## 枚举

### 枚举定义

枚举是一种**和类型**（Sum type），通过列举可能的**变体**来定义一个类型。在 Rust 中，枚举是一种标签联合体。

```rust
enum IpKind {
    V4,
    V6
}
```

枚举变体拥有隐式的从 0 开始的整数值，可以通过 `as` 来进行类型转换，也可以显式指定值：

```rust
// 隐式值，从 0 开始
enum Number {
    Zero,
    One = 10,
    Two // 11
}

// 显式值
enum Color {
    Red = 0xff0000,
    Green = 0x00ff00,
    Blue = 0x0000ff
}

fn main() {
    println!("Zero is {}", Number::Zero as i32);
    println!("Two is {}", Number::Two as i32);

    println!("Red are #{:06x}", Color::Red as i32);
    println!("Blue are #{:06x}", Color::Blue as i32);
}
```

枚举变体还可以关联不同类型的值：

```rust
enum IpKind {
    V4(u8, u8, u8, u8),
    V6(String)
}

let home = IpKind::V4(127, 0, 0, 1);
let loopback = IpKind::V6(String::from("::1"));
```

**这样定义的枚举变体的名字也变成了一个构建枚举实例的构造函数**，即 `IpAddr::V4()` 是一个获取 `String` 参数并返回 `IpKind` 类型实例的函数调用。在定义枚举时，编译器会自动定义这些构造函数。

```rust
enum Message {
    Quit,
    Move { x: u32, y: u32 },
    Write(String),
    Color(u8, u8, u8)
}
```

这个枚举有四个含有不同类型的变体：

- `Quit` 没有关联任何数据
- `Move` 包含一个匿名结构体
- `Write` 包含一个 `String`
- `Color` 包含三个 `u8`

使用结构体也可以这样定义，但没有使用枚举简洁：

```rust
struct QuitMessage;
struct MoveMessage { x: u32, y: u32 }
struct WriteMessage(String);
struct ColorMessage(u8, u8, u8);
```

不包含任何变体的枚举为**无变体枚举**，由于没有任何有效的值，所以不能被实例化。实际上这相当于 `!` 类型，但不能被强转为其他类型。

```rust
enum ZeroVariants {}

fn main() {
    let x: ZeroVariants = loop {};
    let y: u32 = x; // 错误，类型不匹配
}
```

### Option 枚举

许多语言中，空值 `null` 代表没有值。当尝试像非空值那样使用空值，就会出现错误。

为了避免这种情况，**Rust 没有空值**，但有一个可以表示存在与否概念的枚举。

```rust
enum Option<T> {
    Some(T),
    None
}
```

`Option` 枚举已被包含在标准库预导入包中，不需要将其显式引入作用域，其变体也不需要 `Option::` 前缀，可直接使用 `Some` 和 `None`。

```rust
let some_number = Some(5);
let some_string = Some("foo");
let absent_number: Option<i32> = None;
```

若使用 `None` 而不是 `Some`，则需要显式标注类型，因为编译器只通过 `None` 无法进行类型推断。

```rust
let none = None::<i32>;
```

### Option 方法

常见 `Option` 方法：

- `is_some`、`is_none`
- `and`、`and_then`
- `or`、`or_else`
- `map`、`map_or`、`map_or_else`
- `expect`、`unwrap`
- `unwrap_or`、`unwrap_or_else`

> 更多关于 `Option` 的方法，可参考 [Option in std::option](https://doc.rust-lang.org/std/option/enum.Option.html#implementations)。

## 联合体

Rust 的联合体和 C 中的联合体基本相同，使用 `union` 定义，但仅允许具有 `Copy` 的类型作为其字段。每次对联合体的访问都将其部分存储内容转换为被访问字段的类型。由于转换可能会导致意外或未定义行为，所以访问联合体字段是不安全的，需要放在 `unsafe` 块中。

```rust
union MyUnion {
    i: i32,
    f: f64,
}

fn main() {
    let u = MyUnion { i: 5 };
    println!("{}", unsafe { u.i });
}
```

## 实现

实现是将结构体、枚举或联合体这类程序项与实现类型关联起来的程序项。使用 `impl` 定义，包含了当前实现类型实例的函数——方法，当前实现类型本身的静态函数或常量——关联函数或关联常量。

实现有两种：

- 固有实现：包含方法、关联函数或关联常量
- trait 实现：与固有实现类似，但使用 `for` 来为某个具体类型实现 trait

```rust
#[derive(Debug)]
struct Color(u8, u8, u8);

impl Color {
    const WHITE: Color = Color(255, 255, 255);

    fn new(r: u8, g: u8, b: u8) -> Self {
        Self(r, g, b)
    }
}

impl Color {
    fn red() -> Color {
        Color(255, 0, 0)
    }

    fn mix(&self, other: &Color) -> Color {
        let r = self.0 | other.0;
        let g = self.1 | other.1;
        let b = self.2 | other.2;
        Color(r, g, b)
    }
}

impl std::fmt::Display for Color {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let hex = format!("{:02X}{:02X}{:02X}", self.0, self.1, self.2);
        write!(f, "{}", hex)
    }
}

fn main() {
    let white = Color::WHITE;
    let red = Color::red();
    let blue = Color::new(0, 0, 255);
    println!("{white:?}");
    println!("{red}");
    println!("{blue}");
    println!("{}", red.mix(&blue));
}
```

`new` 和 `red` 是**关联函数**，因为其作用于类型而非实例，`WHITE` 是**关联常量**，`mix` 是**方法**。

- 关联函数、关联常量：通过 `::` 调用
- 方法：通过 `.` 调用

方法与函数类似，但第一个参数总是 `self`，代表调用该方法的实例。`&self` 表示引用实例本身，这实际上是 `self: &Self` 的缩写。在一个 `impl` 块中，`Self` 是类型的别名。只要第一个参数名为 `self`，就代表了实例本身。

- `Self`：实例类型的别名
- `self`：获取 `self` 的所有权
- `&self`：不可变地借用 `self`
- `&mut self`：可变地借用 `self`

> 在同一 Crate 内，对同一个程序项的实现可分为多个 `impl` 块，也可合并到一起。

### 自动引用和解引用

在 C / C++ 中，有两个不同的运算符来调用方法：`.` 直接在对象上调用方法，而 `->` 在一个对象的指针上调用方法，这时需要先解引用指针。

```c
object->method();
(*object).method();
```

Rust 并没有一个与 `->` 等效的运算符，但有**自动引用和解引用**。当使用 `object.method()` 时，编译器会自动为 `object` 添加 `&`、`&mut` 或 `*` 以使 `object` 与方法签名匹配。

```rust
let red = Color::red();
let blue = Color::new(0, 0, 255);
println!("{}", red.mix(&blue));
println!("{}", (&red).mix(&blue));
```

`red`、`(&red)` 实际上是等价的，因为方法明确接受 `&self`，因此编译器能自动推断出是 `self`、`&self` 还是 `&mut self`。

## 内存布局

Rust 的内存布局还未稳定，对于结构体或枚举等，编译器可能会对字段顺序、字段内存等进行优化，但可使用 `repr` 属性来自定义内存布局。

```rust
use std::mem::{align_of, size_of};

#[repr(C, align(8))]
struct ThreeInts {
    first: i16,
    second: i8,
    third: i32,
}

#[repr(C)]
union SizeRoundedUp {
    a: u32,
    b: [u16; 5],
}

fn main() {
    assert_eq!(align_of::<ThreeInts>(), 8);
    assert_eq!(size_of::<ThreeInts>(), 8);
    assert_eq!(align_of::<SizeRoundedUp>(), 4);
    assert_eq!(size_of::<SizeRoundedUp>(), 12);
}
```

带字段的 `#[repr(C)]` 枚举的内存布局实际上等效于一个带两个字段的 `#[repr(C)]` 结构体。

```rust
use std::mem::{size_of, size_of_val};

#[repr(C)]
enum MyEnum {
    A(u32),
    B(f32, u64),
    C { x: u32, y: u8 },
    D,
}

// 等效于以下定义
#[repr(C)]
struct MyEnumRepr {
    tag: MyEnumDiscriminant,
    payload: MyEnumFields,
}

#[repr(C)]
enum MyEnumDiscriminant {
    A,
    B,
    C,
    D,
}

#[repr(C)]
union MyEnumFields {
    a: MyAFields,
    b: MyBFields,
    c: MyCFields,
    d: MyDFields,
}

#[repr(C)]
#[derive(Copy, Clone)]
struct MyAFields(u32);

#[repr(C)]
#[derive(Copy, Clone)]
struct MyBFields(f32, u64);

#[repr(C)]
#[derive(Copy, Clone)]
struct MyCFields {
    x: u32,
    y: u8,
}

#[repr(C)]
#[derive(Copy, Clone)]
struct MyDFields;

fn main() {
    let e = MyEnum::A(1);
    let s = MyEnumRepr {
        tag: MyEnumDiscriminant::A,
        payload: MyEnumFields { a: MyAFields(1) },
    };

    assert_eq!(size_of::<MyEnum>(), size_of::<MyEnumRepr>());
    assert_eq!(size_of_val(&e), size_of_val(&s));
}
```

# 4 模式匹配

**模式**是 Rust 中特殊的语法，用来匹配类型中的结构，由以下内容组成：

- 字面值、命名变量
- 解构元组、数组、结构体、枚举和联合体
- 通配符、占位符

## 使用模式的位置

### let

let 语句是一个模式，其正式形式为：

```rust
let <PATTERN> = <EXPRESSION>;
```

语句中变量名位于 `PATTERN` 位置，然后将 `EXPRESSION` 中的值解构后绑定到对应的变量。

```rust
let (x, y, z) = (1, 2, 3);
```

### for

在 `for` 循环中使用模式来解构元组：

```rust
let v = vec!['a', 'b', 'c'];

for (i, v) in v.iter().enumerate() {
    println!("{v} is at index {i}");
}
```

### match

`match` 允许将一个值与一系列的模式比较并根据匹配的模式执行相应代码。

```rust
match VALUE {
    <PATTERN1> => <EXPRESSION1>,
    <PATTERN2> => <EXPRESSION2>,
}
```

匹配变量 `x` 中 `Option<i32>` 值的 `match` 表达式：

```rust
match x {
    Some(i) => Some(i + 1),
    None => None,
}
```

`match` 表达式必须是**穷尽**的，且每个分支的返回值类型都必须相同（`!` 类型除外）。

### if let

当只关注一种情况的模式，可以使用 `if let` 来省略，并可选组合 `else if`、`else if let` 和 `else` 来匹配，并且匹配之间可以不相关联，其缺点在于匹配没有穷尽。

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

### while let

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

> `while let` 不能使用 `else if`、`else if let` 和 `else` 分支组合。

### let 链

在 Rust 2024 版本中，`let` 链可以在 `if` 和 `while` 中使用 `&&` 链接 `let` 语句，并可与逻辑表达式混合使用，以简化嵌套的写法。`let` 表达式内的模式可以是不可反驳的，也可以是可反驳的，且绑定在链的后续部分以及主体部分中均可使用。

```rust
enum Foo {
    A(Option<i32>),
}

fn main() {
    let wrap = Some(Foo::A(Some(42)));
    if let Some(inner) = wrap
        && let Foo::A(o) = inner
        && let Some(i) = o
        && i > 0
    {
        println!("Positive integer: {i}");
    }
}
```

### 函数参数

函数参数也是模式。

```rust
fn pair(&(x, y): &(i32, i32)) {
    println!("({}, {})", x, y);
}
```

> 闭包参数也能使用模式。

## 可反驳性

模式有两种形式：

- 可反驳的：可能会匹配会失败的模式，如 `match` 分支（除最后一个分支）、`if let`、`while let` 和 `let else` 表达式
- 不可反驳的：能匹配任意值的模式，如 `match` 分支（最后一个分支）、`let` 语句、`for` 循环和函数参数

```rust
// 错误
let Some(x) = value;
```

因为 `let` 语句只接受不可反驳的模式，而 `value` 还有可能为 `None`，因此可能会失败，但可加上 `if` 来构成 `if let` 这种可反驳的表达式。

```rust
if let Some(x) = value {
    println!("{x}");
}
```

若在不可反驳的地方需要有一个可反驳模式，可以使用 `let else`。与 `if let` 的区别为，`else` 块的返回值必须是 `!` 类型，如 `return` 或 `panic!` 表达式。

```rust
let Some(x) = value else {
    return;
};
```

## 匹配项的所有权

### 部分移动

对于没有实现 `Copy` 的类型值，在匹配时会获取所有权，从而发生移动。

```rust
let s = Some(String::from("foo"));
match s {
    Some(v) => println!("{v}"),
    None => println!("Nothing"),
}
println!("{:?}", s);    // 错误，s 中的值已经移动到 v
```

`Some(v)` 中的 `v` 会获取 `s` 中 `String` 的所有权，`s` 中的一部分被移动了，在之后就不能继续使用 `s` 的整体，但可使用没有被移动的部分，这称为**部分移动**。

在模式匹配时使用 `ref` 和 `ref mut` 获取不可变和可变引用。

```rust
fn update_inner(s: &mut Option<String>) {
    match s {
        Some(ref mut v) => v.push_str("bar"),
        None => (),
    }
}

fn print_inner(s: &Option<String>) {
    match s {
        Some(ref v) => println!("{}", v),
        None => println!("Nothing"),
    }
}

fn main() {
    let mut s = Some(String::from("foo"));
    update_inner(&mut s);
    print_inner(&s);
}
```

### & 和 ref

`ref` 和 `&` 都可在模式匹配中使用，主要区别在于用法和目的。前者用于在模式匹配中**创建一个引用**，而不是获得值的所有权，后者主要是为了**匹配引用**。因此 `ref` 不是模式的一部分，而 `&` 是模式的一部分。

```rust
let tup = (String::from("foo"), &1);
match tup {
    (ref x, &y) => println!("({x}, {y})"),
}
```

## 模式语法

### 匹配字面值

直接匹配字面值。

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

命名变量是匹配任意值的不可反驳模式。

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

第一个分支不匹配，第二个分支匹配任意值，并将该值绑定到 `y` 上，这相当于在这条分支中创建了一个局部变量，因此这里的 `y` 和 `match` 外面的 `y` 是不同的。

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

使用 `..` 或 `..=` 来匹配范围值。

```rust
let x = 5;

match x {
    1..=5 => println!("1 ~ 5"),
    ..30 => println!("~ 29"),
    30.. => println!("30 ~"),
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

fn main() {
    let p = Point { x: 0, y: 1 };
    let Point { x: a, y: b } = p;
    assert_eq!(0, a);
    assert_eq!(1, b);
}
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

fn main() {
    let msg = Message::ChangeColor(0, 160, 255);

    match msg {
        Message::Quit => todo!(),
        Message::Move { x, y } => todo!(),
        Message::Write(s) => todo!(),
        Message::ChangeColor(r, g, b) => todo!(),
    }
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

fn main() {
    let ip = IpAddr {
        kind: IpKind::Ipv4,
        value: String::from("127.0.0.1"),
    };

    match ip {
        IpAddr {
            kind: IpKind::Ipv4,
            value,
        } => todo!(),
        IpAddr {
            kind: IpKind::Ipv6,
            value,
        } => todo!(),
    }
}
```

解构结构体和元组的嵌套。

```rust
let ((a, b), Point { x, y }) = ((1, 2), Point { x: 3, y: 4 });
```

### 忽略模式值

有时并不需要使用全部匹配到的模式，可以使用 `_` 来进行忽略匹配到的值，**且不进行绑定**，或使用 `..` 忽略所剩部分的值。

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

let nums = (1, 2, 3, 4, 5);

// 忽略多个部分
match nums {
    (first, _, third, _, fifth) => todo!(),
    _ => todo!()
}

// 忽略中间值
match nums {
    (first, .., last) => todo!()
}

// 忽略尾部值
match nums {
    (first, ..) => todo!()
}
```

通过 `..` 来匹配时不能产生歧义。

```rust
let nums = (1, 2, 3, 4, 5);

match nums {
    // 错误，无法确定中间位置
    (.., mid, ..) => todo!()
}
```

### 匹配额外条件

**匹配额外条件**是一个指定于 `match` 分支模式之后的额外 `if` 条件，它也必须被满足才能匹配该分支。

```rust
let num = Some(5);

match num {
    Some(x) if x % 2 == 0 => todo!(),
    Some(x) => todo!(),
    None => todo!()
}
```

使用 `|` 来指定多个模式。

```rust
let x = 1;
let y = false;

match x {
    1 | 2 | 3 if y => todo!(),
    _ => todo!()
}
```

这里 `if` 的优先级是最低的，因此等同于 `(1 | 2 | 3) if y`。

### @ 绑定

`@` 运算符在模式匹配中用于绑定变量到模式。这可以在一个匹配分支中，同时访问整个值和部分值。

```rust
let value = Some(1);

match value {
    v @ Some(t) => {
        println!("value: {:?}", v);
        println!("inner value: {t}");
    }
    None => println!("None"),
}

if let a @ b @ Some(_) = value {
    println!("a: {a:?}, b: {b:?}");
}
```

这里 `v` 就相当于是 `value`，`t` 就相当于是 `Option<T>` 中的 `T`，`a`、`b` 两个也都相当于 `value`。由于值是 `Copy` 的，因此即使模式的命名变量会造成绑定，但是依然可以使用值，否则就需要使用 `ref`。
