FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc default-libmysqlclient-dev pkg-config curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for JavaScript code execution
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 5000

# Production entrypoint
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "--timeout", "30", "wsgi:app"]
