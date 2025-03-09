# Image Tools MCP

A Model Context Protocol (MCP) service for retrieving image dimensions, supporting both URL and local file sources.

*[中文文档](./readme_zh.md)*

## Features

- Retrieve image dimensions from URLs
- Get image dimensions from local files
- Returns width, height, type, and MIME type information

## Installation

```bash
npm install image-tools-mcp
```

## Usage

### Using as an MCP Service

This service provides two tool functions:

1. `get_image_size` - Get dimensions of remote images
2. `get_local_image_size` - Get dimensions of local images

### Client Integration

To use this MCP service, you need to connect to it from an MCP client. Here are examples of how to integrate with different clients:

#### Using with Claude Desktop

1. Install Claude Desktop from [claude.ai/download](https://claude.ai/download)
2. Configure Claude Desktop to use this MCP server by editing the configuration file:

```json
{
  "mcpServers": {
    "image-tools": {
      "command": "npx",
      "args": ["image-tools-mcp"]
    }
  }
}
```

3. Restart Claude Desktop
4. Ask Claude to get image dimensions: "Can you tell me the dimensions of this image: https://example.com/image.jpg?"

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
```

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

## Technical Implementation

This project is built on the [probe-image-size](https://github.com/nodeca/probe-image-size) library for image dimension detection.

## License

MIT
