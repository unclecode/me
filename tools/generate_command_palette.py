#!/usr/bin/env python3
"""
Command Palette Generator for Personal Website

This script scans the website and generates a JSON file containing all
navigable content that can be used for a VSCode-like command palette.

Usage:
    python generate_command_palette.py
"""

import os
import json
import re
import glob
from pathlib import Path
from bs4 import BeautifulSoup

# Configuration
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FILE = os.path.join(ROOT_DIR, 'assets', 'data', 'command_palette.json')

def extract_title_from_html(file_path):
    """Extract title from HTML file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            soup = BeautifulSoup(content, 'html.parser')
            title_tag = soup.find('title')
            if title_tag:
                return title_tag.text.strip()
            h1_tag = soup.find('h1')
            if h1_tag:
                return h1_tag.text.strip()
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
    
    # Default to filename if no title found
    return os.path.basename(file_path).replace('.html', '').replace('-', ' ').title()

def generate_items():
    """Generate all command palette items."""
    command_items = []
    
    # Add main pages
    html_files = glob.glob(os.path.join(ROOT_DIR, '*.html'))
    for file_path in html_files:
        relative_path = os.path.relpath(file_path, ROOT_DIR)
        title = extract_title_from_html(file_path)
        command_items.append({
            'title': title,
            'type': 'page',
            'path': relative_path,
            'description': f'Main page: {title}'
        })
    
    # Add blog posts
    blog_posts = glob.glob(os.path.join(ROOT_DIR, 'blog', 'posts', '*.html'))
    for file_path in blog_posts:
        # Skip template files
        if 'post-base.html' in file_path:
            continue
        
        relative_path = os.path.relpath(file_path, ROOT_DIR)
        title = extract_title_from_html(file_path)
        command_items.append({
            'title': title,
            'type': 'blog',
            'path': relative_path,
            'description': f'Blog post: {title}'
        })
    
    # Add animations
    animations = glob.glob(os.path.join(ROOT_DIR, 'animations', '**/index.html'), recursive=True)
    for file_path in animations:
        relative_path = os.path.relpath(file_path, ROOT_DIR)
        animation_name = os.path.basename(os.path.dirname(file_path))
        command_items.append({
            'title': animation_name.title(),
            'type': 'animation',
            'path': relative_path,
            'description': f'Animation: {animation_name.title()}'
        })
    
    # Add projects and ventures from me.json
    try:
        me_json_path = os.path.join(ROOT_DIR, 'assets', 'data', 'me.json')
        with open(me_json_path, 'r', encoding='utf-8') as f:
            me_data = json.load(f)
            
            # Add projects
            if 'projects' in me_data:
                for project in me_data['projects']:
                    command_items.append({
                        'title': project['title'],
                        'type': 'project',
                        'path': project['link'],
                        'description': project['description'],
                        'external': True
                    })
            
            # Add ventures
            if 'ventures' in me_data:
                for name, venture in me_data['ventures'].items():
                    command_items.append({
                        'title': name,
                        'type': 'venture',
                        'path': venture['link'],
                        'description': venture['description'],
                        'external': True
                    })
    except Exception as e:
        print(f"Error processing me.json: {e}")
    
    return command_items

def main():
    """Main function to generate command palette JSON."""
    print("Generating command palette data...")
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    # Generate items
    items = generate_items()
    
    # Write to JSON file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(items, f, indent=2)
    
    print(f"Command palette data generated with {len(items)} items.")
    print(f"Output saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()