---
title: Testing Code Blocks with File Names
date: 2025-02-27
author: Unclecode (Hossein)
description: Testing how code blocks with file names render in the blog engine.
keywords: coding, markdown, test
tags: programming, test
categories: programming
reading_time: 3 min
---

# Testing Code Blocks with File Names

This post demonstrates how code blocks with file names are rendered in our blog engine.

## Regular Language Code Block

Here's a regular Python code block:

```python
def greet(name):
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("World"))
```

## Code Block with File Name

Now, here's a Python code block with a file name:

```main.py
def greet(name):
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("World"))
```

## JavaScript Example

```app.js
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet("World"));
```

## CSS Example

```styles.css
.greeting {
  font-family: 'Arial', sans-serif;
  color: #333;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

.greeting:hover {
  color: #0066cc;
}
```

## HTML Example

```index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Greeting Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="greeting" id="greeting">Loading...</div>
  <script src="app.js"></script>
  <script>
    document.getElementById('greeting').textContent = greet('World');
  </script>
</body>
</html>
```

This should help us test if our file name detection and rendering is working correctly. The code blocks should now display the filename in the header.