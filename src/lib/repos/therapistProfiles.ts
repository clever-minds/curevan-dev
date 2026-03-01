
import serverApi from '@/lib/repos/axios.server';
import type { Therapist, Address, GeoPoint } from '../types';

// export async function listTherapistProfiles(): Promise<Therapist[]> {
//     const snapshot = await db.collection('therapistProfiles').get();
//     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Therapist));
// }

export async function getTherapistProfileById(id: number): Promise<Therapist | null> {
    try {
    if (!id) return null;

    const { data } = await serverApi.get(`/api/therapists/profile/${id}`, {
      withCredentials: true, // use cookies for auth
    });

    if (!data?.data) return null;

    const item = data.data;
    const therapist: Therapist = {
      id: item.id,
      user_id: item.user_id,
      name: item.name,
      specialty: item.specialty,
      line1: item.address_line1,
      line2: item.address_line2,
      city: item.city,
      state: item.state,
      pin: item.pin,
      country: 'India', // or map from DB if available
      position: item.position as GeoPoint,
      rating: item.rating || 0,
      reviews: item.reviews || 0,
      image: item.image || '',
      experience: item.experience || 0,
      bio: item.bio || '',
      qualifications: item.qualification || '',
      serviceTypes: item.serviceTypes || [],
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
      registrationNo:item.registration_no,
      bankAccountNo:item.bank_account_number,
      bankIfscCode:item.bank_ifsc_code,
      lat: item?.lat || 0, 
      lng: item?.lng || 0,
      fullAddress: item?.fullAddress || '',
      tax: item
        ? {
            pan: item.pan_number || '',
            panVerified: item.panVerified,
            lastPanUpdatedAt: item.lastPanUpdatedAt,
        }
        : undefined,
    };
console.log("Therapist Data Id :",therapist);
    return therapist;
  } catch (error: any) {
    console.error('GET THERAPIST BY ID ERROR:', error?.message);
    return null;
  }
}
