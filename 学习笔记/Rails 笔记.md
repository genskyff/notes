## Rails 常用命令

```shell
# 创建 blog 项目
rails new blog

# 启动项目
rails server

# 生成控制器
rails generate controller Articles index

# 删除控制器（但不删除路由）
rails destroy controller Articles

# 删除控制器（并删除动作对应的路由）
rails destroy controller Articles index

# 生成模型
rails generate model Article title:string body:text

# 删除模型
rails destroy model Article

# 生成脚手架
rails generate scaffold Article title:string body:text

# 生成集成测试
rails generate integration_test site_layout

# 应用迁移
rails db:migrate

# 撤回迁移
rails db:rollback

# 撤回到最初的迁移状态
rails db:migrate VERSION=0

# 打开控制台
rails console

# 以沙箱打开控制台（不会对现有数据产生影响）
rails console --sandbox

# 查看路由
rails routes
```

## render 常见用法

`render` 是一个在 Rails 中用于渲染视图和响应的常用方法，它有多种用法和选项。下面列出了 `render` 方法的一些常见用法：

### 渲染视图模板

```
render :new
```

上述代码将渲染 `new` 视图模板，通常用于显示表单或创建新记录的页面。

### 渲染指定路径的视图模板

```ruby
render 'posts/index'
```

上述代码将渲染位于 `app/views/posts/index.html.erb` 文件中的视图模板。

### 渲染局部视图

```ruby
render partial: 'comments/comment', collection: @comments, as: :item
```

上述代码将渲染位于 `app/views/comments/_comment.html.erb` 文件中的局部视图模板，并使用 `collection` 选项将 `@comments` 集合传递给该局部视图。同时使用 `as` 选项将局部变量命名为 `:item`。

### 渲染 JSON 响应

```ruby
render json: @post
```

上述代码将将 `@post` 对象转换为 JSON 格式，并作为响应返回。

### 渲染纯文本响应

```ruby
render plain: 'Hello, World!'
```

上述代码将返回一个纯文本响应，内容为 "Hello, World!"。

### 渲染 JavaScript 响应

```ruby
render js: "alert('Hello, World!');"
```

上述代码将返回一个 JavaScript 响应，在客户端执行弹出框显示 "Hello, World!"。

### 渲染带有局部变量的视图模板

```ruby
@name = 'John'
render :welcome, locals: { name: @name }
render partial: "form", locals: { name: @name }
```

上述代码将渲染 `welcome` 视图模板，并传递 `name` 变量作为局部变量。（`locals` 可以省略。）

### 渲染内联 HTML 代码

```ruby
render html: '<h1>Welcome</h1>'.html_safe
```

上述代码将返回一个包含 `<h1>Welcome</h1>` 的 HTML 响应。使用 `html_safe` 方法确保 HTML 代码被正确地渲染。

>   在使用 `render` 方法时，Rails 默认会根据控制器的约定自动渲染与当前操作名称匹配的视图模板。例如，`render :index` 在 `PostsController` 的 `index` 动作中将默认渲染 `index` 视图模板。

## redirect_to 和 render

`redirect_to` 和 `render` 是在 Rails 控制器中用于处理响应的两个常用方法，它们之间有一些重要的区别。

`redirect_to`：用于执行重定向，将请求导航到另一个 URL 或路由。它发送一个 HTTP 重定向响应，浏览器将根据重定向指令发送新的请求并导航到新的 URL。主要特点如下：

-   完成当前请求并生成新的请求。
-   触发浏览器重新加载页面。
-   在新请求中，浏览器的 URL 地址栏将显示重定向后的 URL。
-   可用于重定向到其他控制器动作、路由、外部 URL 等。

```ruby
redirect_to root_path
redirect_to @article
redirect_to "https://www.example.com"
```

`render`：用于渲染视图，并将其作为响应返回给客户端。它直接在当前请求的上下文中进行渲染，不会导致浏览器的页面跳转。主要特点如下：

-   在当前请求的上下文中渲染视图模板。
-   不会生成新的请求和响应，直接将渲染后的视图作为当前请求的响应返回。
-   适用于渲染 HTML、JSON、XML 等各种响应格式。
-   可用于渲染指定视图、局部视图、纯文本响应等。

```ruby
render :new
render partial: 'shared/header', locals: {article: @article}
render json: { message: 'Success' }
render plain: 'Hello, World!'
```

总结：

-   `redirect_to` 是执行重定向，导航到新的 URL，触发浏览器重新加载页面。
-   `render` 是在当前请求上下文中渲染视图，并将其作为响应返回，不触发浏览器的页面跳转。
-   `redirect_to` 适用于需要将请求导航到其他地方的情况，而 `render` 适用于在当前请求中渲染视图并返回响应的情况。
-   使用 `redirect_to` 可能会生成新的请求和响应，而使用 `render` 不会生成新的请求和响应。
-   根据具体需求和场景，选择适当的方法来实现所需的功能和行为。

### 为何使用 `redirect_to` 来返回成功页面， `render` 来返回失败页面？

在控制器的 `create` 动作中，通常会使用 `redirect_to` 进行重定向，以在成功创建资源后将用户导航到新创建的资源的页面或其他相关页面。而在创建操作失败时，通常使用 `render` 来重新渲染包含表单的页面，以便用户可以查看并修正错误。这种使用方式的原因如下：

成功创建时的重定向：当成功创建资源并保存到数据库时，您通常会希望将用户导航到新创建的资源的页面或其他相关页面，以便用户可以查看刚刚创建的内容。通过使用 `redirect_to`，您可以指定重定向的目标 URL，例如新资源的显示页面或资源列表页。

 ```ruby
def create
  @article = Article.new(article_params)
  if @article.save
    redirect_to @article # 重定向到新创建的文章页面
  else
    render :new
  end
end
 ```

创建失败时的渲染：当创建操作失败时，例如由于表单验证失败或其他原因，您可能希望保留用户提交的表单数据，并显示错误消息或指导用户进行修正。在这种情况下，使用 `render` 可以重新渲染包含表单的页面，并将错误消息传递给视图以进行显示。

```ruby
def create
  @article = Article.new(article_params)
  if @article.save
    redirect_to @article
  else
    render :new # 重新渲染创建新文章的表单页面，保留用户提交的数据和显示错误消息
  end
end
```

如果在创建动作中，成功时使用 `render` 而失败时使用 `redirect_to`，可能会导致一些不期望的结果。下面是可能发生的情况：

成功时使用 `render`：在成功创建资源后使用 `render` 可能会导致以下问题：

-   页面不会重定向到新创建的资源的页面，而仍然停留在创建表单的页面。
-   URL 地址栏不会更新为新资源的 URL，而仍然显示创建表单的 URL。
-   如果用户尝试刷新页面，将重新提交相同的表单数据，可能导致重复创建相同的资源。

失败时使用 `redirect_to`：在创建操作失败时使用 `redirect_to` 可能会导致以下问题：

-   用户在填写表单时提交的数据将丢失，因为在重定向后，之前提交的表单数据不会被保留。
-   错误消息无法传递到重定向后的页面，因为新请求和响应会丢失之前的上下文和实例变量。

在创建操作中，通常建议在成功创建时使用 `redirect_to` 进行重定向，将用户导航到新创建资源的页面，以及在创建失败时使用 `render` 重新渲染表单页面，以便用户可以修正错误。这样可以提供更好的用户体验和正确的工作流程。

## 默认 RESTful 路由

| 方法        | 路径                 | 控制器动作         | 命名路由                |
| ----------- | -------------------- | ------------------ | ----------------------- |
| `get`       | `/articles`          | `articles#index`   | `articles_path`         |
| `get`       | `/articles/:id`      | `articles#show`    | `article_path(article)` |
| `get`       | `/articles/new`      | `articles#new`     | `new_article_path`      |
| `post`      | `/articles`          | `articles#create`  | `articles_path`         |
| `get`       | `/articles/:id/edit` | `articles#edit`    | `edit_article_path`     |
| `put/patch` | `/articles/:id`      | `articles#update`  | `article_path(article)` |
| `delete`    | `/articles/:id`      | `articles#destroy` | `article_path(article)` |

在 Rails 中，`new` 和 `edit` 这两个操作具有默认的路由名称 `new_resource` 和 `edit_resource`，其中 `resource` 是指资源的名称（例如 `article`）。这是 Rails 的约定，方便在视图和控制器中引用这些动作的路径和 URL。在这些名称后面可以跟 `_url` 或 `_path` 等后缀的辅助方法。

然而，对于 `index` 和 `show` 这两个操作，默认情况下没有相应的默认路由名称。这是因为这些操作通常用于显示集合或单个资源的信息，它们的路由命名通常直接使用资源的名称，而不添加额外的动作前缀。

例如，假设有一个 `articles` 资源，那么生成的默认路由如下：

-   `new_article`：用于创建新文章的表单页面
-   `edit_article`：用于编辑现有文章的表单页面
-   `articles`：用于显示所有文章的列表
-   `article`：用于显示单个文章的详细信息

对于集合操作（如 `index`），默认路由使用资源名称的复数形式，而对于单个资源操作（如 `show`），默认路由使用资源名称的单数形式。

这样的约定可以通过简单的命名方式来引用和生成路由，例如使用 `articles_path` 或 `article_path(@article)` 来生成对应的 URL。

## 自定义路由

可以根据需要自定义路由，并为其指定自定义的命名。例如，可以使用以下方式为文章资源添加自定义路由和命名：

```ruby
resources :articles do
  get 'index_article', on: :collection
  get 'show_article', on: :member
  post 'create_article', on: :collection
end
```

上述代码中，使用 `on: :collection` 表示这些自定义路由是针对整个文章集合的操作，而使用 `on: :member` 表示这些自定义路由是针对单个文章资源的操作。

>   对于自定义路由，需要在控制器中实现相应的操作方法，并提供相应的视图和逻辑。

## Rails 命名默认约定

### 控制器名称

生成控制器时，**名称使用驼峰命名法**，并生成以**蛇形命名法的控制器文件**，且使用**复数**的形式：

```shell
# 都会生成 static_pages_controller.rb
rails g controller StaticPages index
rails g controller static-pages index
```

控制器的**类名使用驼峰命名法**，因此上面两条命令都会生成 `StaticPagesController` 类：

```ruby
class StaticPagesController < ApplicationController
  def index
  end
end
```

>   -   定义控制器、控制器类名：驼峰命名法（复数）
>   -   控制器文件：蛇形命名法（复数）

### 路由名称

路由名称使用控制器名称的**蛇形命名法**的形式，且**不加任何后缀**。

### 模型名称

生成模型时，**名称使用驼峰命名法**，并生成以**蛇形命名法的模型文件**，且使用**单数**的形式：

```shell
# 都会生成 user_info.rb
rails g model UserInfo name:string email:string
rails g model user-info name:string email:string
```

模型的**类名使用驼峰命名法**，因此上面两条命令都会生成 `UserInfo` 类：

```ruby
class UserInfo < ApplicationRecord
end
```

>   -   定义模型、模型类名：驼峰命名法（单数）
>   -   模型文件：蛇形命名法（单数）
>   -   迁移文件：复数形式
>       -   `<timestamps>_create_user_infos.rb` 文件
>       -   `CreateInfoUsers` 类
>       -   `create_table :info_users` 方法

