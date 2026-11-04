import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "abstract-factory",
  task: "ReportService picks its storage and queue classes with if/else on the cloud name, and a copy-paste slip already gives GCP an AWS queue. Refactor it into the Abstract Factory pattern so each cloud's parts always come as a matching set.",
  goals: [
    "Storage and Queue interfaces (ABCs in Python, traits in Scala) that the concrete classes implement",
    "A CloudFactory interface with one creation method per product: storage and queue",
    "AwsFactory and GcpFactory, each making only its own cloud's storage and queue",
    "ReportService receives a CloudFactory and never names a concrete class",
    "No if/else on the cloud name left in ReportService"
  ],
  hints: [
    "List the products that must always match (storage and queue), then the families (AWS and GCP).",
    "Write a factory interface with one method per product, and one factory class per cloud that implements all of them.",
    "Give ReportService a CloudFactory through its constructor and get the storage and queue by calling create_storage() and create_queue() (createStorage() and createQueue() in Scala) on it."
  ]
};

export default exercise;
