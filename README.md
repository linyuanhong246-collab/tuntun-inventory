# 囤囤管家 · GitHub Pages 发布包

基于 v0.13.1，保留奶油森林配色、四列图标／列表切换、自由输入新增产品、规格快捷加减、位置、补货提醒、归档恢复、操作流水、撤销和 JSON 备份。

这是可独立上传的新仓库文件，不含原项目 Git 历史、正式库存 Excel、真实库存清单、备份、账户信息或原托管配置。`dist/seed.json` 固定为 `[]`，首次打开为空库存。旧网站不受影响。

## 从这里开始

完整操作见 [GITHUB-PAGES-GUIDE.md](GITHUB-PAGES-GUIDE.md)。推荐仓库名称 `tuntun-inventory`，主分支 `main`。

| 文件 | 用途 |
| --- | --- |
| `dist/` | 可直接发布的 PWA 源码和图标，只部署此目录 |
| `.github/workflows/deploy-pages.yml` | 自动验证与发布 |
| `GITHUB-ACTIONS.txt` | 与上述配置相同，方便网页创建工作流时复制 |
| `scripts/check-release.cjs` | 空种子、公开文件清单、子路径和 PWA 资源检查 |
| `tests/` | 11 项合成数据测试，不使用真实库存 |
| `.gitignore` | 排除常见库存文件和本地文件；网页上传时仍需自己避免选择备份 |

## 本地验证

使用 Node.js 24，无需安装 npm 依赖：

```sh
node scripts/check-release.cjs
node --test tests/*.test.cjs
```

GitHub Actions 对每次推送和拉取请求运行检查。只有 `main` 的推送或手动运行会发布，检查失败则停止。Actions 只上传 `dist`，无需个人访问令牌或额外 Secrets。

## 数据

网站代码托管在 GitHub Pages，库存仍是设备本地 IndexedDB，不会自动同步设备。换网址需要从旧站导出备份，在新站恢复。不要把自己的 JSON 备份或 Excel 上传到仓库。

GitHub Pages 同一 `用户名.github.io` 下的项目共享浏览器源；本应用数据库名仍为 `tuntun-inventory`。建议同一账号域名只保留一个正式使用的囤囤管家实例。缓存按仓库路径隔离；这不会将 IndexedDB 按路径隔离。

## 与现有站点的差异

- 将公开种子改为空数组；初始化来源文字改为通用描述。
- 启动画面改为通用“正在打开库存”。
- Service Worker 缓存按站点路径命名，避免删除同源其他项目的缓存；离线首页使用完整的作用域路径。
- 不改动库存计算、JSON 备份格式、数据库版本或恢复流程。

## 验证边界

本发布包的 11 项检查已通过，使用 Node、内存 IndexedDB 替身和 UI／Service Worker 事件模拟。此前主版本有 153 项自动化检查通过；这两个数字不能合称本包通过 164 项测试。尚未运行真实 GitHub Actions、实际 Pages 部署或 iPhone Safari 真机验收。

## 后续更新

修改 `dist/` 后同步更新 `index.html` 中修改资源的版本参数、`sw.js` 的 `ASSETS` 版本参数和缓存版本。运行检查，提交到 `main` 即自动发布。始终保持公开 `seed.json` 为 `[]`，不要用真实库存替换它。日常库存变化不需要提交代码。

仓库公开不等于已选择开源许可证。本包未替你授予额外的开源授权；如计划开放他人再分发，可另行选定合适许可证。
