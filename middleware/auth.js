module.exports = async (req, res, next) => {
  try {
    console.log(req.session);
    if (!req.session.user) return res.status(401).json('Not authenticated');
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
};
