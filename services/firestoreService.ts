import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    DocumentData,
    QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';

export const subscribeToCollection = <T>(
    collectionName: string,
    callback: (data: T[]) => void,
    constraints: QueryConstraint[] = []
) => {
    const q = query(collection(db, collectionName), ...constraints);
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as unknown as T[];
        callback(data);
    });
};

export const addItem = async <T extends DocumentData>(collectionName: string, item: T) => {
    return await addDoc(collection(db, collectionName), item);
};

export const updateItem = async <T extends DocumentData>(collectionName: string, id: string, updates: Partial<T>) => {
    const docRef = doc(db, collectionName, id);
    return await updateDoc(docRef, updates);
};

export const deleteItem = async (collectionName: string, id: string) => {
    const docRef = doc(db, collectionName, id);
    return await deleteDoc(docRef);
};

export const getItems = async <T>(collectionName: string, constraints: QueryConstraint[] = []) => {
    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as unknown as T[];
};
