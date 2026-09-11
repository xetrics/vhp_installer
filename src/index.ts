import { parseArgs, styleText } from "node:util";
import path from "node:path";
import { InstallerError } from "./errors";
import { LATEST_TAG } from "./constants";
import Github from "./github";
import type { ReleaseData } from "./types";
import Steam from "./steam";
import { getInstallerVersion } from "./version";

const { values: args } = parseArgs({
	args: Bun.argv,
	options: {
		dir: {
			type: "string",
		},
		tag: {
			type: "string",
			default: LATEST_TAG,
		},
		help: {
			type: "boolean",
			default: false,
		},
	},
	strict: true,
	allowPositionals: true,
});

async function verifyArgs() {
	if (args.dir) {
		const checkFile = Bun.file(path.join(args.dir, "valheim.exe"));
		if (!(await checkFile.exists())) {
			throw new InstallerError(`Game directory is not valid: ${args.dir}`);
		}
	}
}

async function locateValheimDirectory() {
	console.log("Locating Valheim installation directory");
	if (args.dir) {
		console.log("Using provided argument");
		return args.dir;
	} else {
		const valPath = await Steam.getValheimPath();
		console.log(`Valheim Path: ${valPath}`);
		return valPath;
	}
}

async function fetchRelease() {
	console.log("Fetching latest release");
	const release = await Github.getRelease(args.tag);
	console.log(`Release: ${release.tag_name} (${release.published_at})`);
	return release;
}

async function downloadClient(release: ReleaseData): Promise<[Bun.Archive, Bun.BunFile]> {
	const [clientFile, clientDigest] = await Github.getClient(release);
	const clientBuffer = await clientFile.bytes();

	// verify digest
	if (clientDigest !== `sha256:${new Bun.SHA256().update(clientBuffer).digest("hex")}`) {
		throw new InstallerError(`Bundle verification failed. Expected digest: ${clientDigest}`);
	}

	return [new Bun.Archive(clientBuffer), clientFile];
}

async function extractClient(archive: Bun.Archive, file: Bun.BunFile, outDir: string) {
	try {
		console.log(`Extracting bundle into: ${outDir}`);
		const count = await archive.extract(outDir);
		console.log(`Extracted ${count} files`);
		await file.delete();
	} catch (error) {
		if (error instanceof Error) {
			const err = error as Error & { code?: string };
			if (err.code === "EACCES") {
				throw new InstallerError(`Permission denied`);
			} else if (err.code === "ENOSPC") {
				throw new InstallerError(`Disk full`);
			} else {
				throw new InstallerError(err.message);
			}
		} else {
			throw new InstallerError(String(error));
		}
	}
}

async function main() {
	try {
		console.log(styleText("blue", "== Installing ValheimPlus =="));
		console.log(`Installer Version: ${getInstallerVersion()}`);

		await verifyArgs();
		const valheimPath = await locateValheimDirectory();
		const release = await fetchRelease();
		const [archive, file] = await downloadClient(release);
		await extractClient(archive, file, valheimPath);
		console.log(styleText("green", "Done!"));
		console.log("Press <ENTER> to exit...");
	} catch (error) {
		if (error instanceof InstallerError) {
			console.error(`Error: ${error.message}`);
		} else {
			console.error(error);
		}
	}
}

if (args.help) {
	const bin = path.basename(Bun.argv[1] ?? "vhp_installer");
	console.log(`Usage: ${bin} [options]

Options:
  --dir <path>   Valheim install directory
                 (default: auto-detects from registry and libraryfolders manifest)
  --tag <tag>    Version tag to install, or "${LATEST_TAG}"
                 (default: ${LATEST_TAG})
  --help         Show this help message
`);
	process.exit(0);
} else {
	await main();
	for await (const _line of console) {
		break;
	}
}
