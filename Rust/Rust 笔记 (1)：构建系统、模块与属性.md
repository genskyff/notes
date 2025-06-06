> 本文使用的 Rust Edition 为 `2024`。
>
> 参考：
>
> - [The Rust Programming Language](https://kaisery.github.io/trpl-zh-cn/)
> - [Programming Rust](https://book.douban.com/subject/36547630/)
> - [The Rustonomicon](https://nomicon.purewhite.io/)
> - [Rust Atomics and Locks](https://rustcc.github.io/Rust_Atomics_and_Locks/)
> - [Rust 语言圣经](https://course.rs/about-book.html)
> - [The Rust Reference](https://doc.rust-lang.org/nightly/reference/)
> - [The Rust Standard Library](https://doc.rust-lang.org/std/)
> - [The Cargo Book](https://doc.rust-lang.org/cargo/)
> - [The rustc book](https://doc.rust-lang.org/rustc/what-is-rustc.html)
> - [The rustdoc book](https://doc.rust-lang.org/rustdoc/)

# 1 构建系统

## 安装 Rust

### Windows

前往 [官方页面](https://www.rust-lang.org/tools/install) 下载安装。

### Linux / macOS

```shell
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 配置文件

默认会在 _~/.rustup_ 中安装工具链，在 _~/.cargo_ 安装 Cargo 相关工具、二进制 Crate 和依赖包。

_~/.rustup/settings.toml_ 保存了工具链相关的配置。对于 Cargo 的构建配置，支持全局配置和针对特定项目的本地配置，构建时 Cargo 会在**当前目录和所有父目录**中查找配置文件，其查找顺序按照优先级**从高到低**为：

- 通过命令行 `--config <key>=<value>` 传递的参数
- 环境变量
- _<workspace>/foo/bar/.cargo/config.toml_
- _<workspace>/foo/.cargo/config.toml_
- _<package>/.cargo/config.toml_
- _~/.cargo/config.toml_

所有配置文件的键值会被合并，重复的以优先级高的为准，相同优先级以最后定义的为准。命令行直接传递的优先级最，项目中嵌套越深的优先级越高。执行 Cargo 时，当前目录的子目录中的配置文件会被忽略。

> - 配置文件使用 [TOML](https://toml.io/cn/v1.0.0) 格式
> - 环境变量的配置可参考 [Cargo Environment Variables](https://doc.rust-lang.org/cargo/reference/environment-variables.html)

## 构建工具

### rustup

**rustup** 是管理 Rust 工具链的命令行工具。

```shell
# 查看 rustup 版本
rustup -V

# 查看工具链配置
rustup show

# 检查工具链更新
rustup check

# 更新工具链
rustup update

# 更新 rustup
rustup self update

# 卸载 rust 和 rustup
rustup self uninstall

# 查看本地文档
rustup doc

# 查看工具链相关
rustup toolchain help

# 查看工具组件相关
rustup component help

# 查看编译目标相关
rustup target help

# 设置全局默认工具链
rustup default <stable|nightly>

# 设置目录和子目录的工具链
rustup override set <stable|nightly>

# 恢复当前目录和子目录为默认工具链
rustup override unset
```

> 更多关于 rustup 的信息，可参考 [The rustup book](https://rust-lang.github.io/rustup/)。

### rustc

**rustc** 是 Rust 的编译器。

```shell
# 查看 rust 版本
rustc -V

# 打印指定选项的编译器信息
rustc --print <cfg|calling-conventions|target-list|target-cpus|target-features>

# 编译时指定输出文件名
rustc <file> -o <name>

# 编译为指定类型文件（默认为 bin）
rustc <file> --crate-type <bin|lib|rlib|dylib|cdylib|staticlib|proc-macro>

# 编译为指定 crate 名（默认为文件名）
rustc <file> --crate-name <name>

# 编译时将指定目录添加到库搜索路径
rustc <file> -L <path>

# 编译时链接到指定的库（默认库类型为 dylib）
rustc <file> -l [static|dylib=]<name>

# 编译时导入指定 Rust 库
rustc <file> --extern <name>[=path]

# 编译时指定 Rust 版本（默认为 2015）
rustc <file> --edition <2015|2018|2021|2024>

# 编译时输出中间文件
rustc <file> --emit <asm|llvm-ir>

# 编译时配置额外编译信息
rustc <file> --cfg <name>[="value"]

# 编译时配置代码生成器选项
rustc <file> -C <opt>[=value]

# 编译时优化，等同于 -C opt-level=3
rustc <file> -O

# 编译时生成调试信息，等同于 -C debuginfo=2
rustc <file> -g
```

> 更多关于 rustc 的信息，可参考 [The rustc book](https://doc.rust-lang.org/rustc/index.html)。

### Cargo

**Cargo** 是 Rust 的构建系统和包管理器。

```shell
# 查看 cargo 版本
cargo -V

# 创建项目（默认为 bin）
cargo new <name> [--<bin|lib>]

# 将目录初始化为 Cargo 项目
cargo init

# 查找依赖
cargo search <name>

# 查看依赖信息
cargo info <name>

# 添加依赖
cargo add <name>

# 添加 dev 依赖
cargo add --dev <name>

# 添加 build 依赖
cargo add --build <name>

# 从 Git 仓库添加依赖
cargo add --git <url> [--branch <branch>] <name>

# 从本地添加依赖
cargo add --path <path>

# 删除依赖
cargo remove <name>

# 更新依赖
cargo update <name>

# 查看依赖树
cargo tree

# 检查代码
cargo check

# 编译
cargo build [-r]

# 查看详细的编译信息
cargo build -v

# 编译运行
cargo run [-r]

# 运行示例
cargo run --example <name>

# 编译并将额外参数传递给 rustc
cargo rustc [opt] [args]...

# 清空 target 目录
cargo clean

# 查看项目所有元数据
cargo metadata
```

> 更多关于 Cargo 的信息，可参考 [The Cargo Book](https://doc.rust-lang.org/cargo/)。

## 项目结构

### Cargo 项目

通常由 Cargo 创建的项目结构为：

```
.
├── .git
├── .gitignore
├── Cargo.lock（实际依赖版本）
├── Cargo.toml（项目配置）
├── src（源代码）
│   ├── lib.rs
│   └── main.rs
└── target（构建结果）
    ├── debug
    ├── doc
    └── release
```

此外通常还会包含：

```
.
├── ...
├── benches（基准测试）
│   ├── bench1.rs
│   └── bench2.rs
├── build.rs（构建脚本）
├── examples（示例代码）
│   ├── exp1.rs
│   └── exp2.rs
└── tests（集成测试）
    ├── test1.rs
    └── test2.rs
```

### Cargo 配置文件

项目配置文件 _Cargo.toml_ 的结构通常为：

```toml
[package]
name = "hello"
version = "0.1.0"
edition = "2024"

[dependencies]
rand = "0.9.0"
tokio = "*"
my-lib = { path = "../my-lib" }
axum = { git = "https://github.com/tokio-rs/axum", branch = "main" }

[dev-dependencies]
criterion = { version = "0.5.1", features = ["html_reports"] }

[build-dependencies]
cc = "1.2"
```

- `[package]`：包的主要信息
- `[dependencies]`：dev 和 release 的依赖，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)
- `[dev-dependencies]`：dev 的依赖
- `[build-dependencies]`：构建脚本的依赖

> 更多关于 Cargo 配置的信息，可以参考 [Cargo Manifest Format](https://doc.rust-lang.org/cargo/reference/manifest.html)。

### 编译产物

在 Windows 上，使用 `cargo build` 编译后，_target/debug_ 通常包含：

```
./target/debug
├── .fingerprint
├── build
├── deps
├── examples
├── incremental
├── hello.d
├── hello.exe
├── hello.pdb
├── libhello.d
└── libhello.rlib
```

- **.fingerprint**：包含构建状态的元数据
- **build**：构建脚本 _build.rs_ 的输出结果
- **deps**：依赖和库的编译结果
- **examples**：示例代码 _examples_ 的编译结果
- **incremental**：包含增量编译的状态信息
- **hello.d**：_hello.exe_ 的所有依赖声明
- **hello.exe**：可执行文件
- **hello.pdb**：包含调试信息
- **libhello.d**：_libhello.rlib_ 的所有依赖声明
- **libhello.rlib**：静态库文件

## 构建配置

在 _config.toml_ 和 _Cargo.toml_ 中可以配置构建相关参数来影响编译器行为。

### profile 配置

`profile` 为发布配置，默认包含四种：

- **dev**：`cargo build/run/check/rustc` 使用
- **release**：构建时使用 `-r` 和 `cargo install` 使用
- **test**：`cargo test` 使用，基于 dev，用于单元、集成和文档测试
- **bench**：`cargo bench` 使用，基于 release，用于基准测试

> _examples_ 中的示例代码默认使用 `dev` 配置。

```toml
[profile.release]
strip = true
lto = true
codegen-units = 1
panic = "abort"
```

常见配置选项：

- **opt-level**：`-C opt-level` 标志，表示优化级别，级别越高编译时间越多

  - `0`：dev 默认值

  - `3`：release 默认值

  - `s`：优化二进制文件大小

- **debug**：`-C debuginfo` 标志，控制二进制文件中包含的调试信息

  - `false`：无调试信息，release 默认值

  - `true`：所有调试信息，dev 默认值

- **strip**：` -C strip` 标志，控制链接器需要删除哪些信息
  - `false`：默认值，保留所有信息
  - `true`：删除调试和符号信息
- **lto**：`-C lto` 标志，控制链接时优化策略，会增加编译时间和内存消耗
  - `false`：默认值，只对代码生成单元中的本地包进行优化，若 `codegen-units` 为 1 或 `opt-level` 为 0，则不进行优化
  - `true`：最大程度优化，但最消耗资源
- **codegen-units**：`-C codegen-units` 标志，控制一个 Crate 会被拆分成多少个代码生成单元。多个单元可以并行处理，以减少编译时间，但生成后的代码性能可能较低

  - 增量构建，默认为 256
  - 非增量构建，默认为 16

- **panic**：`-C panic` 标志，控制 panic 发生时的策略，所有类型的测试、构建脚本和过程宏只能使用 `unwind`
  - `unwind`：默认值，panic 后进行栈展开并调用析构函数回收资源
  - `abort`：panic 后直接中止程序，由操作系统回收资源

> - 针对编译优化，可参考 [min-sized-rust](https://github.com/johnthagen/min-sized-rust)
> - 更多关于 profile 的信息，可参考 [Cargo Profiles](https://doc.rust-lang.org/cargo/reference/profiles.html)

### 自定义 profile

除了默认的四种 profile，还支持使用 `profile.<name>` 来自定义。当定义 profile 时，必须指定 `inherits`，用于说明配置缺失项要基于哪个 profile。

```toml
[profile.my-profile]
inherits = "release"
lto = true
```

在构建时使用 `--profile` 选项来指定自定义 profile：

```shell
cargo build --profile my-profile
```

自定义 profile 的编译结果存放在 _target_ 下的同名目录中。

### 构建依赖 profile

默认情况下，所有 profile 都不会应用到构建脚本、过程宏和这两者的依赖，且不会显示调试信息，但可以配置 `build-override` 来覆盖默认行为。

```toml
[profile.dev.build-override]
debug = true

[profile.release.build-override]
strip = true
```

### 特定包 profile

默认情况下，profile 会应用到所有包，但可以配置 `package.<name>` 来指定特定包构建时所使用的 profile。

```toml
[workspace]
members = ["utils"]

[dependencies]
utils = { path = "./utils" }
rand = "0.9"

# 指定 utils 包的配置
[profile.dev.package.utils]
opt-level = 2

# 指定除了工作区以外的依赖包的配置（只应用于 rand 包及其依赖）
[profile.dev.package."*"]
strip = true
```

若包同时是普通依赖和构建脚本、过程宏的依赖，同时又配置了 `build-override`，那么会被构建两次，这会增加编译时间。

### profile 优先级

profile 的优先级从高到低为：

- `[profile.<name>.package.<name>]`
- `[profile.<name>.package."*"]`
- `[profile.<name>.build-override]`
- `[profile.<name>]`
- 默认配置

### target 配置

可以指定源文件编译的 target：

- **lib**：编译为可被链接的库
- **bin**：编译为可执行文件
- **example**：编译示例代码
- **test**：编译单元测试或集成测试
- **bench**：编译基准测试

```toml
[lib]  # lib 只能有一个
[[bin]]
[[example]]
[[test]]
[[bench]]
```

> 更多关于 target 字段的信息，可参考 [Cargo Targets](https://doc.rust-lang.org/cargo/reference/cargo-targets.html)。

### features 配置

在 _Cargo.toml_ 中添加 `[features]` 并给依赖指定 `features`，就可给包添加条件编译和可选依赖的功能，通常用于库 Crate。

如工作区中 `mypkg` 依赖于 `utils`，要在 `utils` 中配置 features，在其 _Cargo.toml_ 中添加：

```toml
# utils/Cargo.toml

[features]
default = []
foo = []
bar = []
```

`[features]` 中的 `default` 表示默认包含的 features。

然后在特定项上使用 `cfg` 属性：

```rust
// utils/src/lib.rs

#[cfg(feature = "foo")]
pub mod foo;

#[cfg(feature = "bar")]
pub fn bar() {}
```

#### 可选依赖项

若 `utils` 提供的功能依赖于工作区中 `foo` 和 `bar` 这两个包，则这些依赖项可标记为可选，表示默认情况下不会编译这部分。

```toml
# utils/Cargo.toml

[features]
default = []
foo = ["dep:foo"]
bar = ["dep:bar"]

[dependencies]
foo = { path = "../foo", optional = true }
bar = { path = "../bar", optional = true }
```

当启用特定 feature 时，才会依赖这些包。

#### 启用 features

然后就可以在依赖项声明中启用特定功能。在 `mypkg` 中声明依赖并指定要启用的 feature：

```toml
# mypkg/Cargo.toml

[dependencies]
utils = { path = "utils", default-features = false, features = ["foo"] }
```

默认 feature 可以使用 `default-features = false` 来禁用。

若该包也同样是一个库 Crate，则还可以再添加 `[features]`，以 `package/feature` 格式来指定，这样这个包的 features 也可以给其它包用。

```toml
# mypkg/Cargo.toml

[dependencies]
utils = { path = "utils", default-features = false }

[features]
foo = ["utils/foo"]
```

> 更多关于 features 的信息，可参考 [Cargo Features](https://doc.rust-lang.org/cargo/reference/features.html)。

### 其它配置字段

除了以上字段外，还有许多其它常用字段。

```toml
[alias]
[build]
[http]
[source.<name>]
[target.<cfg>]
```

> 更多关于可配置选项的信息，可参考 [Cargo Configuration](https://doc.rust-lang.org/cargo/reference/config.html)。

## 构建脚本

有些包需要第三方非 Rust 代码，如编译或链接到 C 库，因此在进行 Rust 项目的构建之前，要先构建这些外部代码。

可以将编译链接这些外部代码的脚本放在项目根目录的 `build.rs` 中：

```rust
// build.rs
fn main() {
    // 一旦指定的文件发生了改变，Cargo 就重新运行当前的构建脚本
    println!("cargo::rerun-if-changed=src/hello.c");

    // 使用 cc 来构建一个 C 文件，然后进行静态链接
    cc::Build::new()
        .file("src/hello.c")
        .compile("hello");
}
```

_Cargo.toml_ 的 `[package.build]` 可用于自定义脚本名称：

```toml
[package]
build = "my-build.rs"
```

构建脚本的使用场景通常为：

- 构建 C 依赖库
- 寻找指定的 C 依赖库
- 根据描述文件生成 Rust 模块
- 执行一些平台相关的配置

### 构建流程

Cargo 在构建 Rust 项目之前会先将这个脚本编译为可执行文件，然后运行它。脚本通过 `println!` 将前缀为 `cargo:` 格式的指令打印到 stdout 来与 Cargo 通信，并控制 Cargo 执行脚本的行为。

默认情况下，构建脚本的任何源文件或依赖发生更改，会重新构建该脚本，可以使用 `rerun-if` 命令来自定义该行为。

构建脚本成功执行后，Rust 项目就会开始进行编译。若构建脚本中发生错误，脚本应该通过返回一个非 0 值来退出。**除非发生错误，否则构建脚本的不会有任何输出**。

构建脚本的输入全部以环境变量的形式传递，传递顺序可能会影响。

### Cargo 识别指令

- `cargo::rerun-if-changed=PATH`：指定路径的文件发生变化时重新执行
- `cargo::rerun-if-env-changed=VAR`：指定的环境变量发生变化时重新执行
- `cargo::rustc-link-search=[KIND=]PATH`：添加库搜索路径
- `cargo::rustc-link-lib=LIB`：添加要链接的库
- `cargo::rustc-link-arg=FLAG`：将标志传递给链接器
- `cargo::rustc-cdylib-link-arg=FLAG`：将标志传递给 cdylib Crate 的链接器
- `cargo::rustc-flags=FLAGS`：将标志传递给编译器
- `cargo::rustc-cfg=KEY[="VALUE"]`：启用编译时 `cfg` 设置
- `cargo::rustc-env=VAR=VALUE`：传递环境变量
- `cargo::warning=MESSAGE`：显示警告信息
- `cargo::KEY=VALUE`：元数据，由脚本使用 `links`

> 更多关于 Cargo 识别指令的信息，可参考 [Cargo Build Scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html#cargorustc-link-argflag)。

### links

_Cargo.toml_ 的 `[package.links]` 用于 Rust 项目所链接的本地库，同时可在构建脚本之间传递元数据。

```toml
[package]
links = "foo"  # 链接到一个 libfoo 的本地库
```

当使用 `links` 时，项目必须有一个构建脚本，且该脚本需使用 `rustc-link-lib` 指令来链接目标库。一个本地库最多只能被一个项目所链接，即无法将两个项目链接到同一个本地库。

### 构建依赖

构建脚本可以通过 `[build-dependencies]` 配置依赖。

```toml
[build-dependencies]
cc = "1.2"
```

构建脚本无法使用 `[dependencies]` 或 `[dev-dependencies]` 中的依赖，因为构建脚本和编译过程是相互独立的，Cargo 项目也无法使用 `[build-dependencies]` 中的依赖。

# 2 模块系统

**模块系统**是 Rust 中一系列与作用域相关的功能，其中包含：

- **包**（Package）：Cargo 用来构建、测试和分享 Crate 的单元
- **Crate**：编译和链接的基本单元
  - 一个或多个二进制 Crate 或一个库 Crate
  - Crate **根**（Root）描述如何构建该 Crate
  - _Cargo.toml_ 描述如何构建这些 Crate
- **模块**（Module）：使用 `use` 关键字控制作用域和路径的私有性
- **路径**（Path）：命名结构体、枚举、函数或模块等项的方式

## 包和 Crate

编译模型以 Crate 为中心，每次编译一个 Crate，并生成一个二进制可执行或库文件。

默认情况下，使用 `cargo new` 时会创建一个包，同时也会创建一个二进制 Crate。若一个目录含有 _Cargo.toml_，以及 _src/main.rs_ 或 _src/lib.rs_，则该目录自动成为一个包。

一个包必须至少有一个二进制或库 Crate，可以同时拥有，但库 Crate 最多有一个。其中 _src/main.rs_ 或 _src/lib.rs_ 就是与包同名的二进制或库 Crate 的根。Crate 根文件将由 Cargo 传递给 rustc 来构建。

若包带有多个二进制 Crate，需置于 _src/bin_ 中，其中每个文件都需要包含一个 `main` 函数，都是一个独立的二进制 Crate，都会被编译成与文件名相同的可执行文件。此时可以不再需要 _src/main.rs_，但若存在也会被当作二进制 Crate，并编译成与包名相同的可执行文件。

```
./src
├── bin
│   ├── foo.rs（二进制 Crate）
│   └── baz.rs（二进制 Crate）
├── lib.rs（库 Crate）
└── main.rs（二进制 Crate）
```

默认情况下，`cargo build` 会编译包含库 Crate 在内的所有 Crate，若想单独编译 _src/bin_ 中的二进制 Crate，可以使用 `--bin`。

```shell
cargo build --bin <crate>
```

但这种方式不能单独编译 _src/main.rs_，因为它代表整个包，因此需要使用包名。

```shell
cargo build --bin <package>
```

库 Crate 也能被单独编译。默认情况下，Cargo 使用 Crate 名、rustc 使用文件名，并加上 `lib` 前缀作为输出文件名。

```shell
# 输出 lib<filename>.rlib
rustc --crate-type=lib <filename>.rs

# 输出 lib<crate>.rlib
cargo build --lib
```

不使用 Cargo 而是使用 rustc 来编译一个单独的文件时，可以使用 `#![attr]` 来设置编译期行为。

```rust
// hello.rs

// Crate 名
#![crate_name = "mylib"]

// 输出文件的类型
#![crate_type = "lib"]

pub fn hello() {
    println!("hello world!");
}
```

然后就可以直接编译：

```shell
# 输出 libmylib.rlib
rustc hello.rs
```

实际上使用 `cargo build` 也是调用的 `rustc`，可以使用 `-v` 来查看实际传递的参数：

```shell
rustc --crate-name mylib
      --edition=2024 src/main.rs
      --out-dir target/debug/deps
      -C incremental=target/debug/incremental
      -L dependency=target/debug/deps
      --extern rand=target/debug/deps/librand-497101ebdefc7cae.rmeta
```

### 源文件

Rust 源文件以 UTF-8（可带 BOM）编码，二进制 Crate 文件开头可以有一行 [Shebang](https://zh.wikipedia.org/wiki/Shebang)，文件后缀为 `.rs`。

```rust
#!/usr/bin/env rustx

fn main() {
    println!("hello world!");
}
```

使用 Shebang 将源文件作为脚本由操作系统使用指定的解释器来执行。Rust 在设计上可由编译器和解释器实现，但目前仅有 rustc 这唯一的编译器实现，因此可以通过编译，但无实际效果。

> Shebang 前不能有包括注释在内的行。

### main 函数

一个含有 `main` 函数的源文件就是一个二进制 Crate。`main` 函数不能有参数，不能对其声明任何 trait 约束或生命周期约束，且返回类型必须实现 `Termination`。

标准库中实现了 `Termination` 的类型为：

- `()`
- `!`
- `ExitCode`
- `Infallible`
- `Result<T, E> where T: Termination, E: Debug`

### 库 Crate

可以在一个包中同时包含二进制 Crate 和库 Crate，如一个名为 `mypkg` 包，其中包含了 _src/main.rs_ 和 _src/lib.rs_，那么这两个的 Crate 名都与包名相同，但要在 _main.rs_ 中使用 _lib.rs_ 中的内容，需要使用 `use` 关键字引入项，或在路径中包含 Crate 名。

```rust
// lib.rs
pub fn foo() {}

// main.rs
use mypkg::foo;

fn main() {
    foo();
    mypkg::foo();
}
```

### 外部 Crate

[Crates.io](https://crates.io/) 上有很多第三方 Crate，使用它们需要先在 _Cargo.toml_ 中添加依赖，然后用 `use` 引入到包的作用域中。

标准库 `std` 对于自己的包来说也是外部 Crate，但默认被预导入，因此无需在 _Cargo.toml_ 中显式导入，但也需要用 `use` 引入一些没有被预导入的项，如 `HashMap`。

```rust
use std::collections::HashMap;
```

导入外部 Crate 还可以使用 `extern crate`：

```rust
extern crate alloc;
extern crate std;
extern crate std as ruststd;
extern crate foo as _;
```

这种方式会将外部 Crate 的名称作为标识符绑定到当前作用域中，但若是在 Crate 的根中声明，那么此 Crate 名称也会被添加到外部预导入包中，这样在所有模块的作用域中都会被导入。在 _Cargo.toml_ 中引入的依赖相当于在 Crate 根中隐式地使用了这种方式导入。

`as` 用于将导入的 Crate 绑定到不同的名称上。`_` 用于匿名导入，当仅需该 Crate 被链接进来，但不使用其中的项时使用。

Crate 名不能使用 `-`，但包名可以使用，在使用时会被自动转换为 `_`。

```rust
// 导入 my-pkg 包
extern crate my_pkg;
```

### 预导入包

预导入包是一组名称的集合，这些名称会自动导入到 Crate 的所有作用域中，这些名称不是当前模块本身的一部分，会在名称解析时被隐式导入。

#### 标准库预导入包

每个 Crate 都有一个标准库预导入包。具体使用的模块取决于 Rust 版本，以及 Crate 是否具有 `no_std` 属性。

| 非 `no_std` 环境 |  `no_std` 环境  |
| :--------------: | :-------------: |
|  `std::prelude`  | `core::prelude` |

#### 外部预导入包

在 Crate 根模块中使用 `extern crate` 或通过给编译器传递 `--extern` 参数导入的 Crate 会被添加外部预导入包中。

`core` Crate 总是自动地被添加到外部预导入包中，在非 `no_std` 环境中，`std` Crate 也会被添加。

通过 _Cargo.toml_ 添加的依赖实际上就相当于被添加到外部预导入包，因此无需再使用 `extern crate` 导入，可以直接使用 `use` 引入其中的项。

并不是所有 Rust 自带的 Crate 都会被自动导入，如 `alloc`、`test` 和 `proc_macro`，在使用这些包时需要显式导入。

```rust
extern crate alloc;
use alloc::rc::Rc;
```

#### macro_use 预导入包

`macro_use` 预导入包是外部 Crate 中的宏。外部 Crate 中的声明宏并不会被自动导入，需要在 `extern crate` 上使用 `#[macro_use]` 来导入 Crate 中的使用了 `#[macro_export]` 的宏。

```rust
// lib.rs
#[macro_export]
macro_rules! hello {
    () => {
        println!("hello");
    };
}

// main.rs
#[macro_use]
extern crate mypkg;

fn main() {
    hello!();
    mypkg::hello!();  // 否则就需要使用这种形式
}
```

#### 语言预导入包

语言预导入包是语言内置的类型名称和属性名称，且总是在所有作用域都有效。

- 类型命名空间
  - 布尔型：`bool`
  - 字符型：`char` 和 `str`
  - 整型：`i8`，`i16`，`i32`，`i64`，`i128`，`u8`，`u16`，`u32`，`u64`，`u128`
  - 平台相关整型：`isize` 和 `usize`
  - 浮点型：`f32` 和 `f64`
- 宏命名空间
  - 内置属性

#### 工具类预导入包

工具类预导入包是在类型命名空间中声明的外部工具的名称，在导入包时这些名称也会自动导入。

```rust
#[rustfmt::skip]
struct User {
id: usize,
name: String
}
```

## 命名空间

命名空间是已声明名称的逻辑分组。根据名称所指的实体类型，名称被分隔到不同的命名空间中。不同命名空间中的名称可以相同，不会导致冲突。

在命名空间中，名称被组织在不同的层次结构中，层次结构的每一层都有自己的命名实体集合。

- 类型命名空间
- 值命名空间
- 宏命名空间
- 生命周期命名空间
- 标签命名空间

```rust
// Foo 在类型命名空间中引入一个类型，在值命名空间中引入一个构造函数
struct Foo(u32);

// Foo 在宏命名空间中声明
macro_rules! Foo {
    () => {};
}

// f 的类型 Foo 指向一个类型
// 'Foo 引入一个生命周期
fn example<'Foo>(f: Foo) {
    // Foo 引用构造器
    let ctor = Foo;
    // Foo 引用宏
    Foo!{}
    // 'Foo 引入一个标签
    'Foo: loop {
        // 'Foo 引用生命周期, Foo 引用类型
        let x: &'Foo Foo;
        // 'Foo 引用标签
        break 'Foo;
    }
}
```

## 程序项

**程序项**是 Crate 的一个组成单元，在 Crate 内按照模块的嵌套集合进行组织。每个 Crate 都有一个最外层的匿名模块，所有程序项都在其 Crate 的模块树中有自己的路径。

程序项在编译时就完全确定下来了，通常在执行期间保持结构稳定，并可以驻留在只读内存中。

有以下几类程序项:

- 模块
- 外部 Crate 声明
- use 声明
- 函数定义
- 类型定义
- 结构体定义
- 枚举定义
- 联合体定义
- 常量项
- 静态项
- trait 定义
- impl
- extern 块

> 更多关于程序项的信息，可参考 [Items](https://doc.rust-lang.org/nightly/reference/items.html)。

## 模块

一个 Crate 包含一个嵌套的带作用域的模块树。这个树的顶层是一个匿名的模块（从模块内部路径的角度来看），并且一个 Crate 中的任何程序项都有一个规范的模块路径来表示它在 Crate 的模块树中的位置，**模块和文件的路径互为镜像**。

可以在一个文件中定义多个模块，但当模块变得更大时，将定义移动到一个单独的文件中可使结构更加清晰。

有两种管理模块的方式：

- 新风格：创建与模块同名的文件
- 旧风格：创建与模块同名的**目录**，并在其中创建 _mod.rs_

> - 推荐使用新风格的形式，因为嵌套更少，结构更加清晰一致
> - 可在同一个项目中混用两种风格

### 新风格

```rust
// lib.rs
pub mod a;
pub mod b;

// a.rs
pub fn foo() {}

// b.rs
pub mod c;
pub fn bar() {}

// b/c.rs
pub fn baz() {}
```

文件树为：

```
.
├── a.rs
├── b
│   └── c.rs
├── b.rs
└── lib.rs
```

### 旧风格

```rust
// lib.rs
pub mod a;
pub mod b;

// a/mod.rs
pub fn foo() {}

// b/mod.rs
pub mod c;
pub fn bar() {}

// b/c/mod.rs
pub fn baz() {}
```

文件树为：

```
.
├── a
│   └── mod.rs
├── b
│   ├── c
│   │   └── mod.rs
│   └── mod.rs
└── lib.rs
```

## 路径

路径是一个或多个由命名空间限定符 `::` 分隔的路径段组成的序列，用来引用模块树中的项。

- **绝对路径**从 Crate 根开始，以 Crate 名或 `crate` 开头
- **相对路径**从当前模块开始，以 `self`、`super` 或当前模块名开头
- **全局路径**从外部预导入包开始，以 `::` 开头，其后必须跟一个外部预导入 Crate 名

```rust
mod std {
    pub fn foo() {
        // 从父模块而不是当前模块开始
        super::a::b::foo();
    }
}

mod a {
    pub mod b {
        pub fn foo() {}
    }
}

// 使用本地 std 模块
use std::foo;

// 全局路径，使用 std 标准库这个外部预导入包
// 这样名称就不会和本地的 std 模块冲突
use ::std::thread;

fn main() {
    crate::a::b::foo(); // 绝对路径
    a::b::foo();        // 相对路径
}
```

### 私有性边界

模块是 Rust 中的**私有性边界**，用于描述其中的项的可见性。

私有性规则有如下：

- 所有项默认私有
- `pub` 关键字使项变为公有
- 不允许使用定义于当前模块的子模块中的私有代码
- 允许使用任何定义于当前模块及父模块中的私有代码

### 结构体可见性

在模块中对结构体定义使用 `pub`，可以使其变为公有，而字段仍是私有的，但可控制每个字段的可见性。

```rust
mod info {
    pub struct User {
        id: u32,
        pub name: String,
    }

    impl User {
        pub fn new(name: &str) -> User {
            User {
                name: String::from(name),
                id: 1,
            }
        }
    }
}

fn main() {
    let mut u = info::User::new("root");
    u.name = String::from("admin");
    println!("{}", u.name);
    println!("{}", u.id); // 错误
}
```

元组结构体也需要给字段加上 `pub` 才能公有：

```rust
mod point {
    pub struct Point(pub u32, pub u32);
}
```

### 枚举和 trait 可见性

枚举和 trait 若是公有，则所有成员都是公有：

```rust
mod a {
    pub enum Foo {
        A,
        B
    }

    pub trait Bar {
        fn a();
        fn b();
    }
}
```

### 可见性级别

除了最常见的通过 `pub` 来控制可见性外，还可以指定作用域内的可见性：

- `pub(self)`：默认值，仅在当前或子模块中可见

- `pub`：完全公开
- `pub(crate)`：仅 Crate 内可见
- `pub(super)`：上级模块中可见
- `pub(in <path>)`：指定的路径中可见

```rust
pub fn call() {
    a::crate_visible();
}

pub mod a {
    pub(crate) fn crate_visible() {
        b::a_visible();
        b::c::a_visible_from_c();
    }

    pub mod b {
        pub(super) fn a_visible() {}

        pub mod c {
            pub(in crate::a) fn a_visible_from_c() {
                c_visible();
            }

            pub(self) fn c_visible() {}
        }
    }
}
```

### use 关键字

使用绝对路径或相对路径是冗长和重复的，使用 `use` 关键字一次性将路径引入作用域。

```rust
mod a {
    pub mod b {
        pub fn foo() {}
    }
}

use a::b;

fn main() {
    b::foo();
}
```

### pub use 重导出

当使用 `use` 关键字将名称导入作用域时，在新作用域中可用的名称是私有的。通过结合 `pub` 和 `use` 进行**重导出**，将项引入作用域并同时使其可供其它代码引入自己的作用域。通过重导出，就可以新路径来使用项，能够方便的向外暴露 API。

```rust
mod a {
    pub mod b {
        pub mod c {
            pub fn foo() {}
        }
    }
}

mod x {
    pub use super::a::b::c;

    pub fn foo() {
        c::foo();
    }
}

fn main() {
    x::foo();
    x::c::foo();
}
```

> 关于 Rust 的 API 设计，可参考 [The Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)。

### as 关键字

将两个同名类型引入同一作用域时，可以通过在 `use` 后加上 `as` 来重命名引入作用域的项。

```rust
use std::fmt::Result;
use std::io::Result as IoResult;

fn foo() -> Result {
    todo!()
}

fn bar() -> IoResult<()> {
    todo!()
}
```

### 嵌套路径

使用嵌套路径在一行中引入多个定义于相同包或相同模块的项：

```rust
use std::cmp::Ordering;
use std::io;

// 等同于
use std::{cmp::Ordering, io};
```

在路径中使用 `self` 表示该项本身：

```rust
use std::io;
use std::io::Write;

// 等同于
use std::io::{self, Write};
```

### 导入所有项

使用 `*` 将一个路径下所有公有项引入作用域：

```rust
use std::io::prelude::*;
```

## 工作区

工作区是一系列包的集合，这些包被称为**工作区成员**，并被一起管理。

- 命令可以在所有工作区成员上运行，如 `cargo check --workspace`
- 所有工作区成员共享工作区根目录下的 _Cargo.lock_ 和 _target_
- 共享包元数据

### 创建

在一个已经存在的包的 _Cargo.toml_ 中添加 `[workspace]`，那么这个包就是这个工作区的**根包**，工作区根目录就是根包的目录，然后在 `members` 字段中添加工作区成员。

```toml
[workspace]
members = ["frontend"]

[package]
name = "hello"
version = "0.1.0"
edition = "2024"
```

其中 `hello` 是根包，`frontend` 是工作区成员，目录树为：

```
.
├── Cargo.lock
├── Cargo.toml
├── frontend
│   ├── Cargo.toml
│   └── src
├── src
└── target
```

若 _Cargo.toml_ 不存在 `[package]`，那么就是一个虚拟工作区，没有根包，仅用于组织各个包，该 _Cargo.toml_ 所在的目录就是工作区根目录。

```toml
[workspace]
members = ["backend", "frontend"]
```

其中 `backend` 和 `frontend` 都是工作区成员，目录树为：

```
.
├── backend
│   ├── Cargo.toml
│   └── src
├── Cargo.lock
├── Cargo.toml
├── frontend
│   ├── Cargo.toml
│   └── src
└── target
```

在工作区根目录的 _Cargo.toml_ 为整个工作区的配置，每个包也有自己的配置，但只会有一个 _Cargo.lock_ 和 _target_。

工作区成员还可使用如下格式：

```toml
[workspace]
members = ["foo", "foo-*", "bar/*"]
```

### 配置

可以为工作区的所有包进行统一配置，如 `[dependencies]`、`[package.authors]` 等，然后在各个包自己的 _Cargo.toml_ 中设定 `key.workspace = true` 来继承工作区配置。

```toml
# Cargo.toml
[workspace]
members = ["frontend"]
resolver = "3"

[workspace.package]
authors = ["someone"]
documentation = "https://example.com/"

[workspace.dependencies]
cc = "1.2"
rand = "0.9"
regex = { version = "1.11", default-features = false, features = ["std"] }

# frontend/Cargo.toml
[package]
name = "frontend"
authors.workspace = true
documentation.workspace = true

[dependencies]
regex = { workspace = true, features = ["unicode"] }

[dev-dependencies]
rand.workspace = true

[build-dependencies]
cc.workspace = true
```

对于继承的依赖，其 `features` 会合并。

> 更多工作区配置相关的信息，可参考 [工作区字段](https://doc.rust-lang.org/cargo/reference/workspaces.html#the-members-and-exclude-fields)。

### 依赖关系

构建时 Cargo 并不假定工作区中的包之间会相互依赖，所以需要在各包的 _Cargo.toml_ 中明确标明依赖关系。

```toml
[dependencies]
frontend = { path = "../frontend" }
```

同时各个包都可以有自己的依赖，还可以是同一依赖的不同版本，都会被记录到 _Cargo.lock_ 中。

### 构建

当工作区只包含一个包时，可以直接构建运行。但若包含多个包，就需要使用 `-p` 来指定到底运行哪个包。

```shell
cargo run -p <package>
```

可选的在工作区配置 `[workspace.default-members]` 中设定默认包。

```toml
[workspace]
members = ["backend", "backend2", "frontend"]
default-members = ["backend"]
```

若一个包中含有多个二进制 Crate，则还需要使用 `--bin` 指明运行哪个。

```shell
cargo run -p <package> --bin <crate>
```

在包配置 `[package.default-run]` 中设定默认二进制 Crate，可以不需要该选项。

```toml
[package]
default-run = "hello"
```

# 3 属性

属性是一种通用的元数据，用于控制编译器行为，可以给特定程序项或整个 Crate 标记。

**内部属性**以 `#!` 开头，应用于其声明时所在的整个项程序项。**外部属性**以 `#` 开头，应用于直接跟在属性后面的程序项。所有程序项声明都可接受外部属性，函数、模块、impl 块和外部块都可接受内部属性。

```rust
// 应用于整个 Crate 的内部属性
#![crate_name = "mypkg"]

fn foo() {
  // 应用于整个函数的内部属性
  #![allow(unused_variables)]
}

// 应用于单个项的外部属性
#[test]
fn it_works() {}

// 应用于单个项的带有表达式的外部属性
#[cfg(target_os = "linux")]
mod a {}
```

> 不是所有的属性都可以声明为外部或内部属性。

属性由指向属性的路径和路径后跟的可选的带定界符的 Token 树组成。除了宏属性之外，其它属性的输入也允许使用 `=` 后跟表达式的格式。

```rust
#![no_std]
#[doc = "example"]
#[allow(unused, clippy::inline_always)]
#[macro_use(foo, bar)]
#[link(name = "foo", kind = "bar")]
```

## 属性分类

### 属性宏

属性宏，也叫过程宏属性，由带有 `#[proc_macro_attribute]` 属性，并以 `(TokenStream, TokenStream) -> TokenStream` 签名的公有函数所定义的可应用于项上的过程宏，能够生成新的代码或对现有代码进行修改。

```rust
// myproc/src/lib.rs
use proc_macro::TokenStream;

#[proc_macro_attribute]
pub fn show_streams(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

// mybin/src/main.rs
use my_proc::show_streams;

#[show_streams(foo, bar)]
fn invoke() {}
```

### 派生宏

派生宏，也叫过程宏派生，由带有 `#[proc_macro_derive]` 属性，且属性中带有标识符列表构成的 `attributes` 键所定义，这些标识符是辅助属性的名称，用于将额外的属性添加到其所在的程序项的作用域中。

```rust
// myproc/src/lib.rs
use proc_macro::TokenStream;

#[proc_macro_derive(HelperAttr, attributes(helper))]
pub fn derive_helper_attr(_item: TokenStream) -> TokenStream {
    TokenStream::new()
}

// mybin/src/main.rs
use my_proc::HelperAttr;

#[derive(HelperAttr)]
struct Foo {
    #[helper]
    field: (),
}
```

### 外部工具属性

程序项可以与外部工具相关联，但在编译和检查过程中必须存在并驻留在工具类预导入包下对应的命名空间中。这种属性的路径的第一段是工具的名称，后跟一个或多个工具自己解释的附加段。

当工具在编译期不可用时，该工具的属性将被静默接受而不提示警告。当工具可用时，该工具负责处理和解释这些属性。

```rust
#[clippy::inline_always]
fn foo() {}
```

> Rust 内置的外部工具为 `clippy` 和 `rustfmt`。

### 活跃属性和惰性属性

属性要么是活跃的，要么是惰性的。在属性处理过程中，活跃属性将从其所在的对象上移除，不会保留到运行时中，而惰性属性依然保留。

- `cfg` 和 `cfg_attr` 属性是活跃的
- `test` 属性在测试中是惰性的，否则是活跃的
- 宏属性是活跃的
- 所有其它属性都是惰性的

这样的区分主要是为了明确哪些属性会影响编译过程，哪些属性会保留到运行时。

## 内置属性

> 更多关于内置属性的信息，可参考 [Built-in attributes index](https://doc.rust-lang.org/nightly/reference/attributes.html#built-in-attributes-index)。

### 条件编译

- `cfg`：条件编译

```rust
#[cfg(target_os = "macos")]
fn macos_only() {}

#[cfg(any(foo, bar))]
fn needs_foo_or_bar() {}

#[cfg(all(unix, target_pointer_width = "32"))]
fn on_32bit_unix() {}

#[cfg(not(foo))]
fn needs_not_foo() {}

#[cfg(panic = "unwind")]
fn when_unwinding() {}
```

- `cfg_attr`：条件包含属性

```rust
#[cfg_attr(target_os = "linux", path = "linux.rs")]
mod os;

#[cfg_attr(feature = "foo", bar, baz)]
fn fuzz() {}
```

`cfg_attr` 能展开为另一个 `cfg_attr`

```rust
// 两者等效
#[cfg_attr(target_os = "linux", cfg_attr(feature = "foo", bar))]
#[cfg_attr(all(target_os = "linux", feature ="foo"), bar)]
```

### 测试

- `test`：标记为测试项
- `ignore`：忽略测试项
- `should_panic`：测试项应产生 panic

### 派生

`derive`：自动派生 trait 实现

`automatically_derived`：自动添加到由 `derive` 属性为一些内置 trait 自动派生的实现中

### 宏

- `macro_export`：导出由 `macro_rules!` 创建的声明宏
- `macro_use`：扩展宏可见性，或从其它 Crate 导入宏
- `proc_macro`：定义类函数宏
- `proc_macro_attribute`：定义属性宏
- `proc_macro_derive`：定义派生宏

### 诊断

- `allow`、`expect`、`warn`、`deny`、`forbid`：更改默认的 lint 检查级别
- `deprecated`：弃用标记
- `must_use`：为未使用的值生成 lint 提醒

### ABI、链接、符号和 FFI

- `link`：指定与外部 extern 块链接的本地库
- `link_name`：指定外部 extern 块中的函数或静态项的符号名
- `no_link`：防止链接外部 Crate
- `repr`：控制类型的内存布局
- `crate_type`：指定 Crate 类型
- `crate_name`：指定 Crate 名
- `no_main`：禁止 main 符号
- `export_name`：指定函数或静态项导出的符号名
- `link_section`：指定函数或静态项在所在的段
- `no_mangle`：禁用对符号名编码
- `used`：强制编译器在输出对象文件中保留静态项

### 代码生成

- `inline`：内联代码

- `cold`：表示函数不太可能被调用
- `no_builtins`：禁用某些内置函数
- `target_feature`：配置特定目标的代码生成
- `track_caller`：将调用位置传递给 `std::panic::Location::caller` 函数
- `instruction_set`：指定用于生成代码的指令集

### 文档

`doc`：指定文档注释

### 预导入包

- `no_std`：从预导入包中移除 std
- `no_implicit_prelude`：禁用模块内的预导入包

### 模块

- `path`：指定模块的路径

### 极限值

- `recursion_limit`：设置某些编译时操作的最大递归限制
- `type_length_limit`：设置在单态化过程中构造具体类型时所做的最大类型替换次数

### 运行时

- `panic_handler`：设置处理 panic 的函数
- `global_allocator`：设置全局内存分配器
- `windows_subsystem`：指定要链接的 Windows 子系统

### 特性

- `feature`：用于启用非稳定的或实验性的编译器特性

### 类型系统

- `non_exhaustive`：表明类型将来会添加更多的字段或变体
