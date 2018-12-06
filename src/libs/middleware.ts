import { ErrorWithStatusCode } from './error-handler';
import { Request, Response, NextFunction } from 'express';

export default class Middleware {
	static verifyBufferTokens(req: Request, res: Response, next: NextFunction): void {
		const queryToken = req.query.token;
		if (!queryToken || typeof (queryToken) !== 'string') {
			const err = new ErrorWithStatusCode('Rejected', 400);
			return next(err);
		}

		const sessionToken = req.session[queryToken];
		if (!sessionToken || typeof (sessionToken) !== 'boolean' || sessionToken !== true) {
			const err = new ErrorWithStatusCode('Rejected', 400);
			return next(err);
		} else {
			return next();
		}
	}
}
