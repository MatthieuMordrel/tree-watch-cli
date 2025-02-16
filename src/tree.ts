import fs from "fs";
import path from "path";
import { TreeOptions, FileNode } from "./types.ts";

// Parse command line arguments
const args = process.argv.slice(2);
// Default options
const options: TreeOptions = {
  outputFile: 'tree.txt',
  excludedFolders: ['node_modules', '.git'],
  maxDepth: Infinity,
  excludedFoldersDepth: 1
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--output':
      options.outputFile = args[++i];
      break;
    case '--exclude':
      options.excludedFolders = [];
      while (args[i + 1] && !args[i + 1].startsWith('--')) {
        options.excludedFolders.push(args[++i]);
      }
      break;
    case '--depth':
      options.maxDepth = parseInt(args[++i], 10);
      break;
    case '--excluded-depth':
      options.excludedFoldersDepth = parseInt(args[++i], 10);
      break;
  }
}

/**
 * Lists all files and directories in the given directory up to the specified depth.
 * @param dir - The directory to list files from.
 * @param depth - The current depth of the directory.
 * @param maxDepth - The maximum depth to traverse.
 * @param options - The tree options.
 * @returns An array of objects representing the files and directories.
 */
function listFiles(dir: string, depth: number, maxDepth: number, options: TreeOptions): FileNode[] {
  if (depth > maxDepth) return [];

  const result: FileNode[] = [];
  const dirName = path.basename(dir);

  // Check exclusion early to avoid unnecessary work
  if (depth > 0 && options.excludedFolders.includes(dirName)) {
    // If we're at max depth for excluded folders, just return the name
    if (depth >= options.excludedFoldersDepth) {
      return [{ name: dirName }];
    }
    // Otherwise just get immediate children without recursing
    try {
      const children = fs.readdirSync(dir, { withFileTypes: true })
        .map(entry => ({ name: entry.name }));
      return [{
        name: dirName,
        children: children.length > 0 ? children : undefined
      }];
    } catch (error) {
      console.warn(`Error reading excluded directory ${dir}:`, error);
      return [{ name: dirName }];
    }
  }

  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isSymbolicLink()) {
        try {
          const realPath = fs.realpathSync(fullPath);
          const stats = fs.statSync(realPath);
          result.push({
            name: item.name,
            type: 'symlink',
            target: stats.isDirectory() ? realPath : undefined
          });
        } catch (error) {
          console.warn(`Error processing symlink ${fullPath}:`, error);
        }
        continue;
      }

      if (item.isDirectory()) {
        const children = listFiles(fullPath, depth + 1, maxDepth, options);
        if (children.length > 0) {
          result.push({
            name: item.name,
            children
          });
        }
      } else {
        result.push({ name: item.name });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Prints the tree structure of the given nodes to a string.
 * @param nodes - The nodes to print the tree structure for.
 * @param prefix - The prefix to use for the tree structure.
 * @param output - The output array to store the tree structure.
 * @returns An array of strings representing the tree structure.
 */
function printTree(nodes: FileNode[], prefix = "", output: string[] = []): string[] {
  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    output.push(`${prefix}${isLast ? "└──" : "├──"} ${node.name}`);
    if (node.children) {
      printTree(node.children, `${prefix}${isLast ? "    " : "│   "}`, output);
    }
  });
  return output;
}

// Export the main function for direct use
export function generateTree(options: TreeOptions) {
  const tree = listFiles(process.cwd(), 0, options.maxDepth, options);
  const treeOutput = [".", ...printTree(tree)];
  fs.writeFileSync(options.outputFile, treeOutput.join("\n"), "utf-8");
  return tree;
}
