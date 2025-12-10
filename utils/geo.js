// geo.js - Utility functions for geolocation-based features

// Compute Haversine distance in kilometers
function haversineKm(lat1, lon1, lat2, lon2) {
	const toRad = (v) => (v * Math.PI) / 180;
	const R = 6371; // km
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

// Quick bounding box for a radius in km around a point
function boundingBox(lat, lon, radiusKm) {
	const latDelta = radiusKm / 111.32; // ~ km per degree latitude
	const lonDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
	return {
		minLat: lat - latDelta,
		maxLat: lat + latDelta,
		minLon: lon - lonDelta,
		maxLon: lon + lonDelta,
	};
}

// Annotate rows with distance and optionally filter by radius
function annotateAndFilterByDistance(rows, lat, lon, radiusKm) {
	const annotated = rows.map((row) => {
		const shop = row.toJSON ? row.toJSON() : row;
		const d = (shop.latitude != null && shop.longitude != null)
			? haversineKm(lat, lon, Number(shop.latitude), Number(shop.longitude))
			: null;
		return { row, distanceKm: d };
	});
	const filtered = radiusKm != null
		? annotated.filter((a) => a.distanceKm != null && a.distanceKm <= radiusKm)
		: annotated;
	return filtered;
}

module.exports = { haversineKm, boundingBox, annotateAndFilterByDistance };