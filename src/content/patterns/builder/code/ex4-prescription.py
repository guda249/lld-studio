from dataclasses import dataclass


@dataclass(frozen=True)
class Medicine:
    name: str
    dose_mg: int
    times_a_day: int


@dataclass(frozen=True)
class Prescription:
    patient: str
    doctor_reg_no: str
    medicines: tuple[Medicine, ...]


MAX_DAILY_MG = {"paracetamol": 4000, "ibuprofen": 2400}


class PrescriptionBuilder:
    def __init__(self, patient: str) -> None:
        self._patient = patient
        self._doctor = ""
        self._medicines: list[Medicine] = []

    def signed_by(self, reg_no: str) -> "PrescriptionBuilder":
        self._doctor = reg_no
        return self

    def add(self, name: str, dose_mg: int, times_a_day: int) -> "PrescriptionBuilder":
        self._medicines.append(Medicine(name, dose_mg, times_a_day))
        return self

    def build(self) -> Prescription:
        # collect every problem, so the doctor fixes them all in one go
        errors: list[str] = []
        if not self._doctor:
            errors.append("doctor registration number missing")
        if not self._medicines:
            errors.append("no medicines added")
        for m in self._medicines:
            limit = MAX_DAILY_MG.get(m.name)
            if limit is not None and m.dose_mg * m.times_a_day > limit:
                errors.append(f"{m.name}: {m.dose_mg * m.times_a_day} mg/day is over {limit}")
        if errors:
            raise ValueError("; ".join(errors))
        return Prescription(self._patient, self._doctor, tuple(self._medicines))


rx = PrescriptionBuilder("R. Iyer").signed_by("KMC-20431").add("paracetamol", 500, 3).add("cetirizine", 10, 1).build()
print(f"{rx.patient} ({rx.doctor_reg_no}): " + ", ".join(f"{m.name} {m.dose_mg}mg x{m.times_a_day}" for m in rx.medicines))

try:
    PrescriptionBuilder("S. Khan").add("paracetamol", 1000, 6).add("ibuprofen", 800, 4).build()
except ValueError as error:
    print(f"Rejected: {error}")
