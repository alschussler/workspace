import { mkdirSync } from "node:fs";
import { bold, code, dim, green, red } from "./colors.ts";
import type { Mode, Repository } from "./config.ts";
import { git, isGitRepository } from "./git.ts";

export type WorkspaceOptions = {
  mode: Mode;
  dir: string;
  repositories: Repository[];
};

function cloneArgs({ url, path, branch }: Repository) {
  return ["clone", ...(branch ? ["--branch", branch] : []), "--", url, path];
}

function submoduleArgs({ url, path, branch }: Repository) {
  return [
    "submodule",
    "add",
    ...(branch ? ["-b", branch] : []),
    "--",
    url,
    path,
  ];
}

function assertUniquePaths(repositories: Repository[]) {
  const paths = new Set<string>();

  for (const { path } of repositories) {
    if (paths.has(path)) {
      throw new Error(`More than one repository targets the path "${path}"`);
    }
    paths.add(path);
  }
}

function printSummary(repositories: Repository[], failed: Set<Repository>) {
  console.info();
  for (const repository of repositories) {
    const status = failed.has(repository) ? red("✗") : green("✓");
    console.info(status, bold(repository.path), dim(repository.url));
  }
}

/**
 * Clones or adds as submodules every repository into `dir`, creating it when needed.
 * Resolves to `false` when at least one repository failed.
 */
export async function createWorkspace({
  mode,
  dir,
  repositories,
}: WorkspaceOptions) {
  assertUniquePaths(repositories);
  mkdirSync(dir, { recursive: true });

  console.info("Creating", bold(mode), "workspace at", code(dir));

  if (mode === "submodule" && !isGitRepository(dir)) {
    await git(["init"], dir);
  }

  const toArgs = mode === "submodule" ? submoduleArgs : cloneArgs;
  const failed = new Set<Repository>();

  for (const repository of repositories) {
    console.info();
    try {
      await git(toArgs(repository), dir);
    } catch (error) {
      failed.add(repository);
      console.error(red((error as Error).message));
    }
  }

  printSummary(repositories, failed);

  if (mode === "submodule" && failed.size < repositories.length) {
    console.info(
      dim("\nSubmodules are staged, commit them with:"),
      code(`git -C ${dir} commit -m "Add submodules"`),
    );
  }

  return failed.size === 0;
}
