from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class LabResult:
    test: str
    value: float
    unit: str
    abnormal: bool


class LabResultSource(Protocol):  # target: what the doctor's dashboard reads
    def results_for(self, patient_id: str) -> list[LabResult]: ...


class OldLabSystem:  # adaptee: a 20-year-old analyser that exports one long string
    def fetch_report(self, mrn: int) -> str:
        return "HB|11.2|g/dL|L~GLU|98|mg/dL|N~WBC|12.6|10^3/uL|H"


class OldLabAdapter:  # matches LabResultSource by shape (duck typing), no base class needed
    def __init__(self, system: OldLabSystem) -> None:
        self._system = system

    def results_for(self, patient_id: str) -> list[LabResult]:
        mrn = int(patient_id.removeprefix("PT-"))  # our ID format -> theirs
        results = []
        for segment in self._system.fetch_report(mrn).split("~"):
            parts = segment.split("|")
            results.append(LabResult(parts[0], float(parts[1]), parts[2], parts[3] != "N"))
        return results


def print_summary(source: LabResultSource, patient_id: str) -> None:
    results = source.results_for(patient_id)
    print(f"Results for {patient_id}")
    for r in results:
        mark = "  <- check" if r.abnormal else ""
        print(f"  {r.test:<4}{r.value:6.1f} {r.unit}{mark}")
    print(f"{sum(r.abnormal for r in results)} of {len(results)} results need a doctor's review")


print_summary(OldLabAdapter(OldLabSystem()), "PT-1042")
