#!/bin/bash
set -e

echo "🔧 Regenerando Prisma Client..."
npx prisma generate

echo "✓ Prisma Client regenerado com sucesso"
