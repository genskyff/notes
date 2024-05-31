>   Linux 环境：Debian 12 & Arch Linux

# 1 安装软件包

## 配置 Sid 源（Debian only）

```shell
echo "deb http://deb.debian.org/debian sid main" >> /etc/apt/sources.list
echo -e "Package: *\nPin: release a=unstable\nPin-Priority: 100" > /etc/apt/preferences.d/sid
```

## 更新软件包

### Debian

```shell
apt update && apt upgrade -y
```

### Arch

```shell
pacman -Syu --noconfirm
```

## 安装软件包

### Debian

```shell
apt install -y bat build-essential curl fish fzf git htop libunwind8 lsd neofetch net-tools netcat-openbsd ntp ripgrep socat tmux unzip wget
apt install -t sid -y neovim zoxide
```

### Arch

```shell
pacman -S --needed --noconfirm base-devel bat bottom curl fastfetch fish fzf git libunwind lsd neovim net-tools ntp openbsd-netcat ripgrep socat tmux unzip wget zoxide
```

# 2 Shell 配置

## 修改默认 Shell

```shell
chsh -s /usr/bin/fish
```

>   从这之后的命令都在 [fish](https://fishshell.com/) 下执行。

## 配置 [zoxide](https://github.com/ajeetdsouza/zoxide?tab=readme-ov-file#installation)

```shell
echo "zoxide init fish | source" >> ~/.config/fish/config.fish
```

## 配置 alias

### Debian

```shell
echo 'alias cat=batcat
alias nf=neofetch
alias vim=nvim
alias ls=lsd
alias ll="lsd -l"
alias la="lsd -a"
alias lla="lsd -al"
alias lt="lsd --tree --depth 1"
alias lp="lsd --classic"
alias ltp="lsd --classic --tree --depth 1"' >> ~/.zshrc
```

### Arch

```shell
echo 'alias cat=bat
alias ff=fastfetch
alias vim=nvim
alias ls="lsd -N"
alias ll="lsd -lN"
alias la="lsd -aN"
alias lla="lsd -alN"
alias lt="lsd -N --tree --depth 1"
alias lp="lsd -N --classic"
alias ltp="lsd -N --classic --tree --depth 1"' >> ~/.zshrc
```

# 3 编辑器配置

### 修改默认编辑器

```shell
set -U EDITOR nvim
```

### 配置 [AstroNvim](https://docs.astronvim.com/)

```shell
rm -rf ~/.config/nvim ~/.local/share/nvim ~/.local/state/nvim ~/.cache/nvim
git clone --depth 1 https://github.com/AstroNvim/template ~/.config/nvim && nvim
```

