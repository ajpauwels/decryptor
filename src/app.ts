// Third-party libs
import path from 'path';
import fs from 'fs';
import express from 'express';
import https from 'https';
import { TLSSocket } from 'tls';

// Third-party middleware
import bodyParser from 'body-parser';

// Local libs
import Util from './libs/util';
import Logger from './libs/logger';
const logger = Logger.createLogger(__filename);

// Local middleware
import { errorHandler, ErrorWithStatusCode } from './libs/error-handler';

// Routing modules
import indexRoutes from './routes/index';

// Create the express app
const app = express();

// Attach JSON and URL-encoded body parsers
app.use(bodyParser.json({
	type: [
		'application/json',
		'application/json-patch+json',
		'application/merge-patch+json'
	]
}));
app.use(bodyParser.urlencoded({ extended: false }));

// Attach express routes
app.use('/', indexRoutes);

// Attach custom error-handler
app.use(errorHandler);

// Declare the server
let httpsServer: https.Server;

// Get the SSL keys
const tlsKey: string = process.env['SERVER_KEY'];
const tlsCert: string = process.env['SERVER_CERT'];
const caChain: string = process.env['CA_CHAIN'];

// Start the server with the given TLS certs
start(tlsKey, tlsCert, caChain);

/**
 * Starts the server listening on the env-specified port
 * with the given TLS params.
 *
 * @param {Buffer} tlsKey Server's TLS key
 * @param {Buffer} tlsCert Server's TLS certificate signed by CA
 * @param {Buffer} caChain Chain of CA certs back to the root CA
 * @returns {void}
 */
export async function start(tlsKey: string, tlsCert: string, caChain: string): Promise<https.Server> {
	const zone = Util.getZone();
	if (!tlsKey || !tlsCert || !caChain) throw new ErrorWithStatusCode('Missing TLS info', 400);

	// Discover port to listen on
	const port = Util.getPort();

	if (httpsServer) {
		stop();
	}

	httpsServer = https.createServer({
		key: tlsKey,
		cert: tlsCert,
		ca: caChain,
		secureProtocol: 'TLSv1_2_method',
		ecdhCurve: 'auto'
	}, app).listen(port, () => {
		logger.info(`Started in ${Util.getZone().toUpperCase()} zone listening on port ${port}`);
	});

	return new Promise<https.Server>((resolv, reject) => {
		return resolv(httpsServer);
	});
}

/**
 * Stops and closes the server connection.
 *
 * @returns {void}
 */
export function stop() {
	httpsServer.close();
}
