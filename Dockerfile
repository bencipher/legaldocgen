# Use Python 3.12 slim image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=docgen.settings

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Change to docgen directory
WORKDIR /app/docgen

# Collect static files
RUN python manage.py collectstatic --noinput --clear

# Expose port
EXPOSE 8000

# Run the application
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "docgen.asgi:application"]