

>   PC 环境：Windows 11 x64

# 1 终端环境

## winget

Windows 10 / 11 已经默认安装了 [winget](https://learn.microsoft.com/zh-cn/windows/package-manager/winget/)，若没有安装或需要升级，可通过 [Microsoft Store](https://www.microsoft.com/store/productid/9NBLGGH4NNS1) 安装。

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
$env:PSModulePath -split (';')
```

>   关于 PowerShell 5 和 7 的具体差异以及迁移指南，可参考 [从 Windows PowerShell 5.1 迁移到 PowerShell 7](https://learn.microsoft.com/zh-cn/powershell/scripting/whats-new/migrating-from-windows-powershell-51-to-powershell-7?view=powershell-7.3)。

### PSReadLine

[PSReadLine](https://github.com/PowerShell/PSReadLine) 是一个用于在 PowerShell 中改善命令行交互体验的模块，包括语法高亮、Bash / zsh 风格的智能提示和补全、历史命令搜索等功能。

PowerShell 7 附带了 PSReadLine 2.2.6，也可以手动升级：

```powershell
Install-Module PSReadLine -Force -SkipPublisherCheck -AllowPrerelease
```

>   PSReadLine 的配置选项，可参考 [PSReadLine 参考](https://learn.microsoft.com/en-us/powershell/module/psreadline/?view=powershell-7.3)。

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

## Scoop

[Scoop](https://scoop.sh/) 是 Windows 下和 winget 类似的一款十分强大的包管理器，可以用来下载和管理各种软件包，之后各种工具都会通过 winget 或  scoop 来安装。

```powershell
# 安装 scoop
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

## gsudo

[gsudo](https://gerardog.github.io/gsudo/docs/intro) 是一个类似 Linux 上 sudo 的工具，可以将命令提权执行。

```powershell
# 通过 winget 安装
winget install --id gerardog.gsudo -s winget

# 通过 scoop 安装
scoop install gsudo
```

## posh-git

[posh-git](https://github.com/dahlbyk/posh-git) 可以在 PowerShell 中显示 Git 状态的摘要信息并自动补全 Git 命令。

```powershell
# 通过 scoop 安装
scoop bucket add extras
scoop install posh-git
```

## Terminal-Icons

[Terminal-Icons](https://github.com/devblackops/Terminal-Icons) 可以在 PowerShell 中显示项目图标并以颜色区分。

![图标效果](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202203280547128.png)

```powershell
# 通过 scoop 安装
scoop bucket add extras
scoop install terminal-icons
```

# 3 个性化终端

## Oh My Posh

[Oh My Posh](https://ohmyposh.dev/docs/) 是一款终端个性化工具，可通过 [Microsoft Store](https://apps.microsoft.com/detail/XP8K0HKJFRXGCK) 安装，或使用 winget 或 scoop。

```powershell
# 通过 winget 安装
winget install --id JanDeDobbeleer.OhMyPosh -s winget

# 通过 scoop 安装
scoop install https://github.com/JanDeDobbeleer/oh-my-posh/releases/latest/download/oh-my-posh.json
```

启用主题，并可选地使用 `--config` 选项指定主题：

```powershell
oh-my-posh init pwsh --config $env:POSH_THEMES_PATH\multiverse-neon.omp.json | Invoke-Expression
```

可在 [预设主题](https://ohmyposh.dev/docs/themes) 查看所有预设主题的效果，或在启用主题后使用命令查看所有预设主题的效果。

```powershell
# 主题目录
$env:POSH_THEMES_PATH

# 查看所有预设主题效果（只有在启用主题后该命令才有效）
Get-PoshThemes
```

主题配置文件也被安装在 Oh My Posh 的主题目录下，后缀为 `.omp.json`，自定义主题配置文件也需要放在该目录。

## Starship

[Starship](https://starship.rs/guide/#%F0%9F%9A%80-installation) 也是一款终端个性化工具，特点是快速、简洁。

```powershell
# 通过 winget 安装
winget install --id Starship.Starship -s winget

# 通过 scoop 安装
scoop install starship
```

可在 [预设主题](https://starship.rs/presets/#nerd-font-symbols) 查看所有预设主题效果。要使用默认以外的主题，需从预设主题中下载配置文件，并需要重命名为 `starship.toml` 并放在 `~\.config\` 下。

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
# 启用 Oh My Posh
# oh-my-posh init pwsh --config $env:POSH_THEMES_PATH\multiverse-neon.omp.json | Invoke-Expression

# 启用 Starship
Invoke-Expression (&starship init powershell)

# 启用 PSReadLine
Import-Module PSReadLine

# 启用 posh-git
Import-Module posh-git

# 启用 Terminal-Icons
Import-Module Terminal-Icons

# 设置 ↑ 键为向前搜索历史命令
Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward

# 设置向 ↓ 键为向后搜索历史命令
Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward

# 设置 Tab 键为智能提示和补全
Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete

# 设置回溯历史命令时光标定位于行尾
Set-PSReadLineOption -HistorySearchCursorMovesToEnd

# 设置打开当前目录命令
function OpenCurrentFolder {
	param($Path = '.')
	Invoke-Item $Path
}
Set-Alias -Name open -Value OpenCurrentFolder
```

修改后需要重启 PowerShell 或用命令来使配置生效：

```powershell
. $PROFILE
```
