import { listFiles } from './tree.ts';
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('listFiles - Basic Test', () => {
  it('should return a non-empty array for a valid directory', () => {
    // Create a temporary directory for testing.  This is important
    // to avoid relying on the *current* state of your file system.
    const testDir = path.join(__dirname, 'test_temp_dir');
    fs.mkdirSync(testDir, { recursive: true }); // Ensure the directory exists
    fs.writeFileSync(path.join(testDir, 'test_file.txt'), 'test content');

    const result = listFiles(testDir, 0, 5, []);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);

    // Cleanup: Remove the temporary directory after the test.
    fs.rmSync(testDir, { recursive: true, force: true });
  });
}); 