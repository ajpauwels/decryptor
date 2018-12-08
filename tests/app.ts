// Third-party libs
import chai from 'chai';
import { start } from '../src/app';
import { spy, SinonSpy } from 'sinon';
import { ErrorWithStatusCode } from '../src/libs/error-handler';
import fs from 'fs';
import { Server } from 'https';

const { expect } = chai;

// Load the TLS certs and keys for mutual TLS
const caCert = fs.readFileSync('./tests/tls/intermediate.root.cert.pem').toString();
const serverKey = fs.readFileSync('./tests/tls/server.key.pem').toString();
const serverCert = fs.readFileSync('./tests/tls/server.cert.pem').toString();

describe('app', function() {
	describe('#start', function() {
		describe('when env ZONE is not set to \'test\'', function() {
		});

		describe('when env ZONE is set to \'test\'', function() {
			before('setup env', function() {
				process.env['ZONE'] = 'test';
			});

			describe('when no TLS details are provided', function() {
				it('should throw a 400 error', async function() {
					let err: ErrorWithStatusCode;
					try {
						await start(undefined, undefined, undefined);
					} catch (e) {
						err = e;
					}

					expect(err).to.not.be.undefined;
					expect(err.message).to.be.equal('Missing TLS info');
					expect(err.statusCode).to.be.equal(400);
				});
			});

			describe('when TLS details are provided', function() {
				it('should return an HTTPS server', async function() {
					const server: any = await start(serverKey, serverCert, caCert);

					expect(server).to.be.instanceOf(Server);
					expect(server.key).to.be.equal(serverKey);
					expect(server.cert).to.be.equal(serverCert);
					expect(server.ca).to.be.equal(caCert);
				});
			});

			describe('when httpsServer is already defined', function() {
				it('should call stop on the httpsServer first', async function() {
					let server: any = await start(serverKey, serverCert, caCert);
					const closeSpy: SinonSpy = spy(server, 'close');

					server = await start(serverKey, serverCert, caCert);

					expect(closeSpy.calledOnce).to.be.true;
				});
			});
		});
	});
});

