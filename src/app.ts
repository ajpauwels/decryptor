// Third-party libs
import express from 'express';
import https from 'https';
import helmet from 'helmet';
import session from 'express-session';

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
import infoRoutes from './routes/info';
import inputRoutes from './routes/input';

// Create the express app
const app = express();

// Use pug to render views
app.set('views', 'src/views');
app.set('view engine', 'pug');

// Attach Helmet to enforce certain security parameters
app.use(helmet({
	frameguard: false
}));
app.use(helmet.noCache());

// Define public assets folder
app.use(express.static('src/public'));

// Attach JSON and URL-encoded body parsers
app.use(bodyParser.json({
	type: [
		'application/json',
		'application/json-patch+json',
		'application/merge-patch+json'
	]
}));
app.use(bodyParser.urlencoded({ extended: false }));

// Attach session-handling middleware
app.use(session({
	secret: Util.getSessionSecret(),
	resave: false,
	saveUninitialized: false
}));

// Attach express routes
app.use('/', indexRoutes);
app.use('/info', infoRoutes);
app.use('/input', inputRoutes);

// Attach custom error-handler
app.use(errorHandler);

// Declare the server
let httpsServer: https.Server;

// Get the SSL keys
const tlsKey: string = Util.getServerKey();
const tlsCert: string = Util.getServerCert();
const caChain: string = Util.getServerCAChain();

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

	return new Promise<https.Server>((resolv) => {
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
