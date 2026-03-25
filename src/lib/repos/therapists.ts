
import serverApi from '@/lib/repos/axios.server';
import type { Therapist, Address, GeoPoint } from '../types';
import { getToken } from '../auth';
/**
 * List all therapists (uses cookies for auth)
 */
export async function listTherapists(): Promise<Therapist[] | null> {
    try {

        const { data } = await serverApi.get('/api/therapists/list', {
         headers: {
        Authorization: `Bearer ${await getToken()}`,
      }, // send cookies automatically
        });

        const therapists: Therapist[] = (data.data || []).map((item: any) => ({
         id: item.id,
            user_id: item.user_id,
            name: item.name,
            specialty: item.specialty,
            city: item.city,
            state: item.state,
            pin: item.pin,
            address: {
              line1: item.address_line1,
              line2: item.address_line2, // optional
              city: item.city,
              state: item.state,
              pin: item.pin,
              country: item.country || 'India',
            },
            position: item.position,
            rating: item.rating || 0,
            reviews: item.reviews || 0,
            image: item.image || '',
            experience_years: item.experience || 0,
            bio: item.bio || '',
            qualifications: item.qualifications || [],
            serviceTypes: item.specialty || [],
            membershipPlan: item.membershipPlan || 'standard',
            isProfilePublic: item.isProfilePublic,
            profileViewCount: item.profileViewCount,
            clinicId: item.clinicId,
            referralCode: item.referralCode,
            referralDiscountRate: item.referralDiscountRate,
            referralCommissionRate: item.referralCommissionRate,
            referralActive: item.referralActive,
            availability: item.availability,
            hourlyRate: item.hourlyRate,
            platformFeePct: item.platformFeePct,
            isHighlighted: item.isHighlighted,
            distance:item.distance_km,
            lat: item.latitude ? Number(item.latitude) : 0,
            lng: item.longitude ? Number(item.longitude) : 0,
            tax: item
              ? {
                  pan: item.pan || '',
                  panVerified: item.panVerified,
                  lastPanUpdatedAt: item.lastPanUpdatedAt ,
                }
              : undefined,
        }));
      
        // Sort premium therapists first
        therapists.sort((a, b) => {
        if (a.membershipPlan === 'premium' && b.membershipPlan !== 'premium') return -1;
        if (a.membershipPlan !== 'premium' && b.membershipPlan === 'premium') return 1;
        return 0;
        });
        console.log('Raw therapists data from API:',therapists);

        return therapists;
    } catch (error: any) {
        console.log('THERAPISTS LIST ERROR:', error?.message);
          return [];
    }
    }

/**
 * Get therapist by ID (uses cookies)
 */
export async function getTherapistById(id: number): Promise<Therapist | null> {
  try {
    if (!id) return null;

    const { data } = await serverApi.get(`/api/therapists/profile/${id}`, {
      headers: {
        Authorization: `Bearer ${await getToken()}`,
      }, 
    });

    if (!data?.data) return null;

    const item = data.data; // single therapist object

    let availability = item.availability;
    if (typeof availability === 'string') {
      try {
        availability = JSON.parse(availability);
      } catch (e) {
        console.error('Failed to parse availability:', e);
      }
    }

    const therapist: Therapist = {
      id: item.id,
      user_id: item.user_id,
      name: item.name,
      specialty: item.specialty,
      registrationNo: item.registrationNo || item.registration_no || '',
      bankAccountNo: item.bankAccountNo || item.bank_account_number || '',
      bankIfscCode: item.bankIfscCode || item.bank_ifsc_code || '',
      line1: item.line1 || item.address_line1 || '',
      line2: item.line2 || item.address_line2 || '',
      city: item.city || '',
      state: item.state || '',
      pin: item.pin || '',
      country: item.country || 'India',
      lat: item.latitude ? Number(item.latitude) : 0,
      lng: item.longitude ? Number(item.longitude) : 0,
      fullAddress: item.fullAddress || `${item.line1 || ''}, ${item.city || ''}`,
      position: { lat: item.latitude || 0, lng: item.longitude || 0 },
      rating: item.rating || 0,
      reviews: item.reviews || 0,
      image: item.avatar || item.image || '',
      experience_years: item.experience || 0,
      bio: item.bio || '',
      qualifications: item.qualifications || '',
       serviceTypes: item.specialty || [],
      isProfilePublic: item.isProfilePublic,
      profileViewCount: item.profileViewCount,
      clinicId: item.clinicId,
      referralCode: item.referralCode,
      referralDiscountRate: item.referralDiscountRate,
      referralCommissionRate: item.referralCommissionRate,
      referralActive: item.referralActive,
      availability: availability,
      hourlyRate: item.hourlyRate,
      membershipPlan: item.membershipPlan || 'standard',
      platformFeePct: item.platformFeePct,
      isHighlighted: item.isHighlighted,
      distance:item.distance_km,
      tax: item.tax
        ? {
            pan: item.tax.pan || '',
            panVerified: item.tax.panVerified,
          }
        : undefined,
    };

    return therapist;
  } catch (error: any) {
    console.error('GET THERAPIST BY ID ERROR:', error?.message);
    return null;
  }
}

/**
 * Get therapist by slug (uses cookies)
 */
export async function getTherapistBySlug(slug: string): Promise<Therapist | null> {
  try {
    const therapists = await listTherapists();
    if (!therapists) return null;
therapists.find(
        t => t.name.toLowerCase().replace(/ /g, '-') === slug.toLowerCase()
      ) || null
const matched = therapists.find(t => t.name.toLowerCase().replace(/ /g, '-') === slug.toLowerCase());
console.log("matched therapist:", matched);    
return (
      matched || null
    );
  } catch (error: any) {
    console.error('GET THERAPIST BY SLUG ERROR:', error?.message);
    return null;
  }
}

export async function listTherapistsByLocation(
  lat: number,
  lng: number
): Promise<Therapist[] | null> {
  try {
    console.log('Fetching therapists by location:', lat, lng);

    const { data } = await serverApi.get('/api/therapists/listnearby', {
      params: {
        lat,
        lng,
      },
      headers: {
        Authorization: `Bearer ${await getToken()}`,
      },
    });

    const therapists: Therapist[] = (data.data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      user_id: item.user_id,
      specialty: item.specialty,
      phone: item.phone,
      membershipPlan: item.membership_plan || 'basic',
      bank_account_number: item.bank_account_number,
      bank_ifsc_code: item.bank_ifsc_code,
      registration_no: item.registration_no,
      address_line1: item.address_line1,
      availability: item.availability,
      serviceTypes: item.specialty || [],
      image: item.image,
      distance:item.distance_km,
      hourlyRate: item.hourlyRate,
      lat: item.latitude ? Number(item.latitude) : 0,
      lng: item.longitude ? Number(item.longitude) : 0,
      experience_years: item.experience,
      tax: item.tax
        ? {
            pan: item.tax.pan || '',
            lastPanUpdatedAt: item.tax.lastPanUpdatedAt
              ? new Date(item.tax.lastPanUpdatedAt).toISOString()
              : null,
          }
        : undefined,
        city: item.city || '',
        state: item.state || '',
        line1: item.line1 || '',
        pin: item.pin || '',
      position: {
        lat: item.latitude || '',
        lng: item.longitude || '',
       
      },
      bio: item.bio || '',
      avatar: item.avatar || '',
    }));

    // Premium first
    therapists.sort((a, b) => {
      if (a.membershipPlan === 'premium' && b.membershipPlan !== 'premium') return -1;
      if (a.membershipPlan !== 'premium' && b.membershipPlan === 'premium') return 1;
      return 0;
    });

    return therapists;
  } catch (error: any) {
    console.log('THERAPISTS BY LOCATION ERROR:', error?.message);
      return [];
  }
}