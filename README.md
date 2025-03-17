# Image Tools MCP

A Model Context Protocol (MCP) service for retrieving image dimensions and compressing images, supporting both URL and local file sources.

*[中文文档](./README_zh.md)*

## Features

- Retrieve image dimensions from URLs
- Get image dimensions from local files
- Compress images from URLs using TinyPNG API
- Compress local images using TinyPNG API
- Convert images to different formats (webp, jpeg/jpg, png)
- Returns width, height, type, MIME type, and compression information
- Support for Server-Sent Events (SSE) mode for web clients

## Installation

```bash
npm install image-tools-mcp
```

## Usage

### Using as an MCP Service

This service provides four tool functions:

1. `get_image_size` - Get dimensions of remote images
2. `get_local_image_size` - Get dimensions of local images
3. `compress_image_from_url` - Compress remote images using TinyPNG API
4. `compress_local_image` - Compress local images using TinyPNG API

### Running in SSE Mode

You can run the service in SSE mode to use it with web clients:

```bash
npm run start:sse -- --port 9876
```

Then open http://localhost:9876 in your browser to use the web client.

### Client Integration

To use this MCP service, you need to connect to it from an MCP client. Here are examples of how to integrate with different clients:

#### Using with Claude Desktop

1. Install Claude Desktop from [claude.ai/download](https://claude.ai/download)
2. Get TinyPNG API key: Visit [TinyPNG](https://tinypng.com/developers) and get your API key
3. Configure Claude Desktop to use this MCP server by editing the configuration file:

```json
{
  "mcpServers": {
    "image-tools": {
      "command": "npx",
      "args": ["image-tools-mcp"],
      "env": {
        "TINIFY_API_KEY": "<YOUR_TINIFY_API_KEY>"
      }
    }
  }
}
```

3. Restart Claude Desktop
4. Ask Claude to get image dimensions: "Can you tell me the dimensions of this image: https://example.com/image.jpg?"
5. Ask Claude to compress an image: "Can you compress this image: https://example.com/image.jpg?"
6. Ask Claude to compress a local image: "Can you compress this image: D:/path/to/image.png?"
7. Ask Claude to compress a local image folder: "Can you compress this folder: D:/imageFolder?"

#### Using with MCP Client Library

```typescript
import { McpClient } from "@modelcontextprotocol/client";

// Initialize the client
const client = new McpClient({
  transport: "stdio" // or other transport options
});

// Connect to the server
await client.connect();

// Get image dimensions from URL
const urlResult = await client.callTool("get_image_size", {
  options: {
    imageUrl: "https://example.com/image.jpg"
  }
});
console.log(JSON.parse(urlResult.content[0].text));
// Output: { width: 800, height: 600, type: "jpg", mime: "image/jpeg" }

// Get image dimensions from local file
const localResult = await client.callTool("get_local_image_size", {
  options: {
    imagePath: "D:/path/to/image.png"
  }
});
console.log(JSON.parse(localResult.content[0].text));
// Output: { width: 1024, height: 768, type: "png", mime: "image/png", path: "D:/path/to/image.png" }

// Compress image from URL
const compressUrlResult = await client.callTool("compress_image_from_url", {
  options: {
    imageUrl: "https://example.com/image.jpg",
    outputFormat: "webp" // Optional: convert to webp, jpeg/jpg, or png
  }
});
console.log(JSON.parse(compressUrlResult.content[0].text));
// Output: { originalSize: 102400, compressedSize: 51200, compressionRatio: "50.00%", tempFilePath: "/tmp/compressed_1615456789.webp", format: "webp" }

// Compress local image
const compressLocalResult = await client.callTool("compress_local_image", {
  options: {
    imagePath: "D:/path/to/image.png",
    outputPath: "D:/path/to/compressed.webp", // Optional
    outputFormat: "image/webp" // Optional: convert to image/webp, image/jpeg, or image/png
  }
});
console.log(JSON.parse(compressLocalResult.content[0].text));
// Output: { originalSize: 102400, compressedSize: 51200, compressionRatio: "50.00%", outputPath: "D:/path/to/compressed.webp", format: "webp" }

### Tool Schemas

#### get_image_size

```typescript
{
  options: {
    imageUrl: string // URL of the image to retrieve dimensions for
  }
}
```

#### get_local_image_size

```typescript
{
  options: {
    imagePath: string // Absolute path to the local image file
  }
}
```

#### compress_image_from_url

```typescript
{
  options: {
    imageUrl: string // URL of the image to compress
    outputFormat?: "webp" | "jpeg" | "jpg" | "png" // Optional output format
  }
}
```

#### compress_local_image

```typescript
{
  options: {
    imagePath: string // Absolute path to the local image file
    outputPath?: string // Optional absolute path for the compressed output image
    outputFormat?: "image/webp" | "image/jpeg" | "image/jpg" | "image/png" // Optional output format
  }
}
```

## Technical Implementation

This project is built on the following libraries:
- [probe-image-size](https://github.com/nodeca/probe-image-size) - For image dimension detection
- [tinify](https://github.com/tinify/tinify-nodejs) - For image compression via the TinyPNG API

## Environment Variables

- `TINIFY_API_KEY` - Required for image compression functionality. Get your API key from [TinyPNG](https://tinypng.com/developers)

## License

MIT
