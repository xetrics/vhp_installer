import { parseArgs, styleText } from "node:util";
import path from "node:path";
import { InstallerError } from "./errors";
import { DEFAULT_VALHEIM_INSTALL_DIR, LATEST_TESTED_VERSION } from "./constants";
import Github from "./github";
import type { ReleaseData } from "./types";

const { values: args } = parseArgs({
	args: Bun.argv,
	options: {
		dir: {
			type: "string",
			default: DEFAULT_VALHEIM_INSTALL_DIR,
		},
		tag: {
			type: "string",
			default: LATEST_TESTED_VERSION,
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
	// verify game dir
	const checkFile = Bun.file(path.join(args.dir, "valheim.exe"));
	if (!(await checkFile.exists())) {
		throw new InstallerError(`Game directory is not valid: ${args.dir}`);
	}
}

async function fetchRelease() {
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

async function extractClient(archive: Bun.Archive, file: Bun.BunFile) {
	try {
		console.log(`Extracting bundle into: ${args.dir}`);
		const count = await archive.extract(args.dir);
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
		await verifyArgs();
		const release = await fetchRelease();
		const client = await downloadClient(release);
		await extractClient(...client);
		console.log(styleText("green", "Done!"));
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
                 (default: "${DEFAULT_VALHEIM_INSTALL_DIR}")
  --tag <tag>    Version tag to install, or "latest"
                 (default: ${LATEST_TESTED_VERSION})
  --help         Show this help message
`);
	process.exit(0);
} else {
	main();
}
