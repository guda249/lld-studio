from abc import ABC, abstractmethod


class Dialect(ABC):
    @abstractmethod
    def placeholder(self, position: int) -> str: ...

    @abstractmethod
    def quote(self, name: str) -> str: ...


class Connection(ABC):
    @abstractmethod
    def execute(self, sql: str, params: list[str]) -> str: ...


class SqliteDialect(Dialect):
    def placeholder(self, position: int) -> str:
        return "?"

    def quote(self, name: str) -> str:
        return f'"{name}"'


class SqliteConnection(Connection):
    def execute(self, sql: str, params: list[str]) -> str:
        return f"[sqlite] {sql} [{', '.join(params)}]"


class MySqlDialect(Dialect):
    def placeholder(self, position: int) -> str:
        return "%s"

    def quote(self, name: str) -> str:
        return f"`{name}`"


class MySqlConnection(Connection):
    def execute(self, sql: str, params: list[str]) -> str:
        return f"[mysql] {sql} [{', '.join(params)}]"


class DatabaseFactory(ABC):
    @abstractmethod
    def create_dialect(self) -> Dialect: ...

    @abstractmethod
    def create_connection(self) -> Connection: ...


class SqliteFactory(DatabaseFactory):
    def create_dialect(self) -> Dialect:
        return SqliteDialect()

    def create_connection(self) -> Connection:
        return SqliteConnection()


class MySqlFactory(DatabaseFactory):
    def create_dialect(self) -> Dialect:
        return MySqlDialect()

    def create_connection(self) -> Connection:
        return MySqlConnection()


# one shared instance per family: factories hold no state
SQLITE, MYSQL = SqliteFactory(), MySqlFactory()


class UserRepository:
    def __init__(self, db: DatabaseFactory) -> None:
        self.dialect = db.create_dialect()
        self.conn = db.create_connection()

    def find_by_city(self, city: str) -> str:
        d = self.dialect
        sql = f"SELECT * FROM {d.quote('users')} WHERE {d.quote('city')} = {d.placeholder(1)}"
        return self.conn.execute(sql, [city])


print(UserRepository(SQLITE).find_by_city("Kochi"))  # local tests
print(UserRepository(MYSQL).find_by_city("Kochi"))   # production
