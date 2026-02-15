#!/usr/bin/env node

/**
 * Aetheron Launch Announcement Script
 * Automated posting of launch announcements across platforms
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🚀 Aetheron Launch Announcement System');
console.log('======================================\n');

// Load prepared content
const loadContent = (filename) => {
  try {
    return readFileSync(join(__dirname, 'social-content', filename), 'utf8');
  } catch (error) {
    return `Content file ${filename} not found.`;
  }
};

const announcements = {
  twitter: {
    platform: 'Twitter/X',
    content: loadContent('twitter-launch-thread.txt'),
    instructions: [
      '1. Go to https://twitter.com/compose/tweet',
      '2. Copy and paste the thread content',
      '3. Add relevant hashtags and mentions',
      '4. Include screenshots of the website',
      '5. Schedule for optimal posting time',
      '6. Engage with replies and retweets'
    ]
  },
  discord: {
    platform: 'Discord',
    content: loadContent('discord-welcome.txt'),
    instructions: [
      '1. Go to your Discord server settings',
      '2. Navigate to Server Settings > Integrations > Webhooks',
      '3. Create a webhook for announcements',
      '4. Use webhook URL to post welcome message',
      '5. Pin the announcement in #announcements',
      '6. Set up automated posting for future updates'
    ]
  },
  reddit: {
    platform: 'Reddit',
    content: loadContent('reddit-launch-post.md'),
    instructions: [
      '1. Go to r/defi, r/CryptoCurrency, r/Web3',
      '2. Create new post with the prepared content',
      '3. Add relevant flair (Launch, Discussion, etc.)',
      '4. Include website link and screenshots',
      '5. Engage with comments and follow-ups',
      '6. Consider crossposting to related subreddits'
    ]
  },
  telegram: {
    platform: 'Telegram',
    content: loadContent('telegram-description.txt'),
    instructions: [
      '1. Open your Telegram channel',
      '2. Post the announcement message',
      '3. Pin the message to channel',
      '4. Add channel link to website and docs',
      '5. Set up channel photo and description',
      '6. Enable notifications for followers'
    ]
  }
};

// Display announcement content and instructions
Object.entries(announcements).forEach(([key, platform]) => {
  console.log(`📢 ${platform.platform} Launch Announcement:`);
  console.log('-'.repeat(50));
  console.log('Content Preview:');
  console.log(platform.content.substring(0, 200) + '...\n');

  console.log('Posting Instructions:');
  platform.instructions.forEach(instruction => {
    console.log(`   ${instruction}`);
  });
  console.log('');
});

console.log('🎯 Launch Sequence:');
console.log('1. ✅ Website live at https://aetheron.online');
console.log('2. ⏳ Create social media accounts (Twitter, Discord, Telegram)');
console.log('3. 📝 Post launch announcements on all platforms');
console.log('4. 🔗 Update all social links in documentation');
console.log('5. 📊 Monitor engagement and responses');
console.log('6. 📅 Set up content calendar for ongoing posts');
console.log('');

console.log('🚀 Ready for Launch!');
console.log('All content is prepared and ready to post.');
console.log('Follow the instructions above to execute the launch sequence.');

export { announcements };