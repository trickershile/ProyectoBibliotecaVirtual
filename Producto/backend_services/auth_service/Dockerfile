FROM python:3.11-slim

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir -r auth_service/requirements.txt \
    && pip install --no-cache-dir --upgrade --no-deps gotrue==2.8.1 httpx==0.27.2

WORKDIR /app/auth_service

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
