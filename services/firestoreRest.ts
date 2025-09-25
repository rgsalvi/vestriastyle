import { auth } from './firebase';

const PROJECT_ID = 'ai-wardrobe-curator';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function idToken(): Promise<string | undefined> {
  try { return await auth.currentUser?.getIdToken(); } catch { return undefined; }
}

interface FirestoreValue { [k: string]: any }

// Convert plain object to Firestore document JSON (shallow for our profile use-case)
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    switch (typeof v) {
      case 'string': fields[k] = { stringValue: v }; break;
      case 'number': fields[k] = Number.isInteger(v) ? { integerValue: v } : { doubleValue: v }; break;
      case 'boolean': fields[k] = { booleanValue: v }; break;
      case 'object':
        if (Array.isArray(v)) {
          fields[k] = { arrayValue: { values: v.map(iv => ({ stringValue: String(iv) })) } };
        } else {
          fields[k] = { mapValue: { fields: toFirestoreFields(v) } };
        }
        break;
      default:
        break;
    }
  });
  return fields;
}

function fromFirestoreFields(doc: any): any {
  if (!doc || !doc.fields) return null;
  const out: any = {};
  for (const [k, v] of Object.entries<any>(doc.fields)) {
    if (v.stringValue !== undefined) out[k] = v.stringValue;
    else if (v.integerValue !== undefined) out[k] = Number(v.integerValue);
    else if (v.doubleValue !== undefined) out[k] = v.doubleValue;
    else if (v.booleanValue !== undefined) out[k] = v.booleanValue;
    else if (v.arrayValue !== undefined) out[k] = (v.arrayValue.values || []).map((iv: any) => iv.stringValue ?? null);
    else if (v.mapValue !== undefined) out[k] = fromFirestoreFields({ fields: v.mapValue.fields || {} });
  }
  return out;
}

export async function restGetDocument(path: string): Promise<any | null> {
  const token = await idToken();
  const url = `${BASE}/${path}`;
  const res = await fetch(`${url}?alt=json`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`REST get failed ${res.status}`);
  const json = await res.json();
  return fromFirestoreFields(json);
}

export async function restPatchDocument(path: string, data: Record<string, any>): Promise<void> {
  const token = await idToken();
  const url = `${BASE}/${path}`;
  const body = JSON.stringify({ fields: toFirestoreFields(data) });
  const res = await fetch(`${url}?alt=json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST patch failed ${res.status}: ${text}`);
  }
}
