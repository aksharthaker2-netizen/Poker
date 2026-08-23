// src/routes/friendRoutes.js
const express = require('express');
const router = express.Router();

const friendController = require('../controllers/friendController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // every friends endpoint requires a logged-in user

router.get('/search', friendController.searchUsers);
router.get('/', friendController.listFriends);
router.get('/requests', friendController.listPendingRequests);
router.post('/request', friendController.sendRequest);
router.post('/:friendshipId/accept', friendController.acceptRequest);
router.post('/:friendshipId/decline', friendController.declineRequest);
router.delete('/:friendshipId', friendController.removeFriend);

module.exports = router;