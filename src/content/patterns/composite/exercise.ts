import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "composite",
  task: "Every function checks whether an item is a File or a Folder, and a new item type like Shortcut breaks all of them. Refactor it into the Composite pattern so files and folders answer the same methods and a folder just asks its children.",
  goals: [
    "One component type (an ABC in Python, a trait or abstract class in Scala) that declares the shared operations, such as size",
    "A leaf (File) that implements them by doing the real work",
    "A composite (Folder) that implements them too and keeps its children typed as the component",
    "The folder's operations combine its children's answers (recursion), with no isinstance / type match",
    "A way to add children (an add method or a constructor parameter)"
  ],
  hints: [
    "What question do you ask of both a file and a folder? Make it a method on a shared base type.",
    "File answers it directly. Folder keeps a list of the base type, so it can hold files and other folders.",
    "Folder.size returns the sum of child.size() for every child; then total_size and count_files are no longer needed."
  ]
};

export default exercise;
