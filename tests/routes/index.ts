// Third-party libs
import chai from 'chai';
import fetch from 'node-fetch';
import fs from 'fs';
import https from 'https';
import pug from 'pug';
import { SinonStub, stub } from 'sinon';
import axios from 'axios';

import { start as startServer } from '../../src/app';
import Util from '../../src/libs/util';
import { ErrorWithStatusCode } from '../../src/libs/error-handler';

// Load the TLS certs and keys for mutual TLS
const caCert = fs.readFileSync('./tests/tls/intermediate.root.cert.pem').toString();
const serverKey = fs.readFileSync('./tests/tls/server.key.pem').toString();
const serverCert = fs.readFileSync('./tests/tls/server.cert.pem').toString();

// Load the port number to use
const port = Util.getPort();

// Start the express app
startServer(serverKey, serverCert, caCert);

// Extract the expect lib out of Chai
const { expect } = chai;

describe('GET /', function() {
	it('should respond with a 200 status and a message saying \'Up and running\'', async function() {
		const res = await fetch(`https://localhost:${port}`, {
			agent: new https.Agent({
				ca: caCert
			})
		});

		const responseText = await res.text();
		expect(responseText).to.equal('Up and running');
		expect(res.status).to.equal(200);
	});
});

describe('GET /info/:keyPaths', function() {
	let compiledIFrameView: Function;

	before('compile pug view', function() {
		compiledIFrameView = pug.compileFile('./src/views/buffer.pug');
	});

	describe('with no keypaths', function() {
		it('should respond with a 404 status', async function() {
			const res = await fetch(`https://localhost:${port}/info/`, {
				agent: new https.Agent({
					ca: caCert
				})
			});

			expect(res.status).to.equal(404);
		});
	});

	describe('with one keypath', function() {
		it('should respond with a 200 status and an HTML page with a well-formatted iframe', async function() {
			const res = await fetch(`https://localhost:${port}/info/somePath`, {
				agent: new https.Agent({
					ca: caCert
				})
			});

			const htmlResp = await res.text();

			expect(htmlResp).to.be.a('string').and.not.be.empty;

			const rx = /\?token=([a-z0-9]+)/;
			const rxResult = rx.exec(htmlResp);

			expect(rxResult).to.not.be.undefined;
			expect(rxResult).to.not.be.null;
			expect(rxResult).to.be.an('array');
			expect(rxResult).to.have.lengthOf(2);

			const token = rxResult[1];

			const htmlCompiled = compiledIFrameView({
				queryParams: {
					token
				},
				keyPath: 'somePath',
				routePrefix: 'info'
			});

			expect(htmlResp).to.equal(htmlCompiled);
		});
	});

	describe('with multiple keypaths', function() {
		it('should respond with a 200 status and an HTML page with a well-formatted iframe', async function() {
			const res = await fetch(`https://localhost:${port}/info/somePath,someOtherPath`, {
				agent: new https.Agent({
					ca: caCert
				})
			});

			const htmlResp = await res.text();

			expect(htmlResp).to.be.a('string').and.not.be.empty;

			const rx = /\?token=([a-z0-9]+)/;
			const rxResult = rx.exec(htmlResp);

			expect(rxResult).to.not.be.undefined;
			expect(rxResult).to.not.be.null;
			expect(rxResult).to.be.an('array');
			expect(rxResult).to.have.lengthOf(2);

			const token = rxResult[1];

			const htmlCompiled = compiledIFrameView({
				queryParams: {
					token
				},
				keyPaths: 'somePath,someOtherPath',
				routePrefix: 'info'
			});

			expect(htmlResp).to.equal(htmlCompiled);
		});
	});

	describe('with a CSS query param', function() {
		it('should respond with a 200 status and an HTML page with a well-formatted iframe', async function() {
			const res = await fetch(`https://localhost:${port}/info/somePath?css=p { color: red }`, {
				agent: new https.Agent({
					ca: caCert
				})
			});

			const htmlResp = await res.text();

			const rx = /\?token=([a-z0-9]+)/;
			const rxResult = rx.exec(htmlResp);

			expect(rxResult).to.not.be.undefined;
			expect(rxResult).to.not.be.null;
			expect(rxResult).to.be.an('array');
			expect(rxResult).to.have.lengthOf(2);

			const token = rxResult[1];

			const htmlCompiled = compiledIFrameView({
				queryParams: {
					token,
					css: 'p { color: red }',
				},
				keyPaths: 'somePath',
				routePrefix: 'info'
			});

			expect(htmlResp).to.equal(htmlCompiled);
		});
	});
});

describe('GET /info/secure/:keyPaths', function() {
	let compiledSecureView: Function;
	let axiosGetStub: SinonStub;

	before('compile the secure.pug view', function() {
		compiledSecureView = pug.compileFile('./src/views/secure/info.pug');
	});

	before('stub out the axios.get function', function() {
		axiosGetStub = stub(axios, 'get');
	});

	afterEach('reset the get stub', function() {
		axiosGetStub.resetHistory();
	});

	before('compile pug view', function() {
		compiledSecureView = pug.compileFile('./src/views/secure/info.pug');
	});

	describe('with no keypaths', function() {
		it('should respond with a 404 status', async function() {
			const res = await fetch(`https://localhost:${port}/info/secure/`, {
				agent: new https.Agent({
					ca: caCert
				})
			});

			expect(res.status).to.equal(404);
		});
	});

	describe('with neither query nor session tokens', function() {
		it('should respond with a 400 status and message saying \'Rejected\'', async function() {
			const res = await fetch(`https://localhost:${port}/info/secure/somePath`, {
				agent: new https.Agent({
					ca: caCert
				})
			});

			const resJSON = await res.json();

			expect(res.status).to.equal(400);
			expect(resJSON.message).to.equal('Rejected');
		});
	});

	describe('with a query token but no session token', function() {
		it('should respond with a 400 status and message saying \'Rejected\'', async function() {
			const nonSecureRes = await fetch(`https://localhost:${port}/info/somePath`, {
				agent: new https.Agent({
					ca: caCert
				})
			});

			const htmlResp = await nonSecureRes.text();

			const rx = /\?token=([a-z0-9]+)/;
			const rxResult = rx.exec(htmlResp);

			expect(rxResult).to.not.be.undefined;
			expect(rxResult).to.not.be.null;
			expect(rxResult).to.be.an('array');
			expect(rxResult).to.have.lengthOf(2);

			const token = rxResult[1];

			const res = await fetch(`https://localhost:${port}/info/secure/somePath?token=${token}`, {
				agent: new https.Agent({
					ca: caCert
				})
			});

			const resJSON = await res.json();

			expect(res.status).to.equal(400);
			expect(resJSON.message).to.equal('Rejected');
			expect(axiosGetStub.notCalled).to.be.true;
		});
	});

	describe('with a session token but no query token', function() {
		it('should respond with a 400 status and message saying \'Rejected\'', async function() {
			const nonSecureRes = await fetch(`https://localhost:${port}/info/somePath`, {
				agent: new https.Agent({
					ca: caCert
				})
			});

			const sessionCookie: any = nonSecureRes.headers.get('set-cookie');

			const cookieName = 'connect.sid';
			const cookieRx = /connect\.sid=([^;]+);/;
			const cookieRxRes = cookieRx.exec(sessionCookie);

			expect(cookieRxRes).to.not.be.undefined;
			expect(cookieRxRes).to.not.be.null;
			expect(cookieRxRes).to.be.an('array');
			expect(cookieRxRes).to.have.lengthOf(2);

			const cookieValue = cookieRxRes[1];

			const res = await fetch(`https://localhost:${port}/info/secure/somePath`, {
				agent: new https.Agent({
					ca: caCert
				}),
				headers: {
					cookie: `${cookieName}=${cookieValue}`
				}
			});

			const resJSON = await res.json();

			expect(res.status).to.equal(400);
			expect(resJSON.message).to.equal('Rejected');
			expect(axiosGetStub.notCalled).to.be.true;
		});
	});

	describe('with a session token and query token that do not match', function() {
		it('should respond with a 400 status and message saying \'Rejected\'', async function() {
			const nonSecureRes = await fetch(`https://localhost:${port}/info/somePath`, {
				agent: new https.Agent({
					ca: caCert
				})
			});

			const sessionCookie: any = nonSecureRes.headers.get('set-cookie');

			const cookieName = 'connect.sid';
			const cookieRx = /connect\.sid=([^;]+);/;
			const cookieRxRes = cookieRx.exec(sessionCookie);

			expect(cookieRxRes).to.not.be.undefined;
			expect(cookieRxRes).to.not.be.null;
			expect(cookieRxRes).to.be.an('array');
			expect(cookieRxRes).to.have.lengthOf(2);

			const cookieValue = cookieRxRes[1];

			const res = await fetch(`https://localhost:${port}/info/secure/somePath?token=notCorrect`, {
				agent: new https.Agent({
					ca: caCert
				}),
				headers: {
					cookie: `${cookieName}=${cookieValue}`
				}
			});

			const resJSON = await res.json();

			expect(res.status).to.equal(400);
			expect(resJSON.message).to.equal('Rejected');
			expect(axiosGetStub.notCalled).to.be.true;
		});
	});

	describe('with a session token and query token that match', function() {
		describe('with an axios call that succeeds', function() {
			before('setup axios get stub success promise', function() {
				axiosGetStub.resolves({
					data: {
						somePath: 'someValue'
					}
				});
			});

			after('reset axios get stub', function() {
				axiosGetStub.reset();
			});

			it('should respond with a 200 status and the desired information', async function() {
				const nonSecureRes = await fetch(`https://localhost:${port}/info/somePath`, {
					agent: new https.Agent({
						ca: caCert
					})
				});

				const sessionCookie: any = nonSecureRes.headers.get('set-cookie');

				const cookieName = 'connect.sid';
				const cookieRx = /connect\.sid=([^;]+);/;
				const cookieRxRes = cookieRx.exec(sessionCookie);

				expect(cookieRxRes).to.not.be.undefined;
				expect(cookieRxRes).to.not.be.null;
				expect(cookieRxRes).to.be.an('array');
				expect(cookieRxRes).to.have.lengthOf(2);

				const cookieValue = cookieRxRes[1];

				const htmlResp = await nonSecureRes.text();

				const rx = /\?token=([a-z0-9]+)/;
				const rxResult = rx.exec(htmlResp);

				expect(rxResult).to.not.be.undefined;
				expect(rxResult).to.not.be.null;
				expect(rxResult).to.be.an('array');
				expect(rxResult).to.have.lengthOf(2);

				const token = rxResult[1];

				const secureRes = await fetch(`https://localhost:${port}/info/secure/somePath?token=${token}`, {
					agent: new https.Agent({
						ca: caCert
					}),
					headers: {
						cookie: `${cookieName}=${cookieValue}`
					}
				});

				const secureResHTML = await secureRes.text();
				const compiledHTML = compiledSecureView({
					inIframe: true,
					value: 'someValue'
				});

				expect(secureRes.status).to.equal(200);
				expect(axiosGetStub.calledOnce).to.be.true;
				expect(secureResHTML).to.equal(compiledHTML);
			});
		});

		describe('with an axios call that fails', function() {
			const axiosMockErr = new ErrorWithStatusCode('Storage server unavailable', 502);

			before('setup axios get stub failure promise', function() {
				axiosGetStub.rejects({
					response: {
						data: axiosMockErr
					}
				});
			});

			after('reset axios get stub', function() {
				axiosGetStub.reset();
			});

			it('should respond with the same status as the error and with the error text', async function() {
				const nonSecureRes = await fetch(`https://localhost:${port}/info/somePath`, {
					agent: new https.Agent({
						ca: caCert
					})
				});

				const sessionCookie: any = nonSecureRes.headers.get('set-cookie');

				const cookieName = 'connect.sid';
				const cookieRx = /connect\.sid=([^;]+);/;
				const cookieRxRes = cookieRx.exec(sessionCookie);

				expect(cookieRxRes).to.not.be.undefined;
				expect(cookieRxRes).to.not.be.null;
				expect(cookieRxRes).to.be.an('array');
				expect(cookieRxRes).to.have.lengthOf(2);

				const cookieValue = cookieRxRes[1];

				const htmlResp = await nonSecureRes.text();

				const rx = /\?token=([a-z0-9]+)/;
				const rxResult = rx.exec(htmlResp);

				expect(rxResult).to.not.be.undefined;
				expect(rxResult).to.not.be.null;
				expect(rxResult).to.be.an('array');
				expect(rxResult).to.have.lengthOf(2);

				const token = rxResult[1];

				const secureRes = await fetch(`https://localhost:${port}/info/secure/somePath?token=${token}`, {
					agent: new https.Agent({
						ca: caCert
					}),
					headers: {
						cookie: `${cookieName}=${cookieValue}`
					}
				});

				const secureResJSON = await secureRes.json();

				expect(secureRes.status).to.equal(axiosMockErr.statusCode);
				expect(axiosGetStub.calledOnce).to.be.true;
				expect(secureResJSON.message).to.equal(axiosMockErr.message);
			});
		});
	});
});
