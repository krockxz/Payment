const express = require('express');
const router = express.Router();
const { db } = require('../database');

// In-memory storage for user settings (in production, this would be a database)
let userSettings = {
  email: '',
  name: '',
  phone: '',
  companyName: '',
  defaultCurrency: 'INR',
  emailNotifications: true,
  smsNotifications: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// GET /api/user/settings - Get user settings
router.get('/', (req, res) => {
  try {
    res.json({
      data: userSettings,
      error: null
    });
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({
      data: null,
      error: {
        message: 'Failed to retrieve user settings',
        code: 'GET_SETTINGS_ERROR'
      }
    });
  }
});

// PUT /api/user/settings - Update user settings
router.put('/', (req, res) => {
  try {
    const updates = req.body;

    // Validate required fields
    if (updates.email && !updates.email.trim()) {
      return res.status(400).json({
        data: null,
        error: {
          message: 'Email is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    // Validate email format if provided
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return res.status(400).json({
          data: null,
          error: {
            message: 'Invalid email format',
            code: 'VALIDATION_ERROR'
          }
        });
      }
    }

    // Update settings
    userSettings = {
      ...userSettings,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Save to database (optional - for persistence)
    try {
      // Store settings in the database as well
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO user_settings (
          email, name, phone, company_name, default_currency,
          email_notifications, sms_notifications, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        userSettings.email,
        userSettings.name,
        userSettings.phone,
        userSettings.companyName,
        userSettings.defaultCurrency,
        userSettings.emailNotifications ? 1 : 0,
        userSettings.smsNotifications ? 1 : 0,
        userSettings.createdAt,
        userSettings.updatedAt
      );
      stmt.finalize();

      console.log('✅ User settings saved to database');
    } catch (dbError) {
      console.warn('⚠️ Failed to save settings to database, using memory storage:', dbError.message);
    }

    res.json({
      data: userSettings,
      error: null
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({
      data: null,
      error: {
        message: 'Failed to update user settings',
        code: 'UPDATE_SETTINGS_ERROR'
      }
    });
  }
});

// POST /api/user/settings/reset - Reset user settings to defaults
router.post('/reset', (req, res) => {
  try {
    userSettings = {
      email: '',
      name: '',
      phone: '',
      companyName: '',
      defaultCurrency: 'INR',
      emailNotifications: true,
      smsNotifications: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Clear database settings
    try {
      db.run('DELETE FROM user_settings');
      console.log('✅ User settings cleared from database');
    } catch (dbError) {
      console.warn('⚠️ Failed to clear settings from database:', dbError.message);
    }

    res.json({
      data: userSettings,
      message: 'Settings reset to defaults',
      error: null
    });
  } catch (error) {
    console.error('Error resetting user settings:', error);
    res.status(500).json({
      data: null,
      error: {
        message: 'Failed to reset user settings',
        code: 'RESET_SETTINGS_ERROR'
      }
    });
  }
});

module.exports = router;