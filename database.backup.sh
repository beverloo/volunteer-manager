#!/bin/bash
# Script that can be invoked using cron, at any interval, to create dumps of the production database
# and upload them to a Google Cloud storage bucket. The host is expected to be signed in using
# the `gsutil` tool.

# Installation instructions:
#
# 1. Install `gsutil` in ~/google-cloud-sdk/bin/
#     a. Make sure that `gcloud` is signed in (https://cloud.google.com/sdk/docs/install)
#     b. Make sure that a storage bucket exists to which the user can write
# 2. Create a `.tmp` directory in ~, only accessible to the current user
# 3. Install a crontab to call this script, which takes one argument:
#     database.backup.sh [destination-bucket]

if (( $# != 1 )); then
    echo "Usage: database.backup.sh [destination-bucket]"
    exit 1
fi

if [[ ! -e ~/google-cloud-sdk/bin/gsutil ]]; then
    echo "The ~/google-cloud-sdk/bin/gsutil binary does not exist"
    exit 1
fi

if [[ ! -e ~/.tmp ]]; then
    echo "The ~/.tmp directory does not exist"
    exit 1
fi

cd "$(dirname "$0")"

if [[ ! -f .env.production ]]; then
    echo ".env.production does not exist."
    exit 1
fi

eval export $(cat .env.production)

# See: https://stackoverflow.com/a/34670902
export MYSQL_PWD="$APP_DATABASE_PASSWORD"

BACKUP_DIRNAME=~/.tmp/gsutil/db/$(date +"%Y")/$(date +"%m")
BACKUP_FILENAME=$APP_DATABASE_NAME-$(date +"%Y-%m-%d").sql.gz
BACKUP_FILE=$BACKUP_DIRNAME/$BACKUP_FILENAME

mkdir -p $BACKUP_DIRNAME

mysqldump -h "$APP_DATABASE_SERVER" \
          -u "$APP_DATABASE_USERNAME" \
          "$APP_DATABASE_NAME" | gzip -9 -c > $BACKUP_FILE

gsutil mv ~/.tmp/gsutil/* $1
