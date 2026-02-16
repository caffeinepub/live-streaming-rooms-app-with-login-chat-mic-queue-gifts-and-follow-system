import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface MicRequest {
    user: Principal;
    requestedAt: Time;
}
export interface AudioClip {
    data: Uint8Array;
    user: Principal;
    timestamp: Time;
}
export interface FollowerCount {
    followers: bigint;
    following: bigint;
}
export interface GiftTransaction {
    recipient: Principal;
    sender: Principal;
    timestamp: Time;
    giftId: bigint;
}
export interface Room {
    id: bigint;
    title: string;
    owner: Principal;
    createdAt: Time;
    description?: string;
}
export interface Group {
    id: bigint;
    owner: Principal;
    name: string;
    createdAt: Time;
    description?: string;
}
export interface ChatMessage {
    content: string;
    sender: Principal;
    timestamp: Time;
}
export interface UserProfile {
    displayName: string;
    createdAt: Time;
    avatarUrl?: string;
}
export interface GiftItem {
    id: bigint;
    cost: bigint;
    icon: string;
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptMicRequest(roomId: bigint, user: Principal): Promise<void>;
    addBalance(amount: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createGroup(name: string, description: string | null): Promise<bigint>;
    createRoom(title: string, description: string | null): Promise<bigint>;
    follow(followee: Principal): Promise<void>;
    generateAudienceToken(roomId: bigint, userId: string): Promise<string>;
    generateHostToken(roomId: bigint, userId: string): Promise<string>;
    getAllRooms(): Promise<Array<Room>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getAudioClips(roomId: bigint): Promise<Array<AudioClip>>;
    getBalance(): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentMicHolder(roomId: bigint): Promise<Principal | null>;
    getFollowerCount(user: Principal): Promise<FollowerCount>;
    getGiftCatalog(): Promise<Array<GiftItem>>;
    getGiftHistory(user: Principal): Promise<Array<GiftTransaction>>;
    getGroup(groupId: bigint): Promise<Group | null>;
    getGroupMembers(groupId: bigint): Promise<Array<Principal>>;
    getGroupMessages(groupId: bigint): Promise<Array<ChatMessage>>;
    getMessages(roomId: bigint): Promise<Array<ChatMessage>>;
    getMicQueue(roomId: bigint): Promise<Array<MicRequest>>;
    getRoom(roomId: bigint): Promise<Room | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isFollowing(follower: Principal, followee: Principal): Promise<boolean>;
    isGroupMember(groupId: bigint, user: Principal): Promise<boolean>;
    joinGroup(groupId: bigint): Promise<void>;
    leaveGroup(groupId: bigint): Promise<void>;
    listGroups(): Promise<Array<Group>>;
    recordAudioClip(roomId: bigint, data: Uint8Array): Promise<void>;
    requestMic(roomId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendGift(recipient: Principal, giftId: bigint): Promise<void>;
    sendGroupMessage(groupId: bigint, content: string): Promise<void>;
    sendMessage(roomId: bigint, content: string): Promise<void>;
    storeZegoCredentials(secretId: string, appId: string): Promise<void>;
    unfollow(followee: Principal): Promise<void>;
}
