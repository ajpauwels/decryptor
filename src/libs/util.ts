export default class Util {
	static getZone(): string {
		// Establish which zone we're running in
		const envZONE = process.env['ZONE'];
		let zone;

		if (!envZONE || envZONE === 'undefined' || envZONE === 'null') zone = 'prod';
		else zone = envZONE;

		const acceptedZones = ['dev', 'staging', 'prod', 'test'];
		if (acceptedZones.indexOf(zone) === -1) {
			zone = 'prod';
		}

		return zone;
	}

	static getPort(): number {
		const parsedEnv = parseInt(process.env['PORT']);

		if (isNaN(parsedEnv)) return 3000;
		if (parsedEnv < 1 || parsedEnv > 65535) return 3000;
		else return parsedEnv;
	}

	static getClientKey(): string {
		const keyEnv: string = process.env['CLIENT_KEY'];

		if (!keyEnv) return undefined;

		return keyEnv;
	}

	static getClientCert(): string {
		const certEnv: string = process.env['CLIENT_CERT'];

		if (!certEnv) return undefined;

		return certEnv;
	}

	static getClientCAChain(): string {
		const caChainEnv: string = process.env['CLIENT_CA_CHAIN'];

		if (!caChainEnv) return undefined;

		return caChainEnv;
	}

	static getStorageURL(): string {
		const storageURL: string = process.env['STORAGE_URL'];

		if (!storageURL) return undefined;

		return storageURL;
	}

	static getSessionSecret(): string {
		const sessionSecret: string = process.env['SESSION_SECRET'];

		if (!sessionSecret) return undefined;

		return sessionSecret;
	}

	static trailingSlash(str: string, wantSlash: boolean): string {
		if (!str) return str;

		const lastChar = str[str.length - 1];

		if (lastChar === '/' && !wantSlash) return str.substr(0, str.length - 1);
		else if (lastChar !== '/' && wantSlash) return str + '/';
		else return str;
	}
}
