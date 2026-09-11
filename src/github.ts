import { join } from "node:path";
import { tmpdir } from "node:os";
import type { ReleaseData } from "./types";
import { LATEST_RELEASE_URL, LATEST_TAG, TAG_RELEASE_URL, WINDOWS_ASSET_NAME } from "./constants";
import { InstallerError } from "./errors";
import type { BunFile } from "bun";

const headers = { "User-Agent": "Fetch-App" };

export default class Github {
	static async getRelease(tag: string): Promise<ReleaseData> {
		try {
			const response = await fetch(tag === LATEST_TAG ? LATEST_RELEASE_URL : TAG_RELEASE_URL(tag), { headers });
			if (!response.ok) {
				if (response.status === 404) {
					throw new InstallerError(`tag not found`);
				} else {
					throw new InstallerError(`${response.status} ${response.statusText}`);
				}
			}

			return (await response.json()) as ReleaseData;
		} catch (error) {
			const err = error instanceof InstallerError ? error.message : error;
			throw new InstallerError(`Failed to fetch release '${tag}': ${err}`);
		}
	}

	static async getClient(release: ReleaseData): Promise<[BunFile, string]> {
		try {
			const asset = release.assets.find((asset) => asset.name === WINDOWS_ASSET_NAME);

			if (!asset) throw new InstallerError(`Asset "${WINDOWS_ASSET_NAME}" not found.`);

			const downloadPath = join(tmpdir(), asset.name);
			console.log(`Downloading ${asset.name} to: ${downloadPath}`);

			const downloadResponse = await fetch(asset.browser_download_url, {
				headers,
			});
			if (!downloadResponse.ok) throw new InstallerError(`Download failed: ${downloadResponse.status}`);

			await Bun.write(downloadPath, downloadResponse);

			return [Bun.file(downloadPath), asset.digest];
		} catch (error) {
			throw new InstallerError(`Failed to download windows client: ${error}`);
		}
	}
}
