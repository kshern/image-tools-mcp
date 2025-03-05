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

### 示例

#### 获取远程图片尺寸

```javascript
// 调用 get_image_size 工具
const result = await mcp.callTool("get_image_size", {
  options: {
    imageUrl: "https://example.com/image.jpg"
  }
});

// 返回结果示例
/*
{
  "width": 800,
  "height": 600,
  "type": "jpg",
  "mime": "image/jpeg"
}
*/
```

#### 获取本地图片尺寸

```javascript
// 调用 get_local_image_size 工具
const result = await mcp.callTool("get_local_image_size", {
  options: {
    imagePath: "D:/path/to/image.png"
  }
});

// 返回结果示例
/*
{
  "width": 1024,
  "height": 768,
  "type": "png",
  "mime": "image/png",
  "path": "D:/path/to/image.png"
}
*/
```

## 技术实现

本项目基于 [probe-image-size](https://github.com/nodeca/probe-image-size) 库实现图片尺寸的获取功能。

## 许可证

MIT