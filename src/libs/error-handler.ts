// Third-party libs
import { Request, Response, NextFunction } from 'express';
import { validationResult, Result } from 'express-validator/check';
import Logger from './logger';

const logger = Logger.createLogger(__filename);

// Define error interface
export class ErrorWithStatusCode extends Error {
	readonly statusCode: number;
	extra: any;

	constructor(msg?: string, statusCode: number = 500) {
		super(msg);
		this.statusCode = statusCode;
	}

	handle(req?: Request, res?: Response, next?: NextFunction) {
		logger.error(`${this.statusCode} ${this.stack}`);

		if (res) {
			res.status(this.statusCode).json({
				statusCode: this.statusCode,
				message: this.message,
				stack: this.stack,
				extra: this.extra
			});
		}
	}
}

export function handleAxiosErrors(err: any, req?: Request, res?: Response, next?: NextFunction) {
	if (err.response) {
		const resp: any = err.response.data;
		const newErr = new ErrorWithStatusCode(resp.message, resp.statusCode);

		return next(newErr);
	}
	else if (err.request) {
		const newErr = new ErrorWithStatusCode('No response from storage server', 502);

		return next(newErr);
	} else {
		const newErr = new ErrorWithStatusCode(err.message, 500);

		return next(newErr);
	}
}

export function handleValidationErrors(req?: Request, res?: Response, next?: NextFunction) {
	const validationResultObj: Result = validationResult(req);

	if (!validationResultObj.isEmpty()) {
		const err = new ErrorWithStatusCode(`Invalid input, ${JSON.stringify(validationResultObj.array())}`, 400);
		return next(err);
	} else {
		return next();
	}
}

export function errorHandler(err: Error, req?: Request, res?: Response, next?: NextFunction) {
	if (err instanceof ErrorWithStatusCode) {
		return err.handle(req, res, next);
	}

	logger.error(`500 ${err.stack}`);

	if (res) {
		const statusCode = 500;

		res.status(statusCode).json({
			statusCode,
			message: err.message,
			stack: err.stack
		});
	}
}
