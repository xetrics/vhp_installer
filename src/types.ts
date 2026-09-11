export type ReleaseData = {
	tag_name: string;
	published_at: string;
	name: string;
	assets: {
		name: string;
		digest: string;
		browser_download_url: string;
	}[];
};

export type LibraryFoldersVDF = {
	libraryfolders: Record<
		string,
		{
			path: string;
			label: string;
			contentid: number;
			totalsize: number;
			update_clean_bytes_tally: number;
			time_last_update_verified: number;
			// appID -> ?
			apps: Record<string, number>;
		}
	>;
};
