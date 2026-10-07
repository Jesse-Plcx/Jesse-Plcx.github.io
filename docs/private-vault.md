# 私密文档专区

访问网站的 /private/ 页面，用你的解锁口令在浏览器中查看文档。GitHub Pages 只保存密文。

## 第一次配置

1. Markdown 私人笔记继续放在 source/_private_posts/。
2. 其他文档可放在 source/_private_files/。支持 TXT、PDF、DOCX、PNG、JPEG、WebP。
3. 在本机 PowerShell 中运行 `.\protect-private.ps1`。它生成一个随机的 256 位口令，仅在本机终端显示。
4. 将口令保存在自己的密码管理器中，输入 YES 后加密。
5. 运行 npm run build 和 npm run verify；提交 static/vault/data.json 并推送，网站就能解锁这些文档。

已有自己的强口令时，用 `.\protect-private.ps1 -Mode custom` 安全输入并确认。口令至少 20 个字符，推荐使用工具生成的随机口令。不要把口令写进源码、Git、聊天或命令行参数。

后续更新文档时，用 custom 模式输入相同口令重新加密，再发布密文。默认 generate 模式会生成新口令，使用前务必保存好。

## 阅读方式

- Markdown 在页面内阅读，支持代码、表格和数学公式。
- TXT 在页面内阅读。
- 图片可解锁预览，PDF、Word 等附件可解锁后下载。
- 文档标题和原文件名也在密文内，输入口令前不会显示。
- 口令不会发送到服务器，也不会保存进浏览器 localStorage。
- 手动锁定、刷新或离开页面后，需要重新解锁。10 分钟无操作自动锁定。
- 阅读器清理文档 HTML，禁用脚本、表单、iframe 等危险元素；私密区限制外部网络请求。
- Markdown 不自动加载远程图片；私密图片作为加密附件存放。
- 单文件最多 5 MiB，整份加密数据的原始 payload 最多 16 MiB。

## 发布规则

只有 static/vault/data.json 是发布用的密文。source/_private_posts 和 source/_private_files 都被 Git 与 Docker 忽略，Astro 的公开内容集合不会加载它们。

普通 npm run build **不会**读取私人文档，也不需要口令。GitHub Actions 只复制已经加密的数据，不接触你的口令或明文。

暂无 data.json 时，私密专区显示“尚未配置”，不会使用默认口令，也不会发布演示文档。

## 安全边界

这是静态加密文档库，不是服务器账号系统。访客可以下载密文，保护依赖于足够强、保密的口令；这里没有服务器的登录限速或账号撤销。掌握口令的人可以解锁文档，也可以保存解锁后的内容。

使用 Web Crypto 的 AES-256-GCM、随机 16 字节盐和 12 字节 nonce、PBKDF2-HMAC-SHA256 600,000 次派生。每次打包都会产生新的盐和 nonce。加密数据同时校验完整性，改动密文会导致解锁失败。

更换口令必须重新加密并发布。旧 Git 提交或别人已下载的旧密文，仍可能用旧口令解锁；改口令不能收回已下载的副本。

旧版本曾公开的私人文件缓存需要继续由 GitHub Support 清除。新专区的加密不会自动清除那些旧缓存。

原始私人文件保留在本机，不会被加密工具修改。忘记口令时，可用本机原文件重新打包生成新口令。

## 校验

npm run test:vault 使用合成测试内容，验证往返、错误口令、篡改、随机盐/nonce、Unicode 口令和文件打包。不会用测试口令处理真实私人文档。

npm run verify 检查私密页 noindex、搜索与 sitemap 排除、密文格式及公开构建中不存在私人目录。

参考：
- [GitHub Pages 静态托管](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Web Crypto AES-GCM](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt)
- [口令派生工作因子](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [DOMPurify](https://github.com/cure53/DOMPurify)
