# 1 模式匹配

**模式**是 Rust 中特殊的语法，用来匹配类型中的结构，由以下内容组成：

-   字面值、命名变量
-   解构元组、数组、结构体、枚举和联合体
-   通配符、占位符

## 使用模式的位置

### let

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

### for

在 `for` 循环中使用模式来解构元组：

```rust
let v = vec!['a', 'b', 'c'];

for (index, value) in v.iter().enumerate() {
    println!("{} is at index {}", value, index);
}
```

这里使用 `enumerate` 方法适配一个迭代器，返回一个包含当前元素的索引和值的元组。

### match

`match` 允许将一个值与一系列的模式比较并根据匹配的模式执行相应代码。

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

`match` 表达式必须是**穷尽**的，且每个分支的返回值类型都必须相同。

### if let

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

### ref 模式

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

`ref` 通过引用来匹配，而不是根据值并获取所有权。

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
let t = 1;
let v = t;
let v = &v;
```

---

通过在 `ref` 后加 `mut` 关键字，可以获得一个可变引用。

```rust
let ref mut v = t;

// 相当于
let v = t;
let v = &mut v;
```

---

同时 `ref` 还可用于部分移动。对于没有实现 `Copy` trait 的类型，在传递时会发生移动。若是一个结构体通过模式匹配来将字段值付给其它的变量，那么这个结构体就不能在后面作为一个整体来使用。

```rust 
#[derive(Debug)]
struct User {
    id: usize,
    name: String,
}

let user = User {
    id: 1,
    name: String::from("Alice"),
};

let User { id, ref name }= user;
println!("{id}, {name}");
println!("{:?}", user);
```

这里通过 `ref` 来仅获得一个引用，因此在后面还可以使用 `user`。

# 2 高级特性

## 高级 trait

### 关联类型

**关联类型**是一个将类型占位符与 trait 相关联的方式，这样 trait 的方法签名中就可以使用这些占位符类型。trait 的实现会指定相应的具体类型，这样就可定义一个使用多种类型的 trait。

如标准库中的 `Iterator` trait，含有一个 `Item` 的关联类型来替代遍历的值的类型。

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}
```

`Item` 是一个占位符类型，同时 `next` 方法定义表明它返回 `Option<Self::Item>` 类型的值。这个 trait 的实现会指定 `Item` 的具体类型。

关联类型和泛型很类似，但还是有一些区别，下面为 `Counter` 实现 `Iterator` trait：

```rust
struct Counter {
    count: u32
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        todo!()
    }
}
```

若用泛型来实现，假设 `Iterator` trait 是由泛型定义的：

```rust
pub trait Iterator<T> {
    fn next(&mut self) -> Option<T>;
}
```

那么为 `Counter` 就应该这样实现：

```rust
impl Iterator<u32> for Counter {
    fn next(&mut self) -> Option<u32> {
        todo!()
    }
}
```

当 trait 有泛型参数时，就可以通过改变泛型参数的具体类型来多次实现这个 trait，因为 `Counter` 还可以是其他类型。

```rust
// 其它实现
impl Iterator<u64> for Counter {
    fn next(&mut self) -> Option<u64> {
        todo!()
    }
}

impl Iterator<i64> for Counter {
    fn next(&mut self) -> Option<i64> {
        todo!()
    }
}
```

若使用泛型的方式，那么当使用 `Counter` 的 `next` 方法时，必须提供类型注解来表明希望使用 `Iterator` 的哪一个实现。

```rust
let mut counter = Counter { count: 0 };

// 错误
counter.next();

// 正确
<Counter as Iterator<i64>>::next(&mut counter);
```

而通过关联类型，则无需标注类型，因为不能多次实现这个 trait，其实现必须提供一个类型来替代关联类型占位符。

### 默认泛型类型参数和运算符重载

当使用泛型类型参数时，可以指定一个默认的具体类型。若默认类型就足够的话，就无需为具体类型实现 trait。在声明泛型类型时通过使用 `<PlaceholderType = ConcreteType>` 语法为泛型类型指定默认类型。

默认泛型类型参数多用于运算符重载，Rust 并不允许创建自定义运算符或重载任意运算符，但可以通过实现 `std::ops` 中的 trait 来进行运算符重载。

如在 `Point` 结构体上实现 `Add` trait 来重载 `+` 运算符：

```rust
use std::ops::Add;

#[derive(Debug, Copy, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

impl Add for Point {
    type Output = Self;

    fn add(self, other: Point) -> Self {
        Self {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

fn main() {
    assert_eq!(
        Point { x: 1, y: 0 } + Point { x: 2, y: 3 },
        Point { x: 3, y: 3 }
    );
}
```

这里默认泛型类型位于 `Add` trait 中，其定义为：

```rust
pub trait Add<Rhs = Self> {
    type Output;

    fn add(self, rhs: Rhs) -> Self::Output;
}
```

这是一个带有关联类型和方法的 trait，尖括号中的 `Rhs = Self` 为**默认类型参数**，用于定义 `add` 方法中的 `rhs` 参数。当实现 `Add` trait 时不指定 `Rhs` 的具体类型，`Rhs` 的类型将是默认的 `Self` 类型，也就是在其上实现 `Add` 的类型。

`Rhs` 和 `Output` 的关系为，`self` 是可以和很多类型相加的，但是对于给定的两个类型，应该输出同样的类型，即对于类型为 `T` 的 `self`，当和类型 `S` 相加，其 `Output` 的类型也是固定的。

`Add` trait 的定义或许还能是这样的：

```rust
pub trait Add {
    type Output;

    fn add<Rhs>(self, rhs: Rhs) -> Self::Output;
}
```

但这是不行的，虽然不能给函数级别的泛型参数也设置默认值，但这并不是不能的原因，主要还是因为若是定义在函数级别上，那么在重载 `+` 运算符时，就无法得到有关 `Rhs` 结构的信息，因此无法以这种方式实现任何合理的加法函数。

---

若实现 `Add` trait 时要自定义 `Rhs` 类型而不是使用默认类型，如实现一个能够将毫米与米相加，且 `Add` trait 的实现能正确处理转换，可以为 `Millis` 实现 `Add` trait 并以 `Meters` 作为 `Rhs`。

```rust
use std::ops::Add;

struct Millis(u32);
struct Meters(u32);

impl Add<Meters> for Millis {
    type Output = Millis;

    fn add(self, other: Meters) -> Self::Output {
        Millis(self.0 + (other.0 * 1000))
    }
}
```

为了使 `Millis` 和 `Meters` 能够相加，指定 `impl Add<Meters>` 来设定 `Rhs` 类型参数的值而不是使用默认的 `Self`。

默认参数类型主要用于：

-   扩展类型而不破坏现有代码；
-   在大部分不需要特定的情况进行自定义。

大部分时候会将两个相似的类型相加，但也提供了自定义特定行为的能力。在 `Add` trait 定义中使用默认类型参数意味着大部分时候无需指定额外的参数。

### 完全限定语法

两个 trait 可以声明相同的函数或方法，两个类型也可以同时实现同一个 trait，因此当调用这些同名方法时，需要明确使用哪一个。

`Pilot` 和 `Wizard` trait 都有方法 `fly`，接着在一个本身已经实现了名为 `fly` 方法的类型 `Human` 上实现这两个 trait，每一个 `fly` 方法都进行了不同的操作。

```rust
trait Pilot {
    fn fly(&self);
}

trait Wizard {
    fn fly(&self);
}

struct Human;

impl Human {
    fn fly(&self) {
        println!("From Self");
    }
}

impl Pilot for Human {
    fn fly(&self) {
        println!("From Pilot");
    }
}

impl Wizard for Human {
    fn fly(&self) {
        println!("From Wizard");
    }
}
```

然后调用 `Human` 实例上的 `fly` 方法：

```rust
let person = Human;
person.fly();
```

运行结果：

```
From Self
```

这表明调用了直接实现在 `Human` 上的 `fly` 方法。

---

为了能够调用 `Pilot` 或 `Wizard` trait 的 `fly` 方法，需要显式指定：

```rust
let person = Human;
Pilot::fly(&person);
Wizard::fly(&person);
person.fly();
```

因为 `fly` 方法获取一个 `self` 参数，若有两个类型都实现了同一 trait，编译器可以根据 `self` 的类型计算出应该使用哪一个 trait 实现。然而在 trait 中声明的关联函数时，则无法传递 `self`，除非使用**完全限定语法**。

`Dog` 上实现了关联函数 `name`，也实现了 `Animal` trait。

```rust
trait Animal {
    fn name() -> String;
}

struct Dog;

impl Dog {
    fn name() -> String {
        String::from("Spot")
    }
}

impl Animal for Dog {
    fn name() -> String {
        String::from("puppy")
    }
}
```

编译器会优先调用类型上面直接实现的函数或方法。

```rust
let dog = Dog::name();
println!("{dog}");
```

运行结果：

```
Spot
```

若要调用 `Dog` 上 `Animal` trait 实现的 `name` 函数，则不能使用之前的方法：

```rust
// 错误
let dog = Animal::name();
```

因为 `Animal::name` 没有 `self` 参数，同时可能会有其它类型也实现了 `Animal` trait，因此编译器无法计算出所需的是哪一个实现。

为了消歧义需要使用**完全限定语法**：

```rust
let dog = <Dog as Animal>::name();
```

在尖括号中提供类型注解，来指定 `Dog` 上 `Animal` trait 实现中的 `name` 函数。

通常完全限定语法定义为：

```rust
<Type as Trait>::function(receiver_if_method, next_arg, ...);
```

对于关联函数，其没有 `receiver`，因此只会有其它参数。可以选择在任何函数或方法调用处使用完全限定语法，但可省略任何编译器能够从程序的其它信息中计算出的部分，只有当存在多个同名实现时才使用这个较为冗长的语法。

### 父 trait 

可以定义一个依赖另一个 trait 的 trait 定义：要求实现该 trait 的类型，也必须实现其上依赖的 trait。父 trait 可以通过 trait bound 语法来指定多个

```rust
use std::fmt::{self, Display};

trait Foo: Display {
    fn bar(&self) -> i32;
}

struct Wrap(i32);

impl Foo for Wrap {
    fn bar(&self) -> i32 {
        todo!()
    }
}

impl Display for Wrap {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        todo!()
    }
}
```

`Wrap` 要实现 `Foo` trait，就必须也实现 `Display` trait。

### newtype 模式

在实现 trait 时，需要遵循**孤儿原则**，即不能为外部类型实现外部 trait。要绕开这个限制的方法是使用 **newtype 模式**，即把外部类型封装起来。

如想要在 `Vec<T>` 上实现 `Display`，因为 `Display` trait 和 `Vec<T>` 都定义于外部，所以创建一个包含 `Vec<T>` 实例的 `Wrap` 结构体，然后就可以 `Wrap` 上实现 `Display` 并使用 `Vec<T>` 的值。

```rust
use std::fmt::{self, Display};

struct Wrap(Vec<String>);

impl Display for Wrap {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

fn main() {
    let w = Wrap(vec![String::from("hello"), String::from("world")]);
    println!("w = {}", w);
}
```

这样做的缺陷是，因为 `Wrap` 是一个新类型，所以原本未封装类型的方法都不能使用，但也可以隐藏内部细节，只向外提供 API。

## 高级函数和闭包

### 函数指针

可以向函数传递闭包，也可以向函数传递常规函数。和闭包的 `Fn` 不同，函数类型为 `fn`，也被称为**函数指针**。通过函数指针可以将函数作为另一个函数的参数。

指定参数为函数指针的语法和闭包类似：

```rust
fn add(x: i32, y: i32) -> i32 {
    x + y
}

fn do_add((x, y): (i32, i32), f: fn(i32, i32) -> i32) -> i32 {
    f(x, y)
}

fn main() {
    let result = do_add((1, 2), add);
    assert_eq!(3, result);
}
```

`do_add` 中的 `f` 被指定为一个接受两个 `i32` 参数并返回 `i32` 的 `fn`。然后就可以将函数名 `add` 作为参数传递。

不同于闭包，`fn` 是一个类型而不是一个 trait，所以直接指定 `fn` 作为参数而不是声明一个带有 `Fn` 作为 trait bound 的泛型参数。

函数指针实现了所有三个闭包 trait（`FnOnce`、`FnMut` 和 `Fn`），所以函数指针可以传递给一个接受闭包为参数的函数，但是反过来就不一定，因此尽量将定义闭包为参数。

只接受 `fn` 而不接受闭包的情况的例子是与不存在闭包的外部代码交互，如 C 的函数可以接受函数作为参数，但 C 没有闭包。

一个例子是 `map` 方法，它接受一个闭包：

```rust
let list = vec![1, 2, 3];
let list: Vec<String> = list.iter().map(|i| i.to_string()).collect();
```

但也可以把函数作为 `map` 的参数来代替闭包：

```rust
let list: Vec<String> = list.iter().map(ToString::to_string).collect();
```

这里必须完全限定语法，因为存在多个叫做 `to_string` 的函数。这里使用了定义于 `ToString` trait 的 `to_string` 函数，标准库为所有实现了 `Display` 的类型实现了这个 trait。

---

在枚举中，含有值的枚举成员名也是一个构造函数。可以使用这些构造函数作为实现了闭包 trait 的函数指针。

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

这里创建了 `Status::Value` 实例，并把构造函数传递给 `map`，这和使用闭包得到的结果是相同的。

### 返回函数或闭包

对于返回 trait 的情况，可使用实现了该 trait 的具体类型作为返回值。闭包虽然也是一个 trait，但并不是一个在编译期就能确定大小的类型，即是 `?Sized` 的，因此要返回闭包，必须利用指针。同时对于非闭包的 trait 也只能返回一个在编译期就能确定的类型，不能直接返回所有实现了该 trait 的类型，要实现动态 trait，同样也需要放在指针后面。

例如这段代码就不能编译：

```rust
// 错误
fn ret_closure() -> dyn Fn(i32) -> i32 {
    |x| x + 1
}
```

通过使用动态分发的 trait 对象则可以编译：

```rust
// 正确
fn ret_closure() -> Box<dyn Fn(i32) -> i32> {
    Box::new(|x| x + 1)
}
```

非闭包类型的 trait 要返回动态分发的 trait 对象，也使用这种方法：

```rust
trait Foo {}

struct A;
struct B;
impl Foo for A {}
impl Foo for B {}

fn ret_dyn_trait(flag: bool) -> Box<dyn Foo> {
    if flag {
        Box::new(A {})
    } else {
        Box::new(B {})
    }
}
```

函数指针由于是一个指针，大小是确定的，因此可以直接返回：

```rust
fn ret_fn() -> fn(i32) -> i32 {
    fn bar(n: i32) -> i32 {
        n + 1
    }
    bar
}
```

