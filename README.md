# workspace

Create workspaces combining multiple repositories.

`workspace` puts every remote repository you list into a single folder, either as **git submodules** of a new repository or as plain **clones**.

## Installation

```bash
# Install from the github repository
npm install -g https://github.com/alschussler/workspace.git --install-links
```

## Usage

```bash
workspace [options] [repository-urls...]
```

Repository urls can be passed as command-line arguments, read from a configuration file, or both.

### Repository urls

Only remote repository urls are accepted:

| Format                       | Example                            |
| ---------------------------- | ---------------------------------- |
| `https://` / `http://`       | `https://github.com/org/api.git`   |
| `ssh://` (also `git+ssh://`) | `ssh://git@github.com/org/api.git` |
| `git://`                     | `git://example.com/org/api.git`    |
| scp-like `[user@]host:path`  | `git@github.com:org/api.git`       |

Local paths (`/path/to/repo`, `./repo`, `~/repo`) and `file://`, `ftp://` urls are rejected. All repositories are validated before anything is created, so a single invalid url stops the run with exit code `1` and leaves the workspace folder untouched.

### Modes

#### `clone` (default)

Runs `git clone` for each repository inside the workspace folder.

```bash
workspace -d ~/projects/my-workspace \
  git@github.com:org/api.git \
  git@github.com:org/web.git
```

#### `submodule`

Runs `git init` in the workspace folder (unless it is already a git repository) and then `git submodule add` for each repository. The submodules are left staged, so you can review them and commit.

```bash
workspace -m submodule -d ~/projects/my-workspace \
  git@github.com:org/api.git \
  git@github.com:org/web.git

git -C ~/projects/my-workspace commit -m "Add submodules"
```

### Using a configuration file

Create a `.workspace` config file in the workspace folder, fill in the repositories and run it:

```bash
workspace --init -d ~/projects/my-workspace -m submodule
# edit ~/projects/my-workspace/.workspace
workspace -d ~/projects/my-workspace
```

When `--config` isn't passed, `workspace` loads `<dir>/.workspace` automatically if it exists. Any other file can be passed explicitly:

```bash
workspace -c workspace.json

# CLI options override the config, and positional repositories are added to the list
workspace -c workspace.json -m clone -d ./other-folder git@github.com:org/extra.git
```

### CLI Options

| Option            | Short | Description                                                                              |
| ----------------- | ----- | ---------------------------------------------------------------------------------------- |
| `--mode <mode>`   | `-m`  | `clone` or `submodule` (default: `clone`)                                                |
| `--dir <path>`    | `-d`  | Workspace folder (default: current directory)                                            |
| `--config <path>` | `-c`  | JSON configuration file (default: `<dir>/.workspace`)                                    |
| `--init`          |       | Create a `.workspace` config template in the workspace folder (uses `--mode` when given) |
| `--help`          | `-h`  | Show help information                                                                    |

## Configuration

The configuration file uses JSON. `workspace --init` writes a template, and [`workspace.example.json`](./workspace.example.json) has an example:

```json
{
  "mode": "submodule",
  "dir": "./my-workspace",
  "repositories": [
    "git@github.com:org/api.git",
    {
      "url": "git@github.com:org/web.git",
      "path": "apps/web",
      "branch": "develop"
    }
  ]
}
```

| Field          | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| `mode`         | `clone` or `submodule`                                                      |
| `dir`          | Workspace folder, relative paths are resolved from the config file's folder |
| `repositories` | List of remote repository urls or `{ url, path?, branch? }` objects         |

### Repository Options

| Field    | Description                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------- |
| `url`    | Remote repository url (see [Repository urls](#repository-urls))                                                      |
| `path`   | Folder inside the workspace (default: the repository name from the url, e.g. `api` for `git@github.com:org/api.git`) |
| `branch` | Branch to check out (`git clone --branch` / `git submodule add -b`)                                                  |

## How It Works

1. **Resolves the settings**: loads `--config` or `<dir>/.workspace`. CLI options take precedence over the config file, and the repositories from both are combined
2. **Validates the repositories**: every url must be remote and each repository must target a different folder, otherwise nothing is created
3. **Creates the workspace folder** if it doesn't exist
4. **Initializes git** in `submodule` mode when the folder isn't a repository yet
5. **Adds each repository** in order, with `git clone` or `git submodule add`
6. **Prints a summary**: a failed repository doesn't stop the others, and the exit code is `1` if any of them failed

## Development

The source is TypeScript that Node runs natively (Node 24, see `.nvmrc`), so no build step is needed during development:

```bash
nvm use
npm install
npm run dev -- --help     # runs src/index.ts directly
npm run lint              # type-check
npm run format            # prettier
npm run build             # compile to lib/
```

`lib/` is committed because Node doesn't strip types from files inside `node_modules`, which is where a global install puts the package. Run `npm run build` before committing source changes.

## License

ISC
