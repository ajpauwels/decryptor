// Third-party libs
import { Request, Response, NextFunction, Router } from 'express';
import https from 'https';
import axios from 'axios';

// Local libs
import Util from '../libs/util';
import Middleware from '../libs/middleware';
import { handleAxiosErrors } from '../libs/error-handler';

// Attach new routes to the express router
const router = Router();

// Get the TLS client details
const clientKey = Util.getClientKey();
const clientCert = Util.getClientCert();
const clientCAChain = Util.getClientCAChain();

// Get the URL to contact for storage
const storageURL = Util.trailingSlash(Util.getStorageURL(), false);

// Build our client agent
const clientAgent: https.Agent = new https.Agent({
	key: clientKey,
	cert: clientCert,
	ca: clientCAChain
});

router.get('/:keyPaths', (req: Request, res: Response) => {
	// Extract URL params
	const keyPaths = req.params.keyPaths;
	const css = req.query.css;

	// Generate the secure token
	const token = Util.getBufferToken();

	// Set the token in the user's session
	req.session[token] = true;

	// Render the iframe
	return res.render('buffer', {
		routePrefix: 'info',
		keyPaths,
		queryParams: {
			token,
			css
		}
	});
});

router.get('/secure/:keyPaths', Middleware.verifyBufferTokens, async (req: Request, res: Response, next: NextFunction) => {
	// Extract URL params
	const keyPaths = req.params.keyPaths;
	const queryToken = req.query.token;
	const css = req.query.css;

	// One-time use token
	delete req.session[queryToken];

	try {
		// Make the request as the given client
		const storageRes = await axios.get(`${storageURL}/users/info/${keyPaths}`, {
			httpsAgent: clientAgent
		});

		// Extra data from storage response
		const data = storageRes.data;

		// Extract key path keys to traverse the response
		const keyPathsArr: string[] = keyPaths.split('.');

		// Use key path keys to extract final value and return it
		let val = data;
		for (const keyPath of keyPathsArr) {
			val = val[keyPath];
		}

		return res.render('secure/info', { inIframe: true, value: val, css });
	} catch (err) {
		return handleAxiosErrors(err, req, res, next);
	}
});

export default router;
