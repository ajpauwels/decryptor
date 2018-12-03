// Third-party libs
import { Request, Response, Router, NextFunction } from 'express';

// Local libs
import Middleware from '../libs/middleware';
import Util from '../libs/util';

// Attach new routes to the express router
const router = Router();

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

	return res.render('secure/input', { inIframe: true, keyPath, css, token });
});

export default router;
