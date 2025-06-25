#!/bin/bash

# Cloudflare Pages deployment script
echo "Deploying to Cloudflare Pages..."

# Check if we're in Cloudflare Pages build environment
if [ -n "$CF_PAGES" ] || [ -n "$CF_PAGES_BRANCH" ]; then
    echo "Cloudflare Pages environment detected"
    echo "Build output is already deployed automatically"
    exit 0
else
    # Local deployment
    npx wrangler pages deploy .svelte-kit/cloudflare --project-name=learn-webgpu
fi