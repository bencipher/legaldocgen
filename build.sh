#!/bin/bash

# Build script for Render deployment
echo "Starting Django deployment build..."

# Install dependencies
pip install -r requirements.txt

# Change to Django directory
cd docgen

# Collect static files
python manage.py collectstatic --noinput --clear

# Run migrations
python manage.py migrate

echo "Build completed successfully!"