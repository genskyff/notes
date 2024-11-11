>   Mac 环境：Apple M1 Sonoma

# 1 终端配置

## 安装 [Homebrew](https://brew.sh/)

```shell
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## 安装包

```shell
brew update
brew install bat bottom clang-format curl dust fastfetch fd fish fzf git-delta lazydocker lazygit lsd neovim onefetch ripgrep starship tokei wget xmake zellij zoxide
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

# 2 Shell 配置

## 配置 [fish](https://fishshell.com/)

```shell
chsh -s "$(command -v fish | sed 's/sbin/bin/')"
```

>   之后的命令都在 fish 下执行。

## 配置 [fzf](https://github.com/junegunn/fzf?tab=readme-ov-file#setting-up-shell-integration)

```shell
echo "fzf --fish | source" >> ~/.config/fish/config.fish
```

## 配置 [starship](https://starship.rs/guide/#%F0%9F%9A%80-installation)

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

