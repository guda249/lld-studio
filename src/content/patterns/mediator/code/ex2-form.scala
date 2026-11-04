trait FormMediator:
  def changed(widget: Widget): Unit

class Widget(val name: String, form: FormMediator): // colleague base: tells the form when it changes
  var enabled: Boolean = true
  def changed(): Unit = form.changed(this)

class TextField(label: String, m: FormMediator) extends Widget(label, m):
  var value: String = ""
  def typeIn(text: String): Unit =
    value = text
    changed()

class Checkbox(label: String, m: FormMediator) extends Widget(label, m):
  var checked: Boolean = false
  def toggle(): Unit =
    checked = !checked
    changed()

class Button(label: String, m: FormMediator) extends Widget(label, m):
  def click(): Unit =
    println(s"  $name: ${if enabled then "submitted!" else "disabled, nothing happens"}")

def onOff(flag: Boolean): String = if flag then "on" else "off"

class SignupForm extends FormMediator: // concrete mediator: all the "if this changes, update that" rules
  val name = TextField("name", this)
  val business = Checkbox("business account", this)
  val gstin = TextField("GSTIN", this)
  val submit = Button("submit", this)
  applyRules()

  private def applyRules(): Unit =
    gstin.enabled = business.checked
    val gstOk = !business.checked || gstin.value.length == 15
    submit.enabled = name.value.nonEmpty && gstOk

  def changed(widget: Widget): Unit =
    if !business.checked && (widget eq business) then gstin.value = "" // unticking clears the hidden field
    applyRules()
    println(s"${widget.name} changed -> GSTIN ${onOff(gstin.enabled)}, submit ${onOff(submit.enabled)}")

@main def formDemo(): Unit =
  val form = SignupForm()
  form.submit.click()
  form.name.typeIn("Asha Traders")
  form.business.toggle()
  form.submit.click()
  form.gstin.typeIn("29ABCDE1234F1Z5")
  form.submit.click()
