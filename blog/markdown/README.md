# Unclecode Blog Engine

This is a simple static blog engine that converts Markdown files to HTML blog posts.

## How to Use

1. Create a new Markdown file in the `blog/markdown` directory.
2. Add YAML frontmatter at the top of the file:

```yaml
---
title: Your Post Title
date: 2025-02-28
author: Your Name
description: A short description of your post.
keywords: comma, separated, keywords
tags: tag1, tag2, tag3
categories: category1, category2
reading_time: X min
---
```

3. Write your blog post in Markdown format after the frontmatter.
4. Run the blog generator:

```bash
python build.py
```

5. The generator will:
   - Create/update HTML files in the `blog/posts` directory
   - Update navigation links between posts
   - Update the blog listing on the blog home page

## Markdown Features

The blog engine supports various Markdown features:

- Code blocks with syntax highlighting (```language)
- Tables
- Images
- Lists
- Headers
- Links
- Blockquotes
- And more!

## Code Blocks

Code blocks are automatically enhanced with syntax highlighting and copy buttons:

```python
def hello_world():
    print("Hello, world!")
```

## Images

Images are displayed inline:

![Image description](path/to/image.jpg)

## Tables

Tables are formatted neatly:

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

## Metadata

- `title`: The title of your blog post
- `date`: The publication date (YYYY-MM-DD format)
- `author`: The author name
- `description`: A short description for SEO
- `keywords`: Keywords for SEO (comma-separated)
- `tags`: Tags for categorization (comma-separated)
- `categories`: Categories for filtering (comma-separated)
- `reading_time`: Estimated reading time (e.g., "5 min")

## Files Structure

- `blog/markdown/`: Contains source Markdown files
- `blog/posts/`: Contains generated HTML files
- `blog/posts/post-base.html`: Template for blog posts
- `assets/js/blog.js`: Blog post data for the home page
- `build.py`: Blog generator script