export interface TreeOptions {
  outputFile: string;
  excludedFolders: string[];
  maxDepth: number;
}

export type FileNode = {
  name: string;
  children?: FileNode[];
  type?: string;
  target?: string;
};

export interface TreeWatcherOptions {
  outputFile: string;
  excludedFolders: string[];
  maxDepth?: number;
} 