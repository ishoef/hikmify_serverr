import { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth.js";
import { UserRole } from "../utils/enums.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        emailVarified: boolean;
      };
    }
  }
}

const authMiddleware = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // For Validate the user
      // Get User Session
      const session = await auth.api.getSession({
        headers: req.headers as any,
      });

      // Session Check
      if (!session || !session.user) {
        return res.status(401).json({
          success: false,
          message: "You are not authorized!",
        });
      }

      const user = session?.user;

      // Set UserData to the Request
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as string,
        emailVarified: user.emailVerified,
      };

      if (roles.includes(UserRole.ALL)) {
        return next();
      }

      if (roles.length && !roles.includes(req.user?.role as UserRole)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden! You don't have permission to access this",
        });
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
};

export default authMiddleware;
