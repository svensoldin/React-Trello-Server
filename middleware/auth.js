const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
	console.log(req.cookies);
	const token = req.cookies.token;
	if (!token) return res.status(401).json("Not authenticated, no token");
	try {
		const decoded = await jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded.id;
		next();
	} catch (err) {
		if (err.message === "jwt expired")
			return res.status(401).json("You need to login again");
		return res.status(500).json("Server error");
	}
};
