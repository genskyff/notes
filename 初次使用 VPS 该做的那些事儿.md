>   Linux 环境：Debian 12

# 1 前言

一般来说，从 IDC 购买 VPS 后，需要通过 SSH 登录来进行操作，第一次通常以 root 登录，默认端口通常为 22 ，之后建议做以下几件事。

# 2 软件包配置

## 配置 Sid 源

```shell
echo "deb http://deb.debian.org/debian sid main" >> /etc/apt/sources.list
echo -e "Package: *\nPin: release a=unstable\nPin-Priority: 100" > /etc/apt/preferences.d/sid
```

## 更新包

```shell
apt update && apt upgrade -y
```

## 安装包

```shell
apt install -y bat bind9-dnsutils build-essential curl fd-find fish git iptables less libunwind8 lsd net-tools netcat-openbsd openssh-client openssh-server ripgrep socat tmux traceroute unzip wget
apt install -t sid -y btm fastfetch fzf git-credential-oauth git-delta neovim zoxide
```

# 3 登录设置

## 用户设置

### 修改当前用户密码

```shell
passwd
```

设置一个复杂的密码，建议大小写 + 数字 + 符号混合，且最好 ≥ 16 位。

### 添加用户

若默认使用 root，则添加一个普通用户，并加入到 wheel 组：

```shell
useradd -mG wheel -s $SHELL <username>
passwd <username>
```

若要把已存在用户添加到 wheel 组：

```shell
usermod -aG wheel <username>
```

### 切换用户

切换为普通用户：

```shell
su - <username>
```

切换为 root：

```shell
sudo su -
```

## SSH 设置

编辑 SSH 配置文件：

```shell
vim /etc/ssh/sshd_config
```

### 修改默认 SSH 端口

找到这行，改为其它端口（1024 ~ 65535）。

```shell
Port 12345
```

### 禁用 root 登录（可选）

找到这行，并把改为 `no`：

```
PermitRootLogin no
```

之后则使用普通用户登录，再通过 `su -` 切换为 root 进行操作。 

### 使用密钥登录（可选）

若需要更好的安全性，可以使用密钥进行登录，以普通用户为例，先切换为普通用户：

```shell
su - <username>
```

生成密钥：

```shell
ssh-keygen -t ed25519
```

这时会在 `~/.ssh` 目录下生成 `id_ed25519` 和 `id_ed25519.pub` 两个文件，分别是**私钥**和**公钥**，公钥放服务器，私钥放本机。

>   推荐使用本机上 SSH 工具来生成密钥文件（如 SSH-Keygen 或 Xshell），再把公钥上传至服务器，以防止忘记下载私钥而无法 SSH。

在服务器上放置公钥：

```shell
cat ~/.ssh/id_ed25519.pub > ~/.ssh/authorized_keys
```

修改 `~/.ssh` 目录和 `~/.ssh/authorized_keys` 文件的权限：

```shell
chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh
```

在配置文件中找到以下几行，把前面的注释 `#` 去掉（如果有），并修改为以下参数：

```shell
# 允许公钥验证
PubkeyAuthentication yes

# 指定公钥文件
AuthorizedKeysFile ~/.ssh/authorized_keys

# 禁用密码登录
PasswordAuthentication no
```

之后通过 SSH 登录时，验证方式换成 Public Key，选择自己主机上的私钥文件即可。

### 重启 SSH 服务

每次修改配置后，需重启 SSH 服务：

```shell
systemctl restart sshd
```

# 4 系统优化

## 开启 BBR

[Google BBR](https://github.com/google/bbr) 拥塞控制算法具有很好的 TCP 优化作用，可以用来提升网络性能，一般 4.9 及以上的内核都自带了 BBR，只需开启即可。

### 查看可用算法

```shell
sysctl net.ipv4.tcp_available_congestion_control
```

### 查看当前使用算法

```shell
sysctl net.ipv4.tcp_congestion_control
```

>   若当前已经使用 BBR 算法，则可忽略下一步骤。

### 启用 BBR

```shell
echo "net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf && sysctl -p
```

## limits & ulimit 优化

由于一般系统对资源都有限制，这里修改其数值以放宽限制来提升性能。

```shell
echo "* soft nofile 51200
* hard nofile 51200" >> /etc/security/limits.conf && ulimit -n 51200
```

# 5 安全性配置

## iptables 配置

>   从 Debian 10 起，nftables 是使用 iptables 时的默认后端，具体可参考 [iptables - Debian Wiki](https://wiki.debian.org/iptables)。

### 查看 iptables 配置

```shell
iptables -L
```

### 配置 iptables

通常 Debian 服务器会默认内置 UFW 规则，控制更为细化。但也可以自定义配置，仅做参考：

```shell
echo "*filter

# 允许所有出
-A OUTPUT -j ACCEPT

# 允许回环地址通信
-A INPUT -i lo -j ACCEPT
-A INPUT ! -i lo -d 127.0.0.0/8 -j DROP

# 允许已建立的连接访问
-A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# 允许 HTTP 和 HTTPS
-A INPUT -p tcp --dport 80 -j ACCEPT
-A INPUT -p tcp --dport 443 -j ACCEPT

# 允许 SSH
-A INPUT -p tcp -m state --state NEW --dport 22 -j ACCEPT

# 允许被 Ping
-A INPUT -p icmp -m icmp --icmp-type 8 -j ACCEPT

# 记录拒绝的调用
-A INPUT -m limit --limit 5/min -j LOG --log-prefix \"iptables denied: \" --log-level 7

# 丢弃规则以外访问
-A INPUT -j DROP
-A FORWARD -j DROP

COMMIT" > /etc/iptables.rules
```

使规则立即生效：

```shell
iptables-restore < /etc/iptables.rules
```

使规则开机生效：

```shell
echo '#!/bin/bash
/sbin/iptables-restore < /etc/iptables.rules' > /etc/network/if-pre-up.d/iptables && chmod +x /etc/network/if-pre-up.d/iptables
```

# 6 其它常用操作

测试硬盘及网络性能：

```shell
curl -Lso- bench.sh | bash
```

查看硬盘分区及各分区使用量：

```shell
fdisk -l && df -h
```

查看所有组：

```shell
cat /etc/group
```

查看所有用户：

```shell
cut -d: -f1 /etc/passwd
```

