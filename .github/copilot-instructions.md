## 简介

本项目是 Web Tieba Manager 的前端界面，基于 Vue 3, Vite, TypeScript 和 Element Plus 构建。

## 架构与约定


### 1. 组件与 API 导入

本项目未启用 `src/components/` 目录下组件的自动全局注册，也未对 Vue/Vue Router 的组合式 API 进行自动导入。请在需要的 `.vue` 文件中手动导入所需组件和 API。例如：

```typescript
import { ref, computed } from 'vue';
import CustomCard from '@/components/CustomCard.vue';
```

如需类型提示，请参考 `auto-imports.d.ts` 和 `components.d.ts` 文件。

### 2. API 请求

- **封装**: 所有与后端 API 的交互都应通过 `src/lib/request.ts` 中导出的 `service` 对象进行。这是一个预配置的 `axios` 实例。
- **认证**: `service` 会自动处理请求头中的 `Authorization` Token。Token 的获取和存储逻辑位于 `src/lib/token.ts`。
- **示例**:
  ```typescript
  // src/lib/request.ts
  import service from '@/lib/request';

  // 使用
  service.get('/api/user/config').then(response => {
    // ...
  });
  ```

### 3. 状态管理与业务逻辑

- **数据处理**: 针对特定数据模型（如规则、操作）的复杂业务逻辑和类型定义被组织在 `src/lib/data/` 目录中。例如，`src/lib/data/rule.ts` 包含了处理封禁规则的相关函数。
- **全局状态**: 项目倾向于使用组合式函数 (`composables`) 来管理跨组件的共享状态，而不是使用 Pinia 或 Vuex。相关逻辑可以在 `src/lib/hook.ts` 中找到或创建。

### 4. UI 组件

- **UI 库**: 项目使用 [Element Plus](https://element-plus.org/)。请遵循其组件用法和风格。
- **自定义组件**:
    - 通用的、可复用的组件位于 `src/components/`。
    - 特定于某个业务场景的组件（例如 `operationTemplate` 或 `conditionTemplate`）被组织在 `src/views/` 下的相应目录中，并通过 `index.ts` 导出。

## 开发流程

### 1. 环境设置

- **安装依赖**:
  ```bash
  npm install
  ```
- **启动开发服务器**:
  ```bash
  npm run dev
  ```
- **后端依赖**: 前端开发依赖于一个正在运行的 [Web Tieba Manager](https://github.com/TiebaMeow/WebTiebaManager) 后端服务。后端需要使用 `--dev-webui` 标志启动，以允许跨域请求。

### 2. 代码规范

- **Linting**: 使用 `eslint` 进行代码规范检查。在提交代码前，运行 `npm run lint` 来检查并自动修复大部分问题。
- **类型检查**: 使用 `vue-tsc` 进行 TypeScript 类型检查。运行 `npm run type-check` 来捕获任何类型错误。

### 3. 构建

- **生产构建**:
  ```bash
  npm run build
  ```
  该命令会首先进行类型检查，然后使用 Vite 打包应用到 `dist` 目录。
