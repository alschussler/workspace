#!/usr/bin/env node
import path from "node:path";
import { parseCliArgs, printHelp } from "./cli.js";
import { code, dim, green, red } from "./colors.js";
import { findConfig, initConfig, isMode, loadConfig, MODES, toRepository, } from "./config.js";
import { createWorkspace } from "./workspace.js";
function parseMode(mode) {
    if (!isMode(mode)) {
        throw new Error(`Invalid mode "${mode}", expected one of: ${MODES.join(", ")}`);
    }
    return mode;
}
async function main() {
    const args = parseCliArgs(process.argv.slice(2));
    if (args.help) {
        printHelp();
        return;
    }
    const cliDir = args.dir ? path.resolve(args.dir) : undefined;
    if (args.init) {
        const configPath = initConfig(cliDir ?? process.cwd(), parseMode(args.mode ?? "clone"));
        console.info(green("Config file created at"), code(configPath));
        console.info(dim("Fill in the repositories and run:"), code(args.dir ? `workspace -d ${args.dir}` : "workspace"));
        return;
    }
    const configPath = args.config ?? findConfig(cliDir ?? process.cwd());
    const config = configPath ? loadConfig(configPath) : {};
    if (configPath) {
        console.info(dim(`Using config ${path.resolve(configPath)}`));
    }
    const mode = parseMode(args.mode ?? config.mode ?? "clone");
    const repositories = [
        ...(config.repositories ?? []),
        ...args.repositories,
    ].map(toRepository);
    if (repositories.length === 0) {
        console.error(red("No repositories informed"));
        printHelp();
        process.exitCode = 1;
        return;
    }
    const dir = cliDir ?? config.dir ?? process.cwd();
    if (!(await createWorkspace({ mode, dir, repositories }))) {
        process.exitCode = 1;
    }
}
try {
    await main();
}
catch (error) {
    console.error(red(error.message ?? String(error)));
    process.exitCode = 1;
}
