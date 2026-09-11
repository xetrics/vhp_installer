export const LATEST_TAG = "latest";
export const LATEST_RELEASE_URL = "https://api.github.com/repos/Grantapher/ValheimPlus/releases/latest";
export const WINDOWS_ASSET_NAME = "WindowsClient.tar.gz";
export const VALHEIM_APP_ID = 892970;

export const TAG_RELEASE_URL = (tag: string) =>
	`https://api.github.com/repos/Grantapher/ValheimPlus/releases/tags/${tag}`;
