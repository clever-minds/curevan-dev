const fs = require('fs');

const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\therapist\\\\therapistController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

const startStr = 'exports.listUsersWithProfilesInRadius = async (req, res) => {';
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf('exports.saveAvailability', startIndex);

if (startIndex === -1) {
    console.log("Could not find start index");
    process.exit(1);
}

const replacement = `exports.listUsersWithProfilesInRadius = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        status: false,
        message: "Latitude and Longitude required"
      });
    }

    const users = await sequelize.query(
      \`
      SELECT 
        u.id,
        REPLACE(u.name, '.', '') AS name,
        u.email,
        u.phone,
        u.status AS "isActive",
        u.created_at AS "createdAt",
        u.updated_at AS "updatedAt",

        -- address fields from USERS
        u.address_line1,
        u.address_line2,
        u.city,
        u.state,
        u.pin,
        u.full_address,
        u.latitude,
        u.longitude,

        tp.user_id,
        tp.bio,
        tp.service_radius_km,
        tp.qualification,
        tp.id as therapist_id,
        tp.registration_no,
        tp.experience_years as experience_years,
        tp.experience_years as experience,
        tp.hourly_rate as "hourlyRate",
        tp.membership_plan,
        tp.pan_number,
        tp.bank_account_number,
        tp.bank_ifsc_code,
        tp.profile_status,
        tp.specialty,
        tp.is_public_profile as "isProfilePublic",

        tp.created_at AS "profileCreatedAt",
        tp.updated_at AS "profileUpdatedAt",

        media.file_path as image,

        ARRAY_REMOVE(ARRAY_AGG(DISTINCT r.name), NULL) AS roles,

        ROUND(
          (
            6371 * acos(
              cos(radians(:lat)) *
              cos(radians(u.latitude)) *
              cos(radians(u.longitude) - radians(:lng)) +
              sin(radians(:lat)) *
              sin(radians(u.latitude))
            )
          )::numeric
        , 2) AS distance_km

      FROM users u

      LEFT JOIN therapist_profiles tp 
        ON tp.user_id = u.id

      LEFT JOIN user_roles ur 
        ON ur.user_id = u.id

      LEFT JOIN roles r 
        ON r.id = ur.role_id

      LEFT JOIN media  
        ON tp.profile_image = media.id

      WHERE u.role = 'therapist' AND tp.profile_status = 'approved'
        AND u.latitude IS NOT NULL
        AND u.longitude IS NOT NULL
        AND (
          6371 * acos(
            cos(radians(:lat)) *
            cos(radians(u.latitude)) *
            cos(radians(u.longitude) - radians(:lng)) +
            sin(radians(:lat)) *
            sin(radians(u.latitude))
          )
        ) <= tp.service_radius_km

      GROUP BY 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.status,
        u.created_at,
        u.updated_at,

        u.address_line1,
        u.address_line2,
        u.city,
        u.state,
        u.pin,
        u.full_address,
        u.latitude,
        u.longitude,

        tp.id,
        tp.user_id,
        tp.bio,
        tp.service_radius_km,
        tp.qualification,
        tp.registration_no,
        tp.experience_years,
        tp.hourly_rate,
        tp.membership_plan,
        tp.pan_number,
        tp.bank_account_number,
        tp.bank_ifsc_code,
        tp.profile_status,
        tp.specialty,
        tp.is_public_profile,
        tp.created_at,
        tp.updated_at,

        media.file_path

      ORDER BY distance_km ASC
      \`,
      { 
        type: sequelize.QueryTypes.SELECT,
        replacements: { lat, lng }
      }
    );

    /* =========================
       AVAILABILITY MERGE
    ========================= */

    const therapistIds = users
      .map(u => u.therapist_id)
      .filter(Boolean)
      .map(Number);

    if (therapistIds.length > 0) {
      const availabilities = await sequelize.query(
        \`
        SELECT 
          therapist_id,
          day_of_week as "dayOfWeek",
          json_build_object(
            'start', morning_start,
            'end', morning_end,
            'enabled', true
          ) AS morning,
          json_build_object(
            'start', evening_start,
            'end', evening_end,
            'enabled', true
          ) AS evening
        FROM therapist_availability
        WHERE therapist_id = ANY(ARRAY[:ids]::int[])
        ORDER BY therapist_id, day_of_week
        \`,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { ids: therapistIds }
        }
      );

      const serviceTypesRows = await sequelize.query('SELECT id, name FROM service_types', { type: sequelize.QueryTypes.SELECT });
      const idToName = {};
      serviceTypesRows.forEach(st => { idToName[st.id] = st.name; });

      const usersWithAvailability = users.map(user => {
        const userAvail = availabilities
          .filter(a => a.therapist_id === user.therapist_id)
          .reduce((acc, cur) => {
            acc.windows = acc.windows || {};
            acc.windows[cur.dayOfWeek] = {
              morning: cur.morning,
              evening: cur.evening
            };
            return acc;
          }, {});

        let specArray = Array.isArray(user.specialty)
          ? user.specialty
          : user.specialty
          ? user.specialty.replace(/[{}]/g, "").split(",")
          : [];
        user.specialtyIds = specArray.map(id => Number(id) || id);
        user.specialty = specArray.map(id => idToName[id] || id);

        return {
          ...user,
          availability: userAvail
        };
      });

      return res.json({
        status: true,
        data: usersWithAvailability
      });
    }

    const serviceTypesRows = await sequelize.query('SELECT id, name FROM service_types', { type: sequelize.QueryTypes.SELECT });
    const idToName = {};
    serviceTypesRows.forEach(st => { idToName[st.id] = st.name; });

    res.json({
      status: true,
      data: users.map(u => {
        let specArray = Array.isArray(u.specialty) ? u.specialty : (u.specialty ? u.specialty.replace(/[{}]/g, "").split(",") : []);
        u.specialtyIds = specArray.map(id => Number(id) || id);
        u.specialty = specArray.map(id => idToName[id] || id);
        return { ...u, availability: [] };
      })
    });

  } catch (error) {
    console.error("listUsersWithProfilesInRadius error:", error);
    res.status(500).json({
      status: false,
      message: "Server error"
    });
  }
};

/* =========================
   SAVE AVAILABILITY (OLD ROUTE)
========================= */
`;

let endPos = endIndex;
if (endPos === -1) {
    console.log("Could not find end index");
    process.exit(1);
}

// Find the line where exports.saveAvailability starts, we don't want to replace it but everything before it
const textToReplace = code.substring(startIndex, endPos);

code = code.replace(textToReplace, replacement);
fs.writeFileSync(controllerPath, code, 'utf8');
console.log("Successfully fixed listUsersWithProfilesInRadius");
