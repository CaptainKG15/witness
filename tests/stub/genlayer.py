# Minimal local stand-in so the contract file can be imported for off-chain logic tests.
class _Public:
    @staticmethod
    def view(f): return f
    @staticmethod
    def write(f): return f
class _Gl:
    class Contract: pass
    public = _Public()
gl = _Gl()
class Address: pass
class TreeMap:
    def __class_getitem__(cls, item): return dict
u256 = int
u32 = int
def allow_storage(c): return c
