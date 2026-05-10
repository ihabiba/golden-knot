#!/usr/bin/env bash
# Render build script — runs inside the backend/ directory
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
# Ensure the required django.contrib.sites row exists (id=1)
python manage.py shell -c "
from django.contrib.sites.models import Site
Site.objects.update_or_create(id=1, defaults={'domain': 'golden-knot-api.onrender.com', 'name': 'Golden Knot'})
"
