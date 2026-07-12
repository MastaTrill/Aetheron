#!/bin/bash

# Aetheron Beta & Feedback Server Deployment Script
# Deploy to Railway, Render, or similar platform

echo "🚀 Deploying Aetheron Beta & Feedback Servers"

# Install dependencies
npm install

# Set environment variables (update these for your deployment)
export BETA_PORT=3003
export FEEDBACK_PORT=3001
export NODE_ENV=production

# Start beta management server
echo "🧪 Starting Beta Management Server on port $BETA_PORT"
node beta-management.js &
BETA_PID=$!

# Start feedback server
echo "📝 Starting Feedback Server on port $FEEDBACK_PORT"
node feedback-server.js &
FEEDBACK_PID=$!

echo "✅ Servers deployed!"
echo "📊 Beta Dashboard: http://localhost:$BETA_PORT/beta/dashboard"
echo "📝 Feedback Form: http://localhost:$FEEDBACK_PORT/feedback"
echo "📥 Beta Applications: http://localhost:$BETA_PORT/beta/apply"

# Keep running
wait</content>
<parameter name="filePath">c:\Users\willi\.vscode\Aetheron\Aetheron\deploy-beta-servers.sh