import { User } from '../../users/entities/user.entity';
import { School } from '../../schools/entities/school.entity';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      school?: School;
    }
  }
}

export {};
