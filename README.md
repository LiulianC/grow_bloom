# 成长小账本（Bloom Diary）
一个专注于“用即时激励养成积极习惯”的轻量级 Web 应用。你可以记录学习、任务完成、起床/睡觉打卡，系统以“收入”的方式给出正反馈；内置图表查看趋势，支持数据导出与自动备份。

<img src="./logo1024.png" alt="成长小账本" width="20%" title="成长小账本">

- 纯前端，无后端依赖，静态资源即可运行
- 支持 PWA（浏览器安装到桌面，离线可用）
- 提供 Android WebView 壳接入指南，可原生分享 CSV 到微信等应用


## 功能概览

- 每日总览：今日收入、完成任务、学习时长
- 学习计时：正计时/倒计时，按学习时长自动计算“自我提升”收入
- 任务系统：五大类别 + 自定义类别（模板/新增/完成）
- 红账本：记录“美好时刻”，支持历史查看与详情
- 统计图表：
  - 收入（饼图/折线图：日/周/月/年）
  - 睡眠（柱状图：最近时长）
  - 起床（折线图：起床时间与目标时间对比）
- 通知系统：应用内提示 +（可选）系统通知
- 数据管理：
  - 自动每日备份（默认 23:00）
  - CSV 导出（统计页）
  - 全量 JSON 导出（设置页）
  - “数据文件夹”浏览（文件列表/大小/时间）


## 技术栈与关键点

- 原生 HTML/CSS/JavaScript
- Chart.js 3.x（动态加载：HTTPS 用 CDN，file:// 回落本地）
- Service Worker（缓存静态资源，离线友好；需 HTTPS/localhost）
- 本地存储策略（FileVault）：
  - 优先 OPFS（Origin Private File System，安全上下文）
  - 回退 localStorage（file:// 或 WebView）
  - 统一的文件列表/读取/保存 API
- Web Share + 原生桥接（Android WebView 场景下，建议接入原生分享）


## 目录结构（核心）

```
/
├─ index.html
├─ manifest.json               # PWA（仅 HTTPS/localhost 注入）
├─ service-worker.js           # PWA 缓存/离线（需要 HTTPS）
├─ css/
├─ img/icons/                  # PWA 图标
├─ js/
│  ├─ app.js                   # 入口与页面逻辑整合
│  ├─ storage.js               # 数据读写/聚合
│  ├─ statistics.js            # 图表/导出 CSV
│  ├─ tasks.js                 # 任务系统
│  ├─ timer.js                 # 计时器
│  ├─ redbook.js               # 红账本
│  ├─ notifications.js         # 通知（应用内 + 系统）
│  ├─ settings.js              # 设置页/文件列表
│  └─ fileVault.js             # OPFS/localStorage 统一文件抽象
└─ fonts/ css/ ...
```


## 本地运行

你可以直接双击打开 index.html 体验大多数功能；但推荐用本地静态服务器以获得更完整体验（例如更安全地加载 Chart.js）。

- 使用 Node
  ```bash
  npx http-server -p 8080 .
  # 或
  npx serve .
  ```
- 使用 Python
  ```bash
  python3 -m http.server 8080
  ```

打开 http://localhost:8080/。


## PWA 与离线

- Service Worker 仅在安全上下文工作（HTTPS/localhost）
- index.html 会在 HTTPS/localhost 时动态注入 manifest.json 与通过 CDN 加载 Chart.js；在 file:// 下自动改为本地 js/chart.min.js
- 当前 service-worker.js 采用“网络优先 + 回写缓存”，默认将部分静态资源加入缓存

提示：
- 如果你主要在 Android WebView（file://）内使用，建议不要缓存第三方 CDN 资源，避免离线 MISS，可在 service-worker.js 的预缓存列表中移除 CDN 条目。


## 数据与存储

- 本地存储键（localStorage）示例：
  - bloom_daily_data
  - bloom_tasks
  - bloom_custom_categories
  - bloom_settings
  - bloom_redbook_entries
  - bloom_redbook_settings
- FileVault（js/fileVault.js）
  - 文件夹名：BloomData
  - localStorage 保存文件时使用前缀 bloom_vault_
  - 统一返回 { ok, storage }，storage 为 'opfs' 或 'localStorage' 或 'download'
- 自动备份：
  - 默认每日 23:00
  - 最新备份文件名：latest_data.json


## 导出与分享

- 统计页右上角“导出数据”按钮：导出为 CSV
- 设置页“导出所有数据”：导出为 full_export_YYYY-MM-DD.json

环境差异：
- 浏览器（HTTPS/Chrome）：优先使用 Web Share 分享文件；不支持时分享文本或直接下载
- Android WebView（file://）：Web Share 通常不可用，建议接入“原生桥接”来分享文件（见下方）


## Android WebView 原生壳（可选但推荐）

为什么需要原生桥？
- WebView 的 file:// 环境不支持 Service Worker/OPFS/Web Share（多数机型）
- 直接用 intent:// 在 WebView 中会报 ERR_UNKNOWN_URL_SCHEME
- 通过原生注入 JS 接口，可以把 CSV 写入缓存，并用 FileProvider 分享给微信等 App

快速步骤：
1) 在 Android 工程的 AndroidManifest.xml 增加 FileProvider（authorities 与包名保持一致）
2) 在 res/xml/ 新增 file_paths.xml（允许共享 cacheDir/shared/ 下文件）
3) 在 MainActivity 内部嵌 WebView，开启 JS，注入接口：
   - window.AndroidShare.shareFileBase64(base64, mime, filename)
   - window.AndroidShare.shareText(title, text)
4) 前端在导出逻辑里优先检测 window.AndroidShare 并调用 shareFileBase64

代码参考（节选）：
```xml
<!-- app/src/main/AndroidManifest.xml -->
<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="com.your.pkg.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_paths"/>
</provider>
```

```xml
<!-- app/src/main/res/xml/file_paths.xml -->
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <cache-path name="shared" path="shared/"/>
    <external-cache-path name="extshared" path="shared/"/>
</paths>
```

```kotlin
// MainActivity.kt 片段
webView.addJavascriptInterface(ShareBridge(), "AndroidShare")

@JavascriptInterface
fun shareFileBase64(base64: String, mime: String, filename: String) { /* 写入 cacheDir/shared 并用 FileProvider 分享 */ }
```

前端已内置原生优先的导出逻辑（js/statistics.js → exportCSV），检测到 `window.AndroidShare.shareFileBase64` 即走原生分享；否则回退为 Web Share/下载/保存。


## 应用图标（Android）

- Android APP 图标来自原生工程的 mipmap/ic_launcher，而不是 Web 的 manifest.json
- 最简单方法：Android Studio → 右键 res → New → Image Asset → Launcher Icons (Adaptive and Legacy)
- 常用源图规格：1024×1024 PNG（可不透明），建议前景缩小到画布中间 2/3，背景用品牌色
- 会自动生成：
  - mipmap-anydpi-v26/ic_launcher.xml（adaptive 图标）
  - mipmap-*/ic_launcher（各密度位图）
  - 同名 round 资源（圆形图标）


## 已知限制与排错

- file:// 环境
  - manifest.json 会被跳过（代码已做动态判断）
  - Service Worker/OPFS/Web Share 大多不可用 → 已提供回退与原生桥方案
- Chart.js 加载失败或 net::ERR_CACHE_MISS
  - 采用“HTTPS/localhost 用 CDN，失败回退本地；file:// 直接本地”
  - 建议不要由 SW 预缓存第三方 CDN
- intent:// 报 ERR_UNKNOWN_URL_SCHEME
  - WebView 不支持该协议跳转，请使用原生桥或外部浏览器打开
- “该浏览器不支持通知”
  - 系统通知权限未开或环境不支持；应用内通知不受影响


## 开发小贴士

- 首次进入统计页时，会尝试初始化和更新图表；如果 Chart.js 未就绪，模块会进入“简化模式”（basic stats）
- 你可以在设置 → 开发者模式 中添加过去 7 天测试数据，便于图表调试
- 数据大小统计与“数据文件夹”浏览可在设置中查看


## 贡献与路线图

欢迎提交 Issue/PR：
- 改进离线策略（剥离第三方 CDN 缓存）
- 更多可视化（完成率/番茄钟等）
- 数据同步/备份到云端
- 多语言与无障碍优化


## 许可

未设置许可证（License）。在发布前请补充 LICENSE 文件（例如 MIT）。

---

如需将本项目作为“Android App”发布，强烈建议按“Android WebView 原生壳”一节接入分享桥接与 FileProvider，以获得稳定的文件分享体验。
