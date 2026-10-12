import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../../../services/firebase';

export type UserRole = 'customer' | 'technician' | 'admin';

export interface UserSettings {
  notificationPreferences: {
    serviceUpdates: boolean;
    aiUpdates: boolean;
    accountSecurityAlerts: boolean;
    newTechnicianApplication?: boolean;
    assessmentUpdates?: boolean;
    finalApprovalRequired?: boolean;
    newServiceRequest?: boolean;
    newJobAssignments?: boolean;
    jobStatusUpdates?: boolean;
    technicianAssessmentUpdates?: boolean;
    applicationUpdates?: boolean;
    adminMessages?: boolean;
  };
  appLanguage: string;
  preferredServiceTime: string;
  technicianPreferences?: {
    contactMethod?: 'Email' | 'SMS' | 'Phone Call';
    preferredJobTypes?: string[];
    maximumTravelDistance?: string;
    jobAssignmentNotifications?: boolean;
    outsidePreferredHours?: boolean;
  };
}

export interface TechnicianProfile {
  yearsOfExperience: string;
  professionalDescription: string;
  specializations: string[];
  skills: string[];
  languages: string[];
  serviceArea: {
    city: string;
    state: string;
    pincodes: string;
    serviceRadius: string;
  };
  availability: {
    workingDays: string[];
    startTime: string;
    endTime: string;
  };
}

export type TechnicianApplicationStatus =
  | 'NOT_APPLIED'
  | 'DRAFT'
  | 'READY_TO_SUBMIT'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'CHANGES_REQUIRED'
  | 'APPROVED_FOR_ASSESSMENT'
  | 'ASSESSMENT_SCHEDULED'
  | 'ASSESSMENT_COMPLETED'
  | 'FINAL_APPROVED'
  | 'REJECTED';

export interface TechnicianApplication {
  status: TechnicianApplicationStatus;
  submittedAt?: unknown;
  updatedAt?: unknown;
  feedback?: string;
  rejectionReason?: string;
  approvedForAssessmentAt?: unknown;
  finalApprovedAt?: unknown;
  assessment?: TechnicianAssessment;
}

export interface TechnicianAssessment {
  centerId: string;
  centerName: string;
  centerAddress: string;
  specializationTrack: string;
  assessmentDate: string;
  assessmentTime: string;
  instructions: string;
  score?: number | null;
  evaluationNotes?: string | null;
  result?: 'PASS' | 'FAIL' | null;
  assignedAt?: unknown;
  evaluatedAt?: unknown;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  mobileNumber?: string;
  preferredLanguage?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  role: UserRole;
  createdAt: string;
  settings?: UserSettings;
  technicianProfile?: TechnicianProfile;
  application?: TechnicianApplication;
}

export const authService = {
  async registerUser(
    data: Omit<UserProfile, 'uid' | 'createdAt'> & { password: string }
  ): Promise<User> {
    const { email, password, fullName, mobileNumber, preferredLanguage, role } = data;
    
    // 1. Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Save profile to Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      fullName,
      email,
      mobileNumber,
      preferredLanguage,
      role,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    // 3. Send email verification
    await sendEmailVerification(user);

    return user;
  },

  async registerAdmin(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });

    await sendEmailVerification(user);
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  },

  async updateUserProfile(uid: string, data: Partial<Pick<UserProfile, 'fullName' | 'mobileNumber' | 'preferredLanguage' | 'addressLine1' | 'addressLine2' | 'city' | 'state' | 'pincode' | 'landmark'>>): Promise<void> {
    await updateDoc(doc(db, 'users', uid), data);
  },

  async updateUserSettings(uid: string, settings: UserSettings): Promise<void> {
    await updateDoc(doc(db, 'users', uid), { settings });
  },

  async updateTechnicianProfile(
    uid: string,
    data: Pick<UserProfile, 'fullName' | 'mobileNumber'> & { technicianProfile: TechnicianProfile }
  ): Promise<void> {
    await updateDoc(doc(db, 'users', uid), data);
  },

  async submitTechnicianApplication(uid: string): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      application: {
        status: 'UNDER_REVIEW',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    });
  },

  async getPendingTechnicianApplications(): Promise<UserProfile[]> {
    const applicationsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'technician'),
      where('application.status', '==', 'UNDER_REVIEW'),
    );
    const snapshot = await getDocs(applicationsQuery);
    return snapshot.docs.map((application) => application.data() as UserProfile);
  },

  async getAssessmentTechnicians(): Promise<UserProfile[]> {
    const statuses: TechnicianApplicationStatus[] = [
      'APPROVED_FOR_ASSESSMENT',
      'ASSESSMENT_SCHEDULED',
      'ASSESSMENT_COMPLETED',
    ];
    const snapshots = await Promise.all(statuses.map((status) => getDocs(query(
      collection(db, 'users'),
      where('role', '==', 'technician'),
      where('application.status', '==', status),
    ))));
    const profiles = snapshots.flatMap((snapshot) =>
      snapshot.docs.map((technician) => technician.data() as UserProfile),
    );
    return Array.from(new Map(profiles.map((profile) => [profile.uid, profile])).values());
  },

  async getFinalApprovalTechnicians(): Promise<UserProfile[]> {
    const snapshot = await getDocs(query(
      collection(db, 'users'),
      where('role', '==', 'technician'),
      where('application.status', '==', 'ASSESSMENT_COMPLETED'),
    ));
    return snapshot.docs
      .map((technician) => technician.data() as UserProfile)
      .filter((technician) => technician.application?.assessment?.result === 'PASS');
  },

  async getApprovedTechnicians(): Promise<UserProfile[]> {
    const snapshot = await getDocs(query(
      collection(db, 'users'),
      where('role', '==', 'technician'),
      where('application.status', '==', 'FINAL_APPROVED'),
    ));
    return snapshot.docs.map((technician) => technician.data() as UserProfile);
  },

  async getCustomers(): Promise<UserProfile[]> {
    const snapshot = await getDocs(query(
      collection(db, 'users'),
      where('role', '==', 'customer'),
    ));
    return snapshot.docs.map((customer) => customer.data() as UserProfile);
  },

  async updateFinalTechnicianApproval(
    uid: string,
    decision: 'FINAL_APPROVED' | 'REJECTED',
    rejectionReason?: string,
  ): Promise<void> {
    const applicationUpdate: Record<string, unknown> = {
      'application.status': decision,
      'application.updatedAt': serverTimestamp(),
    };
    if (decision === 'FINAL_APPROVED') {
      applicationUpdate['application.finalApprovedAt'] = serverTimestamp();
    } else if (rejectionReason) {
      applicationUpdate['application.rejectionReason'] = rejectionReason;
    }
    await updateDoc(doc(db, 'users', uid), applicationUpdate);
  },

  async assignTechnicianAssessment(
    uid: string,
    assessment: Omit<TechnicianAssessment, 'score' | 'evaluationNotes' | 'result' | 'assignedAt' | 'evaluatedAt'>,
  ): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      'application.status': 'ASSESSMENT_SCHEDULED',
      'application.assessment': {
        ...assessment,
        score: null,
        evaluationNotes: null,
        result: null,
        assignedAt: serverTimestamp(),
        evaluatedAt: null,
      },
      'application.updatedAt': serverTimestamp(),
    });
  },

  async evaluateTechnicianAssessment(
    uid: string,
    score: number,
    evaluationNotes: string,
    result: 'PASS' | 'FAIL',
  ): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      'application.status': 'ASSESSMENT_COMPLETED',
      'application.assessment.score': score,
      'application.assessment.evaluationNotes': evaluationNotes,
      'application.assessment.result': result,
      'application.assessment.evaluatedAt': serverTimestamp(),
      'application.updatedAt': serverTimestamp(),
    });
  },

  async updateTechnicianApplication(
    uid: string,
    data: {
      status: TechnicianApplicationStatus;
      feedback?: string;
      rejectionReason?: string;
      approvedForAssessmentAt?: unknown;
    },
  ): Promise<void> {
    const applicationUpdate: Record<string, unknown> = {
      'application.status': data.status,
      'application.updatedAt': serverTimestamp(),
    };
    if (data.feedback !== undefined) applicationUpdate['application.feedback'] = data.feedback;
    if (data.rejectionReason !== undefined) applicationUpdate['application.rejectionReason'] = data.rejectionReason;
    if (data.approvedForAssessmentAt !== undefined) {
      applicationUpdate['application.approvedForAssessmentAt'] = data.approvedForAssessmentAt;
    }
    await updateDoc(doc(db, 'users', uid), applicationUpdate);
  },

  async changePassword(currentUser: User, currentPassword: string, newPassword: string): Promise<void> {
    const credential = EmailAuthProvider.credential(currentUser.email || '', currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  },

  async deleteAccount(currentUser: User): Promise<void> {
    const token = await currentUser.getIdToken();
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const response = await fetch(`${apiBase}/account`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Unable to delete account.');
    }
    await signOut(auth);
  },
};
