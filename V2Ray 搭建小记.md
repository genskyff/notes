# 1 前言

Project V 是包含一系列网络工具的平台，其内核 V2Ray 是一个极其优秀的代理工具。

以下摘自它的的官方介绍：

> - 多入口多出口：一个 V2Ray 进程可并发支持多个入站和出站协议，每个协议可独立工作；
> - 定制化路由：入站流量可按配置由不同地出口发出。轻松实现按区域或按域名分流，以达到最优的网络性能；
> - 多协议支持：V2Ray 可同时开启多个协议支持，包括 Socks、HTTP、Shadowsocks、Trojan、Vmess、VLESS 等。每个协议可单独设置传输载体，比如 TCP、mKCP、QUIC、gPRC 和 WebSocket 等；
> - 隐蔽和安全：V2Ray 的节点可以伪装成正常的网站（HTTPS），将其流量与正常的网页流量混淆，以避开第三方干扰，并提供数据包伪装和重放保护等功能；
> - 负载均衡：入站流量按照探测策略和加权算法自动分发到最合适的出口；
> - 多平台支持：原生支持所有常见平台，如 Windows、macOS 和 Linux，并已有第三方支持移动平台。

其具体文档请参考：

- [V2Ray 官方手册](https://v2fly.org/)

>   本文以 Debian 为例，记录搭建 V2Ray 的过程。

# 2 准备工作

在安装之前，需要校准系统时间，因为 V2Ray 要求服务端与客户端的时间误差不能超过 90 秒，V2Ray 会自动转换时区，所以只需确保时间在误差允许范围内，可以通过以下命令来查看系统时间：

```shell
date -R
```

若时间不正确，可以安装 `ntp` 服务来自动同步时间：

```shell
apt -y install ntp
```

也可以重新配置时区：

```shell
dpkg-reconfigure tzdata
```

## 安装 V2ray

>   参考：[V2Ray 安装](https://www.v2fly.org/guide/install.html)。

```shell
# 安装和更新 V2Ray 和 dat 数据
bash <(curl -L https://raw.githubusercontent.com/v2fly/fhs-install-v2ray/master/install-release.sh)

# 仅更新 dat 数据
bash <(curl -L https://raw.githubusercontent.com/v2fly/fhs-install-v2ray/master/install-dat-release.sh)

# 删除 V2Ray
bash <(curl -L https://raw.githubusercontent.com/v2fly/fhs-install-v2ray/master/install-release.sh) --remove
```

在首次安装完成之后，V2Ray 不会自动启动，需要手动启动并设置开机自启。

```shell
# 设置开机自启
systemctl enable v2ray

# 启动 V2Ray
systemctl start v2ray

# 控制 V2Ray
service v2ray <start|stop|restart|status>
```

## 配置文件

>   参考：[V2Ray 配置指南](https://guide.v2fly.org/)。

Linux 上 V2Ray 的默认配置文件通常位于：

```
/usr/local/etc/v2ray/config.json
```

### 配置文件格式

>   参考：[V2Ray 配置文件格式](https://www.v2fly.org/v5/config/overview.html)。

所有的配置文件都由如下格式的配置项组成：

```json
{
    "log": {},
    "dns": {},
    "router": {},
    "inbounds": [],
    "outbounds": [],
    "services": {}
}
```

无论是客户端还是服务端，配置文件都由这几部分组成，其中都至少需要包含 `inbounds` 和 `outbounds`。V2Ray 并没有在程序上区分客户端和服务端，仅由配置决定。

每一个 V2Ray 服务都是一个节点，`inbound` 是关于如何与上一个节点连接的配置，`outbound` 是关于如何与下一个节点连接的配置。对于第一个节点，`inbound` 与浏览器连接；对于最后一个节点，`outbound`与目标网站连接。

`inbounds` 和 `outbounds` 是 `inbound` 和 `outbound` 的集合，意味着每一个 V2Ray 节点都可以有多个入口和出口。

在配置项中有一个 `id` 设置，是一个 UUID，客户端和服务端必须保持一致。可以通过 [UUID Generator](https://www.uuidgenerator.net/) 或使用 V2Ray CLI 来生成：

```shell
v2ray uuid
```

# 3 配置方案

## VMess + WebSocket + TLS + Web

### 服务端

```json
{
    "log": {
        "loglevel": "warning"
    },
    "inbounds": [
        {
            "listen": "127.0.0.1",
            "port": 20000,
            "protocol": "vmess",
            "sniffing": {
                "enabled": true,
                "destOverride": [
                    "http",
                    "tls"
                ]
            },
            "settings": {
                "clients": [
                    {
                        "id": "bc0e0e71-6f66-4505-aaec-cb73d41305f0"
                    }
                ]
            },
            "streamSettings": {
                "network": "ws",
                "wsSettings": {
                    "path": "/random/path"
                }
            },
            "tag": "vmess-in"
        }
    ],
    "outbounds": [
        {
            "protocol": "freedom",
            "settings": {},
            "tag": "direct"
        },
        {
            "protocol": "blackhole",
            "settings": {},
            "tag": "blocked"
        }
    ],
    "routing": {
        "domainStrategy": "IPIfNonMatch",
        "rules": [
            {
                "type": "field",
                "protocol": [
                    "bittorrent"
                ],
                "outboundTag": "blocked"
            },
            {
                "type": "field",
                "ip": [
                    "geoip:private"
                ],
                "outboundTag": "blocked"
            }
        ]
    }
}
```

### 客户端

```json
{
    "log": {
        "loglevel": "warning"
    },
    "inbounds": [
        {
            "listen": "127.0.0.1",
            "port": 1080,
            "protocol": "socks",
            "sniffing": {
                "enabled": true,
                "destOverride": [
                    "http",
                    "tls"
                ]
            },
            "settings": {
                "udp": true
            },
            "tag": "socks-in"
        }
    ],
    "outbounds": [
        {
            "protocol": "vmess",
            "settings": {
                "vnext": [
                    {
                        "address": "域名",
                        "port": 443,
                        "users": [
                            {
                                "id": "bc0e0e71-6f66-4505-aaec-cb73d41305f0",
                                "security": "auto"
                            }
                        ]
                    }
                ]
            },
            "streamSettings": {
                "network": "ws",
                "wsSettings": {
                    "path": "/random/path"
                },
                "security": "tls"
            },
            "mux": {
                "enabled": true,
                "concurrency": 8
            },
            "tag": "vmess-out"
        },
        {
            "protocol": "freedom",
            "settings": {},
            "tag": "direct"
        },
        {
            "protocol": "blackhole",
            "settings": {},
            "tag": "blocked"
        }
    ],
    "routing": {
        "domainStrategy": "IPIfNonMatch",
        "rules": [
            {
                "type": "field",
                "domain": [
                    "geosite:cn"
                ],
                "outboundTag": "direct"
            },
            {
                "type": "field",
                "ip": [
                    "geoip:cn"
                ],
                "outboundTag": "direct"
            },
            {
                "type": "field",
                "ip": [
                    "geoip:private"
                ],
                "outboundTag": "blocked"
            },
            {
                "type": "field",
                "domain": [
                    "geosite:category-ads"
                ],
                "outboundTag": "blocked"
            }
        ]
    },
    "dns": {
        "servers": [
            "1.1.1.1",
            {
                "address": "114.114.114.114",
                "port": 53,
                "domains": [
                    "geosite:cn"
                ]
            },
            "8.8.8.8",
            "localhost"
        ]
    }
}
```

## 配置 TLS

[acme.sh](https://github.com/Neilpang/acme.sh) 是一个自动化申请并更新 TLS 证书的脚本，使用的是 [Let's Encrypt](https://letsencrypt.org/) 的证书。

### 安装 acme.sh

```shell
curl https://get.acme.sh | bash
```

确认脚本命令别名生效：

```shell
source ~/.bashrc
```

### 证书生成

**注意这条命令会临时占用 80 端口，如果开启了 Nginx / Apache / Caddy 等类似占用了 80 端口的进程，需要临时关闭。**

```shell
~/.acme.sh/acme.sh --issue -d 域名 --standalone -k ec-256
```

### 安装证书和密钥

生成和更新完证书后需要安装证书和密钥：

```shell
 ~/.acme.sh/acme.sh --installcert -d 域名 --fullchain-file /usr/local/etc/v2ray/v2ray.cer --key-file /usr/local/etc/v2ray/v2ray.key --ecc
```

### 证书更新

由于 Let's Encrypt 的证书有效期只有 3 个月，因此需要确保至少 90 天内更新一次证书，acme.sh 脚本会每 60 天自动更新证书，也可以手动更新。

手动更新：

```shell
~/.acme.sh/acme.sh --renew -d 域名 --force --standalone --ecc
```

## 配置 Nginx

通过 Web 实现反向代理可以有效的隐藏自己的 VPS 上有 V2Ray 的事实，可以使用 Nginx / Apache / Caddy。这里以 Nginx 为例，它是一个异步框架的 Web 服务器，用它来实现 WebSocket 的反向代理，另外可以配合 CDN，如 [Cloudflare](https://www.cloudflare.com/) 来隐藏真实 IP。

### 安装 Nginx

```shell
apt -y install nginx
```

Nginx 的配置文件位于 `/etc/nginx` 目录中，编辑：

```shell
vim /etc/nginx/sites-available/default
```

### Nginx 配置

```
server {
    listen 80;
    # listen [::]:80;
    server_name 域名;
    index index.html index.htm index.nginx-debian.html;
    root /var/www/html;

    if ($scheme = http) {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl;
    # listen [::]:443 ssl;
    server_name 域名;
    index index.html index.htm index.nginx-debian.html;
    root /var/www/html;

    ssl on;
    ssl_prefer_server_ciphers   on;
    ssl_certificate             /usr/local/etc/v2ray/v2ray.cer;
    ssl_certificate_key         /usr/local/etc/v2ray/v2ray.key;
    ssl_protocols               TLSv1.2 TLSv1.3;
    ssl_session_timeout         1d;
    ssl_session_cache           shared:MozSSL:10m;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256';

    location / {
        try_files $uri $uri/ = 404;
    }

    location /random/path {
        if ($http_upgrade != "websocket") {
            return 404;
        }
        proxy_redirect off;
        proxy_pass http://127.0.0.1:20000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

修改完配置后需重新加载 Nginx 配置文件：

```shell
service nginx force-reload
```

# 4 客户端

V2Ray 本身不分服务端和客户端，只是配置文件不同，各个平台可以直接通过对应平台的 [V2Ray 内核](https://github.com/v2fly/v2ray-core/releases) 使用，但是基于 V2Ray 内核开发的第三方 GUI 客户端有很多，可以查看 [常用客户端列表](https://www.v2fly.org/awesome/tools.html)。

