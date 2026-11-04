from abc import ABC, abstractmethod


class Button(ABC):
    @abstractmethod
    def render(self, label: str) -> str: ...


class Card(ABC):
    @abstractmethod
    def render(self, body: str) -> str: ...


class LightButton(Button):
    def render(self, label: str) -> str:
        return f"[ {label} ] (black text on white)"


class LightCard(Card):
    def render(self, body: str) -> str:
        return f"| {body} | (white card, grey border)"


class DarkButton(Button):
    def render(self, label: str) -> str:
        return f"[ {label} ] (white text on charcoal)"


class DarkCard(Card):
    def render(self, body: str) -> str:
        return f"| {body} | (charcoal card, no border)"


class ThemeFactory(ABC):
    @abstractmethod
    def create_button(self) -> Button: ...

    @abstractmethod
    def create_card(self) -> Card: ...


class LightTheme(ThemeFactory):
    def create_button(self) -> Button:
        return LightButton()

    def create_card(self) -> Card:
        return LightCard()


class DarkTheme(ThemeFactory):
    def create_button(self) -> Button:
        return DarkButton()

    def create_card(self) -> Card:
        return DarkCard()


class OrderScreen:
    def __init__(self, theme: ThemeFactory) -> None:
        self.card = theme.create_card()
        self.button = theme.create_button()

    def draw(self, order_id: str) -> str:
        return self.card.render(f"Order {order_id} is out for delivery") + "\n" + self.button.render("Track")


user_prefers_dark = {"asha": False, "ravi": True}
for user, dark in user_prefers_dark.items():
    theme: ThemeFactory = DarkTheme() if dark else LightTheme()
    print(f"{user}:\n{OrderScreen(theme).draw('A-42')}")
