# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from dataclasses import dataclass


@allow_storage
@dataclass
class Record:
    url: str
    claim: str
    status: str
    check_count: u32


class WitnessMin(gl.Contract):
    next_id: u256
    records: TreeMap[u256, Record]

    def __init__(self):
        self.next_id = u256(0)

    @gl.public.view
    def count(self) -> int:
        return int(self.next_id)
