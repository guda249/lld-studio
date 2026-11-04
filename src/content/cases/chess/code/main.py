from abc import ABC, abstractmethod
from enum import Enum

Square = tuple[int, int]  # (file 0-7 = a-h, rank 0-7 = 1-8)


def parse(name: str) -> Square:
    return ord(name[0]) - ord("a"), int(name[1]) - 1


def sign(n: int) -> int:
    return (n > 0) - (n < 0)


class Color(Enum):
    WHITE = "white"
    BLACK = "black"

    def opponent(self) -> "Color":
        return Color.BLACK if self is Color.WHITE else Color.WHITE


class Status(Enum):
    ACTIVE = "active"
    CHECK = "check"
    RESIGNED = "resigned"
    DRAW = "draw"


class Piece(ABC):
    """Template Method: can_move runs the checks every piece shares, then asks the subclass about its shape."""
    letter = "?"

    def __init__(self, color: Color) -> None:
        self.color = color

    def can_move(self, board: "Board", src: Square, dst: Square) -> bool:
        if src == dst or not board.inside(dst):
            return False
        target = board.at(dst)
        if target is not None and target.color is self.color:
            return False  # never capture your own piece
        dx, dy = dst[0] - src[0], dst[1] - src[1]
        return self._shape_ok(board, src, dst, dx, dy, target is not None)

    @abstractmethod
    def _shape_ok(self, board: "Board", src: Square, dst: Square, dx: int, dy: int, capture: bool) -> bool: ...

    def symbol(self) -> str:
        return self.letter if self.color is Color.WHITE else self.letter.lower()


class King(Piece):
    letter = "K"

    def _shape_ok(self, board: "Board", src: Square, dst: Square, dx: int, dy: int, capture: bool) -> bool:
        return max(abs(dx), abs(dy)) == 1


class Knight(Piece):
    letter = "N"

    def _shape_ok(self, board: "Board", src: Square, dst: Square, dx: int, dy: int, capture: bool) -> bool:
        return {abs(dx), abs(dy)} == {1, 2}  # jumps, so nothing can block it


class Rook(Piece):
    letter = "R"

    def _shape_ok(self, board: "Board", src: Square, dst: Square, dx: int, dy: int, capture: bool) -> bool:
        return (dx == 0 or dy == 0) and board.path_clear(src, dst)


class Bishop(Piece):
    letter = "B"

    def _shape_ok(self, board: "Board", src: Square, dst: Square, dx: int, dy: int, capture: bool) -> bool:
        return abs(dx) == abs(dy) and board.path_clear(src, dst)


class Queen(Piece):
    letter = "Q"

    def _shape_ok(self, board: "Board", src: Square, dst: Square, dx: int, dy: int, capture: bool) -> bool:
        return (dx == 0 or dy == 0 or abs(dx) == abs(dy)) and board.path_clear(src, dst)


class Pawn(Piece):
    letter = "P"

    def _shape_ok(self, board: "Board", src: Square, dst: Square, dx: int, dy: int, capture: bool) -> bool:
        step = 1 if self.color is Color.WHITE else -1
        if capture:
            return abs(dx) == 1 and dy == step  # pawns capture diagonally only
        if dx != 0:
            return False
        start_rank = 1 if self.color is Color.WHITE else 6
        return dy == step or (dy == 2 * step and src[1] == start_rank and board.path_clear(src, dst))


class Board:
    def __init__(self) -> None:
        self._grid: dict[Square, Piece] = {}

    def place_standard(self) -> None:
        back = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook]
        for file, kind in enumerate(back):
            self._grid[(file, 0)], self._grid[(file, 7)] = kind(Color.WHITE), kind(Color.BLACK)
            self._grid[(file, 1)], self._grid[(file, 6)] = Pawn(Color.WHITE), Pawn(Color.BLACK)

    def inside(self, sq: Square) -> bool:
        return 0 <= sq[0] < 8 and 0 <= sq[1] < 8

    def at(self, sq: Square) -> Piece | None:
        return self._grid.get(sq)

    def put(self, sq: Square, piece: Piece | None) -> None:
        if piece is None:
            self._grid.pop(sq, None)
        else:
            self._grid[sq] = piece

    def path_clear(self, src: Square, dst: Square) -> bool:
        """Every square strictly between src and dst (straight or diagonal) is empty."""
        sx, sy = sign(dst[0] - src[0]), sign(dst[1] - src[1])
        x, y = src[0] + sx, src[1] + sy
        while (x, y) != dst:
            if (x, y) in self._grid:
                return False
            x, y = x + sx, y + sy
        return True

    def in_check(self, color: Color) -> bool:
        king = next(sq for sq, p in self._grid.items() if isinstance(p, King) and p.color is color)
        return any(p.color is not color and p.can_move(self, sq, king) for sq, p in list(self._grid.items()))

    def show(self) -> str:
        rows = []
        for rank in range(7, -1, -1):
            cells = ""
            for file in range(8):
                piece = self.at((file, rank))
                cells += piece.symbol() if piece else "."
            rows.append(f"  {rank + 1} {cells}")
        return "\n".join(rows + ["    abcdefgh"])


class Move:
    """Command: knows how to apply itself to a board and how to take itself back."""

    def __init__(self, src: Square, dst: Square, piece: Piece) -> None:
        self.src = src
        self.dst = dst
        self.piece = piece
        self.captured: Piece | None = None

    def execute(self, board: Board) -> None:
        self.captured = board.at(self.dst)
        board.put(self.dst, self.piece)
        board.put(self.src, None)

    def undo(self, board: Board) -> None:
        board.put(self.src, self.piece)
        board.put(self.dst, self.captured)


class Game:
    def __init__(self) -> None:
        self.board = Board()
        self.board.place_standard()
        self.turn: Color = Color.WHITE
        self.status: Status = Status.ACTIVE
        self._history: list[Move] = []

    def move(self, src_name: str, dst_name: str) -> str:
        if self.status in (Status.RESIGNED, Status.DRAW):
            return "rejected: the game is over"
        src, dst = parse(src_name), parse(dst_name)
        piece = self.board.at(src)
        if piece is None:
            return f"rejected: no piece on {src_name}"
        if piece.color is not self.turn:
            return f"rejected: it is {self.turn.value}'s turn"
        if not piece.can_move(self.board, src, dst):
            return f"rejected: a {type(piece).__name__} can't go {src_name}-{dst_name}"
        move = Move(src, dst, piece)
        move.execute(self.board)
        if self.board.in_check(self.turn):  # try it, look, take it back: Command makes this cheap
            move.undo(self.board)
            return "rejected: that leaves your king in check"
        self._history.append(move)
        self._next_turn()
        took = f" takes {type(move.captured).__name__}" if move.captured else ""
        return f"{type(piece).__name__} {src_name}-{dst_name}{took} [{self.status.value}]"

    def undo(self) -> None:
        if self._history and self.status is not Status.RESIGNED:
            self._history.pop().undo(self.board)
            self._next_turn()

    def resign(self) -> str:
        self.status = Status.RESIGNED
        return f"{self.turn.value} resigns, {self.turn.opponent().value} wins [{self.status.value}]"

    def _next_turn(self) -> None:
        self.turn = self.turn.opponent()
        self.status = Status.CHECK if self.board.in_check(self.turn) else Status.ACTIVE


if __name__ == "__main__":
    game = Game()
    script = [("e2", "e4"), ("e7", "e5"), ("a2", "a3"), ("UNDO", ""), ("d7", "d5"), ("e4", "e5"),
              ("f1", "c4"), ("b8", "c6"), ("d1", "h5"), ("g8", "f6"), ("h5", "f7"), ("e8", "e7"), ("e8", "f7")]
    for src, dst in script:
        if src == "UNDO":
            game.undo()
            print(f"undo        -> back to {game.turn.value} to move")
        else:
            print(f"{game.turn.value:<5} {src}-{dst} -> {game.move(src, dst)}")
    print(game.resign())
    print(game.move("a7", "a6"))
    print(game.board.show())
