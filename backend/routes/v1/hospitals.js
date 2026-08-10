const express = require('express');
const https = require('https');
const Hospital = require('../../models/Hospital');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

/**
 * GET Nearby Hospitals
 * 1. Checks local MongoDB (for high-quality data from your Scraper Kit)
 * 2. Falls back to Overpass API (OpenStreetMap) for real-time coverage
 */
router.get('/nearby', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query; // Default 10km

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Coordinates are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // --- PHASE 1: SEARCH LOCAL DATABASE (Your Scraper Kit Data) ---
    // If you use the Scraper Kit, populate this MongoDB collection with the results.
    let localHospitals = await Hospital.find({
      'location.lat': { $gte: latitude - 0.1, $lte: latitude + 0.1 },
      'location.lng': { $gte: longitude - 0.1, $lte: longitude + 0.1 },
      active: true
    }).limit(5);

    // --- PHASE 2: FALLBACK TO REAL-TIME OVERPASS API (OSM) ---
    // This ensures coverage even if local database isn't fully seeded.
    const overpassQuery = `[out:json];node["amenity"="hospital"](around:${radius},${latitude},${longitude});out 10;`;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    https.get(overpassUrl, (overpassRes) => {
      let data = '';
      overpassRes.on('data', chunk => data += chunk);
      overpassRes.on('end', () => {
        try {
          const results = JSON.parse(data);
          const osmHospitals = results.elements.map(e => ({
            name: e.tags.name || 'Emergency Center',
            location: { lat: e.lat, lng: e.lon },
            emergencyHotline: e.tags.phone || e.tags['contact:phone'] || 'Check Google Maps',
            address: {
              street: e.tags['addr:street'] || '',
              city: e.tags['addr:city'] || ''
            },
            source: 'OpenStreetMap'
          }));

          // Combine and deduplicate
          const combined = [...localHospitals.map(h => ({
            _id: h._id,
            name: h.name,
            location: h.location,
            emergencyHotline: h.emergencyHotline,
            address: h.address,
            status: h.status,
            source: 'LifeQR Verified'
          })), ...osmHospitals].slice(0, 8);

          res.json({ hospitals: combined });
        } catch (e) {
          res.json({ hospitals: localHospitals }); // Fallback to just local on error
        }
      });
    }).on('error', () => {
      res.json({ hospitals: localHospitals });
    });

  } catch (error) {
    console.error('Nearby Hospitals Error:', error);
    res.status(500).json({ error: 'Failed to find nearby hospitals' });
  }
});

module.exports = router;
