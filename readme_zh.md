# Image Size MCP

一个基于 Model Context Protocol (MCP) 的图片尺寸获取服务，支持从 URL 和本地文件获取图片尺寸信息。

## 功能特点

- 支持从 URL 获取远程图片尺寸
- 支持从本地文件获取图片尺寸
- 返回图片的宽度、高度、类型和 MIME 类型

## 安装

```bash
npm install image-size-mcp
```

## 使用方法

### 作为 MCP 服务使用

该服务提供了两个工具函数：

1. `get_image_size` - 获取远程图片尺寸
2. `get_local_image_size` - 获取本地图片尺寸

### 客户端集成

要使用此 MCP 服务，您需要从 MCP 客户端连接到它。以下是与不同客户端集成的示例：

#### 与 Claude Desktop 一起使用

1. 从 [claude.ai/download](https://claude.ai/download) 安装 Claude Desktop
2. 通过编辑配置文件，配置 Claude Desktop 使用此 MCP 服务器：

```json
{
  "mcpServers": {
    "image-size": {
      "command": "npx",
      "args": ["image-size-mcp"]
    }
  }
}
```

3. 重启 Claude Desktop
4. 请求 Claude 获取图片尺寸："能告诉我这张图片的尺寸吗：https://example.com/image.jpg？"

#### 使用 MCP 客户端库

```typescript
import { McpClient } from "@modelcontextprotocol/client";

// 初始化客户端
const client = new McpClient({
  transport: "stdio" // 或其他传输选项
});

// 连接到服务器
await client.connect();

// 从 URL 获取图片尺寸
const urlResult = await client.callTool("get_image_size", {
  options: {
    imageUrl: "https://example.com/image.jpg"
  }
});
console.log(JSON.parse(urlResult.content[0].text));
// 输出: { width: 800, height: 600, type: "jpg", mime: "image/jpeg" }

// 从本地文件获取图片尺寸
const localResult = await client.callTool("get_local_image_size", {
  options: {
    imagePath: "D:/path/to/image.png"
  }
});
console.log(JSON.parse(localResult.content[0].text));
// 输出: { width: 1024, height: 768, type: "png", mime: "image/png", path: "D:/path/to/image.png" }
```

### 工具模式

#### get_image_size

```typescript
{
  options: {
    imageUrl: string // 要获取尺寸的图片 URL
  }
}
```

#### get_local_image_size

```typescript
{
  options: {
    imagePath: string // 本地图片文件的绝对路径
  }
}
```

## 技术实现

本项目基于 [probe-image-size](https://github.com/nodeca/probe-image-size) 库实现图片尺寸的获取功能。

## 许可证

MIT