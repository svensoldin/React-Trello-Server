const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
	try {
		if (!req.session.user) return res.status(401).json("Not authenticated");
		next();
	} catch (err) {
		console.error(err);
		res.status(500).json("Server error");
	}
};
