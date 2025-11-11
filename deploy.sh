#!/usr/bin/env bash
set -euo pipefail

# This script delegates the build and deploy workflow to Cloud Build, which
# consumes the Dockerfile and cloudbuild-prod.yaml at the repository root.

PROJECT_ID="${PROJECT_ID:-pure-lantern-394915}"
REGION="${REGION:-us-west1}"
SERVICE_NAME="${SERVICE_NAME:-shorts-hub}"
BUILD_CONFIG="${BUILD_CONFIG:-cloudbuild-prod.yaml}"
SOURCE_DIR="${SOURCE_DIR:-.}"

echo "Submitting Cloud Build for service '${SERVICE_NAME}' in project '${PROJECT_ID}'..."
gcloud builds submit "${SOURCE_DIR}" \
  --config="${BUILD_CONFIG}" \
  --project="${PROJECT_ID}"

echo "Cloud Build submitted. This pipeline builds the Docker image and deploys '${SERVICE_NAME}' to Cloud Run in ${REGION}."
