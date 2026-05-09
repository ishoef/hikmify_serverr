import { auth } from "../lib/auth.js";
import { UserRole } from "../utils/enums.js";
const authMiddleware = (...roles) => {
    return async (req, res, next) => {
        try {
            // For Validate the user
            // Get User Session
            const session = await auth.api.getSession({
                headers: req.headers,
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
                role: user.role,
                emailVarified: user.emailVerified,
            };
            if (roles.includes(UserRole.ALL)) {
                return next();
            }
            if (roles.length && !roles.includes(req.user?.role)) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden! You don't have permission to access this",
                });
            }
            return next();
        }
        catch (error) {
            next(error);
        }
    };
};
export default authMiddleware;
//# sourceMappingURL=authMiddleware.js.map