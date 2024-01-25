>   主要参考：
>
>   -   [Pro Git](https://git-scm.com/book/zh/v2)

# 1 环境配置

## 安装

### Windows

访问 [Git 官网](https://git-scm.com/) 进行下载安装。

### Linux

以 Debian 为例：

```shell
apt update && apt -y install git
```

## 配置

使用 `git config` 来读取和配置环境变量：

-   `--system`：对所有用户都适用的配置；
    -   Windows：Git 安装目录下的 `etc/gitconfig` ；
    -   Linux： `/etc/gitconfig`。

-   `--global`：仅对当前用户适用的配置；
    -   Windows、Linux：`~/.gitconfig`。

-   `--local`：**默认选项**，仅对当前 Git 目录适用的配置。
    -   Windows、Linux：工作区中的 `.git/config`。

>   `--system` 优先级**最低**，`--local` 优先级**最高**，高优先级会覆盖低优先级中的相同配置。这些配置仅在本地生效，不会推送到远程仓库中去。

### 查看配置

```shell
# 查看所有配置
git config -l

# 查看指定配置
git config <key>

# 查看所有配置及其对应配置文件
git config -l --show-origin

# 查看指定配置在哪个配置文件中生效
git config --show-origin <key>
```

>   使用 `-l` 时，会查找所有级别的配置，并以优先级最高的配置为准，相同优先级的同名配置，以最后找到的为准。

### 设置配置

```shell
# 配置用户信息
git config --global user.name <name>
git config --global user.email <email>

# 默认编辑器为 VSCode
git config --global core.editor "code --wait"

# 显示非 ASCII 字符
git config --global core.quotepath false

# 自动解决冲突
git config --global rerere.enabled true

# 默认密钥管理 - Windows
git config --global credential.helper "redential Manager"

# 默认密钥管理 - macOS
git config --global credential.helper osxkeychain

# 取消配置
git config --unset <key>
```

# 2 Git 基础

## 工作区

工作区是某个版本独立提取出来的内容，即磁盘上能看到的目录，也是实际编写代码所用到的目录。其中有一个隐藏目录 `.git`，这个不算作工作区的一部分，而是 Git 的版本库。

## 暂存区

暂存区是一个文件，保存了下次将要提交的信息，保存在 `.git` 目录中。

## 版本库

即 `.git` 目录，又称**仓库**，这个目录是 Git 用来保存项目的元数据和对象数据库的地方。这个目录里面的所有文件都可以被 Git 管理起来，每个文件的创建、修改、删除等操作都能被跟踪，任何时刻都可以追踪历史，或在将来某个时刻还原。Git 的版本库中存了很多东西，其中最重要的就是暂存区，还有 Git 自动创建的第一个分支 `main`，以及指向 `main` 的指针 `HEAD`。

## 文件状态

**工作区**的文件有两种状态：

-   已跟踪：指被纳入了版本控制的文件，这些文件具有 Git 状态：已修改、已暂存、已提交；
-   未跟踪：除已跟踪文件以外的所有其它文件。

## Git 状态

被纳入版本控制的文件具有三种状态：

-   已修改：修改了文件，但还未标记当前版本，即未保存到暂存区；

-   已暂存：对已修改文件的当前版本做了标记，但还未提交到仓库；

-   已提交：所有被标记了版本的文件都已从暂存区保存到了仓库。

若自上次提交后，做了修改但还没有放到暂存区，就是已修改状态；若做了修改并已放入暂存区，就属于已暂存状态；若仓库中保存着特定版本的文件，就属于已提交状态。

# 3 Git 命令

## 克隆

`clone` 用于克隆仓库默认分支，可指定分支和重命名：

```shell
git clone [-b <branch>] <repo> [rename]
```

`--depth` 用于指定克隆历史提交记录的数量：

```shell
# 只克隆最新的提交
git clone --depth 1 <repo>
```

## 新建

进入工作目录，将其初始化为一个 Git 仓库：

```shell
git init
```

初始化成功后该目录下会多出一个隐藏的 `.git` 目录，这是 Git 用来跟踪管理仓库的，不需要手动修改。

## 提交

`add` 会将未跟踪文件变为已跟踪，将已跟踪文件添加到暂存区。

```shell
# 跟踪或添加文件
git add <file>
# 递归地跟踪或添加目录下的所有文件
git add <path>
```

`commit` 将暂存区中的文件提交到仓库，`-m` 用于指定提交信息：

```shell
git commit -m <message>
```

`-a` 会自动把所有**已跟踪**的文件暂存起来一并提交，从而跳过 `git add` 步骤。

```shell
git commit -am <message>
```

`--amend` 会覆盖上次提交：

```shell
git commit --amend [-m <message>]
```

若自上次提交以来还未做任何修改则覆盖的只是提交信息。

## 文件状态

`status` 查看当前目录文件状态：

```shell
git status -s
```

`-s` 将以更紧凑的格式输出：

```
[暂存区状态][工作区状态] [文件]
```

常见状态标记有：

-   `?`：未跟踪；
-   `M`：已修改；
-   `A`：已添加到暂存区；
-   `D`：已删除；
-   `R`：已重命名；
-   `U`：有冲突。

## 忽略文件

有些文件无需纳入 Git 的管理，也不希望出现在未跟踪文件列表。可以创建一个名为 `.gitignore` 的文件，列出要忽略的文件的模式。

**文件：.gitignore**

```
# 忽略所有的 .a 文件
*.a

# 但跟踪所有的 lib.a，即使在前面忽略了 .a 文件
!lib.a

# 只忽略当前目录下的 TODO 文件，而不忽略 subdir/TODO
/TODO

# 忽略任何目录下名为 build 的文件夹
build/

# 忽略 doc/notes.txt，但不忽略 doc/server/arch.txt
doc/*.txt

# 忽略 doc/ 目录及其所有子目录下的 .pdf 文件
doc/**/*.pdf
```

工作目录的根目录下有一个 `.gitignore` 文件，它递归地应用到整个仓库中。而在其子目录下也可以有额外的 `.gitignore` 文件，但只作用于其所在的目录中。

>   所有 `.gitignore` 文件规则会合并生效。

## 比较差异

比较工作区中和暂存区之间的差异：

```shell
git diff [file]
```

比较暂存区和仓库之间的差异：

```shell
git diff --cached [file]
```

比较工作区和仓库之间的差异：

```shell
git diff HEAD [-- <file>]
```

比较当前分支与指定分支间的差异：
```shell
git diff <branch> [-- <file>]
```

比较当前提交和指定提交间的差异：

```shell
git diff <commit>  [-- <file>]
```

比较当前提交和指定提交间的统计信息：

```shell
git diff --shortstat <commit> [-- <file>]
```

比较当前提交和指定提交间的文件差异：

```shell
git diff --name-only <commit>
```

## 删除文件

`rm` 从工作区和仓库中删除指定的文件：

```shell
git rm <file>
```

若已保存到暂存区，则必须使用 `-f` 来强制删除，防止误删还未提交的数据。

`--cached` 仅从暂存区删除，但文件仍保留在工作区中：

```shell
git rm --cached <file>
```

## 移动文件

`mv` 移动或重命名文件：

```shell
git mv <old> <new>
```

相当于执行了以下三条命令：

```shell
mv <old> <new>
git rm <old>
git add <new>
```

## 撤销更改

`restore`、`reset` 和 `revert` 都可以用来撤销更改，但在功能上有一些区别。

### restore

- 用途：用于撤销工作区和暂存区的更改。
- 安全性：相对安全，因为不修改提交历史。
- 影响：只影响工作区和暂存区，不影响提交历史。
- 常见用法
  - 撤销工作区的更改：`git restore <file>`
  - 撤销暂存区的更改：`git restore --staged <file>`

### reset

- 用途：用于重置 `HEAD` 指针，撤销提交，并可选地更改工作区和暂存区。
- 安全性：可能不安全，因为 `--hard` 可以修改提交历史。
- 影响：可以影响工作区、暂存区和提交历史。
- 常见用法
  - 软重置（不影响工作区和暂存区）：`git reset --soft <commit>`
  - 硬重置（影响工作区和暂存区）：`git reset --hard <commit>`
  - 混合重置（**默认选项**，影响暂存区，但不影响工作区）：`git reset --mixed <commit>`

### revert

- 用途：用于创建一个新的提交，以撤销一个或多个旧的提交。
- 安全性：相对安全，因为不修改现有的提交历史，而是添加新的提交。
- 影响：只影响提交历史。
- 常见用法
  - 撤销最新提交：`git revert HEAD`
  - 撤销指定提交：`git revert <commit>`

>   `revert` 可能导致冲突，需要手动解决。

## 提交历史

`log` 用来查看提交历史：

```shell
git log <branch> --oneline --abbrev-commit --graph
```

-   可选指定分支的历史；

-   `--oneline` 以一行的形式简洁输出结果；

-   `--abbrev-commit` 将 `commit id` 缩短显示；

-   `--graph` 以图形形式显示提交历史，包括分支历史；

-   `--reverse` 倒序显示提交历史。

 `-p` 可以显示每次提交的差异， `-数字` 可以指定显示条数：

```shell
git log -p -2
```

`--stat` 显示每次提交的文件修改统计信息：

```shell
git log --stat
```

`--since` 和 `--until` 可以指定提交日期：

```shell
git log --since="2023-09-24 00:00:00" --until="2023-09-24 23:59:59"
```

查看所有提交的总变化行数：

```shell
git log --pretty=tformat: --numstat | awk '{ add += $1; subs += $2; loc += $1 - $2 } END { printf "Added lines: %s\nRemoved lines: %s\nTotal lines: %s\n", add, subs, loc }'
```

### 临时切换

`checkout` 和 `switch` 也可以用来临时切换到某个历史提交的状态。

```shell
# 临时切换到某个提交
git checkout [--detach] <commit>
git switch --detach <commit>

# 切换回指定分支最新的提交
git checkout <branch>
git switch <branch>
```

`--detach` 作用是将 HEAD 分离到指定的提交。这表示会离开当前分支，并且 HEAD 指向一个特定的提交，而不是分支的最新提交。这样的好处是：

-   **临时查看历史提交**：要查看或测试历史中的某个特定提交时，但又不想离开当前的分支。
-   **进行实验性更改**：HEAD 在分离状态下，可以进行修改而不影响任何分支；
-   **构建临时任务**：基于特定的提交进行构建或运行一些脚本，而不想改变当前分支的状态。

# 4 分支管理

每次提交，Git 都把它们串成一条时间线，这条时间线就是一个分支。当只有一条分支时，默认为`main` 分支。`HEAD` 不是指向提交，而是指向 `main`，而 `main` 才指向提交，因此 `HEAD` 指向的是当前分支，可以将当前分支的别名看作 `HEAD`。

## 查看

`branch` 查看分支列表：

```shell
git branch
```

`-v` 查看每个分支最后一次提交：

```shell
git branch -v
```

`-a` 查看所有本地和远程分支：

```shell
git branch -a
```

`--merged` 或 `--no-merged` 查看所有当前分支已经合并或未合并的分支：

```shell
git branch --merged
git branch --no-merged
```

## 创建

`branch` 创建分支：

```shell
git branch <name>
```

这会在当前所在的提交对象上创建一个指向所创建分支的指针，但此时 `HEAD` 指向的还是当前分支。该命令仅仅创建一个新分支，并不会自动切换到新分支中去。

`switch` 切换分支，`-c` 表示创建：

```shell
git switch -c <name>
```

这样 `HEAD` 就指向指定的分支了。

在切换分支时，工作区里的文件会被改变。可以在不同分支间不断地来回切换和工作，并在合适的时候合并。

## 合并

`merge` 合并指定分支到当前分支：

```shell
git merge [--squash] <branch>
```

当合并两个分支时，若顺着一个分支走下去能够到达另一个分支，那么 Git 在合并两者的时候，只会简单的将指针向前推进，因为这种情况下的合并没有冲突。

当在两个不同的分支中，对同一个文件的同一个部分进行了不同的修改，在进行合并时就会产生冲突。此时 Git 做了合并，但没有自动地创建一个新的合并提交，并会暂停下来，等待手工解决合并冲突。

`--squash` 和普通合并的区别为：普通合并会把另一个分支上所有的提交都保留，而 `squash` 会把另一个分支上的所有提交压缩为一个新提交，这样当前分支上的提交就会比较简洁，但 `squash` 操作完后还需要手动执行 `git commit` 以在当前分支上创建这个新的压缩提交。

### 查看文件冲突时的信息

当 `rerere.enabled` 为 `true` 时，合并时 git 会使用缓存的解决方法，但有时也需要查看冲突信息。

```shell
git checkout --conflict=merge <path>
```

## 重命名与删除

`branch -m`  可以重命名当前分支：

```shell
git branch -m <new>
```

-   `-m` 用于重命名当前分支。若分支名已经存在，则会执行失败；
-   `-M` 用于强制重命名当前分支。若分支名已存在，则会丢弃已有的分支并重命名当前分支。

`branch -d`  可以删除分支：

```shell
git branch -d <name>
```

-   `-d` 用于删除已经合并到当前分支的指定分支。若指定的分支还未被合并到当前分支，则会执行失败；
-   `-D` 用于强制删除指定分支，即使该分支还未被合并到当前分支。

# 5 远程仓库

## 查看

`remote` 查看远程仓库：

```shell
git remote -v
```

`-v` 会显示远程仓库拉取和推送对应的 URL。

>   Git 远程仓库默认名为 `origin`。

`remote show` 还会列出远程仓库与跟踪分支的信息：

```shell
git remote show <remote>
```

## 添加

添加新的远程仓库，同时指定一个别名，可以使用别名来代替远程仓库的路径。

```shell
git remote add <alias> <repo>
```

>   当使用 `clone` 克隆了一个远程仓库时，会自动将其添加为远程仓库并默认以 `origin` 为别名。

## 修改

若远程分支修改了名字，也需要在本地修改对应的 URL。

```shell
git remote set-url origin <url>
```

## 拉取

`fetch` 从中远程仓库拉取所有本地还没有的数据，但**并不会自动合并**到当前分支，必须手动合并。

```shell
git fetch [remote]
```

`pull` 和 `fetch` 的不同在于，会**自动合并**对应的远程分支到当前分支。

```shell
git pull [remote]
```

>   `pull` 实际上是 `fetch` 和 `merge` 的组合。

## 推送

`push` 将当前分支推送到远程对应的分支：

```shell
git push [remote] [branch]
```

如将本地的 `main` 分支推送到远程的 `main` 分支：

```shell
git push -u origin main
```

首次推送时需要使用 `-u` 将本地和对应的远程分支相关联，之后就可以直接使用 `push` 推送。

>   若使用了 `--amend`、`rebase` 之类的操作，推送时可能会失败，这时可以使用 `-f` 选项来强制推送。但是注意，若在推送时有其他人在相同分支也进行了提交，则会**覆盖别人的提交**。除非提交的分支是只有自己在使用，否则谨慎使用该选项。

若本地分支名和远程分支名不同，如本地分支为 `local-main`，远程分支为 `main`，则需要指定本地分支和远程分支。

```shell
git push origin local-main:main
```

只有具有远程仓库的写入权限，且该远程分支在上次拉取后没有新的提交，该命令才生效。在推送前若远程分支有新的提交，则必须先拉取再合并后才能推送。

## 重命名与删除

删除远程仓库：

```shell
git remote rm <remote>
```

删除远程分支：

```shell
git push <remote> -d <branch>
```

重命名远程分支只能通过先删除远程分支，然后将本地分支改名后再重新推送。

# 6 标签管理

## 查看

查看已有标签：

```shell
git tag
```

使用通配符查看指定标签：

```shell
git tag -l "v1.2.3*"
```

## 创建

发布一个版本时，通常先在仓库中打一个标签，以确定打标签时刻的版本。

Git 支持两种标签：

-   轻量标签：某个特定提交的引用；

-   附注标签：存储的完整对象，可以被校验并包含一系列信息。

### 轻量标签

`tag` 默认就是轻量标签：

```shell
git tag v1.0-l
```

`show` 查看轻量标签只会看到提交信息：

```shell
git show v1.0-l
```

### 附注标签

使用 `-a` 创建附注标签，`-m` 指定提交信息：

```shell
git tag -a v1.0 -m "version 1.0"
```

`show` 查看附注标签会显示更多信息：

```shell
git show v1.0
```

### 后期打标签

要对过去的版本打标签，需要先找到 `commit id`：

```shell
git log --oneline --abbrev-commit
```

然后打 tag 时加上 `commit id`：

```shell
git tag v0.9-l <commit>
```

标签总是和某个 `commit` 关联。若这个 `commit` 既出现在 `main` 分支，又出现在其它分支，那么在这两个分支上都可以看到这个标签。

## 共享

默认情况下，`push` 命令并不会推送标签到远程仓库服务器上，在创建完标签后必须显式地推送标签。 

```shell
git push <remote> <tag>
```

`--tags` 一次性推送所有标签：

```shell
git push <remote> --tags
```

>   `--tags` 不区分轻量标签和附注标签。

## 删除

`-d` 删除本地标签：

```shell
git tag -d <tag>
```

删除远程标签首先要先在本地删除，再从远程删除：

```shell
git push <remote> -d <tag>
```

# 7 子模块



# 8 关联 Github

## 生成密钥

```shell
ssh-keygen -t ed25519 [-C <message>]
```

`-C` 用于添加注释方便管理 SSH 密钥，并不会用于加密或验证。该命令在 `~/.ssh` 目录里生成 `id_ed25519` 和 `id_ed25519.pub` 两个文件，`id_ed25519` 是私钥，`id_ed25519.pub` 是公钥。

在 Linux 中，还需要私钥的读权限才能生效：

```shell
sudo chmod 400 ~/.ssh/id_ed25519
```

## 添加到 Github

在 Github 中添加自己的公钥，即可把本地仓库 Push 到 Github 的远程仓库中去。

![在 Github 中添加公钥](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202305011708011.png)

测试 SSH 是否能够有效：

```shell
ssh -T -i ~/.ssh/id_ed25519 git@github.com
```

在 `~/.ssh/config` 中配置：

```
Host mygit
HostName github.com
User git
IdentityFile ~/.ssh/id_ed25519
```

之后则可直接使用 `Host` 项配置的别名来替代：

```shell
ssh -T mygit
```

# 9 Git 工作流

个人项目通常直接使用 `add`、`commit`、`push` 这三步就足够了，但是在一个大项目中，通常需要遵循一些协作规范，以便多个开发人员可以协同工作，避免代码冲突和其它问题。

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

除了首次克隆外，之后的开发流程中，在进行一次新的修改之前，都需要同步远程仓库的代码：

```shell
git pull
```

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

### 再次同步远程仓库

这里直接在 Github 上的 `main`  分支直接修改 `README.md` 文件，以模拟本地提交后，远程也发生了新的提交。

<img src="https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202305041845309.png" alt="直接修改" style="zoom:67%;" />

此时远程仓库的 `main` 和 `my-dev` 分支中 `README.md` 的内容分别为：

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

-   使用 `merge` 来合并；
-   使用 `rebase` 来变基。

这两种都需要先将远程 `main` 分支的最新代码拉取到本地，但不合并到本地分支：

```shell
git fetch origin
```

---

第一种使用 `merge` 合并的方式：

```shell
git merge origin/main
```

当使用 `merge` 时，若出现了代码冲突，则自动合并会失败，并提示需要手动解决冲突。

具体步骤如下：

1.  使用 `status` 检查当前冲突的状态；
2.  使用文本编辑器打开存在冲突的文件，并手动解决冲突；
3.  在解决冲突后，使用 `add` 将修改的文件标记为已解决冲突；
4.  使用 `commit` 提交代码。在提交代码时，Git 会自动生成一条合并提交，该提交包含了本地分支修改和远程分支的修改；

---

第二种使用 `rebase` 变基的方式：

```shell
git rebase origin/main
```

当使用 `rebase` 时，若出现了代码冲突，Git 会停止变基操作，并需要手动解决冲突。

具体步骤如下：

1.  前三步与 `merge` 的方式相同；
2.  使用 `rebase --continue` 继续变基操作，并自动应用到后续提交。

由于变基默认会影响到所有的提交，因此在解决冲突的时候会变得十分繁琐，可以使用 `-i` 选项启用交互式变基，选择需要变基的提交。

---

这两种方式的不同在于，`merge` 是将两个分支的修改合并成一个新的提交，并且保留每个分支的提交历史，因此可以保留提交历史，但会导致提交记录变得混乱。而 `rebase` 是将当前分支的修改基于目标分支最新的修改之后，没有产生新的合并提交，因此可以使提交历史更加清晰，但会丢失一部分提交历史。

### 推送代码

在完成开发之后，将本地分支上的代码推送到远程仓库中。

```shell
git push -u origin my-dev
```

此时查看 Github 上的仓库，发现修改已经同步，并且新增了 `my-dev` 分支。

![修改后的仓库](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202305042019318.png)

### 发起合并请求

代码被推送到远程分支后，发起一个合并请求，让此分支合并到主分支上。通常使用代码托管平台（如 GitHub、GitLab 等）提供的功能（如 Pull Request）来发起合并请求，并邀请其他开发人员进行审核和合并操作。

### 清理工作

当远程的 `my-dev` 分支合并到远程的 `main` 分支后，可以将远程与本地的 `my-dev` 分支删除，并将远程的 `main` 分支同步到本地，以保持同步。

```shell
git branch -d my-dev
git push origin -d my-dev
git pull
```

使用 `remote prune` 删除本地仓库中已经不存在的远程分支。这些无效的分支通常是由于远程仓库中的分支已被删除而在本地仍保留所致。

```shell
git remote prune origin
```

这样，本地和远程就又一次保持了同步，并可进行下一次的开发流程。

## 保存进度

有时候会遇到这样一种情况，当在 `dev` 分支进行开发时，有人反馈了一个 Bug，需要紧急切换到另一个分支去修改，但是在 `dev` 分支的工作还没有完成，这时就可使用 `stash` 把当前进度保存起来，然后切换到另一个分支去修改，修改完提交后，再切回 `dev` 分支来恢复之前的进度继续开发。

还有一种情况，当在 `feature/a` 分支的开发完成后，准备在 `feature/b` 分支继续开发，但是进行到一半后才发现忘记开新分支了，依然是在 `feature/a` 上开发，所以需要将修改应用到新分支去，这时也可以使用 `stash` 来完成。

### 保存当前进度

`stash` 会把工作区和暂存区的修改保存起来。执行完后，再运行 `git status`，会发现当前是一个干净的工作区，没有任何改动。

```shell
git stash
```

使用 `stash save`在保存时添加注释：

```shell
git stash save <message>
```

### 查看已保存进度

`stash list` 显示保存进度的列表：

```shell
git stash list
```

### 恢复进度

`stash pop/apply` 恢复指定进度到工作区和暂存区，若不指定则恢复最新的进度：

```shell
# 恢复后会在 stash list 中删除该进度
git stash pop [stash id]

# 恢复后不会删除
git stash apply [stash id]
```

其中 `stash id` 是通过 `stash list` 得到的。

### 删除进度

删除指定保存的进度，若不指定则删除最新的进度：

```shell
git stash drop [stash id]
```

删除所有保存的进度：

```shell
git stash clear
```

## 应用指定提交

`cherry-pick` 一个是在实际开发中十分有用的命令。可以从一个分支中挑选一个或多个提交，并将这些提交应用到当前所在的分支，而合并通常会把两个分支的所有不同之处都合并到一起。

### 使用 cherry-pick

```shell
git cherry-pick <commit>[..<end_commit>]
```

指定的 `commit id` 对应的更改就会应用到当前分支，并作为一个新的提交，这个新的提交是专门为当前分支创建的，与原始分支中的提交是分开的。

### 适用场景

主要用于以下场景：

-   从其它分支挑选特定的修复或功能：若有一个已经修复了特定问题的提交，在不合并整个分支的情况下将该修复应用到其它分支；
-   避免不必要的合并：有时合并一个完整的分支会带来很多不相关的更改；
-   代码审查：在项目中将特定的提交快速应用到生产分支，而不需要等待其它更改通过审查。

### 注意事项

-   解决冲突：和合并操作一样，`cherry-pick` 也可能导致冲突；
-   依赖关系：若一个提交依赖于其它提交，则单独挑选该提交可能会导致问题，需要将依赖的提交都挑选出来。

## 标识前缀

在常见的分支和 commit 消息中，通常使用一些常见的前缀来标识提交的类型。这些前缀并不强制，但可以帮助更好地组织和理解提交历史。

-   `style`：代码风格的变更；
-   `refactor`：重构代码；
-   `fix`：修复 Bug；
-   `feat`：添加新功能；
-   `chore`：构建过程及相关工具的更改；
-   `test`：测试相关的代码；
-   `docs`：更新文档或注释；
-   `perf`：性能优化相关的更改；
-   `config`：更新配置文件；
-   `cleanup`：清理代码、删除无用的文件或代码片段；
-   `init`：初始化项目或模块；
-   `security`：与安全性相关的更改；
-   `deps`：更新依赖项。

```shell
# 创建用于添加功能的新分支
git switch -c feat/xxx

# 用于修复代码格式的提交
git commit -m "style: xxx"
```

