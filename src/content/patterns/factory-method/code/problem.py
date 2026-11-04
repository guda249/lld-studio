class EmailMessage:
    def deliver(self, text: str) -> str:
        return f"Email: {text}"


class SmsMessage:
    def deliver(self, text: str) -> str:
        return f"SMS: {text[:160]}"


class OrderNotifier:
    def send(self, channel: str, text: str) -> str:
        # creation logic is tangled with the sending logic
        if channel == "email":
            message = EmailMessage()
        elif channel == "sms":
            message = SmsMessage()
        else:
            # every new channel (push, WhatsApp...) means editing this method
            raise ValueError(f"unknown channel: {channel}")
        return message.deliver(text)


notifier = OrderNotifier()
print(notifier.send("email", "Your order has shipped"))
print(notifier.send("sms", "Your order has shipped"))
try:
    notifier.send("push", "Your order has shipped")
except ValueError as error:
    print(f"Failed: {error}")
