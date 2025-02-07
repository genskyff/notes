>    PC 环境：Windows 11 x64

# 1 终端配置

## PowerShell

Windows 10/11 默认安装了 PowerShell 5，需要通过 [Microsoft Store](https://www.microsoft.com/store/productid/9MZ1SNWT0N5D) 升级到 PowerShell 7 以上版本。

查看 PowerShell 版本：

```powershell
$PSVersionTable
```

PowerShell 5 与 7 是共存的，但安装路径、名称、可执行文件名、配置文件、模块路径等都是独立的。

5 的名称为 `Windows PowerShell`，可执行文件名为 `powershell`。7+ 的名称为 `PowerShell`，可执行文件名为 `pwsh`。 

查看配置文件路径：

```powershell
$PROFILE | Select-Object *Host* | Format-List
```
查看模块路径：

```powershell
$env:PSModulePath -split (';')
```

>   关于 PowerShell 5 和 7 的具体差异以及迁移指南，可参考 [从 Windows PowerShell 5.1 迁移到 PowerShell 7](https://learn.microsoft.com/zh-cn/powershell/scripting/whats-new/migrating-from-windows-powershell-51-to-powershell-7?view=powershell-7.3)。

### PSReadLine

[PSReadLine](https://github.com/PowerShell/PSReadLine) 是一个用于在 PowerShell 中改善命令行交互体验的模块，包括语法高亮、Bash / zsh 风格的智能提示和补全、历史命令搜索等功能，在 PowerShell 7+ 已经附带。

查看版本：

```powershell
Get-Module PSReadLine | Select-Object Name, Version
```

>   关于 PSReadLine 的配置选项，可参考 [PSReadLine Reference](https://learn.microsoft.com/en-us/powershell/module/psreadline/?view=powershell-7.3)。

## Windows Terminal

Windows 11 上已经默认安装了 Windows Terminal，若没有安装或需要升级，可通过 [Microsoft Store](https://www.microsoft.com/en-us/p/windows-terminal/9n0dx20hk701) 安装。

在 Windows Terminal 设置的 `启动` 中，将默认配置文件从 Windwos PowerShell 切换为 PowerShell。

![设置 PowerShell 为默认配置](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202406011430220.png)

# 2 字体配置

## 配置 Nerd Fonts 字体

由于很多终端主题和工具都会使用一些特殊字符和图标，这些特殊字符基本是为 [Nerd Fonts](https://www.nerdfonts.com/) 系列字体所适配的，因此系统默认字体通常并不能很好的显示，推荐使用 [Maple Font](https://github.com/subframe7536/Maple-font/releases)。

下载安装完后需要在 Windows Terminal 的 `设置` → `默认值` → `外观` 中设置字体。

![设置终端字体](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202406011431708.png)

## 配置 VSCode 字体

在 VSCode 中也能打开 PowerShell 终端，但没有配置终端字体，需要设置 VSCode 的终端字体也为 Maple Mono NF CN 才能正常显示。

![设置 VSCode 终端字体](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202406011321094.png)

# 3 软件包配置

## 安装 [Scoop](https://scoop.sh/)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

## 安装包

```powershell
scoop bucket add extras
scoop update
scoop install 7zip bat delta fastfetch fzf git gsudo lazydocker lazygit less llvm lsd mingw-winlibs-ucrt mise nilesoft-shell onefetch pandoc ripgrep starship tlrc tokei wireshark xmake zoxide
```

# 4 配置 PowerShell

为了使 PowerShell、PSReadLine 等安装的模块或自定义的配置在每次启动时都生效，需要编辑 PowerShell 配置文件。

打开并编辑 PowerShell 配置文件：

```powershell
code $profile
```

然后在其中添加：

```powershell
mise activate pwsh | Out-String | Invoke-Expression
starship init powershell | Out-String | Invoke-Expression
zoxide init powershell | Out-String | Invoke-Expression

Import-Module gsudoModule -Force
Import-Module PSReadLine -Force

Set-PSReadLineOption -HistorySearchCursorMovesToEnd

Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward
Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete
Set-PSReadLineKeyHandler -key Enter -Function ValidateAndAcceptLine

Set-PSReadLineKeyHandler -Chord Ctrl+p -Function PreviousHistory
Set-PSReadLineKeyHandler -Chord Ctrl+n -Function NextHistory

Set-PSReadLineKeyHandler -Chord Ctrl+f -Function ForwardChar
Set-PSReadLineKeyHandler -Chord Ctrl+b -Function BackwardChar
Set-PSReadLineKeyHandler -Chord Alt+f -Function ForwardWord
Set-PSReadLineKeyHandler -Chord Alt+b -Function BackwardWord
Set-PSReadLineKeyHandler -Chord Ctrl+a -Function BeginningOfLine
Set-PSReadLineKeyHandler -Chord Ctrl+e -Function EndOfLine

Set-PSReadLineKeyHandler -Chord Ctrl+d -Function DeleteChar
Set-PSReadLineKeyHandler -Chord Ctrl+h -Function BackwardDeleteChar
Set-PSReadLineKeyHandler -Chord Alt+d -Function DeleteWord
Set-PSReadLineKeyHandler -Chord Alt+w -Function BackwardDeleteWord
Set-PSReadLineKeyHandler -Chord Ctrl+k -Function ForwardDeleteLine
Set-PSReadLineKeyHandler -Chord Ctrl+u -Function BackwardDeleteLine

if (Get-Command less -ErrorAction SilentlyContinue) {
    $env:LESS = "-iRF"
}

if (Get-Command fzf -ErrorAction SilentlyContinue) {
    $env:FZF_DEFAULT_OPTS = "--cycle --ansi --height 60% --highlight-line --reverse --info inline --border --no-separator
                            --preview-window 'hidden,border-left,60%'
                            --bind 'alt-/:change-preview-window(90%|60%)'
                            --bind 'alt-,:toggle-wrap'
                            --bind 'alt-.:toggle-preview-wrap'
                            --bind 'ctrl-/:toggle-preview'
                            --bind 'alt-f:preview-page-down,alt-b:preview-page-up'"
}

function Open-Folder {
    param($Path = ".")
    Invoke-Item $Path
}

function Which-Command {
    param($Command)
    (Get-Command $Command).Path
}

function Lsd-Invoke {
    $params = @("-N") + $args
    lsd @params
}

function Ls-Long {
    $params = @("-l") + $args
    Lsd-Invoke @params
}

function Ls-All {
    $params = @("-A") + $args
    Lsd-Invoke @params
}

function Ls-Long-All {
    $params = @("-lA") + $args
    Lsd-Invoke @params
}

function Ls-Tree {
    $params = @("--tree", "--depth", "1") + $args
    Lsd-Invoke @params
}

function Ls-Pure {
    $params = @("--classic") + $args
    Lsd-Invoke @params
}

function Ls-Tree-Pure {
    $params = @("--classic") + $args
    Ls-Tree @params
}

function Git-Switch {
    $params = @("switch") + $args
    git @params
}

function Git-Status {
    $params = @("status") + $args
    git @params
}

function Git-Diff {
    $params = @("diff", "-w") + $args
    git @params
}

function Git-Pull {
    $params = @("pull") + $args
    git @params
}

function Git-Submodule-Status {
    $params = @("submodule", "status") + $args
    git @params
}

function Git-Submodule-Update {
    $params = @("submodule", "update") + $args
    git @params
}

function Git-Branch {
    if (!(git rev-parse --is-inside-work-tree)) { return }
    $branches = git branch
    $current_ref = git rev-parse --abbrev-ref HEAD
    $fzf_args = @(
        '--preview', 'git log {-1} --oneline --graph --date="format:%y/%m/%d" --color=always --format="%C(auto)%cd %h%d <%<(6,trunc)%an> %s"',
        '--bind', 'start:toggle-preview',
        '--bind', 'enter:become(git switch {-1})'
    )

    if ($current_ref -eq "HEAD") {
        $fzf_args += @('--header', $branches[0])
        $branches = $branches[1..($branches.Length -1)]
    }

    $branches | fzf @fzf_args
}

function Git-Log {
    if (!(git rev-parse --is-inside-work-tree)) { return }
    git log --oneline `
            --date="format:%y/%m/%d" `
            --color=always `
            --format="%C(auto)%cd %h%d <%<(6,trunc)%an> %s" `
    | fzf --preview "git show --color=always {2}" `
            --bind "enter:become(git checkout {2})"
}

function Git-Reflog {
    if (!(git rev-parse --is-inside-work-tree)) { return }
    git reflog --color=always `
                --date="format:%y/%m/%d %H:%M" `
                --format="%C(auto)%cd %h%d %gs" `
    | fzf --preview "git show --color=always {3}" `
            --bind "enter:become(git checkout {3})"
}

Set-Alias -Name open -Value Open-Folder -Force
Set-Alias -Name which -Value Which-Command -Force

Set-Alias -Name ff -Value fastfetch -Force
Set-Alias -Name of -Value onefetch -Force
Set-Alias -Name lg -Value lazygit -Force
Set-Alias -Name lad -Value lazydocker -Force
Set-Alias -Name sudo -Value gsudo -Force

Set-Alias -Name ls -Value Lsd-Invoke -Force
Set-Alias -Name ll -Value Ls-Long -Force
Set-Alias -Name la -Value Ls-All -Force
Set-Alias -Name lla -Value Ls-Long-All -Force
Set-Alias -Name lt -Value Ls-Tree -Force
Set-Alias -Name lp -Value Ls-Pure -Force
Set-Alias -Name ltp -Value Ls-Tree-Pure -Force

Set-Alias -Name gw -Value Git-Switch -Force
Set-Alias -Name gs -Value Git-Status -Force
Set-Alias -Name gd -Value Git-Diff -Force
Set-Alias -Name gp -Value Git-Pull -Force
Set-Alias -Name gss -Value Git-Submodule-Status -Force
Set-Alias -Name gsu -Value Git-Submodule-Update -Force

Set-Alias -Name gb -Value Git-Branch -Force
Set-Alias -Name gl -Value Git-Log -Force
Set-Alias -Name grl -Value Git-Reflog -Force
```

使配置生效：

```powershell
. $profile
```

