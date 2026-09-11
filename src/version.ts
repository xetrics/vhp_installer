declare const BUILD_VERSION: string;

export function getInstallerVersion() {
	return BUILD_VERSION ?? "UNKOWN";
}
