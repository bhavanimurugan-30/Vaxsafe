/**
 * Browser Geolocation + Reverse Geocoding utilities
 *
 * Used by clinic registration to auto-detect the registering facility's
 * real-world location at registration time, instead of requiring manual
 * latitude/longitude entry. No coordinates are hardcoded or defaulted here —
 * every value comes from the device's Geolocation API reading.
 */

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0
};

/**
 * Wraps navigator.geolocation.getCurrentPosition in a Promise and resolves
 * with the raw { latitude, longitude, accuracy } reading from the device.
 * Rejects with a normalized { code, message } error for permission denial,
 * position unavailable, timeout, or lack of browser support.
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject({
        code: 'UNSUPPORTED',
        message: 'Your browser does not support automatic location detection. Please enter the location manually.'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject({
            code: 'PERMISSION_DENIED',
            message: 'Location permission was denied. Please allow location access in your browser and try again, or enter the location manually.'
          });
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          reject({
            code: 'POSITION_UNAVAILABLE',
            message: 'Your current location could not be determined. Please try again or enter it manually.'
          });
        } else if (err.code === err.TIMEOUT) {
          reject({
            code: 'TIMEOUT',
            message: 'Location detection timed out. Please try again or enter it manually.'
          });
        } else {
          reject({
            code: 'UNKNOWN',
            message: 'An unexpected error occurred while detecting your location. Please enter it manually.'
          });
        }
      },
      GEOLOCATION_OPTIONS
    );
  });
}

/**
 * Reverse-geocodes a latitude/longitude pair into a human-readable address
 * using OpenStreetMap's Nominatim reverse geocoding service (free, no API
 * key required). Throws a normalized { code, message } error on failure.
 */
export async function reverseGeocode(latitude, longitude) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=0`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    if (!response.ok) {
      throw { code: 'GEOCODE_FAILED', message: 'The address lookup service returned an error.' };
    }

    const data = await response.json();
    if (!data || !data.display_name) {
      throw { code: 'GEOCODE_NO_RESULT', message: 'No address could be found for the detected coordinates.' };
    }

    return data.display_name;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw { code: 'GEOCODE_TIMEOUT', message: 'The address lookup timed out.' };
    }
    if (err && err.code) throw err;
    throw { code: 'GEOCODE_FAILED', message: 'Unable to resolve an address for the detected coordinates.' };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function isValidLatitude(lat) {
  return typeof lat === 'number' && !Number.isNaN(lat) && lat >= -90 && lat <= 90;
}

export function isValidLongitude(lng) {
  return typeof lng === 'number' && !Number.isNaN(lng) && lng >= -180 && lng <= 180;
}
