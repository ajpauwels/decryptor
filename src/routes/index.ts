// Third-party libs
import { Request, Response, Router } from 'express';

// Attach new routes to the express router
const router = Router();

router.get('/', (req: Request, res: Response) => {
	res.send('Up and running');
});

export default router;
