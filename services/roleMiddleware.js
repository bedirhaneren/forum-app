function roleMiddleware(requiredRoles) {
    return function(req, res, next) {
        if (!req.user) {
            res.status(401).json({ message: "Giriş yapmalısınız" });
            return;
        }

        const userRole = req.user.role;
        const canAccess = requiredRoles.includes(userRole);
        if (!canAccess) {
            res.status(403).json({ message: "Bu işlemi yapma yetkiniz yok" });
            return;
        }

        next();
    }
}
