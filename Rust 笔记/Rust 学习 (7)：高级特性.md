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

