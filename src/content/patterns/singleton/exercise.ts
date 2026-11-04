import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "singleton",
  task: "Every service creates its own AppConfig, so the config file is read again and the services end up with different settings. Refactor AppConfig into a Singleton so the settings are loaded once and every caller gets the same object.",
  goals: [
    "There is exactly one AppConfig: in Python a class-level _instance returned by __new__, in Scala an object",
    "Nobody can make a second instance (no stray AppConfig() calls that bypass the access point)",
    "The settings are loaded once, not on every call (in Python, no __init__ that reruns the setup)",
    "Creating the instance is safe when two threads ask at the same time (Python: a lock)",
    "Optional: pass the one instance into the services instead of letting each one fetch the global"
  ],
  hints: [
    "Ask yourself: who should decide how many AppConfig objects exist? Not the callers.",
    "Python: store the instance in a class attribute and return it from __new__. Scala: a language feature already gives you exactly one instance.",
    "Python: _instance = None and _lock = threading.Lock() on the class; in __new__, if cls._instance is None, take the lock, check again, create it with super().__new__(cls), load the settings, then return cls._instance. Scala: replace class AppConfig and its companion with a single object AppConfig."
  ]
};

export default exercise;
