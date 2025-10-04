const { coffee_shop, opening_hours, coffee_shop_vibe, coffee_shop_amenities, vibes, amenities  } = require('../db.service');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

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

const find = async (req) => {
    const query = req.query;
    const body_param = req.body;
    const { page = 1, limit = 20, search, orderby = 'ASC', ...filters } = query;

    const _limit = parseInt(limit);
    const offset = (parseInt(page) - 1) * _limit;
    let params = Object.assign({}, filters);

    if (search) {
        params['coffee_shop_name'] = {
        [Op.iLike]: `%${search}%`
        };
    }

    const {count, rows } = await coffee_shop.findAndCountAll({
        where: params,
        distinct: true,
        limit: _limit,
        offset,
        order: [['coffee_shop_name', orderby]],
        include: [
            {
                model: opening_hours,
                required: false 
            },
            {
                model: coffee_shop_vibe,
                required: true,
                include: [
                    {
                    model: vibes,
                    required: false
                    }
                ],
                ...(body_param?.vibes?.length && {
                    where: {
                        vibe_uuid: {
                            [Op.in]: body_param.vibes
                        }
                    }
                })
            },
            {
                model: coffee_shop_amenities,
                required: true,
                include: [
                    {
                    model: amenities,
                    required: false
                    }
                ],
                ...(body_param?.amenities?.length && {
                    where: {
                        amenities_uuid: {
                            [Op.in]: body_param.amenities
                        }
                    }
                })
            }
        ]
    });

    const formattedRows = rows.map((shop) => {
        const plainShop = shop.get({ plain: true });

        return {
            ...plainShop,
            coffee_shop_vibes: plainShop.coffee_shop_vibes?.map(v => v.vibe?.vibe_name).filter(Boolean) || [],
            coffee_shop_amenities: plainShop.coffee_shop_amenities?.map(a => a.amenity?.amenities_name).filter(Boolean) || []
        };
    });

    return {
        count,
        rows: formattedRows
    }


};

const update = async (coffee_shop_uuid, body) => {
    console.log("update -->");
    try {
        let data = {};
        let dataRes = {};
        for await (let [key, value] of Object.entries(body)){
            data[key] = value["value"] ?? value;
        }
        data["slug"] = data.coffee_shop_name.replace(" ","-");
        data["location"] = { type: 'Point', coordinates: [data['coffee_shop_longtitude'], data['coffee_shop_latitude']] } // [lon, lat]

        const {selectedVibes, openingHours, selectedAmenities, ...coffee_shop_data} = data;

        const coffee_shop_res = await coffee_shop.update(coffee_shop_data, { where: { coffee_shop_uuid} });
        dataRes["coffee_shop"] = coffee_shop_res;
        if(selectedVibes){
            const vibe_data = JSON.parse(selectedVibes).map(data => ({
                vibe_uuid: data,
                coffee_shop_uuid
            }));
            await coffee_shop_vibe.destroy({coffee_shop_uuid});
            const vibes_res = await coffee_shop_vibe.bulkCreate(vibe_data);
            dataRes["vibes"] = vibes_res; 
        }
        
        if(openingHours){
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
            await opening_hours.destroy({coffee_shop_uuid});
            const opening_hours_res = await opening_hours.bulkCreate(opening_data);
            dataRes["opening_hours"] = opening_hours_res;
        }
        
        if(selectedAmenities){
            const amenities_data = JSON.parse(selectedAmenities).map(data => ({
                amenities_uuid: data,
                coffee_shop_uuid
            }));
            
            await coffee_shop_amenities.destroy({coffee_shop_uuid});
            const amenities_res = await coffee_shop_amenities.bulkCreate(amenities_data);
            dataRes["amenities"] = amenities_res;

        }
        return {sucess: true, data : dataRes}
    } catch (error) {
        console.log("error", error);
        return {success: false, message: "Failed to save Coffe Shop", error: error.message}
    }

};

const _delete = async (coffee_shop_uuid) => {
    console.log("delete -->");
    try {
       
        const [coffee_shop_res, coffee_shop_vibe_res, opening_hours_res, coffee_shop_amenities_res] = await Promise.allSettled([
        coffee_shop.destroy({coffee_shop_uuid}),
        coffee_shop_vibe.destroy({coffee_shop_uuid}),
        opening_hours.destroy({coffee_shop_uuid}),
        coffee_shop_amenities.destroy({coffee_shop_uuid})
        ])
        
        return {sucess: true, data : {
            coffee_shop_res,
            coffee_shop_vibe_res,
            opening_hours_res,
            coffee_shop_amenities_res
        }}
    } catch (error) {
        console.log("error", error);
        return {success: false, message: "Failed to save Coffe Shop", error: error.message}
    }

};

module.exports = {create, find, update, _delete};