STRUCTURE = ["Class", "Object", "Package", "Component",
             "Composite structure", "Deployment", "Profile"]
BEHAVIOUR = ["Use case", "Activity", "State machine", "Sequence",
             "Communication", "Timing", "Interaction overview"]
LLD_FIVE = {"Class", "Sequence", "State machine", "Activity", "Use case"}

others = [d for d in STRUCTURE + BEHAVIOUR if d not in LLD_FIVE]
print(len(STRUCTURE + BEHAVIOUR), "diagram types")   # 14 diagram types
print(len(others), "you will rarely draw:", ", ".join(others))
