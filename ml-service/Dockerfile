# ml-service/Dockerfile
FROM python:3.12-slim
WORKDIR /app

# libgomp1: some ML wheels (xgboost, scikit-learn) need OpenMP at import
# time even with prebuilt wheels — a common silent-crash cause on slim
# base images if left out.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# NOTE: requirements.txt currently pins remotezip==2.0.0, which does not
# exist on PyPI at all (confirmed during local setup — latest published
# version is 0.12.6). remotezip is only used by training/ scripts, not by
# the serving app, so it's stripped here rather than failing the whole
# image build. Remove this workaround once the upstream requirements.txt
# is fixed (flag it to your friend).
RUN grep -v '^remotezip' requirements.txt > requirements.docker.txt \
    && pip install --no-cache-dir -r requirements.docker.txt

# Only what's needed to SERVE the API — not catboost_info/ (training logs),
# datasets/ (training data, potentially large), training/ (training
# scripts), or tests/. Keeps the image lean and avoids needing the
# training-only dependencies at all.
COPY app ./app
COPY models ./models

WORKDIR /app/app
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
