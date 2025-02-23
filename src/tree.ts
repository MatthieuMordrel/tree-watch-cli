import fs from "fs";
import path from "path";
import { TreeOptions, FileNode } from "./types.js";

/**
 * Lists all files and directories in the given directory up to the specified depth.
 * @param dir - The directory to list files from.
 * @param depth - The current depth of the directory.
 * @param maxDepth - The maximum depth to traverse.
 * @param excludedFolders - The list of excluded folders.
 * @returns An array of objects representing the files and directories.
 */
export function listFiles(dir: string, depth: number, maxDepth: number, excludedFolders: string[]): FileNode[] {
  if (depth > maxDepth) return [];

  const result: FileNode[] = [];
  const dirName = path.basename(dir);

  // Skip excluded directories entirely
  if (excludedFolders.includes(dirName)) {
    return [];
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
        const children = listFiles(fullPath, depth + 1, maxDepth, excludedFolders);
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
export function printTree(nodes: FileNode[], prefix = "", output: string[] = []): string[] {
  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    output.push(`${prefix}${isLast ? "└──" : "├──"} ${node.name}`);
    if (node.children) {
      printTree(node.children, `${prefix}${isLast ? "    " : "│   "}`, output);
    }
  });
  return output;
}

/**
 * Generates the tree structure of the current directory and writes it to a file.
 * @param options - The options for the tree generation.
 * @param options.outputFile - The file to write the tree structure to.
 * @param options.excludedFolders - The list of folders to exclude from the tree.
 * @param options.maxDepth - The maximum depth to traverse.
 * @returns The generated tree.
 */
export function generateTree(options: TreeOptions) {
  const tree = listFiles(process.cwd(), 0, options.maxDepth, options.excludedFolders);
  const treeOutput = [".", ...printTree(tree)];
  fs.writeFileSync(options.outputFile, treeOutput.join("\n"), "utf-8");
  return tree;
}
