# Lab 3-1

将文件 _Lab03-01.exe_ 上传至 VirusTotal，可获得以下信息：

![PE 信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205162242110.png)

导入函数过少，基本可以确定加过壳，进一步查看信息：

![打包信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205162242987.png)

用汇编写的程序，再查看字符串：

![字符串](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205162242679.png)

虽然大概率加壳，但是字符串没有混淆，发现一些系统 DLL 名称，以及网址和注册表信息。合理猜测该程序会访问网址，下载程序，查找 AppData 目录，复制恶意程序，并把加入到开机启动项中。

打开 Process Explorer、Process Monitor 和 ApateDNS，将 DNS 解析设置为本机，并使用 `netcat` 监听本地 80 和 443 端口。

运行程序后，在 Process Explorer 中查看进程，查看 Handles，可以看到创建了一个 `WinVMX32` 的互斥量，再查看装载的 DLL，发现加载了 `ws2_32.dll` 和 `wshtcpip.dll`。

然后在 Process Monitor 中查看操作，只查看修改的操作，设置过滤项为 `WriteFile` 和 `RegSetValue`。

列表中的 `..\Cryptography\RNG\Seed` 为噪声，因为随机数发生器的种子会一直变化。

发现恶意代码将自己复制了一份到 `C:\Windows\System32\vmx32to64.exe`，并且还将其写入到了开机启动项中，可以当作感染特征，此外还发现对字符串中的网址进行了访问。

# Lab 3-2

将文件 _Lab03-02.dll_ 上传至 VirusTotal，可获得以下信息：

![PE 信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205162241619.png)

该 DLL 导出了几个函数，并且会安装服务。

查看导入表：

![导入表](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205162241652.png)

发现许多与服务、HTTP 请求，注册表相关的导入函数。

再查看字符串：

![字符串](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205162241315.png)

![字符串](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205162241369.png)

看到了一些独特的字符串，如 URL、路径、网页、编码、名称等。

需要知道该程序到底安装了什么服务，在手动安装之前先使用 Regshot 备份注册表。

使用 `rundll32` 来安装服务：

```shell
rundll32.exe Lab03-02.dll,installA
```

然后对比前后注册表的差异，发现安装了名为 `IPRIP` 的服务，由于 DLL 文件需要一个 EXE 文件来执行，还看到了设置 ImagePath 为 `svchost.exe`，表示恶意代码会在此进程启动，其 `DisplayName` 为 `INA+`，可以根据此特征来识别恶意服务。

使用 ApateDNS 将 DNS 解析重定向到本机，使用 `netcat` 来监听本机 80 端口：

```shell
nc -l -p 80
```

然后启动服务：

```shell
net start IPRIP
```

在 Process Explorer 中搜索 DLL，可以看到 `svchost.exe` 装载了该 DLL。

还发现其向一个网址发起了请求，查看 `netcat` 的结果，可以发现其 GET 了一个 `/serve.html`，可以将该网址和 GET 请求当作网络特征。

# Lab 3-3

查看 VirusTotal 的报告：

![PE 信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205162241535.png)

初步判断没有加壳，再查看字符串：

![字符串](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205162241837.png)

没有太多有用的信息，运行程序，使用 Process Explorer 和 Process Monitor 来监控。

运行后就自动关闭了，但是其创建了一个子进程 `svchost.exe`，查看该子进程，发现其字符串的文件镜像和内存镜像不同，内存镜像包含了 `practicalmalwareanalysis.log` 的字样，可以认为该程序使用了进程替换技术。在结合内存镜像中的 `[ENTER]`、`[CAPS LOCK]` 字样，合理猜测是一个使用了进程替换技术的键盘记录器，其记录结果保存在 `practicalmalwareanalysis.log` 中。

# Lab 3-4

查看 VirusTotal 的报告：

![PE 信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205162241853.png)

未加壳，再查看字符串：

![字符串](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205162241565.png)

可以看到有网址、网络请求、注册表路径等字样，图中标注的字符串也很像命令行参数。

直接运行发现程序直接关闭且把自身删除，尝试输入参数后依然如此，打开 Process Monitor 查看到底做了哪些操作。

查看注册表和文件操作，发现并没有类似 `WriteFile` 和 `RegSetValue` 这种修改的操作，查看进程活动，发现其创建了一个 `cmd.exe` 子进程。

![子进程](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205162241850.png)

查看命令行后发现其使用 `cmd` 执行了删除操作：

![删除操作](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205162241027.png)
