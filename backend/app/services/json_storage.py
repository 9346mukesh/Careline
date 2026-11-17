import json
from pathlib import Path
from threading import RLock

DATA_DIR = Path(__file__).resolve().parents[2] / "data"

DOCTORS_FILE = DATA_DIR / "doctors.json"
APPOINTMENTS_FILE = DATA_DIR / "appointments.json"

_storage_lock = RLock()


def read_json(file_path: Path):
    with _storage_lock:
        with open(file_path, "r", encoding="utf-8") as file:
            return json.load(file)


def write_json(file_path: Path, data: dict):
    with _storage_lock:
        temporary_file = file_path.with_suffix(".tmp")

        with open(temporary_file, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=4)

        temporary_file.replace(file_path)


def get_doctors():
    return read_json(DOCTORS_FILE)


def get_appointments():
    return read_json(APPOINTMENTS_FILE)


def save_appointments(data: dict):
    write_json(APPOINTMENTS_FILE, data)