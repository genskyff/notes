

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

