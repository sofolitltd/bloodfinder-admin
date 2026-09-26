const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/** Encodes a latitude/longitude pair into a geohash, matching the mobile app's encoder. */
export function encodeGeohash(latitude: number, longitude: number, precision = 9): string {
  let minLat = -90.0;
  let maxLat = 90.0;
  let minLng = -180.0;
  let maxLng = 180.0;

  let geohash = "";
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (minLng + maxLng) / 2.0;
      if (longitude > mid) {
        ch |= 1 << (4 - bit);
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2.0;
      if (latitude > mid) {
        ch |= 1 << (4 - bit);
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}
