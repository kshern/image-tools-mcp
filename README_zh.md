# 图像工具 MCP 服务

这是一个符合Model Context Protocol (MCP)的服务，提供图片尺寸获取和压缩功能，支持URL和本地文件源。

## 功能

- 获取网络图片尺寸
- 获取本地图片尺寸
- 压缩网络图片（使用TinyPNG API）
- 压缩本地图片（使用TinyPNG API）
- 支持标准输入/输出(stdio)传输
- 支持服务器发送事件(SSE)传输

### 效果展示

![效果图1](./public/image_1.png)
![效果图2](./public/image_2.png)

## 安装

```bash
npm install image-tools-mcp
```

## 使用方法

### 作为命令行工具

#### 使用标准输入/输出传输（默认）

```bash
npx image-tools-mcp
```

#### 使用SSE传输（Web模式）

```bash
npx image-tools-mcp --sse
# 可选：指定端口
npx image-tools-mcp --sse --port 8080
```

启动后，您可以访问：
- http://localhost:3000 - 测试客户端页面
- http://localhost:3000/sse - SSE流连接端点
- http://localhost:3000/messages - 消息发送端点

### 作为库使用

在你的代码中：

```javascript
import { createServer } from 'image-tools-mcp/dist/server.js';
import { registerAllTools } from 'image-tools-mcp/dist/tools/index.js';
import { createTransport } from 'image-tools-mcp/dist/transport/transportFactory.js';

// 创建MCP服务器
const server = createServer();

// 注册所有工具
registerAllTools(server);

// 使用SSE传输
createTransport(server, { type: 'sse', port: 3000 });

// 或者使用标准输入/输出传输
const transport = createTransport(server, { type: 'stdio' });
await server.connect(transport);
```

## 工具说明

### 获取图片尺寸（URL）
通过URL获取图片的宽度、高度和格式信息。

```json
{
  "name": "get_image_size",
  "options": {
    "imageUrl": "https://example.com/image.jpg"
  }
}
```

4. 重启 Claude Desktop
5. 请求 Claude 获取图片尺寸："告诉我这张图片的尺寸：https://example.com/image.jpg"
6. 请求 Claude 压缩图片："帮我压缩这张图片：https://example.com/image.jpg"
7. 请求 Claude 压缩本地图片："帮我压缩这张图片：D:/path/to/image.png"
8. 请求 Claude 压缩本地图片："帮我压缩这个文件夹下的图片：D:/imageFolder/"

```json
{
  "name": "get_local_image_size",
  "options": {
    "imagePath": "/path/to/local/image.jpg"
  }
}
```

### 压缩图片（URL）
使用TinyPNG API压缩网络图片。

```json
{
  "name": "compress_image_from_url",
  "options": {
    "imageUrl": "https://example.com/image.jpg",
    "outputFormat": "webp" // 可选，支持 "webp", "jpeg", "jpg", "png"
  }
}
```

### 压缩图片（本地文件）
使用TinyPNG API压缩本地图片文件。

```json
{
  "name": "compress_local_image",
  "options": {
    "imagePath": "/path/to/local/image.jpg",
    "outputPath": "/path/to/output/image.webp", // 可选
    "outputFormat": "image/webp" // 可选，支持 "image/webp", "image/jpeg", "image/jpg", "image/png"
  }
}
```

## 环境变量

使用TinyPNG压缩功能需要设置API密钥：

```bash
export TINIFY_API_KEY="your_api_key_here"
```

## SSE传输说明

SSE传输允许服务器向客户端实时推送消息。在MCP中，它主要用于以下场景：

1. 服务器需要向客户端推送实时更新
2. 在网络限制场景下使用
3. 实现简单的消息更新

通过SSE模式启动后，可以使用提供的HTML客户端页面进行测试，或者创建自己的客户端。

### HTTP端点

- `GET /sse` - 建立SSE连接
- `POST /messages` - 发送消息到服务器
- `GET /status` - 检查服务器状态

### 客户端示例

```javascript
// 连接到SSE流
const eventSource = new EventSource('/sse');

eventSource.addEventListener('connected', function(e) {
  console.log('已连接到SSE');
});

eventSource.addEventListener('message', function(e) {
  console.log('收到消息:', JSON.parse(e.data));
});

// 调用工具
fetch('/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: "123",
    method: "tool/execute",
    params: {
      name: "get_image_size",
      options: {
        imageUrl: "https://example.com/image.jpg"
      }
    }
  })
});
```

## 许可

MIT