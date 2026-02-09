# 1 文档

## rustdoc

**rustdoc** 是用于为 Rust 项目生成文档的工具。其接受一个 Crate 根文件或 Markdown 文件作为参数，并生成 HTML、CSS 和 JavaScript 文件。

```rust
// src/lib.rs

/// This is a foo
pub fn foo() {}
```

然后就可以使用 rustdoc 或 cargo 来生成文档：

```shell
rustdoc src/lib.rs
cargo doc --open
```

rustdoc 默认会在当前目录下生成 _doc_ 目录，把 Crate 根文件名作为文档名，且不会生成依赖的文档。而使用 cargo 生成的文档则会在 _target_ 下生成，把项目名作为文档名，依赖的文档也会生成。

Cargo 则会生成依赖的的文档，可通过 `--no-deps` 来关闭，`--open` 可以在生成后自动在浏览器中打开。

```shell
cargo doc --open --no-deps
```

`cargo doc -v` 可以查看调用 rustdoc 时实际传递的参数：

```shell
rustdoc --crate-name mylib src/lib.rs
        -o target/doc
        -L dependency=target/debug/deps
```

## 文档注释

除了使用 `//` 和 `/*..*/` 来注释代码外，也有特定的用于文档的注释类型，称为**文档注释**。

`///` 表示外部文档注释，`//!` 表示内部文档注释。其作用的项与外部属性和内部属性相同，并支持通过 Markdown 来格式化文本，其对应的多行形式使用 `/**..*/` 和 `/*!..*/`。

````rust
/// Returns the sum of the two arguments.
///
/// # Examples
///
/// ```
/// let result = mylib::add(1, 2);
/// assert_eq!(3, result);
/// ```
pub fn add(x: i32, y: i32) -> i32 {
    x + y
}
````

### 常用文档注释项

`Examples` 为示例代码标题，其他常用的有：

- **Panics**：函数可能会 `panic!` 的场景
- **Errors**：若函数返回 `Result`，此部分描述可能会出现的错误以及什么情况会造成这些错误
- **Safety**：若函数使用了 `unsafe`，此部分描述确保 `unsafe` 块中代码能正常工作的必要条件

## 文档属性

`///` 或 `//!` 实际上是 `#[doc = "comment"]` 或 `#![doc = "comment"]` 的语法糖，被称为**文档属性**，可以用于调整生成的文档页面。

```rust
#[doc = "This is"]
#[doc = " a"]
#[doc = " doc comment"]
// 等同于
#[doc = "This is\n a \ndoc comment"]
```

使用 `include_str!` 引入一个外部的 Markdown 文档作为该项的文档：

```rust
#[doc = include_str!("README.md")]
```

### 常用文档属性

```rust
// 调整文档图标
#![doc(html_favicon_url = "https://example.com/favicon.ico")]

// 调整文档 logo
#![doc(html_logo_url = "https://example.com/logo.jpg")]

// 隐藏该项的文档
#[doc(hidden)]

// 添加搜索索引的别名
#[doc(alias = "TheAlias")]
```

> 更多关于文档属性的信息，可参考 [The #[doc] attribute](https://doc.rust-lang.org/rustdoc/write-documentation/the-doc-attribute.html)。

# 2 Crates.io

[Crates.io](https://crates.io/) 是 Rust 官方的 Crate 仓库，每个人都可以在这上面使用和发布 Crate。

在发布 Crate 之前，需要注册账号并获取一个 API Token，然后使用 `cargo login` 登录：

```shell
cargo login <token>
```

这会将 API Token 储存在 _~/.cargo/credentials_ 中。

## 发布准备

在发布之前，需要在 Crate 的 _Cargo.toml_ 文件的 `[package]` 部分增加一些元信息。

以下字段是必须的：

- `name`：Crate 的名称，当要发布到 Cartes.io 上时，该名称必须是唯一的
- `version`：Crate 的版本
- `edition`： Rust 的版本
- `description`：对 Crate 的简单描述
- `license`：Crate 使用的许可证，可以是任意 [SPDX](https://spdx.org/licenses/) 中的标识符

一个准备好发布的 Crate 的 Cargo.toml 的最小元信息如下：

```toml
[package]
name = "demo"
version = "0.1.0"
edition = "2024"
description = "A demo crate"
license = "MIT"
```

若需要使用不存在于 SPDX 中的 license，需要将 license 文本放入一个文件，并将该文件放进项目中，然后使用 `license-file` 字段来指定文件名。

```toml
license-file = "MY_LICENSE"
```

可以通过 `OR` 来指定多个 license：

```toml
license = "MIT OR AGPL-3.0-or-later"
```

## 发布 Crate

在发布之前，可选的让 Cargo 打一个本地包，以检查问题。

```shell
cargo package --list
```

该命令会在 _target/package_ 下创建一个目录和一个 _.crate_ 文件，目录包含库的所有源文件，`--list` 可以查看其中包含的文件，Cargo 随后会基于这个 _.crate_ 文件构建库。该命令还会提示一些必要的补充信息。

准备好后就可以发布 Crate：

```shell
cargo publish
cargo publish -p <package>
cargo publish --workspace
```

同时，发布之后，包的文档也会自动发布到 [Docs.rs](https://docs.rs/)。当更新了版本后，可以修改 `version` 字段，然后再次发布。

## 撤回版本

发布是**永久性的**，对应版本不能被覆盖和删除，但可以阻止任何将来的项目把它们添加到依赖中。

Cargo 支持**撤回**某个版本，这会阻止新项目依赖此版本，不过所有现存的项目仍然能够下载和依赖这个版本。

撤回指定版本：

```shell
cargo yank --vers 1.0.1
```

`--undo` 选项撤销撤回操作，这将允许新项目能够再次开始依赖某个版本：

```shell
cargo yank --vers 1.0.1 --undo
```

> 撤回操作代表所有带有 _Cargo.lock_ 的项目的依赖不会被破坏，同时任何新生成的 _Cargo.lock_ 将不能使用被撤回的版本。

## 安装二进制 Crate

Cargo 支持从 Crates.io 下载源码并在本地编译安装和使用二进制 Crate，只有拥有二进制 Crate 的包能够被安装。

```shell
# 安装 Crate
cargo install <crate>

# 使用 Cargo.lock 中的版本安装 Crate
cargo install --locked <crate>

# 从本地 Crate 安装
cargo install --path <path>

# 从远程 git 仓库安装
cargo install --git <url>

# 查看已安装 Crate
cargo install --list

# 删除已安装 Crate
cargo uninstall <crate>
```

> 所有来自 `cargo install` 的二进制文件都会被默认安装到 `~/.cargo/bin`。

## 扩展 Cargo 子命令

Cargo 可以通过新的子命令来进行扩展，而无需修改 Cargo 本身。如在系统 `$PATH` 下有名为 `cargo-xxx` 的二进制文件，则可以通过 `cargo xxx` 来像 Cargo 子命令一样运行。

查看 Cargo 的所有子命令：

```shell
cargo --list
```

常用扩展：

- `cargo-binstall`：不编译直接安装二进制
- `cargo-cache`：清理 Cargo 所下载依赖的全局缓存
- `cargo-edit`：检查和更新项目依赖
- `cargo-update`：检查和更新通过 `cargo install` 安装的二进制 Crate
- `cargo-outdated`：检查和更新 _Cargo.toml_ 中的依赖
- `cargo-generate`：项目模板生成
- `cargo-watch`：代码更新后进行自动构建
- `cargo-deny`：检查第三方依赖的授权、来源和安全漏洞等
- `cargo-zigbuild`：使用 Zig 更方便的进行交叉编译

# 3 测试

## 测试函数

Rust 中的测试是一个带有 `#[test]` 的函数，当运行测试时，这些函数会被调用。

```rust
pub fn add(x: i32, y: i32) -> i32 {
    x + y
}

#[test]
fn test_add() {
    assert_eq!(add(1, 2), 3);
}
```

### 断言

测试中以 `assert` 开头的宏为断言，常用断言有：

- `assert!`：接受一个参数，断言是否为 `true`

- `assert_eq!`：接受两个参数，断言是否相等

- `assert_ne!`：接受两个参数，断言是否不等

- `debug_assert!`：与 `assert!` 相同，但仅在非优化构建中起作用

- `debug_assert_eq!`：与 `assert_eq!` 相同，但仅在非优化构建中起作用

- `debug_assert_ne!`：与 `assert_ne!` 相同，但仅在非优化构建中起作用

接受两个参数的断言如 `assert_eq!` 和 `assert_ne!` 在底层分别使用了 `==` 和 `!=`。当断言失败时，程序会 panic，并且会使用调试格式打印其参数，因此比较的值必需实现了 `PartialEq` 和 `Debug`。

### 自定义失败信息

除了必选参数外，断言可选地传递一个用于测试失败时的自定义信息。这些信息可由若干个参数组成，并且都会传递给 `format!` 宏来构建字符串。

```rust
#[test]
fn test_add_with_info() {
    let (a, b) = (1, 2);
    assert_eq!(add(a, b), 4, "{} + {} does not equal {}", a, b, 4);
}
```

### should_panic 属性

当测试函数是否会按照预期进行 panic 时，可以给测试函数加上 `#[should_panic]`。

```rust
pub fn div(x: i32, y: i32) -> i32 {
    if y == 0 {
        panic!("Divide by zero error");
    }
    x / y
}

#[test]
#[should_panic(expected = "by zero")]
fn test_div_by_0() {
    div(10, 0);
}
```

可以给 `#[should_panic]` 增加一个可选的 `expected` 参数，测试会匹配 panic 发生时的信息是否包含 `expected` 参数所中的字符串，可以避免由其他情况导致的 panic。

### 使用 Result

除了在测试失败时 panic，测试函数可以返回实现了 `Termination` 的类型，如 `Result<(), E>`，这样就可以使用 `?` 来返回结果。

```rust
pub fn div(x: i32, y: i32) -> Result<(), String> {
    if y == 0 {
        Err("Divide by zero".to_string())
    } else {
        println!("{}", x / y);
        Ok(())
    }
}

#[test]
fn it_works() -> Result<(), String> {
    Ok(div(4, 0)?)
}
```

> `#[should_panic]` 只能用于返回 `()` 的测试函数，因此不能在这种情况下使用。

当断言一个返回 `Result<(), E>` 的表达式时，不能使用 `?`。

```rust
#[test]
fn it_works() {
    assert!(div(10, 2).is_ok());
    assert!(div(10, 0) == Err("Divide by zero".to_string()));
    assert_eq!(div(10, 2), Ok(()));
}
```

## 控制测试

默认情况下会为每个测试函数都生成二进制文件，并运行所有测试，且所有输出都不会显示。通过传递参数，可以控制测试的行为。

直接在 `cargo test` 后接参数，可控制 Cargo 的测试策略，如测试指定项等。而在 Cargo 命令后接 `--` 再接参数则是控制测试二进制文件的测试策略，如指定测试线程数、显示输出等。

```shell
# 查看 cargo test 的可选参数
cargo test --help

# 查看测试二进制文件的可选参数
cargo test -- --help

# 简短测试信息
cargo test -q

# 指定测试线程数
cargo test -- --test-threads 1

# 显示输出
cargo test -- --show-output
```

### 指定测试项

有时运行整个测试集会耗费很长时间。若只需要执行部分测试，可以向 `cargo test` 传递要执行的测试名称，传递的名称会匹配所有符合条件的测试模块和函数。

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn foo() {}

    #[test]
    fn foo_bar() {}
}
```

以下所有名称中包含字符串 `foo` 的测试模块和函数都会被执行：

```shell
cargo test foo
```

### 忽略测试

有些函数执行起来十分耗时，大多数情况不需要测试这些函数，可以通过指定测试项来完成，但更好的是使用 `#[ignore]` 来标记测试函数，当执行测试时会被自动忽略。

```rust
#[test]
#[ignore]
fn expensive_test() {}
```

同时可以传递参数来控制这些测试：

```shell
# 仅测试忽略项
cargo test -- --ignored

# 测试包括忽略项在内的所有项
cargo test -- --include-ignored
```

## 组织测试

Rust 中，测试可以分为：

- 单元测试：小规模集中的测试一个模块或私有项
- 集成测试：测试整个库，相当于作为库的使用者，因此只能测试公有项
- 文档测试：测试文档注释中的代码示例
- 基准测试：测试函数的性能

### 单元测试

单元测试通常作为模块或函数与正常的代码放在一起，并允许测试私有项。若放在模块中，则需加上 `#[cfg(test)]`，这样该模块就仅在执行 `cargo test` 时才被编译。

```rust
pub fn add(x: i32, y: i32) -> i32 {
    internal_add(x, y)
}

fn internal_add(x: i32, y: i32) -> i32 {
    x + y
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_internal() {
        assert_eq!(4, internal_add(2, 2));
    }
}
```

`internal_adde` 函数并没有标记为 `pub`，但通过 `use super::*` 将所有项引入后，也能测试私有函数。

### 集成测试

在 _src_ 的同级目录下创建 _tests_ 目录，该目录作为集成测试目录，其中可以创建任意多的测试文件，每一个文件都是一个集成测试，且都是独立的二进制 Crate。

```rust
// src/lib.rs
pub fn add(x: i32, y: i32) -> i32 {
    x + y
}

// tests/integration_test.rs
use mylib;

#[test]
fn test_add() {
    assert_eq!(mylib::add(1, 2), 3);
}
```

由于每个集成测试都是独立的 Crate，因此需要导入外部 Crate，同时也可以导入 _Cargo.toml_ 中的依赖。

这里不需要使用 `#[cfg(test)]`，因为 `tests` 是一个特殊的目录，只会在运行测试时编译这个目录中的文件。

通过指定测试项也适用于集成测试，但也可以通过 `--test` 选项传递集成测试的文件名来运行其中的所有测试。

```shell
cargo test --test integration_test
```

由于每一个 _tests_ 中的文件都被看作独立的二进制 Crate，若需要在这些测试文件中编写模块，如一些共享的辅助功能，那么不能直接将模块放到该目录下，需要创建一个和模块同名的文件夹，并在其中创建 _mod.rs_，然后在其中编写功能，实际上这是创建模块的旧风格形式。

```rust
// tests/common/mod.rs
pub fn setup() {}

// tests/integration_test.rs
use mylib;
mod common;

#[test]
fn test_add() {
    common::setup();
    assert_eq!(mylib::add(1, 2), 3);
}
```

### 文档测试

文档注释中的 `Examples` 通常用于放置示例代码，来表明如何使用库。在测试时默认也会测试示例代码，当仅对文档进行测试时，可以使用 `cargo test --doc`。

由于文档注释中的代码块会被当做一段独立的代码来看待，因此需要使用 `use` 导入使用的包，否则会编译错误。

````rust
/// ```
/// use mylib::add;
///
/// assert_eq!(add(1, 2), 3);
/// ```
pub fn add(x: i32, y: i32) -> i32 {
    x + y
}
````

这里不需要显式写出 `main` 函数，是因为示例代码会被默认放在 `main` 中，但若需要返回一个 `Result<T, E>`，则需要显式写出。

`use` 导入或 `main` 函数这类对示例代码实际上是多余的，可通过在文档注释的代码行前增加 `#`，从而在实际生成的文档中隐藏这些行，但在测试中依然会编译这些行。

````rust
/// ```
/// # // 被隐藏的行以 `#` 开始，但仍然会被编译
/// # use mylib::try_div;
/// # fn main() -> Result<(), String> {
/// let res = try_div(10, 2)?;  // 只有这行会在文档中显示
/// # Ok(())
/// # }
/// ```
pub fn try_div(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err(String::from("Divide-by-zero"))
    } else {
        Ok(a / b)
    }
}
````

### 基准测试

#### 内置基准测试

Rust 内置了基准测试框架来通过多次运行迭代来评估性能。

> 目前需要使用 nightly 版本才能使用内置的基准测试。

将当前项目切换为 nightly 版本：

```shell
rustup override set nightly
```

要创建测试，需要声明 `#![feature(test)]`，因为这是不稳定特性，当该特性稳定后，编译器会提示可以去掉这行。然后导入内置的 `test` Crate，基准函数通过 `test::Bencher` 类型来多次迭代相同的代码，该类型仅用于测试。

在带有 `#[bench]` 的函数内部，`iter` 的参数是一个没有参数的闭包，其传递的函数会在基准测试中重复运行。

```rust
#![feature(test)]
extern crate test;

pub fn do_slow() {
    println!(".");
    for _ in 0..1000_0000 {}
}

pub fn do_fast() {}

#[bench]
fn bench_slow(b: &mut test::Bencher) {
    b.iter(|| do_slow());
}

#[bench]
fn bench_fast(b: &mut test::Bencher) {
    b.iter(|| do_fast());
}
```

> 导入内置的 Crate 不需要在 _Cargo.toml_ 的 `[dependencies]` 中添加，但必须使用 `extern crate` 来导入。

在函数中使用 `println!`，这样编译器就不会对空循环进行优化，使用 `tests::black_box` 函数也是同样的。

```rust
#[bench]
fn bench_slow(b: &mut test::Bencher) {
    b.iter(|| test::black_box(do_slow()));
}
```

> 实际上 `black_box` 函数也不能保证不会进行优化。

执行基准测试：

```shell
cargo bench
```

#### 第三方基准测试

要在 stable 版本上进行基准测试，可以使用第三方 Crate。目前最流行的第三方基准测试框架为 [criterion](https://crates.io/crates/criterion)，可以提供更详细的统计数据，并能生成图表，要使用 criterion 提供的图表功能，还需安装 [Gnuplot](http://www.gnuplot.info/)，否则会使用 [Plotters](https://crates.io/crates/plotters) 来绘图。

切换回 stable 版本：

```shell
rustup override unset
```

在 _Cargo.toml_ 中添加依赖和配置：

```toml
[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }

[[bench]]
name = "bench_sum"
harness = false
```

基准测试只会在开发阶段进行，因此在 `[dev-dependencies]` 中添加依赖。此外还添加了一个 `[[bench]]` 项，`name` 字段为测试名，`harness` 字段表示是否使用内置的基准测试工具，这里不使用所以为 `false`。

criterion 要求将用于基准测试的代码放在项目根目录下的 _benches_ 中，且每个测试文件名要与 `[[bench]]` 中 `name` 字段的值相同。

```rust
// src/lib.rs
pub fn sum_slow(n: u128) -> u128 {
    let mut sum = 0;
    for i in 1..n {
        sum += i;
    }
    sum
}

pub fn sum_fast(n: u128) -> u128 {
    (1 + n) * n / 2
}

// benches/bench_sum.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use mylib::{sum_fast, sum_slow};

const N: u128 = 1000_0000;

fn bench_slow(c: &mut Criterion) {
    c.bench_function("slow", |b| b.iter(|| black_box(sum_slow(N))));
}

fn bench_fast(c: &mut Criterion) {
    c.bench_function("fast", |b| b.iter(|| sum_fast(N)));
}

criterion_group!(benches, bench_slow, bench_fast);
criterion_main!(benches);
```

多次运行测试后，每次测试都会对比前几次的结果。
