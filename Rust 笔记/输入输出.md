输入输出

若能要在调试程序时打印出 `Rect` 实例来查看其所有字段的值，正常方法使用 `println!` 宏是不行的。

```rust
println!("{}", rect);   // 错误
```

编译器会输出以下信息：

```
help: the trait `std::fmt::Display` is not implemented for `Rect`
note: in format strings you may be able to use `{:?}` (or `{:#?}` for pretty-print) instead
```

`println!` 宏能处理很多类型的格式，不过，`{}` 默认告诉 `println!` 使用被称为 `Display` 的格式：意在提供给直接终端用户查看的输出。大部分基本类型都默认实现了 `Display`，不过对于结构体，`println!` 并没有提供一个 `Display` 实现。

编译器输出需要使用 `{:?}` 或 `{:#?}`：

```rust
println!("{:?}", rect);
```

在 `{}` 中加入 `:?` 指示符告诉 `println!` 要使用叫做 `Debug` 的输出格式。`Debug` 是一个 trait，它允许以一种对开发者有帮助的方式打印结构体，以方便调试代码时能看到它的值。

但这样做编译器依然会报错：

```
help: the trait `std::fmt::Debug` is not implemented for `Rect`
note: add `#[derive(Debug)]` or manually implement `std::fmt::Debug`
```

Rust 确实包含了打印出调试信息的功能，不过必须为结构体显式选择这个功能，为此需要在结构体定义之前添加 `#[derive(Debug)]` 注解。

```rust
#[derive(Debug)]
struct Rect {
    width: u32,
    height: u32
}
```

这时程序会出现以下输出：

```
Rect { width: 2, height: 3 }
```

它显示这个实例的所有字段，但若有一个更大的结构体时，需要有更易读一点的输出格式，为此可以使用 `{:#?}`。

```rust
println!("{:#?}", rect);
```

现在的输出格式会变成这样：

```
Rect {
    width: 2,
    height: 3,
}
```

---

另一种使用 `Debug` 格式打印数值的方法是使用 `dbg!` 宏。`dbg!` 宏接收一个表达式的所有权，打印出代码中调用宏时所在的文件和行号，以及该表达式的结果值，并返回该值的所有权。

>   `dbg!` 宏会打印到 `stderr`，而 `println!` 会打印到 `stdout`。

```rust
let rect = Rect {
    width: dbg!(2),
    height: 3,
};
dbg!(&rect);
dbg!(area(&rect));
```

```
[src\main.rs:9] 2 = 2
[src\main.rs:12] &rect = Rect {
   width: 2,
   height: 3,
}
[src\main.rs:13] area(&rect) = 6
```

因为 `dbg!` 返回表达式值的所有权，所以 `width` 字段将获得相同的值。而 `dbg!` 不需要获得所有权，因此传递一个 `rect` 的引用。