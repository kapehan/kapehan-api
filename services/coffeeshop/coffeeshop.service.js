const { coffee_shop, opening_hours, coffee_shop_vibe, coffee_shop_amenities  } = require('../db.service');
const { v4: uuidv4 } = require('uuid');

const create = async (body) => {
    console.log("create -->");
    if (!body.coffee_shop_uuid) body['coffee_shop_uuid'] = uuidv4();
    try {
        let data = {};
        for await (let [key, value] of Object.entries(body)){
            data[key] = value["value"] ?? value;
        }
        data["slug"] = data.coffee_shop_name.replace(" ","-");
        data["location"] = { type: 'Point', coordinates: [data['coffee_shop_longtitude'], data['coffee_shop_latitude']] } // [lon, lat]

        const {selectedVibes, openingHours, selectedAmenities, ...coffee_shop_data} = data;

        const coffee_shop_res = await coffee_shop.create(coffee_shop_data);

        
        const coffee_shop_uuid = coffee_shop_res.coffee_shop_uuid;
        const vibe_data = JSON.parse(selectedVibes).map(data => ({
            vibe_uuid: data,
            coffee_shop_uuid
        }));
        
        const opening_data = [];
        const openingHoursData = JSON.parse(openingHours);
        for(let [key, value] of Object.entries(openingHoursData)){
            opening_data.push({
                coffee_shop_uuid: coffee_shop_uuid,
                opening_hours: value['open'],
                closing_hours: value['close'],
                is_closed: !value['isOpen'],
                day_of_the_week: key,
            })
        }
        const amenities_data = JSON.parse(selectedAmenities).map(data => ({
            amenities_uuid: data,
            coffee_shop_uuid
        }));
        const [opening_hours_res, coffee_shop_vibe_res, coffee_shop_amenities_res] = await Promise.allSettled([
            opening_hours.bulkCreate(opening_data),
            coffee_shop_vibe.bulkCreate(vibe_data),
            coffee_shop_amenities.bulkCreate(amenities_data) 
        ]);

        return {sucess: true, data : {
            coffee_shop: coffee_shop_res,
            opening_hours: opening_hours_res,
            coffee_shop_amenities :coffee_shop_amenities_res,
            coffee_shop_vibe: coffee_shop_vibe_res
        }}
    } catch (error) {
        console.log("error", error);
        return {success: false, message: "Failed to save Coffe Shop", error: error.message}
    }

};

const update = async (data) => {
    if (!data.coffee_shop_uuid) data['coffee_shop_uuid'] = uuidv4();
    try {
        const {vibe, opening, amenities, ...coffee_shop_data} = data;

        const coffee_shop_res = await coffee_shop.create(coffee_shop_data);

        const coffee_shop_uuid = coffee_shop_res.coffee_shop_uuid;
        const vibe_data = JSON.parse(vibe).map(data => ({
            ...data,
            coffee_shop_uuid
        }));
        const opening_data = JSON.parse(opening).map(data => ({
            ...data,
            coffee_shop_uuid
        }));
        const amenities_data = JSON.parse(amenities).map(data => ({
            ...data,
            coffee_shop_uuid
        }));
        const [opening_hours_res, coffee_shop_vibe_res, coffee_shop_amenities_res] = await Promise.all([
            opening_hours.bulkCreate(vibe_data),
            coffee_shop_vibe.bulkCreate(opening_data),
            coffee_shop_amenities.bulkCreate(amenities_data) 
        ]);

        return {sucess: true, data : {
            coffee_shop: coffee_shop_res,
            opening_hours: opening_hours_res,
            coffee_shop_amenities :coffee_shop_amenities_res,
            coffee_shop_vibe: coffee_shop_vibe_res
        }}
    } catch (error) {
        return {success: false, message: "Failed to save Coffe Shop", error: error.message}
    }

};

module.exports = {create, update};