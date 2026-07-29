import { getToken } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL;

/* =========================
    LIST CATEGORIES
   ========================= */
export async function listProductCategories() {
     const token = await getToken();
    
    if (!token) {
         throw new Error('Token missing, please login again');
    }
    
  const res = await fetch(`${API}/api/category/list`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    cache: 'no-store'
  });

  const data = await res.json();
        console.log(data);

  if (!res.ok || data.success === false) {
    const errorMsg = data.message || data.error || (data.errors && Object.values(data.errors).flat().join(", ")) || 'Failed to fetch categories';
    throw new Error(errorMsg);
  }

  return data;
}

/* =========================
    ADD CATEGORY
   ========================= */
export async function addProductCategory(
  token: string,
  payload: {
    name: string;
    description: string;
    image_id: number;
    status: boolean;
  }
) {
  const res = await fetch(`${API}/api/category/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || data.success === false) {
    const errorMsg = data.message || data.error || (data.errors && Object.values(data.errors).flat().join(", ")) || 'Failed to add category';
    throw new Error(errorMsg);
  }

  return data;
}

/* =========================
     Update CATEGORY
   ========================= */
export async function updateCategory(
  id: number | string,
  payload: {
    name?: string;
    description?: string;
    image_id?: number;
    is_active?: boolean;
  },
  token: string
) {
  const res = await fetch(`${API}/api/category/edit/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || data.success === false) {
    const errorMsg = data.message || data.error || (data.errors && Object.values(data.errors).flat().join(", ")) || 'Failed to update category';
    throw new Error(errorMsg);
  }

  return data;
}




/* =========================
     DELETE CATEGORY
   ========================= */
export async function deleteProductCategory(
  id: number | string,
  token: string
) {
  const res = await fetch(`${API}/api/category/delete/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok || data.success === false) {
    const errorMsg = data.message || data.error || (data.errors && Object.values(data.errors).flat().join(", ")) || 'Failed to delete category';
    throw new Error(errorMsg);
  }

  return data;
}

/* =========================
    SUBCATEGORIES API
   ========================= */

export async function listAllSubCategories() {
    const token = await getToken();
    if (!token) throw new Error('Token missing, please login again');
    
    const res = await fetch(`${API}/api/subcategory/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      cache: 'no-store'
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch subcategories');
    return data;
}

export async function addSubCategory(
    token: string,
    payload: {
      category_id: number | string;
      name: string;
      status: boolean;
    }
  ) {
    const res = await fetch(`${API}/api/subcategory/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Failed to add subcategory');
    }
    return data;
}

export async function updateSubCategory(
    id: number | string,
    payload: {
      category_id?: number | string;
      name?: string;
      status?: boolean;
    },
    token: string
  ) {
    const res = await fetch(`${API}/api/subcategory/edit/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Failed to update subcategory');
    }
    return data;
}

export async function deleteSubCategory(id: number | string, token: string) {
    const res = await fetch(`${API}/api/subcategory/delete/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Failed to delete subcategory');
    }
    return data;
}
