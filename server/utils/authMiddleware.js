export async function isLoggedIn(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        return res.status(401).send({ errorMessage: "You are not authorized. Log in." });
    }
}

export async function isAllowedRole(allowedRoles) {
    return (req, res, next) => {

        const role = req.session.user.role;

        if (role === 'admin') { // Checker om user er logget ind som admin først
            return next();
        } else if (allowedRoles.includes(role)) { // Checker så user er logget ind som den ellers forventede rolle
            return next();
        } else {
            return res.status(403).send({ errorMessage: "You don't have the right, O, you don't have the right." });
        }
    }
}