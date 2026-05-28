import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function getChangelogs(): { date: string; content: string }[] {
  const dir = join(process.cwd(), "src/core/changelog");
  try {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .sort((a, b) => b.localeCompare(a));

    return files.map((file) => ({
      date: file.replace(".md", ""),
      content: readFileSync(join(dir, file), "utf-8"),
    }));
  } catch (e) {
    return [];
  }
}
