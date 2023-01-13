# 1 安装与配置

## 安装

### Windows

访问 [Git 官网](https://git-scm.com/) 进行下载安装。

### Linux

```bash
apt update && apt -y install git
```

## 配置

使用 `git config` 来配置或读取相应的工作环境变量。

-   `/etc/gitconfig` 文件：系统中对所有用户都普遍适用的配置，需使用 `--system` 选项。

-   `~/.gitconfig` 文件：用户目录下的配置文件只适用于该用户，需使用 `--global` 选项。

-   当前项目的 Git 目录中的配置文件（也就是工作区中的 `.git/config` 文件）：这里的配置仅仅针对当前项目有效。

每一个级别的配置都会覆盖上层的相同配置，所以 `.git/config` 里的配置会覆盖 `/etc/gitconfig` 中的同名变量。

在 Windows 中，Git 会查找用户主目录下的 `.gitconfig` 文件，即 `$HOME` 变量指定的目录，通常是 `C:\Documents and Settings\$USER`。Git 还会查找 Git 安装目录下的 `gitconfig` 文件。

### 用户信息

配置个人的用户名称和电子邮件地址。

```bash
git config --global user.name "name"
git config --global user.email "email@example.com"
```

若使用了 `--global` 选项，那么更改的配置文件位于用户主目录下，以后所有的项目都会默认使用此配置的用户信息。

若要在某个特定的项目中使用其他名字或者邮箱，只要去掉 `--global` 选项重新配置即可，新的设定保存在当前项目的 `.git/config` 文件里。

### 检查配置信息

使用 `git config --list ` 命令来列出所有 Git 能找到的配置。

```
user.name=name
user.email=user@example
```

可能会出现重复的变量名，因为 Git 会从不同的文件中读取同一个配置，这种情况下，Git 会使用它找到的每一个变量的最后一个配置。

通过输入 `git config [key]` 来检查 Git 的某一项配置。

```bash
git config user.name
```

# 2 Git 基础

## 版本库

又称仓库，这个目录是 Git 用来保存项目的元数据和对象数据库的地方。这个目录里面的所有文件都可以被 Git 管理起来，每个文件的创建、修改、删除等操作都能被跟踪，以便任何时刻都可以追踪历史，或者在将来某个时刻可以还原。

## 工作区

工作区是对项目的某个版本独立提取出来的内容，即本地能看到的目录。工作区有一个隐藏目录 `.git`，这个不算作工作区，而是 Git 的版本库。Git 的版本库中存了很多东西，其中最重要的就是暂存区，还有 Git 自动创建的第一个分支 `main`，以及指向 `main` 的指针 `HEAD`。

## 暂存区

暂存区是一个文件，保存了下次将提交的文件列表信息，一般在 Git 仓库目录中。

## Git 状态

Git 有三种状态：**已修改**、**已暂存**和**已提交**。 已修改表示修改了文件，但还没保存到数据库中；已暂存表示对一个已修改文件的当前版本做了标记，使之包含在下次提交的快照中；已提交表示数据已经安全的保存在本地数据库中。

若自上次取出后，作了修改但还没有放到暂存区域，就是已修改状态；如果作了修改并已放入暂存区域，就属于已暂存状态；如果 Git 目录中保存着特定版本的文件，就属于已提交状态。

## 文件状态

工作区的文件有两种状态：**已跟踪**和**未跟踪**。已跟踪的文件是指那些被纳入了版本控制的文件，在上一次快照中有它们的记录，在工作一段时间后，它们的状态可能是未修改，已修改或已放入暂存区。工作区中除已跟踪文件以外的所有其它文件都属于未跟踪文件，它们既不存在于上次快照的记录中，也没有被放入暂存区。初次克隆某个仓库的时候，工作目录中的所有文件都属于已跟踪文件，并处于未修改状态。

# 3 Git 命令

## 克隆现有仓库

使用 `git clone` 命令获得一份已经存在了的 Git 仓库的拷贝。

```bash
git clone https://github.com/git/git.git mygit
```

在克隆远程仓库的时候，也可以自定义本地仓库的名字。

## 新建本地仓库

进入工作目录，将其初始化为一个 Git 版本库。

```bash
git init
```

初始化成功后该目录下会多出一个隐藏的 `.git` 目录，这是 Git 用来跟踪管理版本库的，不需要手动修改。

## 把文件添加到版本库

第一步，把文件添加到工作目录，然后使用 `git add` 命令开始跟踪新文件。

```bash
git add [file]
```

使用该命令时除了可以开始跟踪新文件，还可以把已跟踪的文件添加到暂存区。该命令使用文件或目录的路径作为参数；如果参数是目录的路径，该命令将递归地跟踪或添加该目录下的所有文件。

若要将目录下所有的文件全部添加。

```bash
git add .
```

第二步，将文件提交到版本库，`-m` 选项用于提交信息。

```bash
git commit -m "add a new file"
```

Git 添加文件需要 `add`、`commit` 两个步骤，这是由于 `add` 可以多次添加不同的文件，而 `commit` 可以一次提交很多文件。

```bash
git add file1.txt
git add file2.txt file3.txt
git commit -m "add 3 files"
```

给 `git commit` 加上 `-a` 选项，Git 会自动把所有已经跟踪过的文件暂存起来一并提交，从而跳过 `git add` 步骤。

## 查看文件状态

```bash
git status
```

创建新文件时，则查看状态时会显示未跟踪，即 Git 在之前的快照中没有这些文件，不会自动将之纳入跟踪范围，除非告诉它需要跟踪该文件。

### 状态简览

```bash
git status -s
```

使用 `-s` 选项以更紧凑的格式输出。

```
?? LICENSE.txt
A  src/test.py
M  README.txt
 M lib/test.c
MM testfile
```

-   新添加的未跟踪文件前面有 `??` 标记。

-   新添加到暂存区中的文件前面有 `A` 标记。

-   修改过的文件前面有 `M` 标记。`M` 有两个可以出现的位置：右边表示该文件被修改了但是还没被放入暂存区，左边表示该文件被修改了并被放入了暂存区。

## 忽略文件

有些文件无需纳入 Git 的管理，也不希望出现在未跟踪文件列表。可以创建一个名为 `.gitignore` 的文件，列出要忽略的文件的模式。

**文件：.gitignore**

```
*.[oa]
*~
```

文件 `.gitignore` 的格式规范如下：

-   所有空行或者以 ＃ 开头的行都会被 Git 忽略。
-   可以使用标准的 glob 模式匹配。
-   匹配模式可以以 `/` 开头防止递归。
-   匹配模式可以以 `/` 结尾指定目录。
-   要忽略指定模式以外的文件或目录，可以在模式前加上 `!` 取反。

glob 模式指 shell 所使用的简化的正则表达式：

-   `*` 匹配零个或多个任意字符。
-   `?` 只匹配一个任意字符。

-   `[abc]` 匹配任意一个列在方括号中的字符。`-` 分隔两个字符，表示范围匹配，如 `[0-9]` 表示匹配所有 0 到 9 的数字。

-   使用 `**` 匹配任意中间目录，如 `a/**/z` 可以匹配 `a/z`、`a/b/z` 或 `a/b/c/z` 等。

## 比较文件

比较工作区中和暂存区之间的差异。

```bash
git diff [file]
```

比较暂存区和版本库之间的差异。

```bash
git diff --cached [file]
```

比较工作区和版本库之间的差异。

```bash
git diff HEAD -- [file]
```

## 删除文件

从版本库中删除。

```bash
git rm [file]
```

该命令连带从工作区中删除指定的文件。

若删除之前修改过并且已经放到暂存区域的话，则必须要使用强制删除选项 `-f`，以防止误删还没有添加到快照的数据。

```bash
git rm --cached [file]
```

该命令仅从暂存区域移除，但文件仍保留在工作区中。

## 移动文件

```bash
git mv README.txt README.md
```

该命令相当于执行了以下三条命令：

```bash
mv README.txt README.md
git rm README.txt
git add README.md
```

## 撤销暂存文件

```bash
git reset HEAD [file]
git restore --cached
```

该命令撤销了暂存区中的 `file` 文件。若加上 `--hard` 选项，则会导致工作区中的内容也被修改。

## 版本回退

查看历史修改记录。

```bash
git log --pretty=oneline
```

>   cdd4c1ce5a70df94bd16a1bcff35ee3b9727fef3 (HEAD -] main) add a new line
>
>   622271e93c209a690c39c13a46716e8fa000c366 add a new line
>
>   7345abe385e865d25c48e7ca9c8395c3f7dfaef0 wrote a readme file

一大串字符串是版本号，这是 SHA-1 计算出来的数字，在不冲突的情况下，版本号可以只写前几位。

在 Git 中，用 `HEAD` 表示当前版本，上一个版本就是 `HEAD^`，上上个版本就是 `HEAD^^`，往上 100 个版本写作 `HEAD~100`。

把当前版本回退到上一个版本，即 `62227` 开头的版本，使用 `git reset ` 命令。

```bash
git reset --hard HEAD^
```

若这时要恢复之前的版本，即 `cdd4c` 的版本，使用 `git log` 查看时是看不到的，因为当前的 `HEAD` 为 `62227` 的版本，这时可以通过之前记录的版本号来恢复。

```bash
git reset --hard cdd4c
```

若找不到之前的版本号，还可以使用 `git reflog`，它记录了每次使用的命令，可以找到以前的版本号。

>   cdd4c1c (HEAD -] main) HEAD@{0}: reset: moving to HEAD^
>
>   622271e HEAD@{1}: commit: add a new line
>
>   cdd4c1c (HEAD -] main) HEAD@{2}: commit (initial): add a new line

Git 的版本回退速度非常快，因为 Git 在内部有个指向当前版本的 `HEAD` 指针，当回退版本的时候，Git 仅仅是把 HEAD 从指向 `cdd4c` 的版本改为指向 `62227` 的版本，然后再把工作区的文件更新了，所以 `HEAD` 指向哪个版本号，当前版本定位就在哪。

## 撤消文件修改

若不想保留对文件的修改，将它还原成当前暂存区或上次提交时的状态。

```bash
git checkout -- [file]
git restore
```

该命令会导致对目标文件做的任何修改都会消失。

## 覆盖提交

```bash
git commit --amend
```

此命令会将暂存区中的文件提交。若自上次提交以来还未做任何修改则快照会保持不变，而所修改的只是提交信息。最终只会有一个提交，即第二次提交将覆盖第一次提交的结果。

# 4 远程仓库

## 查看远程仓库

```bash
git remote -v
```

`-v` 选项会显示需要读写远程仓库使用的 Git 保存的简写与其对应的 URL。

>   origin

Git 仓库服务器的默认名为 `origin`。

```bash
git remote show [remote]
```

该命令查看某一个远程仓库的更多信息。它会列出远程仓库的 URL 与跟踪分支的信息。

## 添加远程仓库

添加一个新的远程 Git 仓库，同时指定一个简写，可以在命令行中使用简写来代替整个 URL。

```bash
git remote add [shortname] [url]
```

从中远程仓库中拉取所有本地还没有的数据，但并不会自动合并或修改当前工作，必须手动将其合并。

```bash
git fetch [remote]
```

当使用 `clone` 命令克隆了一个仓库，命令会自动将其添加为远程仓库并默认以 `origin` 为简写。`git fetch origin` 命令会抓取克隆后新推送的所有内容。

## 推送远程仓库

```bash
git push [remote] [branch]
```

将 `main` 分支推送到 `origin` 服务器时，该命令将数据的备份到服务器。

```bash
git push -u origin main
```

第一次推送 `main` 分支时，加上了 `-u` 选项，Git 会把本地的 `main` 分支和远程的 `main` 分支关联起来，之后可以使用简化命令 `git push` 推送。

只有具有克隆服务器的写入权限，且之前没人推送过时，该命令才生效。当和其他人在同一时间克隆，其他人先推送后，必须先将他们的工作拉取下来并将其合并后才能推送。

## 移除与重命名

重命名远程仓库简写及分支名。

```bash
git remote rename [old] [new]
```

删除远程仓库。

```bash
git remote rm [remote]
```

# 5 分支管理

每次提交，Git 都把它们串成一条时间线，这条时间线就是一个分支。当只有一条分支时，默认为`main` 分支。`HEAD` 不是指向提交，而是指向 `main`，而 `main` 才指向提交，因此 `HEAD` 指向的是当前分支。

## 创建分支

```bash
git branch test
```

这会在当前所在的提交对象上创建一个指针 `test`，但此时 `HEAD` 指向的还是 `main`。该命令仅仅创建一个新分支，并不会自动切换到新分支中去。

使用 `git log` 命令查看各个分支当前所指的对象，加上 `--decorate` 选项。

```bash
git log --oneline --decorate
```

使用 `git branch` 查看分支列表。

```bash
git branch
```

## 分支切换

```bash
git checkout -b test
git switch -c test
```

这样 `HEAD` 就指向 `test` 分支了。当对分支做出修改并提交后，`test` 分支向前移动，而 `HEAD` 指针也随之移动，`main` 不变。`-b` 或 `-c` 选项为创建并切换分支。

当再次使用该命令切换回 `main` 分支时。`HEAD` 将指回 `main` 分支，工作区将恢复成 `main` 分支所指向的快照内容，即忽略分支所做的修改。

在切换分支时，工作区里的文件会被改变。可以在不同分支间不断地来回切换和工作，并在时机成熟时将它们合并。

```bash
git log --oneline --decorate --graph --all
```

该命令会输出提交历史、各个分支的指向以及项目的分支分叉情况。

## 分支删除

```bash
git branch -d [file]
```

## 分支合并

```bash
git merge test
```

>   Updating d46f35e..b17d20e
>   Fast-forward
>   readme.txt | 1 +
>   1 file changed, 1 insertion(+)

该命令用于合并指定分支到当前分支。`Fast-forward` 表示快进，当合并两个分支时，如果顺着一个分支走下去能够到达另一个分支，那么 Git 在合并两者的时候，只会简单的将指针向前推进，因为这种情况下的合并操作没有需要解决的冲突。

使用 `--graph` 选项查看分支合并图。

```bash
git log --graph
```

### 合并冲突

当在两个不同的分支中，对同一个文件的同一个部分进行了不同的修改，在进行合并时就会产生冲突。此时 Git 做了合并，但是没有自动地创建一个新的合并提交，并会暂停下来，等待手工解决合并冲突。

# 6 标签管理

## 创建标签

发布一个版本时，通常先在版本库中打一个标签，以确定了打标签时刻的版本。

首先切换到需要打标签的分支上。

```bash
git branch [branch-name]
```

然后通过 `git tag` 命令打上标签。

```bash
git tag <name>
```

要对特定版本打标签，需要先找到 `commit id`。

```bash
git log --pretty=oneline --abbrev-commit
```

>   12a631b (HEAD -> main, tag: v1.0, origin/main) merged bug fix 101
>   4c805e2 fix bug 101
>   e1e9c68 merge with no-ff
>   f52c633 add merge
>   cf810e4 conflict fixed
>   5dc6824 & simple

比如要对 `fix bug 101` 打标签，需加上 `commit id`。

```bash
git tag v0.9 4c805e2
```

使用命令 `git tag` 查看标签。

```bash
git tag
```

>   v0.9

标签不是按时间顺序列出，而是按字母排序的。使用 `git show ` 查看标签信息。

```bash
git show v0.9
```

创建带有说明的标签，用 `-a` 选项指定标签名，`-m` 选项指定说明文字。

```bash
git tag -a v0.8 -m "conflict fixed" cf810e4
```

标签总是和某个 `commit` 挂钩。如果这个 `commit` 既出现在 `main` 分支，又出现在其它分支，那么在这两个分支上都可以看到这个标签。

## 删除标签

若标签打错了，也可以删除，加上 `-d` 选项。

```bash
git tag -d v0.1
```

创建的标签都只存储在本地，不会自动推送到远程。若要推送某个标签到远程，使用命令`git push origin`。

```bash
git push origin v1.0
```

一次性推送全部尚未推送到远程的本地标签。

```bash
git push origin --tags
```

删除远程标签首先要先在本地删除，再从远程删除。

```bash
git tag -d v0.9
git push origin :refs/tags/v0.9
```

# 7 使用 Github

## 生成密钥

```bash
ssh-keygen -t rsa -C "email@example.com"
```

该命令在 `~/.ssh` 目录里生成 `id_rsa` 和 `id_rsa.pub` 两个文件，`id_rsa` 是私钥，`id_rsa.pub` 是公钥，然后在 Github 中设置自己的公钥，即可在本地把仓库 push 到 Github 中去。

