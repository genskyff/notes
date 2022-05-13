# 1 智能指针

**指针**是一个包含内存地址的变量，这个地址指向内存中的其它数据。**引用是一种指针**，除了引用数据外没有其他功能，但也没有额外开销。

**智能指针**是一类数据结构，和指针类似，但拥有额外的元数据和功能。引用和智能指针的一个额外的区别是**引用为一类只借用数据的指针，但智能指针通常拥有所指向数据的所有权**。

实际上 `String` 和 `Vec<T>` 就是智能指针，因为它们拥有数据并允许修改，同时也带有元数据（原始指针、长度和容量）和额外的功能或保证（如 `String` 的数据总是有效的 UTF-8 编码）。

智能指针通常使用结构体实现，并实现了 `Deref` 和 `Drop` trait。`Deref` trait 重载了 `*` 运算符，允许智能指针实例可以像引用一样使用。`Drop` trait 允许自定义当智能指针离开作用域时运行的代码。

## Box\<T\>

最简单的智能指针是 `Box`，其类型是 `Box<T>`。 Box 可以将一个值放在堆上而不是栈上，留在栈上的则是指向堆数据的指针。

>   Box 只提供了间接存储和堆分配，并没有任何其他的功能，因此几乎没有性能损失。

通常用于以下场景：

-   编译时大小未知但又需要在确切大小的上下文中使用的类型；
-   在确保数据不被拷贝的情况下转移所有权；
-   需要拥有一个值并确保是否实现了特定 trait。

### 使用 Box\<T\>

```rust
let x = Box::new(3);
println!("{}", x);
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

### 改用 Box\<T\>

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

## Rc\<T\>

有时一个值可能会有多个所有者，如在图数据结构中，多个边可能指向相同的节点，这个节点被所有指向它的边拥有，直到没有任何边指向它之前都不应该被清理。

Rust 的所有权规则决定了一个值有且只有一个所有者，为了模拟多所有权，需要使用 `Rc<T>` 类型，该类型使用**引用计数**来记录一个值引用的数量。若某个值有零个引用，就代表没有任何有效引用并可以被清理。

`Rc<T>` 主要用于在堆上分配一些内存供程序的多个部分读取，且无法在编译时确定程序的哪一部分会最后使用。

>   `Rc<T>` 是**非原子**性的，因此只能用于**单线程**场景。

### 使用 Rc\<T\> 共享数据

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

## 内部可变性

**内部可变性**允许即使在有不可变引用时也可以在内部改变数据，这通常是借用规则所不允许的，因此该模式在内部的数据结构中使用 `unsafe` 代码来绕过借用规则，所涉及的 `unsafe` 代码被封装进安全的 API 中，而对外部类型而言仍然是不可变的。

Rust 提供了 `Cell<T>` 和 `RefCell<T>` 用于内部可变性，两者在功能上没有区别，但 `Cell<T>` 适用于实现了 `Copy` trait 的类型。

### Cell\<T\>

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
```

对实现了 `Copy` trait 的类型使用 `Cell<T>` 意义不大，通常是对非 `Copy` 的类型使用 `RefCell<T>`。

### RefCell\<T\>

不同于 `Rc<T>`，`RefCell<T>` 拥有数据的唯一所有权。对于引用和 `Box<T>`，借用规则的不可变性作用于编译期，对于 `RefCell<T>`，则作用于**运行时**。对于引用和 `Box<T>`，若违反借用规则，则编译错误，对于 `RefCell<T>`，则会在运行时 panic。

| 指针类型        | 所有权 | 可变性       | 违反规则     |
| --------------- | ------ | ------------ | ------------ |
| 引用和 Box\<T\> | 唯一   | 不可变或可变 | 编译期错误   |
| Rc\<T\>         | 多个   | 不可变       | 编译期错误   |
| RefCell\<T\>    | 唯一   | 不可变或可变 | 运行时 panic |

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

### 结合 Rc\<T\> 和 RefCell\<T\>

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

### 使用 Weak\<T\>

`Rc::clone` 会增加 `Rc<T>` 实例的 `strong_count`，只有在 `strong_count` 为 0 时才会释放 `Rc<T>` 实例。通过`Rc::downgrade` 函数来创建其值的**弱引用**，该函数返回 `Weak<T>` 类型的智能指针，并将 `weak_count` 加 1。`Rc<T>` 类型使用 `weak_count` 来记录其存在多少个 `Weak<T>` 引用，和强引用不同的是，`weak_count` 无需计数为 0 就能使 `Rc<T>` 实例被清理。

强引用代表如何共享 `Rc<T>` 实例的所有权，但弱引用并不属于所有权关系，不会造成引用循环，因为任何弱引用的循环会在其相关的强引用计数为 0 时被打断。

因为 `Weak<T>` 引用的值可能已经被释放了，为了使用 `Weak<T>` 所指向的值，必须确保其值仍然有效。为此可以调用 `Weak<T>` 实例的 `upgrade` 方法，这会返回一个 `Option<Rc<T>>`。若 `Rc<T>` 值还未被丢弃，则为 `Some`，否则为 `None`。

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

设有一个树型数据结构，父节点可以拥有多个子节点，因此使用 `Rc<T>` 和 `Vec` 来封装，子节点可以访问父节点，为了避免循环引用，因此子节点拥父节点弱引用，父节点拥有子节点的强引用，同时父和子节点皆可被修改，因此都需要使用 `RefCell<T>` 封装。

```rust
use std::rc::Rc;
use std::{cell::RefCell, rc::Weak};

#[derive(Debug)]
struct Node {
    value: i32,
    parent: RefCell<Weak<Node>>,
    children: RefCell<Vec<Rc<Node>>>,
}

fn main() {
    let leaf1 = Rc::new(Node {
        value: 2,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });

    let leaf2 = Rc::new(Node {
        value: 3,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });

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
        let branch = Rc::new(Node {
            value: 1,
            parent: RefCell::new(Weak::new()),
            children: RefCell::new(vec![Rc::clone(&leaf1), Rc::clone(&leaf2)]),
        });

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

**并发**代表程序的不同部分可以相互独立的执行，而**并行**代表程序的不同部分同时执行。并行实际上是并发的一种实现形式，当只有一个 CPU 核心时，任务通过轮流切换来实现并发，当有多个 CPU 核心时，任务通过并行来实现并发。通常使用并发来表示轮流执行，并行来表示同时执行，而当任务数大于 CPU 核心数时，并行和并发都同时存在，即**并行一定是并发，并发只有在多核 CPU 上才能并行**。

>   在 Rust 中统一使用并发来指代这两者。

## 使用线程

现代操作系统中，程序的代码在一个**进程**中运行，操作系统则负责管理多个进程。在程序内部，也可以拥有多个同时运行的独立部分，被称为**线程**。

将程序的多个计算部分拆分成多个线程可以提高性能，但也会增加复杂度。因为线程是同时运行的，所以无法保证不同线程中的代码的执行顺序。

多线程通常会导致以下问题：

-   数据竞争：多个线程以不一致的顺序同时访问数据或资源；
-   死锁：两个线程相互等待对方停止使用其所拥有的资源，导致都不能继续运行；
-   只会发生在特定情况下且难以稳定重现和修复的 Bug。

### 线程模型

不同语言实现线程方式不同。操作系统通常会提供创建线程的 API，这种调用系统 API 创建线程的模型被称为 **1:1** 模型，即一个 OS 线程对应一个语言线程。而 **M:N** 模型被称为**绿色线程**或**协程**，即程序内部实现的 M 个线程会映射到 N 个 OS 线程中。

>   为了较小的运行时和性能，Rust 标准库只提供了 1:1 线程实现，一些第三方标准库，如 [Tokio](https://github.com/tokio-rs/tokio) 则提供了 M:N 线程实现。

### spawn 函数

为了创建一个新线程，需要调用 `thread::spawn` 函数并传递一个闭包，并在其中包含新线程要运行的代码。

```rust
use std::thread;
use std::time::Duration;

fn main() {
    thread::spawn(|| {
        for i in 1..=6 {
            println!("spawn thread {}", i);
            thread::sleep(Duration::from_millis(100));
        }
    });

    for i in 1..=3 {
        println!("main thread {}", i);
        thread::sleep(Duration::from_millis(100));
    }
}
```

执行结果：

```
main thread 1 
spawn thread 1
spawn thread 2
main thread 2
spawn thread 3
main thread 3
spawn thread 4
```

`thread::sleep` 函数强制暂停线程一小段时间，这会使其它线程继续运行。这些线程的执行顺序无法保证，这依赖操作系统如何进行调度。

当主线程 `main ` 结束时，不管子线程代码是否执行完毕都会结束。这里先执行主线程中的代码，在结束时由于还暂停了一小段时间，因此会继续执行子线程中的代码，但由于主线程很快结束，导致子线程中的代码没有全部执行。

### join 函数

`thread::spawn` 函数的返回值类型是 `JoinHandle`，它是一个拥有所有权的值，当对其调用 `join` 方法时，它会等待线程结束。因此可以将返回值保存在变量中，然后在主线程结尾对其调用 `join` 方法来确保子线程的代码能够全部执行。

```rust
let handle = thread::spawn(|| {
    for i in 1..=6 {
        println!("spawn thread {}", i);
        thread::sleep(Duration::from_millis(100));
    }
});

for i in 1..=3 {
    println!("main thread {}", i);
    thread::sleep(Duration::from_millis(100));
}

handle.join().unwrap();
```

执行结果：

```
main thread 1
spawn thread 1
main thread 2
spawn thread 2
main thread 3
spawn thread 3
spawn thread 4
spawn thread 5
spawn thread 6
```

由于 `join` 方法返回一个 `Result`，因此需要调用 `unwrap` 方法。`join` 方法会阻塞当前线程直到 handle 所代表的线程结束，**阻塞**线程表示阻止当前线程执行或退出。

当把 `join` 方法放到主线程的 `for` 前：

```rust
let handle = thread::spawn(|| {
    for i in 1..=6 {
        println!("spawn thread {}", i);
        thread::sleep(Duration::from_millis(100));
    }
});

handle.join().unwrap();

for i in 1..=3 {
    println!("main thread {}", i);
    thread::sleep(Duration::from_millis(100));
}
```

执行结果：

```
spawn thread 1
spawn thread 2
spawn thread 3
spawn thread 4
spawn thread 5
spawn thread 6
main thread 1
main thread 2
main thread 3
```

主线程会等待直到子线程执行完毕之后才开始执行 `for`，所以输出不会交替出现，即 `join` 方法放置的位置会影响线程的运行。

### move 闭包

`move` 关键字会强制闭包获取其使用的环境值的所有权，因此主要用于将值的所有权从一个线程转移到另一个线程。

```rust
let v = vec![1, 2, 3];
// 错误，无法保证 v 的引用一直有效
let handle = thread::spawn(|| {
    println!("v = {:?}", v);
});
handle.join().unwrap();
```

闭包使用了 `v`，所以闭包会捕获 `v` 并使其成为闭包环境的一部分。因为 `thread::spawn` 函数在一个子线程中运行这个闭包，所以可以在新线程中访问 `v`。编译器会推断如何捕获 `v`，因为 `println!` 只需要 `v` 的引用，闭包尝试借用 `v`。由于编译器无法推断子线程的执行时间，因此无法确定 `v` 的引用是否一直有效，于是这段代码无法通过编译。

通过使用 `move` 关键字，强制闭包获取其使用的值的所有权，而不是由编译器推断的借用值：

```rust
let handle = thread::spawn(move || {
    println!("v = {:?}", v);
});
```

由于使用了 `move` 闭包，则不能在主线程中继续使用 `v`：

```rust
let handle = thread::spawn(move || {
    println!("v = {:?}", v);
});
// 错误，v 已经移动
drop(v);
```

编译器是保守的，并只会为线程借用 `v`，主线程可能使子线程的引用无效。`move` 关键字覆盖了默认保守的借用，但依然不能违反所有权规则。

### 线程结束

操作系统提供了直接结束线程的接口，但 Rust 没有提供，原因在于直接终止一个线程可能会导致其资源没有释放、状态混乱等不可预期的结果。

在 Rust 中，`main` 线程是程序的主线程，一旦结束，则程序随之结束，同时各个子线程也将被强行终止。而对子线程来说，其中代码执行完，线程就会自动结束。

当子线程的代码没有执行完时，需要分情况讨论：

-   线程的任务是一个循环 IO 读取，其流程类似：`IO 阻塞 -> 等待读取数据 -> 读取数据 -> 处理完毕 -> 继续阻塞等待 -> ... -> 收到 Socket 关闭信号 -> 结束线程`。在此过程中，绝大部分时间线程都处于阻塞的状态，因此虽然看上去是循环，CPU 占用其实很小，这也是网络 IO 最常见的场景。
-   线程的任务是一个循环，没有任何阻塞，连 `sleep` 也没有，此时 CPU 会被占满，若没有终止条件，该线程将持续占满一个 CPU 核心，直到 `main` 线程的结束。

第一种十分常见，对于第二种，有以下代码：

```rust
let new_thread = thread::spawn(move || {
    thread::spawn(move || loop {
        println!("ok");
    })
});

new_thread.join().unwrap();
println!("new_thread is finished");

thread::sleep(Duration::from_millis(10));
```

主线程 `main` 线程创建了一个子线程 `new_thread`，然后该线程又创建了一个子线程，`new_thread` 在创建完子线程后就结束了，但其创建的子线程依旧在执行。

## 线程间通信

一种主流的确保并发安全的方式是**消息传递**，线程通过发送包含数据的消息来进行通信。

Rust 中一个实现消息传递并发的主要方式是**信道**，由两部分组成，**一个发送端和一个接收端**。程序的一部分调用发送端的方法和要发送的数据，另一部分检查接收端收到的消息。**当所有发送端或接收端被丢弃时可以认为信道被关闭了**。

利用线程间通信，就能使用信道来实现聊天系统，或利用多线程进行分布式计算并将部分计算结果发送给一个线程进行聚合。

### 使用 channel

设有一个程序，它会在一个线程生成值并向信道发送，另一个线程会接收值并打印。这可以通过信道在线程间发送消息来完成。

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
    println!("{}", recv);
}
```

`mpsc::channel` 函数创建一个信道；`mpsc` 是**多个生产者、单个消费者**的缩写。标准库实现信道的方式为**一个信道可以有多个产生值的发送端，但只能有一个使用这些值的接收端**。这会返回一个元组，第一个元素是发送端，第二个元素是接收端，`tx` 和 `rx` 通常作为这两者的缩写。

>   信道的内部实现使用了泛型，一旦确定了信道传输值的类型，就不能再修改。

`thread::spawn` 函数创建一个线程并使用 `move` 将 `tx` 移动到闭包中，这样子线程就拥有 `tx` 了。**线程需要拥有信道发送端所有权才能向信道发送消息**。

发送端的 `send` 方法用来获取需要放入信道的值，它会返回一个 `Result`，若接收端已被丢弃，将没有发送目标，会返回错误。

信道的接收端有两个常用的方法：`recv` 和 `try_recv`：

-   `recv` 方法会阻塞当前线程执行直到从信道中接收一个值。它返回一个 `Result`，`Ok` 值包含接收到的信息，`Err` 值表示信道发送端被关闭；

-   `try_recv` 方法不会阻塞。它立刻返回一个 `Result`，`Ok` 值包含接收到的信息，而 `Err` 值代表没有任何消息。若线程在等待消息过程中还有其它代码需要执行时使用 `try_recv`，如编写一个循环来频繁调用 `try_recv`，在有可用消息时进行处理，否则处理其它工作直到再次检查。

### 不阻塞的 try_recv

```rust
let (tx, rx) = mpsc::channel();
thread::spawn(move || {
    tx.send(1).unwrap();
});

for _ in 0..3 {
    println!("{:?}", rx.try_recv());
}
```

执行结果：

```
Err(Empty)
Ok(1)
Err(Disconnected)
```

由于子线程的创建需要时间，因此主线程中的代码会先执行，而此时子线程的消息还未来得及发送。

`for` 中的 `try_recv ` 方法首先读取一次消息，由于消息没有发出，此次读取会报错，第二次读取时消息已经发送，因此可以获取到值，第三次由于子线程结束，发送端离开作用域，因此信道被看作关闭。

### 信道与所有权

所有权规则有助于在消息传递中进行安全的并发：

```rust
thread::spawn(move || {
    let v = String::from("hello");
    tx.send(v).unwrap();
    println!("v = {}", v);    // 错误，v 已经移动
});
```

这里尝试在调用 `send` 方法发送 `v` 到信道后再将其打印出来。由于 `send` 是获取所有权的，因此编译不通过。若允许在发送信道后依然可在发送端线程使用该值，那么可能在接收端线程使用该值之前就被修改或丢弃，这将导致错误，所有权系统会保证值在发送后是肯定有效的。

### 发送多个值

```rust
let (tx, rx) = mpsc::channel();
thread::spawn(move || {
    let vec = vec![
        String::from("hello"),
        String::from("world"),
        String::from("hi"),
        String::from("ok"),
    ];

    for v in vec {
        tx.send(v).unwrap();
        thread::sleep(Duration::from_millis(100));
    }
});

for v in rx {
    println!("{}", v);
}
```

在子线程中将字符串 vector 发送到主线程，在主线程中，不再显式调用 `recv` 方法，而是将 `rx` 当作一个迭代器。**当信道被关闭时，迭代器才会结束**。

### 多个发送端

```rust
let (tx, rx) = mpsc::channel();
let tx2 = tx.clone();
thread::spawn(move || {
    let vec = vec![String::from("hello"), String::from("world")];
    for v in vec {
        tx.send(v).unwrap();
        thread::sleep(Duration::from_millis(100));
    }
});

thread::spawn(move || {
    let vec = vec![String::from("hi"), String::from("ok")];
    for v in vec {
        tx2.send(v).unwrap();
        thread::sleep(Duration::from_millis(100));
    }
});

for v in rx {
    println!("{}", v);
}
```

执行结果：

```
hi   
hello
ok
world
```

对信道的发送端调用了 `clone` 方法，这会返回一个发送端的拷贝。可以创建多个线程，每个线程向同一个信道的接收端发送不同的消息。

需要注意的是:

-   所有发送端都被 `drop` 掉后，信道才会被关闭，接收端才会收到错误，进而跳出循环，最终结束主线程；
-   不能确定两个子线程的创建顺序，因此消息的发送和主线程的输出顺序也是未知的。

>   虽然不能确定线程创建的顺序，但信道中消息是有序的。对于信道而言，消息的发送顺序和接收顺序是一致的，符合先进先出原则。

若发送端没有全部 `drop` 掉，那么接收端在接收消息时会一直阻塞：

```rust
let (tx, rx) = mpsc::channel();
let tx2 = tx.clone();
thread::spawn(move || {
    tx2.send(1).unwrap();
    tx2.send(2).unwrap();
});

drop(tx);    // 若不 drop 则死循环
for v in rx {
    println!("{}", v);
}

println!("done");
```

通过 `clone` 方法创建了两个发送端，子线程执行完后 `tx2` 被释放，但 `tx` 还在，信道还未关闭，因此主线程接收端会一直阻塞，造成死循环，最后一行的 `println!` 也无法执行，因此需要将 `tx` 给手动 `drop` 掉。

### 同步和异步 channel

`mpsc` 的 channel 分为两种类型：同步和异步。

#### 异步 channel

异步 channel 表示无论接收端是否正在接收消息，发送端在发送消息时都不会阻塞。通过 `mpsc::channel` 函数创建的就是异步 channel。

```rust
let (tx, rx) = mpsc::channel();
let handle = thread::spawn(move || {
    println!("before send");
    tx.send(1).unwrap();
    println!("after send");
});

println!("before sleep");
thread::sleep(Duration::from_secs(1));
println!("after sleep");

println!("{}", rx.recv().unwrap());
handle.join().unwrap();
```

执行结果：

```
before sleep
before send  
after send
after sleep
1
```

主线程因为 `sleep` 阻塞了 1 秒，因此并没有进行消息接收，而子线程却在此期间完成了消息的发送。直到主线程阻塞结束后，才从信道中接收了子线程发送的消息。

#### 同步 channel

同步 channel 表示发送消息是阻塞的，只有在消息被接收后才解除阻塞。通过 `mpsc::sync_channel` 函数创建的就是同步 channel。

```rust
let (tx, rx) = mpsc::sync_channel(0);
// --snip--
```

执行结果：

```
before sleep
before send
after sleep
1
after send
```

`after send` 的输出是在 `1` 之后，表明**只有成功接收消息后，发送消息的过程才算完成**。在成功接收消息之前，子线程都处于阻塞状态。

#### 消息缓存

在使用同步 channel 时，`mpsc::sync_channel` 函数需要一个参数，表示消息缓存条数。

当设定为 `N` 时，发送端可以无阻塞的往信道中发送 `N` 条消息，当消息缓冲队列满了后，新的消息发送将被阻塞，即若没有接收端接收缓冲队列中的消息，那么第 `N+1` 条消息的发送将触发阻塞。

使用异步 channel 创建则没有这个缓冲值参数，上限取决于内存大小，因此异步消息非常高效且不会导致发送线程的阻塞，但存在消息未及时接收，最终占用内存过大的问题，通常可以考虑使用一个带缓冲值的同步通道来避免这种风险。

### 传输多种数据类型

一个信道只能传输一种类型的数据，要传输多种类型的数据，可以为每个类型创建一个信道，或使用枚举来实现。

```rust
#[derive(Debug)]
enum Data {
    Int(i32),
    Float(f64),
}

fn main() {
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        tx.send(Data::Int(1)).unwrap();
        tx.send(Data::Float(2.2)).unwrap();
    });

    for v in rx {
        println!("{:?}", v);
    }
}
```

需要注意的是，编译器会按照枚举中占用空间最大的那个成员进行内存对齐，因此容易造成内存上的浪费。

### MPMC

Rust 标准库只提供了 MPSC 的 channel，若要使用多发送端、多接收端的 channel，可以使用第三方库，如 [Crossbeam](https://github.com/crossbeam-rs/crossbeam)。

## 共享内存并发

使用信道来进行消息传递是处理并发的方式之一，信道类似于单所有权，一旦将一个值传送到信道中，就无法再使用这个值。共享内存类似于多所有权，多个线程可以同时访问相同内存的数据。

### 互斥器

**互斥器**表示在任意时刻，只允许一个线程访问某些数据。为了访问互斥器中的数据，线程需要先获取互斥器的**锁**。锁是一个作为互斥器一部分的数据结构，记录了谁有数据的访问权，因此互斥器为通过锁系统保护其数据。

要使用互斥器，必须做到：

-   在使用数据之前尝试获取锁；
-   处理完被互斥器所保护的数据之后，必须解锁，这样其它线程才能够获取锁。

和信道相比，互斥器则异常复杂，得益于 Rust 的类型系统和所有权，使用互斥器也不容易出错。

### Mutex\<T\>

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);
    {
        let mut n = m.lock().unwrap();
        *n = 10;
    }
    println!("{}", m.lock().unwrap());
}
```

`new` 函数创建一个 `Mutex<T>`，并使用 `lock` 方法获取锁，以访问互斥器中的数据。这个调用会阻塞当前线程，直到获得锁为止。若另一个线程拥有锁，且线程发生了 panic，则 `lock` 方法会失败。在这种情况下，锁不能再被任何对象获取，所以使用 `unwrap` 并在遇到这种情况时使线程 panic。

`Mutex<T>` 是一个智能指针，而 `lock` 方法返回一个 `MutexGuard<T>` 类型的智能指针，该智能指针是一个可修改内部数据的可变引用，其 `Drop` trait 实现确保当离开作用域时自动释放锁。

一旦获取了锁，就可以将返回值视为一个其内部数据的**可变引用**。类型系统确保在使用 `m` 中的值之前获取锁。

### Arc\<T\>

#### 共享 Mutex\<T\>

```rust
let counter = Mutex::new(0);
let mut handles = vec![];

for _ in 0..10 {
    // 错误，counter 已经移动到上一个线程中
    let handle = thread::spawn(move || {
        let mut num = counter.lock().unwrap();
        *num += 1;
    });
    handles.push(handle);
}

for handle in handles {
    handle.join().unwrap();
}

println!("Result = {}", *counter.lock().unwrap());
```

以上代码将启动 10 个线程，并在每个线程中对同一个 `counter` 值加 1，最终 `counter` 值为 10，但此代码还不能通过编译，因为 `counter` 已经移动到创建线程的闭包中，导致后面创建线程的闭包无法使用，因此 `Mutex<T>` 是单所有权的。

#### 使用 Arc\<T\>

在单线程中，可以使用 `Rc<T>` 来创建具有多所有权的不可变引用，但由于 `Rc<T>` 的操作不是**原子**的，因此不能安全的在线程间共享。当 `Rc<T>` 管理引用计数时，不能保证改变引用计数的操作不会被其它线程干扰。

要安全的在线程间共享，必须实现 `Send` trait，而 `Rc<T>` 没有实现这个 trait，但可以使用**原子引用计数** 类型 `Arc<T>`。

>   `Arc<T>` 和 `Rc<T>` 有着相同的 API，但由于 `Arc<T>` 为了保证线程安全导致有些许性能损失，因此不是所有类型都默认使用 `Arc<T>` 进行实现。

```rust
use std::sync::Arc;

let counter = Arc::new(Mutex::new(0));
let mut handles = vec![];

for _ in 0..10 {
    let counter = Arc::clone(&counter);
    let handle = thread::spawn(move || {
        let mut num = counter.lock().unwrap();
        *num += 1;
    });
    handles.push(handle);
}

for handle in handles {
    handle.join().unwrap();
}

println!("Result = {}", *counter.lock().unwrap());
```

使用 `Arc<T>` 进行封装后，就可以安全的在线程间共享数据了。

### 线程屏障

可以配合使用 `Barrier` 让多个线程都执行到某个点后，才一起继续往后执行：

```rust
use std::sync::{Arc, Barrier};
use std::thread;

fn main() {
    let mut handles = vec![];
    let b = Arc::new(Barrier::new(3));
    for _ in 0..3 {
        let t = b.clone();
        let handle = thread::spawn(move || {
            println!("hello");
            t.wait();
            println!("world");
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

执行结果：

```
hello
hello
hello
world
world
world
```

`Barrier::new` 函数接收一个参数 `N`，表示阻塞指定线程数，它会阻塞 `N-1` 个调用 `wait` 方法的线程，然后在第 `N` 个线程调用 `wait` 方法时立即继续执行所有线程。

在线程打印出 `hello` 后，使用 `wait` 方法增加了一个线程屏障，目的是等所有的线程都打印出 `hello` 后，各个线程再继续执行下面的代码。

### 结合 Arc\<T\> 和 Mutex\<T\>

`counter` 本来是一个不可变的 `Arc<T>`，但可以获得内部值的可变引用，这表示 `Mutex<T>` 提供了内部可变性。和使用 `RefCell<T>` 来改变 `Rc<T>` 中的内容类似，可以使用 `Mutex<T>` 来改变 `Arc<T>` 中的内容。

| 指针类型   | 所有权 | 可变性 |
| ---------- | ------ | ------ |
| Mutex\<T\> | 唯一   | 可变   |
| Arc\<T\>   | 多个   | 不可变 |

需要注意的是，`Rc<T>` 的内部可变性模式有造成引用循环的风险，同理 `Arc<T>` 的内部可变性模式也有造成**死锁**的风险，如当一个操作需要锁住两个资源而两个线程各持一个锁，这会造成它们之间永远相互等待。

### 比较 RefCell\<T\> 和 Mutex\<T\>

| 指针类型     | 获取不可变引用 | 获取可变引用 |
| ------------ | -------------- | ------------ |
| RefCell\<T\> | borrow         | borrow_mut   |
| Mutex\<T\>   |                | lock         |

>   和 `RefCell<T>` 的区别是 `Mutex<T>` 默认获取的就是可变引用。

### 死锁

死锁通常在另一个锁还未被释放时就去获取新的锁时触发：

```rust
let m = Mutex::new(5);
let d1 = m.lock().unwrap();
let d2 = m.lock().unwrap();
```

由于 `d1` 已经获取了锁，且未离开作用域，因此 `d2` 永远也获取不到锁，但 `lock` 方法会阻塞当前线程，因此 `d2` 永远保持获取锁的状态，而 `d1` 也永远无法解锁，从而导致了死锁。

#### 使用 try_lock

和 `lock` 方法不同，`try_lock` 方法尝试获取一次锁，若无法获取则返回一个错误，因此不会发生阻塞。

```rust
let m = Mutex::new(5);
let d1 = m.lock().unwrap();
let d2 = m.try_lock().unwrap();
```

由于不会发生阻塞，因此 `d2` 尝试获取锁发现无法获取，则会直接导致运行时 panic。

### RwLock\<T\>

`Mutex<T>` 会对每次读写都进行加锁，因此当有大量的并发读就无法满足需求了，此时就可以使用读写锁 `RwLock<T>`。

```rust
use std::sync::RwLock;

let rwlock = RwLock::new(5);
// 允许多个读
{
    let r1 = rwlock.read().unwrap();
    let r2 = rwlock.read().unwrap();
    println!("{}, {}", *r1, *r2);
}

// 只能一个写
{
    let mut w = rwlock.write().unwrap();
    *w = 10;
}

println!("{}", rwlock.read().unwrap());
```

>   `RwLock<T>` 在使用上和 `Mutex<T>` 基本相同。

无论是单线程还是多线程，需要注意以下几点：

-   同时允许多个读，但同时只能有一个写；
-   读和写不能同时存在，否则会发生死锁。

>   可以将 `read` 和 `write` 方法换成 `try_read` 和 `try_write` 方法来尝试进行一次读写，若失败则返回错误。

### 互斥锁 Vs. 读写锁

`Mutex<T>` 要更简单，因为使用 `RwLock<T>` 需要关心：

-   读和写不能同时发生，若使用 `try_xxx` 解决，需要做错误处理；
-   当读多写少时，写操作可能会因为无法获得锁导致连续多次失败；
-   `RwLock<T>` 为操作系统提供，具体实现比 `Mutex<T>` 更复杂。

两者使用场景：

-   通常统一使用 `Mutex<T>`；
-   当进行高并发读取且需要长时间对数据进行操作时，使用 `RwLock<T>`，因为 `Mutex<T>` 一次只允许一个线程去读取。

## Sync 和 Send trait

有两个内嵌于语言中的并发概念：`std::marker` 中的 `Sync` 和 `Send` trait。`marker` 代表**标记 trait**，表示该 trait 不含任何方法。

### Send trait 允许线程间转移所有权

实现了 `Send` trait 的类型的可以安全的在线程间转移所有权。除了原始指针、`Rc<T>`、`Cell<T>` 和 `RefCell<T>` 外，几乎所有类型都实现了 `Send` trait，由实现了 `Send` trait 的类型组成的类型也会自动被标记为 `Send`。

### Sync trait 允许多线程访问

实现了 `Sync` trait 的类型可以安全的在多个线程中拥有其值的引用。对于任意类型 `T`，若 `&T` 实现了  `Send` trait，则 `T` 就是 `Sync` 的，反之亦然，这表示引用可以被安全的发送到另一个线程。和 `Send` trait 类似，除了原始指针、`Rc<T>`、`Cell<T>` 和 `RefCell<T>` 外，几乎所有类型都实现了 `Sync` trait，由实现了 `Sync` trait 的类型组成的类型也是 `Sync` 的。

### 手动实现 Send 和 Sync trait 是不安全的

通常并不需要手动实现 `Send` 和 `Sync` trait，因为任何由 `Send` 和 `Sync` 的类型组成的类型，自动就是 `Send` 和 `Sync` 的。由于是标记 trait，不含任何方法，仅用于标记是否满足并发相关的性质。手动实现这些标记 trait 涉及到编写 Unsafe 代码，因此通常是不安全的。

