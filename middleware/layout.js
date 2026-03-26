const VALID_LAYOUTS = ['layout-1', 'layout-2', 'layout-3', 'layout-4', 'layout-5'];

module.exports = (req, res, next) => {
  // Получаем макет из сессии или дефолтный
  let layout = (req.session && req.session.layout) || 'layout-1';

  // Валидация
  if (!VALID_LAYOUTS.includes(layout)) {
    layout = 'layout-1';
  }

  // Сохраняем в locals для доступа в шаблонах
  res.locals.currentLayout = layout;
  res.locals.user = (req.session && req.session.user) || null;
  res.locals.currentPath = req.path;

  next();
};
