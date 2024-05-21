>   Linux 环境：Debian 12

# 1 更新并安装软件包

## 添加 Sid 源

```shell
sudo sh -c 'echo "deb http://deb.debian.org/debian sid main" >> /etc/apt/sources.list'
sudo sh -c 'echo "Package: *
Pin: release a=unstable
Pin-Priority: 100" > /etc/apt/preferences.d/sid'
```

## 更新软件包

```shell
sudo sh -c 'apt update && apt upgrade -y'
```

## 安装软件包

安装以下工具：

```shell
sudo apt install -y wget curl git ntp unzip tmux neofetch lsd bat fzf ripgrep net-tools netcat-openbsd socat libunwind8 python3 zsh autojump zsh-autosuggestions zsh-syntax-highlighting
```

以下需要从 Sid 源安装：

```shell
sudo apt install -t sid -y neovim build-essential
```

# 2 登录设置

## 用户设置

### 修改当前用户密码

```shell
passwd
```

设置一个复杂的密码，建议大小写 + 数字 + 符号混合，且最好 ≥ 16 位。

### 添加用户

若默认使用 root，则添加一个普通用户，并加入到 sudo 组：

```shell
sudo useradd -G sudo -d /home/<username> -s /bin/bash -m <username> 
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

# 3 终端配置

## 配置 Shell

### 修改默认 Shell

```shell
chsh -s $(which zsh)
```

### 安装 oh-my-zsh

```shell
sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
```

### 配置 powerlevel10k

通过 git 安装：

```shell
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

然后编辑 `~/.zshrc`：

```shell
vim ~/.zshrc
```

修改 `ZSH_THEME` 值为：

```shell
ZSH_THEME="powerlevel10k/powerlevel10k"
```

### 配置 autojump

```shell
echo ". /usr/share/autojump/autojump.sh" >> ~/.zshrc
```

### 配置 zsh-syntax-highlighting

```shell
echo "source /usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" >> ${ZDOTDIR:-$HOME}/.zshrc
```

### 配置 zsh-autosuggestions

```shell
echo "source /usr/share/zsh-autosuggestions/zsh-autosuggestions.zsh" >> ${ZDOTDIR:-$HOME}/.zshrc
```

### 配置 alias

```shell
echo "alias python=pyhon3
alias vim=nvim
alias cat=batcat
alias ls=lsd
alias ll='lsd -l'
alias la='lsd -a'
alias lla='lsd -al'
alias lt='lsd --tree --depth 1'
alias lp='lsd --classic'
alias ltp='lsd --classic --tree --depth 1'" >> ~/.zshrc
```

## 修改默认编辑器

```shell
sudo update-alternatives --config editor
```

### 安装 fnm

```shell
curl -fsSL https://fnm.vercel.app/install | bash
```

配置 neovim



# 4 安全性配置

## iptables

若没有安装则需要安装：

```shell
sudo apt install -y iptables
```

查看 iptables 配置：

```shell
iptables -L
```

### 配置 iptables

根据需求进行配置：

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

# 5 其它常用操作

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

