from django.apps import AppConfig


class AppTexnikumConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app_texnikum'
    verbose_name = 'Texnikum Boshqaruvi'

    def ready(self):
        import app_texnikum.signals  # signallarni ulash