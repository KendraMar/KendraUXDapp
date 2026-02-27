# Quick Start: Jira Integration

## Step 1: Configure Your Jira Credentials

Edit the `config.json` file and add your credentials:

```json
{
  "jira": {
    "url": "https://issues.redhat.com",
    "token": "PASTE_YOUR_TOKEN_HERE",
    "username": "your.email@redhat.com"
  }
}
```

## Step 2: Get Your Personal Access Token

1. Visit: https://issues.redhat.com
2. Click your profile icon → **Personal Settings**
3. Go to **Security** → **API Tokens** or **Personal Access Tokens**
4. Click **Create token**
5. Copy the token and paste it into `config.json`

## Step 3: Restart the Server

```bash
# Stop the current server (Ctrl+C if running)
npm run dev
```

## Step 4: Open the Tasks Page

Navigate to: http://localhost:1225/tasks

You should now see all your assigned Jira issues!

---

## Need Help?

See the full documentation in `JIRA-SETUP.md`

## Troubleshooting

**Can't see any issues?**
- Make sure you have issues assigned to you in Jira
- Check that your token and username are correct
- Verify you can access https://issues.redhat.com from your browser

**Configuration error?**
- Make sure all three fields in `config.json` are filled in
- Check for typos in the URL
- Ensure the token doesn't have extra spaces

**Server not starting?**
- The config file syntax might be invalid
- Make sure it's valid JSON (no trailing commas)


