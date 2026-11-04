from abc import ABC, abstractmethod

Schema = dict[str, list[str]]


def describe(schema: Schema) -> str:
    if not schema:
        return "(empty)"
    return ", ".join(f"{table}({', '.join(cols)})" for table, cols in schema.items())


class Migration(ABC):
    version = "000"

    @abstractmethod
    def up(self, schema: Schema) -> None: ...

    @abstractmethod
    def down(self, schema: Schema) -> None: ...


class CreateUsers(Migration):
    version = "001_create_users"

    def up(self, schema: Schema) -> None:
        schema["users"] = ["id", "name"]

    def down(self, schema: Schema) -> None:
        del schema["users"]


class AddPhoneToUsers(Migration):
    version = "002_add_phone"

    def up(self, schema: Schema) -> None:
        schema["users"].append("phone")

    def down(self, schema: Schema) -> None:
        schema["users"].remove("phone")


class CreateOrders(Migration):
    version = "003_create_orders"

    def up(self, schema: Schema) -> None:
        schema["orders"] = ["id", "user_id", "total"]

    def down(self, schema: Schema) -> None:
        del schema["orders"]


class Migrator:  # invoker: applies commands and rolls them back in reverse order
    def __init__(self, schema: Schema) -> None:
        self.schema = schema
        self._applied: list[Migration] = []

    def migrate(self, migrations: list[Migration]) -> None:
        done = {m.version for m in self._applied}
        for m in migrations:
            if m.version not in done:
                m.up(self.schema)
                self._applied.append(m)
                print(f"up   {m.version}  -> {describe(self.schema)}")

    def rollback(self, steps: int) -> None:
        for _ in range(steps):
            if not self._applied:
                print("nothing to roll back")
                return
            last = self._applied.pop()
            last.down(self.schema)
            print(f"down {last.version}  -> {describe(self.schema)}")


all_migrations: list[Migration] = [CreateUsers(), AddPhoneToUsers(), CreateOrders()]
migrator = Migrator({})
migrator.migrate(all_migrations)
migrator.rollback(2)
migrator.migrate(all_migrations)  # only the rolled-back ones run again
