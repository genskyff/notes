# 1 常见集合

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

当发生了重新分配的情况，由于需要在堆中重新分配内存并进行拷贝操作，因此会影响效率，若能确定 vector 可能的大小，可以使用 `Vec::with_capacity` 来指定预期大小，还可使用 `as_ptr`、`len` 和 `capacity` 方法来获取 vector 的指针、长度和容量。

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
-   `with_capacity` 函数创建指定容量大小且长度为 0 的字符串。

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

# 2 错误处理

Rust 有两种错误类别：**可恢复错误**和**不可恢复错误**。前者通常代表向用户报告错误并重试操作，如未找到文件。后者通常是 Bug，如尝试访问超过数组索引的位置。

其它语言通常不区分这两类，而是采用异常处理的方式。Rust 没有异常，但有可恢复错误 `Result<T, E>` 和不可恢复错误 `panic!`。

## panic! 与不可恢复错误

当执行 `panic!` 宏时，会打印出错误信息，展开并清理栈数据，然后退出。出现这种情况的场景通常是检测到一些类型的 Bug，而程序并不清楚该如何处理。

当出现 panic 时，程序默认会进行**栈展开**。Rust 会回溯栈并清理它遇到的每一个函数的数据。另一种是直接**终止**，这会不清理数据就退出程序，程序所使用的内存由操作系统来清理。通过在 *Cargo.toml* 的 `[profile]` 部分增加 `panic = "abort"`，可在 panic 时由栈展开切换为终止。

```toml
[profile.release]
panic = "abort"
```

**文件：main.rs**

```rust
panic!("Crash here!");
```

输出包含 `panic!` 调用造成的错误信息。第一行显示了 panic 提供的信息并指明了源码中 panic 出现的位置。

```rust
thread 'main' panicked at 'Crash here!', src\main.rs:2:5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
error: process didn't exit successfully: 
```

在这个例子中，被指明的那一行是代码的一部分，且查看这一行的话会发现 `panic!` 宏的调用。在其他情况下，`panic!` 可能会出现在代码所调用的代码中。错误信息报告的文件名和行号可能指向其它代码中的 `panic!` 宏调用，而不是此代码中最终导致 `panic!` 的那一行。

### 使用 panic! 的 backtrace

可以通过 panic 时，被调函数的 backtrace 来寻找具体出问题的地方。

```rust
let v = vec![1, 2, 3];
v[9];
```

尝试访问 vector 的第 10 个元素，越界会导致 panic。`[]` 应当返回一个元素，若传递了一个无效索引，则没有可供 Rust 返回的正确的元素。

通过设置环境变量来设置 backtrace：

```shell
# Windows Powershell
$env:RUST_BACKTRACE=1; cargo run

# Windows CMD
set RUST_BACKTRACE=1 && cargo run

# Linux
RUST_BACKTRACE=1 cargo run
```

然后就可以看到带有 backtrace 的错误信息：

```
thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 9', src\main.rs:3:5
stack backtrace:
   0: std::panicking::begin_panic_handler
             at /rustc/9d1b2106e23b1abd32fce1f17267604a5102f57a\/library\std\src\panicking.rs:498 
   1: core::panicking::panic_fmt
             at /rustc/9d1b2106e23b1abd32fce1f17267604a5102f57a\/library\core\src\panicking.rs:116
   2: core::panicking::panic_bounds_check
             at /rustc/9d1b2106e23b1abd32fce1f17267604a5102f57a\/library\core\src\panicking.rs:84
   3: core::slice::index::impl$2::index<i32>
             at /rustc/9d1b2106e23b1abd32fce1f17267604a5102f57a\library\core\src\slice\index.rs:189
   4: core::slice::index::impl$0::index<i32,usize>
             at /rustc/9d1b2106e23b1abd32fce1f17267604a5102f57a\library\core\src\slice\index.rs:15
   5: alloc::vec::impl$15::index<i32,usize,alloc::alloc::Global>
             at /rustc/9d1b2106e23b1abd32fce1f17267604a5102f57a\library\alloc\src\vec\mod.rs:2520
   6: exp::main
             at .\src\main.rs:3
   7: core::ops::function::FnOnce::call_once<void (*)(),tuple$<> >
             at /rustc/9d1b2106e23b1abd32fce1f17267604a5102f57a\library\core\src\ops\function.rs:227
```

在 Debug 下才能获取带有这些信息的 backtrace，其中第 6 个指向了 *src/main.rs* 的第 3 行，可以根据这些回溯信息来定位错误。

## Result 与可恢复的错误

大部分错误并没有严重到需要程序完全停止执行。Rust 中有一个 `Result` 枚举，定义有 `Ok` 和 `Err` 这两个成员：

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`T` 和 `E` 是泛型类型参数，`T` 代表成功时返回的 `Ok` 成员中的数据类型，而 `E` 代表失败时返回的 `Err` 成员中的数据类型。因此可以将 `Result` 类型和标准库中为其定义的函数用于多种场景，这些情况中需要返回的成功值和失败值可能会各不相同。

```rust
use std::fs::File;

fn main() {
    let f = match File::open("hello.txt") {
        Ok(file) => file,
        Err(error) => panic!("Problem opening the file: {:?}", error),
    };
}
```

这里使用 match 表达式来处理 `File::open` 所返回的值，该函数会打开一个文件，并返回一个 `Result<T, E>`。泛型参数 `T` 表示成功值的类型 `std::fs::File`，失败值 `E` 的类型是 `std::io::Error`。`Result` 枚举可以提供这些信息，成功则返回一个包含文件句柄的 `Ok` 实例，失败则返回错误信息的 `Err` 实例，如文件不存在或没有访问权限等。

### 匹配不同的错误

大部分情况下并不是任何错误都将程序 panic，而是根据错误类型来进行不同的处理方式，因此可以用 `match` 表达式匹配不同的错误。

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = match File::open("hello.txt") {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Problem creating the file: {:?}", e),
            },
            _ => panic!("Problem opening the file: {:?}", error),
        },
    };
}
```

`File::open` 返回的 `Err` 成员中的值类型 `io::Error`，它是一个标准库中提供的结构体。这个结构体有一个返回 `io::ErrorKind` 值的 `kind` 方法可供调用。`io::ErrorKind` 是一个标准库提供的枚举，它的成员对应 `io` 操作可能导致的不同错误类型。这里只处理 `ErrorKind::NotFound`，表示文件并不存在。

内层 `match` 中检查的条件是 `error.kind()` 的返回值是否为 `ErrorKind`的 `NotFound` 成员。如果是，则尝试通过 `File::create` 创建文件。但创建文件也可能会失败，因此还需要再增加一个内层 `match`。当文件不能被打开，会打印出一个不同的错误信息。外层 `match` 的最后一个分支保持不变，这样对任何除了文件不存在的错误会使程序 panic。

### unwrap 和 expect

频繁的使用 `match` 会显得十分冗长而繁琐。`Result<T, E>` 类型定义了很多辅助方法来处理各种情况。其中之一叫做 `unwrap`，若 `Result` 值是成员 `Ok`，`unwrap` 会返回 `Ok` 中的值。若 `Result` 是成员 `Err`，`unwrap` 会直接调用 `panic!`。

```rust
let f = File::open("hello.txt").unwrap();
```

发生错误时 `unwrap` 会直接导致 panic，且没有额外的错误信息。此时可以使用 `expect`，它的行为与 `unwrap`，但可以提供额外的信息。

```rust
let f = File::open("hello.txt").expect("Failed to open hello.txt");
```

>   当使用 unwrap 或 expect 时，就相当于不管发生什么类型的错误，都只会发生 panic，而不是根据错误类型来进行处理。

### 传播错误

当一个函数可能会发生错误时，除了在这个函数中处理外，还可以选择让调用者来处理，称为**传播错误**。这样能更好的控制代码调用，因为调用者可能比被调用者拥有更多信息或逻辑来决定应该如何处理错误。

要传播错误，可以将错误返回：

```rust
use std::fs::File;
use std::io::{self, Read};

fn main() {
    let s = read_content("hello.txt").unwrap();
    println!("{}", s);
}

fn read_content(path: &str) -> Result<String, io::Error> {
    let mut f = match File::open(path) {
        Ok(file) => file,
        Err(error) => return Err(error),
    };

    let mut s = String::new();
    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(e) => Err(e),
    }
}
```

该函数返回一个 `Result<String, io::Error>` 类型的值。若没有任何错误并成功返回，则调用者会收到一个包含 `String` 的 `Ok` 值。若遇到任何错误，则调用者会收到一个包含 `io::Error` 的 `Err` 值。`File::open` 和 `read_to_string` 都返回 `io::Error` 类型的错误值。

接着使用 `match` 处理 `File::open` 返回的 `Result`。如果错误，则返回 `Err` 实例。`read_to_string` 方法也返回一个 `Result`，同样使用 `match` 来处理。

### 简化传播错误

使用传播错误的模式十分常见，因此 Rust 提供了 `?`  运算符来简化。

```rust
fn read_content(path: &str) -> Result<String, io::Error> {
    let mut f = File::open(path)?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}
```

`Result` 值之后的 `?` 运算符被定义为与使用 `match` 表达式有着完全相同的处理方式。若 `Result` 的值为 `Ok`，则会返回 `Ok` 中的值而程序将继续执行。若值为 `Err`，则使用 `Err` 作为返回值从函数中提前返回。

与使用 `match` 不同的是，`?` 运算符所使用接收的错误值被传递给了 `from` 函数，它定义于标准库的 `From` trait 中，其用来将错误从一种类型转换为另一种类型。当 `?` 运算符调用 `from` 函数时，收到的错误类型被转换为**由当前函数返回类型所指定的错误类型**。这在当函数返回单个错误类型来代表所有可能失败的方式时十分有效，即使其可能会因很多种原因失败。只要每一个错误类型都实现了 `from` 函数来定义如何将自身转换为返回的错误类型，`?` 运算符会自动处理这些转换。

还可以在 `?` 之后使用链式方法调用来进一步简化代码：

```rust
fn read_content(path: &str) -> Result<String, io::Error> {
    let mut s = String::new();
    File::open(path)?.read_to_string(&mut s)?;
    Ok(s)
}
```

`File::open(path)?` 直接链式调用了 `read_to_string`。仍然需要 `read_to_string` 调用结尾的 `?`，而且当 `File::open` 和 `read_to_string` 都成功没有失败时返回包含用户名 `s` 的 `Ok` 值。

---

将文件读取到一个字符串是相当常见的操作，所以标准库提供了名为 `fs::read_to_string` 的函数，它会打开文件、新建一个 `String`、读取文件的内容，并将内容放入 `String` 并返回。

```rust
fn read_content(path: &str) -> Result<String, io::Error> {
    fs::read_to_string(path)
}
```

---

`?` 运算符只能被用于返回值与 `?` 作用的值相兼容的函数，因为 `?` 运算符被定义为从函数中提前返回一个值，如果要在 `main` 函数中使用，需要修改其返回值。`main` 函数是可执行程序的入口点和退出点，为了使程序能正常工作，可以返回的类型是有限制的，但可以返回 `Result<(), E>`。

```rust
fn main() -> Result<(), io::Error> {
    let f = File::open("hello")?;
    Ok(())
}
```

`?` 也可用于 `Option<T>` 值，同样只能在返回 `Option` 的函数中使用。在 `Option<T>` 上调用 `?` 运算符的行为与 `Result<T, E>` 类似：若值是 `None`，此时 `None` 会从函数中提前返回；若值是 `Some`，`Some` 中的值作为表达式的返回值，并继续执行。

```rust
fn plus_one(n: Option<i32>) -> Option<i32> {
    Some(n? + 1)
}
```

