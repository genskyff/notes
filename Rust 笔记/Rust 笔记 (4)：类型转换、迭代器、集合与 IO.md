# 1 类型转换

## 基本类型转换



## From 和 Into

### FromStr、ToString 和 Display



## TryFrom 和 TryInto



## AsRef 和 AsMut





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
    // -- snip --
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
-   `chain`、`zip`、`unzip`
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

通过 `new` 或宏来创建。

```rust
let v1: Vec<i32> = Vec::new();
let v2: Vec<i32> = vec![];
let v3 = vec![1, 2, 3];
let v4 = vec![0; 5];
```

由于 `Vec` 实现了 `Index` 和 `IntoIterator`，因此可通过索引或 `get` 来读取指定值或切片。

```rust
let v = vec![1, 2, 3, 4, 5];
assert_eq!(&v[2], v.get(2).unwrap());
assert_eq!(&v[1..3], v.get(1..3).unwrap());
```

由于 `Vec` 也实现了 `IndexMut`，因此可以通过索引来修改值。

```rust
let mut v = vec![1, 2, 3];
v[1] = 10;
```

常见 `Vec` 方法：

-   `new`、`with_capacity`
-   `len`、`ptr`、`capacity`、`get`
-   `push`、`pop`
-   `insert`、`remove`、`swap_remove`
-   `dedup`、`clear`、`is_empty`
-   `append`、`splice`、`split_off`
-   `drain`、`drain_filter`
-   `shrink_to`、`shrink_to_fit`
-   `retrain`、`retrain_mut`
-   `reserve`、`resize`、`truncate`

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

有多种方法创建 `String`：

-   `from` 或 `to_string` 将其它类型转换成 `String`；
-   `new` 创建空 `String`；
-   `with_capacity` 创建指定容量大小且长度为 0 的字符串；
-   `from_utf8` / `from_utf16` 创建来自**有效** UTF-8 / UTF-16 字节序列的 `String`。
-   `from_utf8_lossy` / `from_utf16_lossy` 与上述行为类似，但包括无效字节序列。

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

`String` 没有实现 `Index` 和 `IndexMut`，因此不能使用索引语法，因为索引并不总是对应一个有效的 Unicode 标量值。

```rust
let s = String::from("foo");
let c = s[0]; // 错误
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
-   `push`、`push_str`、`pop`
-   `insert`、`insert_str`、`remove`
-   `drain`、`clear`、`is_empty`
-   `find`、`matches`
-   `split`、`split_off`、`split_whitespace`
-   `chars`、`bytes`、`lines`
-   `replace`、`replacen`
-   `into_bytes`、`into_boxed_str`
-   `as_bytes`、`as_str`
-   `to_lowercase`、`to_uppercase`
-   `repeat`、`parse`
-   `trim`、`trim_start`、`trim_end`

>   更多关于 `String` 的方法，可参考 [String in std::string](https://doc.rust-lang.org/std/string/struct.String.html#implementations)。

## HashMap

`HashMap` 通过 **Hash 函数**来实现键值对的映射并存储，用于不使用索引而是通过键来查找特定的值，并具有类似 `Vec` 的性质，如长度、容量和重新分配。

### CRUD

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

`clear`、`is_empty`

`remove`、`remove_entry`

>   更多关于 `HashMap` 的方法，可参考 [HashMap in std::collections](https://doc.rust-lang.org/std/collections/struct.HashMap.html#implementations)。

## HashSet

### CRUD



>   更多关于 `HashSet` 的方法，可参考 [HashSet in std::collections](https://doc.rust-lang.org/std/collections/struct.HashSet.html#implementations)。

# 4 IO

