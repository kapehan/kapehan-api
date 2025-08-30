const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

const findShopsMidpoint = async (lat1, lon1, lat2, lon2, radius) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) {
        throw new Error("Missing coordinates");
    };

    const midLat = (parseFloat(lat1) + parseFloat(lat2)) / 2;
    const midLon = (parseFloat(lon1) + parseFloat(lon2)) / 2;
    const radiusInMeters = parseFloat(radius);

    const { data, error } = await supabase.rpc(
        "coffee_shops_near_midpoint",
        {
            mid_lat: midLat,
            mid_lon: midLon,
            radius_in_meters: radiusInMeters
        }
    );

    if (error) {
        console.log('error in coffee_shops_near_midpoint :>>', error)
        throw new Error(error)
    }

    return data
}

module.exports = {
    findShopsMidpoint
}