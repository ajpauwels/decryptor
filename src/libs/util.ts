import fs from 'fs';
import crypto from 'crypto';
import uuidv4 from 'uuid/v4';

export default class Util {
	static getBufferToken(): string {
		// Use sha256 as our hashing function
		const sha256 = crypto.createHash('sha256');

		// Create the security token
		const time = new Date();
		const token = uuidv4();
		const valueToHash = `${time.toUTCString()} ${token}`;

		sha256.update(valueToHash, 'utf8');

		const hashedValue = sha256.digest('hex');

		return hashedValue;
	}

	static getZone(): string {
		// Establish which zone we're running in
		const envZONE = process.env['ZONE'];
		let zone;

		if (!envZONE || envZONE === 'undefined' || envZONE === 'null') zone = 'prod';
		else zone = envZONE;

		const acceptedZones = ['dev', 'staging', 'prod', 'testing'];
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

	static getServerKey(): string {
		const keyPath: string = process.env['SERVER_KEY'];
		if (!keyPath) return undefined;

		return fs.readFileSync(keyPath).toString();
	}

	static getServerCert(): string {
		const certPath: string = process.env['SERVER_CERT'];
		if (!certPath) return undefined;

		return fs.readFileSync(certPath).toString();
	}

	static getServerCAChain(): string {
		const caChainPath: string = process.env['SERVER_CA_CHAIN'];
		if (!caChainPath) return undefined;

		return fs.readFileSync(caChainPath).toString();
	}

	static getClientKey(): string {
		const keyPath: string = process.env['CLIENT_KEY'];
		if (!keyPath) return undefined;

		return fs.readFileSync(keyPath).toString();
	}

	static getClientCert(): string {
		const certPath: string = process.env['CLIENT_CERT'];
		if (!certPath) return undefined;

		return fs.readFileSync(certPath).toString();
	}

	static getClientCAChain(): string {
		const caChainPath: string = process.env['CLIENT_CA_CHAIN'];
		if (!caChainPath) return undefined;

		return fs.readFileSync(caChainPath).toString();
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
		if (str.length === 0 && wantSlash) return '/';
		else if (str.length === 0 && !wantSlash) return '';

		const lastChar = str[str.length - 1];

		if (lastChar === '/' && !wantSlash) return str.substr(0, str.length - 1);
		else if (lastChar !== '/' && wantSlash) return str + '/';
		else return str;
	}
}
