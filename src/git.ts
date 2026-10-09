import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { dim } from "./colors.ts";

export function git(args: string[], cwd: string) {
  console.info(dim(`git ${args.join(" ")}`));

  return new Promise<void>((resolve, reject) => {
    const p = spawn("git", args, { stdio: "inherit", cwd });
    p.on("error", reject);
    p.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`git ${args[0]} exited with code ${code}`)),
    );
  });
}

export function isGitRepository(dir: string) {
  return existsSync(path.join(dir, ".git"));
}
