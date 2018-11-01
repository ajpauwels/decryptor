import chai from 'chai';
import fs from 'fs';
import Util from '../../src/libs/util';

const { expect } = chai;

describe('Util', function() {
	describe('#getPort', function() {
		let port: string;

		before('store current port env', function() {
			port = process.env['PORT'];
		});

		after('restore port env', function() {
			process.env['PORT'] = port;
		});

		it('should return the number in the env if the number is a valid port', function() {
			let port;
			process.env['PORT'] = '4000';
			port = Util.getPort();
			expect(port).to.equal(4000);

			process.env['PORT'] = '5000';
			port = Util.getPort();
			expect(port).to.equal(5000);
		});

		it('should return 3000 if the value in the env is not a number', function() {
			let port;
			process.env['PORT'] = 'abc';
			port = Util.getPort();
			expect(port).to.equal(3000);
		});

		it('should return 3000 if the value in the env is an empty string', function() {
			let port;
			process.env['PORT'] = '';
			port = Util.getPort();
			expect(port).to.equal(3000);
		});

		it('should return 3000 if the value in the env is undefined', function() {
			let port;
			process.env['PORT'] = undefined;
			port = Util.getPort();
			expect(port).to.equal(3000);
		});

		it('should return 3000 if the value in the env is greater than 65535', function() {
			let port;
			process.env['PORT'] = '65536';
			port = Util.getPort();
			expect(port).to.equal(3000);
		});

		it('should return 3000 if the value in the env is less than 1', function() {
			let port;
			process.env['PORT'] = '0';
			port = Util.getPort();
			expect(port).to.equal(3000);
		});
	});

	describe('#getZone', function() {
		let zone: string;

		before('store current zone env', function() {
			zone = process.env['ZONE'];
		});

		after('restore zone env', function() {
			process.env['ZONE'] = zone;
		});

		it('should return \'dev\' when env var \'ZONE\' is set to \'dev\'', function() {
			process.env['ZONE'] = 'dev';

			const zone = Util.getZone();

			expect(zone).to.equal('dev');
		});

		it('should return \'staging\' when env var \'ZONE\' is set to \'staging\'', function() {
			process.env['ZONE'] = 'staging';

			const zone = Util.getZone();

			expect(zone).to.equal('staging');
		});

		it('should return \'prod\' when env var \'ZONE\' is set to \'prod\'', function() {
			process.env['ZONE'] = 'prod';

			const zone = Util.getZone();

			expect(zone).to.equal('prod');
		});

		it('should return \'testing\' when env var \'ZONE\' is set to \'testing\'', function() {
			process.env['ZONE'] = 'testing';

			const zone = Util.getZone();

			expect(zone).to.equal('testing');
		});

		it('should return \'prod\' when env var \'ZONE\' is undefined', function() {
			process.env['ZONE'] = undefined;

			const zone = Util.getZone();

			expect(zone).to.equal('prod');
		});

		it('should return \'prod\' when env var \'ZONE\' is set to an unknown value', function() {
			process.env['ZONE'] = 'bla';

			const zone = Util.getZone();

			expect(zone).to.equal('prod');
		});
	});

	describe('#getServerKey', function() {
		let serverKey: string;

		before('store current server key env', function() {
			serverKey = process.env['SERVER_KEY'];
		});

		after('restore server key env', function() {
			process.env['SERVER_KEY'] = serverKey;
		});

		it('should return undefined if no SERVER_KEY env is defined', function() {
			delete process.env['SERVER_KEY'];

			const serverKey = Util.getServerKey();
			expect(serverKey).to.be.undefined;
		});

		it('should throw an error if the env is a path to a non-existent file', function() {
			process.env['SERVER_KEY'] = './tests/tls/badpath.key.pem';

			try {
				const serverKey = Util.getServerKey();
			} catch (err) {
				expect(err).to.be.an.instanceof(Error);
				expect(err.message).to.equal("ENOENT: no such file or directory, open './tests/tls/badpath.key.pem'");
			}
		});

		it('should return the server key as a string if a valid path is provided', function() {
			process.env['SERVER_KEY'] = './tests/tls/server.key.pem';

			const key = fs.readFileSync('./tests/tls/server.key.pem').toString();
			const serverKey = Util.getServerKey();

			expect(serverKey).to.equal(key);
		});

		it('should return undefined if the SERVER_KEY env is an empty string', function() {
			process.env['SERVER_KEY'] = '';

			const serverKey = Util.getServerKey();

			expect(serverKey).to.be.undefined;
		});
	});

	describe('#getServerCert', function() {
		let serverCert: string;

		before('store current server cert env', function() {
			serverCert = process.env['SERVER_CERT'];
		});

		after('restore server cert env', function() {
			process.env['SERVER_CERT'] = serverCert;
		});

		it('should return undefined if no SERVER_CERT env is defined', function() {
			delete process.env['SERVER_CERT'];

			const serverCert = Util.getServerCert();
			expect(serverCert).to.be.undefined;
		});

		it('should throw an error if the env is a path to a non-existent file', function() {
			process.env['SERVER_CERT'] = './tests/tls/badpath.cert.pem';

			try {
				const serverCert = Util.getServerCert();
			} catch (err) {
				expect(err).to.be.an.instanceof(Error);
				expect(err.message).to.equal("ENOENT: no such file or directory, open './tests/tls/badpath.cert.pem'");
			}
		});

		it('should return the server cert as a string if a valid path is provided', function() {
			process.env['SERVER_CERT'] = './tests/tls/server.cert.pem';

			const cert = fs.readFileSync('./tests/tls/server.cert.pem').toString();
			const serverCert = Util.getServerCert();

			expect(serverCert).to.equal(cert);
		});

		it('should return undefined if the SERVER_CERT env is an empty string', function() {
			process.env['SERVER_CERT'] = '';

			const serverCert = Util.getServerCert();

			expect(serverCert).to.be.undefined;
		});
	});

	describe('#getServerCAChain', function() {
		let serverCAChain: string;

		before('store current server CA chain env', function() {
			serverCAChain = process.env['SERVER_CA_CHAIN'];
		});

		after('restore server CA chain env', function() {
			process.env['SERVER_CA_CHAIN'] = serverCAChain;
		});

		it('should return undefined if no SERVER_CA_CHAIN env is defined', function() {
			delete process.env['SERVER_CA_CHAIN'];

			const serverCAChain = Util.getServerCAChain();
			expect(serverCAChain).to.be.undefined;
		});

		it('should throw an error if the env is a path to a non-existent file', function() {
			process.env['SERVER_CA_CHAIN'] = './tests/tls/badpath.cert.pem';

			try {
				const serverCAChain = Util.getServerCAChain();
			} catch (err) {
				expect(err).to.be.an.instanceof(Error);
				expect(err.message).to.equal("ENOENT: no such file or directory, open './tests/tls/badpath.cert.pem'");
			}
		});

		it('should return the server CA chain as a string if a valid path is provided', function() {
			process.env['SERVER_CA_CHAIN'] = './tests/tls/intermediate.root.cert.pem';

			const cert = fs.readFileSync('./tests/tls/intermediate.root.cert.pem').toString();
			const serverCAChain = Util.getServerCAChain();

			expect(serverCAChain).to.equal(cert);
		});

		it('should return undefined if the SERVER_CA_CHAIN env is an empty string', function() {
			process.env['SERVER_CA_CHAIN'] = '';

			const serverCAChain = Util.getServerCAChain();

			expect(serverCAChain).to.be.undefined;
		});
	});

	describe('#getClientKey', function() {
		let clientKey: string;

		before('store current client key env', function() {
			clientKey = process.env['CLIENT_KEY'];
		});

		after('restore client key env', function() {
			process.env['CLIENT_KEY'] = clientKey;
		});

		it('should return undefined if no CLIENT_KEY env is defined', function() {
			delete process.env['CLIENT_KEY'];

			const clientKey = Util.getClientKey();
			expect(clientKey).to.be.undefined;
		});

		it('should throw an error if the env is a path to a non-existent file', function() {
			process.env['CLIENT_KEY'] = './tests/tls/badpath.key.pem';

			try {
				const clientKey = Util.getClientKey();
			} catch (err) {
				expect(err).to.be.an.instanceof(Error);
				expect(err.message).to.equal("ENOENT: no such file or directory, open './tests/tls/badpath.key.pem'");
			}
		});

		it('should return the client key as a string if a valid path is provided', function() {
			process.env['CLIENT_KEY'] = './tests/tls/tester.key.pem';

			const key = fs.readFileSync('./tests/tls/tester.key.pem').toString();
			const clientKey = Util.getClientKey();

			expect(clientKey).to.equal(key);
		});

		it('should return undefined if the CLIENT_KEY env is an empty string', function() {
			process.env['CLIENT_KEY'] = '';

			const clientKey = Util.getClientKey();

			expect(clientKey).to.be.undefined;
		});
	});

	describe('#getClientCert', function() {
		let clientCert: string;

		before('store current client cert env', function() {
			clientCert = process.env['CLIENT_CERT'];
		});

		after('restore client cert env', function() {
			process.env['CLIENT_CERT'] = clientCert;
		});

		it('should return undefined if no CLIENT_CERT env is defined', function() {
			delete process.env['CLIENT_CERT'];

			const clientCert = Util.getClientCert();
			expect(clientCert).to.be.undefined;
		});

		it('should throw an error if the env is a path to a non-existent file', function() {
			process.env['CLIENT_CERT'] = './tests/tls/badpath.cert.pem';

			try {
				const clientCert = Util.getClientCert();
			} catch (err) {
				expect(err).to.be.an.instanceof(Error);
				expect(err.message).to.equal("ENOENT: no such file or directory, open './tests/tls/badpath.cert.pem'");
			}
		});

		it('should return the client cert as a string if a valid path is provided', function() {
			process.env['CLIENT_CERT'] = './tests/tls/tester.cert.pem';

			const cert = fs.readFileSync('./tests/tls/tester.cert.pem').toString();
			const clientCert = Util.getClientCert();

			expect(clientCert).to.equal(cert);
		});

		it('should return undefined if the CLIENT_CERT env is an empty string', function() {
			process.env['CLIENT_CERT'] = '';

			const clientCert = Util.getClientCert();

			expect(clientCert).to.be.undefined;
		});
	});

	describe('#getClientCAChain', function() {
		let clientCAChain: string;

		before('store current client CA chain env', function() {
			clientCAChain = process.env['CLIENT_CA_CHAIN'];
		});

		after('restore client CA chain env', function() {
			process.env['CLIENT_CA_CHAIN'] = clientCAChain;
		});

		it('should return undefined if no CLIENT_CA_CHAIN env is defined', function() {
			delete process.env['CLIENT_CA_CHAIN'];

			const clientCAChain = Util.getClientCAChain();
			expect(clientCAChain).to.be.undefined;
		});

		it('should throw an error if the env is a path to a non-existent file', function() {
			process.env['CLIENT_CA_CHAIN'] = './tests/tls/badpath.cert.pem';

			try {
				const clientCAChain = Util.getClientCAChain();
			} catch (err) {
				expect(err).to.be.an.instanceof(Error);
				expect(err.message).to.equal("ENOENT: no such file or directory, open './tests/tls/badpath.cert.pem'");
			}
		});

		it('should return the client CA chain as a string if a valid path is provided', function() {
			process.env['CLIENT_CA_CHAIN'] = './tests/tls/intermediate.root.cert.pem';

			const cert = fs.readFileSync('./tests/tls/intermediate.root.cert.pem').toString();
			const clientCAChain = Util.getClientCAChain();

			expect(clientCAChain).to.equal(cert);
		});

		it('should return undefined if the CLIENT_CA_CHAIN env is an empty string', function() {
			process.env['CLIENT_CA_CHAIN'] = '';

			const clientCAChain = Util.getClientCAChain();

			expect(clientCAChain).to.be.undefined;
		});
	});

	describe('#getSessionSecret', function() {
		let sessionSecret: string;

		before('store current session secret env', function() {
			sessionSecret = process.env['SESSION_SECRET'];
		});

		after('restore session secret env', function() {
			process.env['SESSION_SECRET'] = sessionSecret;
		});

		it('should return undefined if no SESSION_SECRET is defined', function() {
			delete process.env['SESSION_SECRET'];

			const sessionSecret = Util.getSessionSecret();

			expect(sessionSecret).to.be.undefined;
		});

		it('should return undefined if the SESSION_SECRET is an empty string', function() {
			process.env['SESSION_SECRET'] = '';

			const sessionSecret = Util.getSessionSecret();

			expect(sessionSecret).to.be.undefined;
		});

		it('should return the env value if SESSION_SECRET is a non-empty string', function() {
			process.env['SESSION_SECRET'] = 'some-secret';

			const sessionSecret = Util.getSessionSecret();

			expect(sessionSecret).to.equal('some-secret');
		});
	});

	describe('#getStorageURL', function() {
		let storageURL: string;

		before('store current storage URL env', function() {
			storageURL = process.env['STORAGE_URL'];
		});

		after('restore storage URL env', function() {
			process.env['STORAGE_URL'] = storageURL;
		});

		it('should return undefined if no STORAGE_URL is defined', function() {
			delete process.env['STORAGE_URL'];

			const storageURL = Util.getStorageURL();

			expect(storageURL).to.be.undefined;
		});

		it('should return undefined if the STORAGE_URL is an empty string', function() {
			process.env['STORAGE_URL'] = '';

			const storageURL = Util.getStorageURL();

			expect(storageURL).to.be.undefined;
		});

		it('should return the env value if STORAGE_URL is a non-empty string', function() {
			process.env['STORAGE_URL'] = 'https://some.url.com';

			const storageURL = Util.getStorageURL();

			expect(storageURL).to.equal('https://some.url.com');
		});
	});

	describe('#trailingSlash', function() {
		it('should return a single slash if the given string is empty and wantSlash is true', function() {
			const strTrue = Util.trailingSlash('', true);

			expect(strTrue).to.equal('/');
		});

		it('should return an empty string if the given string is empty and wantSlash is false', function() {
			const strTrue = Util.trailingSlash('', false);

			expect(strTrue).to.be.empty.string;
		});

		it('should return the given string with a slash at the end if a non-empty string without a slash is given and wantSlash is true', function() {
			const str = Util.trailingSlash('someString', true);

			expect(str).to.equal('someString/');
		});

		it('should return the given string if a non-empty string without a slash is given and wantSlash is false', function() {
			const str = Util.trailingSlash('someString', false);

			expect(str).to.equal('someString');
		});

		it('should return the given string if a non-empty string with a slash is given and wantSlash is true', function() {
			const str = Util.trailingSlash('someString/', true);

			expect(str).to.equal('someString/');
		});

		it('should return the given string without a slash if a non-empty string with a slash is given and wantSlash is false', function() {
			const str = Util.trailingSlash('someString/', false);

			expect(str).to.equal('someString');
		});
	});
});
