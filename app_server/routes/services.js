const express = require('express');
const images = require('../middleware/images');

const router = express.Router();

const serviceController = require('../controllers/service');

// Services Dashboard route
router.get('/dashboard/:serviceUri', serviceController.dashboard);

router.get('/dashboard/:serviceUri/beds/show', serviceController.dashboardBeds);
router.post('/dashboard/:serviceUri/beds/update', serviceController.updateBeds);

router.get('/dashboard/:serviceUri/requests/show', serviceController.dashboardRequests);
router.post('/dashboard/:serviceUri/requests/update', serviceController.updateRequests);

router.get('/dashboard/:serviceUri/profile', serviceController.dashboardProfile);
router.get('/dashboard/:serviceUri/images', serviceController.dashboardImages);
router.get('/dashboard/:serviceUri/available', serviceController.dashboardAvailable);


// Services Profile Page route
// TODO remove
router.get('/profile/:serviceUri', serviceController.profile);

// Upload new image to service
router.post(
  '/profile/:serviceUri/add',
  images.multer.single('fileAdd'),
  images.sendUploadToFirebase,
  serviceController.uploadImage,
);

router.post(
  '/profile/:serviceUri/logo/add',
  images.multer.single('logoAdd'),
  images.sendUploadToFirebase,
  serviceController.uploadLogo,
);

router.post('/profile/:serviceUri/logo/delete', serviceController.deleteLogo);

router.post('/profile/:serviceUri/:index/delete', serviceController.deleteImage);

module.exports = router;
