"""Middleware для отключения кэширования в режиме разработки."""


class DisableCacheMiddleware:
    """
    Добавляет заголовки для отключения кэширования браузером.
    Используется только в режиме разработки (DEBUG=True).
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Добавляем заголовки для отключения кэширования
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'

        return response
