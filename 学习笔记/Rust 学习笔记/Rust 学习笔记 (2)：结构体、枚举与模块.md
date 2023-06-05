# 1 结构体

## 定义并实例化结构体

和元组一样，结构体的每一部分可以是不同类型。但不同于元组，结构体需要命名各部分数据，因此结构体不需要依赖顺序来指定或访问实例中的值。

定义结构体，需使用 `struct` 关键字并为整个结构体提供一个名字，在大括号中定义每一部分数据的名字和类型，称为**字段**。

```rust
struct User {
    username: String,
    email: String,
    sign_in_count: u32,
    active: bool
}

let mut user1 = User {
    email: String::from("1@e.c"),
    username: String::from("1"),
    sign_in_count: 1,
    active: true
};

let user2 = User {
    username: String::from("2"),
    active: false,
    ..user1
};

user1.email = String::from("1.1@e.c");
println!("{}, {}", user1.active, user1.username);
println!("{}, {}", user2.sign_in_count, user2.email);
```

定义了结构体后，通过为每个字段指定具体值来创建这个结构体的实例。创建一个实例需要以结构体的名字开头，接着在大括号中使用 `key: value` 的形式提供字段，其中 `key` 是字段的名字，`value` 是需要存储在字段中的数据值。实例中字段的顺序不需要和在结构体中声明的顺序一致。

从结构体中获取某个特定的值，可以使用点号 `.`。若只想获取用户的邮箱地址，可以用 `user1.email`。要修改实例的某个字段，则整个实例必须是可变的，Rust 不允许只将某个字段标记为可变。要更改结构体中的值，若结构体的实例是可变的，可以使用点号并为对应的字段赋值。

使用旧实例的大部分值但改变其部分值来创建一个新的结构体实例可以通过**结构体更新语法**来实现。使用结构体更新语法，可以通过更少的代码来达到相同的效果。`..` 语法指定了剩余未显式设置值的字段应有与给定实例对应字段相同的值。**由于这些值来自其它实例中的字段，若其它实例中的这些字段不是 `Copy` trait，发生 `move` 时会导致此实例出现错误，或此实例先发生 `move` 会导致其它实例发生错误。**

---

同其他任何表达式一样，可以在函数体的最后一个表达式中构造一个结构体的新实例，来隐式地返回这个实例。

```rust
struct User {
    username: String,
    email: String,
    sign_in_count: u32,
    active: bool
}

fn main() {
    let user1 = build_user(String::from("1"), String::from("1@e.c"));
    println!("{}, {}", user1.username, user1.email);
}

fn build_user(username: String, email: String) -> User {
    User {
        username: username,
        email: email,
        sign_in_count: 1,
        active: true
    }
}
```

因为参数名与字段名都完全相同，可以使用**字段初始化简写语法**来重写 `build_user` 函数。

```rust
fn build_user(username: String, email: String) -> User {
    User {
        username,
        email,
        sign_in_count: 1,
        active: true
    }
}
```

若函数参数名与字段名不相同，则不能简写。

## 元组结构体

元组结构体是没有具体的字段名，只有字段的类型。当给整个元组取一个名字，并使元组成为与其他元组不同的类型时，可以使用元组结构体。

定义元组结构体，以 `struct` 关键字和结构体名开头并后跟元组中的类型。

```rust
struct RGBA(u8, u8, u8, u8);
struct IPADDR(u8, u8, u8, u8);
let color = RGBA(0, 255, 255, 0);
let ip = IPADDR(192, 168, 0, 1);
```

`color` 和 `ip` 值的类型不同，因为它们是不同的元组结构体的实例。定义的每一个结构体有其自己的类型，即使结构体中的字段有着相同的类型。一个获取 `RGBA` 类型参数的函数不能接受 `IPADDR` 作为参数，即便这两个类型都由四个 `u8` 值组成。元组结构体实例类似于元组：可以将其解构为单独的部分，也可以使用 `.` 后跟索引来访问单独的值。

一个没有任何字段的结构体被称为**类单元结构体**，常在某个类型上实现 trait 但不需要在类型中存储数据的时候使用。

```rust
struct Foo1;
struct Foo2();
struct Foo3{}
```

## 结构体数据的所有权

在 `User` 结构体的定义中，使用了自身拥有所有权的 `String` 类型而不是 `&str` 字符串 slice 类型。结构体拥有它所有的数据，因此只要整个结构体是有效的其数据也是有效的。

可以使结构体存储被其他对象拥有的数据的引用，不过这么做的话需要用上生命周期。它确保结构体引用的数据有效性跟结构体本身保持一致，若尝试在结构体中存储一个引用而不指定生命周期将是无效的。

```rust
struct User {
    username: &str,
    email: &str,
    sign_in_count: u32,
    active: bool
}

fn main() {
    let user1 = User {
        email: "1@e.c",
        username: "1",
        active: true,
        sign_in_count: 1
    };
}
```

编译器会报错，因为需要生命周期标识符：

```
username: &str,
          ^ expected `lifetime parameter`
error[E0106]: missing lifetime specifier
email: &str,
       ^ expected lifetime parameter
```

此外，由于结构体本身并不是属于标量类型，因此是没有实现 `Copy` trait 的。当不使用引用时，结构体变量的所有权会转移。

```rust
struct SomeStruct;

fn main() {
    let s = SomeStruct;
    let s1 = s;    // s 被移动到 s1
}
```

## 使用结构体

以下程序将计算长方形面积。

```rust
fn main() {
    let width = 2;
    let height = 3;
    println!("{}", area(width, height));
}

fn area(width: u32, height: u32) -> u32 {
    width * height
}
```

长度和宽度本应该是相关联的，但函数 `area` 却有两个参数，程序本身却没有表现出关联性。可以将长度和宽度通过元组组合在一起。

```rust
fn main() {
    let s = (2, 3);
    println!("{}", area(s));
}

fn area(wh: (u32, u32)) -> u32 {
    wh.0 * wh.1
}
```

元组增加了一些结构性，现在只需传一个参数。但元组并没有给出元素的名称，所以不得不使用索引来获取元组的每一部分，这样很容易混淆这些值而造成错误。通过结构体为数据命名来为其赋予意义，可以将元组转换成一个有整体名称而且每个部分也有对应名字的数据类型。

```rust
struct Rect {
    width: u32,
    height: u32
}

fn main() {
    let rect = Rect { width: 2, height: 3 };
    println!("{}", area(&rect));
}

fn area(rect: &Rect) -> u32 {
    rect.width * rect.height
}
```

函数 `area` 现在被定义为接收 `Rect` 类型的不可变借用的参数，这样 `main` 函数就可以保持 `rect` 的所有权并继续使用它。`area` 函数访问 `Rect` 实例的 `width` 和 `height` 字段。`area` 的函数签名表示使用 `Rect` 的 `width` 和 `height` 字段，这表明宽高是相互联系的，并为这些值提供了描述性的名称而不是使用元组的索引值 `0` 和 `1` 。

## 通过派生 trait 增加实用功能

若能要在调试程序时打印出 `Rect` 实例来查看其所有字段的值，正常方法使用 `println!` 宏是不行的。

```rust
println!("{}", rect);   // 错误
```

编译器会输出以下信息：

```
help: the trait `std::fmt::Display` is not implemented for `Rect`
note: in format strings you may be able to use `{:?}` (or `{:#?}` for pretty-print) instead
```

`println!` 宏能处理很多类型的格式，不过，`{}` 默认告诉 `println!` 使用被称为 `Display` 的格式：意在提供给直接终端用户查看的输出。大部分基本类型都默认实现了 `Display`，不过对于结构体，`println!` 并没有提供一个 `Display` 实现。

编译器输出需要使用 `{:?}` 或 `{:#?}`：

```rust
println!("{:?}", rect);
```

在 `{}` 中加入 `:?` 指示符告诉 `println!` 要使用叫做 `Debug` 的输出格式。`Debug` 是一个 trait，它允许以一种对开发者有帮助的方式打印结构体，以方便调试代码时能看到它的值。

但这样做编译器依然会报错：

```
help: the trait `std::fmt::Debug` is not implemented for `Rect`
note: add `#[derive(Debug)]` or manually implement `std::fmt::Debug`
```

Rust 确实包含了打印出调试信息的功能，不过必须为结构体显式选择这个功能，为此需要在结构体定义之前添加 `#[derive(Debug)]` 注解。

```rust
#[derive(Debug)]
struct Rect {
    width: u32,
    height: u32
}
```

这时程序会出现以下输出：

```
Rect { width: 2, height: 3 }
```

它显示这个实例的所有字段，但若有一个更大的结构体时，需要有更易读一点的输出格式，为此可以使用 `{:#?}`。

```rust
println!("{:#?}", rect);
```

现在的输出格式会变成这样：

```
Rect {
    width: 2,
    height: 3,
}
```

---

另一种使用 `Debug` 格式打印数值的方法是使用 `dbg!` 宏。`dbg!` 宏接收一个表达式的所有权，打印出代码中调用宏时所在的文件和行号，以及该表达式的结果值，并返回该值的所有权。

>   `dbg!` 宏会打印到 `stderr`，而 `println!` 会打印到 `stdout`。

```rust
let rect = Rect {
    width: dbg!(2),
    height: 3,
};
dbg!(&rect);
dbg!(area(&rect));
```

```
[src\main.rs:9] 2 = 2
[src\main.rs:12] &rect = Rect {
   width: 2,
   height: 3,
}
[src\main.rs:13] area(&rect) = 6
```

因为 `dbg!` 返回表达式值的所有权，所以 `width` 字段将获得相同的值。而 `dbg!` 不需要获得所有权，因此传递一个 `rect` 的引用。

## 方法语法

`area` 函数是非常特殊的，它只用于计算矩形面积。这个行为应该与 `Rect` 结构体再结合得更紧密一些，因为它不能用于其他类型。

方法与函数类似：使用 `fn` 关键字和名称声明，可以拥有参数和返回值，同时包含在某处调用该方法时会执行的代码。不过方法与函数不同的是，它在结构体（枚举、trait）的上下文中被定义，且第一个参数总是 `self`，它代表调用该方法的实例。

### 定义方法

```rust
struct Rect {
    width: u32,
    height: u32
}

impl Rect {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rect = Rect { width: 2, height: 3 };
    println!("{}", rect.area());
}
```

为了使函数定义于 `Rect` 的上下文中，定义了一个 `impl` 块。将计算面积的函数移动到 `impl` 中，并将签名中的第一个参数和函数体中其他地方的对应参数改成 `self`，然后在先前 `main` 中调用 `area` 函数并传递 `rect` 作为参数的地方，改成使用**方法语法**在 `Rect` 实例上调用 `area` 方法。方法语法获取一个实例并加上一个点号，后跟方法名、圆括号以及任何参数。

在 `area` 的签名中，使用 `&self` 来替代 `rect: &Rect`，因为该方法位于 `impl Rect` 上下文中，所以 Rust 知道 `self` 的类型是 `Rect`，但仍然需要在 `self` 前面加上 `&`。

`&self` 实际上是 `self: &Self` 的缩写。在一个 `impl` 块中，`Self` 类型是 `impl` 块的类型的别名。方法的第一个参数必须有一个名为 `self` 的`Self` 类型的参数，因此以下例子是等价的：

```rust
fn area(&self) {}
fn area(self: &Rect) {}
fn area(self: &Self) {}
```

>   只要第一个参数名为 self，就代表了实例本身。

---

方法可以选择获取 `self` 的所有权，不可变或可变地借用 `self`。选择 `&self` 的理由是并不获取其所有权，只需能够读取结构体中的数据，而不用写入。若想要在方法中修改调用方法的实例，需要将第一个参数改为 `&mut self`。

通过仅仅使用 `self` 作为第一个参数来使方法获取实例的所有权是很少见的，这种技术通常用在当方法将 `self` 转换成别的实例的时候，这时可以防止调用者在转换之后继续使用原始的实例。

使用方法替代函数，除了可使用方法语法和不需要在每个函数签名中重复 `self` 的类型之外，其主要好处在于组织性。将某个类型实例能做的所有事情都一起放入 `impl` 块中，而不是在库中到处寻找 `Rect` 的功能。

---

字段与方法的名字可以相同：

```rust
fn width(&self) -> u32 { self.width } 
```

编译器可以判断出其对应的功能，当使用 `object.width` 时，为使用字段，当使用 `object.width()` 是，为使用方法，这种一般用于获取字段的值，即有些语言中的 `get` 方法。

### 多个参数和 impl 块

方法可以拥有多个参数或者多个 `impl` 块，当有多个参数时，第一个参数必须是 `self`、`&mut self` 或 `self`。

```rust
#[derive(Debug)]
struct Point {
    x: u32,
    y: u32
}

impl Point {
    fn dot(&self, other: &Point) -> u32 {
        self.x * other.x + self.y * other.y
    }
}

impl Point {
    fn add(&self, other: &Point) -> Point {
        Point {
            x: self.x + other.x,
            y: self.y + other.y
        }
    }
}
```

不过若多个 `impl` 是同一个结构体的方法，可以合并到同一个 `impl` 块中。

```rust
impl Point {
    fn dot(&self, other: &Point) -> u32 {
        self.x * other.x + self.y * other.y
    }

    fn add(&self, other: &Point) -> Point {
        Point {
            x: self.x + other.x,
            y: self.y + other.y
        }
    }
}
```

### 自动引用和解引用

在 C / C++ 语言中，有两个不同的运算符来调用方法：`.` 直接在对象上调用方法，而 `->` 在一个对象的指针上调用方法，这时需要先解引用指针。比如 `object` 是一个指针，那么 `object->method()` 则等同于 `(*object).method()`。

Rust 并没有一个与 `->` 等效的运算符，但有**自动引用和解引用**。方法调用是 Rust 中少数几个拥有这种行为的地方。

当使用 `object.method()` 调用方法时，Rust 会自动为 `object` 添加 `&`、`&mut` 或 `*` 以使 `object` 与方法签名匹配。

```rust
let p1 = Point { x: 2, y: 3 };
let p2 = Point { x: 3, y: 4 };
println!("{}", p1.dot(&p2));
println!("{:#?}", (&p1).add(&p2));
```

两个 `println!` 宏中的 `p1`、`(&p1)` 实际上是等价的。这种自动引用的行为之所以有效，是因为方法明确的接收 `&self` 类型。在给出接收者和方法名的前提下，Rust 可以明确地计算出方法是 `&self`、`&mut self` 或 `self`。

### 关联函数

`impl` 块的另一个的功能是：允许在 `impl` 块中定义**不**以 `self` 作为参数的函数，这被称为**关联函数**，因为它与结构体相关联。关联函数仍是函数而不是方法，因为它**并不作用于一个结构体的实例， 而是作用于类型**，如 `String::from` 就是关联函数。关联还是可以看作是类型的方法而不是实例的方法，在有些语言中被称为**静态方法**。

关联函数经常被用作构造函数，以返回一个结构体新实例。

```rust
#[derive(Debug)]
struct Point {
    x: u32,
    y: u32
}

impl Point {
    fn dot(&self, other: &Point) -> u32 {
        self.x * other.x + self.y * other.y
    }
    
    fn new(x: u32, y: u32) -> Point {
        Point { x, y }
    }
}

fn main() {
    let p1 = Point::new(2, 3);
    let p2 = Point::new(3, 6);
    println!("{}", p1.dot(&p2));
    println!("{:#?}", (&p1).dot(&p2));
}
```

使用结构体名和 `::` 语法来调用这个关联函数。这个方法位于结构体的命名空间中，`::` 语法用于关联函数和模块创建的命名空间。

# 2 枚举和模式匹配

枚举允许通过列举可能的成员来定义一个类型。

## 定义枚举

目前被广泛使用的两个主要 IP 标准：IPv4 和 IPv6。程序可能会遇到的所有可能的 IP 地址类型：可以枚举出所有可能的值。enum 中的所有值都属于同一种类型，也就是 enum 的名称所表示的类型。

通过在代码中定义一个 `IpKind` 枚举来列出可能的 IP 地址类型，`V4` 和 `V6`，这被称为枚举的**成员**。

```rust
enum IpKind {
    V4,
    V6
}
```

枚举成员拥有隐式的从 0 开始的整数值，且可以通过 `as` 来进行类型转换，也可以显式指定值：

```rust
// 隐式值，从 0 开始
enum Num {
    Zero,
    One,
    Two
}

// 显式值
enum Color {
    Red = 0xff0000,
    Green = 0x00ff00,
    Blue = 0x0000ff
}

fn main() {
    println!("Zero is {}", Number::Zero as i32);
    println!("One is {}", Number::One as i32);

    println!("Roses are #{:06x}", Color::Red as i32);
    println!("Violets are #{:06x}", Color::Blue as i32);
}
```



### 枚举值

创建 `IpKind` 两个不同成员的实例。

```rust
let ipv4: IpKind = IpKind::V4;
let ipv6 = IpKind::V6;
```

枚举的成员位于其标识符的**命名空间**中，并使用两个冒号 `::` 分隔。

可以定义一个函数来获取任何 `IpKind`。

```rust
fn route(ip_type: IpKind) {}
```

然后使用成员调用该函数。

```rust
let ipv4 = IpKind::V4;
route(ipv4);
route(IpKind::V6);
```

还可以配合结构体来处理 IP 地址数据。

```rust
enum IpKind {
    V4,
    V6
}

struct IpAddr {
    kind: IpKind,
    address: String
}

let home = IpAddr {
    kind: IpKind::V4,
    address: String::from("127.0.0.1")
};

let loopback = IpAddr {
    kind: IpKind::V6,
    address: String::from("::1")
};
```

使用枚举并将数据直接放进每一个枚举成员而不是将枚举作为结构体的一部分。`IpAddr` 枚举的新定义表明了 `V4` 和 `V6` 成员都关联了 `String` 值。

```rust
enum IpKind {
    V4(String),
    V6(String)
}

let home = IpKind::V4(String::from("127.0.0.1"));
let loopback = IpKind::V6(String::from("::1"));
```

直接将数据附加到枚举的每个成员上，这样就不需要一个额外的结构体。

用枚举替代结构体还可以使每个成员可以处理不同类型和数量的数据。若想要将 `V4` 地址存储为四个 `u8` 值而 `V6` 地址仍然表现为一个 `String`，这样就不能使用结构体。

```rust
enum IpKind {
    V4(u8, u8, u8, u8),
    V6(String)
}

let home = IpKind::V4(127, 0, 0, 1);
let loopback = IpKind::V6(String::from("::1"));
```

可以将任意类型的数据放入枚举成员中：字符串、数字类型、结构体和枚举等。

枚举成员还可以为多种类型。

```rust
enum Message {
    Quit,
    Move { x: u32, y: u32 },
    Write(String),
    Color(u8, u8, u8)
}
```

这个枚举有四个含有不同类型的成员：

-   `Quit` 没有关联任何数据；
-   `Move` 包含一个匿名结构体；
-   `Write` 包含一个 `String；`
-   `Color` 包含三个 `u8`。

使用结构体也可以定义但不够简洁。

```rust
struct QuitMessage;                   // 类单元结构体
struct MoveMessage { x: u32, y: u32 }  
struct WriteMessage(String);          // 元组结构体
struct ColorMessage(u8, u8, u8);      // 元组结构体
```

枚举也可以像使用 `impl` 来为结构体定义方法那样，在枚举上定义方法或关联函数。

```rust
impl IpAddr {
	fn localhost_v4() -> IpAddr {
		IpAddr::V4(127, 0, 0, 1)
	}

	fn info(&self) {
		println!("{:?}", self);
	}
}

let ip = IpAddr::localhost_v4();
ip.info();
```

使用 `self` 来获取调用方法的值。

### Option 枚举

`Option` 是标准库定义的另一个枚举。

空值是一个值，它代表没有值。在有空值的语言中，变量总是这两种状态之一：空值和非空值。空值的问题在于当尝试像非空值那样使用空值，会出现某种形式的错误。

**Rust 没有空值**，不过它拥有一个可以编码存在或不存在概念的枚举。这个枚举是 `Option<T>`，它定义于标准库中。

```rust
enum Option<T> {
    Some(T),
    None
}
```

`Option<T>` 枚举是被包含在了 **prelude** 之中，不需要将其显式引入作用域。它的成员也不需要 `Option::` 前缀，可直接使用 `Some` 和 `None`。

`<T>` 语法是代表它是一个泛型类型参数，意味着 `Option` 枚举的 `Some` 成员可以包含任意类型的数据。

```rust
let some_number = Some(5);
let some_string = Some("a string");
let absent_number: Option<i32> = None;
```

若使用 `None` 而不是 `Some`，需要告诉 Rust `Option<T>` 是什么类型的，因为编译器只通过 `None` 值无法推断出 `Some` 成员保存的值的类型。

当有一个 `Some` 值时，就知道存在一个值，而这个值保存在 `Some` 中。当有个 `None` 值时，它跟空值具有类似的含义。

---

因为 `Option<T>` 和 `T` 是不同的类型，编译器不允许像一个肯定有效的值那样使用 `Option<T>`。如这段代码不能编译，因为它尝试将 `Option<i8>` 与 `i8` 相加：

```rust
let x: i8 = 5;
let y: Option<i8> = Some(5);
let sum = x + y;    // 错误
```

Rust 不知道该如何将 `Option<i8>` 与 `i8` 相加，因为它们的类型不同。当在 Rust 中拥有一个像 `i8` 这样类型的值时，编译器确保它总是有一个有效的值，可以直接使用而无需做空值检查。只有当使用 `Option<i8>`（或者任何用到的类型）的时候需要担心可能没有值，而编译器会确保我们在使用值之前处理了为空的情况。

在对 `Option<T>` 进行 `T` 的运算之前必须将其转换为 `T`，因此哪怕类型相同，`Option<T>` 之间也是不能直接运算。

```rust
Some(1) + Some(2);  // 错误
```

通常这能捕获到空值最常见的问题之一：假设某值不为空但实际上为空的情况。Rust 通过限制空值的泛滥以增强 Rust 代码的安全性。

## match 控制流运算符

`match` 为 Rust 中极为强大的控制流运算符，它允许将一个值与一系列的模式相比较并根据相匹配的模式执行相应代码。模式可由字面值、变量、通配符和许多其他内容构成。Rust 确保所有可能的情况都能得到处理。

```rust
enum Size {
   S,
   M,
   L,
   X
}

fn size_value(size: Size) -> u32 {
    match size {
        Size::S => 1,
        Size::M => 2,
        Size::L => 3,
        Size::X => {
            println!("X!");
            4
        }
    }
}
```

`match` 关键字后跟一个表达式，在这里是 `size` 的值。和 `if` 的区别是：`if` 表达式必须为布尔值，而 `match` 可以是任意类型。

接下来是 `match` 的分支。一个分支有两个部分：**模式**和**代码**。第一个分支的模式是值 `Size::S` 而之后的 `=>` 运算符将模式和将要运行的代码分开。每一个分支之间使用逗号分隔。

可以拥有任意多的分支，当 `match` 表达式执行时，它将结果值按顺序与每一个分支的模式相比较。若模式匹配了这个值，这个模式相关联的代码将被执行，并结束匹配；若模式并不匹配这个值，将继续执行下一个分支。

每个分支相关联的代码是一个表达式，而表达式的结果将作为整个 `match` 表达式的返回值，每个分支返回值类型都必须相同。

分支代码较短的话通常不使用大括号。若想要在分支中运行多行代码，可以使用大括号，大括号内最后一个表达式的值作为这条分支的值。

### 绑定值的模式

匹配分支的还可以绑定匹配的模式的部分值。

```rust
enum Size {
   S,
   M,
   L,
   X(Special)
}

enum Special {
    X,
    XL,
    XXL,
    XXXL
}

fn size_value(size: Size) -> u32 {
    match size {
        Size::S => 1,
        Size::M => 2,
        Size::L => 3,
        Size::X(state) => {
            match state {
                Special::X => 4,
                Special::XL => 5,
                Special::XXL => 6,
                Special::XXXL => 7
            }
        }
    }
}
```

在这些匹配表达式中，匹配 `Size:X` 成员的分支的模式中增加了一个叫做 `state` 的变量。当匹配到此分支时，继续通过 `match` 来匹配 `state` 的值，`state` 最终将绑定到 `Special` 枚举中的某个成员所对应的值。

### 匹配的所有权

如下代码不能通过编译：

```rust
let s = Some(String::from("hello"));
match s {
    Some(v) => println!("{}", v),
    None => println!("Nohing"),
}
// 错误，s 中的值已经移动到 v
println!("{:?}", s);
```

由于在进行匹配时，`Some(v)` 中的 `v` 会获得 `s` 中 `String` 的所有权，`s` 中的一部分被移动了，因此在之后 `s` 就不能继续使用整体，要在后续也能够使用，需要在匹配时获取一个引用，或者只使用没有被移动的部分。

#### 部分移动

可以移动一个变量的一部分，称为**部分移动**，这表示变量的某些部分将被移动，而其他部分将保留。在这种情况下，之后的代码不能使用变量的整体，但可以使用没有移动的部分。

通过 `ref` 关键字可以获得解构后的引用而不获取所有权：

```rust
struct Person {
    first_name: String,
    last_name: String,
}

let p = Person {
    fname: String::from("AAA"),
    lname: String::from("BBB"),
};

let Person {
    ref fname,  // 解构成一个引用
    lname,
} = p;

println!("{}", p.first_name);  // 正确
println!("{}", p.last_name);   // 错误
```

类似的使用 `ref mut` 获得一个可变引用：

```rust
let mut s = Some(5);
match s {
    Some(ref mut v) => *v += 1,
    _ => (),
}
println!("{:?}", s);
```

`ref` 通常用在要匹配的对象没有所有权的时候：

```rust
fn main() {
    let s = Some(String::from("hi"));
    print_s(&s);
}

fn print_s(s: &Option<String>) {
    match *s {
        Some(ref v) => println!("{}", v),
        None => println!("Nothing"),
    }
}
```

`print_s` 函数接收一个引用 `&T`，因此并没有这个参数的所有权，当对其进行解引用后，匹配中的类型变为 `T`，但不能对引用的对象获得所有权，因此必须对 `v` 使用 `ref` 修饰，否则无法通过编译。

>   `ref` 和 `&` 都在模式匹配中使用，但是前者不是模式的一部分，而后者是模式的一部分。`ref` 仅表示获得值的一个引用，而不获取所有权。

### 匹配 Option\<T\>

可以像处理枚举那样使用 `match` 处理 `Option<T>`。

```rust
fn main() {
    let x = plus_one(Some(5));
    let y = plus_one(None);
    println!("{:?}", x);
    println!("{:?}", y);
}

fn plus_one(x: Option<u32>) -> Option<u32> {
    match x {
        Some(i) => Some(i + 1),
        None => None
    }
}
```

该函数获取一个 `Option<u32>`，若其中有值，则加 1；若其中没有值，则返回 `None`。

### 匹配是穷尽的

```rust
match x {
    Some(i) => Some(i + 1)    // 错误
}
```

由于没有处理 `None` 的情况，所以不能通过编译。

Rust 中的**匹配是穷尽的**：必须穷举到最后的可能性来使代码有效。特别在使用 `Option<T>` 时，为了防止忘记明确的处理 `None` 的情况，这样可以避免使用实际上为空的值。

### 通配符

Rust 提供了一个模式用于不想列举出所有可能值的场景：使用 `_` 通配符。

```rust
let x = Some(1);
match x {
    Some(i) => Some(i + 1),
    _ => None
};
```

`_` 模式会匹配所有没有指定的可能的值，通常将其放置于其他分支之后。

```rust
let x = 1;
match x {
    1 => println!("one"),
    _ => ()
};
```

`()` 是单元值，所以 `_` 的情况什么也不会发生。

## if let 控制流

若只匹配一种情况，为了满足 `match` 表达式穷尽性的要求，必须在处理完这唯一的成员后使用 `_` 通配符。

`if let` 语法用来处理只匹配一个模式的值而忽略其他模式的情况。

```rust
let x = Some(1);
if let Some(3) = x {
    println!("{:?}", x);
}
else {
    println!("Others");
};
```

`if let` 获取通过 `=` 分隔的一个模式和一个表达式。它的工作方式与 `match` 相同，这里的表达式对应 `match` 而模式则对应第一个分支。使用 `if let` 可以编写更少的代码，但会失去 `match` 强制要求的穷尽性检查。

还可以在 `if let` 中包含一个 `else`，`else` 块中的代码与 `match` 表达式中的 `_` 分支块中的代码相同，这样的 `match` 表达式就等同于 `if let` 和 `else`。

由于 `if let` 本身也是一个表达式，因此可以返回值。当作为返回值使用时，必须保证隐含的 `else` 和返回的类型是相同的，或者显示指定 `else` 的返回值，某则默认的返回值为 `()`。

```rust
let x = Some(5);
let y = if let Some(i) = x {
    Some(i + 1)
} else {
    None
};
```

# 3 模块与 Crates

Rust 有一系列与**作用域**相关的功能，被称为**模块系统**：

-   **包**是 Cargo 的一个功能，允许构建、测试和分享 Crates；
-   **Crates** 是一个模块的树形结构：
    -   Crate 是一个二进制或库项目；
    -   Crate **根**是一个用来描述如何构建 Crate 的文件；
    -   带有 *Cargo.toml* 文件的包用来描述如何构建这些 Crates。

-   **模块**和 `use` 关键字允许控制作用域和路径的私有性；
-   **路径**是一个命名如结构体、函数或模块等项的方式。

## 包和 Crate

当运行 `cargo new` 时是在创建一个二进制 crate，因为默认使用 `--bin`，显示指定 `--lib` 则创建一个库 crate。一个 crate 会将一个作用域内的相关功能分组到一起，使得该功能可以很方便地在多个项目之间共享。

```bash
# 创建二进制 crate，默认
cargo new package_name --bin
# 创建库 crate
cargo new package_name --lib
```

Cargo 创建了 *Cargo.toml*，意味着创建了一个包，其中的内容并没有提到 *src/main.rs*，但 Cargo 约定若在 *Cargo.toml* 的同级目录下包含 *src* 目录且其中包含 *main.rs* 文件的话，则是一个与包同名的二进制 crate，且 *src/main.rs* 就是 crate 的根。另一个约定若包目录中包含 *src/lib.rs*，则是一个与包同名的库 crate，且 *src/lib.rs* 是 crate 根。crate 根文件将由 Cargo 传递给 `rustc` 来构建二进制或库项目。

一个包中必须带有至少一个二进制或库 crate，但库 crate 至多只能有一个。若包同时包含 *src/main.rs* 和 *src/lib.rs*，那么它带有两个与包同名的 crate：一个二进制和一个库 crate。若只有其中之一，则包将只有一个二进制或库 crate。

若包带有多个二进制 crate，需将其置于 *src/bin* 目录下，其中的每个文件都是一个单独的二进制 crate，此时可以不再需要 main.rs，因为 *bin* 中每一个文件都需要包含一个 `main` 函数，都会被编译成与文件名相同的可执行文件，但若在 *src* 下还存在 `main.rs` 的话，即使不在 *bin* 中，也会被当作二进制 crate，编译成与 crate 名相同的可执行文件。

```
# 包含 4 个二进制 crate 和 1 个库 crate
src
├── bin        
│   ├── foo1.rs (binary crate)
│   ├── foo2.rs (binary crate)
│   └── foo3.rs (binary crate)
├── lib.rs  (library crate)   
└── main.rs (binary crate)
```

---

当使用 `cargo build` 时，会默认编译包含库 crate 在内的所有 crate，如果想单独编译 *src/bin* 中的二进制 crate，可以使用 `--bin` 参数，并指定要编译的二进制 crate。

```bash
cargo build --bin foo1
```

不能使用 `cargo build --bin main.rs` 来单独编译 *src/main.rs*，因为它代表整个包，因此需要使用包名来替代。

```bash
cargo build --bin package_name
```

这样就不会编译 *src/bin* 下的二进制 crate。

---

库 crate 也可以被单独编译，cargo 默认会使用 crate 名，并加上 `lib` 前缀，rustc 则使用文件名并加上前缀。

```bash
# 使用 rustc，编译成 libfoo.rlib
rustc --crate-type=lib foo.rs
# 使用 cargo，只编译库 crate
cargo build --lib
```

## 模块

模块可以将一个 crate 中的代码进行分组，以提高可读性与重用性：

-   组织代码和控制路径私有性；
-   使用路径来命名项；
-   `use` 关键字用来将路径引入作用域；
-   `pub` 关键字使项变为公有；
-   `as` 关键字用于将项引入作用域时进行重命名；
-   使用外部包；
-   嵌套路径用来消除大量的 `use` 语句；
-   使用 `glob` 运算符将模块的所有内容引入作用域；
-   将不同模块分割进单独的文件中。

利用模块来组织代码：

```rust
mod sound {
    fn guitar() {}
}

fn main() {}
```

这里定义了两个函数，`guitar` 和 `main`。`guitar` 函数定义于 `mod` 块中，这个块定义了 `sound` 模块。

为了将代码组织到模块层次体系中，可以将模块嵌套进其他模块。

```rust
mod sound {
    mod instrument {
        mod woodind {
            fn clarinet {}
        }
    }
    
    mod voice {}
}
```

*src/main.rs* 和 *src/lib.rs* 被称为 crate 根是因为这两个文件在 crate 模块树的根组成了名为 `crate` 模块。

```text
crate
└── sound
    ├── instrument
    │   └── woodwind
    └── voice
```

整个模块树都位于名为 `crate` 这个**隐式模块**的根下。

### 区别 Crate 和模块

如果 `some_file.rs` 含有 `mod` 声明，那么模块的内容将在编译之前被插入到相应声明处，因此 **crate 是最小编译单元**，而模块不能被单独编译，是包含在 crate 之下的。

## 路径

路径用来引用模块树中的项。若要调用函数，需要知道其**路径**。

路径可以有两种形式：

-   **绝对路径**从 crate 根开始，以 crate 名或字面值 `crate` 开头。
-   **相对路径**从当前模块开始，以 `self`、`super` 或当前模块名开头。

绝对路径和相对路径都后跟一个或多个由双冒号 `::` 分隔的标识符。

在 `main` 函数中调用 `clarinet` 函数。

```rust
mod sound {
    mod instrument {
        fn clarinet() {}
    }
}

fn main() {
    crate::sound::instrument::clarinet();   // 绝对路径
	sound::instrument::clarinet();          // 相对路径
}
```

因为 `clarinet` 与 `main` 定义于同一 crate 中，通过 `crate` 关键字来以绝对路径的方式来调用函数。由于 `sound` 是与 `main` 函数相同模块树级别的模块，也可以通过使用其名称来以相对路径的方式来调用函数。

### 私有性边界

上面这个程序不能编译，因为 `instrument` 模块是私有的。

模块是 Rust 中的**私有性边界**。若期望函数或结构体是私有的，可以将其放入模块。

私有性规则有如下：

-   所有项（函数、方法、结构体、枚举、模块和常量）默认是私有的；
-   可以使用 `pub` 关键字使项变为公有；
-   不允许使用定义于当前模块的子模块中的私有代码；
-   允许使用任何定义于父模块或当前模块中的代码。

对于没有 `pub` 关键字的项，从当前模块向下看时是私有的，向上看时是公有的。

### pub 关键字

使用 `pub` 关键字使得项变为公有。

```rust
mod sound {
    pub mod instrument {
        fn clarinet() {}
    }
}

fn main() {
    crate::sound::instrument::clarinet();   // 绝对路径
	sound::instrument::clarinet();          // 相对路径
}
```

`instrument` 的内容仍然是私有的，使模块公有并不使其内容也是公有的。模块上的 `pub` 关键字允许其父模块 `sound` 引用它。

这个程序依然不能编译，因为 `clarinet` 函数是私有的，需在 `clarinet` 函数前增加 `pub` 关键字使其变为公有。

```rust
mod sound {
    pub mod instrument {
        pub fn clarinet() {}
    }
}
```

在绝对路径的情况下，从 crate 根开始，有一个定义于 crate 根中的 `sound` 模块，`sound` 模块不是公有的，不过因为 `main` 函数与 `sound` 定义于同一模块中，可以从 `main` 中引用 `sound`。接下来是 `instrument`，这个模块标记为 `pub`，所以可以访问 `instrument`。最后，`clarinet` 函数被标记为 `pub` 所以可以调用该函数。

在相对路径的情况下，其逻辑与绝对路径相同。不同于从 crate 根开始，路径从 `sound` 开始。`sound` 模块与 `main` 定义于同一模块，所以从 `main` 所在模块开始定义的路径是有效的。接下来因为 `instrument` 和 `clarinet` 被标记为 `pub`，路径其余的部分也是有效的，因此函数调用也是有效的。

### super 关键字

使用 `super` 关键字来构建相对路径：该路径从**父**模块而不是从当前模块开始。

```rust
mod instrument {
    fn clarinet() {
        super::breathe_in();
    }
}

fn breathe_in() {}
```

`clarinet` 函数位于 `instrument` 模块中，所以可以使用 `super` 进入 `instrument` 的父模块，也就是根 `crate`，而 `breathe_in` 在这一层级中。

使用 `super` 开头的相对路径能够更容易修改有着不同模块层级结构的代码。如将 `instrument` 模块和 `breathe_in` 函数放入 `sound` 模块中，这时只需增加 `sound` 模块即可。

```rust
mod sound {
    mod instrument {
        fn clarinet() {
            super::breathe_in();
        }
    }

    fn breathe_in() {}
}
```

使用相对路径在重新布局模块时可能只需少量的修改。

### 对结构体和枚举使用 pub

在模块中对结构体定义中使用 `pub`，可以使其变为公有，然而其字段仍是私有的。可以在每一个字段的基准上选择其是否公有。

```rust
mod info {
    pub struct User {
        pub name: String,
        id: u32
    }

    impl User {
        pub fn new(name: &str) -> User {
            User {
                name: String::from(name),
                id: 1
            }
        }
    }
}

fn main() {
    let mut u = info::User::new("root");
    u.name = String::from("admin");
    println!("{}", u.name);
    println!("{}", u.id);    // 错误
}
```

因为 `info::User` 结构体的 `name` 字段是公有的，在 `main` 中可以使用点号读写 `name` 字段，但不允许在 `main` 中使用 `id` 字段，因为其是私有的。因为 `info::User` 中有私有字段，需要提供一个公有的关联函数来构建 `User` 实例。若没有提供这一函数，就不能在 `main` 中创建 `User` 实例，因为在 `main` 中不允许设置私有字段 `id` 的值。

相反，若有一个公有枚举，则其所有成员都是公有，只需在 `enum` 关键词前加上 `pub`。

```rust
mod menu {
    pub enum Appetizer {
        Soup,
        Salad
    }
}

fn main() {
    let order1 = menu::Appetizer::Soup;
    let order2 = menu::Appetizer::Salad;
}
```

因为 `Appetizer` 枚举是公有的，可以在 `main` 中使用 `Soup` 和 `Salad` 成员。

### use 关键字

使用绝对路径或相对路径是冗长和重复的，可以使用 `use` 关键字一次性将路径引入作用域。

```rust
mod sound {
    pub mod instrument {
        pub fn clarinet() {}
    }
}

use crate::sound::instrument;

fn main() {
    instrument::clarinet();
}
```

在作用域中增加 `use` 和绝对路径类似于在文件系统中创建软连接，通过 `use` 引入作用域的路径也会检查私有性。

通过 `use` 和相对路径来将项引入作用域：

```rust
mod sound {
    pub mod instrument {
        pub fn clarinet() {}
    }
}

use self::sound::instrument;

fn main() {
    instrument::clarinet();
}
```

若调用项目的代码移动到模块树的不同位置但是定义项目的代码却没有，那么使用 `use` 指定绝对路径可以使更新更轻松。

```rust
mod sound {
    pub mod instrument {
        pub fn clarinet() {}
    }
}

mod performance_group {
    use crate::sound::instrument;

    pub fn clarinet_trio() {
        instrument::clarinet();
    }
}

fn main() {
    performance_group::clarinet_trio();
}
```

相反，若对指定了相对路径的代码做同样的修改，则需要将 `use self::sound::instrument` 变为 `use super::sound::instrument`。

###  use 路径使用习惯

对于函数，倾向于通过 `use` 指定函数的父模块接着指定父模块来调用方法：

```rust
use crate::sound::instrument;

fn main() {
    instrument::clarinet();
}
```

而不是直接使用方法：

```rust
use crate::sound::instrument::clarinet;

fn main() {
    clarinet();
}
```

这样会清楚的表明了函数不是本地定义的，同时仍最小化了指定全路径时的重复。

---

对于结构体、枚举和其它项，倾向于通过 `use` 指定项的全路径：

```rust
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert(1, 2);
}
```

在使用全路径这种指定方式时，若 `use` 语句将两个同名的项引入作用域时，将会发生错误：

```rust
use std::fmt;
use std::io;

fn function1() -> fmt::Result {}
fn function2() -> io::Result<()> {}
```

若直接指定 `use std::fmt::Result` 和 `use std::io::Result`，则作用域中会有两个 `Result` 类型，Rust 无法判断使用的是哪个 `Result`。

### as 关键字

将两个同名类型引入同一作用域时，可以通过在 `use` 后加上 `as` 来重命名引入作用域的类型。

```rust
use std::fmt::Result;
use std::io::Result as IoResult;

fn function1() -> Result {}
fn function2() -> IoResult<()> {}
```

### 使用 pub use 重导出

当使用 `use` 关键字将名称导入作用域时，在新作用域中可用的名称是私有的。通过**重导出**，即结合 `pub` 和 `use`，将项引入作用域并同时使其可供其它代码引入自己的作用域。

```rust
mod sound {
    pub mod instrument {
        pub fn clarinet() {}
    }
}

mod performance_group {
    pub use crate::sound::instrument;

    pub fn clarinet_trio() {
        instrument::clarinet();
    }
}

fn main() {
    performance_group::clarinet_trio();
    performance_group::instrument::clarinet();
}
```

通过 `pub use`，`main` 函数可以通过新路径 `performance_group::instrument::clarinet` 来调用 `clarinet` 函数。若没有指定 `pub use`，`clarinet_trio` 函数可以在其作用域中调用 `instrument::clarinet`，但 `main` 则不允许使用这个新路径。

### 嵌套路径

当需要引入很多定义于相同包或相同模块的项时，为每一项单独列出一行会占用很大的空间。

```rust
use std::cmp::Ordering;
use std::io;
```

使用嵌套路径将同样的项在一行中引入。

```rust
use std::{cmp::Ordering, io};
```

对于一个完全包含在另一个路径中的路径。

```rust
use std::io;
use std::io::Write;
```

两个路径的相同部分是 `std::io`。为了在一行 `use` 语句中引入这两个路径，可以在嵌套路径中使用 `self`。

```rust
use std::io::{self, Write};
```

### glob 运算符

将一个路径下所有公有项引入作用域，可以在指定路径后跟 glob 运算符 `*`。

```rust
use std::collections::*;
```

此语句将 `std::collections` 中定义的所有公有项引入当前作用域。

## 使用 Crate

### 库 Crate

可以在一个包中同时包含二进制 crate 和库 crate，如一个名为 `mypkg` 包，其中包含了 *main.rs* 和 *lib.rs*，那么这两个的 crate 名都与包名相同，但要在 main.rs 中使用库的内容，需要使用 use 关键字导入，或在路径中包含 crate 名。

**文件：lib.rs**

```rust
pub fn foo() {}
```

**文件：main.rs**

```rust
use mypkg::foo；

fn main() {
    foo();
    mypkg::foo();
}
```

### 外部 Crate

[Crates.io](https://crates.io/) 上有很多社区成员发布的 crate，将其引入自己的项目涉及到相同的步骤：在 *Cargo.toml* 列出并通过 `use` 将其中定义的项引入包的作用域中。

标准库 `std` 对于自己的包来说也是外部 crate，但因为标准库随 Rust 语言一同分发，无需修改 *Cargo.toml* 来引入 `std`，不过需要通过 `use` 将标准库中定义的项引入项目包的作用域中来引用它们，如 `HashMap`。

```rust
use std::collections::HashMap;
```

## 分割模块

可以在一个文件中定义多个模块，但当模块变得更大时，将它们的定义移动到一个单独的文件中使代码更容易阅读。

有两种分割的方式，一种是创建与模块同名的文件来管理，另一种是创建与模块同名的文件夹，并在其中创建 *mod.rs* 来管理。

### 使用同名文件

将 `sound` 模块移动到单独的文件 *src/sound.rs* 中，在 `mod sound` 后使用分号来告诉 Rust 在另一个与模块同名的文件中加载模块的内容。

**文件：src/main.rs**

```rust
mod sound;

fn main() {
    crate::sound::instrument::clarinet();   // 绝对路径
	sound::instrument::clarinet();          // 相对路径
}
```

**文件：src/sound.rs**

```rust
pub mod instrument {
    pub fn clarinet() {}
}
```

---

继续将 `instrument` 模块也提取到其自己的文件中，修改 *src/sound.rs* 只包含 `instrument` 模块的声明。

**文件：src/sound.rs**

```rust
pub mod instrument;
```

接着创建 *src/sound* 目录和 *src/sound/instrument.rs* 文件来包含 `instrument` 模块的定义。

**文件：src/sound/instrument.rs**

```rust
pub fn clarinet() {}
```

此时的文件树为：

```
src
├── main.rs
├── sound
│   └── instrument.rs
└── sound.rs
```

模块树依然保持相同，`main` 中的函数调用也无需修改继续保持有效，即使其定义存在于不同的文件中。这样随着代码增长可以将模块移动到新文件中。

### 使用 mod.rs

通过在每个模块的文件夹下单独创建一个 *mod.rs* 来管理一个模块。

还是同样的方法，在 *src/main.rs* 中只包含 `sound`模块的声明，但不再创建 *src/sound.rs*，而是创建 *sound* 文件夹，并在其中创建 *mod.rs*。

**文件：src/sound/mod.rs**

```rust
pub mod instrument {
    pub fn clarinet() {}
}
```

---

同样再把 `instrument` 模块提取出来，此时可以跟之前一样创建 `src/sound/instrument.rs`，还可以创建 *src/sound/instrument/mod.rs*。

**文件：src/sound/mod.rs**

```rust
pub mod instrument;
```

**文件：src/sound/instrument/mod.rs**

```rust
pub fn clarinet() {}
```

此时的文件树为：

```
src
├── main.rs
└── sound
    ├── instrument
    │   └── mod.rs
    └── mod.rs
```

---

以上两种方式都能够分割模块，但使用 *mod.rs* 可以更好的管理，因为可以直接描述模块的整体并设置公有性，且在大项目上更加层次分明。
