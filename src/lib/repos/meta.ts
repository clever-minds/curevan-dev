
'use server';

export async function getIndianStates(): Promise<string[]> {
    return [
      "Andaman and Nicobar Islands",
      "Andhra Pradesh",
      "Arunachal Pradesh",
      "Assam",
      "Bihar",
      "Chandigarh",
      "Chhattisgarh",
      "Dadra and Nagar Haveli and Daman and Diu",
      "Delhi",
      "Goa",
      "Gujarat",
      "Haryana",
      "Himachal Pradesh",
      "Jammu and Kashmir",
      "Jharkhand",
      "Karnataka",
      "Kerala",
      "Ladakh",
      "Lakshadweep",
      "Madhya Pradesh",
      "Maharashtra",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Odisha",
      "Puducherry",
      "Punjab",
      "Rajasthan",
      "Sikkim",
      "Tamil Nadu",
      "Telangana",
      "Tripura",
      "Uttar Pradesh",
      "Uttarakhand",
      "West Bengal"
    ];
}

export async function getRoles(): Promise<string[]> {
    return ['user', 'therapist', 'admin.ecom', 'admin.therapy', 'admin.super'];
}

export async function getTherapyCategories(): Promise<string[]> {
    // In a real app, this might also come from a 'therapyCategories' collection
    return [
      'Physiotherapy', 'Nursing Care', 'Geri care Therapy', 'Speech Therapy',
      'Mental Health Counseling', 'Dietitian/Nutritionist', 'Respiratory Therapy',
      'Operations', 'Earnings', 'Clinical'
    ];
}
