#!/usr/bin/env bash

set -e
npx prettier --write .
git add .
git commit -m "updated at $(date '+%Y/%m/%d')"
git push
