// Переключение макетов
document.addEventListener('DOMContentLoaded', function() {
  const layoutSelects = document.querySelectorAll('[data-layout-select]');

  layoutSelects.forEach(select => {
    select.addEventListener('change', async function(e) {
      const layout = e.target.value;

      try {
        const response = await fetch('/user/layout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ layout })
        });

        const data = await response.json();

        if (data.success) {
          // Сохраняем макет в localStorage для быстрого доступа
          localStorage.setItem('userLayout', layout);

          // Перезагрузка с новым макетом
          window.location.reload();
        } else {
          console.error('Ошибка сохранения макета:', data.error);
          alert('Не удалось сохранить макет. Попробуйте ещё раз.');
        }
      } catch (error) {
        console.error('Ошибка при переключении макета:', error);
        alert('Ошибка соединения. Попробуйте ещё раз.');
      }
    });
  });

  // Восстанавливаем макет из localStorage при загрузке
  const savedLayout = localStorage.getItem('userLayout');
  if (savedLayout && window.currentLayout !== savedLayout) {
    // Обновляем все селекторы
    layoutSelects.forEach(select => {
      select.value = savedLayout;
    });
  }
});
