# 1 前言

[Project X](https://xtls.github.io/) 是包含一系列网络工具的平台，前身是 [Project V](https://www.v2fly.org/)，包含更多功能和性能改进。

> 本文以 Debian 为例，记录搭建 Xray 的过程。

# 2 准备工作

在安装之前，需要校准系统时间，因为 Xray 要求服务端与客户端的时间误差不能超过 90 秒，Xray 会自动转换时区，所以只需确保时间在误差允许范围内，可以通过以下命令来查看系统时间：

```shell
date -R
```

也可重新配置时区：

```shell
dpkg-reconfigure tzdata
```

## 安装 Xray

> 参考：[Xray-install](https://github.com/XTLS/Xray-install)。

```shell
# 安装和更新 Xray 和 dat 数据
curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh | bash -s -- install

# 只安装和更新 dat 数据
curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh | bash -s -- install-geodata

# 删除 Xray 和 dat 数据
curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh | bash -s -- remove --purge
```

之后可通过 `systemctl` 来管理：

```shell
systemctl <status|start|stop|restart> xray
```

## 配置文件

通过上述方式安装时，默认配置文件通常位于：

```
/usr/local/etc/xray/config.json
```

### 配置文件格式

> 参考：[Xray 配置文件](https://xtls.github.io/config/)。

常用配置项如下：

```json
{
  "dns": {},
  "inbounds": [],
  "outbounds": [],
  "routing": {},
  "transport": {}
}
```

无论是客户端还是服务端，配置文件都都至少需要包含 `inbounds` 和 `outbounds`。Xray 并没有在程序上区分客户端和服务端，仅由配置决定。

每一个 Xray 服务都是一个节点，`inbound` 是关于如何与上一个节点连接的配置，`outbound` 是关于如何与下一个节点连接的配置。对于第一个节点，`inbound` 与客户端连接（如浏览器）；对于最后一个节点，`outbound`与目标网络连接。

`inbounds` 和 `outbounds` 是 `inbound` 和 `outbound` 的集合，意味着每一个 Xray 节点都可以有多个入口和出口。

在配置项中有一个 `id` 设置，是一个 UUID，**客户端和服务端必须保持一致**。可以通过 [UUID Generator](https://www.uuidgenerator.net/) 或使用 Xray CLI 来生成：

```shell
xray uuid
```

# 3 配置方案

## 配置模板

官方的仓库包含了大量的配置模板：

- [XTLS/Xray-examples](https://github.com/XTLS/Xray-examples)

## 配置 TLS

有些配置方案需要使用 TLS，这就需要证书。[acme.sh](https://github.com/acmesh-official/acme.sh/wiki/%E8%AF%B4%E6%98%8E) 是一个自动化申请并更新 TLS 证书的脚本，默认使用的是 [ZeroSSL](https://zerossl.com/) 提供的证书。

### 安装 acme.sh

```shell
curl https://get.acme.sh | bash -s email=<email>
```

### 证书生成

```shell
acme.sh --issue --standalone -d <domain> --httpport <port>
```

`--test` 可以验证是否能成功申请，避免反复申请导致受限。

### 安装证书和密钥

```shell
acme.sh --install-cert -d <domain> \
--cert-file                 <cert> \
--key-file                   <key> \
--fullchain-file       <fullchain> \
```

### 查看已安装证书

```
acme.sh --info -d <domain>
```

## 配置 Nginx

有些配置方案会使用 Nginx / Caddy 这种 Web 服务器实现反向代理。这里以 Nginx 为例，它是一个异步框架的 Web 服务器，用它来实现 WebSocket 的反向代理，另外可以配合 CDN，如 [Cloudflare](https://www.cloudflare.com/) 来隐藏真实 IP。

### 安装 Nginx

```shell
apt install -y nginx
```

Nginx 的配置文件位于 `/etc/nginx` 目录中，编辑：

```shell
vim /etc/nginx/sites-available/default
```

### Nginx 配置

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name example.com;

    root /var/www/html;
    index index.html index.nginx-debian.html;

    ssl_certificate           /usr/local/etc/xray/xray.cer;
    ssl_certificate_key       /usr/local/etc/xray/xray.key;
    ssl_protocols             TLSv1.2 TLSv1.3;
    ssl_ciphers               HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache         shared:SSL:10m;
    ssl_session_timeout       10m;

    location / {
        try_files $uri $uri/ =404;
    }

    location /random/path {
        if ($http_upgrade != "websocket") {
            return 444;
        }
        proxy_redirect off;
        proxy_pass http://localhost:20000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

修改完配置后需重新加载 Nginx 配置文件：

```shell
systemctl reload nginx
```

# 4 客户端

Xray 本身不分服务端和客户端，只是配置文件不同，各个平台可以直接通过对应平台的 [Xray 内核](https://github.com/XTLS/Xray-core/releases) 使用，但是基于 Xray 内核开发的第三方 GUI 客户端有很多，可查看 [图形化客户端](https://xtls.github.io/document/install.html#%E5%9B%BE%E5%BD%A2%E5%8C%96%E5%AE%A2%E6%88%B7%E7%AB%AF)。
