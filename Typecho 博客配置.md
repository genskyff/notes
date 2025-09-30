>   环境：Debian

# 1 工具准备

首先要有一台 VPS。

- 使用 [Xshell](https://www.netsarang.com/download/) 来进行远程登录（SSH）

- 使用 [Xftp](https://www.netsarang.com/download/) 来进行文件传输（SFTP）

# 2 部署环境

要安装博客系统，首先需要安装 LNMP 环境，这里使用的是 [LNMP 一键安装包](https://lnmp.org/)。

具体安装过程参考 [LNMP 安装步骤](https://lnmp.org/install.html)。

安装完成后需要添加虚拟主机，并开启 HTTPS，具体参考 [LNMP 虚拟主机配置步骤](https://lnmp.org/faq/lnmp-vhost-add-howto.html)。

由于这里开启了 SSL，需要开启 301 重定向。

编辑 Nginx 配置文件：

```bash
vim /usr/local/nginx/conf/vhost/域名.conf
```

在监听 `80` 端口的 `server` 项中增加：

```
if ($scheme = http) {
    return 301 https://$server_name$request_uri;
}
```

如果出现 404 页面，需设置 `php-pathinfo`，把上述文件中的：

```
include enable-php.conf;
```

替换为：

```
include enable-php-pathinfo.conf;
```

最后重启 Nginx 服务：

```bash
/etc/init.d/nginx restart
```

接着访问域名，如果能够正常访问则表示安装成功。

## 修改 MySQL 默认字符编码

由于 MySQL 默认为 `utf8` 编码，此编码在 MySQL 中默认为 3 字节，不能显示 3 字节以上的字符，如 emoji 表情等，所以需要改成 `utf8mb4` 编码，该编码为 MySQL 特有编码。

编辑 MySQL 配置文件：

```bash
vim /etc/my.cnf
```

在其中子项里修改或增加：

```
[client]
default-character-set = utf8mb4

[mysqld]
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4

[mysqld_safe]
default-character-set = utf8mb4
```

接着在 MySQL 命令行中查看使用的字符编码：

```mysql
SHOW VARIABLES WHERE Variable_name LIKE 'character\_set\_%' OR Variable_name LIKE 'collation%';

+--------------------------+--------------------+
| Variable_name            | Value              |
+--------------------------+--------------------+
| character_set_client     | utf8mb4            |
| character_set_connection | utf8mb4            |
| character_set_database   | utf8mb4            |
| character_set_filesystem | binary             |
| character_set_results    | utf8mb4            |
| character_set_server     | utf8mb4            |
| character_set_system     | utf8               |
| collation_connection     | utf8mb4_general_ci |
| collation_database       | utf8mb4_unicode_ci |
| collation_server         | utf8mb4_unicode_ci |
+--------------------------+--------------------+
```

若已经有 Typecho 的表存在，则需要转换字符编码：

```mysql
alter table typecho_comments convert to character set utf8mb4 collate utf8mb4_unicode_ci;
alter table typecho_contents convert to character set utf8mb4 collate utf8mb4_unicode_ci;
alter table typecho_fields convert to character set utf8mb4 collate utf8mb4_unicode_ci;
alter table typecho_metas convert to character set utf8mb4 collate utf8mb4_unicode_ci;
alter table typecho_options convert to character set utf8mb4 collate utf8mb4_unicode_ci;
alter table typecho_relationships convert to character set utf8mb4 collate utf8mb4_unicode_ci;
alter table typecho_users convert to character set utf8mb4 collate utf8mb4_unicode_ci;
```

最后重启 MySQL 服务：

```bash
/etc/init.d/mysql restart
```

# 3 安装 Typecho

目前的博客系统有很多，但 Typecho 和 WordPress 相比，是一种轻量级的博客系统，非常适合个人使用，具体描述参见其 [官方网站](https://typecho.org/)。

设网站目录在 `/home/wwwroot/域名`，依次执行：

```bash
cd /home/wwwroot/域名
wget https://github.com/typecho/typecho/releases/latest/download/typecho.zip
unzip typecho.zip
rm -f typecho.zip
```

接着访问域名，按照提示安装即可。

## 字符集

若没有设置 Typecho 字符编码为 `utf8mb4`，则需要手动修改。

编辑 Typecho 配置文件：

```bash
vim /home/wwwroot/域名/config.inc.php
```

找到：

```php
'charset' => 'utf8'
```

把 `utf8` 替换为 `utf8mb4` 即可。

## 安全性

在 Typecho 配置文件中，找到：

```php
define('__TYPECHO_ADMIN_DIR__', '/admin/');
```

把 `/admin/` 这个参数中的 `admin` 字符串改为其他的即可，然后把同目录下的 `admin` 文件夹重命名为相同的。

### 全站开启 HTTPS

在 Typecho 配置文件中追加：

```php
define('__TYPECHO_SECURE__', true);
```

接着编辑 Typecho 主题配置文件：

```bash
vim /home/wwwroot/域名/usr/themes/主题文件夹/component/comments.php
```

在其中搜索：

```php
$this->commentUrl()
```

将其替换为：

```php
echo str_replace("http", "https", $this->commentUrl())
```

# 4 其他配置

## 主题

至此，Typecho 博客系统基本已经搭好，可以正常使用了，但是自带的主题太丑，于是我换成了付费主题 [handsome](https://www.ihewro.com/archives/489/)，也可以去找其他的免费的主题。

## 插件

Typecho 和 WordPress 一样也有功能丰富插件，在安装好主题以后，我装了 [SmartSpam](http://www.yovisun.com/archive/typecho-plugin-smartspam.html) 用来过滤一些垃圾评论，[Mailer](https://github.com/AlanDecode/Typecho-Plugin-Mailer) 用来收发邮件评论，[Sticky](https://github.com/typecho-fans/plugins/releases/download/plugins-S_to_Z/Sticky.zip) 用来置顶文章。

## 数据库密码修改

若修改了数据库密码，则 Typecho 也需要修改，在 Typecho 配置文件中，找到：

```php
'password' => 'passwd'
```

把 `passwd` 这个参数改为修改后的数据库密码即可。
