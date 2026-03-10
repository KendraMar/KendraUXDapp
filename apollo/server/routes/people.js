const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { dataDir } = require('../lib/config');

const router = express.Router();

const peopleDir = path.join(dataDir, 'people');

// Ensure people directory exists
if (!fs.existsSync(peopleDir)) {
  fs.mkdirSync(peopleDir, { recursive: true });
}

// ─── Avatar upload config ────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

const avatarStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const username = !req.params.username || req.params.username === 'me' ? '_me' : req.params.username;
    const dir = path.join(peopleDir, username);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `avatar${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_AVATAR_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
    }
  }
});

/**
 * Find the avatar file for a person (could be .jpg, .png, .gif, .webp).
 * Returns the full path or null if not found.
 */
function findAvatarFile(username) {
  const dir = path.join(peopleDir, username);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const avatar = files.find(f => /^avatar\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  return avatar ? path.join(dir, avatar) : null;
}

/**
 * Remove any existing avatar files for a person (before uploading a new one).
 */
function removeExistingAvatars(username) {
  const dir = path.join(peopleDir, username);
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (/^avatar\.(jpg|jpeg|png|gif|webp)$/i.test(f)) {
      fs.unlinkSync(path.join(dir, f));
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generate a URL-safe username slug from a name.
 * e.g. "Andy Smith" -> "andy-smith", handles collisions with suffixes.
 */
function generateUsername(firstName, lastName, existingUsernames = []) {
  const base = [firstName, lastName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!base) return `person-${Date.now()}`;

  let slug = base;
  let counter = 1;
  while (existingUsernames.includes(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}

/**
 * Read a person from their folder. Returns null if not found.
 * Auto-resolves avatar URL from disk if the field is empty but a file exists.
 */
function readPerson(username) {
  const personFile = path.join(peopleDir, username, 'person.json');
  if (!fs.existsSync(personFile)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(personFile, 'utf-8'));
    // Auto-resolve avatar from disk if field is empty but file exists
    if (!data.avatar) {
      const avatarFile = findAvatarFile(username);
      if (avatarFile) {
        const urlUsername = username === '_me' ? 'me' : username;
        data.avatar = `/api/people/${urlUsername}/avatar?t=${Date.now()}`;
      }
    }
    return { ...data, username };
  } catch {
    return null;
  }
}

/**
 * Write a person to their folder.
 */
function writePerson(username, data) {
  const dir = path.join(peopleDir, username);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Don't persist the username field inside the JSON (it's the folder name)
  const { username: _u, ...rest } = data;
  fs.writeFileSync(path.join(dir, 'person.json'), JSON.stringify(rest, null, 2));
}

/**
 * Read private notes for a person. Returns { entries: [] } if not found.
 */
function readNotes(username) {
  const notesFile = path.join(peopleDir, username, 'notes.json');
  if (!fs.existsSync(notesFile)) return { entries: [] };
  try {
    return JSON.parse(fs.readFileSync(notesFile, 'utf-8'));
  } catch {
    return { entries: [] };
  }
}

/**
 * Write private notes for a person.
 */
function writeNotes(username, notes) {
  const dir = path.join(peopleDir, username);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'notes.json'), JSON.stringify(notes, null, 2));
}

/**
 * Read sharing settings for _me. Returns default if not found.
 */
function readSharing() {
  const sharingFile = path.join(peopleDir, '_me', 'sharing.json');
  if (!fs.existsSync(sharingFile)) {
    return {
      fields: {
        email: 'public',
        phone: 'private',
        location: 'public',
        timezone: 'public',
        bio: 'public',
        skills: 'public',
        interests: 'public',
        projects: 'public',
        integrations: 'private'
      }
    };
  }
  try {
    return JSON.parse(fs.readFileSync(sharingFile, 'utf-8'));
  } catch {
    return { fields: {} };
  }
}

/**
 * Write sharing settings for _me.
 */
function writeSharing(sharing) {
  const dir = path.join(peopleDir, '_me');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'sharing.json'), JSON.stringify(sharing, null, 2));
}

/**
 * List all person usernames (folder names), excluding _me.
 */
function listUsernames() {
  if (!fs.existsSync(peopleDir)) return [];
  return fs.readdirSync(peopleDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name !== '_me')
    .map(e => e.name);
}

/**
 * Build a default empty person object.
 */
function defaultPerson() {
  return {
    name: { first: '', last: '', middle: '' },
    nickname: '',
    role: '',
    company: '',
    location: '',
    timezone: '',
    email: '',
    phone: '',
    bio: '',
    avatar: '',
    skills: [],
    interests: [],
    projects: [],
    integrations: {
      slack: '',
      gitlab: '',
      jira: '',
      github: ''
    },
    tags: [],
    favorite: false,
    lastContact: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// ─── Auto-Migration from data/people/people.json ────────────────────────────

function migrateFromPeopleJson() {
  const peopleFile = path.join(peopleDir, 'people.json');
  if (!fs.existsSync(peopleFile)) return;

  // Only migrate if people dir has no person subfolders yet
  const existing = listUsernames();
  if (existing.length > 0) return;

  try {
    const data = JSON.parse(fs.readFileSync(peopleFile, 'utf-8'));
    const people = data.people || [];
    if (people.length === 0) return;

    console.log(`📇 Migrating ${people.length} people from people.json to per-folder format...`);

    const usedUsernames = [];
    for (const person of people) {
      // Parse the old single "name" field into first/last
      const nameParts = (person.name || '').trim().split(/\s+/);
      const first = nameParts[0] || '';
      const last = nameParts.slice(1).join(' ') || '';

      const username = generateUsername(first, last, usedUsernames);
      usedUsernames.push(username);

      const personData = {
        ...defaultPerson(),
        name: { first, last, middle: '' },
        role: person.role || '',
        company: person.company || '',
        email: person.email || '',
        phone: person.phone || '',
        bio: person.relationship || '',
        avatar: person.avatar || '',
        tags: person.tags || [],
        favorite: person.favorite || false,
        lastContact: person.lastContact || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      writePerson(username, personData);

      // Migrate notes if present
      if (person.notes) {
        writeNotes(username, {
          entries: [{
            id: Date.now().toString(),
            date: new Date().toISOString(),
            content: person.notes
          }]
        });
      }
    }

    console.log(`📇 Migration complete. ${people.length} people created in data/people/`);
  } catch (error) {
    console.error('Error migrating from people.json:', error);
  }
}

// Run migration on module load
migrateFromPeopleJson();

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET /api/people - List all people
router.get('/', (req, res) => {
  try {
    const usernames = listUsernames();
    const people = usernames
      .map(u => readPerson(u))
      .filter(Boolean);

    res.json({ success: true, people });
  } catch (error) {
    console.error('Error listing people:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/people/search?q=... - Search people
router.get('/search', (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase().trim();
    if (!query) {
      return res.json({ success: true, people: [] });
    }

    const usernames = listUsernames();
    const people = usernames
      .map(u => readPerson(u))
      .filter(Boolean)
      .filter(p => {
        const fullName = `${p.name?.first || ''} ${p.name?.middle || ''} ${p.name?.last || ''}`.toLowerCase();
        const nickname = (p.nickname || '').toLowerCase();
        const role = (p.role || '').toLowerCase();
        const company = (p.company || '').toLowerCase();
        const email = (p.email || '').toLowerCase();
        const skills = (p.skills || []).join(' ').toLowerCase();
        const tags = (p.tags || []).join(' ').toLowerCase();
        const bio = (p.bio || '').toLowerCase();

        return fullName.includes(query)
          || nickname.includes(query)
          || role.includes(query)
          || company.includes(query)
          || email.includes(query)
          || skills.includes(query)
          || tags.includes(query)
          || bio.includes(query);
      });

    res.json({ success: true, people });
  } catch (error) {
    console.error('Error searching people:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/people/me - Get my card
router.get('/me', (req, res) => {
  try {
    const person = readPerson('_me');
    const sharing = readSharing();

    if (!person) {
      return res.json({
        success: true,
        person: { ...defaultPerson(), username: '_me' },
        sharing,
        isNew: true
      });
    }

    res.json({ success: true, person, sharing });
  } catch (error) {
    console.error('Error reading my card:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/people/me - Update my card
router.put('/me', (req, res) => {
  try {
    const existing = readPerson('_me') || defaultPerson();
    const updated = {
      ...existing,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    const meDir = path.join(peopleDir, '_me');
    if (!fs.existsSync(meDir)) {
      fs.mkdirSync(meDir, { recursive: true });
    }

    writePerson('_me', updated);
    res.json({ success: true, person: { ...updated, username: '_me' } });
  } catch (error) {
    console.error('Error updating my card:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/people/me/sharing - Get sharing settings
router.get('/me/sharing', (req, res) => {
  try {
    const sharing = readSharing();
    res.json({ success: true, sharing });
  } catch (error) {
    console.error('Error reading sharing settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/people/me/sharing - Update sharing settings
router.put('/me/sharing', (req, res) => {
  try {
    const sharing = req.body;
    writeSharing(sharing);
    res.json({ success: true, sharing });
  } catch (error) {
    console.error('Error updating sharing settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/people/me/avatar - Upload avatar for my card
router.post('/me/avatar', (req, res) => {
  removeExistingAvatars('_me');
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Update person.json avatar field to point to the served URL
    const avatarUrl = `/api/people/me/avatar?t=${Date.now()}`;
    const existing = readPerson('_me') || defaultPerson();
    existing.avatar = avatarUrl;
    existing.updatedAt = new Date().toISOString();
    writePerson('_me', existing);

    res.json({ success: true, avatarUrl });
  });
});

// GET /api/people/me/avatar - Serve avatar for my card
router.get('/me/avatar', (req, res) => {
  const avatarPath = findAvatarFile('_me');
  if (!avatarPath) {
    return res.status(404).json({ success: false, error: 'No avatar found' });
  }
  res.sendFile(avatarPath);
});

// DELETE /api/people/me/avatar - Remove avatar for my card
router.delete('/me/avatar', (req, res) => {
  try {
    removeExistingAvatars('_me');
    const existing = readPerson('_me') || defaultPerson();
    existing.avatar = '';
    existing.updatedAt = new Date().toISOString();
    writePerson('_me', existing);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/people/:username/avatar - Upload avatar for a person
router.post('/:username/avatar', (req, res) => {
  const { username } = req.params;
  if (username === '_me') {
    return res.status(400).json({ success: false, error: 'Use POST /api/people/me/avatar' });
  }

  const personDir = path.join(peopleDir, username);
  if (!fs.existsSync(personDir)) {
    return res.status(404).json({ success: false, error: 'Person not found' });
  }

  removeExistingAvatars(username);
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const avatarUrl = `/api/people/${username}/avatar?t=${Date.now()}`;
    const existing = readPerson(username);
    if (existing) {
      existing.avatar = avatarUrl;
      existing.updatedAt = new Date().toISOString();
      writePerson(username, existing);
    }

    res.json({ success: true, avatarUrl });
  });
});

// GET /api/people/:username/avatar - Serve avatar for a person
router.get('/:username/avatar', (req, res) => {
  const { username } = req.params;
  const resolvedUsername = username === 'me' ? '_me' : username;
  const avatarPath = findAvatarFile(resolvedUsername);
  if (!avatarPath) {
    return res.status(404).json({ success: false, error: 'No avatar found' });
  }
  res.sendFile(avatarPath);
});

// DELETE /api/people/:username/avatar - Remove avatar for a person
router.delete('/:username/avatar', (req, res) => {
  try {
    const { username } = req.params;
    removeExistingAvatars(username);
    const existing = readPerson(username);
    if (existing) {
      existing.avatar = '';
      existing.updatedAt = new Date().toISOString();
      writePerson(username, existing);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/people/:username - Get a single person
router.get('/:username', (req, res) => {
  try {
    const { username } = req.params;
    const person = readPerson(username);

    if (!person) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }

    const notes = readNotes(username);
    res.json({ success: true, person, notes });
  } catch (error) {
    console.error('Error reading person:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/people - Create a new person
router.post('/', (req, res) => {
  try {
    const body = req.body;
    const existingUsernames = listUsernames();

    const firstName = body.name?.first || '';
    const lastName = body.name?.last || '';
    const username = generateUsername(firstName, lastName, existingUsernames);

    const person = {
      ...defaultPerson(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    writePerson(username, person);
    res.json({ success: true, person: { ...person, username } });
  } catch (error) {
    console.error('Error creating person:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/people/:username - Update a person
router.put('/:username', (req, res) => {
  try {
    const { username } = req.params;

    if (username === '_me' || username === 'me') {
      return res.status(400).json({ success: false, error: 'Use PUT /api/people/me for your own card' });
    }

    const existing = readPerson(username);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }

    const updated = {
      ...existing,
      ...req.body,
      username: undefined,
      updatedAt: new Date().toISOString()
    };

    writePerson(username, updated);
    res.json({ success: true, person: { ...updated, username } });
  } catch (error) {
    console.error('Error updating person:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/people/:username - Delete a person
router.delete('/:username', (req, res) => {
  try {
    const { username } = req.params;

    if (username === '_me') {
      return res.status(400).json({ success: false, error: 'Cannot delete your own card' });
    }

    const personDir = path.join(peopleDir, username);
    if (!fs.existsSync(personDir)) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }

    fs.rmSync(personDir, { recursive: true, force: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/people/:username/notes - Get private notes
router.get('/:username/notes', (req, res) => {
  try {
    const { username } = req.params;
    const personDir = path.join(peopleDir, username);
    if (!fs.existsSync(personDir)) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }

    const notes = readNotes(username);
    res.json({ success: true, notes });
  } catch (error) {
    console.error('Error reading notes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/people/:username/notes - Update private notes
router.put('/:username/notes', (req, res) => {
  try {
    const { username } = req.params;
    const personDir = path.join(peopleDir, username);
    if (!fs.existsSync(personDir)) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }

    const notes = req.body;
    writeNotes(username, notes);
    res.json({ success: true, notes });
  } catch (error) {
    console.error('Error updating notes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
