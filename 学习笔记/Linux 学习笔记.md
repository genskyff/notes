# Linux 命令学习

>   主机环境：Red Hat Enterprise Linux release 9.0

## 查看文档帮助

```bash
man man
```

| 按键            | 作用                                  |
| --------------- | ------------------------------------- |
| `空格` / `PgDn` | 下一页                                |
| `PgUp`          | 上一页                                |
| `Home` / `End`  | 首页 / 尾页                           |
| `/`/`?`         | 向下 / 上查找，如 `/linux` / `?linux` |
| `n` / `N`       | 到下 / 上一个搜索位置                 |
| `q`             | 退出                                  |

### 帮助信息结构

| 结构名称    | 含义       |
| ----------- | ---------- |
| NAME        | 名称       |
| SYNOPSIS    | 使用方法   |
| DESCRIPTION | 描述       |
| EXAMPLES    | 例子       |
| OVERVIEW    | 概述       |
| DEFAULTS    | 默认功能   |
| OPTIONS     | 可用选项   |
| ENVIRONMENT | 环境变量   |
| FILES       | 用到的文件 |
| SEE ALSO    | 相关资料   |
| HISTORY     | 维护历史   |

## 系统工作命令

### echo

输出字符串或变量值。

```bash
# echo [字符串][$变量]
echo hello
echo $SHELL
```

### date

显示或设置系统时间与日期。

```bash
# date ["+格式"]
date "+%Y-%m-%d %a %H:%M:%S"
date -s "20230101 10:30:00"
```

| 格式               | 作用                   |
| ------------------ | ---------------------- |
| `%y` / `%Y`        | 缩写 / 完整年份        |
| `%m` / `%b` / `%B` | 数字 / 缩写 / 完整月份 |
| `%d` / `%j`        | 本月 / 年第几天        |
| `%a` / `%A`        | 缩写 / 完整星期几      |
| `%I` / `%H`        | 12 / 24 小时制         |
| `%p`               | 显示 AM 或 PM          |
| `%M`               | 分钟                   |
| `%S`               | 秒                     |

### timedatectl

设置系统时间。

```bash
# timedatectl [选项]
# 显示状态信息
timedatectl status
# 自动时间同步
timedatectl set-ntp [on|off]
# 时区列表
timedatectl list-timezones
# 设置时间
timedatectl set-time "2023-01-01 10:30:00"
# 设置时区
timedatectl set-timezone Asia/Tyokyo
```

### wget

下载指定 URL 资源。

```bash
# wget [参数] [网址]
# -b 后台下载
# -P 指定目录
# -p 下载所有资源
# -t 最大尝试次数
# -c 断点续传
# -r 递归下载
wget -bc https://www.google.com
```

### ps

查看系统进程状态。

```bash
# ps [参数]
# -a 所有进程
# -u 用户和其它详细信息
# -x 没有控制终端的进程
ps -aux
```

| 进程状态 | 含义                         |
| -------- | ---------------------------- |
| `R`      | 运行                         |
| `S`      | 休眠                         |
| `D`      | 不可中断                     |
| `Z`      | 僵死，终止但进程描述符还存在 |
| `T`      | 终止                         |

| 补充状态 | 含义       |
| -------- | ---------- |
| `<`      | 高优先级   |
| `N`      | 低优先级   |
| `L`      | 被锁内存   |
| `s`      | 包含子进程 |
| `l`      | 多线程     |

```bash
$ ps -aux
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           2  0.0  0.0      0     0 ?        S    16:05   0:00 [kthreadd]
root           3  0.0  0.0      0     0 ?        I<   16:05   0:00 [rcu_gp]
root           4  0.0  0.0      0     0 ?        I<   16:05   0:00 [rcu_par_gp]
```

### pstree

以树状图显示进程关系。

```bash
pstree
```

### nice

调整进程优先级。

```bash
# nice [选项, [优先级数字]] [进程名]
# 优先级：-20 ~ 19，数字越小，优先级越高
nice -n -20 bash
```

### pidof

查询指定进程 PID。

```bash
# pidof [参数] [进程名]
pidof sshd
```

### kill

终止指定 PID 进程。

```bash
# kill [参数] [PID]
kill 1234
```

### killall

终止指定进程所对应的所有进程。

```bash
# killall [参数] [进程名]
killall httpd
```

## 系统状态检测命令

### ifconfig

查看网络接口信息。

```bash
ifconfig
```

>   在 RHEL 9 中，已被 `ip` 命令取代。
>
>   ```bash
>   # 查看网络接口信息
>   ip addr
>   # 查看详细的网络接口信息
>   ip -s link
>   # 查看路由表
>   ip route
>   ```

### ping

测试网络状态。

```bash
# ping [参数] [地址]
# -c 测试次数
ping -c 4 1.1.1.1
```

### tracepath

查看数据包路由信息。

```bash
# tracepath [参数] [地址]
# -p 指定端口
# -m 最大跳数
tracepath -p 443 -m 4 www.google.com
```

### netstat

查看网络状态相关信息。

```bash
# netstat [参数]
# -a 所有连接
# -t TCP连接
# -u UDP连接
# -i 网卡列表
# -n 使用IP地址
# -r 路由表
# -l 监听列表
# -p 进程名
netstat -anp
```

>   在 RHEL 9 中，已被 `ip` 命令取代。

### history

查看命令历史记录。

```bash
# history [参数]
# -c 清空
history -c
```

## 查找定位文件命令

### ls



### tree

### find

### locate

### whereis

### which

## 文本文件处理命令

### cat

### more

### head

### tail

### tr

### wc

### stat

### grep

### cut

### diff

### uniq

### sort

## 文件管理命令

### touch

### mkdir

### cp

### mv

### rm

### dd

### file

### tar

