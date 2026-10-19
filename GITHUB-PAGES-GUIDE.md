# 囤囤管家 · GitHub Pages 上线与库存迁移

适用版本：v0.13.1 Pages 发布包。说明核对日期：2026-10-19。

## 1. 先保存真实库存

在目前使用的旧入口打开囤囤管家，进入“设置 → 导出完整备份”，把 JSON 保存到 iPhone“文件”App。确认文件已保存，大小不是 0，并保留一份副本。不要把这个文件放进待上传文件夹。

发布包为空库存，后续恢复你导出的备份。无需清除 Safari 网站数据，也不要为了刷新新版而清除网站数据。旧入口先保留，核对新入口后再决定是否移除主屏幕图标。

## 2. 创建仓库

建议使用电脑完成上传，在 iPhone 上完成最终使用和迁移。

1. 登录 [GitHub](https://github.com)，点击右上角“＋ → New repository”。
2. Owner 选择自己的账号，Repository name 填 `tuntun-inventory`。
3. 如果使用 GitHub Free，选择 **Public**，即可使用免费公开仓库的 Pages。若要私有源码仓库，需先确认当前付费计划支持私有仓库 Pages。普通 Pages 网站本身通常公开，私有仓库不意味着网站有个人登录限制。
4. 可以勾选 Add README，方便进入文件上传页面。本包中的 README 上传时替换即可。
5. 点击 **Create repository**，确认主分支是 `main`。

不要从原有项目直接镜像 Git 历史。本包已经单独整理，避免旧提交包含真实初始库存。

## 3. 上传发布包

解压下载的 ZIP，进入 `tuntun-inventory` 文件夹。**上传的是文件夹里面的内容，不是 ZIP 文件，也不要把外层 `tuntun-inventory` 文件夹整体套在仓库里。**

仓库根目录最终应能直接看到 `dist`、`scripts`、`tests`、`README.md` 等；工作流路径必须是 `.github/workflows/deploy-pages.yml`。

### 方法 A：GitHub 网页上传，适合不使用命令行

1. 在仓库 Code 页面点击 **Add file → Upload files**。
2. 将解压后文件夹中的 `dist`、`scripts`、`tests` 三个文件夹，以及 `README.md`、`GITHUB-PAGES-GUIDE.md`、`GITHUB-ACTIONS.txt` 一起拖进去。
3. 在上传列表确认出现 `dist/index.html`，而非 `tuntun-inventory/dist/index.html`。不要选择任何个人 Excel 或 JSON 备份。
4. 在页面下方选择提交到 `main`，点击 **Commit changes**。
5. 进入 **Settings → Pages**，在 **Build and deployment → Source** 中选择 **GitHub Actions**。此时先不选择模板，不用点击 Configure。
6. 回到 Code 页面，点击 **Add file → Create new file**。
7. 文件名填写 `.github/workflows/deploy-pages.yml`，注意最开头有一个英文句点。
8. 在电脑上用文本编辑器打开发布包里的 `GITHUB-ACTIONS.txt`，复制其全部内容，粘贴到 GitHub 文件编辑框中。它与包内真正的工作流文件完全相同，直接复制即可，无需填写账号或密码。
9. 点击 **Commit changes**，提交到 `main`。这次提交会自动触发首次部署。
10. 用同样的 Create new file 方法建立 `.gitignore`，复制包内同名文件内容。若看不到本地隐藏文件，可在电脑文件管理器启用“显示隐藏文件”；本包不含任何真实备份。

如果拖入文件夹没有保留目录，请改用方法 B。不要把所有 JS、CSS 放到仓库根目录；现成工作流发布的是 `dist`。

### 方法 B：GitHub Desktop，适合后续继续更新

1. 安装并登录 [GitHub Desktop](https://desktop.github.com/)。
2. 在 GitHub Desktop 中克隆刚创建的仓库到电脑上的新文件夹。
3. 把解压包 `tuntun-inventory` 里面的全部内容复制进克隆目录，包含 `.github`、`.gitignore`、`.gitattributes`；保持克隆目录自己的 Git 元数据不变。
4. 提交前检查更改列表：应只有本发布包内容，不应有 Excel、真实种子或个人备份。
5. 在 GitHub 网页先进入 **Settings → Pages → Source → GitHub Actions**。
6. 回到 Desktop，填写提交说明，例如 `Prepare GitHub Pages`，点击 **Commit to main → Push origin**。

### 已熟悉 Git 时的可选操作

在电脑上克隆一个全新的 GitHub 仓库，将发布包内容复制进去，再运行以下命令。请在命令里的 `YOUR-USERNAME` 处填写你的 GitHub 用户名。

```sh
git clone https://github.com/YOUR-USERNAME/tuntun-inventory.git
cd tuntun-inventory
# 此时将解压包里面的内容复制到当前目录，包含 .github
git status --short
node scripts/check-release.cjs
node --test tests/*.test.cjs
git add .
git commit -m "Prepare GitHub Pages"
git push origin main
```

克隆完成后、首次推送之前，仍需在 GitHub 网页将 Pages 的 Source 设为 GitHub Actions。Git 登录使用正常的 GitHub 授权方式，无需把令牌写进仓库。

## 4. 等待部署并取得网址

1. 点击仓库顶部 **Actions**。
2. 打开 **Deploy Tuntun to GitHub Pages** 的最新运行。
3. `check` 和 `deploy` 均显示绿色，表示成功。
4. 在部署摘要或 **Settings → Pages → Visit site** 打开正式网址。

默认网址形式为 `https://你的GitHub用户名.github.io/tuntun-inventory/`。应使用 GitHub 实际返回的网址，保留结尾斜线，避免手动拼写错误。首次生效可能需要等待几分钟。

首次打开应看到空库存和“新增产品”入口。图标、设置、四列视图和新增输入框都应正常。整个流程无需自行购买服务器、域名或填写数据库密码。

## 5. 在 iPhone 添加到主屏幕，再恢复库存

1. 用 iPhone **Safari** 打开刚才的 HTTPS 网址，不要使用微信内置浏览器或无痕浏览。
2. 点击分享按钮，选择 **添加到主屏幕**；若系统显示 **作为网页 App 打开 / Open as Web App**，保持开启，然后点添加。
3. 从新添加的主屏幕图标启动应用，确认这是新网址。可暂时命名为“囤囤管家·新”，区分旧入口。
4. **在这个最终准备日常使用的新入口内**，进入“设置 → 从 JSON 恢复”，选择第一步保存的完整备份。Safari 标签页和主屏幕 App 的实际存储表现可能因系统版本和安装方式不同；以最终入口内的恢复结果为准。
5. 查看恢复预览，确认文件及产品数量，勾选确认后恢复。恢复会替换新入口的当前库存，不是追加；不要先在新入口录入一批真实库存再导入旧备份。
6. 核对产品名称、品牌、规格、数量、存放位置、补货阈值、归档产品及最近几条流水。归档产品在“设置 → 管理已归档产品”中查看，不应出现在默认库存里。
7. 关闭并重新打开主屏幕 App，确认库存仍在，再从新入口导出一份新备份。
8. 旧站原数据和原备份继续保留，核对完成前不要删除或清空。开始迁移后尽量只在新入口记账，避免旧、新两份数据分别变化。

安装后可在第一次联网加载完成并重新打开后测试离线；遇到部署更新时先联网重开。不要通过清空网站数据解决缓存问题。

## 6. 发布后的使用规则

- GitHub Pages 托管程序，库存仍保存在当前设备本地；不提供账号登录、云备份或多设备同步。
- GitHub 公共网站的任何访客从空库存开始，无法通过此发布包获得你的本机库存。你的 JSON 备份只通过本地文件选择器导入，程序没有上传库存接口。
- 定期导出 JSON 到“文件”App。GitHub 仓库中的代码不包含你每天的库存变化，也不能代替库存备份。
- 不要把 `dist/seed.json` 改成真实库存，也不要把正式 Excel、JSON 备份、库存截图或含真实数据的旧 Git 历史推到公开仓库。
- 建议同一 `用户名.github.io` 下只放一个正式使用的囤囤管家实例。不同仓库路径仍共享同源 IndexedDB；本包只对离线缓存做了路径隔离。

## 7. 后续更新与常见问题

| 情况 | 处理 |
| --- | --- |
| Actions 没有工作流 | 检查 `.github/workflows/deploy-pages.yml` 是否真的上传；ZIP 本身不会被执行 |
| 出现 Get Pages site / Not Found | 先将 Settings → Pages → Source 设为 GitHub Actions，再在 Actions 重新运行工作流 |
| 因 Actions 权限失败 | 查看仓库 Settings → Actions → General，允许本工作流使用 GitHub 官方 Actions；组织策略限制需由仓库管理员处理 |
| 工作流没有自动运行 | 确认提交到了 `main`；进入 Actions 选择工作流 → Run workflow → main 可手动启动 |
| check 失败 | 打开红色步骤查看具体信息；不可跳过空种子或数据保护检查来发布真实库存 |
| 部署链接 404 | 确认 `deploy` 成功，使用 Pages 返回的正式网址；仓库根目录应直接有 `dist` |
| 新网址库存为空 | 首次为空是预期结果，在最终主屏幕入口从 JSON 恢复，不要重新上传 Excel 到仓库 |
| 代码已更新但页面仍旧 | 联网后关闭并重开应用；开发时同步更新资源版本和 Service Worker 缓存版本；不要清除本机数据 |
| 要回到旧版本程序 | 恢复 GitHub 中之前的代码提交后重新部署；不等于恢复库存，库存仍需单独备份 |

日后只需修改代码、运行检查并提交到 `main`，工作流会自动重新部署 `dist`。更新程序不会主动清空 IndexedDB，但仍建议重要更新前保存库存备份。

## 官方参考

- [创建 GitHub Pages 网站与可用计划](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [配置 Pages 自动部署](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically)
- [Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Apple：将网站添加为主屏幕网页 App](https://support.apple.com/guide/iphone/turn-a-website-into-an-app-iph42ab2f3a7/ios)

本包已在本地通过 11 项专项自动化测试及公开文件检查；尚未在你的 GitHub 账号运行部署，尚未进行 iPhone Safari 真机测试。账户创建、Pages 开通和首次发布结果以你账号内的实际操作为准。
