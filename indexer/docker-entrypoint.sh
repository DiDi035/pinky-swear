#!/bin/sh
set -e
npx prisma migrate deploy
exec npx tsx src/index.ts
