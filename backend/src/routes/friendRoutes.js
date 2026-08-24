// src/routes/friendRoutes.js
const express = require('express');
const router = express.Router();

const friendController = require('../controllers/friendController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { sendRequestSchema, searchQuerySchema } = require('../validators/friendValidators');

router.use(authMiddleware);

router.get('/search', validateRequest(searchQuerySchema, 'query'), friendController.searchUsers);
router.get('/', friendController.listFriends);
router.get('/requests', friendController.listPendingRequests);
router.post('/request', validateRequest(sendRequestSchema), friendController.sendRequest);
router.post('/:friendshipId/accept', friendController.acceptRequest);
router.post('/:friendshipId/decline', friendController.declineRequest);
router.delete('/:friendshipId', friendController.removeFriend);

module.exports = router;