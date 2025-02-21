> Mac 环境：Apple M1 Sonoma

# 终端配置

## 安装 [Homebrew](https://brew.sh/)

```shell
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## 安装包

```shell
brew upgrade
brew install bat bottom choose-rust clang-format curl doggo duf dust fastfetch fd fish fzf git-delta helix lazydocker lazygit lsd mise neovim onefetch ripgrep sd starship tlrc tokei wget xmake zellij zoxide
```

## 配置 iTerm2 主题

可以在 [这里](https://iterm2colorschemes.com/) 查看主题效果。

```shell
git clone https://github.com/mbadolato/iTerm2-Color-Schemes.git
```

其中 `schemes` 为主题文件夹，包含了所有的主题方案，可以导入到 iTerm2 中。这里以 `Solarized Dark Higher Contrast` 主题为例。

导入主题配色：`iTerm2` → `Settings` → `Profiles` → `Colors`，在 `Color Presets` 下拉菜单中导入 `schemes` 中的主题并选择。

![导入并选择主题](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202304181355959.png)

## 配置 Nerd Fonts 字体

需要安装支持 [Nerd Fonts](https://www.nerdfonts.com/) 的字体，否则无法显示一些特殊字符和图标，推荐使用 [Maple Font](https://github.com/subframe7536/Maple-font/releases)。

下载安装完后，在 `iTerm2` → `Settings` → `Profiles` → `Text` 中设置字体。

<img src="https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202406011401942.png" alt="设置终端字体" style="zoom: 50%;" />
