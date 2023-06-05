# 1 前言

总有一些闲着没事干蛋疼的人，整天就是去暴力破解别人的服务器，看着那日志上数不清的 `Failed password for root` 和 `Failed password for invalid user`，真的是有一种哭笑不得的感觉，虽说如果自己安全做得足够好，确实没有什么太大得影响，但还是尽量避免这种情况，所以需要使用一些工具来杜绝这种情况。

[Fail2ban](https://github.com/fail2ban/fail2ban) 是一款入侵防御软件，可以保护服务器免受暴力攻击。Fail2ban 基于 auth 日志文件工作，默认情况下它会扫描所有 auth 日志文件，如 `/var/log/auth.log` 等，并禁止带有恶意标志的 IP，如密码尝试次数过多等。

Fail2ban 由 Python 编写而成，主要配合 iptables 来进行工作。Fail2ban 为各种服务提供了过滤器，如 SSH、Apache、Nginx、Squid、Named、Mysql、Nagios 等。

Fail2ban 能够降低风险，但不能消除风险，这只是服务器防止暴力攻击的安全手段之一，本文以 Debian 为例。

# 2 查看日志

查看登录失败的记录：

```bash
lastb
```

查看暴力破解密码的记录：

```bash
grep "Failed password for root" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -nr | more
```

查看暴力破解用户名的记录：

```bash
grep "Failed password for invalid user" /var/log/auth.log | awk '{print $13}' | sort | uniq -c | sort -nr | more
```

# 3 安装 Fail2ban

由于 Fail2ban 依赖于 Python，需要确保 Python 版本 ≥ 2.6：

```bash
python -V
```

安装 Fail2ban：

```bash
apt -y install fail2ban
```

安装完成后即已开始工作，且已加入开机启动项。

# 4 配置 Fail2ban

默认配置已经能够满足大多数需求，可以不用再做修改。若有特殊需求，则需要修改其配置。

## 修改基本配置

Fail2ban 所有的配置文件保存都在 `/etc/fail2ban/` 中。 主配置文件是 `jail.conf`，它包含一组预定义的过滤器，要修改配置，不能在此文件上修改，只需在同一目录下创建一个名为 `jail.local` 的新配置文件，并根据需求进行修改，修改后的配置会覆盖默认配置。

创建 `jail.conf` 的副本 `jail.local`：

```bash
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

编辑配置文件：

```bash
vim /etc/fail2ban/jail.local
```

配置文件中的 `[DEFAULT]` 部分包含 Fail2ban 最基本的规则，以下是部分默认配置：

```
[DEFAULT]

# 忽略以下IP地址，多个IP用空格分隔
ignoreip = 127.0.0.1/8

# IP被禁的秒数
bantime = 600

# 若同一IP在findtime秒内发生了maxretry次尝试，则会被禁bantime秒
findtime = 600

# 同一IP被禁之前的尝试次数
maxretry = 5
```

## 配置其它服务

Fail2ban 还带有其它预定义的过滤器，用于各种服务，如 SSH、Apache、Nginx、Squid、Named、Mysql、Nagios 等。这些服务的过滤器默认为禁用状态，要启用服务，只需要在对应的区域中添加 `enabled = true` 这一行即可，禁用服务时将 `true` 改为 `false` 或删除这一行即可。

以 Apache 服务为例，在其对应的 `[apache-auth]` 区域中：

```
[apache-auth]
enabled  = true # 要开启过滤器只需要添加这一行
port     = http,https
logpath  = %(apache_error_log)s
```

## 重启 Fail2ban

修改完配置后需要重启服务才能生效：

```bash
service fail2ban restart
```

## 验证规则是否生效

使用 `iptables` 命令来查看 Fail2ban 添加的规则：

```bash
iptables -L
```

通过几次故意登录失败的尝试，查看 Fail2ban 的日志文件：

```bash
cat /var/log/fail2ban.log
```

查看已启用的过滤列表：

```bash
fail2ban-client status
```

查看过滤列表的状态，以 SSH 服务为例：

```bash
fail2ban-client status sshd
```

将已被禁的 IP 解禁，以 SSH 服务为例：

```bash
fail2ban-client set sshd unbanip 192.168.1.1
```

