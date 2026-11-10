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
  limit,
  onSnapshot,
  Unsubscribe,
  arrayUnion,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';

export interface UserProfile {
  uid: string;
  accountName: string;
  avatarUrl?: string;
  friendCode: string;
  friends: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FriendRequestDoc {
  id: string;
  fromUid: string;
  fromName: string;
  fromFriendCode: string;
  toUid: string;
  toName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface RoomInviteDoc {
  id: string;
  roomId: string;
  roomCode: string;
  roomName: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  createdAt: string;
}

function generateFriendCode(uid: string): string {
  const clean = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = clean.slice(-4).padStart(4, '8');
  const randomDigits = Math.floor(10 + Math.random() * 90);
  return `CT${randomDigits}${suffix}`;
}

// 1. Get User Profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// 2. Register or Update User Account Name (Login / Account Setup)
export async function registerOrUpdateUserProfile(
  uid: string,
  accountName: string
): Promise<UserProfile> {
  const cleanName = accountName.trim().slice(0, 50);
  const userRef = doc(db, 'users', uid);
  const path = `users/${uid}`;

  try {
    const existingSnap = await getDoc(userRef);
    const now = new Date().toISOString();

    if (existingSnap.exists()) {
      const existing = existingSnap.data() as UserProfile;
      const updated: UserProfile = {
        ...existing,
        accountName: cleanName,
        updatedAt: now,
      };
      await setDoc(userRef, updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('tabletop_player_name', cleanName);
        localStorage.setItem('tabletop_account_logged_in', '1');
      }
      return updated;
    }

    const newProfile: UserProfile = {
      uid,
      accountName: cleanName,
      friendCode: generateFriendCode(uid),
      friends: [],
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(userRef, newProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tabletop_player_name', cleanName);
      localStorage.setItem('tabletop_account_logged_in', '1');
    }
    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 3. Find existing account by exact Account Name or Friend Code (for logging back into an existing account or searching friends)
export async function findUsersByQuery(
  searchText: string,
  excludeUid?: string
): Promise<UserProfile[]> {
  const trimmed = searchText.trim();
  if (!trimmed) return [];
  const path = 'users';

  try {
    const snap = await getDocs(query(collection(db, 'users'), limit(50)));
    const qLower = trimmed.toLowerCase();
    const results: UserProfile[] = [];

    snap.docs.forEach((d) => {
      const data = d.data() as UserProfile;
      if (excludeUid && data.uid === excludeUid) return;
      const matchName = data.accountName.toLowerCase().includes(qLower);
      const matchCode = data.friendCode.toLowerCase().includes(qLower);
      const matchUid = data.uid.toLowerCase() === qLower;
      if (matchName || matchCode || matchUid) {
        results.push(data);
      }
    });

    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// 4. Listen to current user's profile in real time
export function listenToUserProfile(
  uid: string,
  onUpdate: (profile: UserProfile | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as UserProfile);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    }
  );
}

// 5. Send a Friend Request
export async function sendFriendRequest(
  fromProfile: UserProfile,
  toProfile: UserProfile
): Promise<void> {
  if (fromProfile.uid === toProfile.uid) {
    throw new Error('ไม่สามารถเพิ่มตัวเองเป็นเพื่อนได้');
  }
  if (fromProfile.friends.includes(toProfile.uid)) {
    throw new Error(`คุณเป็นเพื่อนกับ ${toProfile.accountName} อยู่แล้ว`);
  }

  const requestId = `freq_${fromProfile.uid}_${toProfile.uid}`;
  const path = `friend_requests/${requestId}`;

  const payload: Omit<FriendRequestDoc, 'id'> = {
    fromUid: fromProfile.uid,
    fromName: fromProfile.accountName,
    fromFriendCode: fromProfile.friendCode,
    toUid: toProfile.uid,
    toName: toProfile.accountName,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'friend_requests', requestId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 6. Accept or Decline Friend Request
export async function respondToFriendRequest(
  request: FriendRequestDoc,
  accept: boolean
): Promise<void> {
  const reqRef = doc(db, 'friend_requests', request.id);
  try {
    if (accept) {
      await updateDoc(reqRef, { status: 'accepted' });
      // Add each other to friends list in /users/{uid}
      await updateDoc(doc(db, 'users', request.fromUid), {
        friends: arrayUnion(request.toUid),
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'users', request.toUid), {
        friends: arrayUnion(request.fromUid),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await deleteDoc(reqRef);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `friend_requests/${request.id}`);
  }
}

// 7. Listen to Incoming Pending Friend Requests
export function listenToIncomingFriendRequests(
  uid: string,
  onUpdate: (requests: FriendRequestDoc[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'friend_requests'),
    where('toUid', '==', uid),
    where('status', '==', 'pending')
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: FriendRequestDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FriendRequestDoc, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'friend_requests');
    }
  );
}

// 8. Listen to Outgoing Pending Friend Requests
export function listenToOutgoingFriendRequests(
  uid: string,
  onUpdate: (requests: FriendRequestDoc[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'friend_requests'),
    where('fromUid', '==', uid),
    where('status', '==', 'pending')
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: FriendRequestDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FriendRequestDoc, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'friend_requests');
    }
  );
}

// 9. Fetch Full UserProfiles for a list of Friend UIDs
export async function getFriendsProfiles(friendUids: string[]): Promise<UserProfile[]> {
  if (!friendUids || friendUids.length === 0) return [];
  const profiles: UserProfile[] = [];
  for (const fUid of friendUids) {
    try {
      const snap = await getDoc(doc(db, 'users', fUid));
      if (snap.exists()) {
        profiles.push(snap.data() as UserProfile);
      }
    } catch {
      // Skip missing friend doc
    }
  }
  return profiles;
}

// 10. Send Room Invite to an Accepted Friend
export async function sendRoomInviteToFriend(
  room: { id: string; roomCode: string; roomName?: string },
  fromProfile: UserProfile,
  toUid: string
): Promise<void> {
  const inviteId = `inv_${room.roomCode}_${fromProfile.uid}_${toUid}`;
  const path = `room_invites/${inviteId}`;
  try {
    await setDoc(doc(db, 'room_invites', inviteId), {
      roomId: room.id,
      roomCode: room.roomCode,
      roomName: room.roomName || `โต๊ะหนูขโมยชีส #${room.roomCode}`,
      fromUid: fromProfile.uid,
      fromName: fromProfile.accountName,
      toUid,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 11. Listen to Incoming Room Invites from Friends
export function listenToRoomInvites(
  uid: string,
  onUpdate: (invites: RoomInviteDoc[]) => void
): Unsubscribe {
  const q = query(collection(db, 'room_invites'), where('toUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: RoomInviteDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<RoomInviteDoc, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'room_invites');
    }
  );
}

// 12. Dismiss / Delete a Room Invite
export async function dismissRoomInvite(inviteId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'room_invites', inviteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `room_invites/${inviteId}`);
  }
}

// 13. Update User Profile Avatar (Photo or Preset Data URL)
export async function updateUserAvatar(
  uid: string,
  avatarUrl: string
): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const path = `users/${uid}`;
  try {
    const now = new Date().toISOString();
    await updateDoc(userRef, {
      avatarUrl,
      updatedAt: now,
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('tabletop_player_avatar', avatarUrl);
    }
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// 14. Instant Mutual Friend by FriendCode or UID (Used by QR Code & Instant Link)
export async function addInstantMutualFriendByCodeOrUid(
  myProfile: UserProfile,
  codeOrUid: string
): Promise<UserProfile> {
  const clean = codeOrUid.trim();
  if (!clean) {
    throw new Error('ไม่พบรหัสเพื่อนจาก QR Code หรือลิงก์');
  }

  // Extract friend code if full URL was scanned
  let extractedCode = clean;
  try {
    if (clean.includes('addFriend=')) {
      const urlObj = new URL(clean, window.location.origin);
      const param = urlObj.searchParams.get('addFriend');
      if (param) extractedCode = param.trim();
    }
  } catch {
    // Keep raw string
  }

  const matches = await findUsersByQuery(extractedCode, myProfile.uid);
  const qLower = extractedCode.toLowerCase();
  const targetUser =
    matches.find(
      (u) =>
        u.friendCode.toLowerCase() === qLower ||
        u.uid.toLowerCase() === qLower ||
        u.accountName.toLowerCase() === qLower
    ) || matches[0];

  if (!targetUser) {
    throw new Error(`ไม่พบบัญชีผู้ใช้จากรหัส "${extractedCode}"`);
  }

  if (targetUser.uid === myProfile.uid) {
    throw new Error('ไม่สามารถแอดตัวเองเป็นเพื่อนได้');
  }

  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'users', myProfile.uid), {
      friends: arrayUnion(targetUser.uid),
      updatedAt: now,
    });
    await updateDoc(doc(db, 'users', targetUser.uid), {
      friends: arrayUnion(myProfile.uid),
      updatedAt: now,
    });
    return targetUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${myProfile.uid}`);
  }
}

// 15. Instant Mutual Friend from Same-Room Player Seat (1-Click Add in Lobby)
export async function addInstantFriendFromRoomSeat(
  myProfile: UserProfile,
  seatPlayer: { id: string; name: string; avatarUrl?: string }
): Promise<UserProfile> {
  if (seatPlayer.id === myProfile.uid) {
    throw new Error('ไม่สามารถแอดตัวเองเป็นเพื่อนได้');
  }

  const now = new Date().toISOString();
  const targetRef = doc(db, 'users', seatPlayer.id);

  try {
    const targetSnap = await getDoc(targetRef);
    let targetProfile: UserProfile;

    if (targetSnap.exists()) {
      const existing = targetSnap.data() as UserProfile;
      await updateDoc(targetRef, {
        friends: arrayUnion(myProfile.uid),
        updatedAt: now,
      });
      targetProfile = {
        ...existing,
        friends: existing.friends.includes(myProfile.uid)
          ? existing.friends
          : [...existing.friends, myProfile.uid],
      };
    } else {
      // Ensure target seat player has a UserProfile document
      targetProfile = {
        uid: seatPlayer.id,
        accountName: seatPlayer.name.slice(0, 50),
        ...(seatPlayer.avatarUrl ? { avatarUrl: seatPlayer.avatarUrl } : {}),
        friendCode: generateFriendCode(seatPlayer.id),
        friends: [myProfile.uid],
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(targetRef, targetProfile);
    }

    await updateDoc(doc(db, 'users', myProfile.uid), {
      friends: arrayUnion(seatPlayer.id),
      updatedAt: now,
    });

    return targetProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${myProfile.uid}`);
  }
}


