>   Mac 环境：Apple M1 Sonoma

# 1 终端配置

## 安装 [Homebrew](https://brew.sh/)

```shell
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## 安装包

```shell
brew update && brew install bat curl fastfetch fd fish fzf git lsd neovim openssh ripgrep starship tmux tokei wget zoxide
brew install --cask iterm2
```

## 配置 iTerm2 主题

可以在 [这里](https://iterm2colorschemes.com/) 查看主题效果和下载，这里直接拉取其 [Github 仓库](https://github.com/mbadolato/iTerm2-Color-Schemes)：

```shell
git clone --depth=1 https://github.com/mbadolato/iTerm2-Color-Schemes.git
```

其中 `schemes` 为主题文件夹，包含了所有的主题方案，可以导入到 iTerm2 中。这里以 `Solarized Dark Higher Contrast` 主题为例。

![自带主题](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202304181355817.png)

导入主题配色：`iTerm2` → `Settings` → `Profiles` → `Colors`，在 `Color Presets` 下拉菜单中导入 `schemes` 中的主题并选择。

![导入并选择主题](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202304181355959.png)

# 3 Shell 配置

## 配置 [fish](https://fishshell.com/)

```shell
echo 'if [ -x "$(command -v fish)" ]; then
    exec fish
fi' >> ~/.zshrc
```

>   之后的命令都在 fish 下执行。

## 配置 [starship](https://starship.rs/guide/#%F0%9F%9A%80-installation)

```shell
echo "starship init fish | source" >> ~/.config/fish/config.fish
```

## 配置 [zoxide](https://github.com/ajeetdsouza/zoxide?tab=readme-ov-file#installation)

```shell
echo "zoxide init fish | source" >> ~/.config/fish/config.fish
```

## 配置 alias

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
echo "function fish_reload
    source ~/.config/fish/config.fish
end" > ~/.config/fish/functions/fish_reload.fish
```

## 使配置生效

```shell
fish_reload
```

# 3 编辑器配置

## 修改默认编辑器

```shell
set -Ux EDITOR nvim
```

## 配置 [AstroNvim](https://docs.astronvim.com/)

```shell
rm -rf ~/.config/nvim ~/.local/share/nvim ~/.local/state/nvim ~/.cache/nvim
git clone --depth 1 https://github.com/AstroNvim/template ~/.config/nvim && nvim
```



