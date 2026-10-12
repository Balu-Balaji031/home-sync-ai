import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import type { Device } from '../types/device';

export const deviceService = {
  async getDevices(userId: string): Promise<Device[]> {
    const q = query(collection(db, 'devices'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Device));
  },

  async addDevice(deviceData: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'devices'), {
      ...deviceData,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async updateDevice(deviceId: string, updateData: Partial<Omit<Device, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, 'devices', deviceId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteDevice(deviceId: string): Promise<void> {
    const docRef = doc(db, 'devices', deviceId);
    await deleteDoc(docRef);
  }
};
