// Third-party libs
import { Request, Response, Router, NextFunction } from 'express';
import https from 'https';
import axios from 'axios';

// Local libs
import Middleware from '../libs/middleware';
import Util from '../libs/util';
import { handleAxiosErrors, ErrorWithStatusCode } from '../libs/error-handler';

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

// support following tags
// if only /input/secure is provided, return 404
router.get('/secure', (req: Request, res: Response, next: NextFunction) => {
	const err = new ErrorWithStatusCode('Not Found', 404);
	return next(err);
});

/*
- select
- option
- input
*/
router.get('/:keyPath', async (req: Request, res: Response, next: NextFunction) => {
	// Extract URL params
	const keyPath = req.params.keyPath;
	const css = req.query.css;

	// Generate the secure token
	const token = Util.getBufferToken();

	// Set the token in the user's session
	req.session[token] = true;

	// Render the iframe
	return res.render('buffer', {
		routePrefix: 'input',
		keyPath,
		queryParams: {
			token,
			css
		}
	});
});

router.get('/secure/:keyPath', Middleware.verifyBufferTokens, async (req: Request, res: Response, next: NextFunction) => {
	// Extract URL params
	const keyPath = req.params.keyPath.split(',')[0];
	const css = req.query.css;
	const queryToken = req.query.token;

	// One-time use token
	delete req.session[queryToken];

	try {
		// Make the request as the given client
		const storageRes = await axios.get(`${storageURL}/users/info/${keyPath}`, {
			httpsAgent: clientAgent
		});

		// Extra data from storage response
		const data = storageRes.data;

		// Extract key path keys to traverse the response
		const keyPathsArr: string[] = keyPath.split('.');

		// Use key path keys to extract final value and return it
		let val = data;
		for (const keyPath of keyPathsArr) {
			val = val[keyPath];
		}

		// Create new token for submitting
		const token = Util.getBufferToken();

		// Set the token in the user's session
		req.session[token] = true;

		return res.render('secure/input', { inIframe: true, keyPath, value: val, css, token });
	} catch (err) {
		return handleAxiosErrors(err, req, res, next);
	}
});

router.post('/secure/:keyPath', Middleware.verifyBufferTokens, async (req: Request, res: Response, next: NextFunction) => {
	// Extract params
	const keyPath = req.params.keyPath;
	const queryToken = req.query.token;
	const css = req.query.css;
	const inputText = req.body['input-text'];

	// One-time use token
	delete req.session[queryToken];

	// Build key-path object
	const patchObj: any = {};
	const keyPathArr: string[] = keyPath.split('.');
	if (keyPathArr[keyPathArr.length - 1] === '') keyPathArr.pop();

	let keyPointer = patchObj;
	for (const idx in keyPathArr) {
		const key = keyPathArr[idx];
		if (idx === (keyPathArr.length - 1).toString()) {
			keyPointer[key] = inputText;
		} else {
			keyPointer[key] = {};
			keyPointer = keyPointer[key];
		}
	}

	try {
		await axios.patch(`${storageURL}/users`, {
			info: patchObj
		}, {
				httpsAgent: clientAgent
			});

		// Generate the secure token
		const token = Util.getBufferToken();

		// Set the token in the user's session
		req.session[token] = true;

		return res.render('secure/input', { inIframe: true, keyPath, css, token, value: inputText });
	} catch (err) {
		return handleAxiosErrors(err, req, res, next);
	}
});

export default router;
