## 声明语句

### 变量

Rust

```rust
// 显式标注类型
let x: i32 = 1;

// 自动推断
let x = 1;

// 可变
let mut x = 1;
```

Go

```go
// 显式标注类型
var x int = 1

// 自动推断
var x = 1

// 自动推断
x := 1
```

### 常量

Rust

```rust
const X: i32 = 1;
```

Go

```go
const X int = 1
```

## 数据类型

### 基本类型

| 类型分类       | Rust                                         | Go                                                       |
| -------------- | -------------------------------------------- | -------------------------------------------------------- |
| **有符号整数** | `i8`、`i16`、`i32`、`i64`、`i128`、`isize`   | `int8`、`int16`、`int32`、`int64`、`int`                 |
| **无符号整数** | `u8`、`u16`、`u32`、`u64`、`u128`、`usize`   | `uint8`、`uint16`、`uint32`、`uint64`、`uint`、`uintptr` |
| **字节类型**   | `u8`                                         | `byte` (别名 `uint8`)                                    |
| **浮点数**     | `f32`、`f64`                                 | `float32`、`float64`                                     |
| **复数**       | -                                            | `complex64`、`complex128`                                |
| **布尔类型**   | `bool`                                       | `bool`                                                   |
| **字符类型**   | `char` (Unicode标量值，4字节)                | `rune` (别名 `int32`，表示Unicode码点)                   |
| **字符串**     | `&str` (字符串切片)                          | `string`                                                 |
| **引用/指针**  | `&T` (不可变引用)<br>`&mut T` (可变引用)     | `*T` (指针)                                              |
| **原始指针**   | `*const T` (常量指针)<br>`*mut T` (可变指针) | -                                                        |

主要差异说明

-   **复数类型**：Go 原生支持复数，Rust 需要使用第三方库
-   **字符表示**：Rust 的 `char` 是 4 字节的 Unicode 标量值，Go 的 `rune` 是 `int32` 的别名
-   **指针系统**：Rust 区分安全引用和不安全原始指针，Go 只有一种指针类型
-   **字符串**：Rust 的 `&str` 是字符串切片，Go 的 `string` 是内置类型

### 类型别名

Rust

```rust
type int8 = i8;
```

Go

```go
type i8 = int8
```

### 引用 / 指针

Rust

```rust
let mut x = 2;
let px = &mut x;
*px = 10;

println!("{} {}", px, *px);
```

Go

```go
x := 1
var px *int = &x
*px = 10

fmt.Println(x, px, *px)
```

### 数组

Rust

```rust
let mut a: [i32; 3] = [1,2,3];
a[0] = 10;
println!("{}", a[0]);

// 二维数组
let a_2d = [[1, 2], [3, 4]];
println!("{}", a_2d[0][1]);
```

Go

```go
var a [3]int = [3]int {1, 2, 3}
a[0] = 10
fmt.Println(a[0])

// 二维数组
s_2d := [][]int{
	{1, 2},
	{3, 4},
}

fmt.Println(s_2d[0][1])
```

### 切片

Rust

```rust
let a = [1, 2, 3, 4, 5];
let slice: &[i32] = &a[1..4];
for e in slice {
    println!("{e}");
}

println!("{:?}", &a[2..]);
```

Go

```go
a := [5]int{1, 2, 3, 4, 5}
var slice []int = a[1:4]
for i := 0; i < len(slice); i++ {
	fmt.Println(slice[i])
}
fmt.Println(slice)

slice2 := []int {1, 2, 3, 4, 5}
fmt.Printf("%T %v\n", slice2, slice2[2:])
```

### 动态数组 / 切片

Rust

```rust
let mut v = Vec::with_capacity(10);
v.insert(0, 0);
v.extend([1, 2, 3]);
println!("{:?} {} {}", v, v.len(), v.capacity());
```

Go

```go
s := make([]int, 0, 10)
s = append(s, 0)
s = append(s, 1, 2, 3)
fmt.Println(s, len(s), cap(s))
```

## Range

Rust

- `a..b`、`a..`、`..b`、`..`、`a..=b`、`..=b`

```rust
let r = 1..=3;
for (_, e) in r.enumerate() {
    println!("{e}");
}
```

Go

- `[a:b]`、`[a:]`、`[:b]`、`[..]`

```go
s := []int{1, 2, 3}
for _, v := range s {
	fmt.Println(v)
}
```

## 控制流

### 分支

Rust

```rust
// if
let x = 1;
if x < 0 {
    println!("< 0");
} else if x < 10 {
    println!("< 10");
} else {
    println!(">= 10");
}

// match
let x = 1;
match x {
    v if v < 0 => println!("< 0"),
    v if v < 10 => println!("< 10"),
    _ => println!(">= 10"),
}
```

Go

```go
// if
if x := 1; x < 0 {
    fmt.Println("< 0")
} else if x < 10 {
    fmt.Println("< 10")
} else {
    fmt.Println(">= 10")
}

// switch
switch x := 1; {
case x < 0:
	fmt.Println("< 0")
case x < 10:
	fmt.Println("< 10")
default:
	fmt.Println(">= 0")
}

switch os := runtime.GOOS; os {
case "windows":
	fmt.Println("Windows")
case "linux":
	fmt.Println("Linux")
case "darwin":
	fmt.Println("macOS")
default:
	fmt.Println(os)
}
```

### 循环

Rust

```rust
// while
let mut i = 1;
while i < 10 {
    println!("{i}");
    i += 1;
}

// for
for i in 1..10 {
    println!("{i}");
}

// 无限循环
loop {
    println!("loop");
}
```

Go

```go
// 等价 while
i := 1
for ; i < 10; {
    fmt.Println(i)
    i++
}

// for
for i := 1; i< 10; i++ {
    fmt.Println(i)
}

// 无限循环
for {
    fmt.Println("loop")
}
```

## 结构体

Rust

```Rust
struct User {
    name: String,
    id: u8,
    age: u8,
}

fn main() {
    let u = User {
        name: "Alice".to_string(),
        id: 1,
        age: 18,
    };
    let pu = &u;

    println!("{} {} {}", u.name, u.id, u.age);
    println!("{} {} {}", pu.name, pu.id, pu.age); // 无需 *
}
```

Go

```go
type User struct {
	name string
	id, age  uint8
}

func main() {
	u := User{"Alice", 1, 18}
    pu := &u

	fmt.Println(u.name, u.id, u.age)
    fmt.Println(pu.name, u.id, pu.age) // 无需 *

    // 结构体切片
    a := []struct {
        a int
        b string
    }{
        {1, "a"},
        {2, "b"},
        {3, "c"},
    }
    fmt.Println(a[2:])
}
```

## HashMap

Rust

```rust
let mut hm = HashMap::new();
hm.insert("a", 1);
println!("{}", hm["a"]);

let mut hm2 = HashMap::from([("a", 1), ("b", 2)]);
println!("{}", hm2["b"]);

// 获取元素
let (v, ok) = match hm2.get("c") {
    Some(&v) => (v, true),
    None => (i32::default(), false),
};
println!("{v} {ok}");

// 删除元素
hm2.remove("a");
println!("{hm2:?}");
```

Go

```go
m := make(map[string]int)
m["a"] = 1
fmt.Println(m["a"])

m2 := map[string]int{
	"a": 1,
	"b": 2,
}
fmt.Println(m2["b"])

// 获取元素
v, ok := m2["c"]
fmt.Println(v, ok)

// 删除元素
delete(m2, "a")
fmt.Println(m2)
```

## 函数

Rust

```rust
fn add(x: i32, y: i32) -> i32 {
    x + y
}
```

Go

```go
func add(x, y int) int {
	return x + y
}
```

### 函数指针

Rust

```rust
fn get_ret_f(f: fn(i32) -> i32) -> fn(i32) -> i32 {
    f
}

fn main() {
    fn g(x: i32) -> i32 {
        x
    }
    let f = get_ret_f;
    println!("{}", f(g)(1));
}
```

Go

```go
func get_ret_f(f func(int) int) func(int) int {
	return f
}

func main() {
	g := func(x int) int {
		return x
	}
	f := get_ret_f
	fmt.Println(f(g)(1))
}
```

## 闭包

Rust

```rust
let n = Cell::new(1);
let c = || n.set(n.get() + 1);

for _ in 0..5 {
    println!("{}", n.get());
    c();
}
```

Go

```go
n := 1
c := func() {
	n++
}

for i := 0; i < 5; i++ {
	fmt.Println(n)
	c()
}
```

### 返回闭包

Rust

```rust
fn fib() -> impl FnMut() -> i32 {
    let (mut a, mut b) = (0, 1);
    move || {
        (a, b) = (b, a + b);
        a
    }
}

fn main() {
    let mut f = fib();
    for _ in 0..10 {
        println!("{}", f());
    }
}
```

Go

```go
func fib() func() int {
	a, b := 0, 1
	return func() int {
		ret := a
		a, b = b, a+b
		return ret
	}
}

func main() {
	f := fib()
	for i := 0; i < 10; i++ {
		fmt.Println(f())
	}
}
```

## 方法

> Rust 和 Go 对方法都具有自动引用和解引用的功能。

Rust

```rust
#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

impl Point {
    fn new(x: i32, y: i32) -> Self {
        Self { x, y }
    }

    fn add(&mut self, o: &Self) {
        self.x += o.x;
        self.y += o.y;
    }
}

fn main() {
    let mut p = Point::new(1, 2);
    let o = Point::new(3, 4);
    p.add(&o);
    println!("{p:?}");
}
```

Go

```go
type Point struct {
	x, y int
}

func (Point) new(x, y int) Point {
	return Point{x, y}
}

func (p *Point) add(o Point) {
	p.x += o.x
	p.y += o.y
}

func main() {
	p := Point{}.new(1, 2)
	o := Point{}.new(3, 4)
	p.add(o)
	fmt.Println(p)
}
```

### newtype

> Rust 和 Go 都具有孤儿规则，但可通过 newtype 来规避。

Rust

```rust
struct MyInt(i32);

impl MyInt {
    fn foo(&self) {
        println!("foo");
    }
}

fn main() {
    let i = MyInt(1);
    i.foo();
}
```

Go

```go
type MyInt int

func (i MyInt) foo() {
	fmt.Println("foo")
}

func main() {
	i := MyInt(1)
	i.foo()
}
```

## 接口

Rust

```rust
use std::{any::type_name_of_val, fmt::Debug};

trait I: Debug {
    fn m(&self);
}

#[derive(Debug)]
struct F(f64);

#[derive(Debug)]
struct T {
    s: String,
}

impl I for F {
    fn m(&self) {
        println!("{}", self.0);
    }
}

impl I for T {
    fn m(&self) {
        println!("{}", self.s);
    }
}

fn info(i: &dyn I) {
    println!("{} {:?}", type_name_of_val(i), i);
}

fn main() {
    let f = F(1.0);
    let t = T {
        s: "foo".to_string(),
    };

    f.m();
    t.m();

    info(&f);
    info(&t);
}
```

Go

```go
type I interface {
	M()
}

type F float64

type T struct {
	S string
}

func (f F) M() {
	fmt.Println(f)
}

func (t *T) M() {
	fmt.Println(t.S)
}

func info(i I) {
	fmt.Printf("%T %v\n", i, i)
}

func main() {
	var f F = F(1.0)
	var t T = T{"foo"}

	f.M()
	t.M()

	info(f)
	info(&t)
}
```

### 泛型

Rust

```rust
use std::{any::type_name_of_val, fmt::Debug};

fn info<T: Debug>(t: T) {
    println!("{} {:?}", type_name_of_val(&t), t);
}

fn main() {
    info(1);
    info(1.1);
    info('a');
    info("abc");
}
```

Go

```go
func info(i interface{}) {
	fmt.Printf("%T %v\n", i, i)
}

func main() {
	info(1)
	info(1.1)
	info('a')
	info("abc")
}
```

## 并发

### 线程

Rust

```rust
let handle = thread::spawn(|| {
    for i in 0..5 {
        println!("spawn: {i}");
        thread::sleep(Duration::from_millis(100));
    }
});

for i in 0..5 {
    println!("main: {i}");
    thread::sleep(Duration::from_millis(100));
}

handle.join().unwrap();
```

Go

```go
func say(ws *sync.WaitGroup) {
	defer ws.Done()
	for i := 0; i < 5; i++ {
		fmt.Println("say: ", i)
		time.Sleep(100 * time.Millisecond)
	}
}

func main() {
	var wg sync.WaitGroup
	wg.Add(1)
	go say(&wg)

	for i := 0; i < 5; i++ {
		fmt.Println("main: ", i)
		time.Sleep(100 * time.Millisecond)
	}

	wg.Wait()
}
```

### 信道

Rust

```rust
fn fib(n: i32, tx: mpsc::Sender<i32>) {
    let (mut a, mut b) = (0, 1);
    for _ in 0..n {
        tx.send(a).unwrap();
        (a, b) = (b, a + b);
    }
}

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        fib(10, tx);
    });

    for v in rx {
        println!("{v}");
    }
}
```

Go

```go
func fib(n int, c chan int) {
	a, b := 0, 1
	for i := 0; i < n; i++ {
		c <- a
		a, b = b, a+b

	}
	close(c)
}

func main() {
	c := make(chan int, 10)
	go fib(cap(c), c)
	for v := range c {
		fmt.Println(v)
	}
}
```

### 锁

Rust

```rust

```

Go

```go
type SafeCounter struct {
	count int
	mux   sync.Mutex
}

func (sc *SafeCounter) inc() {
	sc.mux.Lock()
	defer sc.mux.Unlock()
	sc.count++
}

func (sc *SafeCounter) cur() int {
	sc.mux.Lock()
	defer sc.mux.Unlock()
	return sc.count
}

func main() {
	sc := SafeCounter{count: 0}
	for i := 0; i < 10; i++ {
		go sc.inc()
	}
	time.Sleep(time.Second)
	fmt.Println(sc.cur())
}
```
