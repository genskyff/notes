

>   PC 环境：Windows 11 x64

# 1 终端环境

## winget

Windows 10/11 已经默认安装了 [winget](https://learn.microsoft.com/zh-cn/windows/package-manager/winget/)，若没有安装或需要升级，可通过 [Microsoft Store](https://www.microsoft.com/store/productid/9NBLGGH4NNS1) 安装。

## PowerShell

Windows 10/11 默认安装了 PowerShell 5，需要将其升级到 PowerShell 7。

```powershell
# 查看 PowerShell 版本
$PSVersionTable
```

![查看 PowerShell 版本](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202310082043223.png)

要升级到 PowerShell 7，可通过 [Microsoft Store](https://www.microsoft.com/store/productid/9MZ1SNWT0N5D) 安装，或使用 winget：

```powershell
winget install --id Microsoft.Powershell --source winget
```

PowerShell 5 与 7 是共存的，安装路径、名称、可执行文件名、配置文件、模块路径等都是独立的。

5 的名称为 `Windows PowerShell`，可执行文件名为 `powershell`；7 的名称为 `PowerShell`，可执行文件名为 `pwsh`。 

```powershell
# 配置文件路径
$PROFILE | Select-Object *Host* | Format-List

# 模块路径
$Env:PSModulePath -split (';')
```

>   关于 PowerShell 5 和 7 的具体差异以及迁移指南，可参考 [从 Windows PowerShell 5.1 迁移到 PowerShell 7](https://learn.microsoft.com/zh-cn/powershell/scripting/whats-new/migrating-from-windows-powershell-51-to-powershell-7?view=powershell-7.3)。

## Windows Terminal

Windows 11 上已经默认安装了 Windows Terminal，若没有安装或需要升级，可通过 [Microsoft Store](https://www.microsoft.com/en-us/p/windows-terminal/9n0dx20hk701) 安装。

在 Windows Terminal 设置的 `启动` 选项卡中，将默认配置文件从 Windwos PowerShell 切换为 PowerShell。

![设置 PowerShell 7 为默认配置](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202310082138565.png)

# 2 终端工具

## Nerd Fonts 字体

由于很多终端主题和工具都会使用一些特殊字符，如 Oh My Posh 和 posh-git，这些特殊字符基本是为 [Nerd Fonts](https://www.nerdfonts.com/) 系列字体所适配的，因此终端默认字体并不能很好的显示，推荐使用 Meslo LGS NF 字体，在 [这里下载](https://github.com/romkatv/powerlevel10k-media/blob/master/MesloLGS%20NF%20Regular.ttf) 并安装。

安装完后需要在 Windows Terminal 中设置默认字体，在 `默认值` -> `外观` 选项卡中设置字体，这样对所有配置文件都生效。

![设置字体](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202310082203360.png)

### VSCode 字体

在 VSCode 中也能打开 PowerShell 终端，但是没有配置终端字体，因此需要设置 VSCode 的终端字体为 MesloLGS NF 才能正常显示。

![设置终端字体](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202304301907363.png)

## scoop

[scoop](https://scoop.sh/) 是 Windows 下和 winget 类似的一款十分强大的包管理器，可以用来下载和管理各种软件包，之后各种工具都会通过 winget 或  scoop 来安装。

```powershell
# 安装 scoop
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

## gsudo

[gsudo](https://gerardog.github.io/gsudo/docs/intro) 是一个类似 Linux 上 sudo 的工具，可以将命令提权执行。

```powershell
# 通过 winget 安装
winget install gerardog.gsudo

# 通过 scoop 安装
scoop install gsudo
```

## Terminal-Icons

[Terminal-Icons](https://github.com/devblackops/Terminal-Icons) 可以在 PowerShell 中显示项目图标并以颜色区分。

![图标效果](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203280547128.png)

```powershell
# 通过 scoop 安装
scoop bucket add extras
scoop install terminal-icons
```

## posh-git

[posh-git](https://github.com/dahlbyk/posh-git) 可以在 PowerShell 中显示 Git 状态的摘要信息并自动补全 Git 命令。

```powershell
# 通过 scoop 安装
scoop bucket add extras
scoop install posh-git
```

# 3 配置主题

## Oh My Posh



[Oh My Posh](https://ohmyposh.dev/) 是一款终端个性化工具，支持 Windows、Linux（WSL）、macOS 系统上的 PowerShell、bash、zsh 等终端，可以配置不同主题达到个性化的效果。

根据 [Oh My Posh 官方文档](https://ohmyposh.dev/docs/windows)，提供了不同系统上的安装方式，本文以 Windows 下安装并配置 PowerShell 为例。

通过 scoop 来安装，执行命令：

```powershell
scoop install https://github.com/JanDeDobbeleer/oh-my-posh/releases/latest/download/oh-my-posh.json
```

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

## Starship

# 3 配置 PowerShell

## PSReadLine

[PSReadLine](https://github.com/PowerShell/PSReadLine) 可以提供命令自动补全、语法高亮等功能。

通过 Powshell 安装，依次执行命令：

```powershell
Install-Module -Name PowerShellGet -Force
Install-Module PSReadLine -Force
```

安装完成后启动 PowerShell 时并不会默认加载个性化后的配置，因此需要修改 PowerShell 配置文件来让每次启动都加载。

执行命令打开配置文件：

```powershell
code $PROFILE
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
