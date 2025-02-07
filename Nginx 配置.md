Ngnix的功能非常强大，配置也十分灵活，下面是一些使用用一些常用配置：

## 禁止使用IP地址访问网站

IP地址访问很不友好，但是默认IP的访问是被允许的，以下设置可以禁止通过IP访问服务器网站。

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 403;
}
```

## 仅允许指定用户的IP访问网站

```
server {
    # 其它配置代码
    location / {
        # 其它配置代码
    # 只允许ip为8.8.8.8的用户进行访问。
    allow 8.8.8.8;
    # 拒绝所有的ip访问，这样设置后，就只有ip为8.8.8.8可以访问网站。拒绝后返回的是403错误
    deny  all;                   
    }
}
```

## 允许跨域访问及设置白名单域名

跨域的访问十分普遍，以下设置允许其他域名的跨域访问，同时还进行白名单设置

```
server {
    # 其它配置代码
    location / {
        # 跨域允许设置，允许所有跨域
        add_header 'Access-Control-Allow-Origin' *;
        add_header 'Access-Control-Allow-Methods' 'HEAD, GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,web-token,app-token,Authorization,Accept,Origin,Keep-Alive,User-Agent,X-Mx-ReqToken,X-Data-Type,X-Auth-Token,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        if ($request_method = 'OPTIONS') {# 处理OPTIONS请求
            return 204;
        }
        # 跨域允许设置结束

        # 防盗链设置，因为上述跨域是允许所有的，这里就要设置防盗链从而进行域名的白名单设置
        valid_referers none blocked *.baidu.com *.sina.com.cn;
        if ($invalid_referer) { #返回一个盗链图片，或直接返回403
            # rewrite ^/ http://ww4.sinaimg.cn/bmiddle/051bbed1gw1egjc4xl7srj20cm08aaa6.jpg;
            return 403;
        }

        # 如果要将禁止特定后缀文件的盗链，则可将上述代码放在下面里面
        # location ~* \.(js|css|gif|jpg|png|jpeg)$ { 
        #}
    }
}
```

## 反向代理某个域名

```
server {
    listen       80;
    server_name  www.yovisun.com; #用户访问的域名
    location / {
        proxy_redirect off;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://proxy.yovisun.com; # 服务器实际去访问的代理域名
    }
}
```

## 反向代理某个域名，并在url上追加参数

下述对/avatar/目录下的所有文件，都在url后面追加：detail=abcd

```
server {
    listen       80;
    server_name  www.yovisun.com; #用户访问的域名
    # 头像图片转接到oss内部
    location ~* /avatar/ {
        add_header backendIP $upstream_addr;
        add_header backendCode $upstream_status;
        set $delimeter "";
        if ($is_args) {
            set $delimeter "&";
        }
        set $args $args${delimeter}detail=abcd;
        proxy_pass http://proxy.yovisun.com;
        proxy_set_header Host www.yovisun.com;
    }
}
```

## 伪静态（Yii2设置）

伪静态的需求非常普遍，下面是Yii2框架推荐的配置

```
server {
    listen        80;
    server_name  www.yovisun.com;
    root   "C:/www/my/web";
    index  index.php;

    # access_log  /path/to/basic/log/access.log;
    # error_log   /path/to/basic/log/error.log;

    location / {
        index index.php index.html error/index.html;
            
        #Yii的伪静态
        try_files $uri $uri/ /index.php$is_args$args;
            
        autoindex  off;
    }

    # 避免避免Yii处理对不存在的静态文件的调用
    location ~ \.(js|css|png|jpg|gif|swf|ico|pdf|mov|fla|zip|rar)$ {
        try_files $uri =404;
    }

    # deny accessing php files for the /assets directory
    location ~ ^/assets/.*\.php$ {
        deny all;
    }

    location ~ \.php(.*)$ {
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_index  index.php;
        fastcgi_split_path_info  ^((?U).+\.php)(/?.+)$;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        fastcgi_param  PATH_INFO  $fastcgi_path_info;
        fastcgi_param  PATH_TRANSLATED  $document_root$fastcgi_path_info;
        include        fastcgi_params;
    }

    location ~* /\. {
        deny all;
    }
}
```

## http（80端口）的链接301跳转到对应的https（443）

```
server {
    listen 80;
    server_name www.域名.com;
    rewrite ^(.*)$ https://${server_name}$1 permanent; 
}
```