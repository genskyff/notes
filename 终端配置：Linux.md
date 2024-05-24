>   Linux 环境：Debian 12 & Arch Linux

# 1 安装软件包

## 配置 Sid 源（Debian only）

```shell
echo "deb http://deb.debian.org/debian sid main" >> /etc/apt/sources.list
echo "Package: *\nPin: release a=unstable\nPin-Priority: 100" > /etc/apt/preferences.d/sid
```

## 更新软件包

```shell
# Debian
apt update && apt upgrade -y

# Arch
pacman -Syu --noconfirm
```

## 安装软件包

安装以下工具：

```shell
# Debian
apt install -y bat curl fzf git libunwind8 lsd neofetch net-tools netcat-openbsd ntp ripgrep socat tmux unzip wget zsh zsh-autosuggestions zsh-syntax-highlighting
apt install -t sid -y build-essential neovim zoxide

# Arch
pacman -S --needed --noconfirm base-devel bat curl fastfetch fzf git libunwind lsd neovim net-tools ntp openbsd-netcat ripgrep socat tmux unzip wget zoxide zsh zsh-autosuggestions zsh-syntax-highlighting
```

# 2 终端配置

## 配置 Shell

### 修改默认 Shell

```shell
chsh -s $(which zsh)
```

### 安装 [oh-my-zsh](https://github.com/ohmyzsh/ohmyzsh?tab=readme-ov-file#basic-installation)

```shell
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended && zsh
```

### 配置 [powerlevel10k](https://github.com/romkatv/powerlevel10k?tab=readme-ov-file#manual)

通过 git 安装：

```shell
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

配置主题：

```shell
sed -i 's/^ZSH_THEME=".*"/ZSH_THEME="powerlevel10k\/powerlevel10k"/' ~/.zshrc
```

### 配置 [zoxide](https://github.com/ajeetdsouza/zoxide?tab=readme-ov-file#installation)

```shell
echo 'eval "$(zoxide init zsh)"' >> ~/.zshrc
```

### 配置 [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions/blob/master/INSTALL.md#packages)

```shell
# Debian
echo "source /usr/share/zsh-autosuggestions/zsh-autosuggestions.zsh" >> ${ZDOTDIR:-$HOME}/.zshrc

# Arch
echo "source /usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh" >> ${ZDOTDIR:-$HOME}/.zshrc
```

### 配置 [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting/blob/master/INSTALL.md)

```shell
# Debian
echo "source /usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" >> ${ZDOTDIR:-$HOME}/.zshrc

# Arch
echo "source /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" >> ${ZDOTDIR:-$HOME}/.zshrc
```

### 配置 alias

```shell
# Debian
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

# Arch
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

### 使配置生效

```shell
omz reload
```

# 3 编辑器配置

### 修改默认编辑器

```shell
# Debian
update-alternatives --config editor

# Arch
echo "export EDITOR=nvim" >> ~/.zshrc && omz reload
```

### 配置 [AstroNvim](https://docs.astronvim.com/)

```shell
rm -rf ~/.config/nvim ~/.local/share/nvim ~/.local/state/nvim ~/.cache/nvim
git clone --depth 1 https://github.com/AstroNvim/template ~/.config/nvim && nvim
```

