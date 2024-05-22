>   Mac 环境：Apple M1 Sonoma

# 1 Homebrew

## 安装

通过 [官网](https://brew.sh/) 提供的方式安装：

```shell
sh -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

# 2 iTerm2

## 安装

通过 Homebrew 安装：

```shell
brew install iterm2
```

## 配置主题

可以在 [这里](https://iterm2colorschemes.com/) 查看主题效果和下载，这里直接拉取其 [Github 仓库](https://github.com/mbadolato/iTerm2-Color-Schemes)：

```shell
git clone --depth=1 https://github.com/mbadolato/iTerm2-Color-Schemes.git
```

其中 `schemes` 为主题文件夹，包含了所有的主题方案，可以导入到 iTerm2 中。这里以 `Solarized Dark Higher Contrast` 主题为例。

![自带主题](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202304181355817.png)

导入主题配色：`iTerm2` -> `Settings` -> `Profiles` -> `Colors`，在 `Color Presets` 下拉菜单中导入 `schemes` 中的主题并选择。

![导入并选择主题](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202304181355959.png)

# 3 终端配置

## 安装 [oh-my-zsh](https://github.com/ohmyzsh/ohmyzsh?tab=readme-ov-file#basic-installation)

```shell
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

## 安装 [powerlevel10k](https://github.com/romkatv/powerlevel10k?tab=readme-ov-file#homebrew)

```shell
brew install powerlevel10k
echo "source $(brew --prefix)/share/powerlevel10k/powerlevel10k.zsh-theme" >>~/.zshrc && omz reload
```

可通过 `p10k configure` 来重新启动配置向导，最后生成的配置存放在 `~/.p10k.zsh` 中。

## zsh 增强

### [zoxide](https://github.com/ajeetdsouza/zoxide?tab=readme-ov-file#installation)

```shell
brew install zoxide
echo 'eval "$(zoxide init zsh)"' >> ~/.zshrc
```

### [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions/blob/master/INSTALL.md#homebrew)

```shell
brew install zsh-autosuggestions
echo "source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh" >> ~/.zshrc
```

### [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting/blob/master/INSTALL.md)

```shell
brew install zsh-syntax-highlighting
echo "source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" >> ~/.zshrc
```

### 使配置生效

```shell
omz reload
```

