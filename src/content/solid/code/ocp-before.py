# Before: every new channel means opening this class and adding another branch.


class NotificationService:
    def send(self, channel: str, user: str, text: str) -> str:
        if channel == "email":
            return f"email to {user}@shop.example: {text}"
        elif channel == "sms":
            return f"sms to {user}: {text[:160]}"  # SMS has a length limit
        elif channel == "push":
            return f"push to {user}'s phone: {text[:60]}"
        else:
            raise ValueError(f"unknown channel {channel}")


if __name__ == "__main__":
    service = NotificationService()
    for channel in ["email", "sms", "push"]:
        print(service.send(channel, "asha", "Your order has shipped"))
    try:
        service.send("whatsapp", "asha", "Hi")  # the new request: not supported yet
    except ValueError as e:
        print("error:", e)
