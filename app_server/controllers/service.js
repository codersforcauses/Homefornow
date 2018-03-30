const mongoose = require('mongoose');
const googleMapsClient = require('@google/maps').createClient({
  key: process.env.embed_maps_api,
  Promise, // 'Promise' is the native constructor.
});
const images = require('../middleware/images');

const Service = mongoose.model('Service');
const Request = mongoose.model('Request');
const User = mongoose.model('User');

function amenities(service) {
  const amen = [];

  if (service.TV === 'on') {
    amen.push({
      label: 'TV',
      name: 'TV',
      icon: 'tv',
    });
  }
  if (service.WASHER === 'on') {
    amen.push({
      label: 'LAUNDRY/WASHER',
      name: 'WASHER',
      icon: 'local_laundry_service',
    });
  }
  if (service.WIFI === 'on') {
    amen.push({
      label: 'WIFI',
      name: 'WIFI',
      icon: 'wifi',
    });
  }
  if (service.BATH === 'on') {
    amen.push({
      label: 'BATHROOM',
      name: 'BATH',
      icon: 'wc',
    });
  }
  if (service.SMOKE === 'on') {
    amen.push({
      label: 'SMOKING',
      name: 'SMOKE',
      icon: 'smoking_rooms',
    });
  } else {
    amen.push({
      label: 'NO SMOKING',
      name: 'SMOKE',
      icon: 'smoke_free',
    });
  }
  if (service.AIRCON === 'on') {
    amen.push({
      label: 'AIR-CONDITIONING',
      name: 'AIRCON',
      icon: 'ac_unit',
    });
  }
  if (service.GAMES === 'on') {
    amen.push({
      label: 'GAMES/CONSOLE',
      name: 'GAMES',
      icon: 'videogame_asset',
    });
  }
  if (service.GYM === 'on') {
    amen.push({
      label: 'GYM',
      name: 'GYM',
      icon: 'fitness_center',
    });
  }
  if (service.STUDY === 'on') {
    amen.push({
      label: 'STUDY',
      name: 'STUDY',
      icon: 'local_library',
    });
  }
  if (service.KITCHEN === 'on') {
    amen.push({
      label: 'KITCHEN',
      name: 'KITCHEN',
      icon: 'local_dining',
    });
  }
  if (service.PHONE === 'on') {
    amen.push({
      label: 'PHONE',
      name: 'PHONE',
      icon: 'phone',
    });
  }
  if (service.CURFEW === 'on') {
    amen.push({
      label: 'CURFEW',
      name: 'CURFEW',
      icon: 'schedule',
    });
  }
  if (service.SECURE === 'on') {
    amen.push({
      label: 'SECURE',
      name: 'SECURE',
      icon: 'lock',
    });
  }
  if (service.OUTDOOR === 'on') {
    amen.push({
      label: 'OUTDOOR/GARDEN',
      name: 'OUTDOOR',
      icon: 'local_florist',
    });
  }
  console.log(amen);
  return amen;
//   ['BATHROOM', '', 'wc']; ///////////////////////////////////////////
}

/**
 * Renders the service page.
 * @param  {Object} req Express request object.
 * @param  {Object} res Express response object.
 */
module.exports.service = (req, res) => {
  res.render('service');
};

/**
 * Adds a new service (mongo document) to the database.
 * Redirects to the service provider's page.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @param  {Function} next Express next function.
 */
module.exports.addService = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ message: 'You must be logged in to create a new service provider.' });
    return;
  }

  const service = new Service();

  // Geocode an address with a promise
  googleMapsClient.geocode({ address: req.body.serveSuburb.concat(', ').concat(req.body.serveState).concat(', ').concat(req.body.serveState) }).asPromise()
    .then((response) => {
      const temp = response.json.results[0].geometry.location;

      service.name = req.body.serveName;
      service.phoneNumber = req.body.servePhone;
      service.serviceType = req.body.serveType;
      service.address = {
        suburb: req.body.serveSuburb,
        state: req.body.serveState,
        postcode: req.body.servePostcode,
        coordinates: {
          type: 'Point',
          coordinates: [temp.lng, temp.lat],
        },
      };

      service.ageRange = {
        minAge: req.body.serveMinAge,
        maxAge: req.body.serveMaxAge,
      };

      service.stayLength = req.body.serveStayLength;
      service.available = true;
      // service.website = req.body.website;
      service.uri = service.encodeURI(req.body.serveName);
      service.description = req.body.serveDesc;
      service.about = req.body.serveAbout;
      service.houseRules = req.body.serveRules;
      service.amenities = amenities(req.body);

      console.log(service.amenities);

      service.save().then((newService) => {
        const newUser = new User();

        newUser.name = req.body.serveName;
        newUser.email = req.body.serveEmail;
        newUser.dob = new Date();
        newUser.gender = 'Other';
        newUser.role = 'service_provider';
        newUser.service = newService.id;
        newUser.setPassword(req.body.servePass);

        newUser.save().then(() => {
          res.redirect('/location/'.concat(newService.uri));
        }).catch((err) => {
          next(err);
        });
      }).catch((err) => {
        next(err);
      });
    })
    .catch((err) => {
      next(err);
    });
};

// function getAge(date) {
//   const today = Date.now();
//   const age = new Date(today - date.getTime());
//   return Math.abs(age.getUTCFullYear() - 1970);
// }

// function returnAges(requests) {
//   const newRequests = requests;
//   for (let i = 0; i < requests.length; i += 1) {
//     newRequests[i].youth.dob = getAge(new Date(requests[i].youth.dob));
//   }
//   return newRequests;
// }

/**
 * Renders a service provider's dashboard.
 * @param  {Object} req Express request object.
 * @param  {Object} res Express response object.
 */
module.exports.dashboard = (req, res) => {
  if (!req.user || req.user.role !== 'service_provider') {
    res.status(401).json({ message: 'You are not authorised to view this page.' });
    return;
  }
  Service.findById(
    req.user.service[0],
    'name address.suburb address.state address.postcode phoneNumber serviceType ageRange.minAge ageRange.maxAge stayLength available description about houseRules amenities.name beds openRequests uri',
  ).exec()
    .then((service) => {
      console.log(service.openRequests);
      Request.find({
        _id: service.openRequests,
      }, 'firstName lastName gender phoneNumber email dob').exec()
        .then((requests) => {
          console.log(requests);
          res.render('serviceDashboard', {
            service,
            requests,
          });
        })
        .catch((err) => {
          res.status(401).json({ message: err });
        });
    });
};

module.exports.getBeds = (req, res) => {
  const prevPage = req.header('Referer') || '/';
  if (!req.user) {
    res.redirect(prevPage);
  }
  if (req.user.role !== 'service_provider') {
    res.redirect(prevPage);
  }
  if (req.user.service) {
    Service.findById(req.user.service[0], 'beds').exec()
      .then((service) => {
        res.send(service.beds);
      }).catch((err) => {
        console.log(err);
        res.redirect(prevPage);
      });
  } else {
    res.redirect(prevPage);
  }
};

module.exports.updateBeds = (req, res) => {
  const prevPage = req.header('Referer') || '/';
  console.log(req.body.beds);

  if (!req.body.beds) {
    console.log('no beds');
    res.redirect(prevPage);
  }
  const { beds } = req.body;

  Service.findOne({ uri: req.params.serviceUri }, 'beds')
    .exec()
    .then((service) => {
      const oldBeds = service.beds;
      let index;
      if (oldBeds.length <= beds.length) {
        index = oldBeds.length;
      } else {
        index = beds.length;
      }
      for (let i = 0; i < index; i += 1) {
        if (beds[i].name === undefined) {
          beds[i].name = oldBeds[i].name;
        }
        if (beds[i].gender === undefined) {
          beds[i].gender = oldBeds[i].gender;
        }
        if (beds[i].bedType === undefined) {
          beds[i].bedType = oldBeds[i].bedType;
        }
        if (beds[i].isOccupied === undefined) {
          beds[i].isOccupied = oldBeds[i].isOccupied;
        }
      }
    }).then(() => {
      Service.findOneAndUpdate(
        { uri: req.params.serviceUri },
        {
          $set: {
            beds,
          },
        },
        { runValidators: true },
      ).exec().then(() => {
        res.redirect('/service/dashboard/'.concat(req.params.serviceUri));
      }).catch((err) => {
        console.log(err);
        res.redirect(prevPage);
      });
    });
};

/**
 *  Adds a new image to Firebase, storing a reference to it in the database.
 *  @param  {Object} req Express request object.
 *  @param  {Object} res Express response object.
 */
module.exports.uploadImage = (req, res) => {
  if (req.file && req.file.storageObject) {
    // Get the corresponding Service from the serviceUri and push the image
    // reference to the list of images
    Service.findOneAndUpdate(
      { uri: req.params.serviceUri },
      { $push: { img: req.file.storageObject } },
      { runValidators: true },
    ).exec()
      .then(() => {
        // Get the mediaLink for the image from Firebase
        images.getImageForService(req.file.storageObject).then((image) => {
          // Return the image
          res.json({ error: false, mediaLink: image });
        }).catch(() => {
          // Couldn't get the mediaLink for the image - return error
          res.json({
            error: true,
            errorTitle: 'Error!',
            errorDescription: 'Image could not be uploaded',
          });
        });
      });
  } else if (!req.file) {
    // If the user didn't upload a file, send an error
    res.json({
      error: true,
      errorTitle: 'File type not supported!',
      errorDescription: 'Please upload a valid image file.',
    });
  } else {
    // If there was some other error upload the image to Firebase, send an error
    res.json({
      error: true,
      errorTitle: 'Upload error!',
      errorDescription: 'Unable to upload file to HomeForNow',
    });
  }
};

/**
 *  Adds a new logo to Firebase, storing a reference to it in the database.
 *  @param  {Object} req Express request object.
 *  @param  {Object} res Express response object.
 */
module.exports.uploadLogo = (req, res) => {
  if (req.file && req.file.storageObject) {
    // Get the corresponding Service from the serviceUri and update the logo reference
    Service.findOneAndUpdate(
      { uri: req.params.serviceUri },
      { $set: { logo: req.file.storageObject } },
      { runValidators: true },
    ).exec()
      .then(() => {
        // Get the mediaLink for the logo from Firebase
        images.getImageForService(req.file.storageObject).then((image) => {
          // Return the image
          res.json({ error: false, mediaLink: image });
        }).catch(() => {
          // Couldn't get the mediaLink for the logo - return error
          res.json({
            error: true,
            errorTitle: 'Error!',
            errorDescription: 'Image could not be uploaded',
          });
        });
      });
  } else if (!req.file) {
    // If the user didn't upload a file, send an error
    res.json({
      error: true,
      errorTitle: 'File type not supported!',
      errorDescription: 'Please upload a valid image file.',
    });
  } else {
    // If there was some other error upload the logo to Firebase, send an error
    res.json({
      error: true,
      errorTitle: 'Upload error!',
      errorDescription: 'Unable to upload file to HomeForNow',
    });
  }
};

/**
 * Used by deleteImageModal to delete an image stored in Firebase from a service
 * provider's profile.
 * @param  {Object} req Express request object.
 * @param  {Object} res Express response object.
 */
module.exports.deleteImage = (req, res) => {
  // Get the Service corresponding to the serviceUri
  Service.findOne({ uri: req.params.serviceUri }, 'name img').exec().then((service) => {
    // Delete the image specified by req.params.index from the Service
    images.deleteImageFromService(service, req.params.serviceUri, req.params.index).then(() => {
      // Return successfully
      res.json({ error: false });
    }).catch((err) => {
      // Failed to delete the image from Firebase and/or MongoDB - return error
      res.status(500).json({ error: true, message: err });
    });
  }).catch((err) => {
    // Failed to obtain the Service from MongoDB - return error
    res.status(500).json({ error: true, message: err });
  });
};

module.exports.deleteLogo = (req, res) => {
  // Get the Service corresponding to the serviceUri
  Service.findOne({ uri: req.params.serviceUri }, 'name logo').exec().then((service) => {
    // Delete the logo from the Service
    images.deleteLogoFromService(service.logo, req.params.serviceUri).then(() => {
      // Return successfully
      res.json({ error: false });
    }).catch((err) => {
      // Failed to delete the logo from Firebase and/or MongoDB - return error
      res.status(500).json({ error: true, message: err });
    });
  }).catch((err) => {
    // Failed to obtain the Service from MongoDB - return error
    res.status(500).json({ error: true, message: err });
  });
};

/**
 * Renders a service provider's profile page.
 * This is a test page used to test the image uploading page, and will unlikely
 * be used in production
 * @param  {Object} req Express request object.
 * @param  {Object} res Express response object.
 */
module.exports.profile = (req, res) => {
  Service.findOne({ uri: req.params.serviceUri }, 'name img logo').exec().then((service) => {
    Promise.all([
      images.getImagesForService(service, req.params.serviceUri),
      images.getImageForService(service.logo, req.params.serviceUri),
    ]).then(([imgs, logo]) => {
      const params = imgs;
      params.logo = logo;
      res.render('editImages', params);
    }).catch((err) => {
      res.status(500).json({ message: err });
    });
  }).catch((err) => {
    res.status(500).json({ message: err });
  });
};
