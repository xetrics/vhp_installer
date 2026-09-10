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
