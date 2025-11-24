# txt2mcp Product Requirements Document

## Executive Summary

txt2mcp is a Cloudflare Workers-based service that converts text files into MCP (Model Context Protocol) servers with automatic updates for remote files. The service generates nanoid-based subdomains for each file, providing developers with a simple way to create accessible MCP servers from text content.

Key Value Propositions:
- Instant text-to-MCP conversion with unique subdomain access
- Automatic updates for remote files via Durable Objects  
- Zero-configuration deployment via Cloudflare's edge infrastructure
- Simple web interface for file management

## Problem Statement

Developers working with MCP (Model Context Protocol) face several challenges:
- No simple way to convert text files into properly formatted MCP servers
- Difficulty maintaining up-to-date content when source files change
- Need for reliable, scalable hosting for MCP endpoints
- Lack of user-friendly tools for MCP server management

## Core Features & Requirements

### 1. Nanoid-Based Subdomain Generation
- Generate unique nanoid identifiers for each file upload (not file hashes)
- Wildcard subdomain support (*.txt2mcp.dev)
- Access pattern: `{nanoid}.txt2mcp.dev` serves the generated MCP server

### 2. Dual File Support System
- Direct Uploads: Text files up to 10MB with drag-and-drop interface
- Remote Files: HTTP/HTTPS URLs with automatic updates via Durable Objects or cron jobs

### 3. R2 Storage Architecture
```
txt2mcp-bucket/
├── {nanoid}/
│   ├── original.txt          # Source file content
│   ├── metadata.json         # File metadata and configuration
│   ├── mcp-server.json      # Generated MCP server config
│   └── update-log.json      # Update history for remote files
```

### 4. Rate Limiting & Security
- Cloudflare binding for rate limiting
- 10 files per hour per IP upload limit
- Content validation and file size restrictions

## Frontend Specifications

Static Astro Site with 3 Tabs:

### Create Tab
- File upload interface with drag-and-drop
- Remote URL input field
- Upload progress indicators
- Success state with nanoid and subdomain display

### Files Tab  
- List files with correct nanoid access
- View metadata (name, status, creation date)
- Management actions (delete, update frequency)
- Copy-to-clipboard functionality for URLs

### About Tab
- Project information and documentation
- API usage examples
- MCP server format explanation

## Technical Architecture

### Backend Infrastructure
- Cloudflare Workers: Backend processing and API endpoints
- R2 Storage: File storage with nanoid as folder keys
- Durable Objects: State management for remote file updates
- Workers Cron: Scheduled updates for remote files
- Wildcard DNS: *.txt2mcp.dev subdomain routing

### API Endpoints
```
POST /api/upload        # Direct file upload
POST /api/remote        # Add remote file URL  
GET /api/files          # List user files
GET /api/status/{nanoid} # File status and metadata
DELETE /api/files/{nanoid} # Delete file
PUT /api/files/{nanoid}/frequency # Update remote file frequency
```

### MCP Server Generation
- Parse text files into structured MCP format
- Generate appropriate tools and resources based on content
- Serve via subdomain with proper CORS headers

## Implementation Plan

### Phase 1: Core Infrastructure (Weeks 1-2)
- Set up Cloudflare Workers environment
- Configure R2 bucket with proper permissions
- Implement nanoid generation and basic file upload
- Set up wildcard DNS for *.txt2mcp.dev

### Phase 2: File Processing (Week 3)
- Text-to-MCP conversion logic
- R2 storage and retrieval functions
- Subdomain routing system
- Basic error handling and validation

### Phase 3: Remote File Support (Week 4)
- Durable Objects for update management
- Remote URL fetching and validation
- Cron job system for scheduled updates
- Update frequency configuration

### Phase 4: Frontend Development (Weeks 5-6)
- Astro project setup with three-tab interface
- Upload functionality and progress tracking
- File management interface
- Documentation and about page

### Phase 5: Polish & Deploy (Week 7)
- Rate limiting implementation
- Comprehensive error handling
- Performance optimization
- Security hardening and production deployment

## Security Considerations
- Input validation for file uploads and URLs
- Rate limiting to prevent abuse
- Content-type validation (text files only)
- File size limits and malicious content scanning
- Secure R2 bucket configuration with appropriate CORS

## Performance Requirements
- File upload processing: < 3 seconds
- MCP server response: < 500ms
- Remote file updates: < 10 seconds
- 99.9% uptime target
- Support for 1000+ requests per minute per nanoid

## Success Metrics
- Upload success rate > 99%
- Average processing time < 3 seconds  
- Subdomain availability > 99.9%
- Remote file update reliability > 95%
- User return rate within 7 days > 30%

This comprehensive PRD provides the foundation for building txt2mcp as a robust, scalable service that makes MCP server creation accessible to developers.