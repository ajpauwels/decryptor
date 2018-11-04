// Third-party libs
import { Request, Response, NextFunction, Router } from 'express';
import https from 'https';
import axios from 'axios';
import crypto from 'crypto';
import uuidv4 from 'uuid/v4';

// Local libs
import Util from '../libs/util';
import { ErrorWithStatusCode, handleAxiosErrors } from '../libs/error-handler';
import { qualifiedTypeIdentifier } from 'babel-types';
import { query } from 'winston';

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

router.get('/:keyPaths', async (req: Request, res: Response, next: NextFunction) => {
	// Extract URL params
	const keyPaths = req.params.keyPaths;
	const css = req.query.css;

	// Use sha256 as our hashing function
	const sha256 = crypto.createHash('sha256');

	// Create the security token
	const time = new Date();
	const token = uuidv4();
	const valueToHash = `${time.toUTCString()} ${token}`;

	sha256.update(valueToHash, 'utf8');

	const hashedValue = sha256.digest('hex');

	// Set the token in the user's session
	req.session.iframeToken = hashedValue;

	// Render the iframe
	return res.render('iframe', { keyPaths, hashedValue, css });
});

router.get('/secure/:keyPaths', async (req: Request, res: Response, next: NextFunction) => {
	// Extract URL params
	const keyPaths = req.params.keyPaths;
	const queryToken = req.query.iframeToken;
	const sessionToken = req.session.iframeToken;
	const css = req.query.css;

	// One-time use token
	delete req.session.iframeToken;

	if (!queryToken || !sessionToken || queryToken !== sessionToken) {
		const err = new ErrorWithStatusCode('Rejected', 400);
		return next(err);
	}

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

		return res.render('secure', { inIframe: true, value: val, css });
	} catch (err) {
		return handleAxiosErrors(err, req, res, next);
	}
});

export default router;
