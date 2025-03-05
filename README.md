# Image Size MCP

A Model Context Protocol (MCP) service for retrieving image dimensions, supporting both URL and local file sources.

*[中文文档](./readme_zh.md)*

## Features

- Retrieve image dimensions from URLs
- Get image dimensions from local files
- Returns width, height, type, and MIME type information

## Installation

```bash
npm install image-size-mcp
```

## Usage

### Using as an MCP Service

This service provides two tool functions:

1. `get_image_size` - Get dimensions of remote images
2. `get_local_image_size` - Get dimensions of local images

### Examples

#### Getting Remote Image Dimensions

```javascript
// Call the get_image_size tool
const result = await mcp.callTool("get_image_size", {
  options: {
    imageUrl: "https://example.com/image.jpg"
  }
});

// Example response
/*
{
  "width": 800,
  "height": 600,
  "type": "jpg",
  "mime": "image/jpeg"
}
*/
```

#### Getting Local Image Dimensions

```javascript
// Call the get_local_image_size tool
const result = await mcp.callTool("get_local_image_size", {
  options: {
    imagePath: "D:/path/to/image.png"
  }
});

// Example response
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

## Technical Implementation

This project is built on the [probe-image-size](https://github.com/nodeca/probe-image-size) library for image dimension detection.

## License

MIT
