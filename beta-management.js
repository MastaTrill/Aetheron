#!/usr/bin/env node

/**
 * Aetheron Beta Testing Management System
 * Manages beta testers, applications, feedback, and program analytics
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.BETA_PORT || 3003;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Beta testing data storage
let betaData = {
  applications: [],
  testers: [],
  feedback: [],
  bugs: [],
  surveys: [],
  analytics: {
    totalApplications: 0,
    activeTesters: 0,
    totalFeedback: 0,
    totalBugs: 0,
    averageRating: 0,
    completionRate: 0,
    weeklyStats: {}
  },
  program: {
    startDate: '2026-01-11',
    currentWeek: 1,
    totalWeeks: 4,
    phases: [
      { week: 1, focus: 'Core Gaming Mechanics', start: '2026-01-11', end: '2026-01-17' },
      { week: 2, focus: 'DeFi Integration', start: '2026-01-18', end: '2026-01-24' },
      { week: 3, focus: 'Advanced Features', start: '2026-01-25', end: '2026-01-31' },
      { week: 4, focus: 'Performance & Security', start: '2026-02-01', end: '2026-02-11' }
    ]
  }
};

// Load existing data
const betaDataFile = path.join(__dirname, 'beta-data.json');
if (fs.existsSync(betaDataFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(betaDataFile, 'utf8'));
    betaData = { ...betaData, ...data };
  } catch (error) {
    console.log('Could not load existing beta data:', error.message);
  }
}

// Routes
app.get('/api/beta/stats', (req, res) => {
  // Calculate current stats
  const now = new Date();
  const weekStart = new Date(betaData.program.startDate);
  const daysSinceStart = Math.floor((now - weekStart) / (1000 * 60 * 60 * 24));
  betaData.program.currentWeek = Math.min(Math.floor(daysSinceStart / 7) + 1, 4);

  betaData.analytics.totalApplications = betaData.applications.length;
  betaData.analytics.activeTesters = betaData.testers.filter(t => t.status === 'active').length;
  betaData.analytics.totalFeedback = betaData.feedback.length;
  betaData.analytics.totalBugs = betaData.bugs.length;

  if (betaData.feedback.length > 0) {
    betaData.analytics.averageRating = betaData.feedback.reduce((sum, f) => sum + f.rating, 0) / betaData.feedback.length;
  }

  res.json({
    success: true,
    stats: betaData.analytics,
    program: betaData.program
  });
});

app.post('/api/beta/apply', (req, res) => {
  const { name, email, discord, experience, motivation, availability } = req.body;

  if (!name || !email || !discord || !experience || !motivation) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  const application = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    name,
    email,
    discord,
    experience,
    motivation,
    availability: availability || 'weekdays',
    status: 'pending',
    appliedWeek: betaData.program.currentWeek
  };

  betaData.applications.push(application);

  // Auto-approve for now (in production, this would be manual)
  if (betaData.testers.length < 200) { // Cap at 200 testers
    const tester = {
      ...application,
      status: 'active',
      joinedDate: new Date().toISOString(),
      points: 0,
      achievements: [],
      feedbackCount: 0,
      bugReports: 0
    };
    betaData.testers.push(tester);
    application.status = 'approved';
  }

  saveBetaData();

  res.json({
    success: true,
    message: application.status === 'approved' ?
      'Application approved! Welcome to the beta program!' :
      'Application submitted. We\'ll review it shortly.',
    id: application.id,
    status: application.status
  });
});

app.post('/api/beta/feedback', (req, res) => {
  const { testerId, rating, category, feedback, issues, suggestions, tvl } = req.body;

  if (!testerId || !rating || !feedback) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  const feedbackItem = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    testerId,
    week: betaData.program.currentWeek,
    rating: parseInt(rating),
    category,
    feedback,
    issues: issues || [],
    suggestions: suggestions || [],
    tvl: tvl || 0
  };

  betaData.feedback.push(feedbackItem);

  // Update tester stats
  const tester = betaData.testers.find(t => t.id == testerId);
  if (tester) {
    tester.feedbackCount++;
    tester.points += 10; // Daily feedback points
    if (rating >= 8) tester.points += 5; // Bonus for high ratings
  }

  // Process bugs
  if (issues && issues.length > 0) {
    issues.forEach(issue => {
      const bug = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        testerId,
        description: issue,
        severity: 'minor', // Default, can be updated
        status: 'open',
        week: betaData.program.currentWeek
      };
      betaData.bugs.push(bug);

      if (tester) {
        tester.bugReports++;
        tester.points += 25; // Bug report points
      }
    });
  }

  saveBetaData();

  res.json({
    success: true,
    message: 'Feedback submitted successfully!',
    id: feedbackItem.id
  });
});

app.get('/api/beta/testers', (req, res) => {
  const testers = betaData.testers.map(t => ({
    id: t.id,
    name: t.name,
    discord: t.discord,
    status: t.status,
    points: t.points,
    feedbackCount: t.feedbackCount,
    bugReports: t.bugReports,
    joinedDate: t.joinedDate
  }));

  res.json({
    success: true,
    testers,
    total: testers.length
  });
});

app.get('/api/beta/leaderboard', (req, res) => {
  const leaderboard = betaData.testers
    .filter(t => t.status === 'active')
    .sort((a, b) => b.points - a.points)
    .slice(0, 20)
    .map((t, index) => ({
      rank: index + 1,
      name: t.name,
      discord: t.discord,
      points: t.points,
      achievements: t.achievements || []
    }));

  res.json({
    success: true,
    leaderboard
  });
});

app.get('/api/beta/export', (req, res) => {
  const exportData = {
    generated: new Date().toISOString(),
    ...betaData
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="aetheron-beta-data.json"');
  res.send(JSON.stringify(exportData, null, 2));
});

// Beta application form
app.get('/beta/apply', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aetheron Beta Application</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f2027, #203a43); color: white; }
        .container { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 10px; }
        .form-group { margin: 15px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select, textarea { width: 100%; padding: 10px; border: 1px solid #00eaff; border-radius: 5px; background: rgba(255,255,255,0.9); color: #333; }
        button { background: #00eaff; color: #0f2027; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0097a7; }
        .success { color: #4CAF50; margin: 10px 0; }
        .error { color: #f44336; margin: 10px 0; }
        .info { background: rgba(0,234,255,0.1); padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Aetheron 2026 Beta Application</h1>

        <div class="info">
            <h3>Program Overview</h3>
            <p><strong>Duration:</strong> January 11 - February 11, 2026 (4 weeks)</p>
            <p><strong>Focus:</strong> DeFi gaming platform with account abstraction</p>
            <p><strong>Perks:</strong> Early access, developer communication, roadmap influence</p>
        </div>

        <form id="applicationForm">
            <div class="form-group">
                <label for="name">Full Name *</label>
                <input type="text" id="name" name="name" required>
            </div>

            <div class="form-group">
                <label for="email">Email Address *</label>
                <input type="email" id="email" name="email" required>
            </div>

            <div class="form-group">
                <label for="discord">Discord Username *</label>
                <input type="text" id="discord" name="discord" placeholder="username#1234" required>
            </div>

            <div class="form-group">
                <label for="experience">DeFi/Crypto Experience *</label>
                <select id="experience" name="experience" required>
                    <option value="">Select your experience level...</option>
                    <option value="beginner">Beginner - New to DeFi</option>
                    <option value="intermediate">Intermediate - Used DeFi protocols</option>
                    <option value="advanced">Advanced - Active DeFi user/trader</option>
                    <option value="expert">Expert - DeFi developer/researcher</option>
                </select>
            </div>

            <div class="form-group">
                <label for="availability">Availability</label>
                <select id="availability" name="availability">
                    <option value="daily">Daily - Can test regularly</option>
                    <option value="weekdays">Weekdays - Available during work week</option>
                    <option value="weekends">Weekends - Available on weekends</option>
                    <option value="limited">Limited - Occasional participation</option>
                </select>
            </div>

            <div class="form-group">
                <label for="motivation">Why do you want to join the beta program? *</label>
                <textarea id="motivation" name="motivation" rows="4" required placeholder="Tell us about your interest in DeFi gaming, what you hope to learn, and how you can contribute to testing..."></textarea>
            </div>

            <button type="submit">Submit Application</button>
        </form>

        <div id="message"></div>
    </div>

    <script>
        document.getElementById('applicationForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                discord: formData.get('discord'),
                experience: formData.get('experience'),
                availability: formData.get('availability'),
                motivation: formData.get('motivation')
            };

            try {
                const response = await fetch('/api/beta/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    document.getElementById('message').innerHTML = '<div class="success">✅ ' + result.message + '</div>';
                    if (result.status === 'approved') {
                        setTimeout(() => {
                            window.location.href = '/beta/dashboard';
                        }, 2000);
                    }
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

// Beta tester dashboard
app.get('/beta/dashboard', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aetheron Beta Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #0f2027; color: white; }
        .container { max-width: 1200px; margin: 0 auto; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; }
        .metric { text-align: center; margin: 10px 0; }
        .value { font-size: 2em; font-weight: bold; color: #00eaff; }
        .label { font-size: 0.9em; opacity: 0.8; }
        button { background: #00eaff; color: #0f2027; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        .phase { background: rgba(0,234,255,0.1); padding: 15px; border-radius: 5px; margin: 10px 0; }
        .current-phase { border: 2px solid #00eaff; }
        .task-list { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 5px; }
        .task { margin: 10px 0; }
        .completed { text-decoration: line-through; opacity: 0.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Aetheron Beta Testing Dashboard</h1>

        <div class="grid">
            <div class="card">
                <h3>Program Progress</h3>
                <div id="programStats"></div>
            </div>

            <div class="card">
                <h3>Your Stats</h3>
                <div id="userStats"></div>
            </div>

            <div class="card">
                <h3>Current Phase</h3>
                <div id="currentPhase"></div>
            </div>

            <div class="card">
                <h3>Quick Actions</h3>
                <button onclick="submitFeedback()">📝 Submit Feedback</button>
                <button onclick="reportBug()">🐛 Report Bug</button>
                <button onclick="viewLeaderboard()">🏆 Leaderboard</button>
            </div>
        </div>

        <div class="card">
            <h3>Weekly Tasks - Week <span id="currentWeek">1</span></h3>
            <div id="weeklyTasks"></div>
        </div>
    </div>

    <script>
        async function loadDashboard() {
            try {
                const [statsResponse, userResponse] = await Promise.all([
                    fetch('/api/beta/stats'),
                    fetch('/api/beta/testers') // In production, get current user
                ]);

                const stats = await statsResponse.json();
                const userData = await userResponse.json();

                displayStats(stats);
                displayUserStats(userData);
                displayCurrentPhase(stats);
                displayWeeklyTasks(stats);
            } catch (error) {
                console.error('Error loading dashboard:', error);
            }
        }

        function displayStats(data) {
            const div = document.getElementById('programStats');
            div.innerHTML = \`
                <div class="metric">
                    <div class="value">\${data.stats.totalApplications}</div>
                    <div class="label">Total Applications</div>
                </div>
                <div class="metric">
                    <div class="value">\${data.stats.activeTesters}</div>
                    <div class="label">Active Testers</div>
                </div>
                <div class="metric">
                    <div class="value">\${data.stats.averageRating.toFixed(1)}</div>
                    <div class="label">Average Rating</div>
                </div>
                <div class="metric">
                    <div class="value">\${data.stats.totalBugs}</div>
                    <div class="label">Bugs Reported</div>
                </div>
            \`;
        }

        function displayUserStats(data) {
            // Mock user stats - in production, get from session/auth
            const mockUser = data.testers[0] || {
                points: 0,
                feedbackCount: 0,
                bugReports: 0
            };

            const div = document.getElementById('userStats');
            div.innerHTML = \`
                <div class="metric">
                    <div class="value">\${mockUser.points}</div>
                    <div class="label">Points Earned</div>
                </div>
                <div class="metric">
                    <div class="value">\${mockUser.feedbackCount}</div>
                    <div class="label">Feedback Submitted</div>
                </div>
                <div class="metric">
                    <div class="value">\${mockUser.bugReports}</div>
                    <div class="label">Bugs Reported</div>
                </div>
            \`;
        }

        function displayCurrentPhase(data) {
            const currentPhase = data.program.phases.find(p => p.week === data.program.currentWeek);
            const div = document.getElementById('currentPhase');

            div.innerHTML = \`
                <div class="phase current-phase">
                    <strong>Week \${currentPhase.week}: \${currentPhase.focus}</strong><br>
                    \${currentPhase.start} - \${currentPhase.end}
                </div>
            \`;
        }

        function displayWeeklyTasks(data) {
            document.getElementById('currentWeek').textContent = data.program.currentWeek;

            const tasks = getWeeklyTasks(data.program.currentWeek);
            const div = document.getElementById('weeklyTasks');

            div.innerHTML = tasks.map(task => \`
                <div class="task-list">
                    <div class="task">
                        <input type="checkbox" id="task\${task.id}">
                        <label for="task\${task.id}">\${task.description}</label>
                    </div>
                </div>
            \`).join('');
        }

        function getWeeklyTasks(week) {
            const taskSets = {
                1: [
                    { id: 1, description: 'Test TVL growth simulation accuracy' },
                    { id: 2, description: 'Try manual and auto mining mechanics' },
                    { id: 3, description: 'Test network switching between chains' },
                    { id: 4, description: 'Experience risk management (liquidation events)' },
                    { id: 5, description: 'Submit daily feedback rating' }
                ],
                2: [
                    { id: 6, description: 'Test multi-chain bridge operations' },
                    { id: 7, description: 'Verify yield farming calculations' },
                    { id: 8, description: 'Try account abstraction (social login)' },
                    { id: 9, description: 'Experience gasless transactions' }
                ],
                3: [
                    { id: 10, description: 'Explore AI analytics dashboard' },
                    { id: 11, description: 'Test NFT marketplace functionality' },
                    { id: 12, description: 'Try DAO governance interface' },
                    { id: 13, description: 'Test institutional features' }
                ],
                4: [
                    { id: 14, description: 'Test platform stability under load' },
                    { id: 15, description: 'Perform security vulnerability testing' },
                    { id: 16, description: 'Check mobile responsiveness' },
                    { id: 17, description: 'Test cross-browser compatibility' }
                ]
            };

            return taskSets[week] || [];
        }

        function submitFeedback() {
            window.open('/feedback', '_blank');
        }

        function reportBug() {
            const bugReport = prompt('Describe the bug you encountered:');
            if (bugReport) {
                // In production, this would submit to API
                alert('Bug report submitted! Thank you for helping improve Aetheron.');
            }
        }

        function viewLeaderboard() {
            window.open('/beta/leaderboard', '_blank');
        }

        loadDashboard();
        setInterval(loadDashboard, 30000); // Refresh every 30 seconds
    </script>
</body>
</html>`;
  res.send(html);
});

// Leaderboard page
app.get('/beta/leaderboard', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beta Tester Leaderboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #0f2027; color: white; }
        .container { max-width: 800px; margin: 0 auto; }
        .leaderboard { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; }
        .entry { display: flex; justify-content: space-between; padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.2); }
        .rank { font-weight: bold; color: #00eaff; min-width: 50px; }
        .name { flex: 1; }
        .points { font-weight: bold; color: #4CAF50; }
        .badge { background: #00eaff; color: #0f2027; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; margin-left: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏆 Aetheron Beta Tester Leaderboard</h1>
        <div class="leaderboard" id="leaderboard"></div>
    </div>

    <script>
        async function loadLeaderboard() {
            try {
                const response = await fetch('/api/beta/leaderboard');
                const data = await response.json();

                if (data.success) {
                    displayLeaderboard(data.leaderboard);
                }
            } catch (error) {
                console.error('Error loading leaderboard:', error);
            }
        }

        function displayLeaderboard(leaderboard) {
            const div = document.getElementById('leaderboard');
            div.innerHTML = leaderboard.map(entry => \`
                <div class="entry">
                    <span class="rank">#\${entry.rank}</span>
                    <span class="name">\${entry.name} <span class="badge">\${entry.discord}</span></span>
                    <span class="points">\${entry.points} pts</span>
                </div>
            \`).join('');
        }

        loadLeaderboard();
        setInterval(loadLeaderboard, 60000); // Refresh every minute
    </script>
</body>
</html>`;
  res.send(html);
});

// Save data function
function saveBetaData() {
  try {
    fs.writeFileSync(betaDataFile, JSON.stringify(betaData, null, 2));
  } catch (error) {
    console.log('Could not save beta data:', error.message);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🧪 Aetheron Beta Testing Management System running on port ${PORT}`);
  console.log(`📝 Beta Applications: http://localhost:${PORT}/beta/apply`);
  console.log(`📊 Beta Dashboard: http://localhost:${PORT}/beta/dashboard`);
  console.log(`🏆 Leaderboard: http://localhost:${PORT}/beta/leaderboard`);
  console.log(`📥 Export Data: http://localhost:${PORT}/api/beta/export`);
});

export default app;
