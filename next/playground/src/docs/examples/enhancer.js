// setup bir şey döndürmezse bileşen "enhancer" olur:
// çocuklarına dokunmaz, host'a rol, durum ve davranış ekler (bz-button ve bz-list böyle).
const CopyChip = define(tag("x-copy"), {
  props: { text: prop.string() },
  setup(props, ctx) {
    const { host } = ctx
    const copied = signal(false)
    host.setAttribute("role", "button")
    host.tabIndex = 0
    effect(() => host.toggleAttribute("data-copied", copied()))

    const copy = async () => {
      const value = props.text() || host.textContent.trim()
      try {
        await navigator.clipboard.writeText(value)
      } catch {
        /* izin yoksa sadece görsel geri bildirim */
      }
      copied.set(true)
      log("kopyalandı:", value)
      setTimeout(() => copied.set(false), 1200)
    }
    ctx.on(host, "click", copy)
    ctx.on(host, "keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), copy()))
  },
})

const chip = new CopyChip()
chip.className = "copy-chip"
chip.text = "npm install bazlama"
chip.textContent = "📋 npm install bazlama"
output.append(chip)
log("Çocuklar (metin) olduğu gibi kaldı; bileşen sadece davranış ekledi. Tıklayın veya Tab + Enter.")
