export class InstallerError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InstallerError";
		Object.setPrototypeOf(this, InstallerError.prototype);
	}
}
