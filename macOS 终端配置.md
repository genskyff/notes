>   PC 环境：Apple M1 Ventura

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

# 3 Oh My Zsh

## 安装

按照 [官网](https://ohmyz.sh/#install) 提供的方式安装：

```shell
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

## 配置主题

查看自带主题：

```shell
ls ~/.oh-my-zsh/themes
```

![查看自带主题](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202304181355113.png)

可以在 [这里](https://github.com/ohmyzsh/ohmyzsh/wiki/Themes) 查看所有自带主题的效果，但这里推荐一个非自带主题 [Powerlevel10k](https://github.com/romkatv/powerlevel10k)，通过 Homebrew 安装并配置：

```shell
brew install powerlevel10k
echo "source $(brew --prefix)/share/powerlevel10k/powerlevel10k.zsh-theme" >>~/.zshrc
```

然后重启 iTerm2，会自动开始 Powerlevel10k 配置向导，其中包括：

-   安装 Powerline 字体
-   确认显示是否正常
-   选择提示行风格
-   选择字符集
-   其它风格细节设定

![Powerlevel10k 配置向导](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202304181355985.png)

`p10k configure` 命令可以重新启动配置向导，最后生成的配置存放在 `~/.p10k.zsh` 中，可以编辑此文件进行调整。

## zsh 插件

### [autojump](https://github.com/wting/autojump)

增强版 `cd` 命令，可以在目录、子目录间快速跳转，以及在文件管理器中打开目录。

```shell
brew install autojump
```

### [auto-suggestion](https://github.com/zsh-users/zsh-autosuggestions/)

增强版自动补全，会根据历史记录和完成情况建议命令。

```shell
brew install zsh-autosuggestions
```

### [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting)

为 zsh 命令行提供语法高亮。

```shell
brew install zsh-syntax-highlighting
```

### 配置插件

根据安装提示需要在 `~.zshrc` 中添加行，其中 `zsh-syntax-highlighting` 必须添加在文件末尾。

使配置生效：

```shell
source ~/.zshrc
```

