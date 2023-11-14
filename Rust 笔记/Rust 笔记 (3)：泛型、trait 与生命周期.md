

# 1 泛型

泛型是具体类型或其他属性的抽象替代，可以用来减少重复的代码。

## 泛型函数

```rust
fn main() {
    let x = add_i32(1, 2);
    let y = add_f64(1.1, 2.2);
}

fn add_i32(a: i32, b: i32) -> i32 {
    a + b
}

fn add_f64(a: f64, b: f64) -> f64 {
    a + b
}
```

`add_i32` 和 `add_f64` 函数逻辑一致，仅仅是类型不同，如果有更多需要这样处理的类型就需要编写更多的函数，因此可以使用 `<>` 语法来定义泛型函数。

```rust
fn add<T>(a: T, b: T) -> T {
    a + b
}
```

函数 `add` 有泛型类型 `T`，含有两个类型为 `T` 的参数，返回值类型也是 `T`。这里的 `T` 可以是任何标识符，可以看作占位符，在编译阶段这些使用 `T` 的地方会被实际的类型所替代。

这段代码还不能编译，因为缺少对类型的限制，如不是所有类型都能实现 `+` 运算，可以使用 trait 来限制：

```rust
fn add<T: std::ops::Add<Output = T>>(a: T, b: T) -> T {
    a + b
}
```

## 泛型结构体

定义泛型结构体，包含一个或多个泛型类型参数：

```rust
struct Point<T> {
    x: T,
    y: T,
}
```

`Point<T>` 的定义中只使用了一个泛型类型，这个定义表明结构体 `Point<T>` 对于一些类型 `T` 是泛型的，而且字段 `x` 和 `y` 都是相同类型的。若尝试创建一个有不同类型值的 `Point<T>` 的实例，则不能通过编译。

```rust
let wont_work = Point { x: 5, y: 4.0 };  // 错误
```

要定义一个 `x` 和 `y` 可以有不同类型且仍然是泛型的 `Point` 结构体，可以使用多个泛型类型参数：

```rust
struct Point<T, U> {
    x: T,
    y: U,
}
```

## 泛型枚举

和结构体类似，枚举也可以在成员中存放泛型数据类型，如标准库中的 `Option<T>` 枚举：

```rust
enum Option<T> {
    Some(T),
    None,
}
```

`Option<T>` 是一个拥有泛型 `T` 的枚举，含有两个成员：`Some` 存放了一个类型 `T` 的值，和不存在任何值的 `None`。

标准库中的 `Result<T, E>` 枚举也同样是泛型：

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`Result` 枚举有两个泛型类型，`T` 和 `E`，含有两个成员：`Ok` 存放一个类型 `T` 的值，而 `Err` 存放一个类型 `E` 的值。这个定义使 `Result` 枚举能很方便的表达任何可能成功或失败的操作。如当成功打开文件时，`T` 对应 `std::fs::File` 类型，而当打开文件失败时，`E` 对应 `std::io::Error` 类型。

## 泛型方法

对结构体也可以实现泛型方法：

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn get(&self) -> (&T, &T) {
        (&self.x, &self.y)
    }
}

fn main() {
    let p = Point { x: 1, y: 2 };
    assert_eq!((&1, &2), p.get());
}
```

>   注意必须在 `impl` 后面声明 `T`，才能在 `Point<T>` 上实现的方法中使用。

在 `impl` 之后声明泛型 `T` ，这样 Rust 就知道 `Point` 的尖括号中的类型是泛型而不是具体类型。因为再次声明了泛型，可以为泛型参数选择一个与结构体定义中声明的泛型参数所不同的名称，不过依照惯例使用了相同的名称。

```rust
// 使用不同的泛型名称
impl<U> Point<U> {}
```

另一个选择是定义方法适用于某些有限制的泛型类型，如可以选择为 `Point<f32>` 实现方法，而不是为泛型 `Point` 实现。

```rust
impl Point<f64> {
    fn distance(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

`Point<f64>` 类型有一个方法 `distance`，而其他 `T` 不是 `f64` 类型的 `Point<T>` 实例则没有实现此方法，因此只有 `Point<f64>` 类型的实例能够使用此方法。

虽然可以为 `Point<f32>` 实现方法，但是这种特化的实现，其中的函数名不能与其它实现相同。

```rust
// 错误
impl Point<f64> {
    fn foo(&self) {}
}

impl<T> Point<T> {
    fn foo(&self) {}
}
```

---

结构体定义中的泛型类型参数并不总是与结构体方法签名中使用的泛型是同一类型：

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

impl<T, U> Point<T, U> {
    fn mixup<N, M>(self, other: Point<N, M>) -> Point<T, M> {
        Point {
            x: self.x,
            y: other.y,
        }
    }
}

fn main() {
    let p1 = Point { x: 1, y: 2 };
    let p2 = Point { x: 'a', y: 'b' };
    let p3 = p1.mixup(p2);
    assert_eq!((1, 'b'), (p3.x, p3.y));
}
```

`p1` 为一个有 `i32` 类型的 `Point`，`p2` 为一个 `char` 类型的 `Point`。在 `p1` 上以 `p2` 作为参数调用 `mixup` 会返回一个 `p3`，它含有一个 `i32` 类型的 `x`，和一个 `char` 类型的 `y`。

泛型参数 `T` 和 `U` 声明于 `impl` 之后，与结构体定义相对应，而泛型参数 `N` 和 `M` 声明于 `mixup` 之后，只与方法本身对应。

## 泛型性能

Rust 通过在编译时进行泛型代码的**单态化**来保证效率，单态化是一个通过填充编译时使用的具体类型，将通用代码转换为特定代码的过程。因此使用泛型类型参数的代码相比使用具体类型并没有任何速度上的损失。

如一个 `Option` 枚举的值，Rust 会对这些代码进行单态化：

```rust
let integer = Some(5);
let float = Some(5.0);
```

`Option<T>` 的值有两种：一个对应 `i32` 另一个对应 `f64`。因此编译器会将泛型定义 `Option<T>` 展开为 `Option_i32` 和 `Option_f64`，接着将泛型定义替换为这两个具体的定义。

编译器生成的单态化代码类似为：

```rust
enum Option_i32 {
    Some(i32),
    None,
}

enum Option_f64 {
    Some(f64),
    None,
}

fn main() {
    let integer = Option_i32::Some(5);
    let float = Option_f64::Some(5.0);
}
```

使用泛型来编写不重复的代码，而 Rust 将会为每一个实例编译为特定类型的代码，因此使用泛型时没有运行时开销。

# 2 trait

## 何为 trait

一个类型的行为由其方法所描述，若多个类型具有相同或类似的行为，那么可以将这些行为提取出来组合成一个可被共享的方法集合，然后就可以使用不同的类型调用相同的方法。通过 trait 可以定义一种将方法签名组合起来以实现某些目的所必需的行为的集合。简单来讲，trait 表示某种类型具有哪些且可以和其它类型共享的功能，可以抽象的定义共享行为。

如一篇文章和一则新闻，虽然某些属性不同，但都是文字类型，且都能够被总结成摘要，因此可以使用 trait 定义，将摘要这个行为抽象出来，形成一个统一的签名，然后各自再去针对此签名实现方法。

```rust
trait Summary {
    fn summarize(&self) -> String;
}
```

使用 `trait` 关键字来声明，然后添加这个 trait 所需要行为的方法签名。

每一个实现这个 trait 的类型都需要提供其自定义行为的方法体，编译器也会确保任何实现 `Summary` trait 的类型都拥有与这个签名的定义完全一致的方法。trait 中可以有多个方法：一行一个方法签名且都以分号结尾。

## 为类型实现 trait

定义了 trait 中方法的签名后，之后其它类型要实现该方法，就必须遵循该签名。在结构体中使用 `for` 关键字表示为了某结构体实现该 trait。

```rust
struct Article {
    title: String,
    author: String,
    tag: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!(
            "title: {}, author: {}, tag: {}",
            self.title, self.author, self.tag
        )
    }
}

struct News {
    title: String,
    journalist: String,
    office: String,
    date: (u32, u32, u32),
}

impl Summary for News {
    fn summarize(&self) -> String {
        format!(
            "title: {}, journalist: {}, office: {}, date: {}/{}/{}",
            self.title, self.journalist, self.office, self.date.0, self.date.1, self.date.2
        )
    }
}
```

两个结构的方法签名相同，但是实现不同，接着在 main 中调用：

```rust
let a = Article {
    title: "Hello World".to_string(),
    author: "Alice".to_string(),
    tag: "Default".to_string(),
};

let n = News {
    title: "A Big News".to_string(),
    journalist: "HK Journalist".to_string(),
    office: "Daily Planet".to_string(),
    date: (2022, 1, 1),
};

println!("{}", a.summarize());
println!("{}", n.summarize());
```

trait 通常作为外部 crate 而使用，如把上面对 trait 的定义和实现放在 *lib.rs* 中，并加上 `pub` 关键字，然后在 *main.rs* 中使用 `use` 导入。

```rust
use crate_name::{Article, News, Summary};
```

其他 crate 也可以将 `Summary` trait 引入作用域以便为其自己的类型实现该 trait。实现 trait 时需要注意的一个限制是，**只有当至少一个 trait 或者要实现 trait 的类型位于 crate 的本地作用域时，才能为该类型实现 trait**。如可以为一个本地的 struct 实现一个外部的 trait，或为一个外部的 struct 实现一个本地的 trait。但是不能为一个外部的 struct 实现一个外部的 trait。这条规则确保了其他人编写的代码不会破坏自己的代码，反之亦然。若没有这条规则，两个 crate 可以分别对相同类型实现相同的 trait，编译器将不知道应该使用哪一个实现。

## 默认实现

可以在定义 trait 时定义默认方法，当某个类型在实现该 trait 时，可以选择重新定义并覆盖默认方法，或者不进行定义而使用默认方法。

如在 `Summary` trait 中声明并定义一个 `summarize_full` 方法用于输出详细摘要：

```rust
fn summarize_full(&self) {
    println!("Implementation is pending...");
}
```

而 `Article` 和 `News` 并没有实现该方法，因此会调用默认实现，当然也可以重新定义并覆盖默认方法，但覆盖后不能再调用默认方法。可以选择让一个类型调用默认方法，而另一个类型选择重新实现该方法。

默认实现还允许调用相同 trait 中的其他方法，哪怕这些方法没有默认实现：

```rust
pub trait Summary {
    fn summarize_author(&self) -> String;
    fn summarize(&self) {
        println!("Read more from {}", self.summarize_author())
    }
}
pub struct Article {
    pub author: String,
}

impl Summary for Article {
    fn summarize_author(&self) -> String {
        format!("@{}", self.author)
    }
}
```

`summarize` 方法会调用 `summarize_author` 方法，然后在实现中定义该方法。对 `News` 的实例调用 `summarize` 方法，其默认实现会调用重新定义后 `summarize_author` 方法。

>   类型必须实现所有 trait 中所有声明的方法，除非这个方法有默认实现。

## trait 结构体和枚举中的常量

结构体、枚举和 trait 也可以与常量字段成员一起提供，可用于需要在共享常量的情况。如有一个 Circle trait，这个 trait 被不同的圆形类型实现，因此可以将一个 PI 常量添加到 Circle  trait 中。

```rust
trait Circular {
    const PI: f64 = 3.14;
    fn area(&self) -> f64;
}

struct Circle {
    rad: f64,
}

impl Circular for Circle {
    fn area(&self) -> f64 {
        Circle::PI * self.rad * self.rad
    }
}
```

同样，结构体和枚举也能使用常量：

```rust
enum Item {
    One,
    Two,
}

struct Food {
    count: usize,
}

impl Item {
    const DEFAULT_COUNT: u32 = 5;
}

impl Food {
    const FAVORITE_FOOD: &str = "Cake";
}
```

## trait 作为参数

可以使用 trait 来接受多种不同类型的参数。`Article` 和 `News` 类型都实现了 `Summary` trait，可以定义一个函数 `notify` 来调用其参数 `item` 上的 `summarize` 方法，该参数是实现了 `Summary` trait 的某种类型，为此可以使用 `impl trait` 语法。

```rust
fn notify(item: &impl Summary) {
    println!("Info: {}", item.summarize());
}
```

对于 `item` 参数，指定了 `impl` 关键字和 trait 名称，而不是具体的类型。该参数支持任何实现了指定 trait 的类型。在 `notify` 函数中，可以调用任何来自 `Summary` trait 的方法，如 `summarize`。因此可以传递任何 `Article` 或 `News` 的实例来调用 `notify`。任何其它如 `String` 或 `i32` 的类型调用该函数都不能编译，因为它们没有实现 `Summary` trait。

## trait bound

`impl trait` 实际上是 `trait bound` 这种形式的语法糖，`notify` 方法还可以这样定义：

```rust
fn notify<T: Summary>(item: &T) {
    println!("Info: {}", item.summarize());
}
```

`trait bound` 与泛型参数声明在一起，表示该泛型被约束为实现了 `Summary` trait 的类型。

`impl trait` 适用于短小的例子，`trait bound` 则适用于更复杂的场景。

```rust
fn notify(item1: &impl Summary, item2: &impl Summary, item3: &impl Summary) {}
```

若采用 `impl trait` 则会显得十分冗长，这时可以使用 `trait bound`：

```
fn notify<T: Summary>(item1: &T, item2: &T, item3: &T) {}
```

### 指定多个 trait bound

如果 `notify` 需要显示 `item` 的格式化形式，同时也要使用 `summarize` 方法，那么 `item` 就需要同时实现两个不同的 trait：`Display` 和 `Summary`。

可以通过 `+` 语法实现：

```rust
// impl trait
fn notify(item: &(impl Summary + Display)) {}
// trait bound
fn notify<T: Summary + Display>(item: &T) {}
```

### 简化 trait bound

当有多个泛型参数时，则会有很长的 trait bound 信息：

```rust
fn foo<T: Clone + Display, U: Clone + Debug>(t: &T, u: &U) {}
```

可以通过 `where` 从句来简化：

```rust
fn foo<T, U>(t: &T, u: &U)
where
    T: Clone + Display,
    U: Clone + Debug,
{}
```

### 使用 trait bound 修复函数

有一个泛型函数，用于从数组中获取最大值并返回：

```rust
fn get_max<T>(v: &[T]) -> T
where
    T: PartialOrd + Copy,
{
    let mut max = v[0];
    for &i in v {
        if max < i {
            max = i;
        }
    }
    max
}
```

在没有对泛型参数 `T` 做出约束时，此代码不能通过编译，因为不是所有的类型都能实现比较操作，因此使用 `where` 子句将类型限制在实现了 `PartialOrd` trait 的类型上，当函数使用 `<` 运算符比较两个 `T` 类型的值时，会调用该 trait 的一个默认方法来实现比较。使用 trait bound 再次限制为实现了 `Copy` trait 的类型，这样就限制 `T` 为任何存储在栈上如 `i32`、`char` 这样的简单数据类型。

### 使用 trait 有条件地实现方法

通过使用带有 trait bound 的泛型参数的 `impl` 块，可以有条件地只为那些实现了特定 trait 的类型实现方法。

```rust
struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

impl<T> Pair<T>
where
    T: PartialOrd + Display,
{
    fn cmp_display(&self) {
        if self.x > self.y {
            println!("x: {}", self.x);
        } else {
            println!("y: {}", self.y);
        }
    }
}
```

`new` 方法没有对 `T` 做限制，因为它始终返回一个 `Pair<T>` 实例，而只有实现了 `PartialOrd` 和 `Display` trait 的 `Pair<T>` 实例才能调用 `cmp_display` 方法，否则就会报错，因为该方法需要比较和显示数据，没有实现这两种 trait 的实例则无法做到。

```rust
let p1 = Pair::new(3, 4);
let p2 = Pair::new(('a', 1), ('b', 2));
p1.cmp_display();
p2.cmp_display();    // 报错
```

## 返回 impl trait

可以在返回值中使用 `impl trait` 语法，来返回实现了某个 trait 的类型：

```rust
fn get_info() -> impl Summary {
    Article {
        title: "Hello World".to_string(),
        author: "Alice".to_string(),
        tag: "Default".to_string(),
    }
}
```

该函数返回某个实现了 `Summary` trait 的类型，但是调用方不确定其具体的类型。

>   因为返回值的是具体类型，而不是返回一个 trait。因此只能使用 `impl trait` 语法，不能使用 `trait bound` 语法。

这只适用于返回单一类型的情况，如将返回值类型指定为 `impl Summary`，因此要么返回 `Article`，要么返回 `News`，而不能返回一个不确定的类型，即使都实现了该 trait。

>   通过单态化生成的代码会执行静态分发，在编译期就确定了类型。

```rust
// 错误
fn get_info(swtich: bool) -> impl Summary {
    if swtich {
        Article {
            title: "Hello World".to_string(),
            author: "Alice".to_string(),
            tag: "Default".to_string(),
        }
    } else {
        News {
            title: "A Big News".to_string(),
            journalist: "HK Journalist".to_string(),
            office: "Daily Planet".to_string(),
            date: (2022, 1, 1),
        }
    }
}
```

因为 `impl trait` 工作方式的限制，这段代码不能通过编译。

## trait 对象动态分发

对于 trait 对象，有如下特征：

-   大小不固定：对于 `trait T`，类型 `A` 和类型 `B` 都可以实现它，因此 `trait T` 对象的大小无法确定；
-   使用 trait 对象时，总是使用引用的方式：
    -   虽然 trait 对象没有固定大小，但其引用类型的大小固定，它由两个指针组成，因此占两个指针大小；
    -   一个指针指向具体类型的实例；
    -   另一个指针指向一个虚表 `vtable`，其中保存了实例可以调用的实现于 trait 上的方法。当调用方法时，直接从 `vtable` 中找到方法并调用。
    -   trait 对象的引用方式有多种，对于 `trait T`，其 trait 对象类型的引用可以是 `&dyn T`、`&mut dyn T`、`Box<dyn T>` 和 `Rc<dyn T>` 等。

```rust
trait Person {
    fn run(&self);
}

struct Student {
    name: String
}

struct Teacher {
    name: String
}

impl Person for Student {
    fn run(&self) {
        println!("Student: {}", self.name);
    }
}

impl Person for Teacher {
    fn run(&self) {
        println!("Teacher: {}", self.name);
    }
}

fn main() {
    let stu = Student { name: "alice".to_string() };
    let tec = Teacher { name: "bob".to_string() };

    let p1: &dyn Person = &stu;
    let p2: &dyn Person = &tec;

    p1.run();
    p2.run();
}
```

在上面这段代码的内存布局如下图。

![动态 trait 对象内存布局](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202307242214983.png)

`stu` 和 `tec` 变量分别是 `Student` 和 `Teacher` 类型，存储在栈上，`p1` 和 `p2` 是 `trait Person` 对象的引用，保存在栈上，该引用包含两个指针，`ptr` 指向具体类型的实例，`vptr` 指向 `vtable`。

`vtable` 是一个在运行时用于查找 trait 方法实现的数据结构。当创建一个动态分发的 trait 对象时，编译器会在程序的 `.rodata` 段上保存 `vtable`。

`vptr` 是在运行时进行查找的，从而允许动态地调用实现了特定 trait 的方法，但也因此会损失一定的性能。

在返回 impl Trail 时，由于单态化的限制，只能返回确定的 trait，但是通过动态分发，可以返回不确定的 trait。

```rust
fn get_person(swtich: bool) -> Box<dyn Person> {
    if swtich {
        Box::new(Student { name: "Alice".to_string() })
    } else {
        Box::new(Teacher { name: "Bob".to_string() })
    }
}
```

## trait 对象安全

只有对象安全的 trait 才可以组成 trait 对象，当 trait 的方法满足以下要求时才是对象安全的：

-   返回值类型不能为 `Self`：trait 对象在产生时，原来的具体类型会被抹去，因此返回一个 `Self` 并不能知道具体返回什么类型；
-   方法没有任何泛型类型参数：泛型类型在编译时会被单态化，而 trait 对象是运行时才被确定；
-   trait 不能拥有静态方法：因为无法知道在哪个实例上调用方法，即 trait 的函数参数必须接受 `&self`。

下列代码编译会报错，因为 `Clone` 返回的是 `Self`。

```rust
// 错误
struct Person {
    student: Box<dyn Clone>,
 }
```

## 常见 trait

### Default

`std::default::Default`：为类型提供默认值。

```rust
#[derive(Default)]
struct Person {
    name: String,
    age: u32,
}

let p: Person = Default::default();
let p2 = Person::default();
let p3 = Person { age: 20, ..Default::default() };
```

### Debug

`std::fmt::Debug`：格式化打印调试字符串。

```rust
#[derive(Debug)]
struct Person {
    name: String,
    age: u32,
}
```

### Display

`std::fmt::Display`：格式化打印用户字符串。

```rust
use std::fmt;

struct Person {
    name: String,
    age: u32,
}

impl fmt::Display for Person {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{} ({} years)", self.name, self.age)
    }
}
```

### PartialEq 和 Eq

-   `std::cmp::PartialEq`：部分值相等关系；
-   `std::cmp::PartialOrd`：部分值顺序关系。

```rust
#[derive(PartialEq, Eq)]
struct Point(i32, i32);
```

>   要实现 `Eq`，必须同时实现 `PartialEq`。

### PartialOrd 和 Ord

-   `std::cmp::Eq`：完全相等关系；
-   `std::cmp::Ord`：完全顺序关系。

```rust
#[derive(PartialOrd, Ord)]
struct Point(i32, i32);
```

>   要实现 `Ord`，必须同时实现 `PartialOrd`。

### Clone 和 Copy

-   `std::clone::Clone`：能显式复制；
-   `std::marker::Copy`：能隐式复制。

```rust
#[derive(Clone, Copy)]
struct Point(i32, i32);
```

>   要实现 `Copy`，必须同时实现 `Clone`。

### Iterator 和 IntoIterator

`std::iter::Iterator`：定义迭代器；

`std::iter::IntoIterator`：转换为迭代器。

```rust
struct Counter {
    count: usize,
}

impl Iterator for Counter {
    type Item = usize;

    fn next(&mut self) -> Option<Self::Item> {
        self.count += 1;

        if self.count <= 5 {
            Some(self.count)
        } else {
            None
        }
    }
}

impl<'a> IntoIterator for &'a Counter {
    type Item = usize;
    type IntoIter = std::iter::Take<std::ops::RangeFrom<usize>>;

    fn into_iter(self) -> Self::IntoIter {
        (0..).take(self.count)
    }
}

let c = Counter { count: 2 };
for i in &c {
    println!("{i}");
}
```

### Hash

`std::hash::Hash`：可散列的类型。

实现了 `Hash` trait 的类型可通过 `Hasher` 的实例进行 `hash` 化。如在 `HashMap<K, V>` 上存储数据，`Key` 必须实现 `Hash`。

```rust
#[derive(PartialEq, Eq, Hash)]
struct Point(i32, i32);

let mut map = HashMap::new();
map.insert(Point(1, 2), 1);
```

>   要实现 `Hash`，必须同时实现 `PartialEq` 和 `Eq`。
>
>   若所有字段都实现了 `Hash` trait，则可通过 `derive` 派生 `Hash`，产生的哈希值将是在每个字段上调用 `hash` 函数的值的组合。

## 运算符重载

Rust 中的操作符均为某个 trait 方法的语法糖，有一系列用于运算符重载的 trait，可以方便的为类型实现各种运算操作，这些运算符如 `a + b`，都会在编译的过程中会被转换为 `a.add(b)`。

### Add、Sub、Mul 和 Div

-   `std::ops::Add`：定义加法；
-   `std::ops::Sub`：定义减法；
-   `std::ops::Mul`：定义乘法；
-   `std::ops::Div`：定义除法。

```rust
use std::ops::{Add, Sub, Mul, Div};

struct Point(i32, i32);

impl Add for Point {
    type Output = Self;

    fn add(self, other: Self) -> Self::Output {
        Self(self.0 + other.0, self.1 + other.1)
    }
}

impl Sub for Point {
    type Output = Self;

    fn sub(self, other: Self) -> Self::Output {
        Self(self.0 - other.0, self.1 - other.1)
    }
}

impl Mul for Point {
    type Output = Self;

    fn mul(self, other: Self) -> Self::Output {
        Self(self.0 * other.0, self.1 * other.1)
    }
}

impl Div for Point {
    type Output = Self;

    fn div(self, other: Self) -> Self::Output {
        Self(self.0 / other.0, self.1 / other.1)
    }
}
```

此外还有许多其它运算符的 trait，具体可参考 [std::ops](https://doc.rust-lang.org/std/ops/index.html#traits)。

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

# 3 生命周期

Rust 中的每一个引用都有其**生命周期**，即引用保持有效的作用域。大部分时候生命周期是隐含并可以推断的，但也会出现引用的生命周期以一些不同方式相关联的情况，此时需要使用泛型生命周期参数来标注，这样就能确保引用是有效的。

## 避免悬垂引用

生命周期的主要目的是避免悬垂引用。

```rust
let r;
{
    let x = 5;
    r = &x;
}
r;    // 错误
```

外部作用域声明了一个没有初值的变量 `r`，而内部作用域声明了一个初值为 5 的变量 `x`。在内部作用域中，将 `r` 的值设置为一个 `x` 的引用，接着在内部作用域结束后，尝试使用 `r` 的值。这段代码不能编译，因为 `r` 引用的值在使用之前就离开了作用域，若允许使用，就会造成悬垂引用。

作用域越大，就表明生命周期越长。Rust 编译器有一个**借用检查器**，它比较作用域来确保所有的借用都是有效的。

```rust
{
    let r;                // ---------+ 'a
    {                     //          |
        let x = 5;        // -+ 'b    |
        r = &x;           //  |       |
    }                     // -+       |
    r;                    //          |
}                         // ---------+
```

这里将 `r` 的生命周期标记为 `'a`，将 `x` 的生命周期标记为 `'b`。内部的 `'b` 要比外部的生命周期 `'a` 小。在编译时，编译器比较这两个生命周期的大小，并发现 `r` 拥有生命周期 `'a`，但引用了一个拥有生命周期 `'b` 的对象。因为生命周期 `'b` 比生命周期 `'a` 要小，即被引用的对象比它的引用者存在的时间更短，因此引用可能会失效，编译器将报错。

```rust
{
    let x = 5;            // ----------+ 'b
    let r = &x;           // --+ 'a    |
    println!("r: {}", r); //   |       |
}                         // --+-------+
```

这里 `x` 拥有生命周期 `'b`，比 `'a` 要大，因此当 `x` 有效时，`r` 中的引用也肯定有效。

## 函数中的泛型生命周期

```rust
// 编译错误
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

`longest` 函数接受两个字符串 slice 作为参数，并返回长的那一个。但该函数不能通过编译，原因是没有显式标注生命周期，因为编译器并不知道将要返回的引用是指向 `x` 还是 `y`，同时也不知道传入引用的具体生命周期，因此编译器无法通过比较作用域来确定返回的引用是否总是有效。借用检查器同样也无法确定，因为它不知道 `x` 和 `y` 的生命周期是如何与返回值的生命周期相关联的。

## 生命周期注解语法

可以增加泛型生命周期参数来定义引用间的关系以便借用检查器可以进行分析。生命周期注解描述了多个引用之间生命周期的相互关系，而不影响其生命周期。当指定了泛型生命周期参数后函数也能接受任何生命周期的引用。

生命周期参数必须以单引号 `'` 开头，且位于引用的 `&` 之后，然后是名称，并用空格将引用类型与生命周期注解分隔。

```rust
&i32            // 引用
&'a i32         // 显式生命周期的引用
&'a mut i32     // 显式生命周期的可变引用
```

单个生命周期注解本身没有意义，因为生命周期注解告诉编译器多个引用的泛型生命周期参数之间的关联。如函数有一个生命周期 `'a` 的 `i32` 的引用的参数 `first`，还有另一个同样是生命周期 `'a` 的 `i32` 的引用的参数 `second`，这两个生命周期注解意味着引用 `first` 和 `second` 必须与泛型生命周期一样长。

## 函数签名中的生命周期注解

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

`longest` 函数签名中指定了所有的引用必须有相同的生命周期 `'a`，可以编译通过。

函数签名表明对于生命周期 `'a`，函数会获取两个参数，都是与生命周期 `'a` 存在的一样长的字符串 slice，函数会返回一个同样与生命周期 `'a` 存在的一样长的字符串 slice。

当具体的引用被传递给 `longest` 函数时，被 `'a` 所替代的具体生命周期是 `x` 的作用域与 `y` 的作用域的交集，即返回的引用的与传入该函数的引用的生命周期中的最小的那个。

**指定生命周期参数并不会改变任何传入值或返回值的生命周期，而是给借用检查器指明该如何约束这类引用，所有不符合规则的都不会通过编译**。`longest` 函数并不需要知道 `x` 和 `y` 具体会存在多久，只需要知道有某个可以被 `'a` 替代的作用域将会满足这个签名。

当在函数中使用生命周期注解时，这些注解出现在函数签名中，而不存在于函数体中，**生命周期注解成为了函数约定的一部分**。

---

```rust
// 可以编译
let s1 = String::from("abcdefg");
{
    let s2 = String::from("hello");
    let result = longest(s1.as_str(), s2.as_str());
    println!("{}", result);
}
```

在这个例子中，`s1` 直到外部作用域结束前都是有效的，`s2` 则在内部作用域中是有效的，而 `result` 则引用了一些直到内部作用域结束都是有效的值，因此可以编译通过。

---

```rust
// 编译失败
let s1 = String::from("abcdefg");
let result;
{
    let s2 = String::from("hello");
    result = longest(s1.as_str(), s2.as_str());
}
println!("{}", result);
```

在这个例子中，函数肯定返回 `s1`，因此 `result` 的引用肯定是有效的，但生命周期参数指明 `longest` 函数返回的引用的生命周期应该与传入参数的生命周期中较短那个保持一致，由于最短的是 `s2`，因此在外部作用域中使用返回的值时，编译器认为可能会引用一个无效的值，因此编译不通过。

## 深入理解生命周期

指定生命周期参数的正确方式依赖函数实现的具体功能。如将 `longest` 函数的实现修改为总是返回第一个参数而不是最长的字符串 slice，就不需要为参数 `y` 指定一个生命周期。

```rust
// 可以编译
fn longest<'a>(x: &'a str, y: &str) -> &'a str {
    x
}
```

`x` 和返回值指定了生命周期参数 `'a`，但 `y` 没有指定，因为 `y` 的生命周期与参数 `x` 和返回值的生命周期没有任何关联。

当从函数返回一个引用，返回值的生命周期参数需要与一个参数的生命周期参数相匹配。若返回的引用没有指向任何一个参数，那么可能就是指向一个函数内部创建的值，由于该值在函数结束时会失效，因此返回的将会是一个悬垂引用。

```rust
fn longest<'a>(x: &str, y: &str) -> &'a str {
    let s = String::from("hello");
    // 错误，悬垂引用
    s.as_str()
}
```

即使为返回值指定了生命周期参数 `'a`，但却不能通过编译，因为返回值的生命周期与参数完全没有关联，`s` 在 `longest` 函数的结尾将离开作用域并被清理。生命周期参数只是标记，供编译器检查，无法改变生命周期，因此依然获得的是一个悬垂引用。

生命周期语法是用于将函数的多个参数与其返回值的生命周期进行关联。标注后编译器就有了足够的信息来允许内存安全的操作并阻止会产生悬垂指针亦或是违反内存安全的行为。

## 结构体定义中的生命周期注解

```rust
struct User {
    name: &str
}
```

该结构体有一个字符串 slice 类型的字段，但不能通过编译，因为不能保证 `User` 实例存在期间字段 `name` 的值始终有效，因此需要加上生命周期参数。

```rust
struct User<'a> {
    name: &'a str,
}
```

与类似泛型参数类型，必须在结构体名称后面的尖括号中声明泛型生命周期参数，以便在结构体定义中使用生命周期参数。这个注解表明 `User` 的生命周期不能超出 `'a` 的周期，且 `name` 字段的生命周期也不能小于 `User` 实例。

```rust
struct User<'a, 'b> {}
```

这表明 `User` 的生命周期必须小于 `'a` 和 `'b` 中的任何一个。

## 生命周期省略

下面的代码没有标注生命周期，但却可以通过编译：

```rust
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }
    &s[..]
}
```

每一个引用都必须有明确的生命周期，在早期版本的 Rust 中，该函数的签名就必须为：

```rust
fn first_word<'a>(s: &'a str) -> &'a str {}
```

有一些场景是可预测的且遵循几个明确的模式，在这些场景下，借用检查器可以推断出生命周期而不必显式指明。当越来越多的模式被明确后，未来需要手动标注的场景会越来越少。

被编码进编译器引用分析的模式被称为**生命周期省略规则**。这些规则是一系列特定场景，由编译器来检查，若代码符合这些场景，则无需显式指定生命周期。

省略规则并不提供完整的推断：若编译器在明确遵守这些规则的前提下引用的生命周期仍然不能确定，那么就会报错，这时就必须手动指定生命周期。

函数或方法参数的生命周期被称为**输入生命周期**，而返回值的生命周期被称为**输出生命周期**。编译器采用三条规则来判断引用何时不需要明确的注解。**第一条规则适用于输入生命周期，后两条规则适用于输出生命周期**。如果编译器检查完这三条规则后仍然存在没有推断出生命周期的引用，将会报错。

### 省略规则

1.   每一个为引用的参数都有自己的生命周期参数；

2.   若只有一个输入生命周期参数，那么所有输出生命周期参数与它相同；

3.   若方法有多个输入生命周期参数且第一个参数是 `&self` 或 `&mut self`，那么所有输出生命周期参数都与它相同。

---

首先第一个例子：

```rust
fn first_word(s: &str) -> &str {}
```

输入生命周期对应规则一，函数签名会变成：

```rust
fn first_word<'a>(s: &'a str) -> &str {}
```

然后输出生命周期对应规则二，函数签名会变成：

```rust
fn first_word<'a>(s: &'a str) -> &'a str {}
```

现在函数签名中所有的引用都被推断出了生命周期，因此可以不用手动标注。

---

然后是第二个例子：

```rust
fn longest(x: &str, y: &str) -> &str {}
```

首先对应规则一，函数签名会变成：

```rust
fn longest<'a, 'b>(x: &'a str, y: &'b str) -> &str {}
```

由于有多个参数，因此不适用于规则二；由于不是一个方法，因此也不适用于规则三。编译器使用了已知的生命周期省略规则，仍不能推断出签名中所有引用的生命周期，因此将报错，需要手动标注。

## 方法定义中的生命周期注解

当为带有生命周期的结构体实现方法时，其语法类似泛型类型参数的语法。结构体字段的生命周期必须总是在 `impl` 关键字之后声明并在结构体名称之后被使用，因为这些生命周期是结构体类型的一部分。`impl` 块里的方法签名中，引用可能与结构体字段中的引用相关联，也可能是独立的。

```rust
struct User<'a> {
    name: &'a str,
    level: i32,
}

impl<'a> User<'a> {
    fn get_level(&self) -> i32 {
        self.level
    }
}
```

`get_level` 方法唯一的参数是 `&self`，且返回值是一个 `i32`，并不引用任何值，根据第一条规则，可以推断出生命周期，因此不需要显式标注。

---

```rust
impl<'a> User<'a> {
    fn cmp_name(&self, other: &Self) -> &str {
        if self.name.len() > other.name.len() {
            self.name
        } else {
            other.name
        }
    }
}
```

`cmp_name` 方法也不需要标注，根据规则一，输入生命周期确定了，然后根据规则三，返回值被赋予和 `&self` 一样的生命周期，因此签名中所有的引用的生命周期都被推断出，同样也不需要显式标注。

---

```rust
// 编译失败
impl<'a> User<'a> {
    fn ret(&self, s: &str) -> &str {
        s
    }
}
```

这个例子中，由于 `s` 不是 `Self` 类型，因此不能保证其生命周期和 `&self` 一致，所以即使 `ret` 方法符合省略规则，但依然会报错。这不是由于省略规则有缺陷或者编译器 BUG，而是因为借用检查其根据自动推断出来的生命周期参数，检查后发现有不合规的引用，因此才会报错。

根据规则三，返回值的生命周期和 `&self` 相同，设都为 `'a`，而 `s` 的生命周期为 `'b`，但返回值是 `s`，因此借用检查其发现推断出来的生命周期和实际返回的生命周期不匹配。

要通过编译，要么使实际的生命周期与自动推断出来的一致，要么手动标注实际的生命周期：

```rust
// 方式一，让返回值和 self 生命周期一致
fn cmp(&self, s: &str) -> &str {
    self.name
}

// 方式二，手动标注，让 s 和 self 生命周期一致
fn cmp(&self, s: &'a str) -> &'a str {}

// 方式三，手动标注，让 s 和返回值的生命周期一致
fn cmp<'b>(&self, s: &'b str) -> &'b str {}
```

## 静态生命周期

有一种特殊的生命周期值：`'static`，其生命周期能够存活于**整个程序运行期间**。所有的字符串字面值都拥有 `'static` 生命周期，也可以显式标注出来：

```rust
let s: &'static str = "hello";
```

这个字符串的文本被直接储存在程序的二进制文件的只读区块 `.rodata` 中，因此所有的字符串字面值都是 `'static` 的。

```rust
let result;
{
    let s = "hello";
    result = s;      // 可以编译
    result = &s;     // 不能编译
}
println!("{}", result);
```

之前使用 `String` 来创建字符串时，这段代码不能通过编译，原因是 `String` 会在堆上分配空间并在栈上创建指向这个堆的引用，因此其生命周期就取决于作用域，超出了就会被释放，导致 `result` 可能引用一个无效的值。而这段代码由于直接使用了字符串字面值，因此其生命周期是静态的，即 `'static str`，在整个程序运行都有效，因此 `result` 引用的值也必定是有效的，所以能够通过编译。

但是如果获得的是一个 `&s`，那么实际上是一个 `s` 的引用，即 `result` 会被推断为 `&&str` 类型，该引用会在作用域外失效（即使该字符串没有失效），所以不能通过编译。

使用 `static` 关键字创建的变量也同样具有 `'static` 生命周期，在整个程序运行期间都存在：

```rust
static NUM: i32 = 10;
static mut MUT_NUM: i32 = 20;
```

>   `static` 变量可以声明为可变的，但只能在 `unsafe` 块中进行访问和修改。

---

```rust
// 编译错误
fn ret_str() -> &str {
    let s = "hello";
    s
}
```

这段代码还不能通过编译，即使 `s` 是一个字符串字面值，即 `'static str`。但根据省略规则，规则一不适用，因为没有参数，规则二和三也同样不适用，因此必须手动标注。

有两种方法可以标注，一种是标记返回值为 `'static str`，另一种就是指定泛型生命周期参数：

```rust
// 方式一，标记返回值为 'static str
fn ret_str() -> &'static str {}

// 方式二，指定泛型生命周期参数 'a
fn ret_str<'a>() -> &'a str {}
```

## 结合泛型类型参数、trait bound 和生命周期

```rust
fn longest_info<'a, T>(s1: &'a str, s2: &'a str, info: T) -> &'a str
where
    T: Display,
{
    println!("{}", info);
    if s1.len() > s2.len() {
        s1
    } else {
        s2
    }
}
```

`longest_info` 函数泛型参数 `info`，它被限制为任何实现了 `Display` trait 的类型。因为生命周期也是泛型，所以生命周期参数 `'a` 和泛型类型参数 `T` 都位于函数名后的同一尖括号列表中，且生命周期参数必须位于第一个。

## 生命周期转换

较长的生命周期可以强制转成一个较短的生命周期，使它在一个通常情况下不能工作的作用域内也能正常工作。强制转换可由编译器隐式地推导并执行，也可显式地声明不同的生命周期。

>   静态生命周期同样可以被转换。

```rust
fn foo<'a: 'b, 'b>(first: &'a i32, _: &'b i32) -> &'b i32 {
    first
}

fn main() {
    let first = 2;       // 较长的生命周期
    {
        let second = 3;  // 较短的生命周期
        println!("{}", foo(&first, &second));
    };
}
```

`<'a: b, 'b>` 表示 `'a` 的生命周期至少和 `'b` 一样长。

## 生命周期约束

泛型类型能够被约束，生命周期本身也是泛型，也可以被约束。

-   `T: 'a`：在 `T` 中的**所有**引用都必须比生命周期 `'a` 活得更长；

-   `T: A + 'a`：`T` 类型必须实现 `A` trait，并且在 `T` 中的**所有**引用都必须比 `'a` 活得更长。

```rust
struct Ref<'a, T: 'a>(&'a T);
```

`Ref` 包含一个指向泛型类型 `T` 的引用，其中 `T` 拥有一个生命周期 `'a`。`T` 拥有生命周期限制， `T` 中的任何引用都必须比 `'a` 活得更长，另外 `Ref` 的生命周期也不能超出 `'a`。

## 匿名生命周期

如有一个封装了 `&str` 的结构体：

```rust
struct StrWrap<'a>(&'a str);

impl<'a> StrWrap<'a> {
    fn new(s: &'a str) -> StrWrap<'a> {
        StrWrap(s)
    }
}
```

这里有很多的 `'a`，为了消除这些噪音，可以使用匿名生命周期 `'_`：

```rust
struct StrWrap<'a>(&'a str);

impl StrWrap<'_> {
    fn new(s: &str) -> StrWrap<'_> {
        StrWrap(s)
    }
}
```

`'_` 表示在此处使用省略的生命周期，并明确 `StrWrap` 包含一个引用，而无需通过标注所有的生命周期来知道。

`'_` 的具体含义取决于上下文，而对于每个`'_`，会产生一个新的生命周期：

```rust
struct Foo<'a, 'b> {
    x: &'a str,
    y: &'b str
}

// 两者等同
impl<'a, 'b> Foo<'a, 'b> {}
impl Foo<'_, '_> {}
```
