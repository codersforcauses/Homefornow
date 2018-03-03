const mongoose = require('mongoose');
const async = require('async');
const images = require('../middleware/images');

const Service = mongoose.model('Service');

/**
 * Finds one service provider of the specified availability and type.
 * @param  {Boolean}  isAvailable Find an available or unavailable service provider.
 * @param  {string}   type        Type of service provider: 'crisis', 'transitional' or 'long'.
 */
function findServiceOfAvailability(isAvailable, type) {
  const fields = 'name phoneNumber description available uri img logo';
  return Service.findOne(
    {
      $and: [
        { available: isAvailable },
        { serviceType: type },
      ],
    },
    fields
  ).exec();
}

/**
 * Finds one service provider of the specified type.
 * Attempts to find an available service provider first.
 * To be called by an async operation that provides an async callback.
 * @param  {Function} callback Async callback object.
 * @param  {string}   type     Type of service provider: 'crisis', 'transitional' or 'long'.
 */
function findService(callback, type) {
  let promise = findServiceOfAvailability(true, type);

  promise
    .then((availService) => {
      if (availService) callback(null, availService); // found an available service
      else {
        promise = findServiceOfAvailability(false, type);
        promise.then((err, unavailService) => {
          callback(null, unavailService); // found an unavailable service, or nothing
        });
      }
    })
    .catch((err) => { console.log('[ERROR] IndexController: '.concat(err)); });
}

/**
 * Renders the index page with three service providers: one crisis,
 * one transitional and one long term service provider.
 * @param  {Object} req Express request object.
 * @param  {Object} res Express response object.
 */
module.exports.index = (req, res) => {
  // https://caolan.github.io/async/
  async.parallel(
    {
      crisis: (callback) => { findService(callback, 'crisis'); },
      transitional: (callback) => { findService(callback, 'transitional'); },
      long: (callback) => { findService(callback, 'long'); },
    },
    (err, services) => {
      if (err) {
        console.log('[ERROR] IndexController: '.concat(err));
      }
      Promise.all([
        images.getImageForService(services.crisis.logo, services.crisis.uri),
        images.getImageForService(services.transitional.logo, services.transitional.uri),
        images.getImageForService(services.long.logo, services.long.uri)
      ]).then(([result1, result2, result3]) => {
        res.render('index', {
          user: req.user,
          locations: [services.crisis, services.transitional, services.long],
          images: [result1, result2, result3],
          title: 'Do you have a secure place to stay?',
        });
      }).catch((error) => {
        console.log('[ERROR] IndexController: ', error);
      });
    },
  );
};
