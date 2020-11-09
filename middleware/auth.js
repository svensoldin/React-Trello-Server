const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
	const token = req.header("x-auth-token");
	if (!token) return res.status(401).json("Not authorized, no token");
	try {
		const decoded = await jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded.id;
		next();
	} catch (err) {
		console.error(err);
		res.status(500).json("Server error");
	}
};
