// form: true → ElementInternals. Bileşen <form> içinde gerçek bir form alanı gibi davranır.
const Rating = define(tag("x-rating"), {
  form: true,
  props: { value: prop.number(0), max: prop.number(5) },
  setup(props, ctx) {
    const { internals } = ctx
    effect(() => internals.setFormValue(props.value() ? String(props.value()) : null))
    effect(() =>
      props.value() === 0 ? internals.setValidity({ valueMissing: true }, "Bir puan seçin") : internals.setValidity({})
    )
    ctx.onFormReset(() => props.value.set(0))
    return html`${() =>
      Array.from(
        { length: props.max() },
        (_, i) => html`<button
          type="button"
          class="star"
          aria-label=${`${i + 1} yıldız`}
          aria-pressed=${() => String(i < props.value())}
          @click=${() => props.value.set(i + 1)}
        >★</button>`
      )}`
  },
})

const form = document.createElement("form")
const rating = new Rating()
rating.setAttribute("name", "puan")
form.append(rating)
output.append(form)

render(
  html`<div class="row">
    <bz-button size="sm" variant="primary" @click=${() =>
      log("geçerli mi:", form.checkValidity(), "· FormData:", JSON.stringify(Object.fromEntries(new FormData(form))))}>
      Formu kontrol et
    </bz-button>
    <bz-button size="sm" @click=${() => form.reset()}>form.reset()</bz-button>
  </div>`,
  form
)
