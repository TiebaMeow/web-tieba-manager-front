
<div align="center">

# Web Tieba Manager Front

_基于 [vue3](https://vuejs.org/) [element-plus](https://element-plus.org/) 的贴吧管理前端界面_

</div>

## 目录

- [概述](#概述)
  - [目录结构](#目录结构)
- [开发指南](#开发指南)

## 概述

本项目为 [Web Tieba Manager](https://github.com/TiebaMeow/WebTiebaManager) 的前端界面，提供贴吧账号的管理与操作功能。

### 目录结构

```text
├── .github
│   ├── workflow
│   │   ├── package.yml     # 自动构建并上传服务器
│   │   └── ci.yml          # 代码检查
│   └── code.txt            # 版本代号
├── build                   # python构建脚本
├── public
├── src
│   ├── components          # 公共组件
│   ├── libs
│   │   ├── data            # 数据处理相关
│   │   ├── token.ts        # 附带token的axios封装
│   │   └── ...
│   ├── routers
│   ├── views               # 主要页面视图
│   ├── App.vue
│   ├── font.css            # 日志字体样式
│   └── main.ts
├── .eslintrc.cjs
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 开发指南

以下命令以 Windows PowerShell + npm 为例（如使用 pnpm/yarn，请替换相应命令）。

1. 安装依赖

    ```powershell
    npm install
    ```

2. 启动开发服务器（默认 5173 端口，见 Vite 配置）

    ```powershell
    npm run dev
    ```

3. 启动WTM

    假设你已经在本地部署并运行了 WTM 服务端（见 [Web Tieba Manager](https://github.com/TiebaMeow/WebTiebaManager)）

    ```powershell
    uv run start.py --dev-webui
    # or
    WebTM.exe --dev-webui
    ```
