from django.urls import re_path
from channels.routing import URLRouter
from channels.auth import AuthMiddlewareStack

from django.urls import path

from . import consumers

websocket_urlpatterns = [
    re_path("ws/assistant/", consumers.DocumentAgentConsumer.as_asgi()),  # type: ignore[arg-type]
    re_path("ws/document-agent/", consumers.DocumentAgentConsumer.as_asgi()),  # type: ignore[arg-type] (legacy)
]
