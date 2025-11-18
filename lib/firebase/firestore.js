// ==================== FIRESTORE UTILITIES ====================
// Centralized Firestore database functions
// Replaces Supabase database operations

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';

/**
 * Get a single document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} Document data or null
 */
export async function getDocument(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get all documents from a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} constraints - Query constraints (where, orderBy, limit)
 * @returns {Promise<Array>} Array of documents
 */
export async function getDocuments(collectionName, constraints = {}) {
  try {
    const colRef = collection(db, collectionName);
    let q = colRef;

    // Apply where clauses
    if (constraints.where) {
      constraints.where.forEach(([field, operator, value]) => {
        q = query(q, where(field, operator, value));
      });
    }

    // Apply orderBy
    if (constraints.orderBy) {
      const [field, direction = 'asc'] = constraints.orderBy;
      q = query(q, orderBy(field, direction));
    }

    // Apply limit
    if (constraints.limit) {
      q = query(q, limit(constraints.limit));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Create a new document
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Document data
 * @param {string} docId - Optional document ID (if not provided, auto-generated)
 * @returns {Promise<string>} Document ID
 */
export async function createDocument(collectionName, data, docId = null) {
  try {
    const timestamp = serverTimestamp();
    const docData = {
      ...data,
      created_at: timestamp,
      updated_at: timestamp
    };

    if (docId) {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, docData);
      return docId;
    } else {
      const docRef = await addDoc(collection(db, collectionName), docData);
      return docRef.id;
    }
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Update an existing document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
export async function updateDocument(collectionName, docId, data) {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete a document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export async function deleteDocument(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Set document data (create or overwrite)
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {Object} data - Document data
 * @returns {Promise<void>}
 */
export async function setDocument(collectionName, docId, data) {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Increment a numeric field
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {string} field - Field name
 * @param {number} value - Value to increment (can be negative)
 * @returns {Promise<void>}
 */
export async function incrementField(collectionName, docId, field, value = 1) {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      [field]: increment(value),
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error incrementing field in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Add item to array field
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {string} field - Field name
 * @param {*} value - Value to add
 * @returns {Promise<void>}
 */
export async function addToArray(collectionName, docId, field, value) {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      [field]: arrayUnion(value),
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error adding to array in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Remove item from array field
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {string} field - Field name
 * @param {*} value - Value to remove
 * @returns {Promise<void>}
 */
export async function removeFromArray(collectionName, docId, field, value) {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      [field]: arrayRemove(value),
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error removing from array in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Execute a Firestore transaction
 * @param {Function} transactionFn - Transaction callback function
 * @returns {Promise<*>} Transaction result
 */
export async function executeTransaction(transactionFn) {
  try {
    return await runTransaction(db, transactionFn);
  } catch (error) {
    console.error('Error executing transaction:', error);
    throw error;
  }
}

/**
 * Execute a batch write operation
 * @param {Function} batchFn - Batch callback function that receives batch object
 * @returns {Promise<void>}
 */
export async function executeBatch(batchFn) {
  try {
    const batch = writeBatch(db);
    await batchFn(batch);
    await batch.commit();
  } catch (error) {
    console.error('Error executing batch:', error);
    throw error;
  }
}

/**
 * Get document reference
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {DocumentReference} Document reference
 */
export function getDocRef(collectionName, docId) {
  return doc(db, collectionName, docId);
}

/**
 * Get collection reference
 * @param {string} collectionName - Name of the collection
 * @returns {CollectionReference} Collection reference
 */
export function getCollectionRef(collectionName) {
  return collection(db, collectionName);
}

export default {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  setDocument,
  incrementField,
  addToArray,
  removeFromArray,
  executeTransaction,
  executeBatch,
  getDocRef,
  getCollectionRef
};
