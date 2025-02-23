# tree-watch-cli

A command-line tool to automatically generate and update a tree structure of your project directory as files and folders change.

## Installation

```bash
npm install -g tree-watch-cli
# or
pnpm add -g tree-watch-cli
# or
yarn global add tree-watch-cli
```

## Usage

In your project directory, simply run:

```bash
tree-watch-cli
```

This will start watching your directory and generate a `tree.txt` file with your project structure. The file will be automatically updated whenever you add, remove, or modify files and folders.

### Options

- `-o, --output <file>` - Specify the output file name (default: "tree.txt")
- `-e, --exclude <folders...>` - Specify folders to exclude (default: ["node_modules", ".git"]). Only folder can be specified. To avoid exclusion, use any arguments.
- `-d, --max-depth <number>` - Maximum depth to traverse in the directory tree (default: 99)

### Examples

```bash
# Use a different output file
tree-watch-cli -o my-tree.txt

# Exclude multiple folders
tree-watch-cli -e node_modules dist .git

# Limit directory depth
tree-watch-cli -d 3

# Combine options
tree-watch-cli -o custom-tree.txt -e node_modules dist -d 2
```

## Features

- Real-time updates as your project structure changes
- Customizable output file name
- Exclude specific directories
- Limit directory traversal depth
- Handles large directory structures
- Graceful process termination

## Expected output (tree.txt): tree-watch-cli

```
.

├── .gitignore
├── dist
│   ├── cli.d.ts
│   ├── cli.js
│   ├── tree.d.ts
│   ├── tree.js
│   ├── watch.d.ts
│   └── watch.js
├── package.json
├── README.md
├── src
│   ├── cli.ts
│   ├── tree.ts
│   └── watch.ts
├── tree.txt
└── tsconfig.json
```

## License

MIT
