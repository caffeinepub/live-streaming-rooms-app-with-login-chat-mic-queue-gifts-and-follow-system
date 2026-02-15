import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

module {
  type OldRoom = {
    id : Nat;
    owner : Principal;
    title : Text;
    description : ?Text;
    streamUrl : Text;
    createdAt : Time.Time;
  };

  type OldActor = {
    rooms : Map.Map<Nat, OldRoom>;
  };

  type NewRoom = {
    id : Nat;
    owner : Principal;
    title : Text;
    description : ?Text;
    createdAt : Time.Time;
  };

  type NewActor = {
    rooms : Map.Map<Nat, NewRoom>;
  };

  public func run(old : OldActor) : NewActor {
    let newRooms = old.rooms.map<Nat, OldRoom, NewRoom>(
      func(_id, oldRoom) {
        {
          id = oldRoom.id;
          owner = oldRoom.owner;
          title = oldRoom.title;
          description = oldRoom.description;
          createdAt = oldRoom.createdAt;
        };
      }
    );
    { rooms = newRooms };
  };
};
