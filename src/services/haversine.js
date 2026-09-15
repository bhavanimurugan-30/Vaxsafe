/**
 * Haversine Distance Formula & Cold-Chain Logistics Calculations
 * 
 * Computes great-circle distance between two points on a sphere given their
 * latitudes and longitudes in decimal degrees.
 */

const EARTH_RADIUS_KM = 6371.0;

/**
 * Converts degrees to radians
 * @param {number} deg 
 * @returns {number}
 */
function toRadians(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculates the great-circle distance between two coordinates in kilometers.
 * 
 * Formula:
 * a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
 * c = 2 * atan2(√a, √(1−a))
 * d = R * c
 * 
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in kilometers (float)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return parseFloat((EARTH_RADIUS_KM * c).toFixed(2));
}

/**
 * Estimates refrigerated transit time based on distance and average urban transport speed.
 * Standard urban cold-chain medical courier speed: ~40 km/h with 5 min handling buffer.
 * 
 * @param {number} distanceKm 
 * @param {number} averageSpeedKmh 
 * @returns {{ minutes: number, formatted: string }}
 */
export function estimateTransitTime(distanceKm, averageSpeedKmh = 40) {
  if (distanceKm <= 0) return { minutes: 0, formatted: '< 5 min' };
  
  const transitHours = distanceKm / averageSpeedKmh;
  const transitMinutes = Math.round(transitHours * 60) + 5; // 5 min cold transfer buffer
  
  if (transitMinutes < 60) {
    return {
      minutes: transitMinutes,
      formatted: `${transitMinutes} min`
    };
  }
  
  const hours = Math.floor(transitMinutes / 60);
  const remMinutes = transitMinutes % 60;
  return {
    minutes: transitMinutes,
    formatted: remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours} hr`
  };
}

/**
 * Evaluates cold-chain viability for transit:
 * Critical for temperature-sensitive batches where cold-box passive cooling
 * duration may have limited endurance.
 * 
 * @param {number} distanceKm 
 * @param {number} transitMinutes 
 * @returns {{ level: 'Optimal' | 'Viable' | 'Caution' | 'High Risk', description: string, badgeColor: string }}
 */
export function evaluateColdChainViability(distanceKm, transitMinutes) {
  if (transitMinutes <= 20) {
    return {
      level: 'Optimal',
      description: 'Rapid proximity transfer. Minimal thermal risk (<20 mins).',
      badgeColor: 'emerald'
    };
  } else if (transitMinutes <= 45) {
    return {
      level: 'Viable',
      description: 'Standard insulated cooler dispatch. Safe within cold-pack lifespan.',
      badgeColor: 'blue'
    };
  } else if (transitMinutes <= 75) {
    return {
      level: 'Caution',
      description: 'Extended transit. Requires certified Phase Change Material (PCM) coolers.',
      badgeColor: 'amber'
    };
  } else {
    return {
      level: 'High Risk',
      description: 'Long distance transit. Requires active refrigerated vehicle transport.',
      badgeColor: 'rose'
    };
  }
}

/**
 * Given an origin clinic and a list of all clinics, ranks all potential destination clinics
 * by physical distance using Haversine.
 * 
 * @param {{ id: string, name: string, lat: number, lng: number }} originClinic 
 * @param {Array<{ id: string, name: string, lat: number, lng: number }>} allClinics 
 * @returns {Array<any>} Destination clinics sorted from closest to farthest
 */
export function rankNearestClinics(originClinic, allClinics) {
  if (!originClinic || !allClinics || !allClinics.length) return [];

  return allClinics
    .filter(c => c.id !== originClinic.id)
    .map(dest => {
      const distance = calculateDistance(
        originClinic.lat,
        originClinic.lng,
        dest.lat,
        dest.lng
      );
      const transit = estimateTransitTime(distance);
      const viability = evaluateColdChainViability(distance, transit.minutes);

      return {
        ...dest,
        distanceKm: distance,
        transitMinutes: transit.minutes,
        transitFormatted: transit.formatted,
        viability
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
