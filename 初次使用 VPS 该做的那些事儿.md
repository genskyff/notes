# 1 前言

一般来说，从 IDC 购买 VPS 后，需要通过 SSH 登录来进行操作，第一次通常以 root 登录，默认端口通常为 22 ，之后建议做以下几件事，本文以 Debian 为例。

# 2 更新及安装软件包

## 更新软件包

更新包列表和已安装包，由于内核也更新了，所以更新完需要重启：

```bash
apt update && apt -y full-upgrade && shutdown -r now
```

## 安装基本软件包

- 文本编辑器 `vim`
- 下载工具 `wget`、`curl`
- 分布式版本控制系统 `git`
- 时间同步服务 `ntp`
- 解压缩工具 `unzip`
- 窗口管理工具 `screen`
- 进程监控与管理工具 `htop`
- 网络工具 `net-tools`、`socat`、`netcat`
- 编译工具 `build-essential`
- 编程接口 `libunwind8`
- 虚拟技术查询工具 `virt-what`


执行以下命令全部安装：

```bash
apt -y install vim wget curl git ntp unzip screen htop net-tools socat netcat build-essential libunwind8 virt-what
```

# 3 登录设置

## 用户设置

### 更改当前用户密码

```bash
passwd
```

设置一个复杂的密码，建议大小写 + 数字 + 符号混合，且最好 ≥ 16 位。

### 添加用户

由于 root 拥有全部权限，且默认使用 root 有安全隐患，所以需要添加一个普通用户，并加入到 sudo 组：

```bash
useradd -G sudo -d /home/admin -s /bin/bash -m admin && passwd admin
```

使 sudo 组用户免密码使用 sudo 命令，编辑 sudo 配置文件：

```bash
visudo
```

找到：

```
%sudo   ALL=(ALL:ALL) ALL
```

替换为：

```
%sudo   ALL=(ALL:ALL) NOPASSWD:ALL
```

### 切换用户

切换为普通用户：

```bash
su - admin
```

切换为 root：

```bash
su -
```

## SSH 设置

编辑 SSH 配置文件：

```bash
vim /etc/ssh/sshd_config
```

### 修改默认 SSH 端口

一般默认端口为 `22`，找到这一行，把前面的注释 `#` 去掉（如果有），再把端口号改为其它的（1024 ~ 65535）。

```
Port 22 # 改为其它端口
```

### 禁用 root 登录（可选）

找到这一行，并把参数改为 `no`：

```
PermitRootLogin no
```

之后则使用普通用户登录，再通过 `su -` 切换为 root 进行操作。 

### 使用密钥登录（可选）

若需要更好的安全性，可以使用密钥进行登录，以普通用户为例，先切换为普通用户：

```bash
su - admin
```

生成密钥：

```bash
ssh-keygen -t rsa
```

这时会在 `~/.ssh` 目录下生成 `id_rsa` 和 `id_rsa.pub` 两个文件，分别是**私钥**和**公钥**，公钥是放在服务器上的，私钥是放在自己主机上的，私钥需要通过 FTP 等方式下载到自己的主机上，**推荐使用自己主机上的 SSH 工具来生成密钥文件（如 Xshell），再把公钥上传至服务器，以防止忘记下载私钥而无法 SSH 的尴尬局面**。

在服务器上安装公钥：

```bash
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
```

修改 `~/.ssh` 目录和 `~/.ssh/authorized_keys` 文件的权限：

```bash
chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh
```

在配置文件中找到以下几行，把前面的注释 `#` 去掉（如果有），并修改为以下参数：

```
# 允许公钥验证
PubkeyAuthentication yes

# 指定公钥文件
AuthorizedKeysFile .ssh/authorized_keys

# 禁用密码登录
PasswordAuthentication no
```

之后通过 SSH 登录时，验证方式换成 Public Key，选择自己主机上的私钥文件即可。

### 重启 SSH 服务

每次修改配置后，需重启 SSH 服务：

```bash
service ssh restart
```

# 4 开启 Google BBR

BBR 具有 TCP 加速的作用，可以用来提升网络性能，一般 4.9 及以上的内核都自带了 BBR，只需开启即可。

## 修改 sysctl 配置

```bash
bash -c 'echo "fs.file-max = 51200
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.core.netdev_max_backlog = 250000
net.core.somaxconn = 4096
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_tw_recycle = 0
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.ip_local_port_range = 10000 65000
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_max_tw_buckets = 5000
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_mem = 25600 51200 102400
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864
net.ipv4.tcp_mtu_probing = 1
net.ipv4.tcp_congestion_control = hybla" >> /etc/sysctl.conf && sysctl -p'
```

## 确认 BBR 已启用

以下三条命令执行完后，若结果中带有 `bbr` 字样就算成功启用：

```bash
sysctl net.ipv4.tcp_available_congestion_control
sysctl -n net.ipv4.tcp_congestion_control
lsmod | grep bbr
```

## limits & ulimit 优化

由于一般系统对资源都有限制，这里修改其数值以放宽限制来提升性能。

```bash
echo "* soft nofile 51200
* hard nofile 51200" >> /etc/security/limits.conf && ulimit -n 51200
```

# 5 安全性配置

## iptables 配置

查看 iptables 配置：

```bash
iptables -L
```

### 配置 iptables

根据需求进行配置，这里仅作参考（以下全部复制粘贴执行）：

```bash
bash -c 'echo "*filter

# 允许所有出
-A OUTPUT -j ACCEPT

# 允许本地回环地址通信
-A INPUT -i lo -j ACCEPT

# 允许已建立的连接访问
-A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# 允许被Ping
-A INPUT -p icmp -m icmp --icmp-type 8 -j ACCEPT

# 允许SSH访问
-A INPUT -p tcp --dport 22 -j ACCEPT

# 允许HTTP和HTTPS访问
-A INPUT -p tcp --dport 80 -j ACCEPT
-A INPUT -p tcp --dport 443 -j ACCEPT

# 丢弃规则以外访问
-A INPUT -j DROP
-A FORWARD -j DROP

# 记录iptables拒绝的调用
-A INPUT -m limit --limit 5/min -j LOG --log-prefix \"iptables denied: \" --log-level 7

COMMIT" > /etc/iptables.rules'
```

使规则立即生效：

```bash
iptables-restore < /etc/iptables.rules
```

使规则开机启动：

```bash
bash -c 'echo "#!/bin/bash
/sbin/iptables-restore < /etc/iptables.rules" > /etc/network/if-pre-up.d/iptables && chmod +x /etc/network/if-pre-up.d/iptables'
```

# 6 其它常用操作

## 使用脚本查看系统的总体信息、硬盘及网络性能

```bash
wget -qO- bench.sh | bash
```

## 查看与管理系统进程

```bash
htop
```

## 查看 VPS 使用的虚拟技术

```bash
virt-what
```

## 查看系统信息及版本

```bash
uname -a && lsb_release -a
```

## 查看硬盘分区及各分区使用量

```bash
fdisk -l && df -h
```

## 查看已建立的连接

```bash
netstat -antp
```

## 查看所有组

```bash
cat /etc/group
```

## 查看所有用户

```bash
cut -d: -f1 /etc/passwd
```

