> Linux 环境：Debian 12 & Arch Linux

# 软件包配置

## 更新包

### Debian

```shell
apt update && apt upgrade -y
```

### Arch

```shell
pacman -Syyu --noconfirm
```

若上面命令执行出错，则先执行下面两条命令：

```shell
pacman-key --init
pacman-key --populate
```

## 安装包

### Debian

```shell
apt install -y bat build-essential curl docker-compose docker.io duf fd-find fish git less mtr nftables openssh-client openssh-server ripgrep sd sudo unzip vim wget
```

### Arch

```shell
pacman -S --needed --noconfirm base-devel bat bottom choose curl docker docker-buildx docker-compose duf dust fastfetch fd fish fzf git git-delta helix lazygit less lsd mtr openssh ripgrep sd starship sudo tokei unzip wget zellij zoxide
```

有些包官方源没有，需要从 [AUR](https://aur.archlinux.org/) 上装。需要以非 root 用户身份安装，若没有则创建：

```shell
useradd -mG wheel <username> && passwd <username> && su - <username>
```

要从 AUR 安装包，需要安装 AUR Helper，如 [yay](https://github.com/Jguer/yay?tab=readme-ov-file#installation)、[paru](https://github.com/Morganamilo/paru?tab=readme-ov-file#installation)，这里安装 yay：

```shell
git clone https://aur.archlinux.org/yay-bin.git && cd yay-bin && makepkg -si --noconfirm && cd ..
```

然后从 AUR 安装包：

```shell
yay -S --needed --noconfirm doggo-bin git-credential-oauth lazydocker-bin mise-bin tlrc-bin usage-bin
```

若下载速度过慢，可能是源的问题。安装 reflector，然后自动选择最快的源：

```shell
yay -S --needed --noconfirm reflector
reflector --verbose --latest 5 -c <country> --sort rate --save /etc/pacman.d/mirrorlist
```
