# 1 闭包

## 什么是闭包

**闭包**是可以保存进变量、作为参数传递给其他函数或作为返回值的**匿名函数**。可以在一个地方创建闭包，然后在不同的上下文中执行闭包运算。不同于函数，闭包允许捕获调用者作用域中的值。

## 函数重复调用

```rust
fn calc(x: i32) -> i32 {
    x + 1
}

fn run(n: i32) {
    if n < 10 {
        println!("{}", calc(n));
        println!("{}", calc(n));
    } else if n < 20 {
        println!("{}", calc(n));
    } else if n < 30 && n % 3 == 0 {
        println!("{}", calc(n));
    } else {
        println!("Do nothing");
    }
}
```

`calc` 函数用来模拟一些十分耗时的运算，这里简单返回参数值加一。`run` 函数用来模拟根据不同情况执行实际的运算。可以看到，这里有多处调用了 `calc` 函数。第一个 if 块调用了 2 次，第二个和第三个分别调用了 1 次，最后一个没有调用。

这里有两处问题：

-   第一个 if 块做了 2 次调用，但实际只需要 1 次；
-   多个 if 块中都进行了相同的调用，可以简化。

### 重构函数

首先可以将函数调用的返回值保存到一个变量中，之后直接传递变量值即可，如下：

```rust
fn run(n: i32) {
    let result = calc(n);
// --snip--
}
```

但这里还有一个问题，若 `n` 的值一开始就满足最后一个 if 块，那么就会做一次不必要的计算，而且若某个函数调用所传递的参数有所改变，那么变量保存的值则不能通用。

理想情况是，若参数相同，那么所需要的函数只需要调用一次，且只会在真正使用的时候才执行计算，这时候可以使用闭包。

## 定义闭包

闭包就是一个匿名函数，可以保存在变量中，这里可以将 `calc` 函数改写为闭包的形式：

```rust
fn run(n: i32) {
    let calc = |x| x + 1;
// --snip--
}
```

闭包的定义以一对竖线 `||` 开始，在竖线中指定闭包的参数，若有多个参数，则用逗号分隔，如 `|param1, param2|`。

参数之后是存放闭包体的大括号，若闭包体只有一行则大括号可以省略。大括号之后闭包的结尾，需要用于 `let` 语句的分号。因为闭包体的最后一行没有分号，所以闭包体最后一行的值作为调用闭包时的返回值。

```rust
let foo = |param| {
    println!("{}", param);
    param + 1
};
```

>   `let` 语句表示 `calc` 包含一个匿名函数的**定义**，而不是**返回值**。

定义了闭包之后，就可以像函数那样调用值。

```rust
calc(1);
foo(2);
```

## 闭包类型推断和注解

闭包不用像函数那样在参数和返回值上注明类型。函数中需要类型注解是因为需要作为接口给外部调用，因此需要严格定义。但闭包是在局部范围内使用，不用命名或作为接口。

闭包通常很短，只关联小范围的上下文。在这些有限制的上下文中，编译器可推断出参数和返回值的类型。

但也可以显式标注出类型：

```rust
|param1: i32, param2: i32| -> i32 {}
```

闭包语法和函数语法十分类似，除了使用竖线而不是括号以及几个可选的语法之外：

```rust
fn  add_one_v1   (x: u32) -> u32 { x + 1 }
let add_one_v2 = |x: u32| -> u32 { x + 1 };
let add_one_v3 = |x|             { x + 1 };
let add_one_v4 = |x|               x + 1  ;
```

第一行展示了一个函数定义，而第二行展示了一个完整标注的闭包定义。第三行闭包定义中省略了类型注解，而第四行闭包体只有一行，因此去掉了可选的大括号。这些都是有效的闭包定义，并在调用时产生相同的行为。

>   当省略类型标注时，必须在上下文中给出能够让编译器推断出类型的信息。

---

闭包定义会为每个参数和返回值推断一个具体类型：

```rust
let c = |x| x;
let s = example_closure(String::from("hello"));
let n = example_closure(5);    // 报错
```

第一次使用时，已经推断出闭包的类型，因此第二次使用不同的参数类型就会报错。

---

每个定义的闭包都是唯一的类型，即使签名相同：

```rust
let c1 = |x: i32| -> i32 {x + 1};
let c2 = |x: i32| -> i32 {x + 1};
```

这两个闭包虽然签名相同，但类型是不同的。

## Fn trait

闭包周围的作用域被定义为其所处的**环境**，因此闭包除了能够作为内联匿名函数来使用外，和函数有一个最大的区别：**可以捕获环境中的值**。

```rust
fn main() {
    let x = 3;
    let equal_to_x = |n| n == x;
    assert!(equal_to_x(3));
}
```

即使 `x` 并不是 `equal_to_x` 闭包的一个参数，也被允许使用变量 `x`，因为它与 `equal_to_x` 定义于相同的作用域。

函数则不行，这样做将无法通过编译：

```rust
// 错误
fn main() {
    let x = 3;
    fn equal_to_x(n: i32) -> bool {
        n == x
    }
    assert!(equal_to_x(3));
}
```

---

当闭包从环境中捕获一个值，闭包会在闭包体中储存这个值，这会产生额外的内存开销，而函数不允许捕获环境，因此定义和使用函数也就没有这些额外开销。

闭包可以通过三种方式捕获其环境，对应函数的三种获取参数的方式：

-   获取所有权；

-   可变借用；

-   不可变借用。

这三种捕获值的方式对应三个 `Fn` trait：

-   `std::ops::FnOnce` 从环境获取值的所有权，因此该类闭包只能使用一次；
-   `std::ops::FnMut` 从环境获取值的可变的借用，因此可以改变其环境的值；
-   `std::ops::Fn` 从环境获取值的不可变的借用。

当定义一个闭包时，编译器会根据其如何使用环境中的值来推断如何引用环境的值：

-   由于所有闭包都可以被至少调用一次，因此所有闭包都实现了 `FnOnce` ；
-   没有获取被捕获值的所有权的闭包都实现了 `FnMut` ；
-   没有对被捕获值进行可变访问的闭包都实现了 `Fn` 。 

实际上，这三种闭包 trait 的限制程度依次增大，因为一个 `FnOnce` 闭包还可以接受 `&mut T` 和 `&T`，而一个 `Fn` 闭包则只能接受 `&T`。编译器会在满足使用需求的前提下尽量以限制最多的方式捕获。

---

`Fn` 系列 trait 由标准库提供，所有的闭包都自动实现了 `FnOnce`、`FnMut` 或 `Fn` 中的一个。

>   函数也都实现了这三个 `Fn` trait，若不需要捕获环境中的值，则可以使用实现了 `Fn` trait 的闭包，或者直接使用函数。

上面的代码中，由于 `equal_to_x` 闭包不可变的借用了 `x`，所以 `equal_to_x` 具有 `Fn` trait。

---

```rust
let mut s = String::from("hello");
let mut add_suffix = || s.push_str(" world");
println!("{s}");  // 错误
add_suffix();
```

`add_suffix` 这个闭包可变的借用了 `s`，因此具有 `FnMut` trait，且需要加上 `mut` 关键字。

这里由于 `s` 已经被闭包可变的借用了，因此 `println!` 会报错，因为它会不可变的借用。

---

若需要强制闭包获取其捕获值的所有权，可以使用 `move` 关键字，这个技巧通常用在将闭包传递给新线程以便将数据移动到新线程中时。

```rust
let s = String::from("hello");
let equal_to_s = move |n| s == n;
println!("{}", s);    // 此处 s 已失效
assert!(equal_to_s(String::from("hello")));
```

>   简单类型由于实现了 `Copy` trait，就算使用了 `move` 关键字，闭包获取的也只是值的拷贝，因此需要使用像 `vector`、`String` 这样的类型。

---

```rust
let f = |_| ();
let s = String::from("hello");
f(s);
```

这里，由于 `f` 没有捕获环境的值，因此 `f` 具有 `Fn` trait，但是其参数会获取所有权，在闭包运行结束后，就 `s` 被立刻回收，因此该闭包相当于 `drop` 函数的作用。

## 闭包作为返回值

Rust 需要在编译期知道返回类型的大小，而匿名的闭包的类型是未知的，因此只有使用 `impl Trait` 才能返回一个闭包，返回闭包的有效 trait 是：`FnOnce`、`FnMut` 和 `Fn`。

此外，还必须使用 `move` 关键字，因为在离开函数作用域时，任何通过引用捕获的值都被丢弃。

```rust
fn ret_fnonce() -> impl FnOnce() {
    move || println!("FnOnce")
}

fn ret_fnmut() -> impl FnMut() {
    move || println!("FnMut")
}

fn ret_fn() -> impl Fn() {
    move || println!("Fn")
}

fn main() {
    let f_once = ret_fnonce();
    let mut f_mut = ret_fnmut();  // FnMut 必须加上 mut 关键字
    let f = ret_fn();
    f_once();
    f_mut();
    f();
}
```

## 带有泛型和 Fn trait 的闭包

回到 `run` 函数：

```rust
fn run(n: i32) {
    let calc = |x| x + 1;

    if n < 10 {
        println!("{}", calc(n));
        println!("{}", calc(n));
    } else if n < 20 {
        println!("{}", calc(n + 1));
    } else if n < 30 && n % 3 == 0 {
        println!("{}", calc(n + 1));
    } else {
        println!("Do nothing");
    }
}
```

将原来的 `calc` 函数定义成了一个闭包，然后再调用它，但这里第一个 if 块重复调用了两次，后面的 if 块分别调用了一次，且由于参数不同，因此不能简单的在开头使用变量来保存返回值。

### 惰性求值

可以定义一个存放闭包和调用闭包结果的结构体。该结构体只会在需要结果时执行闭包，并缓存结果值，之后的代码就可以直接使用该值，这种模式被称为**惰性求值**。

为了让结构体存放闭包，需要指定闭包的类型。由于每一个闭包都是一个唯一的类型，因此需要将闭包放在泛型中，并使用 trait bound 来约束闭包的签名。

```rust
struct Cacher<F>
where
    F: Fn(i32) -> i32,
{
    calc: F,
    value: Option<i32>,
}
```

这里创建了一个 `Cacher` 结构体，包含用来存放闭包的泛型字段 `calc` 和缓存值 `value`。`F` 的 trait bound 指定了 `F` 是一个使用 `Fn` 的闭包。任何储存到 `Cacher` 实例的 `calc` 字段的闭包必须有一个 `i32` 参数，且必须返回一个 `i32`。

字段 `value` 是 `Option<i32>` 类型的。在执行闭包前，`value` 为 `None`，这时使用 `Cacher` 的实现来请求闭包的结果，会执行闭包并将结果储存在 `value` 字段的 `Some` 成员中。当再次请求闭包的结果时，由于 `value` 字段不是 `None`，因此不执行闭包，而是返回存放在 `Some` 成员中的结果。

然后对 `Cacher` 进行实现：

```rust
impl<F> Cacher<F>
where
    F: Fn(i32) -> i32,
{
    fn new(calc: F) -> Self {
        Self { calc, value: None }
    }

    fn value(&mut self, arg: i32) -> i32 {
        match self.value {
            Some(v) => v,
            None => {
                let v = (self.calc)(arg);
                self.value = Some(v);
                v
            }
        }
    }
}
```

`Cacher::new` 函数获取一个闭包作为参数，类型为泛型参数 `F`，定义于 `impl` 块上下文中并与 `Cacher` 结构体有着相同的 trait bound。`Cacher::new` 返回一个在 `calc` 字段中存放了指定闭包和在 `value` 字段中存放了 `None` 值的 `Cacher` 实例，因为此时还未执行闭包。

当需要闭包的执行结果时，不同于直接调用闭包，而是调用 `value` 方法。这个方法会检查 `self.value` 是否已经有了一个 `Some` 的结果值，若存在，则返回 `Some` 中的值而不是再次执行闭包。

若 `self.value` 是 `None`，则会调用 `self.calc` 中存储的闭包，并将结果保存到 `self.value` 同时返回结果值。

然后就可以在 `run` 函数中定义并使用：

```rust
fn run(n: i32) {
    let mut closure_cache = Cacher::new(|x| x + 1);

    if n < 10 {
        println!("{}", closure_cache.value(n));
        println!("{}", closure_cache.value(n));
    } else if n < 20 {
        println!("{}", closure_cache.value(n + 1));
    } else if n < 30 && n % 3 == 0 {
        println!("{}", closure_cache.value(n + 1));
    } else {
        println!("Do nothing");
    }
}
```

不同于直接将闭包保存进变量，而是保存一个 `Cacher` 实例来存放闭包，接着可以在多个地方调用，但实际计算只会执行一次。

### Cacher 实现的限制

`Cacher` 实例对于 `value` 方法的任何 `arg` 参数的值都会返回相同的值：

```rust
let mut closure_cache = Cacher::new(|x| x);
// 都打印 1
println!("{}", closure_cache.value(1));
println!("{}", closure_cache.value(2));
println!("{}", closure_cache.value(3));
```

第一次调用后，由于 `Cacher` 实例将 `Some(1)` 保存进 `self.value`。在这之后无论传递什么参数调用 `value`，总是会返回 1。

---

可以通过再增加一个 `arg` 字段用来存放之前传递的参数，若再次调用的参数和之前的一致，则直接返回 `value` 字段的值，否则再次调用闭包，并将参数和结果保存。

```rust
struct Cacher<F>
where
    F: Fn(i32) -> i32,
{
    calc: F,
    value: Option<i32>,
    arg: Option<i32>,
}

impl<F> Cacher<F>
where
    F: Fn(i32) -> i32,
{
    fn new(calc: F) -> Self {
        Self {
            calc,
            value: None,
            arg: None,
        }
    }

    fn value(&mut self, arg: i32) -> i32 {
        match self.value {
            Some(v) => match self.arg {
                Some(a) => {
                    if a == arg {
                        v
                    } else {
                        let v = (self.calc)(arg);
                        self.value = Some(v);
                        self.arg = Some(arg);
                        v
                    }
                }
                None => v,
            },
            None => {
                let v = (self.calc)(arg);
                self.value = Some(v);
                self.arg = Some(arg);
                v
            }
        }
    }
}
```

这种做法显得十分繁琐，且含有重复代码，更好的做法是使用哈希 map 来存放值。将 `arg` 作为 key，而闭包调用的结果作为 value，这样只需要使用 `entry` 和 `or_insert` 方法即可实现相同的功能。

```rust
struct Cacher<F>
where
    F: Fn(i32) -> i32,
{
    calc: F,
    value: HashMap<i32, i32>,
}

impl<F> Cacher<F>
where
    F: Fn(i32) -> i32,
{
    fn new(calc: F) -> Self {
        Self {
            calc,
            value: HashMap::new(),
        }
    }

    fn value(&mut self, arg: i32) -> i32 {
        *self.value.entry(arg).or_insert((self.calc)(arg))
    }
}
```

## 闭包原理

Rust 中的闭包是通过一个特殊的结构体实现的。具体来说，每个闭包都是一个结构体对象，其中包含了闭包的代码和从环境中捕获的变量。这个结构体对象实现了一个或多个 `Fn` trait，以便可以像函数一样使用它。当定义一个闭包时，编译器会根据闭包的代码和捕获的变量生成一个结构体类型，这个结构体类型实现了对应的 trait。

如以下代码定义了一个闭包 `add_x` 并调用。

```rust
let x = 10;
let add_x = |y| x + y;
println!("{}", add_x(5));
```

编译时会将这个闭包转换为类似如下的结构体类型。

```rust
struct Closure {
    x: i32,
}

impl FnOnce<(i32,)> for Closure {
    type Output = i32;
    fn call_once(self, args: (i32,)) -> Self::Output {
        self.x + args.0
    }
}

impl FnMut<(i32,)> for Closure {
    fn call_mut(&mut self, args: (i32,)) -> Self::Output {
        self.x + args.0
    }
}

impl Fn<(i32,)> for Closure {
    extern "rust-call" fn call(&self, args: (i32,)) -> Self::Output {
        self.x + args.0
    }
}
```

当闭包被调用时，实际上是通过调用结构体的方法来执行的。

# 2 迭代器

## 用迭代器处理元素序列

**迭代器**可以对元素序列进行处理，它负责遍历序列中的每一项并决定何时结束的逻辑。当使用迭代器时，无需重新实现这些逻辑。

迭代器是**惰性的**，即在调用方法使用迭代器之前都不会有效果：

```rust
let v = vec![1, 2, 3, 4, 5];
let v_iter = v.iter();        // v_iter 在实际调用之上的方法前没有任何效果
```

创建迭代器后，可以使用用多种方式来利用，如使用 for 循环来遍历：

```rust
for i in v_iter {
    println!("{}", i);
}
```

当不使用时迭代器来进行遍历时，可能会需要一个索引来记录位置，还需要担心可能超出索引的使用，但使用迭代器则没有这种顾虑，提高了灵活性。

## Iterator trait 

迭代器都实现了标准库中的 `Iterator` trait：

```rust
pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
    // --snip--
}
```

`type Item` 和 `Self::Item` 定义了 trait 的**关联类型**，这个 `Item` 类型被用作 `next` 方法的返回值类型，即 `Item` 类型是迭代器返回元素的类型。

`next` 是 `Iterator` 实现者被要求定义的唯一方法。`next` 每次返回迭代器中的一个元素，并封装在 `Some` 中，当迭代器结束时返回 `None`。

可以直接调用迭代器的 `next` 方法：

```rust
fn iterator_demonstration() {
    let v = vec![1, 2, 3];
    let mut v_iter = v1.iter();
    assert_eq!(v_iter.next(), Some(&1));
    assert_eq!(v_iter.next(), Some(&2));
    assert_eq!(v_iter.next(), Some(&3));
    assert_eq!(v_iter.next(), None);
}
```

`iter` 方法生成一个不可变引用的迭代器，因此从 `next` 调用中得到的值是 vector 的不可变引用。而 `v_iter` 需要是可变的，因为在迭代器上调用 `next` 方法改变了迭代器中用来记录序列位置的状态。即**消耗**了迭代器，每一个 `next` 调用都会从迭代器中消耗一个项。

>   -   使用 `for` 循环时无需使 `v_iter` 可变，因为 `for` 循环会获取 `v_iter` 的所有权并使 `v_iter` 可变。`for` 实际上是一个语法糖，它在内部不断调用 `next` 获取元素；
>
>   | 简化形式                      | 等价                                 | 访问级别   |
>   | ----------------------------- | ------------------------------------ | ---------- |
>   | `for item in collection`      | `for item in collection.into_iter()` | 拥有所有权 |
>   | `for item in &collection`     | `for item in collection.iter()`      | 只读       |
>   | `for item in &mut collection` | `for item in collection.iter_mut()`  | 读 / 写    |
>
>   -   只有在类型具有集合语义时，才有必要实现 `Iterator` trait，如对单元类型 `()` 实现是无意义的。

## IntoIterator trait

若类型实现了 `IntoIterator` trait，就可以为该类型生成迭代器，即可以把该类型转换为迭代器，从而能够调用迭代器方法。

生成迭代器的方法有三种：

-   `into_iter`：获取元素序列的所有权并返回拥有所有权的迭代器；
-   `iter`：返回元素序列的不可变引用的迭代器；
-   `iter_mut`：返回元素序列的可变引用的迭代器。

`Iterator` 和 `IntoIterator` trait 的关系：

-   实现了 `Iterator ` trait 的就是迭代器，不需要转换即可使用迭代器方法；
-   实现了 `IntoIterator` trait 的可通过  `into_iter()` 方法转换为迭代器；
-   若类型 `T` 实现了 `Iterator ` trait，那么就不能为 `T` 再实现 `IntoIterator` trait，因为 `T` 本身就是一个迭代器，不需要转换，但可以为 `&T` 或 `&mut T` 实现 `IntoIterator` trait。

## 消耗适配器

`Iterator` trait 有一系列由标准库提供默认实现方法，一些方法在其定义中调用了 `next` 方法，这也是要实现 `Iterator` trait 则必须实现 `next` 方法的原因。

这些调用 `next` 的方法被称为**消耗适配器**，因为调用它们会消耗迭代器，即会获取迭代器的所有权。如 `Iterator` trait 的默认实现方法中的 `sum` 方法。此方法获取迭代器的所有权并反复调用 `next` 来遍历迭代器，每遍历一个项，便会将其加到一个总和并在迭代结束时返回总和。

```rust
let v = vec![1, 2, 3, 4, 5];
let v_iter = v.iter();
let total: i32 = v_iter.sum();
v_iter;    // 此处 v_iter 已失效
```

迭代器方法 `fold`，它接受两个参数，一个初始值和一个带有两个参数的闭包，闭包的两个参数为累加器和迭代器元素，闭包返回累加器在下一次迭代中的值，最后该方法返回累加器的值。

```rust
let v = vec![1, 2, 3, 4, 5];
let add_sum = v.iter().fold(0, |acc, x| acc + x);
let mul_sum = v.iter().fold(1, |acc, x| acc * x);
println!("add_sum = {}, mul_sum = {}", add_sum, mul_sum);
```

使用 `fold` 方法可以方便地计算累加和与元素乘积。与其相似的还有 `reduce` 方法，但只接受一个闭包参数，并把迭代器的第一个元素作为初始值，返回一个 `Option<T>`，当迭代器为空时，返回 `None`。

```rust
let v: Vec<i32> = vec![];
assert_eq!(None, v.into_iter().reduce(|acc, x| acc + x));
```

使用 `for_each` 方法可以立即对每个元素进行操作，且不返回值。

```rust
let mut m = [0; 10];
m.iter_mut().for_each(|x| *x += 1);
```

## 迭代适配器

`Iterator` trait 中定义了另一类方法，称为**迭代器适配器**，可以将当前迭代器转换为不同类型的迭代器。可以链式调用多个迭代器适配器，但因为所有的迭代器都是惰性的，需要调用一个消耗适配器方法以获取迭代器适配器调用的结果。

`zip` 将迭代器和另一个迭代器组合为一个新的迭代器，其中每个元素都是一个元组，元组的第一个项来自第一个迭代器，第二个项来自第二个迭代器。

```rust
let v1 = vec![1, 2, 3];
let v2 = vec![2, 3, 4];
let v3: Vec<_> = v1.iter().zip(v2.iter()).collect();
assert_eq!(vec![(&1, &2), (&2, &3), (&3, &4)], v3);
```

---

`map` 是一个典型的迭代器适配器，它接受一个闭包作为参数，使用闭包来调用每个元素以生成新的迭代器。

```rust
let v = vec![1, 2, 3, 4, 5];
let v_add_one = v.iter().map(|x| x + 1);  // 得到一个警告
```

这里的闭包创建了一个新的迭代器，对 vector 中的每个元素都加一，但是由于没有调用任何消耗适配器，因此它实际什么也不做，因此会得到一个警告。

可以调用 `collect` 方法，这个方法会消耗迭代器并将结果打包到一个集合中：

```rust
let v_add_one: Vec<_> = v.iter().map(|x| x + 1).collect();
```

由于 `collect` 方法可以打包为任意类型，因此需要显式标注集合的类型，但集合里面的元素类型可以推断出来。

---

`filter` 接受一个返回值为 `bool` 的闭包作为参数，获取迭代器的每个元素作用于闭包。若闭包返回 `true`，则该元素将会包含在 `filter` 创建的新迭代器中，否则从迭代器中过滤掉该元素。

```rust
let v = 1..100;
let v_filter: Vec<_> = v.filter(|x| x % 3 == 0).collect();
```

`v` 是一个 1 到 99 的元素序列，同样也是一个迭代器，类型是 `Range<i32>`，`filter` 获取迭代器的每一个元素，然后将为 3 的倍数的元素放入新的迭代器。

`filter_map` 接受一个返回值为 `Option<T>` 的闭包，并过滤掉值为 `None` 的元素。这可以同时过滤和产生新的迭代器，可使 `filter` 和 `map` 的链更加简洁。

```rust
let v = ["1", "2", "three", "4", "zero"];

// 两个作用相同
let result: Vec<_> = v.iter()
    .filter_map(|e| e.parse::<i32>().ok())
    .collect();
let result2: Vec<_> = v.iter()
    .map(|e| e.parse::<i32>())
    .filter(|e| e.is_ok())
    .map(|e| e.unwrap())
    .collect();

assert_eq!(result, vec![1, 2, 4]);
assert_eq!(result, result2);
```

---

迭代器方法 `flatten` 和 `flat_map` 可以创建一个扁平化嵌套结构的迭代器，但后者还会像 `map` 一样在创建时对元素进行额外的操作。

```rust
let words = ["alpha", "beta", "gamma"];

// 两个作用相同
let merged: String = words.iter()
    .flat_map(|s| s.chars())
    .collect();
let merged2: String = words.iter()
    .map(|s| s.chars())
    .flatten()
    .collect();

assert_eq!(merged, "alphabetagamma");
assert_eq!(merged, merged2);
```

此外还有比较常用的 `take`、`take_while`、`skip` 等迭代器适配器。

## 自定义迭代器

可以通过在 vector 上调用 `into_iter`、`iter` 或 `iter_mut` 来创建一个迭代器，也可以用标准库中其他的集合类型创建迭代器，如哈希 map，但还可以实现 `Iterator` trait 来自定义迭代器。

自定义迭代器唯一要求就是实现 `next` 方法，定义后就可以使用所有其他由 `Iterator` trait 中拥有默认实现的方法。

设有一个只会从 1 数到 5 的迭代器，首先创建一个结构体来存放值，并定义 `new` 来返回一个新的迭代器：

```rust
struct Counter {
    count: i32,
}

impl Counter {
    fn new() -> Self {
        Self { count: 0 }
    }
}
```

然后在 `Counter` 结构体上实现 `Iterator` trait：

```rust
impl Iterator for Counter {
    type Item = i32;
    fn next(&mut self) -> Option<Self::Item> {
        if self.count < 5 {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}
```

将迭代器的关联类型 `Item` 设置为 `i32`，表示迭代器会返回 `i32` 值集合。若 `count` 值小于 5，`next` 会返回封装在 `Some` 中的当前值，否则返回 `None`。

### 使用 next 方法

一旦实现了 `Iterator` trait，就有了一个迭代器，可以直接调用 `next` 方法：

```rust
let mut counter = Counter::new();
assert_eq!(counter.next(), Some(1));
assert_eq!(counter.next(), Some(2));
assert_eq!(counter.next(), Some(3));
assert_eq!(counter.next(), Some(4));
assert_eq!(counter.next(), Some(5));
assert_eq!(counter.next(), None);
```

调用 `next` 方法，会改变迭代器内部的状态，因此要将迭代器声明为 `mut`。

### 返回迭代器

对实现了 `Iterator` trait 的类型而言，返回一个 `Self` 就相当于返回一个 `impl Iterator`，因此 `Counter` 的 `new` 函数也可以写为如下形式。

```rust
fn new() -> impl Iterator<Item = i32> {
    Self { count: 0 }
}
```

### 结合迭代器方法

通过定义 `next` 方法实现 `Iterator` trait，就可以使用标准库定义的拥有默认实现的 `Iterator` trait 方法了。

这里结合 `zip`、`map` 和 `filter` 这三个迭代器适配器。设一个 `Counter` 通过 `zip` 方法与另一个 `Counter` 组合，然后传递给 `map` 方法使两个迭代器的元素相乘，最后使用 `filter` 方法只保留结果为 3 的倍数的元素，然后调用 `sum` 方法计算这个新生成的迭代器的各元素之和。

```rust
let counter = Counter::new();
let result: i32 = counter
    .zip(Counter::new().skip(1))
    .map(|(a, b)| a * b)
    .filter(|x| x % 3 == 0)
    .sum();
assert_eq!(18, result);
```

`skip` 方法创建一个忽略前 N 个元素的迭代器。`zip` 只产生四对值，理论上第五对值 `(5, None)` 从未被产生，因为 `zip` 在任一输入的迭代器返回 `None` 时也返回 `None`。由于 `zip` 返回一个元组，`map` 方法的闭包利用模式匹配了两个值，并将它们相乘。

