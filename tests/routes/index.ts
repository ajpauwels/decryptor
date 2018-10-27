// Third-party libs
import chai from 'chai';
import { start as startServer, stop as stopServer } from '../../src/app';
import Util from '../../src/libs/util';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import https from 'https';

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
