>   Linux 环境：Debian 12 & Arch Linux

# 1 软件包配置

## 配置 Sid 源（仅 Debian）

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
pacman-key --populate archlinux
```

## 安装包

### Debian

```shell
apt install -y bat build-essential curl fd-find fish git htop libunwind8 lsd neofetch net-tools netcat-openbsd ntp openssh-client openssh-server ripgrep socat tmux unzip wget
apt install -t sid -y fzf neovim zoxide
```

### Arch

```shell
pacman -S --needed --noconfirm base-devel bat bottom curl fastfetch fd fish fzf git git-delta libunwind lsd neovim net-tools ntp openbsd-netcat openssh ripgrep socat starship tmux tokei unzip wget zoxide
```

安装 yay：

```shell
useradd -mG wheel <username> && passwd <username> && su - <username>
git clone https://aur.archlinux.org/yay-bin.git && cd yay-bin && makepkg -si --noconfirm
yay -S --noconfirm ttf-maple
```

# 2 Shell 配置

## 配置 [fish](https://fishshell.com/)

```shell
echo '[[ -x "$(command -v fish)" ]] && exec fish' >> ~/.bashrc && fish
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

## 配置 alias

### Debian

```shell
echo 'alias cat=batcat
alias fd=fdfind
alias nf=neofetch
alias vi=nvim
alias vim=nvim
alias ls=lsd
alias ll="ls -l"
alias la="ls -a"
alias lla="ll -a"
alias lt="ls --tree --depth 1"
alias lp="ls --classic"
alias ltp="lp --tree --depth 1"' >> ~/.config/fish/config.fish
```

### Arch

```shell
echo 'alias cat=bat
alias ff=fastfetch
alias vi=nvim
alias vim=nvim
alias ls="lsd -N"
alias ll="ls -l"
alias la="ls -a"
alias lla="ll -a"
alias lt="ls --tree --depth 1"
alias lp="ls --classic"
alias ltp="lp --tree --depth 1"' >> ~/.config/fish/config.fish
```

## 配置 function

```shell
echo "function fish_edit
    nvim ~/.config/fish/config.fish
end" > ~/.config/fish/functions/fish_edit.fish

echo "function fish_reload
    source ~/.config/fish/config.fish
end" > ~/.config/fish/functions/fish_reload.fish
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
git clone --depth 1 https://github.com/AstroNvim/template ~/.config/nvim && nvim
```

