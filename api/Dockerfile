FROM python:3.10-alpine

RUN apk add --no-cache build-base

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# Command to start the application
CMD ["python", "start.py"]
