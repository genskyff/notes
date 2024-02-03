

>   PC 环境：Windows 11 x64

# 1 终端环境

## PowerShell

Windows 10/11 默认安装了 PowerShell 5，需要通过 [Microsoft Store](https://www.microsoft.com/store/productid/9MZ1SNWT0N5D) 升级到 PowerShell 7。

```powershell
# 查看 PowerShell 版本
$PSVersionTable
```

![查看 PowerShell 版本](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202310082043223.png)

PowerShell 5 与 7 是共存的，但安装路径、名称、可执行文件名、配置文件、模块路径等都是独立的。

5 的名称为 `Windows PowerShell`，可执行文件名为 `powershell`；7 的名称为 `PowerShell`，可执行文件名为 `pwsh`。 

```powershell
# 查看配置文件路径
$PROFILE | Select-Object *Host* | Format-List

# 查看模块路径
$env:PSModulePath -split (';')
```

>   关于 PowerShell 5 和 7 的具体差异以及迁移指南，可参考 [从 Windows PowerShell 5.1 迁移到 PowerShell 7](https://learn.microsoft.com/zh-cn/powershell/scripting/whats-new/migrating-from-windows-powershell-51-to-powershell-7?view=powershell-7.3)。

### PSReadLine

[PSReadLine](https://github.com/PowerShell/PSReadLine) 是一个用于在 PowerShell 中改善命令行交互体验的模块，包括语法高亮、Bash / zsh 风格的智能提示和补全、历史命令搜索等功能。

PowerShell 7 附带了 PSReadLine 2.2.6，也可以手动升级：

```powershell
# 查看版本
Get-Module PSReadLine | Select-Object Name, Version

# 手动升级
Install-Module PSReadLine -Force -SkipPublisherCheck -AllowPrerelease
```

>   关于 PSReadLine 的配置选项，可参考 [PSReadLine Reference](https://learn.microsoft.com/en-us/powershell/module/psreadline/?view=powershell-7.3)。

## Windows Terminal

Windows 11 上已经默认安装了 Windows Terminal，若没有安装或需要升级，可通过 [Microsoft Store](https://www.microsoft.com/en-us/p/windows-terminal/9n0dx20hk701) 安装。

在 Windows Terminal 设置的 `启动` 选项卡中，将默认配置文件从 Windwos PowerShell 切换为 PowerShell。

![设置 PowerShell 7 为默认配置](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202310082138565.png)

# 2 字体配置

## Nerd Fonts

由于很多终端主题和工具都会使用一些特殊字符，如 Oh My Posh 和 posh-git，这些特殊字符基本是为 [Nerd Fonts](https://www.nerdfonts.com/) 系列字体所适配的，因此终端默认字体并不能很好的显示，推荐使用 Meslo LGS NF 字体，在 [这里下载](https://github.com/romkatv/powerlevel10k-media/blob/master/MesloLGS%20NF%20Regular.ttf) 并安装。

安装完后需要在 Windows Terminal 中设置默认字体，在 `默认值` -> `外观` 选项卡中设置字体，这样对所有配置文件都生效。

![设置字体](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202310082203360.png)

### VSCode 字体

在 VSCode 中也能打开 PowerShell 终端，但是没有配置终端字体，因此需要设置 VSCode 的终端字体为 MesloLGS NF 才能正常显示。

![设置终端字体](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202304301907363.png)

# 3 终端工具

## Scoop

[Scoop](https://scoop.sh/) 是 Windows 下的一款十分强大的包管理器，可以用来下载和管理各种软件包，之后各种工具都会通过 Scoop 来安装。

```powershell
# 安装
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

## 实用工具

-   [Starship](https://starship.rs/guide/#%F0%9F%9A%80-installation)：个性化终端。要使用默认以外的主题，需从可在 [预设主题](https://starship.rs/presets/#nerd-font-symbols) 下载配置文件，并重命名为 `starship.toml` 后放在 `~\.config\`；
-   [gsudo](https://gerardog.github.io/gsudo/docs/install)：Windows 版 `sudo`；
-   [posh-git](https://github.com/dahlbyk/posh-git?tab=readme-ov-file#installation)：在 PowerShell 中显示 Git 状态并自动补全 Git 命令；
-   [LSD](https://github.com/lsd-rs/lsd?tab=readme-ov-file#installation)：增强版 `ls`；
-   [BAT](https://github.com/sharkdp/bat?tab=readme-ov-file#installation)：增强版 `cat`；
-   [Neovim](https://github.com/neovim/neovim?tab=readme-ov-file#install-from-package)：增强版 `vim`；
-   [ripgrep](https://github.com/BurntSushi/ripgrep?tab=readme-ov-file#installation)：增强版 `grep`；
-   [cloc](https://github.com/AlDanial/cloc?tab=readme-ov-file#install-via-package-manager)：统计代码行数；
-   [Neofetch](https://github.com/dylanaraps/neofetch/wiki/Installation)：美化显示操作系统和软硬件信息。

```powershell
scoop bucket add extras
scoop update
scoop install starship gsudo posh-git lsd bat neovim ripgrep cloc neofetch
```

# 4 配置 PowerShell

为了使 PowerShell、PSReadLine、posh-git 等安装的模块或自定义的配置在每次启动时都生效，需要编辑 PowerShell 配置文件。

打开并编辑 PowerShell 配置文件：

```powershell
# 记事本打开
notepad $PROFILE

# VSCode 打开
code $PROFILE
```

然后在其中添加：

```powershell
Invoke-Expression (&starship init powershell)

Import-Module PSReadLine
Import-Module gsudoModule
Import-Module posh-git

Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward
Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete
Set-PSReadLineKeyHandler -key Enter -Function ValidateAndAcceptLine
Set-PSReadLineOption -HistorySearchCursorMovesToEnd

Function OpenCurrentFolder {
	param($Path = '.')
	Invoke-Item $Path
}

Function LsTree {
	$params = @('--tree', '--depth', '1') + $args
    lsd @params
}

Function LsPure {
	$params = @('--icon', 'never', '--icon', 'never') + $args
    lsd @params
}

Function LsTreePure {
	$params = @('--tree', '--depth', '1', '--icon', 'never', '--icon', 'never') + $args
    lsd @params
}

Set-Alias -Name open -Value OpenCurrentFolder
Set-Alias -Name sudo -Value gsudo
Set-Alias -Name ls -Value lsd
Set-Alias -Name lt -Value LsTree
Set-Alias -Name lp -Value LsPure
Set-Alias -Name ltp -Value LsTreePure
Set-Alias -Name cat -Value bat
Set-Alias -Name vim -Value nvim
```

使配置生效：

```powershell
. $PROFILE
```
