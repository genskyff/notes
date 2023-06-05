>   主要参考：
>
>   -   [Pro Git](https://git-scm.com/book/zh/v2)

# 1 安装与配置

## 安装

### Windows

访问 [Git 官网](https://git-scm.com/) 进行下载安装。

### Linux

```shell
apt update && apt -y install git
```

## 配置

使用 `git config` 命令来配置和读取环境变量：

-   `/etc/gitconfig` 文件：系统中对所有用户都适用的配置，需使用 `--system` 选项；

-   `~/.gitconfig` 文件：用户目录下的配置文件只适用于该用户，需使用 `--global` 选项；

-   当前项目的 Git 目录中的配置文件（即工作区中的 `.git/config` 文件）：这里的配置仅仅针对当前项目有效，默认或使用 `--local` 选项。

每一个级别的配置都会覆盖上层相同的配置，如 `.git/config` 会覆盖 `~/.gitconfig` 中的同名变量。

在 Windows 中，Git 会查找用户目录下的 `.gitconfig` 文件（`global` 级别），即 `$HOME` 环境变量指定的目录，同时还会查找 Git 安装目录下的 `etc/gitconfig` 文件（`system` 级别）。

### 用户信息

配置个人的用户名称和电子邮件地址：

```shell
git config --global user.name "name"
git config --global user.email "email@example.com"
```

若使用了 `--global` 选项，那么更改的配置文件位于用户主目录下，以后所有的项目都会默认使用此配置的用户信息。

若要在某个特定的项目中使用其他名字或者邮箱，只要去掉 `--global` 选项重新配置即可，新的设定保存在当前项目的 `.git/config` 文件里。

### 文本编辑器

当需要输入信息时会调用。可以使用指定文本编辑器，否则 Git 会使用默认的文本编辑器。

设置 `VSCode` 为默认文本编辑器：

```shell
git config --global core.editor "code --wait"
```

### 查看配置信息

列出所有配置信息：

```
git config --list
```

通过输入 `git config [key]` 来查看某一项配置：

```shell
git config user.name
```

查看所有配置及对应文件：

```shell
git config --list --show-origin
```

可能会出现重复的变量名，因为 Git 会从不同的文件中读取同一个配置，这种情况下，Git 会使用它找到的每一个变量的最后一个配置。

查看哪个配置文件最后设置了该值：

```shell
git config --show-origin user.name
```

# 2 Git 基础

## 版本库

即 `.git` 目录，又称仓库，这个目录是 Git 用来保存项目的元数据和对象数据库的地方。这个目录里面的所有文件都可以被 Git 管理起来，每个文件的创建、修改、删除等操作都能被跟踪，以便任何时刻都可以追踪历史，或者在将来某个时刻可以还原。

## 工作区

工作区是对项目的某个版本独立提取出来的内容，即本地磁盘能看到的目录。工作区有一个隐藏目录 `.git`，这个不算作工作区，而是 Git 的版本库。Git 的版本库中存了很多东西，其中最重要的就是暂存区，还有 Git 自动创建的第一个分支 `main`，以及指向 `main` 的指针 `HEAD`。

## 暂存区

暂存区是一个文件，保存了下次将提交的文件列表信息，一般在 Git 仓库目录中。

## Git 状态

Git 有三种状态：

-   已修改：表示修改了文件，但还没保存到数据库中；

-   已暂存： 表示对一个已修改文件的当前版本做了标记，使之包含在下次提交的快照中；

-   已提交：表示数据已经安全的保存在数据库中。

若自上次提交后，做了修改但还没有放到暂存区，就是已修改状态；若做了修改并已放入暂存区，就属于已暂存状态；若版本库中保存着特定版本的文件，就属于已提交状态。

## 文件状态

工作区的文件有两种状态：**已跟踪**和**未跟踪**。已跟踪的文件是指那些被纳入了版本控制的文件，在上一次快照中有它们的记录，在工作一段时间后，它们的状态可能是未修改，已修改或已放入暂存区。工作区中除已跟踪文件以外的所有其它文件都属于未跟踪文件，它们既不存在于上次快照的记录中，也没有被放入暂存区。初次克隆某个仓库的时候，工作目录中的所有文件都属于已跟踪文件，并处于未修改状态。

# 3 Git 命令

## 克隆仓库

使用 `git clone` 命令获得一份已经存在了的 Git 仓库的拷贝：

```shell
git clone [url] [rename]
```

`--depth` 选项用于指定克隆历史提交记录的数量：

```shell
git clone --depth=1 [url]
```

当深度设置为 1 时，只会克隆最新的提交，而不会克隆完整的历史记录。

## 新建仓库

进入工作目录，将其初始化为一个 Git 仓库：

```shell
git init
```

初始化成功后该目录下会多出一个隐藏的 `.git` 目录，这是 Git 用来跟踪管理仓库的，不需要手动修改。

## 把文件添加到仓库

第一步，把文件添加到工作目录，然后使用 `git add` 命令跟踪新文件：

```shell
git add [file]
```

使用该命令时除了可以开始跟踪新文件，还可以把已跟踪的文件添加到暂存区。该命令使用文件或目录的路径作为参数；如果参数是目录的路径，该命令将递归地跟踪或添加该目录下的所有文件。

若要将目录下所有文件全部添加：

```shell
git add .
```

第二步，将文件提交到仓库，`-m` 选项用于提交信息：

```shell
git commit -m "add a new file"
```

添加文件需要 `add`、`commit` 两个步骤，这是由于 `add` 可以多次添加不同的文件，而 `commit` 可以一次提交多个文件。

```shell
git add file1.txt
git add file2.txt file3.txt
git commit -m "add 3 files"
```

给 `git commit` 命令加上 `-a` 选项，Git 会自动把所有**已跟踪**的文件暂存起来一并提交，从而跳过 `git add` 步骤。

## 查看文件状态

```shell
git status
```

创建新文件时，则查看状态时会显示未跟踪，即 Git 在之前的快照中没有这些文件，不会自动将之纳入跟踪范围，除非告诉它需要跟踪该文件。

### 状态简览

```shell
git status -s
```

使用 `-s` 选项以更紧凑的格式输出：

```
?? LICENSE.txt
A  src/test.py
M  README.txt
 M lib/test.c
MM testfile
```

-   新添加的未跟踪文件前面有 `??` 标记；

-   新添加到暂存区中的文件前面有 `A` 标记；

-   修改过的文件前面有 `M` 标记；

-   表示状态的位置有两列，左边指明了暂存区的状态，右边指明了工作区的状态。

## 忽略文件

有些文件无需纳入 Git 的管理，也不希望出现在未跟踪文件列表。可以创建一个名为 `.gitignore` 的文件，列出要忽略的文件的模式。

**文件：.gitignore**

```
*.[oa]
*~
```

文件 `.gitignore` 的格式规范如下：

-   所有空行或者以 `＃` 开头的行都会被 Git 忽略；
-   可以使用标准的 `glob` 模式匹配；
-   匹配模式可以以 `/` 开头防止递归；
-   匹配模式可以以 `/` 结尾指定目录；
-   要忽略指定模式以外的文件或目录，可以在模式前加上 `!` 取反。

`glob` 模式指 shell 所使用的简化的正则表达式：

-   `*` 匹配零个或多个任意字符；
-   `?` 只匹配一个任意字符；

-   `[abc]` 匹配任意一个列在方括号中的字符。`-` 分隔两个字符，表示范围匹配，如 `[0-9]` 表示匹配所有 0 到 9 的数字；

-   使用 `**` 匹配任意中间目录，如 `a/**/z` 可以匹配 `a/z`、`a/b/z` 或 `a/b/c/z` 等。

>   可以忽略 `.gitignore` 文件本身。

```
# 忽略所有的 .a 文件
*.a

# 但跟踪所有的 lib.a，即便在前面忽略了 .a 文件
!lib.a

# 只忽略当前目录下的 TODO 文件，而不忽略 subdir/TODO
/TODO

# 忽略任何目录下名为 build 的文件夹
build/

# 忽略 doc/notes.txt，但不忽略 doc/server/arch.txt
doc/*.txt

# 忽略 doc/ 目录及其所有子目录下的 .pdf 文件
doc/**/*.pd
```

一个仓库可能在根目录下有一个 `.gitignore` 文件，它递归地应用到整个仓库中。 而在子目录下也可以有额外的 `.gitignore` 文件，但只作用于其所在的目录中。 

## 比较文件

比较工作区中和暂存区之间的差异：

```shell
git diff [file]
```

比较暂存区和版本库之间的差异：

```shell
git diff --cached [file]
```

比较工作区和版本库之间的差异：

```shell
git diff HEAD -- [file]
```

## 删除文件

从版本库中删除：

```shell
git rm [file]
```

该命令连带从工作区中删除指定的文件。

若删除之前修改过并且已经放到暂存区域的话，则必须要使用强制删除选项 `-f`，以防止误删还没有添加到快照的数据。

```shell
git rm --cached [file]
```

该命令仅从暂存区域移除，但文件仍保留在工作区中。

## 移动文件

```shell
git mv README.txt README.md
```

该命令相当于执行了以下三条命令：

```shell
mv README.txt README.md
git rm README.txt
git add README.md
```

## 撤消工作区修改

若不想保留对文件的修改，可以还原成当前暂存区或上次提交时的状态：

```shell
git checkout -- [file]
git restore [file]
```

这两条命令都可以将工作区中指定文件恢复到上次 commit 时的状态。

## 撤销暂存区修改

```shell
git reset HEAD [file]
git restore --staged
```

这两条命令都可以将暂存区中的指定文件恢复到上次 commit 时的状态。若加上 `--hard` 选项，则会导致工作区中的内容也被修改。

## 查看提交历史

```shell
git log --pretty=oneline
```

`--pretty=oneline` 选项表示以一行的形式简洁输出结果。一长串字符串是 `commit id`，这是 SHA-1 计算出来的数字，在不冲突的情况下，`commit id` 可以只写前几位。

`--abbrev-commit` 选项可以将 `commit id` 缩短显示：

```shell
git log --pretty=oneline --abbrev-commit
```

在 Git 中，用 `HEAD` 表示当前版本，上一个版本就是 `HEAD^`，上上个版本就是 `HEAD^^`，往上 100 个版本写作 `HEAD~100`。

 `-p` 选项可以显示每次提交的差异， `-数字` 可以指定显示条数：

```shell
git log -p -2
```

`--graph` 选项以图形形式显示提交历史：

```shell
git log --graph
```

`--stat` 选项显示每次提交的文件修改统计信息：

```shell
git log --stat
```

## 版本回退

把当前版本回退到上一个版本，使用 `git reset` 命令：

```shell
git reset --hard HEAD^
```

`--hard` 选项表示要强制覆盖当前工作目录中的所有更改，并将其还原为指定提交的状态。

若这时要恢复之前的版本，使用 `git log` 命令是看不到的，这时可以通过之前记录的版本号来恢复。

```shell
git reset --hard [id]
```

若找不到之前的版本号，还可以使用 `git reflog` 命令，它记录了每次使用的命令，可以找到以前的 `commit id`。

Git 的版本回退速度非常快，因为 Git 在内部有个指向当前版本的 `HEAD` 指针，当回退版本的时候，Git 仅仅是把 HEAD 从指向的版本更改，然后再把工作区的文件更新，所以 `HEAD` 指向哪个版本号，当前版本就定位在哪。

## 覆盖提交

```shell
git commit --amend
```

此命令会将暂存区中的文件提交。若自上次提交以来还未做任何修改则快照会保持不变，而所修改的只是提交信息。最终只会有一个提交，即第二次提交将覆盖第一次提交的结果。

# 4 远程仓库

## 查看远程仓库

```shell
git remote -v
```

`-v` 选项会显示需要读写远程仓库使用的 Git 保存的简写与其对应的 URL。

>   Git 仓库服务器的默认名为 `origin`。

```shell
git remote show [remote]
```

该命令查看某一个远程仓库的更多信息。它会列出远程仓库的 URL 与跟踪分支的信息。

## 添加远程仓库

添加一个新的远程 Git 仓库，同时指定一个简写，可以在命令行中使用简写来代替整个 URL。

```shell
git remote add [name] [url]
```

## 从远程仓库拉取

从中远程仓库中拉取所有本地还没有的数据，但**并不会自动合并或修改**当前分支，必须手动将其合并。

```shell
git fetch [remote]
```

当使用 `git clone` 命令克隆了一个仓库，命令会自动将其添加为远程仓库并默认以 `origin` 为简写。`git fetch origin` 命令会抓取克隆后新推送的所有内容。

还可以用 `git pull` 来**拉取并自动合并**该远程分支到当前分支。

```shell
git pull [remote]
```

## 推送到远程仓库

```shell
git push [remote] [branch]
```

将 `main` 分支推送到 `origin` 时，该命令将数据的备份推送到服务器。

```shell
git push -u origin main
```

第一次推送 `main` 分支时，加上了 `-u` 选项，Git 会把本地的 `main` 分支和远程的 `main` 分支关联起来，之后可以使用简化命令 `git push` 推送。

如果本地分支名和远程分支名不一样，如本地分支为 `local-main`，远程分支为 `main`，则需要指定本地分支和远程分支。

```shell
git push origin local-main:main
```

只有具有远程仓库的写入权限，且该远程分支在本地分支修改期间没有被修改过，该命令才生效。在推送前如果远程分支已经更新，则必须先拉取并合并后才能推送。

## 删除与重命名

重命名远程仓库：

```shell
git remote rename [old] [new]
```

删除远程仓库：

```shell
git remote rm [remote]
```

删除远程分支：

```shell
git push [remote] -d [branch]
```

# 5 标签管理

## 查看标签

查看已有标签：

```shell
git tag
```

使用通配符查看指定标签：

```shell
git tag -l "v1.2.3*"
```

## 创建标签

发布一个版本时，通常先在版本库中打一个标签，以确定了打标签时刻的版本。

Git 支持两种标签：

-   轻量标签：某个特定提交的引用；

-   附注标签：存储的完整对象，可以被校验并包含一系列信息。

### 附注标签

首先切换到需要打标签的分支上：

```shell
git switch [branch]
```

使用 `-a` 选项创建附注标签：

```shell
git tag -a v1.0 -m "version 1.0"
```

和 `git commit` 命令一样，需要使用 `-m` 选项指定提交信息。

使用 `git show` 命令查看标签信息：

```shell
git show v1.0
```

这会显示了打标签者的信息、打标签的日期时间、附注信息和提交信息。

### 轻量标签

不需要使用 `-a` 选项：

```shell
git tag v1.0-lw
```

使用 `git show` 命令只会看到提交信息：

```shell
git show v1.0-lw
```

### 后期打标签

要对过去的版本打标签，需要先找到 `commit id`：

```shell
git log --pretty=oneline --abbrev-commit
```

然后打 tag 时加上 `commit id`：

```shell
git tag v0.9-lw 4c805e2
```

标签总是和某个 `commit` 挂钩。如果这个 `commit` 既出现在 `main` 分支，又出现在其它分支，那么在这两个分支上都可以看到这个标签。

## 共享标签

默认情况下，`git push` 命令并不会传送标签到远程仓库服务器上，在创建完标签后必须显式地推送标签。 

```shell
git push [remote] [tag]
```

要一次性推送多个标签，即将不在远程仓库中的标签全部推送，使用 `--tags` 选项。

```shell
git push [remote] --tags
```

>   `--tags` 不区分附注标签和轻量标签。

## 删除标签

使用 `-d` 选项删除本地仓库上的标签：

```shell
git tag -d [tag]
```

删除远程标签首先要先在本地删除，再从远程删除：

```shell
git push [remote] -d [tag]
```

# 6 分支管理

每次提交，Git 都把它们串成一条时间线，这条时间线就是一个分支。当只有一条分支时，默认为`main` 分支。`HEAD` 不是指向提交，而是指向 `main`，而 `main` 才指向提交，因此 `HEAD` 指向的是当前分支，可以将当前分支的别名看作 `HEAD`。

## 查看分支

使用 `git branch` 命令查看分支列表：

```shell
git branch
```

查看每个分支最后一次提交，使用 `-v` 选项：

```shell
git branch -v
```

查看所有当前分支已经合并的分支，使用 `--merged` 选项：

```shell
git branch --merged
```

查看所有当前分支未合并的分支，使用 `--no-merged` 选项：

```shell
git branch --no-merged
```

## 创建分支

使用 `git branch` 命令创建分支：

```shell
git branch [name]
```

这会在当前所在的提交对象上创建一个指向所创建分支的指针，但此时 `HEAD` 指向的还是 `main`。该命令仅仅创建一个新分支，并不会自动切换到新分支中去。

使用 `git switch` 命令创建并切换到新分支中去：

```shell
git switch -c [name]
```

其中 `-c` 表示创建分支。

## 切换分支

```shell
git switch [branch]
```

这样 `HEAD` 就指向指定的分支了。

当再次使用该命令切换回 `main` 分支时。`HEAD` 将指回 `main` 分支，工作区将恢复成 `main` 分支所指向的快照内容，即忽略分支所做的修改。

在切换分支时，工作区里的文件会被改变。可以在不同分支间不断地来回切换和工作，并在时机成熟时将它们合并。

## 删除与重命名分支

`git branch` 命令的 ` -d`  选项可以删除分支：

```shell
git branch -d [name]
```

-   `-d` 选项用于删除已经合并到当前分支的指定分支。若指定的分支还未被合并到当前分支，则会执行失败；
-   `-D` 选项用于强制删除指定分支，即使该分支还没有被合并到当前分支。

`git branch` 命令的 ` -m`  选项可以重命名当前分支：

```shell
git branch -m [new]
```

-   `-m` 选项用于重命名当前分支。若新的分支名已经存在，则会执行失败；
-   `-M` 选项用于强制重命名当前分支。若新的分支名已存在，则会丢弃已有的分支并重命名当前分支。

## 合并分支

```shell
git merge [branch]
```

该命令用于合并指定分支到当前分支。当合并两个分支时，如果顺着一个分支走下去能够到达另一个分支，那么 Git 在合并两者的时候，只会简单的将指针向前推进，因为这种情况下的合并操作没有需要解决的冲突。

使用 `--graph` 选项查看分支合并图：

```shell
git log --graph
```

### 合并冲突

当在两个不同的分支中，对同一个文件的同一个部分进行了不同的修改，在进行合并时就会产生冲突。此时 Git 做了合并，但是没有自动地创建一个新的合并提交，并会暂停下来，等待手工解决合并冲突。

## 分支历史

```shell
git log --oneline --graph --all
```

该命令会输出提交历史、各个分支的指向以及项目的分支分叉情况。

# 7 使用 Github

## 生成密钥

```shell
ssh-keygen -t ed25519 -C "email@example.com"
```

其中 `-C` 为可选项。该命令在 `~/.ssh` 目录里生成 `id_ed25519` 和 `id_ed25519.pub` 两个文件，`id_ed25519` 是私钥，`id_ed25519.pub` 是公钥，然后在 Github 中添加自己的公钥，即可在本地把仓库 push 到 Github 中去。

![在 Github 中添加公钥](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202305011708011.png)

在 Unix / Linux 中，还需要更改私钥的权限才能生效：

```shell
sudo chmod 600 ~/.ssh/id_ed25519
```

然后测试 SSH 是否能够连接：

```shell
ssh -T -i ~/.ssh/id_ed25519 git@github.com
```

# 8 Git 工作流

个人项目通常直接使用 `git add`、`git commit`、`git push` 这三步就足够了，但是在一个大项目中，通常需要遵循一些协作规范，以便多个开发人员可以协同工作，避免代码冲突和其他问题。

一些大型项目通常会采用分支管理的策略，使得不同的开发人员可以在自己的分支上进行开发和测试，而不会影响主分支的稳定性。

## 常用工作流

Git 协作策略和操作步骤，具体的协作流程可能因项目而异，但对于绝大多数项目而言，下面的工作流通常都能够胜任。

>   以 Github 为例，设有一个多人协作项目 `demo-git`，然后根据 Git 工作流进行协作。

### 创建仓库

首先在 Github 上创建一个新项目。

<img src="https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202305041754340.png" alt="创建一个新项目" style="zoom: 67%;" />

此时该项目仅有一个 `README.md` 文件。

![创建好的项目](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202305041801399.png)

### 克隆仓库

复制项目的 URL，并克隆到本地，然后进入该目录：

```shell
git clone https://github.com/<your_github_account>/demo-git.git
cd demo-git
```

此时默认位于项目的主分支 `main` 上。

### 同步远程仓库

除了首次克隆外，之后的开发工作中，在进行一次新的修改之前，都需要同步远程仓库的代码：

```shell
git pull
```

>   `git pull` 命令其实是 `git fetch` 和 `git merge` 命令的组合，会从远程仓库拉取代码并自动将代码合并到本地分支上。虽然该命令操作简单，但也有一些缺点：
>
>   1.  难以处理冲突：当远程分支和本地分支产生冲突时，`git pull` 命令会自动进行合并操作，但无法处理复杂的冲突，需要手动解决冲突，容易出现错误；
>   2.  难以保持提交历史的清晰：使用 `git pull` 命令合并代码时，Git 会生成一个新的合并提交，这会使得提交历史变得混乱，不易于阅读和理解。

### 创建分支

然后在本地创建一个 `my-dev` 分支并切换过去：

```shell
git switch -c my-dev
```

### 进行开发

在 `README.md` 中增加一行：

```shell
echo "Hello world!" >> README.md
```

然后进行提交：

```shell
git add .
git commit -m "add a 'Hello world!' line"
```

### 再次同步远程仓库（可选）

这里直接在 Github 上的 `main`  分支直接修改 `README.md` 文件，以模拟本地提交后，远程也发生了新的提交。

<img src="https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202305041845309.png" alt="直接修改" style="zoom:67%;" />

此时远程仓库中 `main` 和 `my-dev` 分支中 `README.md` 的内容分别为：

`main` 分支，**文件：README.md**

```markdown
# demo-git

Directly modified!
```

`my-dev` 分支，**文件：README.md**

```markdown
# demo-git

Hello world!
```

因为本地的 `my-dev` 分支原本是基于没有新增的那一行的 `main` 分支修改的，此时本地提交后发现远程 `main` 分支有新的提交，因此在进行向远程推送前，需要先进行同步，并解决冲突。

---

同步有两种方式：

-   使用 `git merge` 命令来合并；
-   使用 `git rebase` 命令来变基。

这两种都需要先将远程 `main` 分支的最新代码拉取到本地，但不合并到本地分支：

```shell
git fetch origin
```

---

第一种使用 `git merge` 合并的方式：

```shell
git merge origin/main
```

当使用 `git merge` 命令时，若出现了代码冲突，Git 会提示自动合并失败，并并提示需要手动解决冲突。

具体步骤如下：

1.  使用 `git status` 命令查看冲突文件的状态，在提示中会显示哪些文件存在冲突；
2.  使用文本编辑器打开存在冲突的文件，并手动解决冲突；
3.  在解决冲突后，使用 `git add` 命令将修改的文件标记为已解决冲突；
4.  使用 `git commit` 命令提交代码。在提交代码时，Git 会自动生成一条合并提交，该提交包含了本地分支修改和远程分支的修改；
5.  在提交完成后，使用 `git log` 命令查看提交历史。可以看到一条合并提交，该提交将两个分支的修改合并到一起。

---

第二种使用 `git rebase` 变基的方式：

```shell
git rebase origin/main
```

当使用 `git rebase` 命令时，若出现了代码冲突，Git 会停止变基操作，并提示需要手动解决冲突。

具体步骤如下：

1.  使用 `git status` 命令检查当前冲突的状态；
2.  使用文本编辑器打开存在冲突的文件，并手动解决冲突；
3.  在解决冲突后，使用 `git add` 命令将修改的文件标记为已解决冲突；
4.  使用 `git rebase --continue` 命令继续变基操作，并自动应用到后续提交。

>   `git merge` 和 `git rebase` 都是将不同的分支上的代码合并到当前分支的操作，它们之间的区别在于合并的方式和效果不同。
>
>   -   `git merge` 的操作方式是将两个分支的修改合并成一个新的提交，并且保留每个分支的提交历史。合并操作会生成一个新的合并提交，将两个分支的修改合并到一起，并记录这两个分支的提交历史。因此使用 `git merge` 可以保留提交历史和清晰地记录代码的变更历史。但是，多次合并操作可能会导致提交历史变得混乱。
>
>   -   `git rebase` 的操作方式是将当前分支的修改放在目标分支的修改之后，并且把两个分支的修改合并成一个新的提交。它会将当前分支的修改合并到目标分支的最新提交上，并将两个分支的修改合并成一个新的提交，但不会产生新的合并提交。因此，使用 `git rebase` 可以使提交历史更加清晰，但是会丢失一部分提交历史。

### 推送代码

在完成开发之后，将本地分支上的代码推送到远程仓库中。

```shell
git push origin my-dev
```

此时查看 Gihub 上的仓库，发现修改已经同步，并且新增了 `my-dev` 分支。

![修改后的仓库](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202305042019318.png)

### 发起合并请求

代码被推送到远程分支后，发起一个合并请求，让此分支合并到主分支上。通常使用代码托管平台（如 GitHub、GitLab 等）提供的功能来发起合并请求，并邀请其他开发人员进行审核和合并操作。

### 清理工作

当远程的 `my-dev` 分支合并到远程的 `main` 分支后，可以将远程与本地的 `my-dev` 分支删除，并将远程的 `main` 分支同步到本地，以保持同步。

```shell
git branch -d my-dev
git push origin -d my-dev
git pull
```

这样，本地和远程就又一次保持了同步，并可以进行下一次修改提交。

>   可以使用 `git remote prune` 命令删除本地仓库中已经不存在的远程跟踪分支。这些无效的跟踪分支通常是由于远程仓库中的分支已被删除而在本地仍保留跟踪分支所致。
>
>   ```shell
>   git remote prune origin
>   ```
