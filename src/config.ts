import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const CONFIG_FILE = ".workspace";

export const MODES = ["clone", "submodule"] as const;

export type Mode = (typeof MODES)[number];

type RepositoryOptions = {
  url: string;
  path?: string;
  branch?: string;
};

export type RepositoryEntry = string | RepositoryOptions;

export type Repository = {
  url: string;
  path: string;
  branch?: string;
};

export type WorkspaceConfig = {
  mode?: Mode;
  dir?: string;
  repositories?: RepositoryEntry[];
};

export function isMode(value: unknown): value is Mode {
  return MODES.includes(value as Mode);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function isRepositoryEntry(value: unknown): value is RepositoryEntry {
  if (typeof value === "string") {
    return value.length > 0;
  }

  return (
    isObject(value) &&
    typeof value.url === "string" &&
    value.url.length > 0 &&
    isOptionalString(value.path) &&
    isOptionalString(value.branch)
  );
}

/**
 * Reads and validates a workspace JSON config file.
 * A relative `dir` is resolved from the config file's folder.
 */
export function loadConfig(file: string): WorkspaceConfig {
  const configPath = path.resolve(file);

  let content: unknown;
  try {
    content = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(
      `Unable to read config file ${configPath}: ${(error as Error).message}`,
    );
  }

  if (!isObject(content)) {
    throw new Error(`Config file ${configPath} must contain a JSON object`);
  }

  const { mode, dir, repositories } = content;

  if (mode !== undefined && !isMode(mode)) {
    throw new Error(
      `Invalid "mode" in ${configPath}, expected one of: ${MODES.join(", ")}`,
    );
  }

  if (!isOptionalString(dir)) {
    throw new Error(`Invalid "dir" in ${configPath}, expected a string`);
  }

  if (
    repositories !== undefined &&
    (!Array.isArray(repositories) || !repositories.every(isRepositoryEntry))
  ) {
    throw new Error(
      `Invalid "repositories" in ${configPath}, expected a list of urls or { url, path?, branch? } objects`,
    );
  }

  return {
    mode,
    dir:
      typeof dir === "string"
        ? path.resolve(path.dirname(configPath), dir)
        : undefined,
    repositories,
  };
}

export function findConfig(dir: string) {
  const configPath = path.join(dir, CONFIG_FILE);
  return existsSync(configPath) ? configPath : undefined;
}

/**
 * Writes a config template to `<dir>/.workspace`, creating `dir` when needed.
 * Returns the path of the created file.
 */
export function initConfig(dir: string, mode: Mode) {
  const configPath = path.join(dir, CONFIG_FILE);

  if (existsSync(configPath)) {
    throw new Error(`Config file already exists at ${configPath}`);
  }

  const template: WorkspaceConfig = {
    mode,
    dir: ".",
    repositories: [
      "git@github.com:<org>/<repository>.git",
      {
        url: "https://github.com/<org>/<repository>.git",
        path: "<folder>",
        branch: "<branch>",
      },
    ],
  };

  mkdirSync(dir, { recursive: true });
  writeFileSync(configPath, `${JSON.stringify(template, null, 2)}\n`);

  return configPath;
}

const PROTOCOL_URL = /^(?:https?|ssh|git|git\+ssh|ssh\+git):\/\/[^/\s]+\/\S+$/;

const SCP_LIKE_URL = /^(?:[^@/\s]+@)?[^@/:\s]{2,}:(?!\/\/)\S+$/;

function isRemoteUrl(url: string) {
  return PROTOCOL_URL.test(url) || SCP_LIKE_URL.test(url);
}

function repositoryName(url: string) {
  const name = url
    .replace(/\/+$/, "")
    .replace(/\.git$/, "")
    .split(/[/:]/)
    .pop();

  if (!name) {
    throw new Error(`Unable to infer a folder name from ${url}`);
  }

  return name;
}

export function toRepository(entry: RepositoryEntry): Repository {
  const {
    url,
    path: repositoryPath,
    branch,
  }: RepositoryOptions = typeof entry === "string" ? { url: entry } : entry;

  if (!isRemoteUrl(url)) {
    throw new Error(
      `Invalid repository "${url}", only remote urls are allowed (https://, ssh://, git:// or user@host:path)`,
    );
  }

  return {
    url,
    path: path.normalize(repositoryPath ?? repositoryName(url)),
    branch,
  };
}
