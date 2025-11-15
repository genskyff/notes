> Linux 环境：Debian & Arch Linux

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
apt install -y bat build-essential curl docker-buildx docker-compose docker.io du-dust duf fastfetch fd-find fish fzf git git-credential-oauth git-delta hyperfine kitty-terminfo lazygit less lsd mtr nftables openssh-client openssh-server ripgrep sd starship sudo tokei unzip vim wget zoxide
```

### Arch

```shell
pacman -S --needed --noconfirm base-devel bat binsider bottom choose curl difftastic docker docker-buildx docker-compose duf dust fastfetch fd fish fzf ghostty-terminfo git git-delta helix hyperfine kitty-terminfo lazygit less lsd mise mtr nushell openssh reflector ripgrep sd starship sudo tokei unzip usage wget zellij zoxide
```

有些包官方源没有，需要从 [AUR](https://aur.archlinux.org/) 上装。需要以非 root 用户身份安装，若没有则创建：

```shell
useradd -mG wheel <username> && passwd <username> && su - <username>
```

要从 AUR 安装包，需要安装 AUR Helper，如 [paru](https://github.com/Morganamilo/paru?tab=readme-ov-file#installation)、[yay](https://github.com/Jguer/yay?tab=readme-ov-file#installation)，这里安装 paru：

```shell
git clone https://aur.archlinux.org/paru-bin.git && cd paru-bin && makepkg -si --noconfirm && cd ..
```

然后从 AUR 安装包：

```shell
paru -S --needed --noconfirm --color doggo-bin git-credential-oauth lazydocker-bin tlrc-bin
```

若下载速度过慢，可能是源的问题。使用 reflector 自动选择最快的源：

```shell
reflector --verbose --latest 5 -c <country> --sort rate --save /etc/pacman.d/mirrorlist
```
