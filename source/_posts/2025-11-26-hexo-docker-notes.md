---
layout: post
title: "给 Hexo 博客加上 Docker（2025-11-26 操作记录）"
date: 2025-11-26 20:00:00
categories:
  - Study
tags:
  - docker
  - hexo
  - blog
---

这篇文章是我在 2025-11-26 这一天，把自己的 Hexo 博客项目「Docker 化」全过程的一个操作记录和心得整理。

主要包含：

- 什么是 Dockerfile，以及我在项目里写的那份 Dockerfile 具体做了什么
- 如何构建镜像、运行容器，并在浏览器里访问博客
- 镜像和容器的关系（类和对象的类比）
- 折腾过程中遇到的各种报错（拉不动镜像、Push 被拦截、仓库结构混乱等）
- 最终整理出来的一套比较干净的仓库结构和使用方式


<!-- more -->

## 1. 在 Hexo 博客项目里创建 Dockerfile

项目根目录：

```text
G:\CS\blog
```

我在根目录下新建了一个 `Dockerfile`，内容是典型的「多阶段构建」：

- 第 1 阶段：用 Node 镜像运行 Hexo，生成静态页面
- 第 2 阶段：用 Nginx 镜像托管生成出来的静态页面

大致逻辑是：

1. 以 `node:20-alpine` 为基础镜像，`WORKDIR /app`
2. `COPY package.json package-lock.json* ./`，然后 `npm install --production`
3. `COPY . .` 把整个 Hexo 项目拷进容器
4. `RUN npx hexo generate` 生成静态文件到 `/app/public`
5. 第二阶段以 `nginx:alpine` 为基础镜像
6. 清空 `/usr/share/nginx/html`，再 `COPY --from=builder /app/public /usr/share/nginx/html`
7. `EXPOSE 80`，`CMD ["nginx", "-g", "daemon off;"]`

这样构建出来的镜像，就相当于一个「内置了博客静态文件的 Nginx 服务器」。


## 2. 构建镜像和运行容器

在 `G:\CS\blog` 目录下，使用 PowerShell 运行：

```powershell
cd G:\CS\blog

# 构建镜像
docker build -t my-hexo-blog .

# 启动容器（后台运行）
docker run -d --name my-hexo-blog -p 4000:80 my-hexo-blog
```

- `-t my-hexo-blog`：给镜像起名
- `--name my-hexo-blog`：给容器起名
- `-p 4000:80`：宿主机 4000 端口映射到容器的 80 端口

启动后，我用：

```powershell
docker ps
```

确认容器在运行，然后在浏览器访问：

```text
http://localhost:4000
```

如果能看到博客，就说明 Docker 这条链路是通的。


## 3. 镜像和容器的关系：class 和对象

在理解 Docker 的过程中，有一个比喻对我很有帮助：

- **镜像（Image） ≈ class（类）**：
  - 写在 `Dockerfile` 里，描述了要用什么基础环境、装哪些依赖、拷哪些文件、运行什么命令
  - 本身是只读、静态的，不会自己“跑起来”

- **容器（Container） ≈ 由 class new 出来的对象实例**：
  - `docker run` 一次，就相当于 `new` 一次
  - 同一个镜像可以 `run` 出多个容器实例
  - 停止/删除的是容器实例，镜像本身还在

比如：

```powershell
# 构建镜像（定义 class）
docker build -t my-hexo-blog .

# 运行容器（new 一个实例）
docker run -d --name my-hexo-blog -p 4000:80 my-hexo-blog

# 停止 / 删除实例
docker stop my-hexo-blog
docker rm my-hexo-blog
```

镜像 `my-hexo-blog` 可以随时再 new 一个容器出来，例如：

```powershell
docker run -d --name my-hexo-blog-2 -p 4001:80 my-hexo-blog
```

这两个容器实例互不影响，都是从同一个镜像生成的。


## 4. 网络问题：拉不动 node/nginx 镜像

在最开始构建镜像的时候，我碰到过这种报错：

```text
failed to fetch oauth token: Post "https://auth.docker.io/token": dial tcp ...:443: connectex: A connection attempt failed ...
```

简单说，就是 Docker 在从 Docker Hub 拉取基础镜像（`node:20-alpine`、`nginx:alpine`）时，访问不到 `https://auth.docker.io`。

排查步骤大致是：

1. `docker pull node:20-alpine` / `docker pull nginx:alpine` 测试能否手动拉镜像
2. 用 `curl https://registry-1.docker.io/v2/` 看本机能不能访问 Docker Hub
3. 在 Docker Desktop 里配置镜像加速器（`Settings -> Docker Engine` 里设置 `registry-mirrors`）或者 HTTP/HTTPS 代理
4. 再次尝试 `docker build`

当 `docker pull node:20-alpine` 能正常完成时，`docker build` 才不会再卡在拉基础镜像这一步。


## 5. 停止、删除容器

Docker 容器默认是后台运行的，`docker run -d` 执行完命令行会直接返回，看起来“没反应”，其实容器已经在后台跑了。

常用的几个管理命令：

```powershell
# 查看当前运行中的容器
docker ps

# 停止容器
docker stop my-hexo-blog

# 删除已经停止的容器
docker rm my-hexo-blog

# 删除镜像（如果不再需要）
docker rmi my-hexo-blog
```


## 6. Git 仓库与隐私：忽略文章内容与私钥

在把这个 Hexo 博客同步到 GitHub 的过程中，我做了两件比较重要的事情：

### 6.1 忽略文章正文目录

我的文章放在 `source/_posts/` 下，这里存的是个人写作内容，我不希望这些在 GitHub 上公开，所以在根目录 `.gitignore` 里加了：

```gitignore
source/_posts/
```

这样：

- 配置、主题、布局等可以提交到 GitHub
- 真正的文章内容只保留在本地，不会被版本控制和推送

### 6.2 避免提交私钥文件

我曾经不小心把一个 `mykey.txt`（SSH 私钥）放进了仓库，并提交了。GitHub 的 Push Protection 会直接拦截这种提交，提示类似：

```text
Push cannot contain secrets
GitHub SSH Private Key
path: mykey.txt:1
```

解决办法是：

1. 把密钥文件加到 `.gitignore`：

   ```gitignore
   mykey.txt
   mykey.txt.pub
   ```

2. 在还没有正式使用这把私钥的前提下，可以删除 `.git` 目录重新 `git init`，确保新的 Git 历史里完全没有这个文件，再重新 commit & push。

3. 如果这把私钥曾经用过，要当作泄露处理，去对应平台（比如 GitHub）里删掉旧的 key，重新生成新的 SSH key。


## 7. 清理合并后的仓库结构

因为这个仓库本身就是 GitHub Pages 的仓库（`Jesse-Plcx.github.io`），之前已经存在很多生成后的静态文件（`index.html`、`2024/`、`archives/` 等），在和本地 Hexo 项目合并后，根目录变得很乱。

最终整理策略是：

1. 在根目录新建一个备份目录：

   ```powershell
   mkdir backup_from_merge
   ```

2. 把原来混在根目录的静态站点文件（`2024/`、`2025/`、`about/`、`archives/`、`categories/`、`css/`、`images/`、`js/`、`page/`、`public/`、`p_imgs/`、`tags/` 等）整体移动到 `backup_from_merge/` 下面，只在本地保留备份，不再让 Git 跟踪：

   ```powershell
   move 2024 backup_from_merge
   move 2025 backup_from_merge
   move about backup_from_merge
   move archives backup_from_merge
   move categories backup_from_merge
   move css backup_from_merge
   move images backup_from_merge
   move js backup_from_merge
   move page backup_from_merge
   move public backup_from_merge
   move p_imgs backup_from_merge
   move tags backup_from_merge
   ```

3. 在 `.gitignore` 中忽略这些生成物：

   ```gitignore
   node_modules/
   public/
   .deploy*/
   backup_from_merge/
   source/_posts/
   mykey.txt
   mykey.txt.pub
   ```

4. 仓库中只保留 Hexo 源码和配置：

   - `source/`
   - `themes/`
   - `_config.yml`
   - `package.json`
   - `scaffolds/`
   - `Dockerfile`
   - `README.md`

这样，GitHub 上的仓库就变成了一个干净的「Hexo 源码仓」，而不是混杂了大量生成 HTML 的静态站点目录。


## 8. 修改博客后的更新流程

因为镜像是「打包时的状态」，容器是「从镜像 new 出来的实例」，所以当我修改博客内容或配置后：

- 旧的镜像不会自动变化
- 已经在跑的容器也不会自动更新

要让 Docker 版本的博客同步到最新，流程是：

```powershell
cd G:\CS\blog

# 1. 重新构建镜像
docker build -t my-hexo-blog .

# 2. 停止并删除旧容器
docker stop my-hexo-blog
docker rm my-hexo-blog

# 3. 启动新容器
docker run -d --name my-hexo-blog -p 4000:80 my-hexo-blog
```

访问 `http://localhost:4000`，就能看到更新后的内容。


## 9. 小结

这一天的折腾让我对 Docker + Hexo + GitHub 有了更清晰的认识：

1. `Dockerfile` 就是镜像的“类定义”，镜像是类，容器是对象实例
2. 本地预览和部署可以共用一套 Docker 镜像：Node 阶段构建，Nginx 阶段运行
3. 文章内容和私钥等敏感信息要用 `.gitignore` 严格排除在仓库之外
4. 对于 GitHub Pages 仓库，尽量把它当作“源码仓”，不要夹杂过多生成 HTML 的历史文件

以后如果再重装环境或者换新机器，只要：

- 把这个仓库 clone 下来
- `npm install`
- `npx hexo server` 或 `docker build` + `docker run`

就能快速把整个博客跑起来，这就是给项目「Docker 化」和规范仓库结构带来的最大好处。