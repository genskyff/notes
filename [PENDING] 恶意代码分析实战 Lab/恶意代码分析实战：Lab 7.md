# Lab 7-1

将 _Lab07_01.exe_ 用 IDA 打开，先查看 Imports：

![Imports](E:\ProgData\ImgCache\image-20220520225145563.png)

可以看到，有请求网址、创建服务、创建互斥量等操作。

再看 main 处的反汇编：

![main](E:\ProgData\ImgCache\image-20220520225301930.png)

main 中只有两个调用，第一个是 `StartServiceCtrlDispatcher`，它的作用就是将服务进程的主线程连接到服务控制管理器，使该线程成为调用进程的服务控制调度线程，即当服务控制管理器启动一个服务进程时，它会等待该进程调用该函数。

再看第二个 `sub_401040`：

![sub_401040](E:\ProgData\ImgCache\image-20220520225621164.png)

打开了一个互斥量，如果存在，则程序退出，否则创建一个互斥量，保证了同一时刻只有一个进程。可以将名为 `HGL345` 的互斥量作为感染特征。

`OpenSCManager` 打开了一个服务控制管理器的句柄，使该程序能够修改服务，然后获得当前运行程序的路径，该路径被用来创建一个服务，服务名为 `Malservice`，这也可以作为感染特征。

![创建服务](E:\ProgData\ImgCache\image-20220520230132774.png)

通过 `CreateService` 的参数 `dwStartType` 可知，`0x02` 表示为开机自启动。

然后接下来有许多和时间有关的函数，IDA 标记了叫做 `SystemTime` 的结构体，其成员表示了更精确的时间。所有的值都来自于 edx，而 edx 被设置为 0。然后在调用 `SystemTimeToFileTime` 前将 `SystemTime.wYear` 设置为 2100。

接下来调用一系列时间相关函数，其中 `SetWaitableTimer` 的参数 `lpDueTime` 来自于 `FileTime`，也就是 2100，随后使用 `WaitForSingleObject` 进入等待，也就是等到 2100 年。

接着程序创建 20 个线程：

![创建线程](E:\ProgData\ImgCache\image-20220520231321058.png)

对于 `CreateThread` 只需要关注 `lpStartAddress` 这个参数，表示线程的起始地址。

进入 `StartAddress`：

![StartAddress](E:\ProgData\ImgCache\image-20220520231444524.png)

可以看到对一个指定的网址有访问，由于开启了 20 个线程，这个程序在时间点达到 2100 年时，会发起 20 个线程对网址访问，而且由于访问是无限循环，因此可以判断，该程序是一个 DDoS 程序。

总体分析：

该程序首先会检查是否已经存在，否则就创建互斥量，然后添加自己为自启动服务，然后一直等待时间到达 2100 年对指定 URL 发起 DDoS 攻击。

需要注意的是，该程序没有包含服务的停止、暂停的功能，这个通常的服务不同，它的服务状态永远是 `START_PENDING`，也无法在运行时手动停止。

> 可以通过 `sc delete Malservice` 来删除该服务。

# Lab 7-2

将 _Lab07_02.exe_ 用 IDA 打开，先查看 Imports：

![Imports](E:\ProgData\ImgCache\image-20220520232246866.png)

可以看到很多与 COM 组件相关的函数。

直接运行程序，发现弹出了一个网页，网址是 `http://www.malwareanalysisbook.com/ad.html`，合理猜测为打开一个广告页面。

进一步查看反汇编：

![main](E:\ProgData\ImgCache\image-20220520234550095.png)

为了使用 COM 功能，必须获得一个 COM 对象，`OleInitialize` 和 `CoCreateInstance` 是必须使用的，其中 `CoCreateInstance` 的参数 `ppv` 保存了对象的地址，该地址是一个接口指针，指向包含函数指针的结构体，而要使用的功能保存在 `riid` 和 `rclsid` 中。

查询文档可知，`iid` 为接口标识符，`clsid` 为类型标识符，当程序调用该函数时，操作系统会使用标识符在注册表中查询讯息，来判断哪个文件存储了这个 COM 信息。而该程序的 `iid` 表示 `IWebBrowser2` 接口，而 `clsid` 则表示 `Internet Explorer`，而 `iexplorer.exe` 被保存在 `LocalServer32` 的子健中，代表了该函数被调用是要加载的可执行文件。

当该函数返回时，对 COM 对象的调用位于 `ppv` 中的结构体，该结构体是一个函数指针表，通过结构体偏移来调用实际的函数。IDA 自带了许多 COM 的结构体信息，因此可以在 `Structures` 窗口中 Insert 一个结构体，选择自带的保准结构体，搜索 `IWebBroswer2Vtb1`，然后在反汇编中重命名偏移即可。

![重命名结构体成员](E:\ProgData\ImgCache\image-20220521000432808.png)

可以看到，最后的调用是 `Navigate`，该函数被调用时，会访问指定的网址，然后结束程序。因此该程序没有持久化，只运行一次就退出。

# Lab 7-3
