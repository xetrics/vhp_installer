import path from "node:path";
import { stat } from "node:fs/promises";
import { InstallerError } from "./errors";
import * as VDF from "vdf-parser";
import type { LibraryFoldersVDF } from "./types";
import { VALHEIM_APP_ID } from "./constants";

export default class Steam {
	private static async getInstallPath() {
		const r = Bun.spawnSync(["reg", "query", "HKLM\\SOFTWARE\\Wow6432Node\\Valve\\Steam", "/v", "InstallPath"]);
		if (r.exitCode !== 0) return null;

		const line = r.stdout
			.toString()
			.split(/\r?\n/)
			.find((l) => l.includes("REG_SZ"));
		if (!line) return null;

		const idx = line.indexOf("REG_SZ");
		return line.slice(idx + "REG_SZ".length).trim() || null;
	}

	static async getValheimPath() {
		const steamPath = await this.getInstallPath();
		if (!steamPath) throw new InstallerError("Failed to locate steam install directory");

		const libraryFoldersFile = Bun.file(path.join(steamPath, "steamapps/libraryfolders.vdf"));
		if (!libraryFoldersFile.exists()) throw new InstallerError("Failed to locate steam library folder manifest");

		const parsed = VDF.parse<LibraryFoldersVDF>(await libraryFoldersFile.text());
		const libraryPath = Object.values(parsed.libraryfolders).find((folder) => {
			return Object.keys(folder.apps).includes(VALHEIM_APP_ID.toString());
		})?.path;
		if (!libraryPath) throw new InstallerError("Failed to locate valheim install directory");

		const valheimPath = path.join(libraryPath, "steamapps/common/Valheim");

		const checkFile = Bun.file(path.join(valheimPath, "valheim.exe"));
		if (!checkFile.exists()) throw new InstallerError("Failed to validate valheim install directory");

		return valheimPath;
	}
}
