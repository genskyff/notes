# Lab 6-1

将 *Lab06-01.exe* 用 IDA 打开：

![反汇编](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205192304044.png)

结构十分简单，main 函数只有一个 call，然后一个 if 语句，进入该 call：

![sub_401000](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205192304928.png)

发现大致是一个判断是否联网的函数，里面同样有一个 if 语句，并且两个分支都有一样的调用。

查看 `sub_40405F`：

![sub_40405F](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205192304536.png)

发现类似缓冲区的字样，结合前面要打印字符，合理猜测为 `printf` 函数。

# Lab 6-2

将 *Lab06-02.exe* 用 IDA 打开：

![反汇编](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205192304999.png)



结构也比较简单，一个 if 语句嵌套了一个 if 语句。查看 main 中的第一个 call 发现同样是一个查看是否联网的函数，也就是说，若返回值为 0，则程序结束。

查看绿色分支第一个 call：

![sub_401040](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205192307077.png)



访问了指定网址，请求了页面，接着往下看：

![sub_401040](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205192326166.png)

有三个分支走向失败，一个成功，查看成功的路径，发现会对请求的页面依次比较字符：

![比较字符](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205192326337.png)

`<!--` 开头的字符串是 HTML 网页的注释，也就是说，这段代码将请求的网页读到缓冲区，并依次比较，若不是指定字符串的开头，就说明获得的指令不正确，否则在注释后字符的就是正确的指令，并将其放到 al 中返回。

![打印结果](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205192326418.png)

成功返回后，就打印一串字符串，后面跟着指令，`sub_40117F` 就是 `printf` 函数，接着程序休眠 60 秒后退出。

总体分析：

程序先是查看是否联网，否则退出，然后对指定网页请求页面，若成功获得指令，则将该指令打印出来然后退出。



# Lab 6-3

将 *Lab06-03.exe* 用 IDA 打开：

![sub_401130](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205192326704.png)

可以看到和 *Lab06-02.exe* 基本相同，除了多了一个 `sub_401130` 的调用。

通过查看导入表得知，该程序多了几个注册表相关的导入函数：

![导入表](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205192328681.png)

合理猜测对注册表进行了修改，查看该调用的反汇编代码：

![sub_401130](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205192352955.png)

是一个 switch-case 结构，包含一个跳转表，也看到了确实含有对注册表的操作。其参数来自 cx，cx 来自于上一个函数返回的结果，即从请求的 URL 中获得的指令，不难猜测该函数的作用就是根据不同的指令响应不同的操作。

再看跳转表：

![跳转表](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205192352157.png)

分析后可以发现，不同指令执行的操作为：

-   `a`：创建 `C:\Temp` 目录；
-   `b`：将 `cc.exe` 复制到 `C:\Temp\`；
-   `c`：删除 `C:\Temp\cc.exe`；
-   `d`：向指定注册表中添加 `Malware` 项，将 `C:\Temp\cc.exe` 设置为开启启动，若不成功则输出失败信息；
-   `e`：休眠 100 秒；
-   `default`：输出指令不存在的信息。

# Lab 6-4

将 *Lab06-04.exe* 用 IDA 打开：

![反汇编](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205200007008.png)

可以看到和 *Lab06-03.exe* 基本相同，除了多了一个循环。同样也是先判断是否联网，然后调用 `sub_401040` 请求网页获取指令，再调用 `sub_401150` 根据不同的指令执行相应操作，然后将执行的次数加 1。

注意到在请求网页的时候，将执行次数作为了参数，并且请求的 Header 上也带上了这个参数：

![执行次数作为参数](E:\ProgData\ImgCache\image-20220519235721395.png)

不过对执行结果没有什么影响，当执行次数达到 1440 次时，即每次都会休眠 1 分钟，该程序会在 24 小时后结束。当然，由于在根据指令执行操作时，也有一个分支是休眠 100 秒，因此实际的结束时间是更长的。
