from django.apps import AppConfig


class AppTalabaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app_talaba'
    verbose_name = 'Talabalar Boshqaruvi'

    def ready(self):
        import app_talaba.signals  # signallarni ulash