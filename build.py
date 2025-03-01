#!/usr/bin/env python3
"""
Blog Post Generator for Unclecode

This script processes Markdown files with YAML frontmatter and generates HTML blog posts.
It also updates the blog index with the latest posts data.

Usage:
    python build.py

Features:
    - Converts Markdown to HTML
    - Parses YAML frontmatter
    - Generates HTML from templates
    - Updates blog post index
    - Only regenerates changed posts (based on hash)
    - Updates navigation links between posts
"""

import os
import sys
import re
import json
import hashlib
import glob
import datetime
import time
from pathlib import Path
import markdown
import yaml

# Configuration
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
MARKDOWN_DIR = os.path.join(ROOT_DIR, 'blog', 'markdown')
POSTS_DIR = os.path.join(ROOT_DIR, 'blog', 'posts')
TEMPLATES_DIR = os.path.join(ROOT_DIR, 'blog', 'posts')
BLOG_JS_PATH = os.path.join(ROOT_DIR, 'assets', 'js', 'blog.js')

# Ensure directories exist
os.makedirs(MARKDOWN_DIR, exist_ok=True)
os.makedirs(POSTS_DIR, exist_ok=True)

# Markdown extensions
MD_EXTENSIONS = [
    'markdown.extensions.fenced_code',
    'markdown.extensions.tables',
    'markdown.extensions.codehilite',
    'markdown.extensions.toc',
    'markdown.extensions.nl2br',
    'markdown.extensions.attr_list',
]

def get_file_hash(content):
    """Calculate hash of file content."""
    return hashlib.md5(content.encode('utf-8')).hexdigest()

def slugify(text):
    """Convert text to slug format for URLs."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

def parse_markdown(md_file):
    """Parse Markdown file with YAML frontmatter."""
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract YAML frontmatter
    frontmatter_match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    if not frontmatter_match:
        print(f"Error: No frontmatter found in {md_file}")
        return None, None, None
    
    frontmatter = frontmatter_match.group(1)
    metadata = yaml.safe_load(frontmatter)
    
    # Extract content after frontmatter
    markdown_content = content[frontmatter_match.end():]
    
    # Calculate hash of the entire file
    file_hash = get_file_hash(content)
    
    return metadata, markdown_content, file_hash

def convert_markdown_to_html(md_content):
    """Convert Markdown content to HTML."""
    # Pre-process for file name extraction from code blocks
    # We need to do this manually since Markdown doesn't support attributes like data-filename

    # Create a regex pattern to find all code blocks
    code_blocks_pattern = re.compile(r'```(.*?)```', re.DOTALL)
    
    # Function to replace each code block
    def process_code_block(match):
        code_block = match.group(0)
        first_line = code_block.split('\n')[0].strip()
        
        # Check if first line has a file name (contains a period)
        if '.' in first_line[3:] and ' ' not in first_line[3:].strip():
            file_name = first_line[3:].strip()
            extension = file_name.split('.')[-1]
            
            # Replace the first line with just the language
            rest_of_block = '\n'.join(code_block.split('\n')[1:])
            # Add a special marker to identify this code block has a filename
            return f"```{extension} filename={file_name}\n{rest_of_block}"
        
        # If it's a regular language block, return as is
        return code_block
    
    # Process all code blocks
    processed_md = code_blocks_pattern.sub(process_code_block, md_content)
    
    # Convert to HTML using Markdown
    html = markdown.markdown(processed_md, extensions=MD_EXTENSIONS)
    
    # Keep track of code blocks to replace
    code_blocks = []
    
    # Find all code blocks in the original Markdown
    for match in code_blocks_pattern.finditer(md_content):
        code_block = match.group(0)
        first_line = code_block.split('\n')[0].strip()
        
        # Get the language and potentially filename
        lang = first_line[3:].strip()
        
        # Check if it's a filename (look for the marker we added)
        if 'filename=' in lang:
            parts = lang.split('filename=')
            lang_part = parts[0].strip()
            file_name = parts[1].strip()
            code_blocks.append({
                'type': 'file',
                'lang': lang_part,
                'filename': file_name,
                'content': '\n'.join(code_block.split('\n')[1:])
            })
        else:
            code_blocks.append({
                'type': 'lang',
                'lang': lang,
                'content': '\n'.join(code_block.split('\n')[1:])
            })
    
    # Now find all code blocks in the HTML
    html_code_blocks = []
    for match in re.finditer(r'<pre class="codehilite">(.*?)</pre>', html, re.DOTALL):
        html_code_blocks.append((match.group(0), match.group(1)))
    
    # Replace each code block with our custom format
    for i, (full_block, html_block) in enumerate(html_code_blocks):
        if i < len(code_blocks):
            code_info = code_blocks[i]
            
            if code_info['type'] == 'file':
                replacement = (
                    f'<div class="code-container">'
                    f'<div class="code-header">'
                    f'<span>{code_info["filename"]}</span>'
                    f'<button class="copy-button"><i class="fas fa-copy"></i> Copy</button>'
                    f'</div>'
                    f'<div class="code-block">'
                    f'<div class="codehilite"><pre>{html_block}</pre></div>'
                    f'</div>'
                    f'</div>'
                )
            else:
                replacement = (
                    f'<div class="code-container">'
                    f'<div class="code-header">'
                    f'<span>{code_info["lang"]}</span>'
                    f'<button class="copy-button"><i class="fas fa-copy"></i> Copy</button>'
                    f'</div>'
                    f'<div class="code-block">'
                    f'<div class="codehilite"><pre>{html_block}</pre></div>'
                    f'</div>'
                    f'</div>'
                )
            
            html = html.replace(full_block, replacement, 1)
    
    return html

def create_html_post(md_file, template_file, posts_data=None, force_rebuild=False):
    """Create HTML post from Markdown file using template."""
    metadata, md_content, file_hash = parse_markdown(md_file)
    if not metadata:
        return None
    
    # Generate HTML from markdown
    html_content = convert_markdown_to_html(md_content)
    
    # Get filename for the post
    md_filename = os.path.basename(md_file)
    base_name = os.path.splitext(md_filename)[0]
    html_filename = f"{slugify(base_name)}.html"
    
    # Get slug for the post (used in URLs)
    slug = slugify(metadata.get('title', base_name))
    
    # Create HTML file path
    html_file_path = os.path.join(POSTS_DIR, html_filename)
    
    # Check if file exists and has changed (unless force_rebuild is True)
    if not force_rebuild and os.path.exists(html_file_path):
        with open(html_file_path, 'r', encoding='utf-8') as f:
            existing_content = f.read()
            hash_match = re.search(r'<meta name="hash" content="([^"]+)"', existing_content)
            if hash_match and hash_match.group(1) == file_hash:
                print(f"Skipping {html_filename} - no changes detected")
                
                # Still add to posts_data for index generation
                if posts_data is not None:
                    posts_data.append({
                        'id': len(posts_data) + 1,
                        'title': metadata.get('title', ''),
                        'slug': slug,
                        'url': f"./posts/{html_filename}",
                        'date': metadata.get('date', '').strftime('%b %d, %Y') if isinstance(metadata.get('date'), datetime.date) else metadata.get('date', ''),
                        'date_obj': metadata.get('date', ''),
                        'readingTime': metadata.get('reading_time', ''),
                        'categories': metadata.get('categories', '').split(', ') if isinstance(metadata.get('categories', ''), str) else metadata.get('categories', []),
                        'tags': metadata.get('tags', '').split(', ') if isinstance(metadata.get('tags', ''), str) else metadata.get('tags', []),
                        'author': metadata.get('author', 'Unclecode'),
                        'description': metadata.get('description', ''),
                        'file_path': html_file_path
                    })
                
                return html_file_path
    
    # Read template
    with open(template_file, 'r', encoding='utf-8') as f:
        template = f.read()
    
    # Format date
    date_str = metadata.get('date', '')
    if isinstance(date_str, datetime.date):
        formatted_date = date_str.strftime('%b %d, %Y')
        iso_date = date_str.isoformat()
    else:
        formatted_date = date_str
        iso_date = date_str
    
    # Generate tags HTML
    tags = metadata.get('tags', '')
    if isinstance(tags, str):
        tags = tags.split(', ')
    
    tags_html = ''.join([f'<span class="post-tag">{tag.strip()}</span>' for tag in tags])
    
    # Store post info for navigation and index
    post_info = {
        'id': len(posts_data) + 1 if posts_data is not None else 1,
        'title': metadata.get('title', ''),
        'slug': slug,
        'url': f"./posts/{html_filename}",
        'date': formatted_date,
        'date_obj': metadata.get('date', ''),
        'readingTime': metadata.get('reading_time', ''),
        'categories': metadata.get('categories', '').split(', ') if isinstance(metadata.get('categories', ''), str) else metadata.get('categories', []),
        'tags': tags,
        'author': metadata.get('author', 'Unclecode'),
        'description': metadata.get('description', ''),
        'file_path': html_file_path
    }
    
    if posts_data is not None:
        posts_data.append(post_info)
    
    # Replace template placeholders
    html = template.replace('$POST_TITLE', metadata.get('title', ''))
    html = html.replace('$POST_DESCRIPTION', metadata.get('description', ''))
    html = html.replace('$POST_KEYWORDS', metadata.get('keywords', ''))
    html = html.replace('$POST_AUTHOR', metadata.get('author', 'Unclecode'))
    html = html.replace('$POST_DATE', formatted_date)
    html = html.replace('$POST_DATE_ISO', iso_date)
    html = html.replace('$POST_READING_TIME', metadata.get('reading_time', ''))
    html = html.replace('$POST_TAGS_HTML', tags_html)
    html = html.replace('$POST_CONTENT', html_content)
    html = html.replace('$POST_FILENAME', f"{slug}.md")
    html = html.replace('$POST_HASH', file_hash)
    
    # Temporarily set navigation placeholders
    html = html.replace('$PREV_POST_URL', '#')
    html = html.replace('$PREV_POST_TITLE', 'Previous Post')
    html = html.replace('$NEXT_POST_URL', '#')
    html = html.replace('$NEXT_POST_TITLE', 'Next Post')
    
    # Write the HTML file
    with open(html_file_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"Generated {html_filename}")
    return html_file_path

def update_navigation_links(posts_data):
    """Update navigation links between posts."""
    # Sort posts by date
    sorted_posts = sorted(posts_data, key=lambda x: x['date_obj'] if isinstance(x['date_obj'], datetime.date) else datetime.datetime.now(), reverse=True)
    
    for i, post in enumerate(sorted_posts):
        # Get previous and next posts
        prev_post = sorted_posts[i-1] if i > 0 else None
        next_post = sorted_posts[i+1] if i < len(sorted_posts) - 1 else None
        
        # Read current post HTML
        with open(post['file_path'], 'r', encoding='utf-8') as f:
            html = f.read()
        
        # Update navigation links
        if prev_post:
            html = html.replace('$PREV_POST_URL', prev_post['url'])
            html = html.replace('$PREV_POST_TITLE', prev_post['title'])
        else:
            html = html.replace('<div class="navigation-item navigation-prev">', '<div class="navigation-item navigation-prev" style="visibility: hidden;">')
            
        if next_post:
            html = html.replace('$NEXT_POST_URL', next_post['url'])
            html = html.replace('$NEXT_POST_TITLE', next_post['title'])
        else:
            html = html.replace('<div class="navigation-item navigation-next">', '<div class="navigation-item navigation-next" style="visibility: hidden;">')
        
        # Write updated HTML
        with open(post['file_path'], 'w', encoding='utf-8') as f:
            f.write(html)

def update_blog_js(posts_data):
    """Update blog.js with the latest posts data."""
    # Sort posts by date
    sorted_posts = sorted(posts_data, key=lambda x: x['date_obj'] if isinstance(x['date_obj'], datetime.date) else datetime.datetime.now(), reverse=True)
    
    # Format posts for JavaScript
    js_posts = []
    for i, post in enumerate(sorted_posts):
        js_posts.append({
            'id': i + 1,
            'title': post['title'],
            'url': post['url'],
            'date': post['date'],
            'readingTime': post['readingTime'],
            'categories': post['categories'],
            'tags': post['tags']
        })
    
    # Read current blog.js
    with open(BLOG_JS_PATH, 'r', encoding='utf-8') as f:
        js_content = f.read()
    
    # Replace the posts array in blog.js
    posts_json = json.dumps(js_posts, indent=2)
    updated_js = re.sub(
        r'const blogPosts = \[.*?\];',
        f'const blogPosts = {posts_json};',
        js_content,
        flags=re.DOTALL
    )
    
    # Extract all unique categories and tags
    all_categories = set()
    all_tags = set()
    
    for post in js_posts:
        for category in post['categories']:
            all_categories.add(category)
        for tag in post['tags']:
            all_tags.add(tag)
    
    # Update filter categories in blog.js
    filter_categories = [{'value': 'all', 'label': 'all', 'active': True}]
    for category in sorted(all_categories):
        filter_categories.append({
            'value': category,
            'label': category,
            'active': False
        })
    
    filter_categories_json = json.dumps(filter_categories, indent=2)
    updated_js = re.sub(
        r'const filterCategories = \[.*?\];',
        f'const filterCategories = {filter_categories_json};',
        updated_js,
        flags=re.DOTALL
    )
    
    # Write updated blog.js
    with open(BLOG_JS_PATH, 'w', encoding='utf-8') as f:
        f.write(updated_js)
    
    print(f"Updated blog.js with {len(js_posts)} posts")

def generate_command_palette_data():
    """Generate command palette data for the website."""
    # Execute the command palette generator script if it exists
    cmd_palette_script = os.path.join(ROOT_DIR, 'tools', 'generate_command_palette.py')
    if os.path.exists(cmd_palette_script):
        print("Generating command palette data...")
        try:
            import importlib.util
            spec = importlib.util.spec_from_file_location("generate_command_palette", cmd_palette_script)
            generate_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(generate_module)
            generate_module.main()
        except Exception as e:
            print(f"Error generating command palette data: {e}")

def main():
    """Main function to process all Markdown files."""
    print("Building blog posts...")
    
    # Check for --force flag
    force_rebuild = '--force' in sys.argv
    if force_rebuild:
        print("Force rebuild mode enabled - will regenerate all posts regardless of hash")
    
    # Get the template file
    template_file = os.path.join(TEMPLATES_DIR, 'post-base.html')
    if not os.path.exists(template_file):
        print(f"Error: Template file not found: {template_file}")
        return
    
    # Get all Markdown files
    md_files = glob.glob(os.path.join(MARKDOWN_DIR, '*.md'))
    if not md_files:
        print("No Markdown files found in", MARKDOWN_DIR)
        return
    
    posts_data = []
    
    # Process each Markdown file
    for md_file in md_files:
        create_html_post(md_file, template_file, posts_data, force_rebuild)
    
    # Update navigation links between posts
    update_navigation_links(posts_data)
    
    # Update blog.js with the latest posts data
    update_blog_js(posts_data)
    
    # Generate command palette data
    generate_command_palette_data()
    
    print("Done!")

if __name__ == "__main__":
    main()