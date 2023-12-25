# 1 类型转换

## 原生类型转换



## From\<T\> 和 Into\<T\>



## TryFrom\<T\> 和 TryInto\<T\>



## AsRef\<T\> 和 AsMut\<T\>



## FromStr、ToString 和 Display



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

# 3 集合

Rust 标准库中有一系列被称为**集合**的数据结构。一般的数据类型都代表一个特定的值，但集合可以包含多个值。不同于内建的数组和元组类型，这些集合指向的数据是储存在堆上的，其数据的数量不必在编译时就已知，且可以随着程序的运行动态增长或缩小。

标准库 `std::collections` 中含有最常见的通用数据结构，分为四大类：

-   Sequences：`Vec`、`VecDeque`、`LinkedList`
-   Maps：`HashMap`、`BTreeMap`
-   Sets：`HashSet`、`BTreeSet`
-   Misc：`BinaryHeap`

其中广泛使用的三种集合：

-   vector 允许顺序地储存数量可变的值；
-   字符串是字符的集合；
-   HashMap 允许将值与一个特定的键相关联。

## vector

vector 允许在一个单独的数据结构中储存多于一个的值，它们在内存中相邻地排列，且类型相同。

### 创建

使用 `new` 函数来创建长度为 0 的 vector。

```rust
// 由于没有初始化，需要类型注解
let v: Vec<i32> = Vec::new();
```

可以使用宏来创建并初始化 `Vec`，因为有了初始值，所以可以推断出类型。

```rust
let v1 = vec![1, 2, 3];
let v2 = vec![0; 5];
```

vector 在其离开作用域时会被释放，并丢弃所有元素：

```rust
{
    let v = vec![1, 2, 3];
}   // v 被丢弃
```

### 读取

使用索引或者 `get` 方法读取 vector 的值：

```rust
let mut v = vec![1, 2, 3];
let v2 = &v[1];
match v.get(1) {
    Some(i) => println!("{i}"),
    None => println!("None")
}
```

有两种读取方式的原因是，当尝试获取超过索引范围的值时处理不同：

```rust
let v = vec![1, 2, 3];
let e1 = &v[10];
let e2 = v.get(10);
```

对于 `[]` 方法，当引用一个不存在的元素时 Rust 会造成 panic。而 `get` 方法返回一个 `Option<T>`，当被传递了一个数组外的索引时，它不会 panic 而是返回 `None`。

---

使用 `for` 来遍历 vector 中每一个元素：

```rust
let mut v = vec![1, 2, 3];
for i in &v {
    println!("{i}");
}

// 遍历时修改
for i in &mut v {
    *i += 1;
    println!("{i}");
}
```

若在遍历时没有使用 vector 的引用，那么就会发生移动，此后不能再使用该 vector。

```rust
for i in v {}
// v 被移动，此处不能使用
```

---

vector 也是可以 slice 的，使用 `&` 或 `as_slice` 方法获得一个 slice：

```rust
let v = vec![1, 2, 3, 4, 5];
let s = &v[..3];
let s2 = v.as_slice();
```

### 更新

可以通过索引来修改值：

```rust
v[0] = 10;
```

---

`push` 方法增加元素，由于可变，因此需要使用 `mut`：

```rust
let mut v = Vec::new();
v.push(1);
v.push(2);
```

`insert` 方法从指定索引插入一个元素，若超出索引，则发生 panic：

```rust
let mut v = vec![1, 2, 3];
v.insert(1, 4);
assert_eq!(v, [1, 4, 2, 3]);
vec.insert(4, 5);
assert_eq!(v, [1, 4, 2, 3, 5]);
```

---

`pop` 方法删除并返回最后一个元素，返回的是一个 `Option<T>`，以便能够处理为空的情况：

```rust
let mut v = vec![1, 2, 3];
let e: Option<i32> = v.pop();
```

`remove` 方法删除并返回指定索引的元素，剩下的元素依次向前移动，若超出索引，则发生 panic：

```rust
let mut v = vec![1, 2, 3];
assert_eq!(v.remove(1), 2);
assert_eq!(v, [1, 3]);
```

由于 `remove` 方法会移动元素，因此会影响效率，若不关心元素的顺序，可以使用 `swap_remove` 方法，该方法会把最后一个元素移动到被删除的位置上：

```rust
let mut v = vec![1, 2, 3, 4];
assert_eq!(v.swap_remove(1), 2);
assert_eq!(v, [1, 4, 3]);
```

`dedup` 方法删除**连续重复**的元素，如果已经排好序，则会删除所有重复的元素：

```rust
let mut v = vec![1, 2, 2, 3, 3, 2, 4, 2, 5, 5];
v.dedup();
assert_eq!(v, [1, 2, 3, 2, 4, 2, 5]);
```

`clear` 方法清空所有元素，`is_empty` 判断是否为空，清空即将长度变为 0，但容量依然存在：

```rust
let mut v = vec![0; 5];
v.clear();
assert!(v.is_empty());
```

---

`split_off` 方法从指定索引处将 vector 分割成两个 vector，若超出索引，则发生 panic：

```rust
let mut v = vec![1, 2, 3];
let v2 = v.split_off(1);
assert_eq!(v, [1]);
assert_eq!(v2, [2, 3]);
```

### 重新分配

vector 本质上是一个包含指针、长度和容量的变量，且保证该指针指向的值是有效的。

![vector 构成](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203270427221.png)

长度指实际的元素数量，容量为实际分配的内存大小，其中 `uninit` 表示未被初始化的内存。若长度超过了容量，那么容量会自动增加，但因为 vector 保证元素是在内存中连续分配的，若在当前位置进行增加但无法满足这个要求，则会在堆上重新寻找空间，并把数据拷贝过去，这称为**重新分配**。这时若有一个该 vector 引用，但重新分配后，该 vector 已经不在原来的位置上，相当于指向了被释放的内存，这违反了引用总是有效的原则，于是编译器会报错。

```rust
let mut v = vec![1, 2, 3];
let e = &v[0];
v.push(4);     // 错误，不能在相同作用域中同时存在可变和不可变引用
```

当发生了重新分配的情况，由于需要在堆中重新分配内存并进行拷贝操作，因此会影响效率，若能确定 vector 可能的大小，可以使用 `Vec::with_capacity` 来指定预期大小，还可使用 `as_ptr`、`len` 和 `capacity` 方法来获取 vector 的指针、长度和容量。此外，可以使用 `shrink_to_fit` 方法减小容量以匹配当前长度。

```rust
let mut v = Vec::with_capacity(10);
assert_eq!(v.len(), 0);
assert_eq!(v.capacity(), 10);
println!("{:?}", v.as_ptr());
for i in 0..10 {
    v.push(i);
}
assert_eq!(v.len(), 10);
assert_eq!(v.capacity(), 10);
```

### 存储枚举

vector 只能储存相同类型的值，当需要在 vector 中储存不同类型值时，可以使用枚举，因为枚举值被认为是同一个类型。

```rust
enum ShoesSize {
    Cm(f64),
    Eur(i32)
}

let sizes = vec![
    ShoesSize::Cm(27.5),
    ShoesSize:Eur(43)
];
```

## 字符串

Rust 只有一种字符串类型：`&str`，即字符串 slice，它是一些储存在别处的 UTF-8 编码字符串数据的引用。

`String` 类型是由标准库提供的，它是可增长的、可变的、有所有权的、UTF-8 编码的字符串类型，是 `Vec<u8>` 的封装，因此和 vector 相同，由三部分组成：指针、长度和容量，也具有 vector 的性质，如添加元素时，也可能会重新分配。

### 创建

有多种方法创建 String：

-   `to_string` 方法将 `&str` 转换成 `String`；
-   `new` 函数创建空 String；
-   `from` 函数创建指定 String；
-   `from_utf8` 函数创建来自 UTF-8 字节 vector 的 String；
-   `with_capacity` 函数创建指定容量大小且长度为 0 的字符串；

```rust
let s = "hello".to_string();
let s = String::new();
let s = String::from("hello");
// "😅" 的 UTF-8 编码为 0xf0, 0x9f, 0x98, 0x85
let s = String::from_utf8(vec![0xf0, 0x9f, 0x98, 0x85]).unwrap();
let s = String::with_capacity(10);
```

`from_utf8` 函数会返回一个 `Result`，用于检查给定的 UTF-8 字节是否有效。

```rust
let s = String::from_utf8(vec![0xf0, 0x9f, 0x18, 0x85]);
let s = match s {
    Ok(s) => s,
    Err(_) => "vaild utf-8 code".to_string(),
};
```

可以使用 `from_utf8_lossy` 创建来自 UTF-8 字节 vector 的 String，且包括无效字节。

```rust
let s = b"Hello \xF0\x90\x80World";
let s = String::from_utf8_lossy(s);
assert_eq!("Hello �World", s);
```

同理，`from_utf16` 和 `from_utf16_lossy` 函数则创建来自 UTF-16 字节 vector 的 String。

### 读取

在 Rust 中，使用索引语法访问 `String` 的一部分，会出现一个错误。

```rust
let s1 = String::from("hello");
let h = s1[0];	// 错误
```

在 Rust 中，`String` 是一个 `Vec<u8>` 的封装，因此可以使用 `as_ptr`、`len` 和 `capacity` 方法来查看指针、长度和容量：

```rust
let s = String::from("Hola");
println!("{:?}", s.as_ptr());
assert_eq!(s.len(), 4);
assert_eq!(s.capacity(), 4);
```

字符串 `Hola` 的长度和容量都是 4，该字符串每一个字母的 UTF-8 编码都占用一个字节。

```rust
let s = String::from("Здравствуйте");
assert_eq!(s.len(), 24);
```

这里的长度是 24，这是使用 UTF-8 编码 `Здравствуйте` 所需要的字节数，该字符串每一个字母的 UTF-8 编码都占用两个字节。

字符串不支持索引，因为一个字符串字节值的索引并不总是对应一个有效的 Unicode 标量值。

```rust
let s = "Здравствуйте";
let c = &s[0];  // 错误
```

当使用 UTF-8 编码时，`З` 的第一个字节 `208`，第二个是 `151`，所以 `c` 的值为 `208`，但 `208` 自身并不是一个有效的字母。为了避免返回意外的值并造成不能立刻发现的 bug，编译器会直接报错。

---

Rust 中，有三种相关方式的字符串理解：**字节**、**标量值**和**字形簇**。

```
[224, 164, 168, 224, 164, 174, 224, 164, 184, 224, 165, 141, 224, 164, 164, 224, 165, 135]
```

这些是用梵文书写的印度语单词 `नमस्ते` 储存在 vector 中的 `u8` 值。

这里有 18 个字节，是计算机最终会储存的数据。若从 Unicode 标量值的角度理解，即 Rust 的 `char` 类型，则为如下字符：

```text
['न', 'म', 'स', '्', 'त', 'े']
```

这里有六个 `char`，不过第四个和第六个都不是字母，它们是发音符号，本身并没有任何意义，需要和其它字母组合起来才能形成一个完整的字母，也就是字形簇。如果以字形簇的角度理解，就会得到构成这个单词的四个字母：

```text
["न", "म", "स्", "ते"]
```

Rust 不允许使用索引获取 `String` 字符的另一个原因是，索引操作预期总是需要常数时间 O(1)，但是对于 `String` 必须从开头到索引位置遍历来确定有多少有效的字符，因此不能保证性能。

#### 索引字符串 slice

对于 `&str` 类型可以使用索引，但是返回的类型是不明确的：字节值、字符、字形簇或字符串 slice。可以使用 `[]` 和一个 range 来创建含特定字节的字符串 slice。

```rust
let s = "Здравствуйте";
let s1 = String::from("你好");
let s = &s[..4];
let s1 = &s[3..];
```

这里，`s` 会是一个 `&str`，它包含字符串的头四个字节，即 `s` 将会是 `Зд`，但获取 `&s[0..1]` 时，Rust 会在运行时 panic，因为它是一个无效的字符。

还可以用 `get` 方法来获取值，通过传递一个 range，返回一个 `Option`，用于检测值是否存在：

```rust
let s = String::from("你好");
assert_eq!(Some("好"), s.get(3..6));
```

### 遍历

获取单独的 Unicode 标量值，无论是 `&str` 还是 `String`，都可以使用 `chars` 方法。对 `नमस्ते` 调用 `chars` 方法会将其分开并返回六个 `char` 类型的值，接着就可以遍历其结果来访问每一个元素。

```rust
for c in "नमस्ते".chars() {
    println!("{}", c);
}
```

`bytes` 方法返回一个 Bytes 类型的字符串 slice 迭代器。

```rust
for b in "नमस्ते".bytes() {
    println!("{}", b);
}
```

>   从字符串中获取字形簇是很复杂的，所以标准库并没有提供这个功能。

### 更新

`String` 的内容可以改变。使用 `+` 或 `format!` 宏来拼接 `String` 值。

```rust
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2;   // s1 被移动了，不能继续使用
```

`s1` 在相加后不再有效的原因，和使用 `s2` 的引用的原因，与使用 `+` 运算符时调用的函数签名有关。

`+` 运算符使用了 `add` 函数，其函数签名类似：

```rust
fn add(self, s: &str) -> String {
```

这并不是标准库中实际的签名，标准库中的 `add` 使用泛型定义。这里 `add` 的签名使用具体类型代替了泛型。

首先，`s2` 使用了 `&`，使用第二个字符串的**引用**与第一个字符串相加。这是因为 `add` 函数的 `s` 参数：只能将 `&str` 和 `String` 相加，不能将两个 `String` 相加。

能够在 `add` 调用中使用 `&s2` 是因为 `&String` 可以被**强转**成 `&str`。当 `add` 函数被调用时，Rust 使用了 **Deref 强制转换**，即把 `&s2` 变成了 `&s2[..]`。因为 `add` 没有获取参数的所有权，所以 `s2` 在这个操作后仍然是有效的 `String`。

其次，`add` 获取了 `self` 的所有权，因为 `self` **没有**使用 `&`。`s1` 的所有权将被移动到 `add` 调用中，之后就不再有效。虽然看起来像复制两个字符串并创建一个新的字符串，而实际上这个语句会获取 `s1` 的所有权，附加上从 `s2` 中拷贝的内容，并返回结果的所有权，这个实现比拷贝要更高效。

级联多个字符串，`+` 的行为就十分繁琐：

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");
let s = s1 + "-" + &s2 + "-" + &s3;
```

对此可以使用 `format!` 宏：

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");
let s = format!("{}-{}-{}", s1, s2, s3);
```

`format!` 与 `println!` 的工作原理相同，不过它不把输出打印到屏幕上，而是返回一个带有结果内容的 `String`，且不会获取任何参数的所有权。

---

`push` 方法附加单独的字符：

```rust
let mut s = String::from("lo");
s.push('l');
```

`push_str` 方法附加字符串 slice：

```rust
let mut s = String::from("foo");
s.push_str("bar");
```

`insert` 方法从指定位置插入一个字符，若该位置不在 UTF-8 边界或超出范围，则发生 panic：

```rust
let mut s = String::from("你好");
s.insert(0, '0');
s.insert(4, '4');
s.insert(8, '8');
assert_eq!("0你4好8", s);
```

`insert_str` 方法从指定位置插入字符串 slice，若该位置不在 UTF-8 边界或超出范围，则发生 panic：

```rust
let mut s = String::from("你好");
s.insert_str(0, "哈哈，");
s.insert_str(15, "，再见");
assert_eq!("哈哈，你好，再见", s);
```

---

`pop` 方法删除最后一个字符并返回该字符，返回的是一个 `Option`：

```rust
let mut s = String::from("foo");
assert_eq!(s.pop(), Some('o'));
assert_eq!(s, "fo");
```

`remove` 方法删除指定位置的字符并返回它，若该位置不在 UTF-8 边界或超出范围，则发生 panic：

```rust
let mut s = String::from("你好");
assert_eq!(s.remove(0), '你');
assert_eq!(s.remove(0), '好');

let mut s = String::from("你好");
assert_eq!(s.remove(3), '好');
```

`clear` 方法清空字符串，`is_empty` 方法判断字符串是否为空，清空即将长度变为 0，但容量依然存在：

```rust
let mut s = String::from("foo");
s.clear();
assert!(s.is_empty());
```

---

`split_off` 方法从指定位置将原字符串分割成两个字符串，若该位置不在 UTF-8 边界或超出范围，则发生 panic：

```rust
let mut s = String::from("你好，世界");
let s2 = s.split_off(6);
assert_eq!(s, "你好");
assert_eq!(s2, "，世界");
```

`replace` 方法用另一个字符串替换匹配项，匹配项可以是模式，若不匹配，则不替换：

```rust
let s = "this is old";
assert_eq!("this is new", s.replace("old", "new"));
```

`replacen` 方法用另一个字符串替换前 N 个匹配项，匹配项可以是模式，若不匹配，则不替换：

```rust
let s = "foo foo 123 foo";
assert_eq!("new new 123 foo", s.replacen("foo", "new", 2));
assert_eq!("foo foo new23 foo", s.replacen(char::is_numeric, "new", 1));
```

### 其他操作

`into_bytes` 方法将字符串转换为 `Vec<u8>`，且会获取所有权，因此使用后原 String 不可用：

```rust
let s = String::from("hello");
let bytes = s.into_bytes();
assert_eq!(&[104, 101, 108, 108, 111][..], &bytes[..]);
s;    // s 在此处不可用
```

`as_bytes` 方法将字符串转换为 `&[u8] `：

```rust
let s = String::from("hello");
assert_eq!(&[104, 101, 108, 108, 111], s.as_bytes());
```

`as_str` 方法将字符串转换为字符串 slice：

```rust
let s = String::from("foo");
assert_eq!("foo", s.as_str());
```

---

`to_lowercase` 和 `to_uppercase` 方法分别返回字符串的小写和大写形式，没有大小写的字符不会改变：

```rust
let s = "HELLO";
let s2 = "world";
assert_eq!("hello", s.to_lowercase());
assert_eq!("WORLD", s2.to_uppercase());

let s = "哈哈";
assert_eq!(s, s.to_lowercase());
```

---

`repeat` 方法重复字符串 N 次并将其返回，当超出 usize::MAX 时，则发生 panic：

```rust
assert_eq!("abc".repeat(4), String::from("abcabcabcabc"));
```

---

`parse` 方法将字符串转换为另一种指定的类型，并返回一个 `Result`，用于检查是否成功转换：

```rust
let four = "4".parse::<u32>();
match four {
    Ok(i) => println!("{}", i),
    Err(_) => println!("Not a number"),
}
```

---

`trim`、`trim_start` 和 `trim_end` 方法分别返回删除了两端、开头和结尾位置的空白字符的字符串：

```rust
let s = "\tHello\tworld\t";
assert_eq!("Hello\tworld", s.trim());
assert_eq!("Hello\tworld\t", s.trim_start());
assert_eq!("\tHello\tworld", s.trim_end());
```

---

`find` 方法返回模式匹配的第一个字符的索引的，返回的是一个 `Option`，用于检查是否匹配成功：

```rust
let s = "你好，世界，hello world";
assert_eq!(s.find('你'), Some(0));
assert_eq!(s.find('，'), Some(6));
assert_eq!(s.find(char::is_lowercase), Some(18));
assert_eq!(s.find("哈哈"), None);
```

---

`split` 方法返回一个由指定模式匹配分割的字符串的 slice 迭代器。

```rust
let iter = "Mary had a little lamb".split(' ');
assert_eq!(iter.collect::<Vec<&str>>(), ["Mary", "had", "a", "little", "lamb"]);
```

`split_whitespace` 方法返回一个由空白符分割的字符串 slice 迭代器。

```rust
let iter = "A few words".split_whitespace();
assert_eq!(iter.collect::<Vec<&str>>(), ["A", "few", "words"]);
```

## 哈希 map

`HashMap` 类型储存了一个键类型 `K` 对应一个值类型 `V` 的映射。它通过 **Hash 函数**来实现映射，决定如何将键和值放入内存中。可以用于需要任何类型作为键来寻找数据的情况，而不是像 vector 那样通过索引。同时具有类似 vector 的性质，如长度、容量和重新分配。

### 创建

使用 `new` 方法创建一个空的 `HashMap`，并使用 `insert` 方法增加元素。

```rust
use std::collections::HashMap;
let mut scores = HashMap::new();
scores.insert(String::from("Red"), 10);
scores.insert(String::from("Green"), 20);
```

需要 `use` 标准库中集合部分的 `HashMap`，因为没有被 prelude 自动引用。

哈希 map 将的数据储存在堆上，这个 `HashMap` 的键类型是 `String` 而值类型是 `i32`，所有的键必须是相同类型，值也必须都是相同类型。

---

还可以使用一个元组的 vector 的 `collect` 方法，其中每个元组包含一个键值对。`collect` 方法可以将数据收集进一系列的集合类型，使用 `zip` 方法来创建一个元组的 vector。

```rust
let teams = vec![String::from("Red"), String::from("Green")];
let init_scores= vec![10, 20];
let scores: HashMap<_, _> = teams.iter().zip(init_scores.iter()).collect();
```

`HashMap<_, _>` 需要类型注解，因为 `collect` 有很多不同的数据结构，而除非显式指定否则无法进行类型推断。但是对于键和值的类型参数来说，可以使用下划线占位，Rust 能够根据 vector 中数据的类型推断出 `HashMap` 所包含的类型。

---

还能使用 `from` 方法，将元组作为数组的元素进行初始化：

```rust
let solar_distance = HashMap::from([
    ("Mercury", 0.4),
    ("Venus", 0.7),
    ("Earth", 1.0),
    ("Mars", 1.5),
]);
```

#### 所有权

对于像 `i32` 这样的 `Copy` trait 的类型，其值可以拷贝进哈希 map。对于像 `String` 这样拥有所有权的值，其值将被移动而哈希 map 会成为这些值的所有者。

```rust
let field_name = String::from("Red");
let field_value = String::from("10");
let mut map = HashMap::new();
// field_name 和 field_value 不再有效，
map.insert(field_name, field_value);
```

若将值的引用插入哈希 map，这些值本身不会被移进哈希 map，但是这些引用指向的值必须至少在哈希 map 有效时也是有效的。

### 读取

将键名作为索引来获取值：

```rust
assert_eq!(10, scores["Red"]);
```

将键名作为索引时，如果被索引的键不在哈希 map 中，在编译时不会报错，但运行时会发生 panic。为了避免这种情况，可以通过 `get` 方法并提供对应的键来从哈希 map 中获取值。

```rust
let mut scores = HashMap::new();
scores.insert(String::from("Red"), 10);
scores.insert(String::from("Green"), 20);
let score = scores.get(&String::from("Red"));
```

`score` 的值应为 `Some(10)`，因为 `get` 返回 `Option`，所以结果被装进 `Some`；如果某个键在哈希 map 中没有对应的值，`get` 会返回 `None`，这时需要用 match 来处理 `Option`，因此使用 `get` 方法不会发生 panic。

---

使用 `for` 来遍历哈希 map 中的每一个键值对：

```rust
let mut scores = HashMap::new();
scores.insert(String::from("Red"), 10);
scores.insert(String::from("Green"), 20);
for (key, value) in &scores {
    println!("{key}: {value}");
}
```

`len` 和 `capacity` 方法来查看长度和容量：

```rust
println!("{}", scores.len());
println!("{}", scores.capacity());
```

`shrink_to_fit` 方法减小容量以匹配当前长度：

```rust
let mut map: HashMap<i32, i32> = HashMap::with_capacity(100);
map.insert(1, 2);
map.insert(3, 4);
map.shrink_to_fit();
assert!(map.capacity() >= 2);
```

`keys` 和 `values` 方法分别返回一个键和值的迭代器：

```rust
let map = HashMap::from([
    ("a", 1),
    ("b", 2),
    ("c", 3),
]);

for key in map.keys() {
    println!("{key}");
}

for val in map.values() {
    println!("{val}");
}
```

`contains_key` 方法判断是否含有指定键：

```rust
let map = HashMap::from([("a", 1)]);
assert_eq!(map.contains_key("a"), true);
```

### 更新

键值对的数量可增长，但任何时候每个键只能关联一个值。当要更新哈希 map 中的数据时，必须处理一个键已经有值了的情况。

-   可以选择用新值替代旧值；

-   可以选择保留旧值而忽略新值，并在键没有对应值时增加新值；

-   可以结合新旧两值。

当插入了一个键值对，接着用相同的键插入一个不同的值，与这个键相关联的旧值将被替换。

```rust
let mut scores = HashMap::from([(String::from("Red"), 10)]);
// 原始值 10 被覆盖
scores.insert(String::from("Red"), 20);

// 可以将键当作索引来获取值，但不能修改值
scores["Red"] = 20;              // 错误
println!("{}", scores["Red"]);   // 正确
```

检查某个特定的键是否有值，若没有则插入一个值。哈希 map 有一个 `entry` 方法，它获取要检查的键作为参数。`entry` 方法的返回值是一个 `Entry` 枚举，它代表了可能存在或不存在的值。

```rust
let mut scores = HashMap::from([(String::from("Red"), 10)]);
scores.entry(String::from("Green")).or_insert(20);
// Red 已存在，则不插入值
scores.entry(String::from("Red")).or_insert(30);
```

`Entry` 的 `or_insert` 方法在键对应的值存在时就返回这个值的可变引用，如果不存在则将参数作为新值插入并返回新值的可变引用。

---

要找到一个键对应的值并根据旧的值更新它，如计数文本中每一个单词分别出现了多少次。使用哈希 map 以单词作为键并递增其值来记录遇到过几次这个单词，若第一次看到某个单词，则插入值 `0`。

```rust
let text = "hello world hello ok 123 world hello";
let mut map = HashMap::new();
for word in text.split_whitespace() {
    let count = map.entry(word).or_insert(0);
    *count +=1;
}
println!("{:?}", map);
```

---

`clear` 方法清空哈希 map，`is_empty` 方法判断是否为空：

```rust
let mut map = HashMap::from([("a", 1)]);
map.clear();
assert!(map.is_empty());
```

`remove` 和 `remove_entry` 方法删除指定键。前者若存在指定键，则返回对应的值，后者若存在指定键，则返回对应的键和值组成的元组：

```rust
let mut map = HashMap::from([("a", 1)]);
assert_eq!(map.remove("a"), Some(1));
assert_eq!(map.remove("a"), None);
map.insert("a", 1);
assert_eq!(map.remove_entry("a"), Some(("a", 1)));
assert_eq!(map.remove("a"), None);
```

### 合并

`extend` 方法将另一个 HashMap 的键值对添加到目标 HashMap 中。若存在重复的键，则目标 HashMap 中的值将被覆盖。

```rust
let mut map1 = HashMap::from([("a", 1)]);
let map2 = HashMap::from([("a", 2), ("b", 3)]);

map1.extend(map2);
assert_eq!(HashMap::from([("a", 2), ("b", 3)]), map1);
```

# 4 IO

