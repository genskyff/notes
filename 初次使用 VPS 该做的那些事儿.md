>   Linux 环境：Debian 12

# 1 前言

一般来说，从 IDC 购买 VPS 后，需要通过 SSH 登录来进行操作，第一次通常以 root 登录，默认端口通常为 22 ，之后建议做以下几件事。

# 2 更新及安装软件包

## 更新软件包

```shell
apt update && apt upgrade -y
```

## 安装软件包

```shell
apt install -y bat build-essential curl fzf git iptables libunwind8 lsd neofetch net-tools netcat-openbsd ntp ripgrep socat sudo tmux unzip vim virt-what wget zsh zsh-autosuggestions zsh-syntax-highlighting
```

# 3 登录设置

## 用户设置

### 修改当前用户密码

```shell
passwd
```

设置一个复杂的密码，建议大小写 + 数字 + 符号混合，且最好 ≥ 16 位。

### 添加用户

若默认使用 root，则添加一个普通用户，并加入到 sudo 组：

```shell
useradd -G sudo -d /home/<username> -s /bin/bash -m <username> 
passwd <username>
```

若要把已存在用户添加到 sudo 组：

```shell
sudo usermod -aG sudo <username>
```

使 sudo 组用户免密码使用 sudo 命令，编辑 sudo 配置文件：

```shell
sudo visudo
```

修改配置：

```shell
# 找到
%sudo   ALL=(ALL:ALL) ALL

# 替换为
%sudo   ALL=(ALL:ALL) NOPASSWD:ALL
```

### 切换用户

切换为普通用户：

```shell
su - <username>
```

切换为 root：

```shell
su -
```

## SSH 设置

编辑 SSH 配置文件：

```shell
sudo vim /etc/ssh/sshd_config
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
cat ~/.ssh/id_ed25519.pub > ~/.ssh/auth_key
```

修改 `~/.ssh` 目录和 `~/.ssh/auth_key` 文件的权限：

```shell
chmod 600 ~/.ssh/auth_key && chmod 700 ~/.ssh
```

在配置文件中找到以下几行，把前面的注释 `#` 去掉（如果有），并修改为以下参数：

```shell
# 允许公钥验证
PubkeyAuthentication yes

# 指定公钥文件
AuthorizedKeysFile ~/.ssh/auth_key

# 禁用密码登录
PasswordAuthentication no
```

之后通过 SSH 登录时，验证方式换成 Public Key，选择自己主机上的私钥文件即可。

### 重启 SSH 服务

每次修改配置后，需重启 SSH 服务：

```shell
systemctl restart ssh 
```

# 4 开启 Google BBR

BBR 具有 TCP 加速的作用，可以用来提升网络性能，一般 4.9 及以上的内核都自带了 BBR，只需开启即可。

## 修改 sysctl 配置

```shell
sudo sh -c 'echo "net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf && sysctl -p'
```

## 确认 BBR 已启用

以下三条命令执行完后，若结果中带有 `bbr` 字样就算成功启用：

```shell
sysctl net.ipv4.tcp_available_congestion_control
sysctl net.ipv4.tcp_congestion_control
lsmod | grep bbr
```

## limits & ulimit 优化

由于一般系统对资源都有限制，这里修改其数值以放宽限制来提升性能。

```shell
echo "* soft nofile 51200
* hard nofile 51200" >> /etc/security/limits.conf && ulimit -n 51200
```

# 5 安全性配置

## iptables 配置

查看 iptables 配置：

```shell
iptables -L
```

### 配置 iptables

根据需求进行配置，这里仅作参考（以下全部复制粘贴执行）：

```shell
sh -c 'echo "*filter

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

```shell
iptables-restore < /etc/iptables.rules
```

使规则开机启动：

```shell
sh -c 'echo "#!/bin/bash
/sbin/iptables-restore < /etc/iptables.rules" > /etc/network/if-pre-up.d/iptables && chmod +x /etc/network/if-pre-up.d/iptables'
```

# 6 其它常用操作

```shell
# 测试硬盘及网络性能
wget -qO- bench.sh | bash

# 查看硬盘分区及各分区使用量
fdisk -l && df -h

# 查看所有组
cat /etc/group

# 查看所有用户
cut -d: -f1 /etc/passwd
```