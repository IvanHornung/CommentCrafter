from enum import Enum

class Status(Enum):
    LOADING = "LOADING"
    PRELIM_SUCCESS = "PRELIM_SUCCESS"
    COMPLETE_SUCCESS = "COMPLETE_SUCCESS"
    COMPLETE_FAIL = "COMPLETE_FAIL"
    RECEIVED_REQUEST = "RECEIVED_REQUEST"


def print_error(input: str) -> None:
    print(f"\033[1;31mError:{input}\033[0m")

def print_info(input: str) -> None:
    print(f"\033[1;34m\033[1mInfo: {input}\033[0m")