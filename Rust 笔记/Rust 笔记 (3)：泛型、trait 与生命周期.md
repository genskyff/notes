

# 1 泛型

## 泛型参数

泛型参数分为三类：

-   生命周期参数：以 `'` 开头的参数，用作生命周期标注；
-   类型参数：最为广泛使用的场景；
-   常量参数：仅允许除浮点型以外的基本类型，且只能在常量上下文中有限制地使用。

其顺序被规定为：生命周期参数必须放置于后两类之前，后两类顺序没有要求。

### 常量参数

常量参数允许程序项在常量值上泛型化，并在常量上下文中使用：

-   只与常量表达式和常量函数共存；
-   只能独立使用，通常作为某类型的参数标注；
-   除非是单路径或字面量，否则只能使用 `{ ... }` 形式；
-   与关联常量类似，在单态化之后计算值。

```rust
fn double<const N: i32>() {
    println!("doubled: {}", N * 2);
}

const SOME_CONST: i32 = 12;

fn example() {
    double::<9>();
    double::<{7 + 8}>();
    double::<SOME_CONST>();
    double::<{ SOME_CONST + 5 }>();
}
```

>   更多关于常量参数的使用和限制，可参考 [Const generics](https://minstrel1977.gitee.io/rust-reference/items/generics.html#const-generics) 和 [针对常量泛型参数的分类实现](https://rustcc.cn/article?id=282459c8-8e7d-4cf7-bc89-ca91fc004630)。

## 泛型定义

使用 `<'a, 'b, T, U, const N: i32, const M: u32, ..>` 语法来定义泛型参数，并可用于结构体、枚举、联合体、函数、实现、和 trait。其中的 `'a, 'b` 为泛型生命周期参数；`T, U, ..` 为泛型类型参数，可以看作是占位符，在编译阶段会被实际的类型所替代；`const N: i32, const M: u32` 为泛型常量参数。

### 泛型结构体

```rust
struct Point<T> {
    x: T,
    y: T,
}
```

`Point<T>` 的定义中只使用了一个泛型参数 `T`，因此 `x` 和 `y` 的类型必须相同，通过多个泛型参数可以让类型不相同。

```rust
struct Point<T, U> {
    x: T,
    y: U,
}
```

### 泛型枚举

```rust
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`Option<T>` 的 `Some` 存放一个类型 `T` 的值，`None` 不存任何值。`Result<T, E>` 的 `Ok` 存放一个类型 `T` 的值， `Err` 存放一个类型 `E` 的值。

### 泛型函数

函数参数 `x`、`y` 的类型是 `T`。

```rust
fn add<T>(x: T, y: T) -> T {
    x + y  // 目前还不能编译
}
```

>   由于没有对泛型 `T` 进行 trait 约束，这段代码暂时无法编译，因为不是所有类型都能够进行 `+` 操作。

### 泛型 trait

泛型 trait 的定义也是类似的，其中的函数或方法也同样可以有自己的泛型参数。

```rust
trait MyTrait<T> {
    fn foo<U>(&self, n: U) -> T;
}
```

## 泛型实现

泛型实现可应用在关联函数和方法中。

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }

    fn get(&self) -> (&T, &T) {
        (&self.x, &self.y)
    }
}

fn main() {
    let p = Point::new(1, 2);
    assert_eq!((&1, &2), p.get());
}
```

这里必须在 `impl` 之后声明泛型参数 `T` ，这样编译器就知道 `Point<T>` 中的 `T` 是泛型而不是某个具体类型。

```rust
type T = i32;
impl Point<T> {} // 这样就不是为泛型 T 实现，而是为具体类型实现
```

同时还可以为 `Point<T>` 进行具体类型的实现：

```rust
impl Point<f64> {
    fn distance(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

只有 `Point<f64>` 实现了 `distance`，而其它不是 `f64` 的 `T` 则没有实现此方法，但这种特化实现的方法名不能与其它实现相同。

```rust
impl<T> Point<T> {
    fn foo(&self) {}
}

impl Point<f64> {
    // 错误
    fn foo(&self) {}
}
```

实现中的函数或方法可以有自己的泛型参数：

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

泛型参数 `T`、`U` 声明于 `impl` 之后，与结构体定义对应，而泛型参数 `N`、`M` 声明于 `mixup` 之后，只与方法本身对应。

## 泛型性能

Rust 通过在编译时进行泛型代码的**单态化**来保证效率。单态化是一个通过填充编译时使用的具体类型，将通用代码转换为特定代码的过程。编译器会对每个实例编译成具体类型的代码，因此使用泛型没有运行时开销，但容易造成二进制膨胀。

如 `Option<T>` 的值有 `i32` 和 `f64` 两种，因此编译器会将 `Option<T>` 展开为 `Option_i32` 和 `Option_f64`，并将泛型定义替换为这两个具体定义。

```rust
let integer = Some(1);
let float = Some(1.0);
```

生成的单态化代码类似为：

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
    let integer = Option_i32::Some(1);
    let float = Option_f64::Some(1.0);
}
```

# 2 trait

## trait 定义

类型的方法用于描述行为，多个类型若具有相同或类似的行为，则可将这些行为抽象成一个共享的集合。通过 trait 声明共享行为，并为需要的类型实现这些 trait。

通过 `trait` 来声明，然后添加所需要的函数或方法签名。

```rust
trait MyTrait {
    fn foo(x: i32, y: u32) -> i32;
    fn bar(&self) -> String;
}
```

trait 与结构体和枚举一样，也可定义用于共享的常量。

```rust
trait MyTrait {
    const NUM: u32;
}
```

## trait 实现

要为类型实现该 trait，就必须实现 trait 中声明的所有项（除非有默认实现），且签名一致。与结构体和枚举的实现类似，通过 `impl` 和 `for` 来定义。

如计算圆和椭圆的面积是相似的，都利用相同的常量 `PI`，只是计算方法略有不同，因此可以将这两个类型的行为抽象为一个 trait。

```rust
trait Circular {
    const PI: f64;
    fn area(&self) -> f64;
}

struct Circle {
    r: f64,
}

struct Ellipse {
    a: f64,
    b: f64,
}

impl Circular for Circle {
    const PI: f64 = std::f64::consts::PI;
    fn area(&self) -> f64 {
        Circle::PI * self.r * self.r
    }
}

impl Circular for Ellipse {
    const PI: f64 = std::f64::consts::PI;
    fn area(&self) -> f64 {
        Ellipse::PI * self.a * self.b
    }
}

fn main() {
    let c = Circle { r: 1.0 };
    let e = Ellipse { a: 1.0, b: 2.0 };
    println!("{}", c.area());
    println!("{}", e.area());
}
```

### 默认实现

当声明 trait 时，若其中的项具有默认实现，则为类型实现该 trait 时可不实现该项或重新定义并覆盖默认实现。

```rust
trait MyTrait {
    const NUM: u32 = 10;
    fn print_num(&self) {
        println!("{}", Self::NUM);
    }
}

struct Foo;
struct Bar;

impl MyTrait for Foo {}
impl MyTrait for Bar {
    fn print_num(&self) {
        println!("{}", Self::NUM + 1);
    }
}

fn main() {
    let s1 = Foo;
    let s2 = Bar;
    s1.print_num();
    s2.print_num();
}
```

为 trait 实现默认方法时，是无法通过 `self` 获得字段信息的：

```rust
trait MyTrait {
    fn get(&self) -> i32 {
        self.n  // 错误
    }
}

struct Foo {
    n: i32
}

impl MyTrait for Foo {}
```

但默认实现可以调用 trait 中的其它方法，哪怕这些方法没有默认实现，因此可以通过这种方式来间接访问 `self` 中的字段。

```rust
trait MyTrait {
    fn get_n(&self) -> i32;
    fn get(&self) -> i32 {
        self.get_n()
    }
}

struct Foo {
    n: i32,
}

impl MyTrait for Foo {
    fn get_n(&self) -> i32 {
        self.n
    }
}
```

### 为引用实现

为类型 `T` 实现了 trait 并不意味着 `&T` 或 `&mut T` 也实现了该 trait。

```rust
trait MyTrait {
    fn get_name(self);
}

#[derive(Clone)]
struct User {
    name: String,
}

impl MyTrait for User {
    fn get_name(self) {
        println!("name: {}", self.name);
    }
}

fn main() {
    let u = User {
        name: String::from("Alice"),
    };
    let u_ref = &u.clone();

    u.get_name();
    u_ref.get_name();  // 错误
}
```

因为方法期望接收一个 `self` 类型，但实际上是 `&self`，因此类型不匹配。可以同时为不可变和可变引用实现，这样就能在 `&self` 和 `&mut self` 上调用该 trait 的方法了。

```rust
impl MyTrait for &User {
    fn get_name(self) {
        println!("name from ref: {}", self.name);
    }
}

impl MyTrait for &mut User {
    fn get_name(self) {
        println!("name from ref mut: {}", self.name);
    }
}
```

由于 Rust 的自动引用和解引用功能，当 trait 中方法接收的参数为 `&self` 时，即使没有为 `&T` 实现，也可以在 `&T` 上调用 trait 中的方法，但 `&mut T` 则不行。

```rust
trait MyTrait {
    fn get_name(&self);
}

struct User {
    name: String,
}

impl MyTrait for User {
    fn get_name(&self) {
        println!("name: {}", self.name);
    }
}

fn main() {
    let u = User {
        name: String::from("Alice"),
    };
    let u_ref = &u;

    u.get_name();
    u_ref.get_name();  // 可以调用
}
```

由于自动引用和解引用的机制，因此实际上等于调用：

```rust
(&u).get_name();
u_ref.get_name();
```

这种情况下为 `&T` 也实现该 trait，则方法相当于期望接收一个 `&&T`：

```rust
impl MyTrait for &User {
    fn get_name(&self) {
        println!("name from ref: {}", self.name);
    }
}

fn main() {
    let u = User {
        name: String::from("Alice"),
    };
    let u_ref = &u;

    u.get_name();
    (&u_ref).get_name();
}
```

### 孤儿规则

trait 通常作为外部包导入到本地作用域使用：

```rust
// lib.rs
pub trait MyTrait {
    fn foo();
}

// main.rs
use my_crate::MyTrait;

struct Foo;
impl MyTrait for Foo {
    fn foo() {
        todo!()
    }
}
```

实现 trait 时有一条被称为**孤儿规则**的限制：**trait 或为该 trait 实现的类型，两者至少有一个位于本地作用域**。如可为一个本地类型实现一个外部的 trait，或为一个外部类型实现一个本地 trait，但不能为一个外部类型实现一个外部 trait。这条规则确保本地代码不会被外部实现所破坏，否则两个外部包都可以分别对相同类型实现相同的 trait，那么这两个实现就会冲突。

## trait 作为参数和返回值

trait 也可以作为函数参数和返回值。

```rust
trait MyTrait {
    fn foo(&self) {
        println!("Foo");
    }
}

struct Foo;
impl MyTrait for Foo {}

fn get_t(f: impl MyTrait) {
    f.foo();
}

fn ret_t() -> impl MyTrait {
    Foo
}

fn main() {
    get_t(Foo);
    ret_t().foo();
}
```

**函数签名中的参数和返回值不是指具体类型**，而是通过 `impl Trait` 指定，表示任何实现了该 trait 的类型。**实际传递的参数和返回值依然是具体的类型，而不是一个 trait**。

还可以传递一个实现了该 trait 的类型的引用：

```rust
fn foo(f: &impl MyTrait) {}
fn bar(f: &mut impl MyTrait) {}
```

作为参数时，实际上和泛型类似，对不同的实现了该 trait 的类型，都会进行单态化，因此在编译期就可确定类型。

作为返回值时，只适用于返回单一类型的情况。因为无法在编译期就能确定返回类型，所以无法进行单态化。

```rust
trait MyTrait {}
struct Foo;
struct Bar;
impl MyTrait for Foo {}
impl MyTrait for Bar {}

fn ret_t(flag: bool) -> impl MyTrait {
    // 错误
    if flag {
        Foo
    } else {
        Bar
    }
}
```

`Foo` 和 `Bar` 即使都实现了 `MyTrait`，但实际上是不同的类型，因此使用 `impl Trait` 方式是无法确定返回值的。

## trait 约束

`impl Trait` 实际上是 **trait 约束**的语法糖，当作为参数时，实际上可以写为泛型参数的形式：

```rust
trait MyTrait {}

// impl Trait
fn foo(a: &impl MyTrait, b: &impl MyTrait, c: &impl MyTrait) {}

// trait 约束
fn foo<T: MyTrait>(a: &T, b: &T, c: &T) {}
```

泛型参数 `T` 被约束为任何实现了 `MyTrait` 的类型，编译器会为每个不同的类型进行单态化。同时这种形式可以简化声明。

**对于返回类型，则无法写成这种形式：**

```rust
trait MyTrait {}
struct Foo;
impl MyTrait for Foo {}

// 可以这样写
fn foo() -> impl MyTrait {
    Foo
}

// 不可以这样写
fn foo<T: MyTrait>() -> T {
    Foo
}
```

因为 `T` 本质上是一个泛型参数，在语义上表示返回任意实现了 `MyTrait` 的类型。这个类型动态的，并在运行时决定，即使函数体中始终返回 `Foo` 这个固定的类型。对于调用者来说，只期望返回一个实现了该 trait 的类型，这个类型可能不是 `Foo`，而 `impl Trait` 在语义上表示始终返回一个确定的类型。

### 多个约束

可以通过 `+` 来同时指定多个 trait 约束，表示该类型要同时实现这些 trait：

```rust
// impl Trait
fn foo(t: &(impl PartialEq + PartialOrd)) {}

// trait 约束
fn foo<T: PartialEq + PartialOrd>(t: &T) {}
```

### where 子句

当有多个泛型参数时，会有很长的 trait 约束信息：

```rust
fn foo<T: Copy + PartialEq, U: Copy + PartialEq>(t: &T, u: &U) {}
```

可以通过 `where` 子句来简化：

```rust
fn foo<T, U>(t: &T, u: &U)
where
    T: Copy + PartialEq,
    U: Copy + PartialEq,
{}
```

### 条件实现

在为泛型类型实现时，利用 trait 约束可以有条件地为只实现了这些 trait 的类型实现。

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
    T: Copy + PartialOrd,
{
    fn cmp(&self) -> bool {
        self.x > self.y
    }
}

fn main() {
    let p1 = Pair::new(1, 2);
    let p2 = Pair::new("foo".to_string(), "bar".to_string());
    p1.cmp();
    p2.cmp(); // 错误
}
```

第一个实现中的 `new` 方法没有对 `T` 做限制，因此能被任何 `Pair` 实例调用。第二个实现中的 `cmp` 方法只能被实现了 `Copy` 和 `PartialOrd` 的 `Pair` 实例调用。

## trait 对象

虽然不能返回一个动态的 trait，但是若包装成一个 trait 对象，则可实现 trait 的**动态分发**。

对于 trait 对象，有如下特征：

-   大小不固定：对于 `trait T`，类型 `A` 和类型 `B` 都可以实现它，因此 `trait T` 的对象大小无法确定；
-   使用 trait 对象时，总是使用引用的方式：
    -   虽然 trait 对象没有固定大小，但其引用类型的大小固定，它由两个指针组成，因此占两个指针大小；
    -   一个指针指向具体类型的实例；
    -   另一个指针指向一个 `vtable`，其中保存了实例可以调用的实现于 trait 上的方法。当调用方法时，将在运行时查找并调用，因此这种方式会牺牲一定的性能；
    -   trait 对象的引用方式有多种： `&dyn T`、`&mut dyn T`、`Box<dyn T>` 和 `Rc<dyn T>` 等。

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

`stu` 和 `tec` 变量分别是 `Student` 和 `Teacher` 类型，存储在栈上，`p1` 和 `p2` 是 `Person` 对象的引用，保存在栈上，该引用包含两个指针，`ptr` 指向具体类型的实例，`vptr` 指向 `vtable`。

`vtable` 是一个在运行时用于查找 trait 方法实现的数据结构。当创建一个动态分发的 trait 对象时，编译器会在程序的 `.rodata` 段上保存 `vtable`。

`vptr` 是在运行时进行查找的，从而允许动态地调用实现了特定 trait 的方法，但也因此会损失一定的性能。

在返回 trait 时，由于单态化的限制，只能返回确定的 trait，但通过动态分发，可以返回不确定的 trait。

```rust
fn get_person(swtich: bool) -> Box<dyn Person> {
    if swtich {
        Box::new(Student {
            name: "Alice".to_string(),
        })
    } else {
        Box::new(Teacher {
            name: "Bob".to_string(),
        })
    }
}
```

### trait 对象安全

只有对象安全的 trait 才可以组成 trait 对象，当 trait 中的函数或方法满足以下条件时才是对象安全的：

-   返回值类型不能为 `Self`：trait 对象在产生时，原来的具体类型会被抹去，因此返回一个 `Self` 并不能知道具体返回什么类型；

    ```rust
    // 错误，Clone 返回的是 Self
    fn foo(v: Box<dyn Clone>) {}
    ```

-   不能含有泛型参数：泛型类型在编译时会被单态化，而 trait 对象是运行时才被确定；

    ```rust
    trait Foo {
        fn foo<T>(&self) -> T;
    }

    // 错误，trait 方法含有泛型参数
    fn bar(v: Box<dyn Foo>) {}
    ```

-   不能拥有关联函数：因为无法知道在哪个实例上调用方法，即 trait 的函数参数必须接受 `&self`。

    ```rust
    trait Foo {
        fn foo();
    }
    
    // 错误，trait 含有关联函数
    fn bar(v: Box<dyn Foo>) {}
    ```

## trait 进阶

### 关联类型

**关联类型**是将类型占位符与 trait 相关联，这样 trait 函数或方法签名中就可以使用这些占位符。trait 的实现会指定相应的具体类型，这样就可定义使用多种类型的 trait。

如标准库中的 `Iterator`，含有一个 `Item` 的关联类型来替代遍历的值的类型。

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}
```

`Item` 是一个占位符类型，同时 `next` 方法定义表明它返回 `Option<Self::Item>` 类型的值。这个 trait 的实现会指定 `Item` 的具体类型。

对关联类型也可以施加约束：

```rust
// 两者等价
trait A {
    type B: Copy;
}

trait A where
    Self::B: Copy,
{
    type B;
}
```

关联类型和泛型很类似，但依然有些区别。如通过关联类型为 `Counter` 实现 `Iterator`：

```rust
struct Counter {
    count: usize,
}

impl Iterator for Counter {
    type Item = usize;

    fn next(&mut self) -> Option<Self::Item> {
        todo!()
    }
}
```

若用泛型来实现，假设 `Iterator` 是由泛型定义的：

```rust
pub trait Iterator<T> {
    fn next(&mut self) -> Option<T>;
}
```

那么为 `Counter` 就应该这样实现：

```rust
impl Iterator<usize> for Counter {
    fn next(&mut self) -> Option<usize> {
        todo!()
    }
}
```

当 trait 有泛型参数时，就可以通过改变泛型参数的具体类型来多次实现这个 trait，因为 `Counter` 还可以是其它类型。

```rust
impl Iterator<i64> for Counter {
    fn next(&mut self) -> Option<i64> {
        todo!()
    }
}

impl Iterator<u64> for Counter {
    fn next(&mut self) -> Option<u64> {
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

泛型和关联类型还可以结合使用，如一个 `max` 函数接受一个实现了 `IntoIterator` 的作为参数，返回其中的最大值。

```rust
fn max<T>(iter: T) -> T::Item
where
    T: IntoIterator,
    T::Item: Ord + Copy,
{
    let list: Vec<T::Item> = iter.into_iter().collect();
    let mut max = list[0];
    for &e in &list[1..] {
        if e > max {
            max = e;
        }
    }
    max
}

fn main() {
    let l1 = [5, 2, 3, 6, 4, 9];
    let l2 = vec![2, 4, 3, 6, 8, 1];
    println!("{}", max(l1));
    println!("{}", max(l2));
}
```

用于比较和返回的是 `IntoIterator` 的关联类型 `Item`， 因此对 `T` 和 `T::Item` 都做出 trait 约束。

### 默认泛型参数

当使用泛型参数时，可以指定一个默认的具体类型。若默认类型就足够的话，则无需为具体类型实现 trait。在声明泛型时通过使用 `<PlaceholderType = ConcreteType>` 的方式指定默认类型。

默认泛型参数多用于运算符重载，Rust 并不允许创建自定义运算符或重载任意运算符，但可以通过实现 `std::ops` 中的 trait 来进行运算符重载。

如在 `Point` 上实现 `Add` 来重载 `+` 运算符：

```rust
use std::ops::Add;

#[derive(PartialEq, Eq, Debug)]
struct Point(i32, i32);

impl Add for Point {
    type Output = Self;

    fn add(self, rhs: Self) -> Self::Output {
        Self(self.0 + rhs.0, self.1 + rhs.1)
    }
}

fn main() {
    let p1 = Point(1, 2);
    let p2 = Point(3, 4);
    assert_eq!(Point(4, 6), p1 + p2);
}
```

这里默认泛型类型位于 `Add` 中：

```rust
pub trait Add<Rhs = Self> {
    type Output;

    fn add(self, rhs: Rhs) -> Self::Output;
}
```

这是一个带有关联类型和方法的 trait，其中 `Rhs = Self` 为**默认类型参数**，用于定义 `add` 方法中的 `rhs` 参数。当实现 `Add` 时不指定 `Rhs` 的具体类型，`Rhs` 的类型将是默认的 `Self` 类型，也就是在其上实现 `Add` 的类型。

`Rhs` 和 `Output` 的关系为：`self` 是可以和很多类型进行相加操作的，但对于给定的两个类型，应该输出同样的类型，即对于类型为 `T` 的 `self`，当和类型 `S` 相加，其 `Output` 的类型也是固定的。

假设使用泛型来定义 `add` 方法：

```rust
pub trait Add {
    type Output;

    fn add<Rhs>(self, rhs: Rhs) -> Self::Output;
}
```

不能这样做的原因有两点：

-   无法给函数级别的泛型参数设置默认值；
-   即使能够设置，但没有提供类型的具体实现，无法在重载时获得信息。

要在实现 `Add` 时自定义 `Rhs` 类型而不使用默认类型，如实现一个能够将毫米与米相加，且 `Add` 的实现能正确处理转换，可以为 `Millis` 实现 `Add` 并以 `Meters` 作为 `Rhs`。

```rust
use std::ops::Add;

struct Millis(u32);
struct Meters(u32);

impl Add<Meters> for Millis {
    type Output = Millis;

    fn add(self, rhs: Meters) -> Self::Output {
        Millis(self.0 + (rhs.0 * 1000))
    }
}
```

为了使 `Millis` 和 `Meters` 能够相加，指定 `Add<Meters>` 来设定 `Rhs` 类型参数的值而不是使用默认的 `Self`。

默认参数类型主要用于：

-   扩展类型而不破坏现有代码；
-   在大部分不需要特定的情况进行自定义。

### 完全限定语法

两个 trait 可以声明相同的函数或方法，两个类型也可以同时实现同一个 trait，因此当调用这些同名方法时，需要明确使用哪一个。

`Pilot` 和 `Wizard` 都有方法 `fly`，接着在一个本身已经实现了名为 `fly` 方法的类型 `Human` 上实现这两个 trait，每一个 `fly` 方法都进行了不同的操作。

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

fn main() {
    let person = Human;
    person.fly();          // 输出 From Self
    Human::fly(&person);   // 输出 From Self
    Pilot::fly(&person);   // 输出 From Pilot
    Wizard::fly(&person);  // 输出 From Wizard
}
```

编译器会优先调用类型直接实现的方法，要调用 trait 上的方法，需要显式指定。因为 `fly` 方法获取一个 `self`，若有两个类型都实现了同一 trait，编译器可以根据 `self` 的类型计算出应该使用哪一个 trait 实现。实际上调用类型本身的方法等同于显式指定为实例本身的类型。

---

当 trait 中含有关联函数时，则无法传递 `self`，除非使用**完全限定语法**。

`Dog` 上实现了关联函数 `name`，也实现了 `Animal`。

```rust
trait Animal {
    fn name() -> String;
}

struct Dog;

impl Dog {
    fn name() -> String {
        String::from("Spot from Dog")
    }
}

impl Animal for Dog {
    fn name() -> String {
        String::from("puppy from Animal")
    }
}

fn main() {
    let dog = Dog::name();
    let animal = <Dog as Animal>::name();
    println!("{dog}");
    println!("{animal}")
}
```

同样编译器会优先调用类型直接实现的函数。若要调用 `Dog` 上 `Animal` 实现的 `name` 函数，则不能使用之前的方法：

```rust
// 错误
let dog = Animal::name();
```

因为 `Animal::name` 没有 `self` 参数，可能会有其它类型也实现了 `Animal`，因此编译器无法知道是哪个实现。

为了消歧义需要使用**完全限定语法**，来指定 `Dog` 上 `Animal` 实现中的 `name` 函数。：

```rust
let dog = <Dog as Animal>::name();
```

完全限定语法定义为：

```rust
<Type as Trait>::function(receiver_if_method, next_arg, ...);
```

对于关联函数，其没有 `receiver`，因此只会有其它参数。可以选择在任何函数或方法调用处使用完全限定语法，但可省略任何编译器能够从程序的其它信息中计算出的部分，只有当存在多个同名实现时才使用这个较为冗长的语法。

### 父 trait

定义 trait 时可以指定依赖的 trait：要为类型实现该 trait，这些依赖的 trait 也必须实现。

```rust
trait Foo: Clone + PartialEq {}

#[derive(Clone, PartialEq)]
struct Wrap(i32);

impl Foo for Wrap {}
```

`Wrap` 要实现 `Foo`，就必须实现 `Clone` 和 `PartialEq`。

父 trait 的写法实际上就是为 trait 施加约束：

```rust
// 两者等同
trait Circle: Shape {}

trait Circle where
    Self: Shape,
{}
```

### newtype

由于在实现 trait 时需要遵循**孤儿规则**，要绕开这个限制的方法是使用 **newtype**，即把外部类型封装起来。

如要在 `Vec` 上实现 `Display`，由于 `Display` 和 `Vec` 都定义于外部，所以创建一个包含 `Vec` 实例的 `Wrap` 结构体，然后就可以 `Wrap` 上实现 `Display` 并使用 `Vec` 的值。

```rust
use std::fmt::{self, Display};

struct Wrap(Vec<String>);

impl Display for Wrap {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

fn main() {
    let w = Wrap(vec!["foo".to_string(), "bar".to_string()]);
    println!("w = {}", w);
}
```

这样做的缺陷是，因为 `Wrap` 是一个新类型，所以原本被封装类型的方法都不能使用，但也可以隐藏内部细节，只向外提供 API。

### turbofish

如 `::<T, U>` 的形式为 **turbofish** 语法，通常在以下情况使用：

-   明确指定泛型类型时；
-   明确指定 trait 的关联类型时；
-   无法进行类型推断时。

```rust
trait ValueWrap {
    type Value1;
    type Value2;

    fn new(v1: Self::Value1, v2: Self::Value2) -> Self;
}

struct Holder<T, U> {
    value: (T, U),
}

impl<T, U> ValueWrap for Holder<T, U> {
    type Value1 = T;
    type Value2 = U;

    fn new(v1: Self::Value1, v2: Self::Value2) -> Self {
        Holder { value: (v1, v2) }
    }
}

fn wrap<T, U>(a: T, b: U) -> Vec<(T, U)> {
    vec![(a, b)]
}

fn main() {
    let h1 = Holder::new(1, 2);
    let h2: Holder<i32, u32> = Holder::new(1, 2);
    let h3 = Holder::<i32, u32>::new(1, 2);

    let v1 = wrap(1, 2);
    let v2: Vec<(i32, u32)> = wrap::<i32, u32>(1, 2);
    let v3 = wrap::<i32, u32>(1, 2);
}
```

其中 `h1` 和 `v1` 的类型为自动推断，`h2`、`h3` 与 `v2`、`v3` 则明确指定了关联类型和泛型参数类型。

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

### Debug 和 Display

`std::fmt::Debug`：格式化打印调试字符串。

```rust
#[derive(Debug)]
struct Person {
    name: String,
    age: u32,
}
```

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
-   `std::cmp::Eq`：完全相等关系。

```rust
#[derive(PartialEq, Eq)]
struct Point(i32, i32);
```

>   要实现 `Eq`，必须同时实现 `PartialEq`。

### PartialOrd 和 Ord

-   `std::cmp::PartialOrd`：部分顺序关系；
-   `std::cmp::Ord`：完全顺序关系。

```rust
#[derive(PartialOrd, Ord)]
struct Point(i32, i32);
```

>   要实现 `Ord`，必须同时实现 `PartialOrd`。

### Clone 和 Copy

-   `std::clone::Clone`：克隆语义；
-   `std::marker::Copy`：复制语义。

```rust
#[derive(Clone, Copy)]
struct Point(i32, i32);
```

>   要实现 `Copy`，必须同时实现 `Clone`。

### Iterator

`std::iter::Iterator`：定义迭代器。

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

fn main() {
    let c = Counter { count: 2 };
    for i in c {
        println!("{i}");
    }
}
```

### Hash

`std::hash::Hash`：可散列的类型。

实现了 `Hash` 的类型可通过 `Hasher` 的实例进行哈希化。如在 `HashMap<K, V>` 上存储数据，`Key` 就必须实现 `Hash`。

```rust
#[derive(PartialEq, Eq, Hash)]
struct Point(i32, i32);

let mut map = HashMap::new();
map.insert(Point(1, 2), 1);
```

>   -   要实现 `Hash`，必须同时实现 `PartialEq` 和 `Eq`；
>
>   -   若所有字段都实现了 `Hash`，则可通过 `derive` 派生 `Hash`，产生的 Hash 值将是在每个字段上调用 Hash 函数得到结果的组合。

### 运算符重载

Rust 中的操作符均为某个 trait 方法的语法糖，有一系列用于运算符重载的 trait，可以方便的为类型实现各种运算操作，如 `a + b` 表达式会在编译的过程中会被转换为 `a.add(b)`。

-   `std::ops::{Add, Sub, Mul, Div, Rem}`：重载加减乘除取余 `+` / `-` / `*` / `/` / `%`：

```rust
use std::ops::Add;

#[derive(PartialEq, Eq, Debug)]
struct Point(i32, i32);

impl Add for Point {
    type Output = Self;

    fn add(self, rhs: Self) -> Self::Output {
        Self(self.0 + rhs.0, self.1 + rhs.1)
    }
}

fn main() {
    let p1 = Point(1, 2);
    let p2 = Point(3, 4);
    assert_eq!(Point(4, 6), p1 + p2);
}
```

-   `std::ops::{Index, IndexMut}`：重载不可变和可变索引 `[]`：

```rust
use std::ops::Index;

enum Axis {
    X,
    Y,
}
struct Point(i32, i32);

impl Index<Axis> for Point {
    type Output = i32;

    fn index(&self, index: Axis) -> &Self::Output {
        match index {
            Axis::X => &self.0,
            Axis::Y => &self.1,
        }
    }
}

fn main() {
    let p = Point(1, 2);
    assert_eq!(2, p[Axis::Y]);
}
```

`std::ops::{Deref, DerefMut}`：重载不可变和可变的解引用 `*` / `.`：

```rust
use std::ops::Deref;

struct Wrap {
    value: i32,
}

impl Deref for Wrap {
    type Target = i32;

    fn deref(&self) -> &Self::Target {
        &self.value
    }
}

fn main() {
    let w = Wrap { value: -10 };
    assert_eq!(-10, *w);
    assert_eq!(10, w.abs())
}
```



>   更多关于运算符重载的 trait，可参考 [std::ops](https://doc.rust-lang.org/std/ops/index.html#traits)。

# 3 生命周期

## 生命周期作用

生命周期用于描述**引用**保持有效的作用域，主要作用是**避免悬垂引用**。外部变量 `outer` 借用了内部变量 `inner`，但内部作用域结束后，`inner` 的内存会被释放，此时再使用 `outer` 就会造成悬垂引用。

```rust
let outer;
{
    let inner = 5;
    outer = &inner;
}
outer;  // 错误
```

作用域越大，生命周期就越长。Rust 中有一个**借用检查器**，通过比较作用域来确保所有的借用都是有效的。

```rust
{
    let outer;            // ---------+ 'a
    {                     //          |
        let inner = 1;    // -+ 'b    |
        outer = &inner;   //  |       |
    }                     // -+       |
    outer;                //          |
}                         // ---------+
```

这里将 `outer` 和 `inner` 的生命周期分别标记为 `'a` 和 `'b`，借用检查器会比较这两个生命周期的长度，并发现 `outer` 拥有生命周期 `'a`，但借用了一个拥有生命周期 `'b` 的对象。由于 `inner` 比 `outer` 存在的时间更短，因此在使用 `outer` 时，其引用可能会失效。

```rust
{
    let x = 1;            // ----------+ 'a
    let y = &x;           // --+ 'b    |
    println!("{y}");      //   |       |
}                         // --+-------+
```

这里 `x` 的生命周期 `'a` 比 `y` 的生命周期 `'b` 要长，因此当 `x` 有效时，`y` 中的引用也肯定有效。

## 生命周期参数

### 生命周期定义

`longest` 接收两个引用作为参数，并返回其中一个。但这样无法通过编译，因为编译器并不知道将要返回的引用是来自 `x` 还是 `y`，也无法推断出参数与返回值之间生命周期的关系，因此无法确定返回的引用是否有效。

```rust
// 错误
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

大部分情况下生命周期是**隐式推断的**，对于无法推断的情况，需要显式标注生命周期参数。其描述了多个引用之间生命周期的关系，**而不影响其生命周期**，仅用于帮助借用检查器分析。

生命周期参数也是泛型参数，声明在 `<>` 中，以 `'` 开头且必须在类型参数和常量参数之前。在使用时，**每个生命周期参数都必须位于 `&` 之后**。

```rust
fn foo<'a, T>(x: &'a T, y: &'a T) -> &'a T {
    todo!()
}

&T            // 引用
&'a T         // 显式生命周期的不可变引用
&'a mut T     // 显式生命周期的可变引用
&'a &'b T     // 拥有生命周期 'a 的不可变引用，指向拥有生命周期 'b 的引用
```

### 生命周期含义

由于生命周期参数是用于描述多个引用之间的关系，因此对单个引用进行显式标注没什么实际意义。对于 `longest`，进行显式标注后则可以进行编译。

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

在函数签名中声明了生命周期 `'a`，并且对参数和返回值都标注了 `'a`，这表示这三者的生命周期至少具有 `'a` 的约束，因此 `'a` 实际上是代表这三者**生命周期的交集，即其中的最小值**。显式标注并不会改变生命周期，而是让借用检查器分析这些引用是否遵循了标注的约束来使用。

```rust
// 正确
let s1 = String::from("foo");
{
    let s2 = String::from("bar");
    let result = longest(s1.as_str(), s2.as_str());
    println!("{result}");
}
```

在这个例子中，`s1` 具有 `'a`，`s2` 具有 `'b`，`longest` 接收这两者的引用，因此 `result` 的生命周期与这两者中的最小值 `'b` 相同。在使用 `result` 时，借用检查器发现在 `'b` 内使用的，遵循了标注的约束，因此引用有效。

```rust
// 错误
let s1 = String::from("foo");
let result;
{
    let s2 = String::from("bar");
    result = longest(s1.as_str(), s2.as_str());
}
println!("{result}");
```

在这个例子中，`s1` 具有 `'a`，`result` 具有 `'r`，`s2` 具有 `'b`，`longest` 把一个 `'b` 的值赋给了 `result`。在使用 `result` 时，借用检查器发现并不在 `'b` 内使用，因此报错。

### 生命周期约束

泛型参数都可以添加约束，生命周期同样可以。

-   `T: 'a`：`T` 本身或其内部的包含的引用都至少具有 `'a` 的生命周期；

-   `T: 'a + U`：`T` 必须实现 `U`，且 `T` 本身或其内部包含的引用都至少具有 `'a` 的生命周期。

```rust
struct Ref<'a, T>(&'a T);
struct Ref2<'a, T: 'a>(&'a T);
```

-   `Ref ` 接收 `T` 的引用，`Ref` 本身和该引用都至少具有 `'a` 的生命周期；
-   `Ref2` 接收 `T` 的引用，`Ref2` 本身、该引用及其内部包含的引用都至少具有 `'a` 的生命周期。

### 生命周期转换

较长的生命周期可以转成一个较短的生命周期，转换可由编译器隐式推断，也可显式标注。实际上就是加上了另一个生命周期参数作为约束。如 `<'a: 'b, 'b>` 表示 `'a` 的至少和 `'b` 一样长。

```rust
// 若不对 'a 进行约束，则无法通过编译
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

## 结构体生命周期

结构体字段可以为引用类型：

```rust
// 缺少生命周期参数
struct User {
    name: &str
}
```

但这样不能通过编译，因为不能保证在 `User` 实例的生命周期中字段 `name` 的值始终有效，因此需要加上生命周期参数。

```rust
// User 实例和其字段至少具有 'a 的生命周期
struct User<'a> {
    name: &'a str,
}

// User2 实例的生命周期为 'a 和 'b 中的最小值
struct User2<'a, 'b> {
    name: &'a str,
    pass: &'b str,
}
```

### 实现中的生命周期

生命周期参数同样是泛型参数，并作为类型的一部分。当为带有生命周期的结构体进行实现时，也需要在 `impl` 后指定。

```rust
impl<'a> User<'a> {
    fn get_name(&self) -> &str {
        self.name
    }
}
```

实现中的生命周期根据标注的位置不同，可以相互独立：

```rust
impl<'a> User {
    fn get_name(&'a self) -> &'a str {
        &self.name
    }

    fn get_name2<'b>(&'b self) -> &'b str {
        &self.name
    }
}
```

`get_name` 方法的生命周期 `'a` 是与整个 `User` 实例的生命周期相关联的，而 `get_name2` 方法的生命周期 `'b` 只与特定方法调用的上下文相关联。

## 特殊生命周期

### 静态生命周期

静态生命周期 `'static` 表示在**整个程序运行期间**都有效。如字符串字面值被直接储存在二进制文件的只读区块中，因此所有的字符串字面值都隐式地具有 `'static` 生命周期。

```rust
let outer;
{
    let inner = "foo";
    outer = inner;
    outer = &inner; // 错误
}
println!("{outer}");
```

`inner` 虽然在离开作用域后会失效，但其指向的是字符串字面值，因此其类型为 `'static str`，该值赋给 `outer` 后其内存并不会一起被释放，因此 `outer` 的值一定有效。

但若获得的是一个 `&inner`，那么实际上是一个 `inner` 本身的引用，即 `outer` 会被推断为 `&&str` 类型，该引用会在作用域外失效（即使该引用所指向的字符串依旧有效），因此不能通过编译。

使用 `static` 创建的变量也同样具有 `'static` 生命周期：

```rust
static NUM: i32 = 10;
static mut MUT_NUM: i32 = 20;
```

>   `static` 变量可以声明为 `mut`，但只能在 `unsafe` 块中进行访问和修改。

---

要理解 `'static` 生命周期，需要区分类型和实例的生命周期。`'static` 生命周期通常关联于引用或借用，但也可以适用于类型。

-   **类型的 `'static` 资格**：当类型没有包含任何非 `'static` 引用字段时，该类型**能夠**拥有 `'static` 生命周期，但不代表类型的所有实例都具有 `'static` 生命周期；
-   **实例的生命周期**：类型的具体实例的生命周期是由其创建和存在的上下文决定的。即使类型具有 `'static` 的资格，其实例的生命周期仍然受限于被声明的作用域。
-   **`'static` 生命周期的实例**：要让具有 `'static` 资格的类型的实例拥有 `'static` 生命周期，需要在一个静态上下文中创建它，如声明为全局静态变量。

对于 trait 对象，若没有包含非 `'static` 的引用，则 **trait 对象隐式地具有 `'static` 生命周期**，因此 `Box<dyn T>` 和 `Box<dyn T + 'static>`是等价的。

```rust
struct Res<'a> {
    val: &'a str,
}

impl<'a> Res<'a> {
    fn new(val: &'a str) -> Self {
        Res { val }
    }
}

struct Wrap<'a> {
    name: &'a str,
    callback: Option<Box<dyn Fn(&str) -> Res>>,
}

impl<'a> Wrap<'a> {
    fn new(name: &'a str) -> Self {
        Self {
            name,
            callback: None,
        }
    }

    // 错误
    fn set(&mut self, f: impl Fn(&str) -> Res) {
        self.callback = Some(Box::new(f));
    }
}

fn main() {
    let mut wrap = Wrap::new("foo");

    wrap.set(|val| {
        println!("callback: {val}");
        Res::new(val)
    });

    if let Some(f) = wrap.callback {
        println!("res: {}", f(wrap.name).val);
    }
}
```

`set` 方法有错误，是因为在 `Wrap` 的 `callback` 中，有一个 trait 对象，因此实际上是一个具有 `'static` 生命周期的闭包。

```rust
// 等同于
struct Wrap<'a> {
    name: &'a str,
    callback: Option<Box<dyn Fn(&str) -> Res + 'static>>,
}
```

闭包的特殊之处是可以捕获环境的值，而一个 `'static` 闭包捕获的值不一定具有 `'static` 生命周期。

```rust
// 无捕获值，依然是 'static 闭包，正确
w.set(|val| {
    println!("callback: {val}");
    Res::new(val)
});

// 有捕获值，local 不是 'static，那么闭包也不再是 'static，错误
let local = String::from("local");

w.set(|val| {
    println!("callback: {val}");
    println!("local: {local}");
    Res::new(val)
});

// 将捕获值 move 进闭包中，依然是 'static 闭包，正确
let local = String::from("local");

w.set(move |val| {
    println!("callback: {val}");
    println!("local: {local}");
    Res::new(val)
});
```

若必须捕获环境值的引用，那么只能给闭包标注一个新的生命周期：

```rust
struct Wrap<'a, 'b> {
    name: &'a str,
    callback: Option<Box<dyn Fn(&str) -> Res + 'b>>,
}

impl<'a, 'b> Wrap<'a, 'b> {
    fn new(name: &'a str) -> Self {
        Self {
            name,
            callback: None,
        }
    }

    fn set(&mut self, f: impl Fn(&str) -> Res + 'b) {
        self.callback = Some(Box::new(f));
    }
}
```

这样一来就复杂了许多，且 `local` 必须放在 `wrap` 前面：

```rust
// 正确
let local = String::from("local");
let mut wrap = Wrap::new("foo");

// 错误
let mut wrap = Wrap::new("foo");
let local = String::from("local");
```

这是因为在最后进行析构时，变量是按照创建的逆序进行析构的。如果将 `local` 后面，那么 `local` 会先进行析构，此时 `wrap` 依旧持有 `local` 的引用，在进行 `drop` 时可能会有操作其持有数据的可能性，那么引用就失效了。

### 匿名生命周期

在**函数或实现**中使用生命周期参数时，若能够被编译器自动推断，则无需显式标注，这些生命周期会被自动赋予匿名生命周期 `'_`，实际上这也是一种生命周期省略。匿名生命周期可以简化代码，避免大量的显式标注，提高可读性。

如对 `Wrap` 的实现进行显式标注：

```rust
struct Wrap<'a>(&'a str);

impl<'a> Wrap<'a> {
    fn new(s: &'a str) -> Wrap<'a> {
        Wrap(s)
    }
}
```

实现中的 `'a` 是能够被自动推断的，使用 `'_` 表示在此处使用省略的生命周期，并明确 `Wrap` 包含一个引用。

```rust
impl Wrap<'_> {
    fn new(s: &str) -> Wrap<'_> {
        Wrap(s)
    }
}
```

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

## 生命周期省略

在 Rust 的早期版本中，即使借用检查器可以推断出每个引用的生命周期，也必须显式标注：

```rust
fn foo<'a>(s: &'a str) -> &'a str {
    todo!()
}
```

在一些情况下生命周期是符合一定的模式的，能够被自动推断，因此实际上不需要显式标注。这些能够被自动推断的模式规则被写进了编译器中，称为**生命周期省略规则**。

### 省略规则

省略规则基于两个核心概念：

1.  **输入**生命周期：函数或方法中为引用的参数的生命周期；

2.  **输出**生命周期：作为返回值的引用的生命周期。

基于这两个概念，含有三条规则，第一条针对输入生命周期，后两条针对输出生命周期：

1.  所有为引用的参数都有自己的生命周期参数；
2.  若只有一个输入生命周期参数，那么所有输出生命周期参数与它相同；
3.  若有多个输入生命周期参数且第一个参数为 `&self` 或 `&mut self`，那么所有输出生命周期参数与它相同。

省略规则并不提供完整的推断：若编译器在明确遵循这些规则的前提下仍然不能推断出所有引用的生命周期，那么就会报错，这时就需要手动标注。

### 实际用例

第一个例子：

```rust
fn foo(s: &str) -> &str {
    todo!()
}
```

输入生命周期对应规则一，函数签名相当于：

```rust
fn foo<'a>(s: &'a str) -> &str;
```

输出生命周期对应规则二，函数签名相当于：

```rust
fn foo<'a>(s: &'a str) -> &'a str;
```

这样函数签名中所有的引用都被推断出了生命周期，因此可以不用手动标注。

---

第二个例子：

```rust
fn bar(x: &str, y: &str) -> &str {
    todo!()
}
```

对应规则一，函数签名相当于：

```rust
fn bar<'a, 'b>(x: &'a str, y: &'b str) -> &str;
```

由于有多个输入生命周期参数，因此规则二不适用。同时也不是一个方法，因此规则三也不适用。编译器使用了已知的省略规则，仍不能推断出签名中所有引用的生命周期，因此会报错，需要手动标注。

---

第三个例子：

```rust
struct Wrap<'a>(&'a str);

impl<'a> Wrap<'a> {
    fn ret_longest(&self, rhs: &Self) -> &str {
        if self.0.len() > rhs.0.len() {
            self.0
        } else {
            rhs.0
        }
    }
}
```

对应规则一，方法签名相当于：

```rust
fn ret_longest<'a, 'b>(&'a self, rhs: &'b Self) -> &str;
```

由于有多个输入生命周期参数，且第一个参数为 `&self`，因此适用于规则三，方法签名相当于：

```rust
fn ret_longest<'a, 'b>(&'a self, rhs: &'b Self) -> &'a str;
```

这样函数签名中所有的引用都被推断出了生命周期，同样可以不用手动标注。

---

第四个例子，将上面 `ret_longest` 中 `rhs` 的类型从 `&Self` 改成 `&str` 后会报错：

```rust
// 错误
impl<'a> Wrap<'a> {
    fn ret_longest(&self, rhs: &str) -> &str {
        if self.0.len() > rhs.len() {
            self.0
        } else {
            rhs
        }
    }
}
```

在上个例子中，当 `rhs` 为 `&Self` 时，实际上就是 `Wrap<'a>`，因此其生命周期和 `&self` 是一致的，实际上方法签名相当于：

```rust
fn ret_longest<'a>(&'a self, rhs: &'a Self) -> &'a str;
// 或
fn ret_longest<'a, 'b: 'a>(&'a self, rhs: &'b Self) -> &'a str;
```

这样在所有的生命周期都被推断出来的同时，实际返回的引用也符合所标注的生命周期，因此编译通过。

当 `rhs` 的类型变为 `&str` 后，方法签名相当于：

```rust
fn ret_longest<'a, 'b>(&'a self, rhs: &'b str) -> &'a str;
```

由于`rhs` 的生命周期不能保证和 `&self` 一致，所以即使符合省略规则，但实际返回的引用并不符合标注的生命周期。这并不是省略规则有问题，而是借用检查器根据方法签名中的生命周期参数，检查后发现实际返回的引用是不合规的，因此才会报错。

要通过编译，要么让实际返回的引用与自动推断出来的一致，要么手动标注实际的生命周期：

```rust
// 方式一，让实际返回的引用与推断出来的一致
impl<'a> Wrap<'a> {
    fn ret_longest(&self, rhs: &str) -> &str {
        self.0
    }
}

// 方式二，手动标注，让 rhs 和 &self 生命周期一致
impl<'a> Wrap<'a> {
    fn ret_longest(&self, rhs: &'a str) -> &str {
        if self.0.len() > rhs.len() {
            self.0
        } else {
            rhs
        }
    }
}

// 方式三，手动标注，让 rhs 和返回值的生命周期一致
impl<'a> Wrap<'a> {
    fn ret_longest<'b: 'a>(&self, rhs: &'b str) -> &str {
        if self.0.len() > rhs.len() {
            self.0
        } else {
            rhs
        }
    }
}
```

## 子类型化和型变

生命周期被用来追踪借用和所有权，但是严格按照保守的生命周期实现可能过于严格。

```rust
fn foo<'a>(x: &'a str, y: &'a str) {
    println!("a = {x} b = {y}");
}

fn main() {
    let outer = "foo";  // 'static
    {
        let inner = &String::from("bar"); // 'a
        foo(outer, inner);
    }
}
```

`foo` 期望接收两个具有相同生命周期的参数，若在一个保守的生命周期实现中，传递给 `foo` 的参数的生命周期是不一样的，可能就会报错。

为了实现对生命周期的灵活使用，Rust 使用**子类型化**和**型变**。

### 子类型化

泛型参数 `T: U` 的含义：

-   `T` 是 `U` 的子类型，`U` 是 `T` 的父类型；
-   任何使用 `U` 的地方，都能够使用 `T`。

对于生命周期这种泛型，`'a: 'b` 的含义：

-   `'a` 是 `'b` 的子类型，任何使用 `'b` 的地方，都能够使用 `'a`；
-   `'a` 可当做 `'b` 去使用，因为 `'a` 的生命周期至少和 `'b` 一样长。

当把 `T: U` 中的 `T` 当作 `U` 去使用时，称作**子类型化**。Rust 中的子类型化的适用范围仅限于生命周期和型变，子类型化是隐式的，可出现在类型检查或类型推断中。

对于上面这段代码，在进行子类型化后，`foo` 虽然期望接收两个 `'a` 的参数，但是 `'static` 比 `'a` 更长，因此 `&'static str` 是 `&'a str` 的子类型，`outer` 在传递时，会被子类型化为 `&'a str`。

高阶函数指针和 trait 对象也可以子类型化：

```rust
// 'a 被替换成了 'static
let sub: &(for<'a> fn(&'a str) -> &'a str) = &((|x| x) as fn(&_) -> &_);
let super: &(fn(&'static str) -> &'static str) = sub;

// trait 对象也是类似的
let sub: &(dyn for<'a> Fn(&'a str) -> &'a str) = &|x| x;
let super: &(dyn Fn(&'static str) -> &'static str) = sub;

// 使用高阶生命周期来代替另一个
let sub: &(for<'a, 'b> fn(&'a str, &'b str)) = &((|x, y| {}) as fn(&_, &_));
let super: &for<'c> fn(&'c str, &'c str) = sub;
```

### 型变

`'static` 是 `'a` 的子类型暗示了 `&'static T` 是 `&'a T` 的子类型，这实际上是一种型变。

**型变**是通过泛型参数来定义引用之间子类型关系的概念，设 `F<T>` 是 `T` 的类型构造器：

-   若 `T` 是 `U` 的子类型，且 `F<T>` 是 `F<U>` 子类型，则称 `F<T>` 在 `T` 上是**协变的**；
-   若 `T` 是 `U` 的子类型，且 `F<U>` 是 `F<T>` 的子类型，则称 `F<T>` 在 `T` 上是**逆变的**；
-   若不能由参数类型的子类型化关系推断出泛型的型变关系，则称 `F<T>` 在 `T` 上是**不变的**。

类型的型变关系由下表中的规则自动确定：

| 类型                         | 在 `'a` 上的型变 | 在 `T` 上的型变 | 在 `U` 上的型变 |
| ---------------------------- | ---------------- | --------------- | --------------- |
| `&'a T`                      | 协变             | 协变            |                 |
| `&'a mut T`                  | 协变             | 不变            |                 |
| `dyn T + 'a`                 | 协变             | 不变            |                 |
| `*const T`                   |                  | 协变            |                 |
| `*mut T`                     |                  | 不变            |                 |
| `[T]` 和 `[T; n]`            |                  | 协变            |                 |
| `fn(T) -> U`                 |                  | 逆变            | 协变            |
| `Box<T>` 和 `Vec<T>`         |                  | 协变            |                 |
| `UnsafeCell<T>` 和 `Cell<T>` |                  | 不变            |                 |
| `PhantomData<T>`             |                  | 协变            |                 |

下面这段代码不能编译：

```rust
fn assign<T>(input: &mut T, val: T) {
    *input = val;
}

fn main() {
    let mut outer = "foo";               // 'static
    {
        let inner = String::from("bar"); // 'a
        assign(&mut outer, &inner);
    }
    println!("{outer}"); // 错误
}
```

将值赋给同一类型是可以的，因此 `assign` 的实现没有错误，但问题在于外部作用域使用了内部作用域创建的值，这会导致 UAF 错误。深入分析可以发现传递了两个参数，分别是 `&mut &'static str` 和 `&'a str`，由于 `&mut T` 在 `T` 上是不变的，所以不能对第一个参数进行子类型化，因此 `T` 必须是 `&'static str`。

Rust 中的逆变非常少，仅用于函数参数，对于 `fn(T) -> U`：

```rust
fn store_get_str<'a>(s: &'a str) -> &'a str;
fn store_get_static(s: &'static str) -> &'static str;
```

对参数类型 `T`，`&'static str` 是 `&'a str` 的子类型，但对于函数来说，一个接收 `&'static str` 作为参数的函数，也可以接收 `&'a str` 作为参数，因此函数在 `T` 上是一个逆变，但是对返回值类型 `U`，一个返回 `&'a str` 函数也可以返回 `&'static str`，因此函数在 `U` 上是一个协变。

---

结构体、枚举、联合体和元组类型的型变关系是通过其字段类型的型变关系来决定的，如结构体 `Foo` 有一个泛型参数 `T`，且在字段 `a` 中使用了 `T`，那么 `Foo` 对 `T` 的型变与 `a` 对 `T` 的型变完全相同。

然而当 `T` 被多个字段使用时：

-   若 `T` 所有使用的位置都是协变的，则 `Foo` 在 `T` 上是协变的；
-   若 `T` 所有使用的位置都是逆变的，则 `Foo` 在 `T` 上是逆变的；
-   否则，`Foo` 在 `T` 上是不变的。

```rust
use std::cell::Cell;

struct Foo<'a, 'b, A: 'a, B: 'b, C, D, E, F, G, H, In, Out, Mix> {
    a: &'a A,           // 对 'a 和 A 是协变的
    b: &'b mut B,       // 对 'b 是协变的，对 B 是不变的

    c: *const C,        // 对 C 是协变的
    d: *mut D,          // 对 D 是不变的

    e: E,               // 对 E 是协变的
    f: Vec<F>,          // 对 F 是协变的
    g: Cell<G>,         // 对 G 是不变的

    h1: H,              // 本来对 H 是协变的
    h2: Cell<H>,        // 最终对 H 是不变的

    i: fn(In) -> Out,   // 对 In 是逆变的，对 Out 是协变的

    j1: fn(Mix),        // 本来对 Mixed 是逆变的
    j2: Mix,            // 最终对 Mixed 是不变的
}
```

>   更多有关子类型化和型变的信息，可参考 [Rust 秘典](https://nomicon.purewhite.io/subtyping.html) 和 [Rust 参考手册](https://minstrel1977.gitee.io/rust-reference/subtyping.html)。

## 深入生命周期

### 参数与返回值的关联性

生命周期主要目的是为了将函数参数和返回值进行关联，标注后编译器就有了足够的信息来检查并阻止像悬垂引用这类违反内存安全的行为。

如 `ret_x` 只会返回 `x`，因此返回值仅与 `x` 有关联，因此这里 `y` 的生命周期就无关紧要。

```rust
fn ret_x<'a>(x: &'a str, y: &str) -> &'a str {
    x
}
```

若返回的引用没有与任何参数关联，那么可能指向函数内部创建的值。

```rust
// 错误，悬垂引用
fn ret_str<'a>() -> &'a str {
    let s = String::from("foo");
    &s
}

// 错误，需显式标注
fn ret_static_str() -> &str {
    let s = "bar";
    s
}

fn ret_len(s: &str) -> usize {
    s.len()
}
```

`ret_str` 和 `ret_static_str` 都不能通过编译，因为所有省略规则都不适用，因此必须手动标注。而 `ret_len` 的输入生命周期可以根据规则一推断出，返回值不是引用，因此没有输出生命周期。

对于 `ret_str` 即使手动标注了生命周期，也无法通过编译，因为 `s` 所指向的堆内存在函数返回后就被回收了，这会造成悬垂引用。生命周期参数只是用来给编译器检查实际传递的值是否符合约束条件，无法改变生命周期。

```rust
// 依旧错误
fn ret_str<'a>() -> &'a str;
```

对于 `ret_static_str`，`s` 是一个字符串字面值，因此具有 `'static` 生命周期，由于函数在返回值上是协变的，因此可以手动标注 `'static` 或者 `'a`。

```rust
fn ret_static_str() -> &'static str;
// 或
fn ret_static_str<'a>() -> &'a str;
```

### 永久借用

```rust
struct User<'a> {
    name: &'a str,
}

impl<'a> User<'a> {
    fn borrow(&'a self) -> &'a str {
        self.name
    }

    fn borrow_forever(&'a mut self) -> &'a str {
        self.name
    }
}

fn main() {
    let mut u = User { name: "foo" };
    u.borrow_forever();
    u.borrow(); // 错误
}
```

`borrow` 和 `borrow_forever` 最终都只是进行了不可变借用，根据借用规则，不可变借用可以同时存在，但是这里却报错。即使把 `borrow_forever` 看作可变借用，但是借用只会持续到最后一次使用为止，那么 `borrow` 应该也能进行不可变借用，但实际上这时 `u` 依然被可变借用了。

这是因为 `borrow_forever` 发生了**永久借用**。当看到像 `&'a mut T<'a>` 这种声明，就代表是一个永久借用，因为这代表永远借用自己：被借用的对象生命周期为 `'a`，而借用也同样为 `'a`。因此该可变借用在 `T<'a>` 的生命周期中一直存在，那么根据借用规则，存在一个可变借用，自然就不再允许其它借用了。

`borrow` 实际上接收 `&'a User<'a>`，而 `&'a` 对 `'a` 是协变的， `User<'a>` 对 `'a` 是也协变的，因此先变成 `&'a User<'b>`，最后对 `'a` 再变成 `&'b User<'b>`，这样就变成了临时借用。

`borrow_forever` 实际上接收 `&'a mut User<'a>`，虽然 `&'a` 对 `'a` 是协变的，但是对 `User<'a>` 是不变的，因此生命周期没有缩短，最终变成了永久借用。

要避免这种情况，只需要手动标注 `&'b mut T`：

```rust
fn borrow_forever<'b>(&'b mut self) -> &'a str {
    self.name
}
```

### 高阶 trait 约束

要描述闭包 trait 约束上的生命周期就有些复杂，如下对 `F` 的约束就无法通过添加泛型参数来标注：

```rust
struct Closure<F> {
    args: (String, String),
    func: F,
}

impl<F> Closure<F>
// where F: Fn<?>(&? str, &? str) -> &? str
where F: Fn(&str, &str) -> &str,
{
    fn call(&self) -> &str {
        (self.func)(&self.args.0, &self.args.1)
    }
}
```

`Fn` 是一个 trait，无法使用 `<'a>` 来标注生命周期参数，且对于闭包而言，每一个闭包都是一个单独的类型，传入闭包的生命周期是不固定的。

要描述这样的生命周期，需要用到高阶 trait 约束（Higher-Ranked Trait Bound，HRTB），HRTB 主要用在接收函数指针或闭包的函数中。

```rust
for<'a> F: Fn(&'a str, &'a str) -> &'a str
// 或
F: for<'a> Fn(&'a str, &'a str) -> &'a str
```

`for<'a>` 表示 `call` 可以接受**任何**生命周期 `'a` 的引用，即无论 `self` 中引用的生命周期是什么，`call` 都能正确处理。

```rust
fn get_fn1(f: for<'a> fn(&'a str, &'a str) -> &'a str) {
    todo!()
}

fn get_fn2<'a>(f: fn(&'a str, &'a str) -> &'a str) {
    todo!()
}
```

-   `get_fn1` 使用 HRTB，`f` 可以接受**任何**生命周期 `'a` 的引用，这使其更加灵活，处理不同长度引用的函数指针或闭包都可以传递给 `get_fn1`；
-   `get_fn2` 在函数本身上声明了生命周期参数 `'a`。这意味着传递给 `get_fn2` 的函数必须能够接受**特定**生命周期 `'a` 的引用。这里的 `'a` 是由 `get_fn2` 的调用者确定的，因此所有涉及的引用都必须具有相同的生命周期。

对于包含生命周期的闭包对象，也需要使用 HRTB：
```rust
let clo: &dyn for<'a> Fn(&'a str) -> &'a str = &|s: &str| s;
```

