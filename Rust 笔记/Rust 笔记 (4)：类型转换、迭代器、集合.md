# 1 类型转换

## 类型自动强转

由于要保证类型安全，Rust 中很少有隐式类型转换。类型自动强转唯一的隐式转换行为，只会在特定的位置发生，且有着诸多限制。

### 自动强转点

类型自动强转只能发生在特定位置，被称为**自动强转点**。

自动强转点包括：

-   `let`、`const`、`static` 声明语句：

    ```rust
    let _: &i8 = &mut 10; // 从 &mut i32 转换成 &i8
    ```

-   函数调用时的参数：

    ```rust
    fn foo(_: &i8) {}
    
    fn main() {
        foo(&mut 10); // 从 &mut i32 转换成 &i8
    }
    ```

-   实例化结构体、联合体或枚举变体的字段：

    ```rust
    struct Foo<'a> {
        x: &'a i8,
    }
    
    fn main() {
        Foo { x: &mut 10 }; // 从 &mut i32 转换成 &i8
    }
    ```

-   函数返回值：

    ```rust
    fn foo(x: &i32) -> &dyn std::fmt::Display {
        x // 从 &i32 转换成 &dyn Display
    }
    ```

-   方法调用时的自动引用和解引用：

    ```rust
    use std::ops::Deref;
    
    struct Wrap {
        value: String,
    }
    
    impl Deref for Wrap {
        type Target = String;
    
        fn deref(&self) -> &Self::Target {
            &self.value
        }
    }
    
    fn main() {
        let w = Wrap {
            value: "foo".to_string(),
        };
        w.len(); // 从 &Wrap 转换成 &String
    }
    ```

### 自动强转类型

并不是所有类型都能在自动强转点被自动转换，有着以下限制：

-   `T` 到 `U`，若 `T` 是 `U` 的子类型（反射性）；
-   `T` 到 `S`，若 `T` 能到 `U` 且 `U` 能到 `S`（传递性）；
-   `&mut T` 到 `&T`；
-   `*mut T` 到 `*const T`；
-   `&T` 到 `*const T`；
-   `&mut T` 到 `*mut T`；
-   `&T` 或 `&mut T` 到 `&U`，若 `T` 实现了 `Deref<Target = U>`；
-   `&mut T` 到 `&mut U`，若 `T` 实现了 `DerefMut<Target = U>`；
-   函数到函数指针；
-   非捕获闭包到函数指针；
-   `!` 到 `T`。

>   更多关于类型自动强转的信息，可参考 [类型自动强转](https://minstrel1977.gitee.io/rust-reference/type-coercions.html)。

## 显式类型转换

任何不能被自动强转的类型，都必须显式进行类型转换。

### 基本类型转换

对于基本类型，可以使用 `as` 进行转换：

```rust
let a = 1.23 as i8;
let b = 10_i8 as i32;
let c = 100 as f32;
let d = 'a' as u8;
```

内存地址和指针之间也可以转换：

```rust
let mut values = [1, 2];
let p1: *mut i32 = values.as_mut_ptr();
let addr1 = p1 as usize;
let addr2 = addr1 + std::mem::size_of::<i32>();
let p2 = addr2 as *mut i32;
unsafe {
    *p2 += 10;
}
assert_eq!(12, values[1]);
```

通过 `as` 转换不具有传递性：即使 `T` 到 `U`，`U` 到 `S`，也不代表 `T` 到 `S`。

```rust
let v = 1;
// 虽然 &T as *const T，*const T as *mut T 合法
let p = &v as *const i32 as *mut i32;
// 但 &T as *mut T 不合法
let p = &v as *mut i32;
```

## 转换相关 trait

`as` 只能用于基本类型，对于自定义类型，标准库提供了一系列用于类型转换相关的 trait。

`std::convert` 提供了多种从一种类型转换到另一种类型的 trait：

-   `From` 和 `Into`：`T` 到 `U` 之间的转换；
-   `TryFrom` 和 `TryInto`：`T` 到 `U` 之间的转换，但可能转换失败；
-   `AsRef` 和 `AsMut`：`&T` / `&mut T` 到 `&U` / `&mut U` 之间转换。

`std::borrow` 则提供了另一种针对引用转换的 trait：

-   `ToOwned`：`&T` 到 `U` 的转换；
-   `Borrow` 和 `Borrow`：与 `AsRef` 和 `AsMut` 相同，但还要求 `hash(T) == hash(U)`。

### From 和 Into

`From` 和 `Into` 的定义是对称的，其会获得所有权，然后将转换值返回，这种转换要求**不能失败**。

```rust
pub trait From<T>: Sized {
    fn from(value: T) -> Self;
}

pub trait Into<T>: Sized {
    fn into(self) -> T;
}
```

-   若实现了 `From<U> for T`，则自动实现 `Into<T> for U`，因此推荐实现 `From` 而不是 `Into`；
-   若实现了 `From<U> for T`，则自动实现 `From<T> for T` 和 `Into<T> for T`；
-   这两种转换 trait 虽然都是用作转换，但是用途不同：
    -   `From` 主要用在构造函数，用于从 `U` 构造 `T` 的实例；
    -   `Into` 主要用在函数参数，让参数类型更灵活。

```rust
struct Wrap {
    value: i32,
}

impl From<i32> for Wrap {
    fn from(value: i32) -> Self {
        Self { value }
    }
}

impl From<f64> for Wrap {
    fn from(value: f64) -> Self {
        Self {
            value: value as i32,
        }
    }
}

fn get_wrap<T: Into<Wrap>>(value: T) -> Wrap {
    value.into()
}

fn main() {
    let w = Wrap::from(1);
    get_wrap(w);
    get_wrap(1);
    get_wrap(1.1);
}
```

### FromStr、Display 和 ToString

`FromStr` 用于 `&str` 到 `T` 的转换，通常被 `&str` 的 `parse` 方法隐式使用。由于没有生命周期参数，因此 `T` 中不能包含引用。

```rust
pub trait FromStr: Sized {
    type Err;
    
    fn from_str(s: &str) -> Result<Self, Self::Err>;
}
```

而 `Display` 则用于将类型转换为用于显式输出的字符串，实现了该 trait 则自动实现了 `ToString`，并且拥有 `to_string` 方法，因此不应该直接实现 `ToString`。

```rust
pub trait Display {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result;
}
```

由于 `FromStr` 通常被 `parse` 隐式使用，其接收一个 `Formatter`，因此通常也需要实现 `Display`。

```rust
use std::{fmt::Display, str::FromStr};

struct Point(i32, i32);
struct ParsePointError;

impl Display for Point {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "({}, {})", self.0, self.1)
    }
}

impl FromStr for Point {
    type Err = ParsePointError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let s = s
            .chars()
            .filter(|c| !c.is_whitespace())
            .collect::<String>();

        let (x, y) = s
            .strip_prefix("(")
            .and_then(|s| s.strip_suffix(")"))
            .and_then(|s| s.split_once(","))
            .ok_or(ParsePointError)?;

        let x = x.parse::<i32>().map_err(|_| ParsePointError)?;
        let y = y.parse::<i32>().map_err(|_| ParsePointError)?;

        Ok(Point(x, y))
    }
}

fn main() {
    let p = "(1, 2)".parse::<Point>().unwrap_or(Point(0, 0));
    println!("{p}");
}
```

### TryFrom 和 TryInto

`From` 和 `Into` 用于不会失败的转换，`TryFrom` 和 `TryInto` 用于可能会失败的转换。

```rust
pub trait TryFrom<T>: Sized {
    type Error;

    fn try_from(value: T) -> Result<Self, Self::Error>;
}

pub trait TryInto<T>: Sized {
    type Error;

    fn try_into(self) -> Result<T, Self::Error>;
}
```

-   若实现了 `TryFrom<U> for T`，则自动实现 `TryInto<T> for U`，因此推荐实现 `TryFrom` 而不是 `TryInto`；
-   若实现了 `TryFrom<U> for T`，则自动实现 `TryFrom<T> for T` 和 `TryInto<T> for T`。

```rust
struct Positive(u32);

#[derive(Debug)]
struct TryPositiveError;

impl TryFrom<i32> for Positive {
    type Error = TryPositiveError;

    fn try_from(value: i32) -> Result<Self, Self::Error> {
        if value <= 0 {
            Err(TryPositiveError)
        } else {
            Ok(Positive(value as u32))
        }
    }
}

fn get_positive<T: TryInto<Positive>>(value: T) -> Result<Positive, TryPositiveError> {
    match value.try_into() {
        Ok(v) => Ok(v),
        Err(_) => Err(TryPositiveError),
    }
}

fn main() {
    let p = Positive::try_from(1);
    get_positive(p.unwrap());
    get_positive(1);
}
```

### AsRef 和 AsMut

`AsRef` 和 `AsMut` 用于引用之间的转换，前者用于不可变引用，后者用于可变引用，这种转换要求**不能失败**。

```rust
pub trait AsRef<T: ?Sized> {
    fn as_ref(&self) -> &T;
}

pub trait AsMut<T: ?Sized> {
    fn as_mut(&mut self) -> &mut T;
}
```

`AsRef` 和 `AsMut` 都会自动解引用：

-   若实现了 `AsRef<U> for T`，则 `&T`、`&mut T`、`&&mut T` 都能调用 `as_ref`；
-   若实现了 `AsMut<U> for T`，则 `&mut T`、`&mut &mut T` 都能调用 `as_mut`。

```rust
struct Wrap {
    value: i32,
}

impl AsRef<i32> for Wrap {
    fn as_ref(&self) -> &i32 {
        &self.value
    }
}

impl AsMut<i32> for Wrap {
    fn as_mut(&mut self) -> &mut i32 {
        &mut self.value
    }
}

fn main() {
    let mut w = Wrap { value: 1 };
    // r1 == r2 == r3
    let r1 = w.as_ref();
    let r2 = (&mut w).as_ref();
    let r3 = (&&mut w).as_ref();
    
    // m1 == m2
    let m1 = w.as_mut();
    let m2 = (&mut &mut w).as_mut();
}
```

由于智能指针实现了 `Deref` 或 `DerefMut`，在 `T` 上调用 `as_ref` 或 `as_mut` 会返回 `&T` 或 `&mut T`，而不是 `&U` 或 `&mut U`。

```rust
let mut w = Wrap { value: 1 };
let mut b = Box::new(w);

// 需要两次调用才能的到 value 的引用
let r1 = b.as_ref().as_ref();
let r2 = b.as_mut().as_mut();
```

这两个 trait 可以应用于函数参数，如一个接收 `AsRef<str>` 作为参数的函数，那么 `&str` 和 `String` 都可以作为参数。

```rust
fn get_foo<T: AsRef<str>>(value: T) {
    assert_eq!("foo", value.as_ref());
}

fn main() {
    get_foo(String::from("foo"));
    get_foo("foo");
}
```

这里虽然是 `AsRef<str>`，但是对 `&str` 也可以，这并不是因为隐式解引用，而是标准库含有如下通用实现：

```rust
impl<T: ?Sized, U: ?Sized> AsRef<U> for &T
where T: AsRef<U>
{
    fn as_ref(&self) -> &U {
        <T as AsRef<U>>::as_ref(*self)
    }
}

impl<T: ?Sized, U: ?Sized> AsRef<U> for &mut T
where T: AsRef<U>
{
    fn as_ref(&self) -> &U {
        <T as AsRef<U>>::as_ref(*self)
    }
}

impl<T: ?Sized, U: ?Sized> AsMut<U> for &mut T
where T: AsMut<U>
{
    fn as_mut(&mut self) -> &mut U {
        (*self).as_mut()
    }
}
```

因此对类型 `T`，只要实现了 `AsRef<U>` 或 `AsMut<U>`，则 `&T` 或 `&mut T` 也能使用。

### Borrow 和 BorrowMut

`Borrow`、`BorrowMut` 与 `AsRef`、`AsMut` 定义基本相同，但要求 `T` 和 `U` 两者可以当作完全等同的对象来看待，即 `hash(T) == hash(U)`。如 `String` 实现了 `AsRef<str>`、`AsRef<[u8]>`、`AsRef<Path>`，但其中的三种类型的 Hash 值并不同，只有 `&str` 和 `String` 才能保证相同。

要实现 `BorrowMut`，必须先实现 `Borrow`：

```rust
pub trait Borrow<Borrowed: ?Sized> {
    fn borrow(&self) -> &Borrowed;
}

pub trait BorrowMut<Borrowed: ?Sized>: Borrow<Borrowed> {
    fn borrow_mut(&mut self) -> &mut Borrowed;
}
```

这主要用在如 `HashMap` 这种类型的键上：

```rust
let hm = std::collections::HashMap::from([("a".to_string(), 1)]);
assert_eq!(hm[&"a".to_string()], hm["a"]);
```

键的类型是 `String`，由于其实现了 `Borrow<str>`，因此可以用 `&str` 来进行索引。

### ToOwned

若 `T` 实现了 `Clone`，则可在 `&T` 或 `&mut T` 上调用 `clone` 得到 `T`，但对于像 `&str` 或 `&[u8]` 这种类型，更希望获得 `String` 或 `Vec<u8>`。`ToOwned` 则更加泛化，可将 `&T` 或 `&mut T` 转化为 `U`。

要实现 `ToOwned`，必须先实现 `Borrow<Self>`：

```rust
pub trait ToOwned {
    type Owned: Borrow<Self>;

    fn to_owned(&self) -> Self::Owned;
}
```

如标准库的通用实现中，若满足 `T: Clone`，则实现了 `ToOwned<Owned = Vec<T>> for [T]`；同样 `str` 也实现了 `ToOwned<Owned = String>`。

```rust
let v = [1, 2, 3];
let s = "foo";
let vv: Vec<_> = (&v[..]).to_owned();
let ss: String = (&s[..]).to_owned();
```

# 2 迭代器

**迭代器**可以对**元素序列**进行处理，能够遍历序列元素，且无需索引来记录序列位置。

迭代器是**惰性的**，在调用消耗迭代器的方法之前，所有生成迭代器的方法都不会有效果：

```rust
let v = vec![1, 2, 3, 4, 5];
let v_iter = v.iter();  // 在调用消耗适配器的方法前没有任何效果
```

迭代器可通过如 for 循环来遍历：

```rust
for e in v_iter {
    println!("{e}");
}
```

## 迭代器 trait

### Iterator

迭代器都实现了标准库中的 `Iterator`，其中 `Item` 定义了该 trait 的**关联类型**，即迭代器返回元素的类型。

```rust
pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}
```

要实现 `Iterator  ` 就必须实现 `next`。`next` 每次返回迭代器中的一个元素，并封装在 `Some` 中，当迭代器结束时返回 `None`。

```rust
let v = vec![1, 2, 3];
let mut v_iter = v.iter();
assert_eq!(v_iter.next(), Some(&1));
assert_eq!(v_iter.next(), Some(&2));
assert_eq!(v_iter.next(), Some(&3));
assert_eq!(v_iter.next(), None);
```

`iter` 生成一个不可变引用的迭代器，调用 `next` 会从 `Vec<T>` 中得到 `&T`。而 `v_iter` 需要是可变的，因为在迭代器上调用 `next` 方法改变了迭代器内部用来记录序列位置的状态。

使用 `for` 循环无需使 `v_iter` 可变，因为 `for` 循环会获取 `v_iter` 的所有权并使 `v_iter` 可变。`for` 实际上是一个语法糖，其内部会不断调用 `next` 来获取元素。

| 简化形式             | 等价                        | 访问级别   |
| -------------------- | --------------------------- | ---------- |
| `for e in list`      | `for e in list.into_iter()` | 拥有所有权 |
| `for e in &list`     | `for e in list.iter()`      | 只读       |
| `for e in &mut list` | `for e in list.iter_mut()`  | 读 / 写    |

>   只有在类型具有集合语义时，才有必要实现 `Iterator`，如对 `i32` 或 `()` 实现是无意义的。

### IntoIterator

若类型实现了 `IntoIterator`，就可为该类型生成迭代器，从而能够调用迭代器方法。

生成迭代器的方法有三种：

-   `into_iter`：获取元素序列的所有权并返回拥有所有权的迭代器；
-   `iter`：返回元素序列的不可变引用的迭代器；
-   `iter_mut`：返回元素序列的可变引用的迭代器。

`Iterator` 和 `IntoIterator` 的关系：

-   实现了 `Iterator ` 的就是迭代器，不需要转换即可使用迭代器方法；
-   实现了 `IntoIterator` 的可通过  `into_iter()` 方法转换为迭代器；
-   若类型 `T` 实现了 `Iterator `，那么就不能为 `T` 再实现 `IntoIterator`，因为 `T` 本身就是一个迭代器，不需要转换，但可为 `&T` 或 `&mut T` 实现。

## 消耗适配器

`Iterator` 中有一系列由标准库提供默认实现方法，一些方法在其定义中调用了 `next` 方法，这也是要实现 `Iterator` 就必须实现 `next` 的原因。这些调用 `next` 的方法被称为**消耗适配器**，因为会从迭代器中消耗元素。

```rust
let v = vec![1, 2, 3, 4, 5];
let v_iter = v.iter();
let total= v_iter.sum::<u32>();
v_iter;    // 此处 v_iter 已失效
```

>   某些消耗适配器方法不一定会消耗完所有的元素，或在消耗完后会把迭代器重置到最开始的状态，因此迭代器在之后还可以继续使用。

常见消耗适配器方法：

-   `next`、`last`、`nth`
-   `count`、`sum`
-   `fold`、`reduce`、`product`
-   `position`、`rposition`、`find`、`find_map`
-   `all`、`any`
-   `max`、`max_by`、`min`、`min_by`
-   `cmp`、`partial_cmp`
-   `eq`、`ne`、`ge`、`gt`、`le`、`lt`
-   `for_each`、`partition`、`collect`

>   更多关于消耗适配器的方法，可参考 [Iterator in std::iter](https://doc.rust-lang.org/std/iter/trait.Iterator.html#provided-methods)。

## 迭代适配器

`Iterator` 中还有另一类方法，称为**迭代适配器**，可以将当前迭代器转换为不同类型的迭代器。可以链式调用多个迭代器适配器，但因为所有的迭代器都是惰性的，需要调用一个消耗适配器方法以获取迭代器适配器的结果。

```rust
let v = vec![1, 2, 3, 4, 5];
let v_iter = v.iter();
let r = v_iter
    .filter(|&&e| e > 3)
    .map(|e| e * 2)
    .sum::<i32>();
assert_eq!(r, 18);
```

常见迭代适配器方法：

-   `map`、`map_while`
-   `filter`、`filter_map`
-   `flatten`、`flat_map`
-   `take`、`take_while`
-   `skip`、`skip_while`
-   `fuse`、`step_by`
-   `chain`、`chunk`、`zip`、`unzip`
-   `enumerate`、`rev`、`cycle`
-   `cloned`、`copied`
-   `inspect`、`by_ref`

>   更多关于迭代适配器的方法，可参考 [Iterator in std::iter](https://doc.rust-lang.org/std/iter/trait.Iterator.html#provided-methods)。

## 自定义迭代器

自定义迭代器唯一要求就是实现 `Iterator` 的 `next`：

```rust
struct Counter {
    count: u8,
}

impl Counter {
    fn new(count: u8) -> Self {
        Self { count }
    }
}

impl Iterator for Counter {
    type Item = u8;

    fn next(&mut self) -> Option<Self::Item> {
        self.count += 1;
        if self.count < 5 {
            Some(self.count)
        } else {
            None
        }
    }
}

fn main() {
    let mut counter = Counter::new(0);
    assert_eq!(Some(1), counter.next());
    assert_eq!(Some(4), counter.by_ref().last());
    assert_eq!(None, counter.next());
}
```

### 返回迭代器

对实现了 `Iterator` 的类型而言，返回一个 `Self` 就相当于返回一个 `impl Iterator`。

```rust
impl Counter {
    fn new(count: u8) -> impl Iterator<Item = <Self as Iterator>::Item> {
        Self { count }
    }
}
```

# 3 集合

Rust 标准库中有一系列被称为**集合**的数据结构。一般的数据类型都代表一个特定的值，但集合可以包含多个值。不同于内建的数组和元组类型，这些集合指向的数据是储存在堆上的，可以在运行时动态变化。

标准库 `std::collections` 中含有最常见的通用数据结构，分为四大类：

-   Sequences：`Vec`、`VecDeque`、`LinkedList`
-   Maps：`HashMap`、`BTreeMap`
-   Sets：`HashSet`、`BTreeSet`
-   Misc：`BinaryHeap`

其中最广泛使用的四种集合：

-   `Vec`：顺序存储的动态数组；
-   `String`：顺序存储的 UTF-8 字符序列；
-   `HashMap`：无序存储的键值对集合，其中键是唯一的；
-   `HashSet`：无序存储的唯一值集合。

## Vec

`Vec<T>` 用于在一个数据结构中存储多个类型相同的值。

### CRUD

有多种方法来创建 `Vec`：

-   `new` 创建空 `Vec`；
-   `from` 将其它类型转换成 `Vec`；
-   `vec!` 创建指定 `Vec`。

```rust
let v1: Vec<i32> = Vec::new();
let v2 = Vec::from([1, 2, 3]);
let v3: Vec<i32> = vec![];
let v4 = vec![1, 2, 3];
let v5 = vec![0; 5];
```

由于实现了 `Index` 和 `IndexMut`，因此除了 `get` 和 `get_mut` 外，还可通过索引来读写值。

```rust
let mut v = vec![1, 2, 3, 4, 5];
assert_eq!(&v[2], v.get(2).unwrap());
assert_eq!(&v[1..3], v.get(1..3).unwrap());
v[1] = 10;
```

由于实现了 `IntoIterator`，因此可转换为迭代器。

```rust
let v = vec![1, 2, 3];
v.iter().for_each(|e| println!("{e}"));
```

常见 `Vec` 方法：

-   `new`、`from`、`with_capacity`
-   `len`、`ptr`、`capacity`
-   `get`、`get_mut`
-   `first`、`last`
-   `push`、`pop`
-   `insert`、`remove`、`swap_remove`
-   `dedup`、`clear`、`is_empty`
-   `splice`、`split_off`

>   更多关于 `Vec` 的方法，可参考 [Vec in std::vec](https://doc.rust-lang.org/std/vec/struct.Vec.html#implementations)。

### 重新分配

`Vec` 本质上是一个包含指针、长度和容量的变量，且保证该指针指向的值是有效的。

![vector 构成](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203270427221.png)

长度指实际的元素数量，容量为实际分配的内存大小，`uninit` 表示未被初始化的内存。若长度超过了容量，那么容量会自动增加，但因为 `Vec` 保证元素是在内存中连续分配的，若在当前位置进行增加时无法满足这个要求，则会在堆上重新寻找空间，并把数据拷贝过去，这称为**重新分配**。这时若有一个该 `Vec` 的引用，但重新分配后已经不在原来的位置上，相当于指向了被释放的内存，这违反了引用总是有效的原则，于是编译器会报错。

```rust
let mut v = vec![1, 2, 3];
let e = &v[0];
v.push(4); // 错误，不能在相同作用域中同时存在可变和不可变引用
e;
```

当发生了重新分配，由于需要在堆中重新分配内存并进行拷贝操作，因此会影响效率，若能确定 `Vec` 可能的大小，可以使用 `Vec::with_capacity` 来指定容量，并可用 `as_ptr`、`len` 和 `capacity` 来获取指针、长度和容量。

```rust
let mut v = Vec::with_capacity(10);
assert_eq!(v.len(), 0);
assert_eq!(v.capacity(), 10);
println!("{:?}", v.as_ptr());

(0..10).for_each(|i| v.push(i));
assert_eq!(v.len(), 10);
assert_eq!(v.capacity(), 10);
```

## String

Rust 只有一种原生字符串类型：`&str`，它是一些储存在别处的 UTF-8 编码字符串数据的引用。

`String` 是可变的、有所有权的、UTF-8 编码的字符串类型，是 `Vec<u8>` 的封装。

### CRUD

有多种方法来创建 `String`：

-   `new` 创建空 `String`；
-   `from` 或 `to_string` 将其它类型转换成 `String`；
-   `from_utf8` / `from_utf16` 创建来自**有效** UTF-8 / UTF-16 字节序列的 `String`；
-   `from_utf8_lossy` / `from_utf16_lossy` 与不带 `lossy` 的方法类似，但包括无效字节序列。

```rust
let s1 = String::from("foo");
let s2 = "foo".to_string();
let s3 = String::new();
let s4 = String::with_capacity(10);
// "😅" 的 UTF-8 编码为 0xf0, 0x9f, 0x98, 0x85
let s5 = String::from_utf8(vec![0xf0, 0x9f, 0x98, 0x85]).unwrap();
// "😅" 的 UTF-16 编码为 0xD83D, 0xDE05
let s6 = String::from_utf16(&[0xD83D, 0xDE05]).unwrap();
let s7 = String::from_utf8_lossy(b"foo \xF0\x90\x80bar");
assert_eq!("foo �bar", s7);
```

由于没有实现 `Index` 和 `IndexMut`，因此不能使用索引，因为索引并不总是对应有效的 Unicode 标量值，但可以通过 `get` 和 `get_mut` 来读写值。

```rust
let mut s = String::from("foo");
let c = s[0]; // 错误
assert_eq!("f", s.get(..1).unwrap());
assert_eq!("F", s.get_mut(..1).map(|s| s.to_ascii_uppercase()).unwrap())
```

虽然和 `&str` 一样，`String` 也可以通过切片的方式来获取值，但若获取的切片含有无效的 Unicode 标量值，则会 panic。

```rust
let s = String::from("你好");
let s1 = s.get(..3).unwrap();
let s2 = &s[2..];   // panic
```

要遍历 `&str` 或 `String` 中的 Unicode 标量值，可以使用 `chars` 或 `bytes` 来生成迭代器。

```rust
let s = String::from("你好");
s.chars().for_each(|c| println!("{c}"));
s.bytes().for_each(|b| println!("{b:x}"));
```

使用 `+` 来拼接 `String` 值。其中由于`String` 实现了 `Add`，重载了 `+`，其函数签名类似：

```rust
fn add(self, rhs: &str) -> String;
```

因此会获取左操作数的所有权，并获取右操作数的引用：

```rust
let s1 = String::from("foo ");
let s2 = String::from("bar");
let s3 = s1 + &s2;   // s1 被移动了，不能继续使用
```

 要拼接多个字符串，`+` 的行为就十分繁琐：

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");
let s = s1 + "-" + &s2 + "-" + &s3;
```

对此可以使用 `format!`：

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");
let s = format!("{}-{}-{}", s1, s2, s3);
```

`format!` 与 `println!` 的工作原理相同，但不打印到标准输出，而是返回一个拼接后的 `String`，且不会获取任何参数的所有权。

常见 `String` 方法：

-   `new`、`from`
-   `from_utf8`、`from_utf_16`
-   `from_utf8_lossy`、`from_utf16_lossy`
-   `get`、`get_mut`
-   `push`、`push_str`、`pop`
-   `insert`、`insert_str`、`remove`
-   `clear`、`is_empty`、`is_ascii`
-   `find`、`matches`、`contains`
-   `split`、`splitn`、`split_once`、`split_inclusive`、`split_off`、`split_whitespace`
-   `chars`、`char_indices`、`bytes`、`lines`、`encode_utf16`
-   `replace`、`replacen`
-   `into_bytes`、`into_boxed_str`
-   `as_bytes`、`as_str`
-   `to_lowercase`、`to_uppercase`
-   `make_ascii_lowercase`、`make_ascii_uppercase`
-   `repeat`、`parse`
-   `strip_prefix`、`strip_suffix`
-   `start_with`、`end_with`
-   `trim`、`trim_start`、`trim_end`

>   更多关于 `String` 的方法，可参考 [String in std::string](https://doc.rust-lang.org/std/string/struct.String.html#implementations)。

## HashMap

`HashMap` 通过 Hash 函数来实现键值对的映射并存储，用于不使用索引而是通过键来查找特定的值，并具有类似 `Vec` 的性质，如长度、容量和重新分配。`HashMap` 的键必须实现 `Eq` 和 `Hash`，所有键类型必须相同，值类型也必须相同，键不能重复，且每个键都有且仅有一个关联值。

### CRUD

由于没有被包含在预导入包中，因此需要手动导入。

```rust
use std::collections::HashMap;
```

有多种方法来创建 `HashMap`：

-   `new` 创建空 `HashMap`；
-   `from` 将其它类型转换成 `HashMap`；
-   通过迭代器创建 `HashMap`。

```rust
let hm1: HashMap<&str, i32> = HashMap::new();
let hm2 = HashMap::from([("a", 1), ("b", 2)]);
let hm3 = ["a", "b"]
    .into_iter()
    .zip([1, 2])
    .collect::<HashMap<_, _>>();
```

由于实现了 `Index`，因此除了 `get` 外，还可通过索引 `key` 来读取值。

```rust
let hm = HashMap::from([("a", 1), ("b", 2)]);
assert_eq!(&hm["a"], hm.get("a").unwrap());
```

由于没有实现 `IndexMut`，因此不能通过索引来修改键值对，但可通过 `get_mut` 来修改值，或使用 `insert` 来对已存在的键插入新值。

```rust
let mut hm = HashMap::from([("a", 1)]);
hm["a"] = 5;       // 错误
hm.insert("a", 5);
*hm.get_mut("a").unwrap() = 10;
```

由于实现了 `IntoIterator`，因此可转换为迭代器。

```rust
let hm = HashMap::from([("a", 1), ("b", 2)]);
hm.iter().for_each(|(k, v)| println!("{k}: {v}"));
```

由于每个键只能关联一个值，因此对 `HashMap` 的更新可能有不同的策略：

-   若键已存在，可以选择是否更新旧值；
-   若键不存在，可以选择是否插入条目。

要根据键的存在来决定是否插入条目，可使用 `entry`，其获取键作为参数，并返回一个 `Entry` 枚举，该枚举表示该键是否存在，其上有很多实用方法，如 `insert_or` 返回对值的可变引用，并在不存在时插入指定值。

```rust
let mut hm = HashMap::from([("a", 1)]);
hm.entry("b").or_insert(2);
assert_eq!(hm["b"], 2);
```

常见 `Entry` 方法：

-   `or_default`、`or_insert`、`or_insert_with`
-   `key`、`and_modify`

>   更多关于 `Entry` 的信息，可参考 [Entry in std::collections::hash_map](https://doc.rust-lang.org/std/collections/hash_map/enum.Entry.html)。

常见 `HashMap` 方法：

-   `new`、`from`
-   `get`、`get_mut`、`get_key_value`
-   `insert`、`remove`、`remove_entry`
-   `contains_key`、`entry`
-   `clear`、`is_empty`
-   `keys`、`into_keys`
-   `values`、`into_values`、`values_mut`

>   更多关于 `HashMap` 的方法，可参考 [HashMap in std::collections](https://doc.rust-lang.org/std/collections/struct.HashMap.html#implementations)。

### 所有权

对于像 `i32` 这样实现了 `Copy` 的类型，其值可以拷贝进 `HashMap`，但对于像 `String` 这样拥有所有权的但没有实现 `Copy` 的类型，其值将被移动进 `HashMap`。

```rust
let key = String::from("foo");
let value = String::from("bar");
let hm = HashMap::from([(key, value)]);
(key, value); // 错误，key 和 value 已被移动
```

>   若将值的引用插入 `HashMap`，那么引用指向的值必须至少在 `HashMap` 有效时也是有效的。

## HashSet

`HashSet` 实际上就是一个所有值都为 `()` 的 `HashMap`，但还包含了一些其它的方法。

### CRUD

由于没有被包含在预导入包中，因此需要手动导入。

```rust
use std::collections::HashSet;
```

有多种方法来创建 `HashSet`：

-   `new` 创建空 `HashSet`；
-   `from` 将其它类型转换成 `HashSet`；
-   通过迭代器创建 `HashSet`。

```rust
let hs1: HashSet<i32> = HashSet::new();
let hs2 = HashSet::from([1, 2, 2, 3, 3, 3]);
let hs3 = [1, 2, 2, 3, 3, 3].into_iter().collect::<HashSet<_>>();
```

由于没有实现 `Index` 和 `IndexMut`，因此只能通过 `get` 来获取值。

```rust
let hs = HashSet::from([1, 2, 2, 3, 3, 3]);
assert_eq!(&2, hs.get(&2).unwrap());
```

可通过 `insert` 来插入值，若已存在则返回 `false`，否则返回 `true`。

```rust
let mut hs = HashSet::from([1, 2]);
assert_eq!(true, hs.insert(3));
assert_eq!(false, hs.insert(1));
```

`HashSet` 可求并集、交集、差集和对称差集。

```rust
let hs1 = HashSet::from([0, 1, 2]);
let hs2 = HashSet::from([1, 2, 3]);

// 并集
let uni = hs1.union(&hs2).collect::<HashSet<_>>();
// 交集
let insc = hs1.intersection(&hs2).collect::<HashSet<_>>();
// 差集 
let diff1_2 = hs1.difference(&hs2).collect::<HashSet<_>>();
let diff2_1 = hs2.difference(&hs1).collect::<HashSet<_>>();
// 对称差集
let sym_diff = hs1.symmetric_difference(&hs2).collect::<HashSet<_>>();

assert_eq!(HashSet::from([&0, &1, &2, &3]), uni);
assert_eq!(HashSet::from([&1, &2]), insc);
assert_eq!(HashSet::from([&0]), diff1_2);
assert_eq!(HashSet::from([&3]), diff2_1);
assert_eq!(HashSet::from([&0, &3]), sym_diff);
```

常见 `HashSet` 方法：

-   `new`、`from`
-   `get`、`take`
-   `insert`、`remove`
-   `replace`、`contains`
-   `clear`、`is_empty`
-   `union`、`intersection`、`difference`、`symmetric_difference`
-   `is_disjoint`、`is_subset`、`is_superset`

>   更多关于 `HashSet` 的方法，可参考 [HashSet in std::collections](https://doc.rust-lang.org/std/collections/struct.HashSet.html#implementations)。

## 扩展集合

迭代器产生一系列值，集合也可以视为一系列值，因此标准库中的集合都实现了 `Extend`，以用迭代器的内容来扩展集合。当使用已存在的键扩展集合时，值将会被更新；若集合本身允许相同键，则插入新值。

```rust
let mut v = vec![1, 2, 3];
let mut s = String::from("foo");
let mut hm = HashMap::from([("a", 1)]);
let mut hs = HashSet::from([1, 2]);

v.extend([3, 4]);
s.extend(["bar", "baz"]);
hm.extend([("a", 2), ("b", 3)]);
hs.extend([2, 3]);

assert_eq!(vec![1, 2, 3, 3, 4], v);
assert_eq!(String::from("foobarbaz"), s);
assert_eq!(HashMap::from([("a", 2), ("b", 3)]), hm);
assert_eq!(HashSet::from([1, 2, 3]), hs);
```
