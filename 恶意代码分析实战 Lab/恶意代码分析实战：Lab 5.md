# Lab 5-1

用 IDA 打开 *Lab05-01.dll*，定位到 `DLLMain`：

![DLLMain](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322520.png)

Import 窗口找到 `gethostbyname`：

![gethostbyname](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322009.png)

查看交叉引用：

![交叉引用](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322122.png)

查看 `sub_10001656+101` 处的调用：

![.text:10001757](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322278.png)

发现对 `pics.praticalmalwareanalysis.com` 发起了 DNS 请求。

查看 `sub_10001656` 子过程：

![sub_10001656](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322741.png)

有若干个局部变量和一个参数。

查看 Strings 窗口，定位到 `\cmd.exe /c`：

![Strings](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322153.png)

来到引用该字符串的区域：

![引用区域](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322302.png)

在图形模式下，有很多比较用操作：

![一系列 memcmp](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322405.png)

到该区域的开始处，可以看到有类似 `Remote Shell Session` 的字样：

![包含 Shell 字符串](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322355.png)

查看附近的函数调用， 发现了 `send` 和  `recv`：

![send](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322525.png)

![recv](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322431.png)

由此判断应该是一个远程 shell。

在同样的区域，地址 `100101C8` 处，有一个 cmp 指令，`dword_1008E5C4` 是一个全局变量。

通过交叉引用查看该变量是如何被设置的：

![交叉引用](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322596.png)

发现只有一条 mov 指令，定位到此处：

![设置区域](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322706.png)

可以发现 `sub_10003695` 的返回值就是该变量的值，查看该函数：

![sub_10003695](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322237.png)

可以看到返回值就是操作系统版本号，与 `PaltformId` 比较，若不为 2， 则返回值为 1。

再查看刚刚的一些列 `memcmp` 函数的比较：

![一系列 memcmp](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322873.png)

查看比较 `robotwork` 的部分：

![robotwork 区域](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322678.png)

若 jnz 不跳转，则会调用 `sub_100052A2`，查看该部分代码：

![sub_100052A2](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322874.png)

该函数接收一个 `socket` 参数，并且查询了注册表的值。

接着查看导出表，找到 `PSLIST`：

![PSLIST](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182322039.png)

可以看到，执行路径取决于 `sub_100036C3` 的结果，查看该函数：

![sub_100036C3](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321379.png)

其实就是获取操作系统版本，再查看 `sub_10006518` 和 `sub_1000664C`：

![sub_10006518](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321808.png)

![sub_1000664C](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321313.png)

注意到这两条分支都含有打开进程、获取进程列表等 API。

进一步查看相关调用，在绿色分支中会调用 `sub_100038BB`：

![sub_1000664C](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321079.png)

查看该函数：

![sub_100038BB](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321068.png)

可以判断是获得进程信息并通过 socket 发送。

然后来到 `sub_10004E79` 处，查看调用树：

![调用树](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321661.png)

可以看到，获取了 `LangID`，并通过 send 发送，可以将 `sub_10004E79` 命名为 `send_LangID`：

![重命名](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321681.png)

来到 `DLLMain` 处，设置递归深度为 1，查看调用树：

![调用树](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321238.png)

来到 `10001358` 处，有一个 `Sleep` 函数：

![Sleep 函数](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321358.png)

而休眠的时间来自于 eax 乘以 1000，eax 来自 `atoi` 的调用结果，调用之前的参数 eax 来自字符串 `off_1001920`，加上偏移 13 后正好为 30，因此休眠的时间为 30 秒。

来到 `100016FB` 处，有一个 `socket` 函数：

![loc_100016FB](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321721.png)

可以知道三个参数为地址规范、类型、协议，查看 [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-socket) 文档可知含义：

![AF](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321024.png)

![Type](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321709.png)

![Protocol](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321469.png)

在 IDA 中应用常量：

![应用常量](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321129.png)

因此这个 socket 会被配置为一个基于 IPv4 的 TCP 连接。

接着搜索 `in` 指令：

![in 指令处](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321857.png)

发现有比较字符串 `VMXh`，可以确定这是反虚拟机的操作。

最后来到 `1001D988`，发现一系列无意义字符串：

![无意义字符串](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205182321561.png)

将光标定位到字符串开始处，然后将以下 Python 脚本导入 IDA 执行：

```python
sea = get_screen_ea()
for i in range(0x00, 0x50):
    b = get_wide_byte(sea+i)
    decoded_byte = b ^ 0x55
    patch_byte(sea+i, decoded_byte)
```

然后重新转换成字符串：

![转换后](E:\ProgData\ImgCache\image-20220518231329303.png)

