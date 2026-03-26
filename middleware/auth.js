module.exports = {
  requireAuth: (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    next();
  },

  guestOnly: (req, res, next) => {
    if (req.session.user) {
      return res.redirect('/profile');
    }
    next();
  },

  requireRole: (roles) => {
    return (req, res, next) => {
      if (!req.session.user) {
        return res.redirect('/auth/login');
      }
      if (!roles.includes(req.session.user.role)) {
        return res.status(403).render('errors/403', {
          title: 'Доступ запрещён',
          message: 'У вас недостаточно прав для доступа к этой странице'
        });
      }
      next();
    };
  }
};
