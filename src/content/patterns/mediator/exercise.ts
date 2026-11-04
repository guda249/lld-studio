import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "mediator",
  task: "Every User keeps a link to every other User and re-checks the muting rule itself, so each new user means more links and the rule lives everywhere. Refactor it into the Mediator pattern so users talk only through a chat room that owns the rules.",
  goals: [
    "A mediator interface (an ABC in Python, a trait in Scala) with a send method",
    "A chat room class that implements it, keeps the users and decides who receives each message",
    "Each User holds one link to the mediator, typed as the interface, and no links to other users",
    "User.say sends through the mediator; the room calls receive on the right users",
    "The muting rule lives only in the room"
  ],
  hints: [
    "Ask: who should know about everyone? Not each user. Give that job to one new class.",
    "Write a ChatMediator interface with send(sender, text), and a ChatRoom that implements it and keeps the users in a dict or map.",
    "Replace User.contacts with a room field. User.say calls room.send(...), and ChatRoom.send loops over the members, checks muting, and calls member.receive(...)."
  ]
};

export default exercise;
