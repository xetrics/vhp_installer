export const LATEST_TESTED_VERSION = "0.10.0.2";
export const DEFAULT_VALHEIM_INSTALL_DIR = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Valheim";
export const LATEST_RELEASE_URL = "https://api.github.com/repos/Grantapher/ValheimPlus/releases/latest";
export const WINDOWS_ASSET_NAME = "WindowsClient.tar.gz";

export const TAG_RELEASE_URL = (tag: string) =>
	`https://api.github.com/repos/Grantapher/ValheimPlus/releases/tags/${tag}`;
