> 环境：Debian

# 1 前言

一般来说，从 IDC 购买 VPS 后，需要通过 SSH 登录来进行操作，第一次通常以 root 登录，默认端口通常为 22 ，之后建议做以下几件事。

# 2 软件包配置

## 更新包

```shell
apt update && apt upgrade -y
```

## 安装包

```shell
apt install -y bat build-essential curl docker-buildx docker-compose docker.io du-dust duf fastfetch fd-find fish fzf git git-credential-oauth git-delta hyperfine kitty-terminfo lazygit less lsd mtr nftables openssh-client openssh-server ripgrep sd starship sudo tokei unzip vim wget zoxide
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
useradd -mG sudo -s $SHELL <username>
passwd <username>
```

若要把已存在用户添加到 sudo 组：

```shell
usermod -aG sudo <username>
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

找到这行，改为其他端口（1024 ~ 65535）。

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

> 推荐使用本机上 SSH 工具来生成密钥文件（如 SSH-Keygen 或 Xshell），再把公钥上传至服务器，以防止忘记下载私钥而无法 SSH。

在服务器上放置公钥：

```shell
cat ~/.ssh/id_ed25519.pub > ~/.ssh/authorized_keys
```

修改 `~/.ssh` 目录和 `~/.ssh/authorized_keys` 文件的权限：

```shell
chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys
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

> 若当前已经使用 BBR 算法，则可忽略下一步骤。

### 启用 BBR

```shell
echo "net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.d/10-bbr.conf && sysctl -p /etc/sysctl.d/10-bbr.conf
```

## ulimit 优化

优化部分系统资源限制：

```shell
echo "* soft nofile 51200
* hard nofile 51200" >> /etc/security/limits.conf && ulimit -n 51200
```

# 5 安全性配置

## nftables 配置

### 查看 nftables 配置

```shell
nft list ruleset
```

### 配置 nftables

修改 `/etc/nftables.conf`：

```shell
#!/usr/sbin/nft -f

flush ruleset

table inet filter {
   set ct_limit_v4 {
        type ipv4_addr
        timeout 10m
    }

    set ct_limit_v6 {
        type ipv6_addr
        timeout 10m
    }

    chain input {
        type filter hook input priority filter; policy drop;

        ct state { established, related } accept

        iif lo accept
        iif != lo ip daddr 127.0.0.0/8 drop
        iif != lo ip6 daddr ::1 drop

        ct state new add @ct_limit_v4 { ip saddr limit rate over 25/second } drop
        ct state new add @ct_limit_v6 { ip6 saddr limit rate over 25/second } drop

        tcp dport { http, https } accept
        tcp dport ssh ct state new limit rate 10/minute accept

        meta nfproto ipv4 icmp type echo-request limit rate 10/second burst 4 packets accept
        meta nfproto ipv4 icmp type { echo-reply, destination-unreachable, time-exceeded, parameter-problem } accept

        meta nfproto ipv6 icmpv6 type echo-request limit rate 10/second burst 4 packets accept
        meta nfproto ipv6 icmpv6 type { destination-unreachable, packet-too-big, time-exceeded, parameter-problem, echo-reply, nd-router-solicit, nd-router-advert, nd-neighbor-solicit, nd-neighbor-advert, 148, 149 } accept

        pkttype host log prefix "[nftables] host denied: " level warn drop
    }

    chain forward {
        type filter hook forward priority filter; policy drop;

        ct state { established, related } accept

        iifname "docker0" ct state new accept
        oifname "docker0" ct state new accept
    }

    chain output {
        type filter hook output priority filter; policy accept;
    }
}
```

### 使配置生效

激活并启动服务：

```shell
systemctl enable --now nftables
```
