>   Mac 环境：Apple M1 Sonoma

# 1 终端配置

## 安装 [Homebrew](https://brew.sh/)

```shell
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## 安装包

```shell
brew update && brew updateinstall bat curl fastfetch fish fzf git lsd neovim openssh ripgrep starship tmux tokei wget zoxide
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



