#!/bin/bash

# ==========================================
# Xserver Deployment Script
# ==========================================

# Settings - PLEASE EDIT THESE
HOST="svXXXX.xserver.jp"        # xserver host name
USER="server_id"                # xserver server ID
REMOTE_PATH="/home/server_id/domain.com/public_html/"  # Remote path

# Safety flag: --dry-run shows what would happen without doing it.
# Remove "--dry-run" when you are ready to deploy.
RSYNC_OPTS="-avz --dry-run"
# RSYNC_OPTS="-avz" # Uncomment this line to actually deploy

echo "Starting deployment to $HOST..."

rsync $RSYNC_OPTS \
  --exclude '.DS_Store' \
  --exclude '.git/' \
  --exclude '.gitignore' \
  --exclude 'deploy.sh' \
  --exclude 'data/oauth.sample.php' \
  --exclude 'data/oauth.php' \
  --exclude 'uploads/' \
  ./ "$USER@$HOST:$REMOTE_PATH"

echo "Deployment finished."
