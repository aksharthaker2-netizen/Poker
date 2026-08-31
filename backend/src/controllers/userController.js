// src/controllers/userController.js
const userRepository = require('../repositories/userRepository');

async function getProfile(req, res) {
  try {
    const user = await userRepository.getProfileById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    console.error('[User] getProfile error:', error.message);
    return res.status(500).json({ error: 'Failed to load profile' });
  }
}

async function getStats(req, res) {
  try {
    const stats = await userRepository.findStats(req.params.userId);
    if (!stats) return res.status(404).json({ error: 'Stats not found' });
    return res.json(stats);
  } catch (error) {
    console.error('[User] getStats error:', error.message);
    return res.status(500).json({ error: 'Failed to load stats' });
  }
}

async function updateProfile(req, res) {
  try {
    // req.body is already validated by updateProfileSchema
    const { displayName, bio, avatarUrl } = req.body; 
    
    // Assuming your userRepository has an update function
    const updatedUser = await userRepository.updateProfile(req.userId, {
      displayName,
      bio,
      avatarUrl
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error('[User] updateProfile error:', error.message);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

module.exports = { getProfile, getStats, updateProfile };