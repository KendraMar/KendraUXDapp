const express = require('express');
const path = require('path');
const fs = require('fs');
const { dataDir, loadAiConfig } = require('../../../server/lib/config');
const { makeAiRequest } = require('../../../server/lib/ai');

const router = express.Router();

// API endpoint for getting feed items
router.get('/', (req, res) => {
  const feedFile = path.join(dataDir, 'feed', 'feed.json');
  
  try {
    if (fs.existsSync(feedFile)) {
      const data = fs.readFileSync(feedFile, 'utf-8');
      res.json(JSON.parse(data));
    } else {
      res.status(404).json({ success: false, error: 'Feed data not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint for updating a feed item (mark as read, etc.)
router.patch('/:id', (req, res) => {
  const feedFile = path.join(dataDir, 'feed', 'feed.json');
  const itemId = req.params.id;
  
  try {
    if (fs.existsSync(feedFile)) {
      const data = JSON.parse(fs.readFileSync(feedFile, 'utf-8'));
      const itemIndex = data.items.findIndex(item => item.id === itemId);
      
      if (itemIndex !== -1) {
        data.items[itemIndex] = { ...data.items[itemIndex], ...req.body };
        fs.writeFileSync(feedFile, JSON.stringify(data, null, 2));
        res.json({ success: true, item: data.items[itemIndex] });
      } else {
        res.status(404).json({ success: false, error: 'Item not found' });
      }
    } else {
      res.status(404).json({ success: false, error: 'Feed data not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint for AI summarization of feed items
router.post('/:id/summarize', async (req, res) => {
  const aiConfig = loadAiConfig();
  
  if (!aiConfig || !aiConfig.apiUrl || !aiConfig.model) {
    return res.status(400).json({ 
      success: false, 
      error: 'AI is not configured. Please edit data/config.json with your AI API settings.'
    });
  }

  const feedFile = path.join(dataDir, 'feed', 'feed.json');
  const itemId = req.params.id;
  
  try {
    if (!fs.existsSync(feedFile)) {
      return res.status(404).json({ success: false, error: 'Feed data not found' });
    }

    const data = JSON.parse(fs.readFileSync(feedFile, 'utf-8'));
    const item = data.items.find(item => item.id === itemId);
    
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // Create a prompt for the AI
    const prompt = `Briefly summarize this message in under 100 words. Focus on key points and action items:\n\nSubject: ${item.subject}\nFrom: ${item.from}\nContent: ${item.content}`;
    
    // Get AI summary
    const summary = await makeAiRequest(aiConfig, prompt);
    
    // Update the item with the AI summary
    const itemIndex = data.items.findIndex(item => item.id === itemId);
    data.items[itemIndex].aiSummary = summary;
    fs.writeFileSync(feedFile, JSON.stringify(data, null, 2));
    
    res.json({ success: true, summary });
  } catch (error) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to generate summary: ${error.message}`
    });
  }
});

// API endpoint for AI "skim" preview of feed items
router.post('/:id/skim', async (req, res) => {
  const aiConfig = loadAiConfig();
  
  if (!aiConfig || !aiConfig.apiUrl || !aiConfig.model) {
    return res.status(400).json({ 
      success: false, 
      error: 'AI is not configured. Please edit data/config.json with your AI API settings.'
    });
  }

  const feedFile = path.join(dataDir, 'feed', 'feed.json');
  const itemId = req.params.id;
  
  try {
    if (!fs.existsSync(feedFile)) {
      return res.status(404).json({ success: false, error: 'Feed data not found' });
    }

    const data = JSON.parse(fs.readFileSync(feedFile, 'utf-8'));
    const item = data.items.find(item => item.id === itemId);
    
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // Create a detailed skim prompt
    const prompt = `Provide a detailed "skim" preview of this message in 150-200 words. Include:
- Main purpose/intent of the message
- Key details, facts, or data points mentioned
- Any action items or requests
- Important deadlines or dates if any
- Who is involved and their roles

Format the response in a clear, scannable way with short paragraphs.

Subject: ${item.subject}
From: ${item.from}
Source: ${item.source}
Urgency: ${item.urgency}
Topic: ${item.topic}
Content: ${item.content}`;
    
    // Get AI skim
    const skim = await makeAiRequest(aiConfig, prompt);
    
    // Update the item with the AI skim
    const itemIndex = data.items.findIndex(item => item.id === itemId);
    data.items[itemIndex].aiSkim = skim;
    fs.writeFileSync(feedFile, JSON.stringify(data, null, 2));
    
    res.json({ success: true, skim });
  } catch (error) {
    console.error('Error generating AI skim:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to generate skim: ${error.message}`
    });
  }
});

module.exports = router;

