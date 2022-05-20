>   本系列文章为《恶意代码分析实战》每章的课后 Lab 实践。

# Lab 1-1

将文件 *Lab01-01.exe* 和 *Lab01-01.dll* 上传至 [VirusTotal](https://www.virustotal.com/)，可获得以下信息：

**文件：Lab01-01.exe**

![PE 信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140235994.png)

**文件：Lab01-01.dll**

![PE 信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140235471.png)

可以发现：

-   两者的创建时间几乎一致，可以确定都属于一个代码包；
-   各节区信息、导入表都较为正常，都没有被加壳的迹象；
-   EXE 文件调用了 `CopyFile`、`CreateFile`、`FindFirstFile` 等函数，可能会对文件进行创建、搜索、复制等操作；
-   DLL 文件没有导出表，不太正常，还调用了 `CreateProcess` 函数，并使用了网络功能；
-   DLL 文件调用了 `Sleep` 函数，可能会后台休眠操作。

进一步使用 [Detect It Easy](https://github.com/horsicq/DIE-engine/releases) 查看两者所包含的字符串：

![EXE 文件字符串](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140235125.png)

![DLL 文件字符串](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140235603.png)

可以发现：

-   EXE 文件含有 `kerne132.dll` 字样，可能使用该文件来混淆系统文件，可以通过查看系统是否含有该文件来判断感染迹象；
-   DLL 文件含有 IP 地址，且使用了网络功能，可能会与这个地址进行通信。

总体分析：

EXE 文件会搜索是否存在指定文件 如 `kerne132.dll`，否则就安装 DLL 文件，DLL 是真正的后门文件，会后台休眠，并定期与目标 IP 地址进行通信。

# Lab 1-2

将文件 *Lab01-02.exe* 上传，可获得以下信息：

![PE 信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140235228.png)

可以看到没有 `.text` 等节，反而出现了 `UPX` 节，且调用的函数十分少，查看字符串也并没有新的发现，可以确定文件被加壳了。

进一步使用 Exeinfo PE 分析：

![壳信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140235281.png)

可以看到使用 [UPX](https://github.com/upx/upx/releases) 加壳，可以使用 `upx -d` 来脱壳。

再次上传分析：

![脱壳后 PE 信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140235667.png)

节表正常出现了，且多了些调用的函数，如 `InternetOpenUrl`、`CreateThread` 等，并且还通过 `CreateService` 创建了服务。

进一步查看字符串：

![字符串](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140235142.png)

可以发现含有一个网址和服务名称。

总体分析：

该程序使用了 UPX 来进行加壳，并且会创建一个后台服务，访问网址，可能是一个下载器。

# Lab 1-3

将文件 *Lab01-03.exe* 上传，可获得以下信息：

![PE 信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140236031.png)

只有一个导入表，只调用了 `GetProcAddress` 和 `LoadLibrary`，加壳文件通常只有这两个导入函数，节表名也很乱，通过 Detect It Easy 查询表示这是一个被 FSG 打包的程序。

![壳信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140236373.png)

总体分析：

该文件使用了 FSG 进行打包，在没有手动脱壳的情况下，还不能进行进一步的分析。

# Lab 1-4

将文件 *Lab01-03.exe* 上传，可获得以下信息：

![PE 信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140236353.png)

![导入函数](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140236586.png)

可以发现：

-   没有加壳的痕迹；
-   `ADVAOI32.dll` 中导入的函数做了些与权限有关的操作；
-   `KERNEL32.dll` 中导入的函数，如 `FindResource`、`LoadResource` 和 `SizeofResource` 等函数，从程序的资源节中加载数据；
-   `CreateFile` 和 `WriteFile` 函数表示有写文件操作；
-   `GetWindowsDirectory` 函数表示对系统目录有操作；
-   `WinExec` 函数表示执行了程序。

进一步查看字符串：

![字符串](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140236690.png)

可以发现，该程序可能从指定的网址下载了程序，结合之前操作系统目录来看，可以通过查找 `\system32\wupdmgrd.exe` 来判断感染迹象。

目前的问题是，该文件没有调用任何与网络相关的函数，但是在 VirusTotal 的分析中，发现该文件的资源节是 Bin 类型的，也就是二进制文件，合理猜测该程序把一部分执行的代码放在了资源节中。

查看资源节的 PE 信息：

![资源节信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140236966.png)

可以看到，出现了明显是 PE 文件的文件头，可以确定资源节就是一个可执行程序。通过 Resource Hacker 打开，将资源节保存为二进制文件。

再次上传分析：

![PE 信息](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202205140236299.png)

可以看到，原程序字符串中所包含的 `URLDownloadToFile` 函数实际上是在这里调用的，并且还通过 `WinExec` 执行了程序，可能执行了下载的文件。

总体分析：

该文件没有加壳，但一些利用代码藏在了资源节里，该程序访问了某网址下载程序并执行，并且在系统目录进行了文件的创建，该文件是一种下载器。