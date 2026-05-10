#!/usr/bin/env bash
# Render build script — runs inside the backend/ directory
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
