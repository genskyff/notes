

# 1 简介

[Oh My Posh](https://ohmyposh.dev/) 是一款终端个性化工具，支持 Windows、Linux（WSL）、macOS 系统上的 PowerShell、bash、zsh 等终端，可以配置不同主题达到个性化的效果。

![M365Princess 主题](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203280547516.png)

![agnoster 主题](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203280547648.png)

![bubbles 主题](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203280547351.png)

![clean-detailed 主题](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203280547301.png)

![robbyrussel 主题](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203280547817.png)

# 2 安装

根据 [Oh My Posh 官方文档](https://ohmyposh.dev/docs/windows)，提供了不同系统上的安装方式，本文以 Windows 下安装并配置 PowerShell 为例。

## Windows Terminal

由于自带的 PowerShell 界面并不是很好用，推荐使用微软官方推出的 Windows Terminal，目前在 Windows 11 上已经自带，如果没有安装，可以去 [Microsoft Store](https://www.microsoft.com/en-us/p/windows-terminal/9n0dx20hk701) 下载，安装完成后会默认启动为 PowerShell 而不是 CMD。

![Windows Terminal](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203280546511.png)

## scoop

[scoop](https://scoop.sh/) 是 Windows 下的一款十分强大的包管理器，可以用来下载和管理各种软件包，虽然官方提供了多种安装方式，但是这里推荐使用 scoop。

依次执行命令：

```powershell
Set-ExecutionPolicy RemoteSigned -scope CurrentUser
iwr -useb get.scoop.sh | iex
```

## Oh My Posh

通过 scoop 来安装，执行命令：

```powershell
scoop install https://github.com/JanDeDobbeleer/oh-my-posh/releases/latest/download/oh-my-posh.json
```

## Meslo NF 字体

由于 Oh My Posh 基本是为 [Nerd Fonts](https://www.nerdfonts.com/) 系列字体所适配的，因此默认的字体并不能很好的显示个性化后的各种特殊字符，官方推荐使用 Meslo LGS NF 字体，在 [这里下载](https://github.com/romkatv/dotfiles-public/blob/master/.local/share/fonts/NerdFonts/MesloLGS%20NF%20Regular.ttf) 并安装。

安装完字体后需要在 Windows Terminal 中设置，打开后进入设置，在 `默认值-外观` 选项卡中设置字体，这样对所有终端都生效。

![设置字体](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202304301910766.png)

## Terminal-Icons

[Terminal-Icons](https://github.com/devblackops/Terminal-Icons) 可以在 PowerShell 中显示项目图标并以颜色区分。

![图标效果](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203280547128.png)

通过 scoop 来安装，依次执行命令：

```powershell
scoop bucket add extras
scoop install terminal-icons
```

## posh-git

[posh-git](https://github.com/dahlbyk/posh-git) 可以在 PowerShell 中显示 Git 状态的摘要信息并自动补全 Git 命令。

通过 scoop 来安装，依次执行命令：

```powershell
scoop bucket add extras
scoop install posh-git
```

## PSReadLine

[PSReadLine](https://github.com/PowerShell/PSReadLine) 可以提供命令自动补全、语法高亮等功能。

通过 Powshell 安装，依次执行命令：

```powershell
Install-Module -Name PowerShellGet -Force
Install-Module PSReadLine
```

# 3 配置 PowerShell

安装完成后启动 PowerShell 时并不会默认加载个性化后的配置，因此需要修改 PowerShell 配置文件来让每次启动都加载。

执行命令打开配置文件：

```powershell
notepad $PROFILE
```

若提示不存在文件，且提示是否创建文件，则直接创建，否则需要手动在 PowerShell 目录下创建一个配置文件再进行编辑。

若需手动创建配置文件，则依次执行命令：

```powershell
mkdir ~\Documents\WindowsPowerShell
echo "" > ~\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1
notepad $PROFILE
```

最后向配置文件中添加：

```powershell
oh-my-posh init pwsh | Invoke-Expression
Import-Module -Name Terminal-Icons
Import-Module posh-git
Import-Module PSReadLine
Set-PSReadLineOption -HistorySearchCursorMovesToEnd
Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete
```

保存后重启 Windows Terminal，即可看到个性化后的界面。

# 4 配置 VSCode

在 VSCode 中也能打开 PowerShell 终端，但是没有配置终端字体，因此需要设置 VSCode 的终端字体为 MesloLGS NF 才能正常显示。

![设置终端字体](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202304301907363.png)

![终端效果](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203280547535.png)

# 5 配置主题

完成全部安装和配置后，使用的是默认主题，如果想要切换成其它主题，可以去 [官方主题目录](https://ohmyposh.dev/docs/themes) 查看各种主题的效果，同时这些主题也被安装在 Oh My Posh 的主题目录下。

通过 scoop 安装后的主题目录为：

```
~\scoop\apps\oh-my-posh\current\themes
```

所有主题配置文件都放在这里，并以 `.omp.json` 结尾，从其它地方下载的主题配置文件也需要放在这里。

在终端中执行以下命令，就可以查看所有主题在终端中的效果：

```powershell
Get-PoshThemes ~\scoop\apps\oh-my-posh\current\themes 
```

选择一个主题的名字，如 `marcduiker`，然后编辑 PowerShell 的配置文件，执行命令：

```powershell
notepad $PROFILE
```

将其中的 `oh-my-posh init pwsh | Invoke-Expression` 加上 `--config [主题路径]` 参数：

```powershell
oh-my-posh init pwsh --config ~\scoop\apps\oh-my-posh\current\themes\marcduiker.omp.json | Invoke-Expression
```

保存后重启 Windows Terminal，即可看到更新后的个性化界面。
