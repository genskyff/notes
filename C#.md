> 参考：
>
> - [C# 入门经典](https://book.douban.com/subject/35863218/)
> - [C# 语言入门详解](https://www.bilibili.com/video/BV13b411b7Ht)

# 1 概述

> 由于 C# 有很多部分和 C 类似，因此在相同的部分不做过多赘述，本文重点介绍不同的地方。

## 常用 VSCode 扩展

| 扩展                          | 说明                                             |
| ----------------------------- | ------------------------------------------------ |
| C#                            | 提供语法高亮、智能感知、查找引用、声明定义等功能 |
| MSBuild                       | 项目文件智能感知                                 |
| C# XML Documentation Comments | 生成 XML 文档注释                                |
| C# Extensions                 | 类、接口、析构函数支持                           |
| ILSpy                         | 反编译 MSIL 程序                                 |
| REST Client                   | 发送 HTTP 请求并查看响应                         |

## .NET

### .NET 与 C#

.NET 是一个公共开发平台，包括公共运行库（CLR）和基类库（BCL）等一些组件，而 C# 是这个平台的最流行的开发语言之一。

### .NET 版本与 C# 版本

.NET 版本与 C# 版本和 C# 编译器的版本没有绝对的对应关系，主版本号不一定相同，但是有最小的限制，如只实现了 .NET Standard 2.0 标准的旧平台 .NET Framework，就只能对 C# 8.0 以下有完整的支持。

### .NET Framework

.NET Framework 是旧的平台，只支持 Windows。

### Mono 和 Xamarin

Mono 是第三方的 .NET Framework 实现，可以跨平台，实现上比官方的落后。而 Xamarin 主要用于移动平台的开发。

### .NET Core

.NET Core 是新的平台，是开源且跨平台的，包括名为 CoreCLR 的 CLR 跨平台实现和名为 CoreFX 的精简类库。

.NET Core 中移除了一些非跨平台的旧技术，如 Windows Forms 和 WPF 只能用于 Windows 平台，因此在 macOS 和 Linux 的 .NET Core 中已被移除。

用于开发 Web 应用和服务的 ASP.NET 和 ASP.NET Web API 在 .NET Core 中也已重新组合为 ASP.NET Core。

用于关系型数据库的 Entity Framework 也被重新组合为 Entity Framework Core，并新增了对非关系数据库的支持。

.NET Core 还被组件化为 NuGet 包，这样可以被独立部署为单个的功能块，以减少依赖。

### .NET Standard

简单来讲，.NET 有三个分支。

- .NET Framework：用于旧应用；
- .NET Core：用于跨平台和新应用；
- Xamarin：用于移动应用。

以上每个平台都有其使用场景，但这就导致了开发人员需要学习三个平台，且每个都有不同的限制，因此容易造成混乱，因此 .NET Standard 是一套所有平台都兼容的 API 规范，在 .NET Standard 2.0 中，已经满足了这三个平台的现代技术最低标准，可以在相互之间共享代码。

.NET Standard 只是一种标准，不是某种需要被安装的程序，而以上三种平台都实现了它。

.NET Standard 2.1 由 .NET Core 3.0、Mono 和 Xamarin 实现，C# 8.0 的一些特性需要 .NET Standard 2.1，而最新的 .NET Framework 4.8 没有实现 .NET Standard 2.1，因此当使用 .NET Framework 时，对 C# 8.0 的支持是有限的，如果要使用 C# 8.0 以上的版本，则需要使用 .Net Core。

### .NET 5 和 6

.NET Core 主版本号到 5 后，重命名为 .NET（但 ASP.NET Core 和 Entity Framework Core 保留 Core 这个单词，以避免混淆），即 .NET 可以泛指整个涉及 .NET 技术体系，也可以指新技术 .NET 5+ 的版本。

在 .NET 6 中，.NET 平台将只有一个，因为 .NET 6 统一了所有平台，含有一个基类库和两个运行时，一个运行时用于优化服务器和桌面，如基于 .NET Core 运行时的网站和 Windows 桌面应用，另一个用于优化基于 Xamarin 运行时的移动应用。此外，还包含一个跨平台 UI 框架 .NET MAUI。

## C# IL

C# 和 C / C++ 这类直接编译成机器码的语言不同，C# 的编译器 Roslyn 会先将源代码转换成 IL 代码，即中间代码，并将 IL 存储在程序集 exe 或 dll 中，IL 代码会由 .NET 虚拟机 CoreCLR 执行。

CoreCLR 从程序集中加载 IL 代码后，再由 JIT 编译器将代码编译成机器指令，最后由 CPU 执行，因此，.NET 程序的 IL 代码是全平台通用的，可以使用诸如 ILSpy 这样的 .NET 反编译工具显示 IL 代码并还原成源代码。

# 2 语言基础

## 声明

除了常规的声明方式外，C# 还支持使用 `var` 关键字来进行类型推导。

```c#
int x = 3;
var y = x;
StreamWriter file1 = File.CreateText(@"C:\file.txt");
var file2 = file1;
```

声明常量使用 `const` 关键字，但此时不能使用类型推导。

```c#
const int x = 3;
const var y = 4;    // 错误
```

## 数据类型

C# 中数据类型大致分为**值类型**和**引用类型**，像整数、浮点数、布尔类型这类是值类型，字符和字符串这类是引用类型。

### 整数和浮点数类型

C# 使用 `byte` 和 `sbyte` 来分别表示无符号单字节和有符号单字节数据，其余的数据类型和 C 基本相同，此外浮点数中 C# 还增加了 `decimal` 类型，大小为 16 字节，用于精确表示浮点数或较大的整数，后缀为 `M`。由于 C# 是完全面向对象的，因此如 `int` 类型实际上是 `System.Int32` 结构体的别名。

| 类型           | 大小 |
| :------------- | ---- |
| byte / sbyte   | 1    |
| ushort / short | 2    |
| uint / int     | 4    |
| ulong / long   | 8    |
| float          | 4    |
| double         | 8    |
| decimal        | 16   |

### 布尔类型

C# 使用 `true` 和 `false` 来表示 `bool` 类型，且不代表整数 1 和 0，大小为 1 字节。

```c#
bool ook = true;
bool bad = false;
```

### 字符和字符串类型

C# 中的字符虽然是用 `char` 表示，但代表的是一个 2 字节的 Unicode 字符，超过 2 字节的 Unicode 字符需要使用 `string` 类型来表示，string 类型实际上是 `String` 类的别名。

```c#
char ch = '哈';
int x = sizeof(char);    // x = 2
```

C# 中的字符串用 string 类型表示。

```c#
string str = "abcd";
string str = "😅";
```

除了字面字符串外，C# 中还有带 `@` 前缀的**逐字字符串**，会把字符串中的转义字符也当做普通字符。

```c#
string path = @"C:\User\username\file.txt";
```

以及带 `$` 前缀的**内插字符串**，以支持嵌入式的格式化变量或表达式。

```c#
int x = 3;
int y = 4;
string str = "x + y";
string res = $"{str} = {x + y}";    // res = "x + y = 7"
```

### object 和动态存储类型

C# 中有两种特殊的 `object` 和 `dynamic` 类型，前者是所有类型的基类，类似 C 中的 `void*`，需要显式进行类型转换，后者可以存储任意类型，且不需要显式进行类型转换，类似 C 中的共用体，这两者都会造成性能下降。

```c#
object x = 1.25;
object str = "abcd";
double d = (double)x;
int len = ((string)str).Length;
dynamic dyn = 5;
dyn = 1.0;
dyn = "www";
```

### 空类型

C# 中值类型默认不能为空值，引用类型默认可以为空值，但从 C# 8.0 开始，引入了**可空引用类型**和**不可空引用类型**的特性，即可以把引用类型设置为不可为空。

在项目级别启用这个特性，在项目文件中添加：

```xml
<PropertyGroup>
    <Nullable>enable</Nullable>
</PropertyGroup>
```

在文件级别启动这个特性，在文件顶部添加：

```c#
#nullable enable
```

开启后，对于本来默认可以为空值的引用类型，比如 string，则默认不能为空值。若一个变量的值可能为空值，需在类型关键字后加上 `?` 后缀来修饰。

```c#
string str1 = null;     // 错误
string? str2 = null;
int? x = str2;
```

要使用可能为空值的变量，可使用空条件运算符 `?.`。

```c#
int? x = str?.Length;
```

若必须要变量分配一个值且不能是空值，可使用空合并操作符 `??`。

```c#
var len = str?.Length ?? 0;
```

### 数组

C# 中数组的特性和使用方式和 C 类似，但是声明方式有所不同：

```c#
int[] a1 = new int[3];
int[] a2 = { 1, 2, 3 };
```

数组在栈中分配固定大小且连续的内存，适合临时存储数据，不适合动态的添加或删除项，在 C# 中使用集合来处理这种情况。

## 类型转换

隐式的类型转换不会丢失信息，如 int 转 double，由编译器自动执行，但可能引发信息丢失的类型转换必须显式进行，如 double 转 int。

除了和 C 一样使用强制转换类型运算符 `(type)` 来进行转换外，C# 还可以使用 `System.Convert` 类，可以转换为所有的数值类型，如布尔值、字符串、日期时间等。

```c#
double f = 3.6;
int i1 = (int)f;         // i1 = 3
int i2 = ToInt32(f);     // i2 = 4
```

### 舍入规则

使用强制类型转换运算符会直接将小数部分截断，而使用 Convert 类则采取四舍五入的方式，当小数部分为 0.5 时，**若非小数部分是奇数，则向上取整，否则向下取整**。

此外，还可以使用 `Math.Round` 方法来控制当小数部分为 0.5 时的舍入规则。

```c#
double f = 4.5;
Math.Round(f, MidpointRounding.AwayFromZero);   // 默认规则，向上取整，f = 5
Math.Round(f, MidpointRounding.ToEven);         // 向偶数取整，f = 4
```

### 转换为字符串

由于所有类型都是继承自 object 类，因此可以使用 `ToString` 方法来讲任何值转换为字符串的形式。

```c#
int n = 5;
bool b = true;
DateTime t = DateTime.Now;
object o = new object();
WriteLine(n.ToString());    // 输出 5
WriteLine(b.ToString());    // 输出 True
WriteLine(t.ToString());    // 输出 2022/2/11 12:30:59
WriteLine(o.ToString());    // 输出 System.Object
```

### 二进制对象转换为字符串

如图片、视频等二进制对象，在传输时，直接发送原始位可能会有安全、解析等问题，一般可以用 Base64 来编码进行传输，Convert 类的 `ToBase64String` 和 `FromBase64String` 方法可以编码和解码 Base64。

```c#
byte[] bin = new byte[8];
(new Random()).NextBytes(bin);
WriteLine("bin:");
foreach (byte b in bin)
{
    Write($"{b:X2} ");
}
string encode = ToBase64String(bin);
WriteLine($"\nencode:\n{encode}");
```

输出：

> bin:
> 67 1C 6C C3 4B 07 19 05
> encode:
> Zxxsw0sHGQU=

### 字符串转换为数值或时间

与 ToString 方法相反的是 `Parse` 方法，但只有数值类型和 `DateTime` 类型才有此方法。

```c#
int num = int.Parse("123");
DateTime time = DateTime.Parse("2022 02 12 18:30:59");
WriteLine(num);     // 输出 123
WriteLine(time);    // 输出 2022/2/12 18:30:59
```

### 类型判断

在类型转换之前，可以使用 `is` 关键字可以检查对象是否与给定类型兼容，如若容，则返回 true，否则返回 false。

```c#
object o = "hello";
string? s = null;
if (o is string)
{
    s = (string)o;
}
WriteLine(s == o);  // 输出 True
```

要同时判断多个类型或数值，可以用 `and` 或 `or` 关键字。

```c#
if (o is byte or short or int or long)
{
    // ...
}

if (o is > 10 and < 20 or > 10F and < 20F or > 10D and < 20D)
{
    // ...
}
```

`not` 关键字可以判断取反。

```c#
if (o is not int i)    // 等同于 !(o is int i)
{
    // ...
}

if (o is not (> 100 and < 200))
{
    // ...
}
```

### 转换引用类型对象

使用 `as` 关键字可以转换引用类型，若转换成功，则返回转换后的对象，否则返回 null。

```c#
object o = "hello";
string? s = o as string;
WriteLine(s == o);      // 输出 True
```

## 导入名称空间

C# 中的名称空间类似 C 中的 include 语句，使用 `using` 语句将引用的外部方法或类导入进来。

```c#
using System.IO;
using static System.Console;
```

加上 `static` 修饰符后，在使用时 System 名称空间中的 Console 类时，就不需要加前缀 `Console`。

## 格式化输出

C# 中可以使用 Console 类的 `Write` 或 `WriteLine` 方法和 String 类的 `Format` 方法来对字符串进行格式化，其中 Write 方法不会在行尾输出一个换行符。

```c#
WriteLine("a = {0}, b = {1}, a + b = {2}", a, b, a + b);
string str = string.Format("{0} * {1} = {2}", a, b, a * b);
```

格式化输出也支持内插字符串：

```c#
WriteLine($"{a} * {b} = {a * b}");
```

格式化的一般形式为：

```
{索引 [, 对齐选项][: 格式选项[精度]]}
```

对齐选项为一个值，表示宽度，正数表示右对齐，负数表示左对齐。格式选项为对数据的一些处理，精度表示整数的最低数字位数或浮点数的小数位数。

|  符号 | 含义               |
| ----: | ------------------ |
| C / c | 货币               |
| D / d | 十进制整数         |
| E / e | 指数               |
| F / f | 浮点数             |
| R / r | 圆整，只用于浮点数 |
| N / n | 用逗号分割千位     |
| P / p | 百分号             |
| X / x | 十六进制           |

```c#
WriteLine("{0:N0} {1:N2}", 1234.567, 1000.2);   // 输出 1,235 1,000.20
WriteLine("{0:X2} {1:X2}", 0xA, 0x2F);          // 输出 0A 2F
```

其中，`F` 和 `R` 都表示浮点数，但由于浮点数精度的问题，当使用 F 选项时，超出精度的部分可能不正确，无法将格式化后的字符串再还原为原本的浮点数，而 R 选项就可以避免这个问题。

```c#
double x = 123456.789101112;
WriteLine($"{x:F16}");          // 输出 123456.7891011119936593
WriteLine($"{x:R16}");          // 输出 123456.789101112
```

此外还可以完全自定义输出格式，此时不能再使用格式选项。

|      符号 | 含义                |
| --------: | ------------------- |
|         0 | 用 0 填充不足的位数 |
|         # | 用 # 代替实际的位数 |
|         . | 小数点              |
| E±0 / e±0 | 指数                |

```c#
double x = 123.456;
WriteLine($"{x:0.00}");         // 输出 123.45
WriteLine($"{x:00.000e+0}");    // 输出 12.346e+1
WriteLine($"{x:#.00000e-0}");   // 输出 1.23456e2
```

## 获取输入

可以使用 Console 类中的 `ReadLine` 方法获取一行输入，任何输入都将当作字符串返回。

```c#
string input = ReadLine();
WriteLine(input);
```

Console 类中的 Read 方法读取一个字符作为输入，并返回这个字符的 ASCII 码，输入完后的回车符将会被丢弃到标准输入流中，因此在下次处理输入时可能需要提前处理被上次输入丢弃的字符。

```c#
int i = Read();     // 输入 0 并回车
int j = Read();     // 这里直接获取回车符
WriteLine(i);       // 输出 48，ASCII ‘0’
WriteLine(j);       // 输出 13，ASCII ‘\r’
```

> 在 Windows 中用 `\r\n` 表示换行。

还可以使用 Console 类中的 ReadKey 方法获取一个按键输入，可以配合单个如 Crtl、Alt 或 Shift 这样的控制键（注意和其他快捷键不能冲突），且上次输入中被丢弃的字符不会被当作按键输入。

```c#
var key = ReadKey();    // 按下 Shift + K
                        // 输出 Key: R, KeyChar: R, Modifiers: Shift
WriteLine("\nKey: {0}, KeyChar: {1}, Modifiers: {2}",
    key.Key, key.KeyChar, key.Modifiers);
```

## 命令行参数

Main 方法中的 `string[] args` 参数用于从命令行中获取程序传递的参数，和 C 不同的是，程序本身不算在参数列表中，也就是说，第一个参数从下标 0 开始。

```c#
static void Main(string[] args) {
    WriteLine($"{args.Length} arguments:");
    foreach (var arg in args)
    {
        WriteLine($"{arg}");
    }
}
```

输入：

```shell
dotnet run a b c 'hello world'
```

输出：

> 4 arguments:
> a
> b
> c
> hello world

## 运算符

基本的算术运算符、条件运算符、位运算符、自增自减运算符基本和 C 相同，此外还有几个常用的运算符。

`nameof` 运算符以字符串形式返回变量、类型的短名称。

```c#
int num;
nameof(num);                    // 返回 "num"
```

`sizeof` 运算符返回类型的字节大小，但不能用于变量名称或 string 这种不能确定大小的类型。

```c#
WriteLine(sizeof(int));         // 输出 4
```

`typeof` 运算符返回类型的 `System.Type` 引用。

```c#
WriteLine(typeof(int));     // 输出 System.Int32
WriteLine(typeof(string));  // 输出 System.String
```

`default` 运算符返回类型的默认值。

```c#
int     i = default(int);       // i = 0
double  d = default(double);    // d = 0.0
string? s = default(String);    // s = null
```

## 函数

在 C# 中，函数也叫做方法。由于 C# 是完全面向对象的，因此所有的的方法都必须在类中。方法的定义和使用基本上和 C 相同。

## 流程控制

C# 中与流程控制相关的 if-else、while、do-while、for、switch-case、continue、break、goto 和 return 语句基本和 C 相同，**但在 switch 语句中，若 case 不为空语句，则该 case 必须有 break 语句（包括 default 标签）**，不能像 C 中可以执行多个 case 中的语句，如果必须这样做，可以使用 `goto` 来完成。

此外还有用于迭代序列的 `foreach` 语句，该语句可以将一个序列的元素进行遍历，且在遍历期间不能修改序列的结构，如添加或删除，但是可以修改元素的值，通常用于遍历数组或集合。

```c#
int[] nums = { 1, 12, 10, 20, 50 };
foreach (var e in nums)
{
    WriteLine(e);
}
```

foreach 所适用的对象必须要有 `GetEnumerator` 方法，且该方法会返回一个对象，返回的对象必须具有 `Current` 属性和 `MoveNext` 方法，MoveNext 方法会根据是否还有可枚举的项返回一个布尔值。

`IEnumerable` 和 `IEnumerable<>` 接口定义了这些规则，上述代码也可以写为：

```c#
int[] nums = { 1, 12, 10, 20, 50 };
IEnumerator e = nums.GetEnumerator();
while (e.MoveNext())
{
    WriteLine(e.Current);
}
```

但由于使用了迭代器，因此不能修改元素的值。

## 模式匹配

C# 中还有模式匹配用来使 if、switch 这样的语句更加强大灵活。

使用 `is` 关键字配合局部变量声明。

```c#
object o = '3';
int j = 4;
if (o is int i)     // if 不会执行
{
    WriteLine(i * j);
}
```

这种写法相当于：

```c#
if(o is int)
{
    var j = (int)o;
}
```

利用模式匹配，switch 语句的 case 值不再仅为常量值，还可以判断类型，配合 `when` 关键字还可以执行更具体的匹配。

```c#
string currentPath = Environment.CurrentDirectory;
Stream s = File.Open(
    Path.Combine(currentPath, "Program.cs"),
    FileMode.OpenOrCreate,
    FileAccess.Read);
string? message = null;
switch (s)
{

    case FileStream fs when s.CanWrite:
        message = "Stream can write";
        break;
    case FileStream fs:
        message = "Stream is readonly";
        break;
    case MemoryStream ms:
        message = "Stream is null";
        break;
    case null:
        message = "Stream is memory address";
        break;
    default:
        message = "Stream is other type";
        break;
}
WriteLine(message);
```

上面每个 case 标签都匹配一定的类型，类型后面的局部变量如 `fs` 是可选的，作用和像 `o is int j` 这类表达式相同，如果后面需要使用到局部变量则需要定义。

`_` 关键字用于表示一个无用的对象并占位，常用于模式匹配。

```c#
if(o is int _)
{
    // ...
}

switch (o)
{
    case int _:
        // ...
    case double _:
        // ...
}
```

在 C# 8.0 中还增加了 switch 表达式，所有 case 子句都可使用 `=>` 来返回值，因此上述 switch 语句还可以写成：

```c#
string message = s switch
{
    FileStream fs when s.CanWrite
        => "Stream can write",
    FileStream fs
        => "Stream is readonly",
    MemoryStream ms
        => "Stream is null",
    null
        => "Stream is memory address",
    _
        => "Stream is other type"
};
```

区别主要是去掉了 case 和 break 关键字，并使用逗号分隔，`_` 用于表示默认返回值。

## 异常处理

### 捕获异常

在使用 Parse 方法进行类型转换时，如果字符串不能转换，则会抛出异常信息。

```c#
int n = int.Parse("123abc");
```

> Unhandled exception. System.FormatException: Input string was not in a correct format.

要避免这种情况，可以使用 TryParse 方法，当成功时返回 true，否则返回 false。

```c#
Write("Input n: ");
int n;
if (int.TryParse(ReadLine(), out n))
{
    WriteLine(n);
}
```

当知道某个语句可能会发生错误时，可以将语句放到 `try` 块中，并使用 `catch` 捕获异常。

```c#
Write("Input n: ");
string? input = ReadLine();
try
{
    int n = int.Parse(input);
}
catch (OverflowException oe)
{
    WriteLine($"{oe.GetType()} says {oe.Message}");
}
catch (FormatException fe)
{
    WriteLine($"{fe.GetType()} says {fe.Message}");
}
catch (Exception e)
{
    WriteLine($"{e.GetType()} says {e.Message}");
}
finally
{
    WriteLine("Done.");
}
```

catch 语句可以用来捕获特定异常或任意异常，并且还可以提供参数用于从异常中获取信息。catch 可以有多个也可以没有，finally 可以有 1 个或没有，但当 catch 语句不存在时必须要有 finally。当 finally 存在时，无论有没有产生异常，都会执行其中的语句。

try 不仅可以用来检查转换异常，可以检查任何异常，如文件流异常、算术异常等等，但前提是需要里面的语句抛出异常，如 Parse 方法本身就会返回异常，因此才能够被 catch 捕获。

使用 `throw` 来直接抛出一个异常。

```c#
if(input < 0 || input > 100)
{
    throw new ArgumentOutOfRangeException("input must be between 0 and 100");
}
```

### 检查溢出

数值间在进行转换或者运算时，可能会发生信息丢失或者溢出等情况，此时可以用 `checked` 关键字来检查异常。

```c#
int x = int.MaxValue;
checked
{
    x++;
}
```

> Unhandled exception. System.OverflowException: Arithmetic operation resulted in an overflow.

checked 只能检查是否溢出，并抛出异常信息，如果要处理还需要放到 try 中。

```c#
int x = int.MaxValue;
try
{
    checked
    {
        x++;
    }
}
catch (OverflowException oe)
{
    WriteLine($"{oe.GetType()} says {oe.Message}");
}
```

如果在 try 中不使用 checked，那么异常就不会被捕捉到。

### 禁用编译时溢出检查

在编译时计算的语句，若发生溢出且语句没有放在 checked 或 try 中时，会产生编译错误，需要使用 `unchecked` 关键字来禁用。

```c#
int x = int.MaxValue + 1;       // 编译期计算，编译错误

unchecked
{
    int x = int.MaxValue + 1;
}

for (byte i = 0; i < 300; i++)  // 虽然会溢出，但不在编译期计算，编译不报错
{
    WriteLine(i);
}
```

# 3 面向对象

对象指抽象或具体的事物，在 C# 中通常使用 `class` 或者 `struct` 关键字来定义。

面向对象有几个重要的概念：

- 封装：与对象相关的数据和操作。
- 组合：对象由什么组成。
- 聚合：对象可以与哪些其他对象结合。
- 继承：从基类或超类派生子类来重用代码。
- 抽象：只取对象的核心思想而忽略细节。
- 多态：派生类可以自定义父类的操作。

## 创建类库

在一个新的文件夹使用 `dotnet new classlib` 来创建类库。

```c#
namespace NewLibrary;
public class Class1
{}
```

`public` 关键字为访问修饰符，表示允许其他程序集访问这个类，默认的修饰符为 `internal`，表示只能在本程序集内访问。

> 程序集可以看作一个 DLL 文件，程序调用其他 DLL 文件中代码，即访问其他程序集。在 C# 中包含一个 `.csproj` 的文件夹内的代码通常为同一个程序集。

## 类成员

成员即类中的内容，可以是字段和方法。

字段用于存储数据，有三种类别：

- 常量字段：编译时就已经固定不变的数据。
- 只读字段：类实例化后不变的数据，初值可以在运行时计算。
- 事件：数据引用的方法，通过用在界面按钮或响应其他代码的请求。

方法用于执行语句，有四种类别：

- 构造函数：使用 `new` 关键字分配内存和实例化类。
- 属性：获取或设置数据的值。数据通常在字段中，但也可以在外部或运行时计算，主要用于封装字段。
- 索引器：使用数组语法 `[]` 获取或设置数据。
- 运算符：对类的操作符进行重载。

## 使用类

设在同一个目录下有 `MyProgram` 和 `MyLibrary` 这两个文件夹，对这两个文件夹分别使用 `dotnet new console` 和 `dotnet new classlib` 创建控制台程序和类库，再手动新增几个文件并更改一些名称，现在其目录结构如下：

```
├─MyProgram
│   ├─bin
│   ├─obj
│   ├─MyProgram.csproj
│   ├─Program.cs
│   └─Program2.cs
│
└─MyLibrary
    ├─bin
    ├─obj
    ├─Class1.cs
    ├─Class2.cs
    └─MyLibrary.csproj
```

更改文件的内容：

```c#
// MyProgram/Program.cs
using static System.Console;
using NewLibraryA;
using NewLibraryB;

namespace MainProj
{
    class PMain
    {
        static void Main(string[] args)
        {
            WriteLine("MainProj -> PMain");
            POther.func();
            ProjTool.ProgTool1.func();
            ProjTool.ProgTool2.func();
            ClassA.func();
            ClassB1.func();
            ClassB2.func();
        }
    }
}

// MyProgram/Program2.cs
using static System.Console;

namespace MainProj
{
    class POther
    {
        public static void func()
        {
            WriteLine("MainProj -> POther");
        }
    }
}

namespace ProjTool
{
    class ProgTool1
    {
        public static void func()
        {
            WriteLine("ProjTool -> ProgTool1");
        }
    }

    class ProgTool2
    {
        public static void func()
        {
            WriteLine("ProjTool -> ProgTool2");
        }
    }
}

// MyLibrary/Class1.cs
using static System.Console;

namespace NewLibraryA
{
    public class ClassA
    {
        public static void func()
        {
            WriteLine("MyLibrary -> NewLibraryA - > ClassA");
        }
    }
}

// MyLibrary/Class2.cs
using static System.Console;

namespace NewLibraryB
{
    public class ClassB1
    {
        public static void func()
        {
            WriteLine("MyLibrary -> NewLibraryB - > ClassB1");
        }
    }

    public class ClassB2
    {
        public static void func()
        {
            WriteLine("MyLibrary -> NewLibraryB - > ClassB2");
        }
    }
}
```

输出：

> MainProj -> PMain
> MainProj -> POther
> ProjTool -> ProgTool1
> ProjTool -> ProgTool2
> MyLibrary -> NewLibraryA - > ClassA
> MyLibrary -> NewLibraryB - > ClassB1
> MyLibrary -> NewLibraryB - > ClassB2

可以看出，以 `.csproj` 所在的文件夹看作一个程序集，程序集名称和文件夹名相同，其中的 `.cs` 文件名和程序集名没有关联，程序集名、名称空间、类名之间没有关联，程序只会从含有 `Main` 方法的类开始。一个程序集可以包含多个名称空间，一个名称空间也可以包含多个类。

若使用的类在另一个程序集，那么需要在使用类前，需要引用包含这个类的程序集，在 `MyProgram.csproj` 中添加：

```xml
<ItemGroup>
  <ProjectReference Include="../MyLibrary/MyLibrary.csproj" />
</ItemGroup>
```

并在引用的文件中导入名称空间：

```c#
using NewLibraryA;
using NewLibraryB;
```

如果不导入名称空间，则在使用时需要加上名称空间的前缀。

此外可以发现，由于需要使用其他程序集中的类，在 MyLibrary 这个程序中的类和方法，都使用了 public 访问修饰符。

### 类的继承

在定义类的时候虽然没有显式的指定从哪个类中继承，但所有的类都从 System.Object 继承而来。

```c#
public class NewLibraryA: System.Object    // 显式指定
```

类只能继承一个，不能多个，且构造器不能被继承。

### 分割类

一个较为大型的项目，其类通常也会比较大，为了方便管理，可以将类拆分成多个部分放在不同的文件中，在编译时会自动合成为一个类。

使用 `partial` 关键字可以分隔类：

```c#
// 文件 file1.cs
namespace SomeSpace
{
    public partial class SomeClass
    {
        // ...
    }
}

// 文件 file2.cs
namespace SomeSpace
{
    public partial class SomeClass
    {
        // ...
    }
}
```

需要注意的是，被分割的类必须处在同一个名称空间中。

## 访问修饰符

访问修饰符不仅可以修饰类，还可以修饰结构、纪录、类的成员和方法、接口以及委托等所有类型。

| 关键字             | 含义                          |
| ------------------ | ----------------------------- |
| public             | 访问不受限制                  |
| internal           | 访问限于当前程序集            |
| private            | 访问限于类内部                |
| protected          | 访问限于类内部或派生类        |
| internal protected | 相当于 internal_or_protected  |
| private protected  | 相当于 internal_and_protected |

访问修饰遵循以下原则：

- 当直接在名称空间中声明的所有顶级类型（类、记录、结构、枚举、接口、委托），可以为 `public` 或 `internal`，默认为 `internal`。
- 类和结构的成员默认为 `private`，由于结构不能继承因此不能为 `protected`。
- 枚举和接口的成员始终为 `public`。
- 派生类和记录不能具有高于其基类型的可访问性。

## 使用字段

### 封装字段

设 `Person` 类包含姓名和年龄，可以在其内部封装字段。

```c#
class Person
{
    public string? Name;
    public int Age;
}
```

然后可以在 Main 方法中使用。

```c#
var x = new Person();
x.Name = "Alice";
x.age = 20;
WriteLine($"Name: {x.Name}\nAge: {x.Age}");
```

`new` 关键字创建类的实例，可以在创建时给成员赋值。

```c#
var x = new Person { Name = "Alice", Age = 20 };
```

### 使用 enum

当值是一组有限的选项中的某个时，使用 `enum` 关键字来组织是更好的方式。

```c#
enum Color
{
    White,
    Red,
    Green,
    Blue,
    Black
}
```

虽然每个选项都是一个名字，但在内部实际上是从 0 开始的 int 值。

还可以使用 enum 将单个值组合成标志，这样内存中的位就不会重叠。

```c#
[System.Flags]
enum Color : byte
{
    White = 0b_0000,
    Red   = 0b_0001,
    Green = 0b_0010,
    Blue  = 0b_0100,
    Black = 0b_1000
}
```

可以为每个选项显式分配值，指定 byte 类型可以节省内存，使用 `[System.Flags]` 修饰，这样在返回时，可以自动匹配多个值（逗号分隔的字符串），而不是一个 int 值。此外，枚举不能修改修饰符且默认为 public。

### 使用集合

导入名称空间：

```c#
using System.Collections.Generic;
```

在 Person 类中加入：

```c#
public List<Person> Chidren = new List<Person>();
```

然后可以在 Main 方法中使用：

```c#
var alice = new Person { Name = "Alice" };
alice.Chidren.Add(new Person { Name = "Bob" });
alice.Chidren.Add(new Person { Name = "John"});
for (int i = 0; i < alice.Chidren.Count; i++)
{
    WriteLine($"{alice.Chidren[i].Name}");
}
```

`List<T>` 表示列表，`T` 表示泛型。

### 静态字段

使用 `static` 关键字可以创建静态成员，静态成员可以在所有实例之间共享，是属于类的的字段，而不是实例的字段。

在 Person 类中加入：

```c#
public static string? Planet;
```

在 Main 方法中使用：

```c#
Person.Planet = "Mars";
WriteLine(Person.Planet);
```

### 常量字段

如果字段值不会改变，可以使用常量字段：

```c#
public const string Species = "Homo Sapien";
```

虽然没有使用 static，但常量字段和 static 作用相同，都只能使用类名来使用，而不是实例的名称。

### 只读字段

常量字段有着极大的限制，首先值必须在编译时就能确定，且只能表示为字面值，而且只能作为类的字段，而不是实例的字段，更好的选择是使用只读字段。只读字段可以当作实例的字段，也可以使用 static 修饰为类的字段，且不一定必须在编译期就能确定或字面值，而是可以在运行中计算。

```c#
public readonly string? Sex;
public readonly static string Species = "Homo Sapien";
```

`Sex` 字段作为性别，是属于每个实例的，但是一旦确定就不能更改，而 `Species` 字段作为种族，是 Person 类固定的属性，同样也不可更改。

## 使用方法

### 构造函数

字段通常需要初始化，当使用 new 来创建实例时将调用构造函数，并进行初始化操作。构造函数用于实例，虽然不显式定义构造函数也可以创建实例，但无法对只读字段赋值，这时需要显式定义。

构造函数是特殊的方法，默认名称和类名相同，且不用写返回值类型，还可以定义多个构造函数，但是其函数签名不能相同。

```c#
public Person()
{
    Name = "Unkonw";
    Age = -1;
    Sex = "Unknow";
}

public Person(string name, int age)
{
    Name = name;
    Age = age;
}

public Person(string name, int age, string sex)
{
    this.Name = name;
    this.Age = age;
    this.Sex = sex;
}
```

在 Main 方法中使用：

```c#
var alice = new Person("Alice", 20, "Female");
```

`this` 表示该实例，可以省略。

可以使用 `defalut` 来替代 `default(type)` 来为构造函数设置默认值。

```c#
public Person()
{
    Name = default;
    Age = default;
    Sex = default;
}
```

使用 public 修饰的是实例构造器，当为类定义构造器时，使用 static 修饰。

```c#
static Person()
{
    Amount = 0;
}
```

### 析构函数

析构函数用于析构类的实例，主要用于在 C# 运行时释放资源时，做一些额外操作。

析构函数有以下原则：

- 一个类只能有一个析构函数；
- 无法继承或重载析构函数；
- 无法调用析构函数，因为是自动调用的；
- 析构函数既没有访问修饰符，也没有参数。

定义析构函数和构造函数类似，名称和类名相同，并在前面加上 `~`：

```c#
~Person()
{
    WriteLine("Resources have been released");
}
```

当 Person 类的实例资源被释放时，将打印这条信息。

无法控制何时调用析构函数，因为这由垃圾回收器决定。垃圾回收器检查是否存在应用程序不再使用的对象，如果某个对象符合析构，则调用析构函数（如果存在），回收该对象的内存，程序退出时也会调用析构函数。

通常垃圾回收器会隐式地管理对象的内存分配和释放，但当应用程序封装窗口、文件和网络连接这类非托管资源时，应使用析构函数释放这些资源。

### 方法返回值

方法可以没有返回值，也可以有一个或多个返回值。可以定义一个新类来返回多个不同类型的值：

```c#
class TextAndNumber
{
    public string? Text;
    public int Number;
}

static TextAndNumber GetData()
{
    return new TextAndNumber
    {
        Text = "text1",
        Number = 1
    };
}
```

为了返回多个值而定义一个新类是没有必要的，可以使用元组来返回多个不同类型的值。

```c#
static (string, int) GetData()
{
    return ("text1", 1);
}
```

然后在 Main 方法中使用：

```c#
(string, int) data = GetData();
WriteLine($"{data.Item1}, {data.Item2}");
```

对于元组中的字段，默认名称是 `Item1`、`Item2` 等，但也可以显式指定名称。

```c#
// GetData 方法
static (string Name, int Number) GetData()
{
    return (Name: "text1", Number: 1);
}

// Main 方法
(string Name, int Number) data = GetData();
WriteLine($"{data.Name}, {data.Number}");
```

C# 还会自动推断元组名称，创建一个 User 类：

```c#
class User
{
    public string? Name;
    public int Age;
}
```

然后在 Main 方法中使用：

```c#
var user = new User { Name = "Alice", Age = 20 };
var user2 = (user.Name, user.Age);
WriteLine($"{user2.Name}, {user2.Age}");
```

可以看到，元组的字段名被推断为类的字段名。

元组还能被解构为单个变量：

```c#
(string name, int number) = GetData();
```

### 方法重载

可以在一个类中定义两个名字相同的方法，但这两个方法的签名不能相同。方法签名和传递时参数列表个数、类型和方法返回值有关。

```c#
// 重载一
public int Add(int x, int y)
{
    return x + y;
}

// 重载二
public double Add(double x, double y)
{
    return x + y;
}
```

### 定义参数

基本的定义参数和传递参数和 C 基本相同，但 C# 还支持定义可选参数和命名参数。

可选参数：通过在定义时设置默认值，使参数可选，**可选参数必须位于参数列表最后**。

```c#
static void OptPara(string arg1 = "first", int arg2 = 2, bool arg3 = false)
```

命名参数：通过在调用时显式指定参数名，可以改变参数传递顺序，还可以跳过可选参数。

```c#
QptPara(arg3:true, arg2:10);
```

### 参数传递方式

传递参数给方法时，有三种方式：

- 值传递，默认方式
- 作为 `ref` 参数
- 作为 `out` 参数

```c#
static void func(int x, ref int y, out int z)
{
    x++;
    y++;
    z = 10;
}

// Main 方法
int a = 10, b = 20, c = 30;
func(a, ref b, out c);
WriteLine($"{a} {b} {c}");    // 输出 10 21 10
```

值传递相当于传递了一个参数的拷贝，外部和内部是互不影响的，而 ref 和 out 都相当于传递了参数的引用，out 的语义主要是为了表示一个变量肯定会被改变，而 ref 则不一定，因此可以简化 out 变量，不用预先定义。

```c#
int a = 10, b = 20;
func(a, ref b, out int c);
```

### 属性

属性是一种称为访问器的特殊方法，是字段的扩展，可以读取、写入或计算私有字段的值。可以隐藏实现或验证代码，有助于提高方法的安全性和灵活性。

属性包含用于读取或写入属性的可执行语句，访问器声明可包含 `get` 和 `set` 访问器。

```c#
class Person
{
    string _name;
    int _age;
    public Person(string name, int age)
    {
        _name = name;
        _age = age;
    }
    public string Name
    {
        get
        {
            return _name;
        }
        set
        {
            _name = value;
        }
    }
    public int Age
    {
        get
        {
            return _age;
        }
        set
        {
            if (value < 0 || value > 120)
            {
                throw new ArgumentOutOfRangeException("value must be between 0 and 120");
            }
            _age = value;
        }
    }
}

static void Main(string[] args)
{
    var someone = new Person("Alice", 20);
    WriteLine(someone.Name);
    WriteLine(someone.Age);
}
```

可以看到，`name` 和 `age` 字段本来是私有字段，但是通过属性的 get 和 set 访问器，变得可以读写。属性虽然也是方法，但是作为字段的扩展，使用的语法也和字段相同。其中 `value` 关键字用于定义访问器分配的值。直接使用字段可能不会验证值是否正确，而使用 set 可以对值做一些计算或验证。

只读属性仅包含 get 部分，且可以使用 lambda 表达式，只写属性仅包含 set 部分，但很少使用。两者都可以使用 `expression-bodied` 来简化语法。

```c#
// expression-bodied
public string Name
{
    get => _name;
    set => _name = value;
}

// lambda
public int Age => age;
```

有时 get 和 set 访问器仅向支持字段赋值或仅从其中检索值，而不包括任何附加逻辑。通过使用自动实现的属性，虽然没有手动创建字段，但是编译器将自动创建。

```c#
public class SaleItem
{
   public string Name { get; set; }

   public decimal Price { get; set; }
}
```

### 索引器

索引器允许使用数组语法来访问属性，将返回或设置对象实例的一个特定值，相当于把实例数据分为更小的部分，并索引每个部分。

索引器定义的时候不带有名称，但带有返回值类型和 `this` 关键字，指向对象实例。

```c#
class Person
{
    public string? Name { get; set; }
    public List<Person> Children = new List<Person>();
    public Person(string name)
    {
        Name = name;
    }
    public Person this[int index]
    {
        get => Children[index];
        set => Children[index] = value;
    }
}

class Program
{
    static void Main(string[] args)
    {
        var alice = new Person("Alice");
        alice.Children.Add(new Person("Bob"));
        alice.Children.Add(new Person("John"));
        WriteLine($"{alice[0].Name}");    // 等同于 alice.Children[0].Name
        WriteLine($"{alice[1].Name}");    // 等同于 alice.Children[1].Name
    }
}
```

索引器也可以被重载，可以使用 string 来而非 int 来索引。

```c#
public int this[string name]
{
    get
    {
        int index = 0;
        foreach (var e in Children)
        {
            if (e.Name == name)
                return index;
            index++;
        }
        return -1;
    }
}

// Main 方法
WriteLine($"{alice["John"]}");    // 输出 1
WriteLine($"{alice["Ella"]}");    // 输出 -1
```

### 运算符重载

System.String 类有一个 Concat 的静态方法，作用是连接两个字符串，但实际上可以直接使用 `+` 号来连接，这是因为使用了运算符重载。

```c#
string s1 = "hello";
string s2 = "world";
string s3 = String.Concat(s1, s2);
string s4 = s1 + s2;
```

可以使用 `operator` 关键字来自定义运算符，从而简化方法的使用。

如可以定义 `*` 运算符，操作数为 Person 类，表示生育一子。

```c#
class Person
{
    public string? Name { get; set; }
    public int Age { get; set; }
    public List<Person> Children = new List<Person>();
    public static Person Procreate(Person p1, Person p2)
    {
        var baby = new Person { Name = p1.Name + "&" + p2.Name, Age = 0 };
        p1.Children.Add(baby);
        p2.Children.Add(baby);
        return baby;
    }
    public static Person operator *(Person p1, Person p2)
    {
        return Procreate(p1, p2);
    }
}

class Program
{
    static void Main(string[] args)
    {
        var p1 = new Person { Name = "Alice", Age = 20 };
        var p2 = new Person { Name = "Bob", Age = 21 };
        var baby = p1 * p2;
        WriteLine(baby.Name);
    }
}
```

## 使用记录

对象可以在实例化时或之后设置值，若对象的某些属性是只读的，想要在实例化时进行初始化，还可以使用 init 属性，通过 init 关键字来定义。

```c#
class Person
{
    public string? Name { get; init; }
}

// Main 方法
var alice = new Person { Name = "Alice" };
alice.Name = "Bob";     // 报错
```

init 属性提供了不变性，如果一个对象在实例化之后不应有任何状态的变化，那么应该使用 `record` 关键字来创建记录，创建的记录不能被改变，只能基于现有的记录通过 `with` 关键字来创建新的记录，这一特性被称为**非破坏性突变**。

```c#
record Person
{
    public string? Name { get; init; }
    public int Age { get; init; }
}

class Program
{
    static void Main(string[] args)
    {
        var someone = new Person { Name = "Alice", Age = 20 };
        var otherone = someone with { Name = "Bob" };
        WriteLine($"{someone.Name}, {someone.Age}");
        WriteLine($"{otherone.Name}, {otherone.Age}");
    }
}
```

### 位置记录

通过自动定义 `Deconstruct` 方法来使编译器自动生成位置记录，用于提取实例的属性值。

```c#
record Person
{
    public string? Name { get; set; }
    public int Age { get; set; }
    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }
    public void Deconstruct(out string name, out int age)
    {
        name = Name;
        age = Age;
    }
}

class Program
{
    static void Main(string[] args)
    {
        var alice = new Person("Alice", 20);
        var (name, age) = alice;
        WriteLine($"{name}, {age}");
    }
}
```

位置记录提取属性值这不仅可以用于记录，还可以用于类。

# 4 委托、事件和接口

## 委托

委托类似 C 中的函数指针，即 C# 中的方法指针，但是更安全。委托也是一种类，其包含了方法的内存地址，方法匹配与委托相同的签名，能以正确的参数类型安全地调用方法。

如 SomeCall 方法返回字符串的长度：

```c#
class SomeClass
{
    public static int SomeCall(string str)
    {
        return str.Length;
    }
}

// Main 方法
int len = SomeClass.SomeCall("hello");
```

可以通过定义具有相同签名的委托来调用方法。

```c#
delegate int PFunc(string s);
class Program
{
    static void Main(string[] args)
    {
        var p = new PFunc(SomeClass.SomeCall);
        WriteLine(p("hello"));
    }
}
```

可以不用自定义委托，C# 自带了两种预定义委托，`Action` 和 `Func`。前者主要用于无返回值的类型，后者用于有返回值的类型。

```c#
class Program
{
    static void Main(string[] args)
    {
        var action = new Action(Calc.Report);
        var func1 = new Func<int, int, int>(Calc.Add);
        var func2 = new Func<int, int, int>(Calc.Sub);
        action.Invoke();
        WriteLine(func1.Invoke(1, 2));
        WriteLine(func2(1, 2));
    }
}

class Calc
{
    public static void Report()
    {
        WriteLine("Class Calc has 3 methods");
    }
    public static int Add(int x, int y) => x + y;
    public static int Sub(int x, int y) => x - y;
}
```

Action 和 Func 都可以使用 `<T>` 泛型，其中 Action 由于没有返回值，因此尖括号内表示参数类型，而 Func 最后一个表示返回值类型，其余的表示参数类型。委托可以使用 `Invoke` 方法来调用，也可以直接使用 `()` 的形式来调用。

可以将多个方法通过 `+=` 运算符绑定到一个委托上，并按照绑定顺序调用，称为**多播委托**。

```c#
class Program
{
    static void Main(string[] args)
    {
        var stu1 = new Student { Id = 1, Name = "Alice" };
        var stu2 = new Student { Id = 2, Name = "Bob" };
        var stu3 = new Student { Id = 3, Name = "Claire" };
        var action = new Action(stu1.Report);
        action += new Action(stu2.Report);
        action += new Action(stu3.Report);
        action();
    }
}

class Student
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public void Report()
    {
        WriteLine($"ID: {Id}, Name: {Name}");
    }
}
```

此外可以使用 `-=` 来取消绑定，使用 `=` 来清空绑定并将右值绑定到委托。如果使用多播委托来调用带有返回值的方法，那么委托的值为最后一个方法的返回值。

由于委托本质上是一个函数指针的列表，多播委托会根据列表顺序调用函数，因此委托可以进行迭代，要获取每个方法的返回值，可以使用委托实例的 `GetInvocationList` 方法：

```c#
class Program
{
    static void Main(string[] args)
    {
        var f1 = new Func<int, int, int>(Calc.Add);
        f1 += new Func<int, int, int>(Calc.Sub);
        f1 += new Func<int, int, int>(Calc.Mul);
        f1 += new Func<int, int, int>(Calc.Div);
        foreach (Func<int, int, int> f in f1.GetInvocationList())
        {
            Console.WriteLine(f(6, 2));
        }

    }
}

class Calc
{
    public static int Add(int x, int y) => x + y;
    public static int Sub(int x, int y) => x - y;
    public static int Mul(int x, int y) => x * y;
    public static int Div(int x, int y) => x / y;
}
```

由于委托可以动态的绑定或解绑，因此在使用时需要注意进行 null 检查。

```c#
action?.Invoke();
```

委托十分灵活，但滥用委托容易导致程序变得十分混乱，在 C# 中主要使用委托来处理事件。

## 事件

### 事件的要素

事件包含五个元素：事件的发布者、事件成员、事件的订阅者、事件处理器和订阅关系。事件的发布者是一个类，包含了事件成员，事件的订阅者也是一个类，包含了事件处理器，并且订阅这个事件，当事件发生时，事件的发布者只负责将事件发生了这个消息通知给其他订阅了这个事件的类，事件的实际处理，则由事件处理器来执行，事件的发布者并不关心如何处理，因此事件实际上是一种高内聚低耦合的设计模式。

事件最主要的用处就是使对象具有通知的功能，一个完整的事件发生的流程为：对象的事件被触发、发布通知、订阅了该事件的对象接收通知、处理该事件。事件的发布者可以拥有多个事件，一个事件可以被多个对象订阅，一个事件处理器也可以响应多个事件，事件的发布者和订阅者之间的关系可以是不同的对象、相同的对象或对象间含有包含关系，如事件的发布者是订阅者的子类或仅仅为一个成员。

<img src="https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203041153583.png" alt="订阅关系" style="zoom: 50%;" />

事件实际上是一个特殊的委托类型字段，使用 `event` 关键字修饰。由于委托相当于一种类，在定义后可以在任何地方使用，因此事件在此基础上做了限制：事件只能由定义它的类来使用，在类的外部，只能使用 `+=` 和 `-=` 来绑定或解绑，且不能通过 `=` 来清空绑定列表。这里的绑定，实际上就是订阅，当订阅时，实际上就是将事件处理器绑定到事件上，可以看作将方法绑定到委托上，在事件被触发时，可以看作使用委托，并依次调用绑定到委托上的方法，因此事件处理器必须和事件的签名相匹配。

```c#
delegate void PersonEventHandler();
class Program
{
    static void Main(string[] args)
    {
        Person.Greet();  // 错误，只能出现在 += 或 -= 的左边
        Person.Greet += Person.SayHello_Greet;
        Person.Action();
    }
}

class Person
{
    public static event PersonEventHandler Greet;
    public static void Action()
    {
        Greet();         // 正确，因为在定义类的内部
    }



    public static void SayHello_Greet()
    {
        WriteLine("Hello");
    }
}
```

Person 类同时拥有事件和事件处理器，因此该类同时是事件的发布者和订阅者。可以看到 `Greeting` 事件只能在类的内部使用，由 `Action` 方法触发，也就是说，谁定义了事件，就由谁来触发这个事件，在类的外部，事件只能被订阅或取消订阅。

事件的发布者在发送通知时还可以附带一些事件的信息，称为**事件参数**，以帮助事件处理器更好的响应，C# 中事件处理器的名称一般以 `ObjectName_EventName` 来约定。

### 事件的完整声明

和属性的定义类似，事件的完整声明需要定义 `add` 和 `remove` 访问器，事件字段的委托类型通常以 `EventHandler` 结尾，事件参数通常以 `EventArgs` 结尾，事件的触发方法名以 `On + 事件名` 约定，且以 `protected` 修饰。定义属性时，访问器可以在读写值时做一些额外的工作，而事件的完整声明，访问器也可以做一些额外的工作。

设一个学生类和一个老师类，学生类具有举手事件，并且带有举手描述的信息作为事件参数，老师类有举手事件的处理器，根据事件参数作出不同的响应。

首先定义学生类和事件：

```c#
delegate void StudentEventHandler(Student student, StudentEventArgs e);

class StudentEventArgs : EventArgs
{
    public string Description { get; set; }
}

class Student
{
    StudentEventHandler studentEventHandler;
    public event StudentEventHandler HandsOn
    {
        add
        {
            studentEventHandler += value;
        }

        remove
        {
            studentEventHandler -= value;
        }
    }

    public void Action(string description)
    {
        OnHandsOn(description);
    }

    protected void OnHandsOn(string description)
    {
        if (studentEventHandler != null)
        {
            StudentEventArgs e = new StudentEventArgs();
            e.Description = description.ToLower();
            studentEventHandler(this, e);
        }
    }
}
```

自定义的事件参数通常要从 EventArgs 类继承，Action 方法用于触发事件并附带参数通知事件的订阅者。

当事件使用完整声明时，即使在定义事件的类内部，触发事件也不能使用事件名来调用，如 `HandsOn.Invoke(this, e)`，必须使用定义的委托来调用，也不能使用诸如 `!=` 来检查是否为空，只能当作 `+=` 和 `-=` 操作符的左值。

然后定义老师类：

```c#
class Teacher
{
    public void student_HandsOn(Student student, StudentEventArgs e)
    {
        switch (e.Description)
        {
            case "toilet":
                WriteLine("Go to toilet");
                break;
            case "illness":
                WriteLine("Go to hospital");
                break;
            default:
                WriteLine("Sit down");
                break;
        }
    }
}
```

最后在 Main 方法中定义：

```c#
Student student = new Student();
Teacher teacher = new Teacher();
student.HandsOn += teacher.student_HandsOn;
student.Action("toilet");
student.Action("illness");
student.Action("play");
```

可以看到，完整的事件声明需要包含：定义事件处理器的委托、定义发布者的事件且包含访问器的定义、事件的触发方法、订阅者的事件处理器以及订阅关系的绑定。

### 事件的简略声明

事件的完整声明和简略声明之间的关系类似属性和字段之间的关系，完整的声明比简略声明多了事件的访问器，和访问器需要的委托类型字段这两个元素。

用简略声明可以省略这两个元素：

```c#
// 简略声明事件
public event StudentEventHandler HandsOn;

// 事件触发
if (HandsOn != null)
{
    StudentEventArgs e = new StudentEventArgs();
    e.Description = description.ToLower();
    HandsOn(this, e);    // 或 HandsOn.Invoke(this, e)
}
```

可以看到，当使用简略声明时，可以使用 `!=` 来检查是否为空，也可以直接使用事件来调用方法。

### 预定义事件

C# 中预定义了两个委托可以用作事件：

```c#
public delegate void EventHandler(object sender, EventArgs e);
public delegate void TEventHandler<TEventArgs>(object sender, TEventArgs e);
```

因此通常使用时可以不必再定义委托：

```c#
class Program
{
    static void Main(string[] args)
    {
        Person.Greet += Person.SayHello_Greet;
        Person.Action();
    }
}

class Person
{
    public static event EventHandler Greet;
    public static void Action()
    {
        OnGreet();
    }

    protected static void OnGreet()
    {
        Greet(null, EventArgs.Empty);
    }

    public static void SayHello_Greet(object sender, EventArgs e)
    {
        WriteLine("Hello");
    }
}
```

## 区别事件和委托

虽说事件和委托只差了一个 event 关键字的区别，且事件本质也是委托，但是事件是被限制了的委托，且完整的声明包含访问器，这是委托所没有的。委托是对方法的封装，使方法成为一个类型可以被当作参数使用，那么事件就是对委托的封装，限定了委托只能在定义它的类中使用，在外部只暴露出添加和移除事件处理器的功能，而字段和属性也是类似，属性封装字段，这些封装都是为了防止外部滥用，提高安全性和降低耦合。
