import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

{/* Middleware to authenticate JWT token */}
export default function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.id };
        next();
    } catch (e) {
        console.error("JWT verify failed:", e.message);
        return res.status(401).json({ message: "Invalid token" });
    }
}
