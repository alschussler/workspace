import { parseArgs, type ParseArgsOptionDescriptor } from "node:util";
import { code } from "./colors.ts";
import { CONFIG_FILE, MODES } from "./config.ts";

type CliArgDescription = ParseArgsOptionDescriptor & {
  description: string;
};

type CliArgs = Record<string, CliArgDescription>;

const ARGS_OPTIONS = {
  mode: {
    type: "string",
    short: "m",
    description: `Workspace mode: ${MODES.join(" | ")} (default: clone)`,
  },
  dir: {
    type: "string",
    short: "d",
    description: "Workspace directory (default: current directory)",
  },
  config: {
    type: "string",
    short: "c",
    description: `JSON configuration file with the repositories (default: <dir>/${CONFIG_FILE})`,
  },
  init: {
    type: "boolean",
    default: false,
    description: `Create a ${CONFIG_FILE} config file template in the workspace directory`,
  },
  help: {
    type: "boolean",
    short: "h",
    default: false,
    description: "Show this help",
  },
} satisfies CliArgs;

export function parseCliArgs(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    options: ARGS_OPTIONS,
    allowPositionals: true,
    strict: true,
  });

  return { ...values, repositories: positionals };
}

export function printHelp() {
  console.info("Usage:", code("workspace [options] [repository-urls...]"));
  console.info("Options:");
  for (const [key, value] of Object.entries(ARGS_OPTIONS) as [
    string,
    CliArgDescription,
  ][]) {
    const flag = `${value.short ? `-${value.short}, ` : ""}--${key}`;
    console.info(`  ${flag}: ${value.description}`);
  }
  console.info(
    "Repository urls must be remote:",
    code("https://, ssh://, git:// or user@host:path"),
  );
}
