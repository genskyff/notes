#!/usr/bin/env bash

set -e
pnpm run lint
git add .
git commit -m "updated at $(date '+%Y/%m/%d')"
git push
