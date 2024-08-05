>   Linux 环境：Debian 12 & Arch Linux

# 1 软件包配置

## 配置 Sid 源（仅 Debian）

在 Debian 上，有些包版本过老，需要从 Sid 源安装较新版本：

```shell
echo "deb http://deb.debian.org/debian sid main" >> /etc/apt/sources.list
echo -e "Package: *\nPin: release a=unstable\nPin-Priority: 100" > /etc/apt/preferences.d/sid
```

## 更新包

### Debian

```shell
apt update && apt upgrade -y
```

### Arch

```shell
pacman -Syu --noconfirm
```

若上面命令执行出错，则先执行下面两条命令：

```shell
pacman-key --init
pacman-key --populate
```

## 安装包

### Debian

```shell
apt install -y bat bind9-dnsutils build-essential curl fd-find fish git iptables less libunwind8 lsd net-tools netcat-openbsd openssh-client openssh-server ripgrep socat tmux traceroute unzip wget
apt install -t sid -y btm fastfetch fzf git-credential-oauth git-delta neovim zoxide
```

### Arch

```shell
pacman -S --needed --noconfirm ase-devel bat bind bottom curl dust fastfetch fd fish fzf git git-delta lazygit less libunwind lsd neovim net-tools openbsd-netcat openssh ripgrep socat starship tokei traceroute unzip wget yazi zellij zoxide
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
yay -S --needed --noconfirm git-credential-oauth ttf-maple
```

若下载速度过慢，可能是源的问题。安装 reflector，然后自动选择最快的源：

```shell
yay -S --needed --noconfirm reflector
reflector --verbose --latest 5 --sort rate --save /etc/pacman.d/mirrorlist
```

# 2 Shell 配置

## 配置 [fish](https://fishshell.com/)

```shell
chsh -s "$(command -v fish | sed 's/sbin/bin/')"
```

>   之后的命令都在 fish 下执行。

## 配置 [fzf](https://github.com/junegunn/fzf?tab=readme-ov-file#setting-up-shell-integration)（仅 Arch）

```shell
echo "fzf --fish | source" >> ~/.config/fish/config.fish
```

## 配置 [starship](https://starship.rs/guide/#%F0%9F%9A%80-installation)（仅 Arch）

```shell
echo "starship init fish | source" >> ~/.config/fish/config.fish
```

## 配置 [zoxide](https://github.com/ajeetdsouza/zoxide?tab=readme-ov-file#installation)

```shell
echo "zoxide init fish | source" >> ~/.config/fish/config.fish
```

## 配置 function

```shell
echo 'function fish_edit --description "Edit fish configuration"
    nvim ~/.config/fish/config.fish
end' > ~/.config/fish/functions/fish_edit.fish

echo 'function fish_reload --description "Reload fish configuration"
    . ~/.config/fish/config.fish
    for file in ~/.config/fish/conf.d/*.fish
        . $file
    end
end' > ~/.config/fish/functions/fish_reload.fish
```

## 使配置生效

```shell
fish_reload
```

# 3 编辑器配置

## 配置 [AstroNvim](https://docs.astronvim.com/)

要使用 AstroNvim，需要 [Neovim](https://neovim.io/) 0.9.5 以上版本：

```shell
rm -rf ~/.config/nvim ~/.local/share/nvim ~/.local/state/nvim ~/.cache/nvim
git clone https://github.com/AstroNvim/template ~/.config/nvim && nvim
```

