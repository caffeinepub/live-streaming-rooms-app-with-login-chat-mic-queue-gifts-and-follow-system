import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import List "mo:core/List";
import Timer "mo:core/Timer";
import Text "mo:core/Text";
import Blob "mo:core/Blob";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import VarArray "mo:core/VarArray";
import Order "mo:core/Order";
import Iter "mo:core/Iter";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// (with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var zegoServerSecretId : ?Text = null;
  var zegoAppId : ?Text = null;

  ////////////////////
  // User Profiles //
  ////////////////////

  public type UserProfile = {
    displayName : Text;
    avatarUrl : ?Text;
    createdAt : Time.Time;
  };

  module UserProfile {
    public func compare(profile1 : UserProfile, profile2 : UserProfile) : Order.Order {
      switch (Text.compare(profile1.displayName, profile2.displayName)) {
        case (#equal) { Int.compare(profile1.createdAt, profile2.createdAt) };
        case (order) { order };
      };
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, { profile with createdAt = Time.now() });
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    // Public data - anyone can view user list
    userProfiles.values().toArray();
  };

  /////////
  // Rooms //
  /////////

  public type Room = {
    id : Nat;
    owner : Principal;
    title : Text;
    description : ?Text;
    createdAt : Time.Time;
  };

  module Room {
    public func compare(room1 : Room, room2 : Room) : Order.Order {
      switch (Text.compare(room1.title, room2.title)) {
        case (#equal) { Int.compare(room1.createdAt, room2.createdAt) };
        case (order) { order };
      };
    };
  };

  let rooms = Map.empty<Nat, Room>();
  var nextRoomId = 1;

  public shared ({ caller }) func createRoom(title : Text, description : ?Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create rooms");
    };
    let roomId = nextRoomId;
    nextRoomId += 1;

    let room : Room = {
      id = roomId;
      owner = caller;
      title;
      description;
      createdAt = Time.now();
    };
    rooms.add(roomId, room);
    roomId;
  };

  public query ({ caller }) func getRoom(roomId : Nat) : async ?Room {
    // Public - all users can view rooms
    rooms.get(roomId);
  };

  public query ({ caller }) func getAllRooms() : async [Room] {
    // Public - all users can view room list
    rooms.values().toArray();
  };

  /////////
  // Chat //
  /////////

  public type ChatMessage = {
    sender : Principal;
    content : Text;
    timestamp : Time.Time;
  };

  let roomChats = Map.empty<Nat, List.List<ChatMessage>>();

  public shared ({ caller }) func sendMessage(roomId : Nat, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    let message : ChatMessage = { sender = caller; content; timestamp = Time.now() };
    let messages = switch (roomChats.get(roomId)) {
      case (?msgs) { msgs };
      case (null) { List.empty<ChatMessage>() };
    };
    messages.add(message);
    roomChats.add(roomId, messages);
  };

  public query ({ caller }) func getMessages(roomId : Nat) : async [ChatMessage] {
    // Public - anyone viewing the room can see messages
    switch (roomChats.get(roomId)) {
      case (null) { [] };
      case (?msgs) { msgs.toArray() };
    };
  };

  //////////////////
  // Mic System  //
  //////////////////

  public type MicRequest = {
    user : Principal;
    requestedAt : Time.Time;
  };

  let roomMicQueues = Map.empty<Nat, List.List<MicRequest>>();
  let roomMicHolders = Map.empty<Nat, ?Principal>();

  public shared ({ caller }) func requestMic(roomId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request mic");
    };
    let request : MicRequest = { user = caller; requestedAt = Time.now() };
    let queue = switch (roomMicQueues.get(roomId)) {
      case (?requests) { requests };
      case (null) { List.empty<MicRequest>() };
    };
    queue.add(request);
    roomMicQueues.add(roomId, queue);
  };

  public shared ({ caller }) func acceptMicRequest(roomId : Nat, user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept mic requests");
    };
    switch (rooms.get(roomId)) {
      case (?room) {
        if (room.owner != caller) {
          Runtime.trap("Unauthorized: Only room owner can accept mic requests");
        };
        roomMicHolders.add(roomId, ?user);
        switch (roomMicQueues.get(roomId)) {
          case (?requests) {
            let filtered = requests.filter(func(req) { req.user != user });
            roomMicQueues.add(roomId, filtered);
          };
          case (null) {};
        };
      };
      case (null) { Runtime.trap("Room not found") };
    };
  };

  public query ({ caller }) func getCurrentMicHolder(roomId : Nat) : async ?Principal {
    // Public - anyone can see who has the mic
    switch (roomMicHolders.get(roomId)) {
      case (?holder) { holder };
      case (null) { null };
    };
  };

  public query ({ caller }) func getMicQueue(roomId : Nat) : async [MicRequest] {
    // Public - anyone can see the mic queue
    switch (roomMicQueues.get(roomId)) {
      case (null) { [] };
      case (?requests) { requests.toArray() };
    };
  };

  public type AudioClip = { user : Principal; data : Blob; timestamp : Time.Time };
  let roomAudioClips = Map.empty<Nat, List.List<AudioClip>>();

  public shared ({ caller }) func recordAudioClip(roomId : Nat, data : Blob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record audio clips");
    };
    switch (roomMicHolders.get(roomId)) {
      case (?holder) {
        if (holder != ?caller) {
          Runtime.trap("Unauthorized: You must have the mic to record audio clips");
        };
        let clip : AudioClip = { user = caller; data; timestamp = Time.now() };
        let clips = switch (roomAudioClips.get(roomId)) {
          case (?existing) { existing };
          case (null) { List.empty<AudioClip>() };
        };
        clips.add(clip);
        roomAudioClips.add(roomId, clips);
      };
      case (null) {
        Runtime.trap("Unauthorized: You must have the mic to record audio clips");
      };
    };
  };

  public query ({ caller }) func getAudioClips(roomId : Nat) : async [AudioClip] {
    // Public - anyone can view audio clips in the room
    switch (roomAudioClips.get(roomId)) {
      case (null) { [] };
      case (?clips) { clips.toArray() };
    };
  };

  ///////////////////////
  // Virtual Gifting   //
  ///////////////////////

  public type GiftItem = {
    id : Nat;
    name : Text;
    icon : Text;
    cost : Nat;
  };

  let giftCatalog = [
    { id = 1; name = "Rose"; icon = "🌹"; cost = 10 },
    { id = 2; name = "Diamond"; icon = "💎"; cost = 50 },
  ];

  public type GiftTransaction = {
    sender : Principal;
    recipient : Principal;
    giftId : Nat;
    timestamp : Time.Time;
  };

  let giftTransactions = Map.empty<Principal, List.List<GiftTransaction>>();
  let userBalances = Map.empty<Principal, Nat>();

  public query ({ caller }) func getGiftCatalog() : async [GiftItem] {
    // Public - anyone can view gift catalog
    giftCatalog;
  };

  public query ({ caller }) func getBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their balance");
    };
    switch (userBalances.get(caller)) {
      case (null) { 0 };
      case (?balance) { balance };
    };
  };

  public shared ({ caller }) func sendGift(recipient : Principal, giftId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send gifts");
    };
    let gift = giftCatalog.find(func(g) { g.id == giftId });
    switch (gift) {
      case (?g) {
        let balance = switch (userBalances.get(caller)) {
          case (null) { 0 };
          case (?balance) { balance };
        };
        if (balance < g.cost) {
          Runtime.trap("Insufficient balance");
        };

        let transaction = {
          sender = caller;
          recipient;
          giftId;
          timestamp = Time.now();
        };

        let senderTx = switch (giftTransactions.get(caller)) {
          case (?transactions) { transactions };
          case (null) { List.empty<GiftTransaction>() };
        };
        senderTx.add(transaction);
        giftTransactions.add(caller, senderTx);

        let recipientTx = switch (giftTransactions.get(recipient)) {
          case (?transactions) { transactions };
          case (null) { List.empty<GiftTransaction>() };
        };
        recipientTx.add(transaction);
        giftTransactions.add(recipient, recipientTx);

        userBalances.add(caller, balance - g.cost);
      };
      case (null) { Runtime.trap("Invalid gift") };
    };
  };

  public query ({ caller }) func getGiftHistory(user : Principal) : async [GiftTransaction] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own gift history");
    };
    switch (giftTransactions.get(user)) {
      case (null) { [] };
      case (?transactions) { transactions.toArray() };
    };
  };

  public shared ({ caller }) func addBalance(amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add balance");
    };
    let balance = switch (userBalances.get(caller)) {
      case (null) { 0 };
      case (?balance) { balance };
    };
    userBalances.add(caller, balance + amount);
  };

  ///////////////////////
  // Follow System     //
  ///////////////////////

  public type FollowerCount = {
    followers : Nat;
    following : Nat;
  };

  let followerRelationships = Map.empty<Principal, Set.Set<Principal>>();

  public shared ({ caller }) func follow(followee : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };
    if (followee == caller) {
      Runtime.trap("Cannot follow yourself");
    };
    let existing = switch (followerRelationships.get(caller)) {
      case (?f) { f };
      case (null) { Set.empty<Principal>() };
    };
    existing.add(followee);
    followerRelationships.add(caller, existing);
  };

  public shared ({ caller }) func unfollow(followee : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };
    let existing = switch (followerRelationships.get(caller)) {
      case (?f) { f };
      case (null) { Set.empty<Principal>() };
    };
    existing.remove(followee);
    followerRelationships.add(caller, existing);
  };

  public query ({ caller }) func getFollowerCount(user : Principal) : async FollowerCount {
    // Public - anyone can view follower counts
    var followers = 0;
    for ((k, v) in followerRelationships.entries()) {
      if (k != user and v.contains(user)) {
        followers += 1;
      };
    };
    let followingCount = switch (followerRelationships.get(user)) {
      case (?following) { following.size() };
      case (null) { 0 };
    };
    {
      followers;
      following = followingCount;
    };
  };

  public query ({ caller }) func isFollowing(follower : Principal, followee : Principal) : async Bool {
    // Public - anyone can check follow relationships
    switch (followerRelationships.get(follower)) {
      case (?following) { following.contains(followee) };
      case (null) { false };
    };
  };

  ///////////////////////
  // Legacy "tokens"   //
  ///////////////////////

  public shared ({ caller }) func storeZegoCredentials(secretId : Text, appId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can store server secrets");
    };
    zegoServerSecretId := ?secretId;
    zegoAppId := ?appId;
  };

  public shared ({ caller }) func generateHostToken(roomId : Nat, userId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate Host tokens");
    };
    switch (rooms.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        if (room.owner != caller) {
          Runtime.trap("Unauthorized: Only room owner can generate Host tokens for this room");
        };
        generateZegoKitTokenInternal(roomId, userId, true);
      };
    };
  };

  public shared ({ caller }) func generateAudienceToken(roomId : Nat, userId : Text) : async Text {
    // Anyone can generate Audience tokens
    // Anonymous principal is allowed
    switch (rooms.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?_room) {
        generateZegoKitTokenInternal(roomId, userId, false);
      };
    };
  };

  func generateZegoKitTokenInternal(roomId : Nat, userId : Text, isHost : Bool) : Text {
    switch (zegoAppId, zegoServerSecretId) {
      case (?appId, ?_secretId) {
        // In a real implementation, this would use HMAC-SHA256 to generate
        // a proper ZEGO token. For now, return a placeholder that includes
        // the necessary information for the frontend to work with.
        // The actual token generation would require crypto libraries.
        let roleString = if (isHost) { "host" } else {
          "audience";
        };
        let tokenPayload = "appId=" # appId # "&roomId=" # roomId.toText() # "&userId=" # userId # "&role=" # roleString;
        return tokenPayload;
      };
      case _ {
        Runtime.trap("ZEGO credentials not configured. Admin must call storeZegoCredentials first.");
      };
    };
  };

  ///////////////////////
  // Group Chats      //
  ///////////////////////

  public type Group = {
    id : Nat;
    owner : Principal;
    name : Text;
    description : ?Text;
    createdAt : Time.Time;
  };

  public type GroupMember = {
    groupId : Nat;
    user : Principal;
    joinedAt : Time.Time;
  };

  let groups = Map.empty<Nat, Group>();
  let groupMembers = Map.empty<Nat, Set.Set<Principal>>();
  let groupChats = Map.empty<Nat, List.List<ChatMessage>>();
  var nextGroupId = 1;

  public shared ({ caller }) func createGroup(name : Text, description : ?Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create groups");
    };
    let groupId = nextGroupId;
    nextGroupId += 1;

    let group : Group = {
      id = groupId;
      owner = caller;
      name;
      description;
      createdAt = Time.now();
    };
    groups.add(groupId, group);

    let initialMembers = Set.empty<Principal>();
    initialMembers.add(caller);
    groupMembers.add(groupId, initialMembers);
    groupId;
  };

  public query ({ caller }) func listGroups() : async [Group] {
    // Public - anyone can see groups
    groups.values().toArray();
  };

  public query ({ caller }) func getGroup(groupId : Nat) : async ?Group {
    // Public - anyone can see group info
    groups.get(groupId);
  };

  public shared ({ caller }) func joinGroup(groupId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join groups");
    };
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?_group) {
        let members = switch (groupMembers.get(groupId)) {
          case (?existing) { existing };
          case (null) { Set.empty<Principal>() };
        };
        switch (members.contains(caller)) {
          case (true) { Runtime.trap("Already a group member") };
          case (false) {
            members.add(caller);
            groupMembers.add(groupId, members);
          };
        };
      };
    };
  };

  public shared ({ caller }) func leaveGroup(groupId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can leave groups");
    };
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?_group) {
        let members = switch (groupMembers.get(groupId)) {
          case (?existing) { existing };
          case (null) { Set.empty<Principal>() };
        };
        switch (members.contains(caller)) {
          case (true) {
            members.remove(caller);
            groupMembers.add(groupId, members);
          };
          case (false) { Runtime.trap("Not a group member") };
        };
      };
    };
  };

  public query ({ caller }) func getGroupMembers(groupId : Nat) : async [Principal] {
    // Public - anyone can see group members
    switch (groupMembers.get(groupId)) {
      case (null) { switch (groups.get(groupId)) { case (null) { Runtime.trap("No such group") }; case (_) { Runtime.trap("No members found") } } };
      case (?members) { members.toArray() };
    };
  };

  public shared ({ caller }) func sendGroupMessage(groupId : Nat, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    switch (groups.get(groupId), groupMembers.get(groupId)) {
      case (?_group, ?members) {
        if (not members.contains(caller)) {
          Runtime.trap("Unauthorized: Not a group member");
        };
      };
      case _ { Runtime.trap("Group not found") };
    };

    let message : ChatMessage = {
      sender = caller;
      content;
      timestamp = Time.now();
    };
    let messages = switch (groupChats.get(groupId)) {
      case (?msgs) { msgs };
      case (null) { List.empty<ChatMessage>() };
    };
    messages.add(message);
    groupChats.add(groupId, messages);
  };

  public query ({ caller }) func getGroupMessages(groupId : Nat) : async [ChatMessage] {
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("No such group") };
      case (_group) {
        switch (groupChats.get(groupId)) {
          case (null) { [] };
          case (?msgs) { msgs.toArray() };
        };
      };
    };
  };

  public query ({ caller }) func isGroupMember(groupId : Nat, user : Principal) : async Bool {
    // Public - anyone can check group membership
    switch (groupMembers.get(groupId)) {
      case (?members) { members.contains(user) };
      case (null) { false };
    };
  };
};
