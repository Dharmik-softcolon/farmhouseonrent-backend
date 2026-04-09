const express = require('express');
const router = express.Router();
const {
    getAllFarmhouses,
    getFarmhouse,
    getAdminFarmhouses,
    createFarmhouse,
    updateFarmhouse,
    deleteFarmhouse,
    getCities,
    getSubLocations,
    bulkCreateFarmhouses
} = require('../controllers/farmhouseController');
const { protect, adminOnly } = require('../middleware/auth');
const { validateFarmhouse, validateObjectId } = require('../middleware/validate');

router.get('/cities/list', getCities);
router.get('/sublocations/list', getSubLocations);
router.get('/admin/all', protect, adminOnly, getAdminFarmhouses);
router.get('/', getAllFarmhouses);
router.get('/:slug', getFarmhouse);
router.post('/', protect, adminOnly, validateFarmhouse, createFarmhouse);
router.post('/bulk', protect, adminOnly, bulkCreateFarmhouses);
router.put('/:id', protect, adminOnly, validateObjectId, updateFarmhouse);
router.delete('/:id', protect, adminOnly, validateObjectId, deleteFarmhouse);

module.exports = router;