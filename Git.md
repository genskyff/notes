> 参考：
>
> - [Pro Git](https://git-scm.com/book/zh/v2)

# 1 环境配置

## 安装

### Windows

通过 [Scoop](https://scoop.sh/) 安装：

```shell
scoop install git
```

### Linux

以 Debian 为例：

```shell
apt install -y git
```

## 配置

通过 `git config` 读取和设置配置：

- `--system`：对所有用户都适用的配置
  - Windows：Git 安装目录下的 `etc/gitconfig`
  - Linux： `/etc/gitconfig`

- `--global`：仅对当前用户适用的配置

  - Windows、Linux：`~/.gitconfig`

- `--local`：**默认选项**，仅对当前 Git 仓库适用的配置
  - Windows、Linux：工作区中的 `.git/config`

> `--system` 优先级**最低**，`--local` 优先级**最高**，高优先级会覆盖低优先级中的相同配置。这些配置仅在本地生效，不会推送到远程仓库中去。

### 查看配置

```shell
# 查看所有配置
git config -l

# 查看 local 配置
git config -l --local

# 查看指定配置
git config <key>

# 查看所有配置及其对应配置文件
git config -l --show-origin

# 查看指定配置在哪个配置文件中生效
git config --show-origin <key>
```

> 使用 `-l` 时，会查找所有级别的配置，并以优先级最高的配置为准，相同优先级的同名配置，以最后找到的为准。

### 设置配置

```shell
# 用户信息
git config --global user.email <email>
git config --global user.name <name>

# 凭证管理 - Windows
git config --global credential.helper manager

# 凭证管理 - macOS
git config --global credential.helper osxkeychain

# 凭证管理 - Linux (需要安装 git-credential-oauth)
git config --global credential.helper "cache --timeout 21600"
git config --global --add credential.helper "oauth -device"

# 取消指定配置
git config --unset <key>
```

## 按目录配置

在 `.gitconfig` 中的配置默认全局生效，若想要针对指定目录单独应用配置，如设置不同的用户名，可以在配置文件中使用 `includeIf`：

```
# 其他配置...
[includeIf "gitdir:<dir>/**"]
    path = <dir>/.gitconfig
```

这表示指定目录下的所有子目录都应用 `path` 中指定的 `.gitconfig` 中的配置，并覆盖上层配置。

>   由于 Git 默认按照最后的配置覆盖前面的，因此 `includeIf` 必须放在最后才能生效。

# 2 Git 基础

## 工作区

工作区是某个版本独立提取出来的内容，即磁盘上能直接看到的目录，也是实际编写代码所用到的目录。其中有一个隐藏目录 `.git`，这个不算作工作区的一部分，而是 Git 的版本库。

## 暂存区

暂存区是一个文件，保存了下次将要提交的信息，保存在 `.git` 目录中。

## 版本库

即 `.git` 目录，又称**仓库**，是 Git 用来保存项目的元数据和对象数据库的地方。这个目录里面的所有文件都可以被 Git 管理起来，每个文件的创建、修改、删除等操作都能被跟踪，任何时刻都可以追踪历史，或在将来某个时刻还原。Git 的版本库中存了很多东西，其中最重要的就是暂存区，还有 Git 自动创建的第一个分支 `main`，以及指向 `main` 的指针 `HEAD`。

## 文件状态

**工作区**的文件有两种状态：

- 已跟踪：指被纳入了版本控制的文件，这些文件具有 Git 状态：已修改、已暂存、已提交
- 未跟踪：除已跟踪外的所有其他文件

## Git 状态

被纳入版本控制的文件具有三种状态：

- 已修改：修改了文件，但还未标记当前版本，即未保存到暂存区

- 已暂存：对已修改文件的当前版本做了标记，但还未提交到仓库

- 已提交：所有被标记了版本的文件都已从暂存区保存到了仓库

若自上次提交后，做了修改但还没有放到暂存区，就是已修改状态；若做了修改并已放入暂存区，就属于已暂存状态；若仓库中保存着特定版本的文件，就属于已提交状态。

# 3 Git 命令

## 克隆

`clone` 用于克隆仓库默认分支，可指定分支和重命名：

```shell
git clone [-b <branch>] <repo> [name]
```

`--depth` 用于指定克隆历史提交记录的数量：

```shell
# 只克隆最新的提交
git clone --depth 1 <repo>
```

## 新建

进入目录，将其初始化为一个 Git 仓库：

```shell
git init
```

初始化成功后该目录下会多出一个隐藏的 `.git` 目录，这是 Git 用来跟踪管理仓库的，不需要手动修改。

## 提交

`add` 会将未跟踪文件变为已跟踪，并将已跟踪文件添加到暂存区。

```shell
# 跟踪或添加文件
git add <file>

# 递归地跟踪或添加目录下的所有文件
git add <dir>
```

`-p` 以交互式的形式把修改添加到暂存区：

```shell
git add -p [file]
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
git commit --amend [-m <message> | --no-edit]
```

若自上次提交以来还未做任何修改则覆盖的只是提交信息。

`--allow-empty` 和 `--allow-empty-message` 可以在不进行修改的情况下添加一个新的提交，后者可以没有提交信息，通常用于测试：

```shell
git commit --allow-empty -m "[skip ci]"
```

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

- `?`：未跟踪
- `M`：已修改
- `A`：已添加到暂存区
- `D`：已删除
- `R`：已重命名
- `U`：有冲突

## 忽略文件

有些文件无需纳入 Git 的管理，也不希望出现在未跟踪文件列表。可以创建一个 `.gitignore` 文件，列出要忽略的文件的模式。

```
# 忽略所有的 .a 文件
*.a

# 但跟踪所有的 lib.a，即使在前面忽略了 .a 文件
!lib.a

# 只忽略当前目录下的 TODO 文件，而不忽略 subdir/TODO
/TODO

# 忽略任何目录下名为 build 的目录
build/

# 忽略 doc/notes.txt，但不忽略 doc/server/arch.txt
doc/*.txt

# 忽略 doc/ 目录及其所有子目录下的 .pdf 文件
doc/**/*.pdf
```

工作目录的根目录下有一个 `.gitignore` 文件，它递归地应用到整个仓库中。而在其子目录下也可以有额外的 `.gitignore` 文件，但只作用于其所在的目录中，且子目录规则的优先级大于父级目录。

> 所有 `.gitignore` 文件规则会合并生效。

若被忽略的文件在添加规则前已经被跟踪，则需要移除：

```shell
git rm --cached <file>
```

## 提交区间

除了指定单个提交，还可以指定区间内的提交。

### 双点

`A..B` 语法可以指定在 B 分支中但不在 A 分支中的提交，即**差集**：

```shell
git log A..B
```

### 三点

`A...B` 语法可以指定被 A 或 B 包含但不同时包含的提交，即**对称差集**：

```shell
git log A...B
```

### 多点

当需要两个以上分支才能确定区间时，可以使用多点语法，其中 `^` 或 `--not` 表示不包含的该提交的分支：

```shell
# 三者等价
git log A..B
git log ^A B
git log B --not A
```

利用该语法，可以查询超过两个引用，如查询所有被 A 和 B 包含但不被 C 包含的提交：

```shell
# 两者等价
git log A B ^C
git log A B --not C
```

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
git diff --stat <commit> [-- <file>]
```

简短统计信息使用 `--shortstat`。

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

`clean` 从工作区将未跟踪文件删除，需要使用 `-f`

```shell
git clean -f [file]
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

- 用途：用于撤销工作区和暂存区的更改
- 安全性：相对安全，不修改提交历史
- 影响：只影响工作区和暂存区，不影响提交历史
- 常见用法
  - 撤销工作区的更改：`git restore <file>`
  - 撤销暂存区的更改：`git restore --staged <file>`
  - 把文件恢复到指定提交：`git restore --source <commit> <file>`
  - 同时撤销暂存区和工作区：`git restore --staged --worktree <file>`

### reset

- 用途：用于重置 HEAD 指针到指定提交，可选地更改暂存区和工作区
- 安全性：不安全，会修改提交历史，`--hard` 还会丢失工作区和暂存区
- 影响：始终移动 HEAD，根据参数影响暂存区和工作区
- 常见用法
  - 软重置（只移动 HEAD）：`git reset --soft <commit>`
  - 混合重置（默认，移动 HEAD 并重置暂存区）：`git reset <commit>`
  - 硬重置（移动 HEAD，重置暂存区和工作区）：`git reset --hard <commit>`
  - 撤销暂存（不移动 HEAD）：`git reset <file>`

### revert

- 用途：通过创建新提交来撤销指定提交的更改
- 安全性：最安全，保留完整的提交历史
- 影响：创建新提交，修改工作区内容，但保留所有历史记录
- 常见用法
  - 撤销最新提交：`git revert HEAD`
  - 撤销指定提交：`git revert <commit>`
  - 撤销多个提交：`git revert <range>`
  - 不自动提交（只修改工作区和暂存区）：`git revert -n <commit>`

> `revert` 可能导致冲突，需要手动解决。

## 提交历史

`log` 用来查看提交历史：

```shell
git log <branch> --oneline --graph
```

- 可选指定分支的历史；
- `--oneline` 以一行的形式简洁输出结果
- `--graph` 以图形形式显示提交历史，包括分支历史
- `--abbrev-commit` 将 `commit id` 缩短显示
- `--reverse` 倒序显示提交历史

`-p` 可以显示每次提交的差异， `-<n>` 可以指定显示条数：

```shell
git log -p -2
```

`--stat` 显示每次提交的文件修改统计信息：

```shell
git log --stat
```

`--since` 和 `--until` 可以指定提交日期：

```shell
git log --since="2025-01-01 00:00:00" --until="2025-02-01 23:59:59"
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

- **临时查看历史提交**：要查看或测试历史中的某个特定提交时，但又不想离开当前的分支
- **进行实验性更改**：HEAD 在分离状态下，可以进行修改而不影响任何分支
- **构建临时任务**：基于特定的提交进行构建或运行一些脚本，而不想改变当前分支的状态

若不想临时切换整个分支，只是查看历史提交中的特定文件内容，可以使用 `show`：

```shell
git show <commit>:<file>
```

# 4 分支管理

每次提交，Git 都把它们串成一条时间线，这条时间线就是一个分支。当只有一条分支时，默认为 `main` 分支。`HEAD` 不是指向提交，而是指向 `main`，而 `main` 才指向提交，因此 `HEAD` 指向的是当前分支，可以将当前分支的别名看作 `HEAD`。

## 查看

`branch` 查看本地分支列表：

```shell
git branch
```

`-v` 查看所有本地分支最后一次提交：

```shell
git branch -v
```

`-a` 查看所有本地和远程分支：

```shell
git branch -a
```

`switch` 切换分支：

```shell
git switch <branch>

# 切换到上一个分支
git switch -
```

## 创建

`branch` 创建分支：

```shell
git branch <name>
```

这会在当前所在的提交对象上创建一个指向所创建分支的指针，但此时 `HEAD` 指向的还是当前分支。该命令仅仅创建一个新分支，并不会自动切换到新分支中去。

`checkout -b` 可以创建并切换分支：

```shell
git checkout -b <name>
```

由于 `checkout` 承担了太多功能，对于分支操作一般使用 `switch`，`-c` 表示创建并切换：

```shell
git switch -c <name>
```

这样 `HEAD` 就指向指定的分支了。

在切换分支时，工作区里的文件会被改变。可以在不同分支间不断地来回切换和工作，并在合适的时候合并。

## 合并

`merge` 合并指定分支到当前分支：

```shell
git merge <branch>
```

Git 对合并有多种策略，其中常见的为：

`--ff`：**默认策略**。当合并两个分支时，若顺着一个分支走下去能够到达另一个分支，那么 Git 在合并两者的时候，只会简单的将指针向前推进，即快进合并。若不能直接到达，则会创建一个合并提交。

```
# 场景1：可以快进
本地: A---B
远程: A---B---C---D

# 结果：快进到远程最新提交
本地: A---B---C---D

# 场景2：不能快进
本地: A---B---E
远程: A---B---C---D

# 结果：创建合并提交
本地: A---B---E---M
          \     /
           C---D
```

`--no-ff`：总是创建合并提交，即使可以快进合并。

```
# 即使可以快进，也会创建合并提交
本地: A---B
远程: A---B---C---D

# 结果：创建合并提交
本地: A---B-------M
          \     /
           C---D
```

用途：

- 保持清晰的分支历史
- 便于追踪功能分支的合并点
- 方便回滚整个功能

`--ff-only`：只允许快进合并，否则拒绝操作。

```
# 场景1：可以快进
本地: A---B
远程: A---B---C---D

# 结果：成功快进
本地: A---B---C---D

# 场景2：不能快进
本地: A---B---E
远程: A---B---C---D

# 结果：拒绝合并，报错
error: Not possible to fast-forward, aborting.
```

用途：

- 保持线性历史
- 避免意外的合并提交
- 常用于要求 rebase 工作流的团队

`--squash`：上述几种合并策略都会把另一个分支上所有的提交都保留，而 `squash` 则会把这些提交压缩为一个新提交，这样当前分支上的提交就会比较简洁，合并历史呈线性。但 `squash` 操作完后还需要手动执行 `git commit` 以在当前分支上创建这个新的压缩提交。

```
# 合并前
main:    A---B
feature:      \---C---D---E

# 合并后（历史中只有：A, B, F（C, D, E 被压缩到了 F 中）
main:    A---B---F
feature:      \---C---D---E
```

### 解决冲突

当在两个不同的分支中，对同一个文件的同一个部分进行了不同的修改，在进行合并时就会产生冲突。此时 Git 做了合并，但没有自动地创建一个新的合并提交，并会暂停下来，等待手工解决合并冲突。

具体步骤如下：

1.  使用 `status` 检查当前冲突的状态
2.  使用文本编辑器打开存在冲突的文件，并手动解决冲突
3.  在解决冲突后，使用 `add` 将修改的文件标记为已解决冲突
4.  使用 `commit` 提交代码

在提交代码时，Git 会自动生成一条合并提交，该提交包含了本地分支修改和远程分支的修改。

### 查看文件冲突时的信息

当 `rerere.enabled` 为 `true` 时，合并时 Git 会使用缓存的解决方法，但有时也需要查看冲突信息。

```shell
git checkout --conflict=merge <file>
```

## 变基

`rebase` 将指定分支（默认为 HEAD）变基到指定上游：

```shell
git rebase <upstream> [branch]
```

### 解决冲突

当使用 `rebase` 时，若出现了冲突，则变基会失败，需要手动解决冲突。

具体步骤如下：

1.  前三步与 `merge` 的方式相同
2.  使用 `rebase --continue` 继续变基操作，并自动应用到后续提交

由于变基默认会影响到所有的提交，因此在解决冲突的时候会变得十分繁琐，可以使用 `-i` 选项启用交互式变基，选择需要变基的提交。

```shell
git rebase -i <range>
```

### 转移基底

使用 `--onto` 可以把一段提交从一个基底转移到另一个基底上。

```shell
git rebase --onto <newbase> <upstream> [branch]
```

### 合并 Vs. 变基

`merge` 是将两个分支的修改合并成一个新的提交，并且保留每个分支的提交历史，因此可以保留提交历史，但会导致提交记录变得混乱。而 `rebase` 是将当前分支的修改基于目标分支最新的修改之后，没有产生新的合并提交，因此可以使提交历史更加清晰，但会丢失一部分提交历史。

> 若发生冲突，`merge` 和 `rebase` 都可以用 `--abort` 来中止。

## 重命名与删除

`branch -m` 可以重命名当前分支：

```shell
git branch -m <name>
```

- `-m` 用于重命名当前分支。若分支名已经存在，则会执行失败
- `-M` 用于强制重命名当前分支。若分支名已存在，则会丢弃已有的分支并重命名当前分支

`branch -d` 可以删除分支：

```shell
git branch -d <branch>
```

- `-d` 用于删除已经合并到当前分支的指定分支。若指定的分支还未被合并到当前分支，则会执行失败
- `-D` 用于强制删除指定分支，即使该分支还未被合并到当前分支

# 5 远程仓库

## 查看

`remote` 查看远程仓库：

```shell
git remote -v
```

`-v` 会显示远程仓库拉取和推送对应的 URL。

> Git 远程仓库默认名为 `origin`。

`remote show` 会列出远程仓库与跟踪分支的信息：

```shell
git remote show <remote>
```

## 添加

添加新的远程仓库，同时指定一个别名，可以使用别名来代替远程仓库的路径。

```shell
git remote add <remote> <repo>
```

> 当使用 `clone` 克隆了一个远程仓库时，会自动将其添加为远程仓库并默认以 `origin` 为别名。

## 修改

若远程分支修改了名字，也需要在本地修改对应的 URL。

```shell
git remote set-url <remote> <repo>
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

> `pull` 实际上是 `fetch` 和 `merge` 的组合。

## 推送

`push` 将当前分支推送到远程对应的分支：

```shell
git push [remote] [branch]
```

如将本地的 `main` 分支推送到远程的 `main` 分支：

```shell
git push -u [remote] main
```

首次推送时需要使用 `-u` 将本地和对应的远程分支相关联，之后就可以直接使用 `push` 推送。

> 若使用了 `--amend`、`rebase` 之类的操作，推送时可能会失败，这时可以使用 `-f` 选项来强制推送。但注意，若在推送时有其他人在相同分支也进行了提交，则会**覆盖别人的提交**。除非提交的分支只有自己在使用，否则谨慎使用该选项。

若本地分支名和远程分支名不同，如本地分支为 `dev`，远程分支为 `main`，则需要指定本地分支和远程分支。

```shell
git push [remote] dev:main
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
git tag -l "v1.*"
```

## 创建

发布一个版本时，通常先在仓库中打一个标签，以确定打标签时刻的版本。

Git 支持两种标签：

- 轻量标签：某个特定提交的引用

- 附注标签：存储的完整对象，可以被校验并包含一系列信息

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

使用 `-a` 创建附注标签，`-m` 指定标签信息：

```shell
git tag -a v1.0 -m "version 1.0"
```

`show` 查看附注标签会显示更多信息：

```shell
git show v1.0
```

### 后期打标签

要对过去的版本打标签，需要附上 `commit id`：

```shell
git tag v0.9-l <commit>
```

标签总是和某个 `commit` 关联。若这个 `commit` 既出现在 `main` 分支，又出现在其他分支，那么在这两个分支上都可以看到这个标签。

## 共享

默认情况下，`push` 命令并不会推送标签到远程仓库服务器上，在创建完标签后必须显式地推送标签。

```shell
git push <remote> <tag>
```

`--tags` 一次性推送所有标签：

```shell
git push <remote> --tags
```

> `--tags` 不区分轻量标签和附注标签。

从远程仓库更新标签：

```shell
git fetch --tags
```

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

有时项目中需要用到另一个项目的东西，如第三方库，但不想直接复制粘贴，而是分别当作独立项目，这样跟踪上游就很容易。这时可以使用 Git 的子模块功能，可以将一个 Git 仓库作为另一个 Git 仓库的子目录，并保持提交独立。

## 添加子模块

添加要跟踪的 Git 仓库，并可重命名：

```shell
git submodule add <repo> [name]
```

添加后，此时 `git status` 状态会显示新增了一个与子模块同名的目录和一个隐藏的 `.gitmodules` 文件。

`.gitmodules` 保存了项目 URL 与已经拉取的本地目录之间的映射，若有多个子模块，则有多条记录。

```
[submodule "mysub"]
    path = mysub
    url = https://github.com/<username>/mysub
```

Git 并不会跟踪子模块的具体变更，当子模块更新后，Git 会把子模块整体当作一个可以添加的变更。

## 克隆含有子模块的仓库

当克隆一个仓库时，若该仓库含有子模块，则默认不会把子模块也克隆，而是一个空目录。

要检出子模块的数据，还需要进行初始化和更新：

```shell
git submodule init
git submodule update

# 等价
git submodule update --init
```

通过 `--recurse-submodules` 在克隆和检出时时递归处理嵌套的子模块：

```shell
git clone --recurse-submodules <repo>
git submodule update --init --recurse-submodules
```

# 8 Git 进阶

## 保存进度

有时候会遇到这样一种情况，当在 `dev` 分支进行开发时，有人反馈了一个 Bug，需要紧急切换到另一个分支去修改，但是在 `dev` 分支的工作还没有完成，这时就可使用 `stash` 把当前进度保存起来，然后切换到另一个分支去修改，修改完提交后，再切回 `dev` 分支来恢复之前的进度继续开发。

还有一种情况，当在 `feat/a` 分支的开发完成后，准备在 `feat/b` 分支继续开发，但是进行到一半后才发现忘记开新分支了，依然是在 `feat/a` 上开发，所以需要将修改应用到新分支去，这时也可以使用 `stash` 来完成。

### 保存当前进度

`stash` 会把工作区和暂存区的修改保存起来。执行完后，再运行 `git status`，会发现当前是一个干净的工作区，没有任何改动。

```shell
git stash [-m <message>]
```

使用 `-u` 将未跟踪的文件也一起保存：

```shell
git stash -u
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

## 工作树

`stash` 虽然可以提供临时的上下文切换，在不同的分支上工作，但并不提供并行工作能力。当确实需要在两个分支上同时工作，或者不想使用 `stash` 来保存修改然后频繁的切换上下文时，可以使用 `worktree`。

`worktree` 可以让一个仓库同时拥有多个工作树，每个工作树都可以检出不同的分支或提交。默认情况下，所有仓库都拥有一个主要工作树，即当前仓库。

### 基本使用

```shell
# 查看当前所有工作树
git worktree list

# 添加工作树
git worktree add <dir> <branch>

# 删除工作树
git worktree remove <dir>
```

### 清理工作树

当并不是通过 `worktree remove` 而是直接手动删除时，此时工作树实际上已经没有了，那么可以通过 `worktree prune` 来清理。

```shell
git worktree prune
```

### 锁定工作树

`worktree lock` 用于锁定一个工作树，防止被 `worktree remove` 或 `worktree prune` 意外删除。用于表示该工作树用于特定目的，不应该被干扰，但依然可以检出分支、应用提交等操作。

```shell
git worktree lock [--reason <string>] <dir>
```

锁定后可通过 `worktree unlock` 来解锁：

```shell
git worktree unlock <dir>
```

>   主要工作树无法被锁定。

### 工作树与直接复制文件夹的区别

共享 Git 数据库

- 所有工作树共享同一个 `.git` 目录和对象数据库，不会复制所有 Git 历史
- 复制文件夹会复制所有 `.git` 数据，占用大量额外空间

自动追踪引用

- Git 会自动追踪所有工作树中的分支状态，防止在多个位置检出同一个分支
- 手动复制文件夹后，Git 不知道有多个副本，可能导致冲突

简化操作

- 创建工作树时会自动检出指定分支，无需额外设置
- 完成后可以用一个命令清理，包括相关引用

## 应用指定提交

`cherry-pick` 一个是在实际开发中十分有用的命令。可以从一个分支中挑选一个或多个提交，并将这些提交应用到当前所在的分支，而合并通常会把两个分支的所有不同之处都合并到一起。

### 使用 cherry-pick

```shell
git cherry-pick <range>
```

指定的提交对应的更改就会应用到当前分支，并作为一个新的提交，这个新的提交是专门为当前分支创建的，与原始分支中的提交是分开的。

### 适用场景

主要用于以下场景：

- 从其他分支挑选特定的修复或功能：若有一个已经修复了特定问题的提交，在不合并整个分支的情况下将该修复应用到其他分支
- 避免不必要的合并：有时合并一个完整的分支会带来很多不相关的更改
- 代码审查：在项目中将特定的提交快速应用到生产分支，而不需要等待其他更改通过审查

### 注意事项

- 解决冲突：与合并操作相同，`cherry-pick` 也可能导致冲突
- 依赖关系：若一个提交依赖于其他提交，则单独挑选该提交可能会导致问题，需要将依赖的提交都挑选出来

## 打包

大部分时候都是通过网络来进行 Git 数据传输，如推送和拉取。但当网络条件受限，或者没有远程服务器的权限，但又需要将提交传给别人或者从别人那里接收提交（如电子邮件或 U 盘等），此时就可以通过使用 Git 的打包功能。

打包本质上是将需要传输的数据打包成了一个二进制文件，之后就可以从该文件中获取 Git 数据。

### 创建包

打包仓库：

```shell
git bundle create <bundle> <branch>
```

打包最近 n 个提交：

```shell
git bundle create <bundle> -<n> HEAD
```

打包指定区间的提交：

```shell
git bundle create <bundle> <range>
```

检查一个文件是否是合法的 Git 包：

```shell
git bundle verify <bundle>
```

### 应用包

创建了包后，该包可以当作一个以文件形式存在的 Git 仓库，可以对其进行 Git 操作。

```shell
git clone <bundle> [name]
git pull <bundle> <branch>
```

如将其作为一个远程仓库：

```shell
git remote add offline <bundle>
git fetch offline
git merge offline/<branch>
```

## 补丁

除了打包仓库数据外，还可以通过补丁的形式进行应用。该方式更轻量级，可看作把指定提交的数据打包成二进制文件，然后在另一个仓库中应用这些提交。

### 生成补丁

导出未推送的提交：

```shell
git format-patch origin
```

导出最近 n 个提交：

```shell
git format-patch -<n>
```

导出指定区间的提交：

```shell
git format-patch <range>
```

导出时会为每个提交都创建一个前缀为编号，后缀为 `.patch` 的文件，越早的提交，编号越小，默认编号从 `1` 开始。

生成补丁时可指定存放的目录：

```shell
git format-patch origin -o <dir>
```

### 应用补丁

从对方那里拿到补丁后，可以通过 `apply` 或 `am` 来应用补丁。

`apply` 主要用于代码变更，不包含提交信息：

```shell
git apply <patch>
```

`am` 会按顺序应用补丁，并保留提交信息：

```shell
git am <patch>
```

与合并和变基类似，应用补丁同样可能会有冲突，可通过 `--abort` 或 `--continue` 来中止或解决冲突后继续应用。

## 二分查找

当发现错误时，想要定位是哪次提交引入的错误，传统方式可以不断地向前检出每个提交，或使用二分查找的方式定位。对于这种情况，可以使用 `bisect` 来定位错误。

首先通过 `start` 来开始进行二分查找，并指定范围。

```shell
git bisect start <range>
```

设范围内有 100 次提交，从旧到新编号为 1 ~ 100，此时仓库就会切换到范围的中间那次提交，即 51，然后判断当前代码有无问题。

- 有问题，代表错误出现在 1 ~ 50，执行 `git bisect bad`，会定位到中间，即 25
- 没问题，代表错误出现在 52 ~ 100，则执行 `git bisect good`，会定位到 76

这个过程不断的重复下去，直到出现：

```
<commit> is the first bad commit
```

就代表找到了**当前范围内**第一次引入错误的那次提交，然后就可以检查代码确定原因。

可以在查找过程查看已经完成的过程：

```shell
git bisect log
```

若查找过程中发现当前定位的提交引起的错误是由其他问题引起的，则可以跳过：

```shell
git bisect skip
```

最后退出查找：

```shell
git bisect reset
```

# 9 使用 Github

## 生成密钥

通过 OpenSSH 生成密钥对：

```shell
ssh-keygen -t ed25519 [-C <message>]
```

`-C` 用于添加注释方便管理 SSH 密钥，并不会用于加密或验证。该命令会在 `~/.ssh` 目录生成 `id_ed25519` 和 `id_ed25519.pub` 两个文件，`id_ed25519` 是私钥，`id_ed25519.pub` 是公钥。

设置权限：

```shell
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
chmod 644 ~/.ssh/config
chmod 644 ~/.ssh/authorized_keys
```

## 关联 Github

在 [Github](https://github.com/settings/keys) 上添加自己的公钥，即可把本地仓库推送到 Github 的远程仓库中去。

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

## 配置签名

Git 支持使用 GPG 和 SSH 密钥为提交和标签添加数字签名。签名通过公钥加密技术验证提交者的身份，确保提交未被篡改。签名后的提交在 `git log` 中会显示签名状态（如 Good "git" signature），在 Github 上的提交也会显示 **Verified** 标识。

常用于：

-   **开源项目**：验证贡献者身份
-   **企业环境**：确保代码来源可信
-   **合规性**：满足安全审计要求

这里以 SSH 签名作为例子，生成一个新的密钥对，与上面用于 Github 认证的密钥类似，但是作用不同。

然后修改 Git 配置：

```shell
# 公钥文件路径
git config --global user.signingkey ~/.ssh/<pubkey>

# 签名格式为 SSH
git config --global gpg.format ssh

# 指定受允许签名者文件
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers

# 每次提交自动签名
git config --global commit.gpgsign true
```

添加条目到受允许签名者文件：

```shell
echo "<email> $(cat ~/.ssh/<pubkey>)" >> ~/.ssh/allowed_signers
```

`allowed_signers` 文件列出可信公钥及其关联邮箱，用于验证签名。因为 Git 需要一个文件来映射公钥到可信身份（将公钥映射到邮箱）。这不会影响 GitHub 上的 Verified 显示，但会影响本地日志查看。

配置完成后测试签名是否生效：

```shell
git commit --allow-empty -m "Test SSH signed commit"
git log --show-signature -1
```

然后同样在 Github 上添加 SSH keys，但是 Key type 需要选择 **Signing Key**。这样推送后就会在签名的提交上显示一个 Verified 标识。

# 10 Git 协作

个人项目通常直接使用 `add`、`commit`、`push` 这三步就足够了，但是在一个大项目中，通常需要遵循一些协作规范，以便多个开发人员可以协同工作，避免代码冲突和其他问题。

一些大型项目通常会采用分支管理的策略，使得不同的开发人员可以在自己的分支上进行开发和测试，而不会影响主分支的稳定性。

## 协作流程

Git 协作的具体实施可能因项目而异，但对于大多数情况而言，下面的工作流通常足够。

> 以 Github 为例，设有一个多人协作项目 `demo-git`。

### 创建仓库

首先在 Github 上创建一个新项目。

<img src="https://raw.githubusercontent.com/genskyff/image-hosting/main/images/20250913142204842.png" alt="创建一个新项目" style="zoom:67%;" />

此时该项目仅有一个 `README.md` 文件。

![创建好的项目](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/20250913142359812.png)

### 克隆仓库

复制项目的 URL，并克隆到本地，然后进入该目录：

```shell
git clone https://github.com/<username>/demo-git.git
cd demo-git
```

此时默认位于项目的主分支 `main` 上。

### 同步远程仓库

除了首次克隆外，之后的开发流程中，在进行一次新的修改之前，都需要同步远程仓库的代码：

```shell
git pull
```

### 创建分支

然后在本地创建一个 `dev` 分支并切换过去：

```shell
git switch -c dev
```

### 进行开发

在 `README.md` 中增加一行：

```shell
echo "locally modified" >> README.md
```

然后进行提交：

```shell
git commit -am "docs: locally modified"
```

### 再次同步远程仓库

这里直接在 Github 上的 `main` 分支直接修改 `README.md` 文件，以模拟本地提交后，远程也发生了新的提交。

![远程修改](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/20250913143210922.png)

此时远程仓库的 `main` 和 `dev` 分支中 `README.md` 的内容分别为：

`main` 分支，**文件：README.md**

```markdown
# demo-git

remotely modified
```

`dev` 分支，**文件：README.md**

```markdown
# demo-git

locally modified
```

因为本地的 `dev` 分支原本是基于没有新增的那一行的 `main` 分支修改的，此时本地提交后发现远程 `main` 分支有新的提交，因此在进行向远程推送前，需要先进行同步，并解决冲突。

同步有两种方式：

- 使用 `merge` 来合并
- 使用 `rebase` 来变基

这两种都需要先将远程 `main` 分支的最新代码拉取到本地：

```shell
git fetch origin main
```

### 推送代码

在完成开发之后，将本地分支上的代码推送到远程仓库中。

```shell
git push -u origin dev
```

此时查看 Github 上的仓库，发现修改已经同步，并且新增了 `dev` 分支。

![修改后的仓库](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/20250913144522657.png)

### 发起合并请求

代码被推送到远程分支后，发起一个合并请求，让此分支合并到主分支上。通常使用代码托管平台提供的功能（如 Pull Request）来发起合并请求，并邀请其他开发人员进行审核和合并操作。

### 清理工作

当远程的 `dev` 分支合并到远程的 `main` 分支后，可以将远程与本地的 `dev` 分支删除，并将远程的 `main` 分支同步到本地，以保持同步。

```shell
git switch main
git pull
git branch -d dev
git push origin -d dev
```

使用 `remote prune` 删除本地仓库中已经不存在的远程分支。这些无效的分支通常是由于远程仓库中的分支已被删除而在本地仍保留所致。

```shell
git remote prune origin
```

这样，本地和远程就又一次保持了同步，并可进行下一次的开发流程。

## 提交规范

关于 Git 提交的最佳实践，可参考 [这篇文章](https://medium.com/@saeid/10-essential-practices-for-better-git-commits-and-why-they-matter-3cfc420bf53e)。具体的约定提交规范，可参考 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/)。
