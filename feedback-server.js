#!/usr/bin/env node

/**
 * Aetheron User Feedback Collection System
 * Collects and analyzes user feedback from beta testing
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.FEEDBACK_PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory storage (in production, use database)
let feedback = [];
let feedbackStats = {
  total: 0,
  ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  categories: {},
  platforms: {},
  issues: [],
  suggestions: []
};

// Load existing feedback
const feedbackFile = path.join(__dirname, 'feedback-data.json');
if (fs.existsSync(feedbackFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(feedbackFile, 'utf8'));
    feedback = data.feedback || [];
    feedbackStats = data.stats || feedbackStats;
  } catch (error) {
    console.log('Could not load existing feedback:', error.message);
  }
}

// Routes
app.get('/api/feedback/stats', (req, res) => {
  res.json({
    success: true,
    stats: feedbackStats,
    recent: feedback.slice(-10).reverse() // Last 10 feedback items
  });
});

app.post('/api/feedback/submit', (req, res) => {
  const { name, email, rating, category, platform, feedback: userFeedback, issues, suggestions } = req.body;

  if (!rating || !category || !userFeedback) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: rating, category, feedback'
    });
  }

  const feedbackItem = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    name: name || 'Anonymous',
    email: email || '',
    rating: parseInt(rating),
    category,
    platform: platform || 'web',
    feedback: userFeedback,
    issues: issues || [],
    suggestions: suggestions || []
  };

  // Update stats
  feedbackStats.total++;
  feedbackStats.ratings[rating] = (feedbackStats.ratings[rating] || 0) + 1;
  feedbackStats.categories[category] = (feedbackStats.categories[category] || 0) + 1;
  feedbackStats.platforms[platform] = (feedbackStats.platforms[platform] || 0) + 1;

  if (issues && issues.length > 0) {
    feedbackStats.issues.push(...issues);
  }

  if (suggestions && suggestions.length > 0) {
    feedbackStats.suggestions.push(...suggestions);
  }

  feedback.push(feedbackItem);

  // Save to file
  try {
    fs.writeFileSync(feedbackFile, JSON.stringify({
      feedback,
      stats: feedbackStats
    }, null, 2));
  } catch (error) {
    console.log('Could not save feedback:', error.message);
  }

  console.log(`📝 New feedback received from ${feedbackItem.name}: ${rating}/5 stars`);

  res.json({
    success: true,
    message: 'Thank you for your feedback!',
    id: feedbackItem.id
  });
});

app.get('/api/feedback/export', (req, res) => {
  const exportData = {
    generated: new Date().toISOString(),
    stats: feedbackStats,
    feedback: feedback
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="aetheron-feedback-export.json"');
  res.send(JSON.stringify(exportData, null, 2));
});

// HTML form
app.get('/feedback', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aetheron Beta Feedback</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f2027, #203a43); color: white; }
        .container { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 10px; margin: 20px 0; }
        .form-group { margin: 15px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select, textarea { width: 100%; padding: 10px; border: 1px solid #00eaff; border-radius: 5px; background: rgba(255,255,255,0.9); color: #333; }
        .rating { display: flex; gap: 10px; }
        .rating input { width: auto; }
        button { background: #00eaff; color: #0f2027; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0097a7; }
        .success { color: #4CAF50; margin: 10px 0; }
        .error { color: #f44336; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Aetheron 2026 Beta Feedback</h1>
        <p>Help us improve! Share your experience with our DeFi gaming platform.</p>

        <form id="feedbackForm">
            <div class="form-group">
                <label for="name">Name (optional):</label>
                <input type="text" id="name" name="name">
            </div>

            <div class="form-group">
                <label for="email">Email (optional):</label>
                <input type="email" id="email" name="email">
            </div>

            <div class="form-group">
                <label>Rating:</label>
                <div class="rating">
                    <label><input type="radio" name="rating" value="1"> 1 ⭐</label>
                    <label><input type="radio" name="rating" value="2"> 2 ⭐</label>
                    <label><input type="radio" name="rating" value="value="3"> 3 ⭐</label>
                    <label><input type="radio" name="rating" value="4"> 4 ⭐</label>
                    <label><input type="radio" name="rating" value="5"> 5 ⭐</label>
                </div>
            </div>

            <div class="form-group">
                <label for="category">Category:</label>
                <select id="category" name="category" required>
                    <option value="">Select category...</option>
                    <option value="gaming">Gaming Mechanics</option>
                    <option value="defi">DeFi Features</option>
                    <option value="ui">User Interface</option>
                    <option value="performance">Performance</option>
                    <option value="security">Security</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div class="form-group">
                <label for="platform">Platform:</label>
                <select id="platform" name="platform">
                    <option value="web">Web Browser</option>
                    <option value="mobile">Mobile</option>
                    <option value="desktop">Desktop App</option>
                </select>
            </div>

            <div class="form-group">
                <label for="feedback">Your Feedback:</label>
                <textarea id="feedback" name="feedback" rows="5" required placeholder="What did you like? What could be improved? Any bugs encountered?"></textarea>
            </div>

            <div class="form-group">
                <label for="issues">Specific Issues (optional, one per line):</label>
                <textarea id="issues" name="issues" rows="3" placeholder="Bug reports, error messages, etc."></textarea>
            </div>

            <div class="form-group">
                <label for="suggestions">Suggestions (optional, one per line):</label>
                <textarea id="suggestions" name="suggestions" rows="3" placeholder="Feature requests, improvements, etc."></textarea>
            </div>

            <button type="submit">Submit Feedback</button>
        </form>

        <div id="message"></div>
    </div>

    <script>
        document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                rating: formData.get('rating'),
                category: formData.get('category'),
                platform: formData.get('platform'),
                feedback: formData.get('feedback'),
                issues: formData.get('issues').split('\\n').filter(i => i.trim()),
                suggestions: formData.get('suggestions').split('\\n').filter(s => s.trim())
            };

            try {
                const response = await fetch('/api/feedback/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    document.getElementById('message').innerHTML = '<div class="success">✅ Thank you for your feedback!</div>';
                    e.target.reset();
                } else {
                    document.getElementById('message').innerHTML = '<div class="error">❌ Error: ' + result.error + '</div>';
                }
            } catch (error) {
                document.getElementById('message').innerHTML = '<div class="error">❌ Network error. Please try again.</div>';
            }
        });
    </script>
</body>
</html>`;
  res.send(html);
});

// Admin dashboard
app.get('/admin/feedback', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aetheron Feedback Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #0f2027; color: white; }
        .container { max-width: 1200px; margin: 0 auto; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #00eaff; }
        .feedback-list { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
        .feedback-item { border-bottom: 1px solid rgba(255,255,255,0.2); padding: 15px 0; }
        .rating { color: #ffd700; }
        button { background: #00eaff; color: #0f2027; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Aetheron Beta Feedback Dashboard</h1>

        <div class="stats" id="stats"></div>

        <div style="margin: 20px 0;">
            <button onclick="exportFeedback()">📥 Export All Feedback</button>
            <button onclick="refreshStats()">🔄 Refresh</button>
        </div>

        <div class="feedback-list">
            <h2>Recent Feedback</h2>
            <div id="feedbackList"></div>
        </div>
    </div>

    <script>
        async function loadStats() {
            try {
                const response = await fetch('/api/feedback/stats');
                const data = await response.json();

                if (data.success) {
                    displayStats(data.stats);
                    displayFeedback(data.recent);
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        function displayStats(stats) {
            const statsDiv = document.getElementById('stats');
            const avgRating = Object.entries(stats.ratings).reduce((sum, [rating, count]) => sum + (rating * count), 0) / stats.total || 0;

            statsDiv.innerHTML = \`
                <div class="stat-card">
                    <div class="stat-number">\${stats.total}</div>
                    <div>Total Feedback</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${avgRating.toFixed(1)}</div>
                    <div>Average Rating</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${Object.keys(stats.categories).length}</div>
                    <div>Categories</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${stats.issues.length}</div>
                    <div>Issues Reported</div>
                </div>
            \`;
        }

        function displayFeedback(feedback) {
            const listDiv = document.getElementById('feedbackList');
            listDiv.innerHTML = feedback.map(item => \`
                <div class="feedback-item">
                    <strong>\${item.name}</strong> - \${'⭐'.repeat(item.rating)} (\${item.category})
                    <br><small>\${new Date(item.timestamp).toLocaleString()}</small>
                    <p>\${item.feedback}</p>
                    \${item.issues.length ? '<p><strong>Issues:</strong> ' + item.issues.join(', ') + '</p>' : ''}
                    \${item.suggestions.length ? '<p><strong>Suggestions:</strong> ' + item.suggestions.join(', ') + '</p>' : ''}
                </div>
            \`).join('');
        }

        function exportFeedback() {
            window.open('/api/feedback/export', '_blank');
        }

        function refreshStats() {
            loadStats();
        }

        loadStats();
        setInterval(loadStats, 30000); // Refresh every 30 seconds
    </script>
</body>
</html>`;
  res.send(html);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Aetheron Feedback Server running on port ${PORT}`);
  console.log(`📝 Submit feedback at: http://localhost:${PORT}/feedback`);
  console.log(`📊 View dashboard at: http://localhost:${PORT}/admin/feedback`);
  console.log(`📥 Export data at: http://localhost:${PORT}/api/feedback/export`);
});

export default app;
