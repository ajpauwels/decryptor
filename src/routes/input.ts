// Third-party libs
import { Request, Response, Router, NextFunction } from 'express';
import https from 'https';
import axios from 'axios';

// Local libs
import Middleware from '../libs/middleware';
import Util from '../libs/util';

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
	const keyPath = req.params.keyPath;
	const css = req.query.css;
	const queryToken = req.query.token;

	// One-time use token
	delete req.session[queryToken];

	// Create new token for submitting
	const token = Util.getBufferToken();

	// Set the token in the user's session
	req.session[token] = true;

	return res.render('secure/input', { inIframe: true, keyPath, css, token });
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

		return res.render('secure/input', { inIframe: true, keyPath, css, token });
	} catch (err) {
		console.log(err);
	}
});

export default router;
