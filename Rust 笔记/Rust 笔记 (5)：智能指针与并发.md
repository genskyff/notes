# 1 智能指针

**指针**是一个包含内存地址的变量，这个地址指向内存中的其它数据。**引用是一种指针**，除了引用数据外没有其他功能，但也没有额外开销。

**智能指针**是一类数据结构，和指针类似，但拥有额外的元数据和功能。引用和智能指针的一个额外的区别是**引用为一类只借用数据的指针，但智能指针通常拥有所指向数据的所有权**。

实际上 `String` 和 `Vec<T>` 就是智能指针，因为它们拥有数据并允许修改，同时也带有元数据（原始指针、长度和容量）和额外的功能或保证（如 `String` 的数据总是有效的 UTF-8 编码）。

智能指针通常使用结构体实现，并实现了 `Deref` 和 `Drop` trait。`Deref` trait 重载了 `*` 运算符，允许智能指针实例可以像引用一样使用。`Drop` trait 允许自定义当智能指针离开作用域时运行的代码。

## Box

最简单的智能指针是 `Box`，其类型是 `Box<T>`。 Box 可以将一个值放在堆上而不是栈上，留在栈上的则是指向堆数据的指针。

>   Box 只提供了间接存储和堆分配，并没有任何其他的功能，因此几乎没有性能损失。

通常用于以下场景：

-   编译时大小未知但又需要在确切大小的上下文中使用的类型；
-   在确保数据不被拷贝的情况下转移所有权；
-   需要拥有一个值并确保是否实现了特定 trait。

### 使用 Box

```rust
let x = Box::new(3);
println!("{x}");
```

`x` 的值是一个指向被分配在堆上的 Box。可以像数据是储存在栈上那样访问其中的数据。当离开作用域时，栈和堆上的数据都将被释放。

### 创建递归类型

Rust 需要在编译时知道类型占用多少空间。一种无法在编译时知道大小的类型是**递归类型**，其值的一部分可以是相同类型的另一个值。通过在类型定义中插入 Box，就可以创建递归类型。

**Cons List** 是一种数据结构，每一项都包含两个元素：当前项的值和下一项，其最后一项包含 `Nil` 值表示结束。

```rust
// 错误
enum List {
    Cons(i32, List),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let list = Cons(1, Cons(2, Cons(3, Nil)));
}
```

这样定义会报错，因为 `List` 是递归的，因此无法在编译时计算出大小。

![无限大小的 Cons](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202204261452079.png)

### 非递归类型的大小

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}
```

`Message::Quit` 并不需要任何空间，`Message::Move` 需要两个 `i32` 值的空间，依此类推。因为 enum 实际上只会使用其中的一个成员，所以 `Message` 值所需的空间等于储存其最大成员的大小。

### 改用 Box

因为 Box 是一个指针，所以大小是固定的。将 Box 放入 `Cons` 成员中而不是直接存放另一个 `List` 值。Box 会指向另一个位于堆上的 `List` 值，而不是存放在 `Cons` 成员中。

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

`Cons` 成员需要一个 `i32` 的大小加上储存 Box 指针数据的空间。`Nil` 成员不储存值，所以它比 `Cons` 成员需要更少的空间。通过使用 Box ，编译器就能够计算出储存 `List` 值需要的大小了。

![使用 Box 存储](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202204261550930.png)

## Deref 和 Drop trait

`Box<T>` 类型之所以是一个智能指针，因为它实现了 `Deref` 和 `Drop` trait。

### 将智能指针当作引用

实现 `Deref` trait 允许重载解引用运算符 `*`。智能指针可以被当作常规引用来对待，可以编写操作引用的代码并用于智能指针。

```rust
let x = 5;
let y = &x;
assert_eq!(5, x);
assert_eq!(5, *y);
```

`x` 存放了一个 `i32` 值，`y` 为 `x` 的引用。可以断言 `x` 等于 `5`，但若对 `y` 的值做出断言，必须使用 `*` 来解引用。

```rust
let x = 5;
let y = Box::new(x);
assert_eq!(5, x);
assert_eq!(5, *y);
```

将 `y` 设置为一个指向 `x` 值拷贝的 Box 实例，同样可以使用解引用运算符来获取 `x` 的值，这是因为实现了 `Deref` trait。

### 自定义智能指针

```rust
struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> Self {
        Self(x)
    }
}

fn main() {
    let m = MyBox::new(1);
    assert_eq!(1, *m);     // 错误
}
```

定义了一个元组结构体 `MyBox` 并声明了一个泛型参数 `T`。`MyBox::new` 函数获取一个 `T` 类型的参数并返回一个存放传入值的 `MyBox` 实例。

### 实现 Deref trait

`MyBox<T>` 类型还不能解引用，为了使用 `*` 运算符的解引用功能，需要实现 `Deref` trait。

```rust
use std::ops::Deref;

impl<T> Deref for MyBox<T> {
    type Target = T;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
```

-   `Deref` trait 要求实现名为 `deref` 的方法，其借用 `self` 并返回一个内部数据的引用；

-   `type` 语法定义了用于此 trait 的关联类型；

-   `deref` 方法返回 `&self.0`。

没有 `Deref` trait 的话，编译器只会解引用 `&` 引用类型。`deref` 方法向编译器提供了获取任何实现了 `Deref` trait 的类型的值，并且调用这个类型的 `deref` 方法来获取一个解引用值。

编译器实际上在底层运行了以下代码：

```rust
*(m.deref())
```

每次在代码中使用 `*` 时， 都被替换成了先调用 `deref` 方法再接着使用 `*` 解引用的操作，且只会发生一次，不会对 `*` 运算符进行递归替换，解引用出上面 `i32` 类型的值就停止了。

#### 隐式 Deref 强制转换

**Deref 强制转换**是在**函数或方法传参**上的一种便利。只能作用于实现了 `Deref` trait 的类型，它将一个类型的引用转换为另一个类型的引用，如可以将 `&String` 转换为 `&str`，因为 `String` 实现了 `Deref` trait，因此可以返回 `&str`。当这种特定类型的引用作为实参传递给与形参类型不符的函数或方法时，**Deref 强制转换将自动发生**。这时会有一系列的 `deref` 方法被调用，把实参转换成符合形参的类型。

```rust
fn main() {
    let s = MyBox::new(String::from("hello"));
    hello(&s);
}

fn hello(s: &str) {
    println!("{}", s);
}
```

`&s` 是一个 `MyBox` 的引用，但由于与 `hello` 函数的形参不符，因此 Deref 强制转换自动发生，被转换为 `&String`，但 `String` 在标准库中也实现了 `Deref` trait，因此再次被强制转换为 `&str`，此时参数就符合函数签名了。

若没有 Deref 强制转换，为了达到同样的效果，需要使用以下代码：

```rust
hello(&(*s)[..]);
```

`s` 先被解引用为 `String`，然后再获取字符串 slice。Deref 强制转换使得在进行函数和方法调用时无需过多显式使用 `&` 和 `*`。

### DerefMut trait

类似使用 `Deref` trait 重载不可变引用的 `*` 运算符，`DerefMut` trait 用于重载可变引用的 `*` 运算符，只需要实现 `deref_mut` 方法，且在实现 `DerefMut` 前必须先实现 `Deref` trait。

```rust
use std::ops::DerefMut;

impl<T> DerefMut for MyBox<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

fn main() {
    let mut x = MyBox::new(5);
    *x = 1;
    assert_eq!(1, *x);
}
```

>   由于 `Deref` trait 已经定义了关联类型，因此在 `DerefMut` 中无需再定义。

类型和 trait 实现满足三种情况时会进行 Deref 强制转换：

-   当 `T: Deref<Target=U>` 时从 `&T` 到 `&U`；
-   当 `T: DerefMut<Target=U>` 时从 `&mut T` 到 `&mut U`；
-   当 `T: Deref<Target=U>` 时从 `&mut T` 到 `&U`。

>   可以将可变引用强制转换为不可变引用，反之则不行。

### 实现 Drop trait

智能指针还有一个重要的 trait 是 `Drop`，允许值在离开作用域时执行一些代码。`Drop` trait 几乎总是用于实现智能指针，如当 `Box<T>` 被丢弃时会释放 Box 指向的堆空间。

指定值在离开作用域时应该执行的代码的方式是实现 `Drop` trait，它要求实现 `drop` 方法，其获取一个 `&mut self` 作为参数。

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
        data: String::from("hello"),
    };
    let s2 = MyString {
        data: String::from("world"),
    };
    println!("ok");
}
```

执行结果：

```
ok
world
hello
```

在 `MyString` 上实现了 `Drop` trait，并提供了一个调用 `println!` 的 `drop` 方法实现。`drop` 方法会在类型实例离开作用域时被自动调用，且调用的顺序与创建变量的顺序相反。

#### 使用 drop 函数

不能直接调用实例上的 `drop` 方法，只能在离开作用域时由编译器自动调用，否则会导致**二次释放**。若要在作用域结束之前就强制释放变量，如在多线程中提前释放锁以供其它代码调用，则可使用标准库中的 `std::mem::drop` 函数。

```rust
let s1 = MyString {
    data: String::from("hello"),
};
s1.drop();    // 错误
drop(s1);     // 正确
```

`drop` 是一个析构函数，编译器会确保值不再被使用时只释放一次。

## Rc

有时一个值可能会有多个所有者，如在图数据结构中，多个边可能指向相同的节点，这个节点被所有指向它的边拥有，直到没有任何边指向它之前都不应该被清理。

Rust 的所有权规则决定了一个值有且只有一个所有者，为了模拟多所有权，需要使用 `Rc<T>` 类型，该类型使用**引用计数**来记录一个值引用的数量。若某个值有零个引用，就代表没有任何有效引用并可以被清理。

`Rc<T>` 主要用于在堆上分配一些内存供程序的多个部分读取，且无法在编译时确定程序的哪一部分会最后使用。

>   `Rc<T>` 是**非原子**性的，因此只能用于**单线程**场景。

### 使用 Rc 共享数据

![共享 List](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202204291124165.png)

列表 `b` 和 `c` 共享列表 `a` 的所有权，若使用 Box 则不能工作，因为 `a` 的所有权已经移动到 `b`，因此 `c` 不能再获得 `a` 的所有权。

```rust
let a = Cons(5, Box::new(Cons(10, Box::new(Nil))));
let b = Cons(3, Box::new(a));    // a 的所有权移动到 b
let c = Cons(4, Box::new(a));    // 错误
```

可以修改 `Cons` 的定义来存放一个引用，但必须指定生命周期参数，这样代码就会变得很复杂，更好的方法是使用 `Rc<T>` 代替 `Box<T>`。

```rust
use std::rc::Rc;

enum List {
    Cons(i32, Rc<List>),
    Nil,
}

use self::List::{Cons, Nil};

fn main() {
    let a = Rc::new(Cons(5, Rc::new(Cons(10, Rc::new(Nil)))));
    let b = Cons(3, Rc::clone(&a));
    let c = Cons(4, Rc::clone(&a));
}
```

每一个 `Cons` 变量都包含一个值和一个指向 `List` 的 `Rc<T>`。创建 `a` 时，引用计数为 1。创建 `b` 时，会克隆 `a` 所包含的 `Rc<List>`，引用计数变为 2 并允许 `a` 和 `b` 共享 `Rc<List>` 中数据的所有权。创建 `c` 时也会克隆 `a`，引用计数变为 3。即每次调用 `Rc::clone` 函数，`Rc<List>` 中数据的引用计数都会增加，引用计数在减少到 0 之前其数据都不会被清理。

也可以调用 `a.clone()` 而不是 `Rc::clone(&a)`，在 Rc 中这两者没有区别，都是只在栈上拷贝一个指向堆数据的 `Rc<T>` 并增加引用计数，并不会进行堆上的拷贝，为了避免与实例本身的方法混淆，习惯使用 `Rc::clone` 函数。

### 引用计数

```rust
let a = Rc::new(Cons(5, Rc::new(Cons(10, Rc::new(Nil)))));
println!("a.count = {}", Rc::strong_count(&a));
let b = Cons(3, Rc::clone(&a));
println!("a.count = {}", Rc::strong_count(&a));
{
    let c = Cons(4, Rc::clone(&a));
    println!("a.count = {}", Rc::strong_count(&a));
}
println!("a.count = {}", Rc::strong_count(&a));
```

执行结果：

```
a.count = 1
a.count = 2
a.count = 3
a.count = 2
```

`Rc::strong_count` 函数可以获得强引用计数，每次调用计数会增加 1。当 `c` 离开作用域时，计数减 1。`Rc<T>` 的 `Drop` trait 的实现使得当值离开作用域时自动减少引用计数。

在 `main` 函数的结尾 `a` 和 `b` 离开作用域时，引用计数会变为 0，同时 `Rc<List>` 被完全清理。使用 `Rc<T>` 允许一个值有多个所有者，只要引用计数不为 0，则值始终有效。通过不可变引用， `Rc<T>` 允许在程序的多个部分之间**只读地**共享数据。

## Cow

`Cow<T>` 是写时克隆智能指针，允许在需要的时候才进行克隆，可使代码更加高效。它封装并提供对借用数据的不可变访问，并在需要更改或获取所有权时延迟克隆数据。该类型旨在通过`Borrow`特征处理一般借用的数据。

### 使用 Cow

`Cow<T>` 是一个枚举类型，包含两个变体：

-   **Borrowed**：对原始数据的引用；

-   **Owned**：对原始数据拥有所有权。

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
    // 这里不需要克隆，因为没有负数
    let slice = [0, 1, 2];
    let mut input = Cow::from(&slice[..]);
    abs_all(&mut input);

    // 这里克隆了，因为含有复数
    let slice = [-1, 0, 1];
    let mut input = Cow::from(&slice[..]);
    abs_all(&mut input);
}
```

`abs_all` 函数获取一个可变的 `Cow` 作为参数，里面的值为一个 `i32` 数组。由于是一个智能指针，因此也实现了 `Deref` trait，可以直接调用內部值的方法。当值为负数时，意味着需要修改这个引用的值，因此调用了 `to_mut` 方法，这将把内部值由 `Borrowed` 转变为 `Owned`。这样就只会在需要修改时才进行克隆，提高了运行时性能。

当编写既可以返回引用也可以返回拥有的数据的函数时，应该考虑使用 `Cow`：

-   函数有时需要修改输入数据，有时则不需要；
-   避免不必要的克隆和和运行时内存分配。

## 内部可变性

**内部可变性**允许即使在有不可变引用时也可以在内部改变数据，这通常是借用规则所不允许的，因此该模式在内部的数据结构中使用 `unsafe` 代码来绕过借用规则，所涉及的 `unsafe` 代码被封装进安全的 API 中，而对外部类型而言仍然是不可变的。

Rust 提供了 `Cell<T>` 和 `RefCell<T>` 用于内部可变性，两者在功能上没有区别，但 `Cell<T>` 适用于实现了 `Copy` trait 的类型。

### Cell

```rust
use std::cell:Cell;

fn main() {
    let x = Cell::new(5);
    x.set(10);
    println!("{}", x.get());
}
```

-   `5` 是 `i32` 类型，实现了 `Copy` trait；
-   `get` 方法获取值，`set` 方法设置值。

这个用法违背了借用规则和可变性，但使用 `Cell` 可以做到通过内部方法来修改值。

`Cell<T>` 只能用于实现了 `Copy` trait 的类型：

```rust
// 错误，String 不是 Copy 的
let s = Cell::new(String::from("hello"));

// 正确，引用类型是 Copy 的
let s = String::from("hello");
let s2 = String::from("ok");
let x = Cell::new(&s);
x.set(&s2);
println!("{}", x.get());
```

对实现了 `Copy` trait 的类型使用 `Cell<T>` 意义不大，通常是对非 `Copy` 的类型使用 `RefCell<T>`。

### RefCell

不同于 `Rc<T>`，`RefCell<T>` 拥有数据的唯一所有权。对于引用和 `Box<T>`，借用规则的不可变性作用于编译期，对于 `RefCell<T>`，则作用于**运行时**。对于引用和 `Box<T>`，若违反借用规则，则编译错误，对于 `RefCell<T>`，则会在运行时 panic。

| 指针类型        | 所有权 | 可变性       | 违反规则     |
| --------------- | ------ | ------------ | ------------ |
| 引用和 `Box<T>` | 唯一   | 不可变或可变 | 编译期错误   |
| `Rc<T>`         | 多个   | 不可变       | 编译期错误   |
| `RefCell<T>`    | 唯一   | 不可变或可变 | 运行时 panic |

通常在编译期检查借用规则，但由于编译器是保守的，因此会拒绝掉所有不符合借用规则的代码，这在有些时候会很不方便，`RefCell<T>` 正是用于确信代码遵守借用规则，而编译器无法在编译期正确检查的时候使用。

>   `RefCell<T>` 也是**非原子**性的，因此也只能用于**单线程**场景。

使用 `RefCell<T>` 不代表就无需遵守借用规则了，而是把这一检查过程放到了运行时，当在运行时违反了借用规则时，会发生 panic。

---

根据借用规则，无法可变的借用一个不可变的值：

```rust
let x = 5;
let y = &mut x;  // 错误
```

可以通过把值封装到 `RefCell<T>` 中来可变的借用一个值：

```rust
let x = RefCell::new(String::from("hello"));
x.borrow_mut().push_str(" world");
println!("{}", x.borrow());
```

-   `borrow` 方法获取不可变引用，`borrow_mut` 方法获取可变引用；
-   `borrow` 方法返回 `Ref<T>` 类型的智能指针，`borrow_mut` 方法返回 `RefMut` 类型的智能指针；
-   `RefCell<T>` 会记录当前有多少个 `Ref<T>` 和 `RefMut<T>` 智能指针；
-   每次调用 `borrow` 或 `borrow_mut`方法，`RefCell<T>` 将不可变或可变的借用计数加 1；
-   当 `Ref<T>` 或 `RefMut<T>` 值离开作用域时，不可变或可变的借用计数减 1。

类似编译时借用规则，`RefCell<T>` 在任意时刻只允许有多个 `Ref<T>` 或一个 `RefMut<T>`。

```rust
let x = RefCell::new(String::from("hello"));
let y1 = x.borrow_mut();
let y2 = x.borrow_mut();  // 运行时 panic
```

### 结合 Rc 和 RefCell

`RefCell<T>` 的一个常见用法是与 `Rc<T>` 结合。`Rc<T>` 通过不可变的引用使数据有多个所有者，若数据被 `RefCell<T>` 封装，则可以修改数据。

```rust
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
enum List {
    Cons(Rc<RefCell<i32>>, Rc<List>),
    Nil,
}

use self::List::{Cons, Nil};

fn main() {
    let v = Rc::new(RefCell::new(5));
    let a = Rc::new(Cons(Rc::clone(&v), Rc::new(Nil)));
    let b = Cons(Rc::new(RefCell::new(3)), Rc::clone(&a));
    let c = Cons(Rc::new(RefCell::new(4)), Rc::clone(&a));
    *v.borrow_mut() = 10;
    println!("{:?}", a);
    println!("{:?}", b);
    println!("{:?}", c);
}
```

执行结果：

```
a = Cons(RefCell { value: 10 }, Nil)
b = Cons(RefCell { value: 3 }, Cons(RefCell { value: 10 }, Nil))
c = Cons(RefCell { value: 4 }, Cons(RefCell { value: 10 }, Nil))
```

## 循环引用

Rust 虽然拥有极高的内存安全性，无法轻易引起内存泄漏，但可以通过 `Rc<T>` 和 `RefCell<T>` 创造循环引用，导致内存泄漏，因为每一项的引用计数永远也到不了 0，其值也永远不会被丢弃。

### 制造循环引用

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

use self::List::{Cons, Nil};

fn main() {
    let a = Rc::new(Cons(1, RefCell::new(Rc::new(Nil))));
    println!("a.count = {}\n", Rc::strong_count(&a));
    let b = Rc::new(Cons(2, RefCell::new(Rc::clone(&a))));
    println!("a.count = {}", Rc::strong_count(&a));
    println!("b.count = {}\n", Rc::strong_count(&b));
    if let Some(link) = a.tail() {
        *link.borrow_mut() = Rc::clone(&b);
    }
    println!("a.count = {}", Rc::strong_count(&a));
    println!("b.count = {}\n", Rc::strong_count(&b));

    // println!("{:?}", a);   // 若打印则栈溢出
}
```

执行结果：

```
a.count = 1

a.count = 2
b.count = 1

a.count = 2
b.count = 2
```

通过内部可变性修改了 `a` 使其指向 `b`，形成了一个循环链表，最后两者的引用计数都是 2，在离开作用域时两者的引用计数都不为 0，因此不会释放空间，导致内存泄漏，并且如果打印的话，会造成无限循环，最后发生栈溢出。

### 使用 Weak

`Rc::clone` 会增加 `Rc<T>` 实例的 `strong_count`，只有在 `strong_count` 为 0 时才会释放 `Rc<T>` 实例。通过`Rc::downgrade` 函数来创建其值的**弱引用**，该函数返回 `Weak<T>` 类型的智能指针，并将 `weak_count` 加 1。`Rc<T>` 类型使用 `weak_count` 来记录其存在多少个 `Weak<T>` 引用，和强引用不同的是，`weak_count` 无需计数为 0 就能使 `Rc<T>` 实例被清理。

强引用代表如何共享 `Rc<T>` 实例的所有权，但弱引用并不属于所有权关系，不会造成引用循环，因为任何弱引用的循环会在其相关的强引用计数为 0 时被打断。

因为 `Weak<T>` 引用的值可能已经被释放了，为了使用 `Weak<T>` 所指向的值，必须确保其值仍然有效。为此可以调用 `Weak<T>` 实例的 `upgrade` 方法，这会返回一个 `Option<Rc<T>>`。**若 `Rc<T>` 值还未被丢弃，则为 `Some(Rc<T>)`，并将 `Rc<T>` 的 `strong_count` 加 1，否则为 `None`。**

---

上面的代码可以改为使用 `Weak<T>` 来避免循环引用：

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

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

use self::List::{Cons, Nil};

fn main() {
    let a = Rc::new(Cons(1, RefCell::new(Rc::downgrade(&Rc::new(Nil)))));
    println!(
        "a strong count = {}, weak count = {}\n",
        Rc::strong_count(&a),
        Rc::weak_count(&a)
    );
    let b = Rc::new(Cons(2, RefCell::new(Rc::downgrade(&a))));
    println!(
        "a strong count = {}, weak count = {}",
        Rc::strong_count(&a),
        Rc::weak_count(&a)
    );
    println!(
        "b strong count = {}, weak count = {}\n",
        Rc::strong_count(&b),
        Rc::weak_count(&b)
    );
    println!("a = {:?}", a);
    println!("b = {:?}\n", b);
    if let Some(link) = a.tail() {
        *link.borrow_mut() = Rc::downgrade(&b);
    }
    println!(
        "a strong count = {}, weak count = {}",
        Rc::strong_count(&a),
        Rc::weak_count(&a)
    );
    println!(
        "b strong count = {}, weak count = {}\n",
        Rc::strong_count(&b),
        Rc::weak_count(&b)
    );
    println!("{:?}", a.tail());
}
```

执行结果：

```
a strong count = 1, weak count = 0

a strong count = 1, weak count = 1
b strong count = 1, weak count = 0

a = Cons(1, RefCell { value: (Weak) })
b = Cons(2, RefCell { value: (Weak) })

a strong count = 1, weak count = 1
b strong count = 1, weak count = 1

Some(RefCell { value: (Weak) })
```

---

设有一个树型数据结构，父节点可以拥有多个子节点，因此使用 `Rc` 和 `Vec` 来封装，子节点可以访问父节点，为了避免循环引用，因此子节点拥父节点弱引用，父节点拥有子节点的强引用，同时父和子节点皆可被修改，因此都需要使用 `RefCell` 封装。

```rust
use std::rc::Rc;
use std::{cell::RefCell, rc::Weak};

#[derive(Debug)]
struct Node {
    value: i32,
    parent: RefCell<Weak<Node>>,
    children: RefCell<Vec<Rc<Node>>>,
}

impl Node {
    fn new(value: i32) -> Self {
        Self {
            value,
            parent: RefCell::new(Weak::new()),
            children: RefCell::new(vec![])
        }
    }
}

fn main() {
    let leaf1 = Rc::new(Node::new(1));
    let leaf2 = Rc::new(Node::new(2));

    println!("leaf1.parent = {:?}", leaf1.parent.borrow().upgrade());
    println!(
        "leaf1 strong = {}, weak = {}",
        Rc::strong_count(&leaf1),
        Rc::weak_count(&leaf1)
    );
    println!("leaf2.parent = {:?}", leaf2.parent.borrow().upgrade());
    println!(
        "leaf2 strong = {}, weak = {}\n",
        Rc::strong_count(&leaf2),
        Rc::weak_count(&leaf2)
    );

    {
        let branch = Rc::new(Node::new(0));
        branch.children.borrow_mut().push(Rc::clone(&leaf1));
        branch.children.borrow_mut().push(Rc::clone(&leaf2));

        println!("branch = {:#?}\n", branch);
        println!(
            "branch strong = {}, weak = {}\n",
            Rc::strong_count(&branch),
            Rc::weak_count(&branch)
        );

        *leaf1.parent.borrow_mut() = Rc::downgrade(&branch);
        *leaf2.parent.borrow_mut() = Rc::downgrade(&branch);

        println!(
            "leaf1.parent = {}",
            leaf1.parent.borrow().upgrade().is_some()
        );
        println!(
            "leaf1 strong = {}, weak = {}",
            Rc::strong_count(&leaf1),
            Rc::weak_count(&leaf1)
        );
        println!(
            "leaf2.parent = {}",
            leaf2.parent.borrow().upgrade().is_some()
        );
        println!(
            "leaf2 strong = {}, weak = {}\n",
            Rc::strong_count(&leaf2),
            Rc::weak_count(&leaf2)
        );
        println!(
            "branch strong = {}, weak = {}\n",
            Rc::strong_count(&branch),
            Rc::weak_count(&branch)
        );
    }

    println!("leaf1.parent = {:?}", leaf1.parent.borrow().upgrade());
    println!(
        "leaf1 strong = {}, weak = {}",
        Rc::strong_count(&leaf1),
        Rc::weak_count(&leaf1)
    );
    println!("leaf2.parent = {:?}", leaf2.parent.borrow().upgrade());
    println!(
        "leaf2 strong = {}, weak = {}\n",
        Rc::strong_count(&leaf2),
        Rc::weak_count(&leaf2)
    );
}
```

执行结果：

```
leaf1.parent = None
leaf1 strong = 1, weak = 0
leaf2.parent = None
leaf2 strong = 1, weak = 0

branch = Node {
    value: 1,
    parent: RefCell {
        value: (Weak),
    },
    children: RefCell {
        value: [
            Node {
                value: 2,
                parent: RefCell {
                    value: (Weak),
                },
                children: RefCell {
                    value: [],
                },
            },
            Node {
                value: 3,
                parent: RefCell {
                    value: (Weak),
                },
                children: RefCell {
                    value: [],
                },
            },
        ],
    },
}

branch strong = 1, weak = 0

leaf1.parent = true
leaf1 strong = 2, weak = 0
leaf2.parent = true
leaf2 strong = 2, weak = 0

branch strong = 1, weak = 2

leaf1.parent = None
leaf1 strong = 1, weak = 0
leaf2.parent = None
leaf2 strong = 1, weak = 0
```

创建 `leaf1` 和 `leaf2` 后，强引用计数都为 1，弱引用计数都为 0。在内部作用域中创建了 `branch` 并与 `leaf1` 和 `leaf2` 相关联，此时 `branch` 的强引用计数为 1，弱引用计数为 2，而 `leaf1` 和 `leaf2` 的强引用计数都为 2，弱引用计数都为 0。

当内部作用域结束时，`branch` 离开作用域，强引用计数减少为 0，所以 `branch` 被丢弃，即使弱引用计数仍然为 2。

在内部作用域结束后尝试访问 `leaf1` 和 `leaf2` 的父节点，会得到 `None`。在程序的结尾，`leaf1` 和 `leaf2` 的强引用计数都为 1，弱引用计数都为 0。

通过在 `Node` 定义中指定从子节点到父节点的关系为一个 `Weak<T>` 引用，就能够拥有父和子节点之间的双向引用而不会造成循环引用和内存泄漏。

# 2 并发

**并发**代表程序的不同部分可以相互独立的执行，而**并行**代表程序的不同部分同时执行。并行实际上是并发的一种实现形式。当只有一个 CPU 核心时，通过轮流切换来实现并发；当有多个 CPU 核心时，通过并行来实现并发。通常使用并发来表示轮流执行，并行来表示同时执行。而当任务数大于 CPU 核心数时，并行和并发都同时存在，即**并行一定是并发，并发只有在多核 CPU 上才能并行**。

>   在 Rust 中统一使用并发来指代这两者。

## 使用线程

程序代码通常在**进程**中运行，操作系统管理多个进程。程序内部可以有多个同时运行的**线程**。程序从主线程 `main` 开始，可创建子线程，子线程也能创建线程。线程同时运行，执行顺序不确定，依赖操作系统调度。主线程结束时，不论子线程是否完成，程序都会结束；子线程完成后自动结束，但其创建的线程会继续执行。操作系统提供结束线程的接口，但直接终止线程可能导致如资源未释放之类的问题。

程序执行的任务通常有两类：

-   **IO 密集型**：有大量的 IO 操作，如文件处理、网络通信等；
-   **CPU 密集型**：需要大量的计算，如图像处理、复杂运算等。

通常对 CPU 密集型任务使用多线程会有显著的性能提升，但也会导致以下问题：

-   **数据竞争**：多个线程以不一致的顺序同时访问同一个数据；
-   **死锁**：线程之间相互等待对方停止使用其所拥有的数据，导致双方永远等待。

### 线程模型

不同语言实现线程方式不同。操作系统通常会提供创建线程的 API，这种调用系统 API 创建线程的模型被称为 **1:1** 模型，即一个 OS 线程对应一个程序线程。而 **M:N** 模型被称为**协程**，即程序内部实现的 M 个线程会映射到 N 个 OS 线程中。

>   为了较小的运行时和性能，Rust 标准库只提供了 1:1 线程实现，一些第三方库，如 [Tokio](https://github.com/tokio-rs/tokio) 则提供了 M:N 线程实现。

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

### 线程屏障

`sync::Barrier` 可以让多个线程都执行到某个点后，才继续往后执行。其接收一个参数 `N`，表示阻塞指定线程数，它会阻塞前 `N-1` 个调用 `wait` 的线程，然后在第 `N` 个线程调用 `wait` 时立即继续执行所有线程。

```rust
use std::sync::{Arc, Barrier};
use std::thread;

fn main() {
    let mut hs = vec![];
    let b = Arc::new(Barrier::new(4));

    for i in 0..4 {
        let t = Arc::clone(&b);
        let h = thread::spawn(move || {
            println!("{i}: start");
            t.wait();
            println!("{i}: end");
        });
        hs.push(h);
    }

    for h in hs {
        h.join().unwrap();
    }
}
```

## 并发 trait

Rust 有两个标识可以进行安全并发的 trait：`std::marker::{Send, Sync}`。其中 `marker` 代表**标记 trait**，表示该 trait 不含任何方法，仅用于标记是否满足相关性质。实现了 `Send` 和 `Sync` 的类型是并发安全的。

### Send

实现了 `Send` 的类型可以在线程间安全地转移所有权。除了 `Rc`、`Weak`、原始指针等少数类型外，绝大部分类型都实现了 `Send` ，由实现了 `Send` 的类型组成的类型也是 `Send` 的。

### Sync

实现了 `Sync` 的类型可以安全地在多个线程共享其引用，这代表：

-   若 `T` 实现了 `Sync`，则 `&T` 为 `Send` 的；

-   若 `&T` 实现了 `Send`，则 `T` 为 `Sync` 的。

除了 `Cell`、`RefCell`、`Rc`、`Weak`、原始指针等少数类型外，绝大部分类型都实现了 `Sync`，由实现了 `Sync` 的类型组成的类型也是 `Sync` 的。

### Send 和 Sync 实现

通常并不需要手动实现 `Send` 和 `Sync`，因为任何由 `Send` 和 `Sync` 的类型组成的类型，自动就是 `Send` 和 `Sync` 的。

`Rc`、`Weak` 和原始指针没有实现 `Send` 和 `Sync`，因此不是并发安全的。

```rust
impl<T: ?Sized> !Send for Rc<T> {}
impl<T: ?Sized> !Sync for Rc<T> {}

impl<T: ?Sized> !Send for Weak<T> {}
impl<T: ?Sized> !Sync for Weak<T> {}

impl<T: ?Sized> !Send for *const T {}
impl<T: ?Sized> !Sync for *const T {}

impl<T: ?Sized> !Send for *mut T {}
impl<T: ?Sized> !Sync for *mut T {}
```

`Cell` 和 `RefCell` 虽然实现了 `Send`，但没有实现 `Sync`，因此也不是并发安全的。

```rust
unsafe impl<T: ?Sized + Send> Send for Cell<T> {}
impl<T: ?Sized> !Sync for Cell<T> {}

unsafe impl<T: ?Sized + Send> Send for RefCell<T> {}
impl<T: ?Sized> !Sync for RefCell<T> {}
```

`Arc`、`Mutex` 和 `RwLock` 都实现了 `Send` 和 `Sync`，因此是并发安全的。

```rust
unsafe impl<T: ?Sized + Sync + Send> Send for Arc<T> {}
unsafe impl<T: ?Sized + Sync + Send> Sync for Arc<T> {}

unsafe impl<T: ?Sized + Send> Send for Mutex<T> {}
unsafe impl<T: ?Sized + Send> Sync for Mutex<T> {}

unsafe impl<T: ?Sized + Send> Send for RwLock<T> {}
unsafe impl<T: ?Sized + Send + Sync> Sync for RwLock<T> {}
```

实现了并发安全的类型自身可能含有没有实现并发安全的字段，如 `Mutex`、`RwLock` 都含有没有实现 `Sync` 的 `UnsafeCell` 字段；而 `Arc` 含有没有实现 `Send` 和 `Sync` 的 `NonNull` 字段。

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
    let ssr = SafeRc::clone(&sr);

    thread::spawn(move || {
        *ssr.lock().unwrap() += 10;
    })
    .join()
    .unwrap();

    println!("{}", sr.lock().unwrap());
}
```

## 消息传递

一种确保并发安全的方式是**消息传递**，线程通过发送包含数据的消息来进行通信。

实现消息传递的主要方式是**信道**，由**发送端**和**接收端**这两部分组成。**当所有发送端或接收端都被丢弃时**，可以认为信道被关闭了。

### MPSC 信道

`mpsc::channel` 用于创建有**多个发送端、一个接收端**的信道，其返回一个代表发送端和接收端的元组 `(Sender, Receiver)`，`tx` 和 `rx` 通常作为这两者的缩写。

>   信道的内部实现使用了泛型，一旦确定了信道传输值的类型，就不能再改变。

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

-   `recv` 会阻塞当前线程执行直到从信道中接收到一个消息。其返回一个 `Result`，`Ok` 包含接收到的值，`Err` 表示发送端被关闭；

-   `try_recv` 不会阻塞。其立刻返回一个 `Result`，`Ok` 包含接收到的值，`Err` 代表没有任何消息。若线程在等待消息过程中还有其它代码需要执行时使用 `try_recv`，如通过循环调用 `try_recv`，在有可用消息时进行处理，否则继续其它任务。

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
    let t = tx.clone();
    thread::spawn(move || {
        t.send(i).unwrap();
        thread::sleep(Duration::from_millis(100));
    });
}

// 由于还 tx 未被关闭，若不 drop 则一直阻塞
drop(tx);
for v in rx {
    println!("from thread {v}");
}
```

需要注意的是:

-   所有发送端都被 `drop` 掉后，信道才会被关闭，接收端才会收到错误，进而终止迭代；
-   不能确定子线程的创建顺序，因此消息的发送顺序也不能确定。但对信道而言，其中的消息是有序的，符合先进先出原则。

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

同步信道表示发送消息是阻塞的，只有在消息被接收后才解除阻塞。通过 `mpsc::sync_channel` 创建的就是同步信道，其需要一个参数，表示消息缓冲值。当设定为 `N` 时，发送端可以无阻塞的往信道中发送 `N` 条消息，当消息缓冲队列满了后，新消息的发送将被阻塞。若没有接收端从缓冲队列中接收消息，那么第 `N+1` 条消息的发送将被阻塞。

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

**互斥锁**表示在任意时刻，再某种条件下，只允许一个线程访问其中的数据。为了访问互斥器中的数据，线程需要先获取互斥器的**锁**。锁是一个作为互斥器一部分的数据结构，记录了谁有数据的访问权，互斥器通过锁避免数据竞争。

使用互斥器需要注意：

-   使用数据前必须获取锁；
-   使用完后必须释放锁，这样其它线程才能加锁；
-   互相等待对方线程释放锁会造成死锁。

### Mutex

`Mutex` 是一种互斥锁，`lock` 和 `try_lock` 用于获取锁，前者阻塞后者非阻塞。`RefCell` 只实现了 `Send` 而没有实现 `Sync`，因此没有实现并发安全。而 `Mutex` 实际上就是并发安全的 `RefCell`。

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(0);
    {
        let mut v = m.lock().unwrap();
        *v = 1;
    }
    println!("{}", m.lock().unwrap());
}
```

`Mutex` 对锁使用**中毒策略**。正常情况下锁会在作用域结束后自动释放，但若线程在释放前发生了 panic，锁就不会被释放也不能再被获取，该锁被视为**中毒的**。

`lock` 和 `try_lock` 返回的 `Result` 指示锁的状态。`Ok` 是一个具有**内部可变性**的 `MutexGuard`，其中含有内部数据；而 `Err` 是一个 `PoisonError`，表示锁已中毒。

>   获取的锁若不绑定到一个变量上，则相当于是一个临时变量，在当前语句结束后就会立即解锁。

### Arc

`Rc` 的操作不是原子的，因此没有实现并发安全。要在多个线程间共享所有权，可以使用**原子引用计数**类型 `Arc`，和 `Rc` 有相同的 API，但由于 `Arc` 为了保证并发安全因此有一定性能损失。

`Mutext` 提供了内部可变性，这与 `Rc` 配合 `RefCell` 使用类似，`Arc` 也会配合 `Mutex` 使用。

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let a = Arc::new(Mutex::new(0));
    let mut hs = vec![];

    for _ in 0..10 {
        let aa = Arc::clone(&a);
        let h = thread::spawn(move || {
            *aa.lock().unwrap() += 1;
        });
        hs.push(h);
    }

    for h in hs {
        h.join().unwrap();
    }

    println!("{}", *a.lock().unwrap());
}
```

`Rc<RefCell>` 有造成**循环引用**的风险，而 `Arc<Mutex>` 也有造成**死锁**的风险，如一个操作需要锁住两个资源而两个线程各持一个锁，这会造成它们之间永远相互等待。

```rust
use std::sync::{Arc, Barrier, Mutex};
use std::thread;

fn main() {
    let a1 = Arc::new(Mutex::new(0));
    let a2 = Arc::new(Mutex::new(1));

    let aa1 = Arc::clone(&a1);
    let aa2 = Arc::clone(&a2);

    let b = Arc::new(Barrier::new(2));
    let bb = Arc::clone(&b);

    let h1 = thread::spawn(move || {
        let _v1 = a1.lock().unwrap();
        println!("h1 locked a1");
        b.wait();
        let _v2 = a2.lock().unwrap();
        println!("h1 locked a2");
    });

    let h2 = thread::spawn(move || {
        let _v2 = aa2.lock().unwrap();
        println!("h2 locked a2");
        bb.wait();
        let _v1 = aa1.lock().unwrap();
        println!("h2 locked a1");
    });

    h1.join().unwrap();
    h2.join().unwrap();
}
```

`h1` 线程以 `a1`、`a2` 的顺序获取锁，`h2` 线程以 `a2`、`a1` 的顺序获取锁，并使用线程屏障保证线程各自都在获取到第一个锁后再继续运行，此时就会造成死锁。

### RwLock

`Mutex` 每次使用都需要加锁，这在高并发读时有较大性能损耗。而 `RwLock` 允许多个读操作同时进行，但同时只能有一个写操作，这十分适合高并发读的场景。

`read`、`write` 用于阻塞地读写，`try_read` 和 `try_write` 用于非阻塞地读写。

```rust
use std::sync::{Arc, Barrier, RwLock};
use std::thread;

fn main() {
    let r = Arc::new(RwLock::new(0));
    let b = Arc::new(Barrier::new(5));
    let mut hs = vec![];

    for i in 0..5 {
        let rr = Arc::clone(&r);
        let bb = Arc::clone(&b);
        let h = thread::spawn(move || {
            let v = rr.read().unwrap();
            bb.wait();
            println!("thread {i}: {v}");
        });
        hs.push(h);
    }

    for h in hs {
        h.join().unwrap();
    }

    *r.write().unwrap() = 1;
    println!("after write: {}", r.read().unwrap());
}
```

与 `Mutex` 类似，同样对锁使用**中毒策略**，但只在写模式下发生的 panic 才会导致锁中毒。

`read`、`try_read`、`write`、`try_write` 返回的 `Result` 指示锁的状态。读模式下，`Ok` 是一个 `RwLockReadGuard`，其中含有内部数据；写模式下，`Ok` 是一个具有**内部可变性**的 `RwLockWriteGuard`，其中含有内部数据，而 `Err` 是一个 `PoisonError`，表示锁已中毒。

### Condvar

互斥锁用于解决并发安全问题，但不能用于控制对并发数据的访问顺序。条件变量则可以控制线程的同步，它会让当前线程阻塞，直到满足特定条件后再继续执行，通常和 `Mutex` 配合使用。

使用条件变量的典型步骤为：

1.  创建一个 `Mutex<bool>` 和与其关联的 `Condvar`；
2.  当需要等待特定条件时，线程先从 `Mutex` 获取锁 `f`，然后在 `Condvar` 上调用 `wait` 或 `wait_timeout` 释放锁 `f`，然后阻塞当前线程，等待其它线程发送通知；
3.  另一个线程完成操作后，从 `Mutex` 获取锁 `f`，修改 `f` 使其满足条件，然后在 `Condvar` 上的调用 `notify_one` 或 `notify_all` 来通知等待的线程；
4.  等待的线程接收到满足条件的通知后，继续执行。

```rust
use std::sync::{Arc, Condvar, Mutex};
use std::thread;
use std::time::Duration;

fn main() {
    let pair = Arc::new((Mutex::new(false), Condvar::new()));
    let pair2 = Arc::clone(&pair);

    let h = thread::spawn(move || {
        let (mtx, cvar) = &*pair2;
        let mut flag = mtx.lock().unwrap();

        while !*flag {
            flag = cvar.wait(flag).unwrap(); // wait 会立即释放 flag
        }

        println!("thread done");
    });

    let (mtx, cvar) = &*pair;
    thread::sleep(Duration::from_secs(1));
    *mtx.lock().unwrap() = true;
    cvar.notify_one();

    h.join().unwrap();
}
```

## 原子类型

基于信道的消息传递安全但有诸多限制，`Mutex` 简单但不支持并发读，`RwLock` 支持并发读但性能有限。而 CPU 本身提供原子操作指令，Rust 中的原子类型会利用这些指令，因此也是并发安全的，其性能优于消息传递和锁，并具有**内部可变性**。虽为无锁类型，但原子类型内部使用 CAS（Compare and Swap）循环，还是有等待阻塞的可能，但总体性能优于锁。实际上很多并发类型在内部就是使用原子类型来构建的。

原子类型包括：

-   有符号整数：`AtomicI8`、`AtomicI16`、`AtomicI32`、`AtomicI64`、`AtomicIsize`	

-   无符号整数：`AtomicU8`、`AtomicU16`、`AtomicU32`、`AtomicU64`、`AtomicUsize`
-   布尔：`AtomicBool`
-   原始指针：`AtomicPtr`

### 内存顺序

由于 CPU 在访问内存时的顺序可能受以下因素的影响：

-   代码中的顺序；
-   编译器优化导致的重排序；
-   运行阶段因 CPU 的缓存机制导致的重排序。

因此操作原子类型的方法都接收一个 `Ordering` 枚举来限制操作内存的顺序，其包含五个变体：

-   `Relaxed`：最宽松的规则，对编译器和 CPU 不做任何限制，可以乱序；
-   `Release`：设定内存屏障，保证其之前的操作一定在前面，但后面的操作也有可能在前面；
-   `Acquire`：设定内存屏障，保证其之后的操作问一定在后面，但之前的操作也有可能在后面；
-   `AcqRel`：结合 `Acquire` 和 `Release`，同时提供两者的保证；
-   `SeqCst`：加强版 `AcqRel`，提供绝对的顺序一致性，但性能会有所下降。

这些规则由操作系统提供，通常 `Acquire` 用于读，而 `Release` 用于写，同时读写则用 `AcqRel`，要求强一致性则用 `SecCst`。

### 使用原子类型

原子类型虽然是并发安全的，但依然遵循所有权，因此通常会配合 `Arc` 使用。

```rust
use std::sync::atomic::{AtomicI32, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    let a = Arc::new(AtomicI32::new(0));
    let mut hs = vec![];

    for _ in 0..8 {
        let aa = Arc::clone(&a);
        let h = thread::spawn(move || {
            for _ in 0..100000 {
                aa.fetch_add(1, Ordering::Relaxed);
            }
        });
        hs.push(h);
    }

    for h in hs {
        h.join().unwrap();
    }

    println!("{a:?}");
}
```

### 应用场景

原子类型虽然具有优异的并发特性，但与信道和锁相比，还是存在一些局限性：

-   支持类型有限；
-   复杂场景不如信道和锁使用简单；
-   一些场景必须使用锁，如 `Mutex` 配合 `Condvar`。

虽然原子类型不太常用，但经常出现在标准库、高性能库中，是实现并发的基石，其通常出现在：

-   无锁数据结构
-   全局变量
-   跨线程计数器
