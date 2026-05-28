import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export function getProjectLOC(): string {
  const output = execSync('find src -name "*.ts" | xargs wc -l | tail -n 1').toString().trim();
  return output.split(/\s+/)[0] || "0";
}

export function getProjectTree(dir: string = process.cwd(), prefix: string = "", isLast: boolean = true, isRoot: boolean = true): string {
  let output = "";

  if (isRoot) {
    output += ".\n";
  } else {
    const dirName = path.basename(dir);
    const stat = fs.statSync(dir);
    const isDir = stat.isDirectory();
    const displayName = isDir ? `${dirName}/` : dirName;

    let line = `${prefix}${isLast ? "└── " : "├── "}${displayName}`;

    output += line + "\n";
  }

  if (fs.statSync(dir).isDirectory()) {
    const newPrefix = isRoot ? "" : prefix + (isLast ? "    " : "│   ");
    let entries = fs.readdirSync(dir).filter(e => !e.startsWith(".") && e !== "node_modules" && e !== "bun.lock" && e !== "bun.lockb" && !e.endsWith(".cjs"));
    
    entries.sort((a, b) => {
      const aIsDir = fs.statSync(path.join(dir, a)).isDirectory();
      const bIsDir = fs.statSync(path.join(dir, b)).isDirectory();
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i] as string;
      output += getProjectTree(path.join(dir, entry), newPrefix, i === entries.length - 1, false);
    }
  }

  return output;
}
